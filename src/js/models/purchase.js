
/**
 * EMT Mobile payment
 */

App.Models.MobilePurchase = App.Models.ApiModel.extend({

    model: App.Models.Film,

    defaults: {
        pending: false,
        authToken: false,
        phoneNumber : false,
        timeout: 60,
        tickets: false,
        status: false,
        statusMessage: false
    },

    url: function() { return App.Settings.Api.url+"payment/emtpayment/"+this.model.get("id")     },

    interval: false,

    /**
     *
     * @param object options.session - User session object
     * @param object options.model - Product object
     * @param object options.parent - Purchase model object
     *
     *
     * @return {[type]} [description]
     */

    initialize: function(options) {
        this.options = options || {};
        if (options && undefined !== options.session) {
            this.session = options.session;
        }
        if (options && undefined !== options.model) {
            this.model = options.model;
        }
        if (options && undefined !== options.parent) {
            this.parent = options.parent;
        }

        _.bindAll(this, 'initPayment','onStatusReceive','handleStatus','startTimer', 'stopTimer', 'initPayment');

        this.on("change:status", this.handleStatus, this);
        this.on("purchase:mobile:done", this.stopTimer, this);
        this.on("purchase:mobile:timeout", this.onTimeout, this);

    },

    /**
     * Initialize payment
     *
     */

    initPayment: function() {

        if (this.get("pending") === true) throw ("Payment already ongoing!");
        this.sync("update").done(function(res) { this.onStatusReceive(res); }.bind(this));
    },

    /*
     * Query the status of the payment and do an callback when done.
     *
     * @param function callback - Callback with the data when done.
     */

    requestPaymentStatus: function(callback) {
        var authToken = this.get("authToken");
        if (!authToken || authToken === "") {
            throw ("No auth token available to use for status check");
        }
        app.api.call(["payment/emtpayment", this.model.get("id")], {authToken: authToken}, callback);
    },

    /*
     * Handle the status received from the status request
     *
     * PENDING - Start the timer
     * FAILED - Error on the transaction
     * PAYMENT - Acknowledged
     * DONE - Payment received
     *
     * @param object res - JSON array from the response
     *
     */

    onStatusReceive: function(res) {

        $log(res);

        if (res.status === "PENDING") {
            this.trigger("purchase:mobile:start",res);
            this.startTimer();
            this.set("authToken", res.authToken);
            this.set("phoneNumber", res.phoneNumber);
            this.set("status", res.status);

            this.requestPaymentStatus(this.onStatusReceive);
        }

        if (res.status === "fail" || res.status === "FAILED") {
               this.set("status", "FAILED");
               this.set("statusMessage", tr(res.statusMessage));
               this.handleStatus();
        }

        if (res.status === "PAYMENT") {
            this.set("status", res.status);
        }

        if (res.status === "DONE") {
            this.set("tickets", res.tickets);
            this.set("authToken", res.authToken);
            this.set("status", res.status);
        }
    },

    /*
     * Reset to default settings
     *
     */

    resetPayment: function() {
        this.stopTimer();
        this.set(this.defaults);
    },

    /**
     * Start polling
     *
     */

    startTimer: function() {
        this.resetPayment();
        this.set("pending",true);

        this.interval = setInterval(function() {
            this.handleStatus();
            var timeout = this.get("timeout");
            var status = this.get("status");

            if (this.get("pending") === false) {
                this.stopTimer();
                return false;
            }

            /** If we have already received PAYMENT or DONE messages, don't fire a timeout **/
            if (timeout > 0 && this.get("status") !== "DONE" && this.get("status") !== "PAYMENT") {
                this.set("timeout",--timeout);
            } else {

                this.trigger("purchase:mobile:timeout", "Timeout exceeded");
            }
        }.bind(this),1000);
    },

    /*
     * Timeout event
     *
     */

    onTimeout: function() {
        this.set("statusMessage", tr("Timed out"));
        this.stopTimer();
    },

    /*
     * Stop polling
     *
     */

    stopTimer: function() {
        this.set("pending",false);
        if (this.interval) {
            clearInterval(this.interval);
        }
    },

    /*
     * On status change, change the state accordingly and trigger
     * the status events to the UI
     *
     * @return boolean - true if timer was stopped.
     *
     */

    handleStatus: function() {

        var status = this.get("status");

        /* Waiting on phone call */

        if (status === "PENDING") {
            this.trigger("purchase:mobile:pending");
            return false;
        }

        /* Payment acknowledged, start polling for final DONE status */

        if (status === "PAYMENT") {
            this.trigger("purchase:mobile:success");

            this.paymentIval = setInterval(function() {
                this.requestPaymentStatus(this.onStatusReceive);
            }.bind(this),1000);

        }

        /* Error occured */

        if (status === "fail" || status === "FAILED") {
            if (this.get("statusMessage") !== "Unknown") {
            this.trigger("purchase:mobile:error", this.get("statusMessage"));
            }
        }

        /* Received acknowledgement for successful payment */

        if (status === "DONE") {

            if (this.paymentIval) clearInterval(this.paymentIval);

            /* Tickets found, add them to user */

            if (this.get("tickets")) {

                $log("Receiving tickets");
                var _this = this;
                _.forEach(this.get("tickets"), function(ticket) {
                    _this.session.trigger("ticket:purchase",ticket);
                }.bind(this));

                this.set("tickets", []);

                this.trigger("purchase:mobile:done", "Success!");

            } else {

                /* No tickets found, lets try again */

                setTimeout(function() {
                    this.requestPaymentStatus(this.onStatusReceive);
                }.bind(this),1000);
            }
        }
        this.stopTimer();
        return true;
    },
});

App.Models.Purchase = Backbone.Model.extend({
    model: App.Models.Product,
    film: false,
    session: false,
    retrying: false,
    defaults: { method: 'code',  price: "", code: '', email: '', purchaseInfo: {}, verified: false },
    productKey: '52e802db-553c-4ed2-95bc-44c10a38c199',
    validation: {
        email: {
          required:false,
          pattern: 'email',
          msg: 'Please enter a valid email!'
        },
        method: {
            required:true,
            fn: 'validateMethod'
        },
        method_id: {
            required:true,
        },
        termsconditions: {
          fn: 'validateTerms'
        },
        price: {
          required: App.Settings.Payment.allowFreeProducts !== true,
          min:  (App.Settings.Payment.allowFreeProducts === true) ? '0.00' : '0.01',
          msg: 'Invalid price for the product'
        },
        code: {
          minLength: 1,
          required: false,
          msg: 'Please enter valid code!'
        },
    },
    /* Options: session & product objects */
    initialize: function(options) {
        this.options = options || {};

        if (options && undefined !== options.session) {
            this.session = options.session;
        }
        if (options && undefined !== options.model) {
            this.model = options.model;
        }
        this.set("price", this.model.get("price"));

        if (this.mobilepayment) {
            this.mobilepayment.resetPayment();
        }
        this.mobilepayment = new App.Models.MobilePurchase({model:options.model, session:options.session, payment: this});

        this.listenTo(this.mobilepayment, 'all', function(evenName, options) {
          var type = evenName.split(/purchase:/)[1];
          if (type) {
              this.trigger(evenName, options);
          }
        }, this);

        this.listenTo(this.model, "change", function() {
            this.set("price", this.model.get("price"));

        }.bind(this), this);
        _.bindAll(this, 'purchase', 'onCodeAuth', 'verify', 'onVerifyResponse', 'sendCodeAuth', 'paymentCallback')

    },


    validateMethod: function(value, attr, computedState) {

        if(value === 'code' && this.get("code").length === 0) {
            return 'Vale kood, proovi uuesti!';
        }
        if(value !== 'code' && value !== 'mobile' && this.get("email").length === 0) {
            return 'Vale E-mail, proovi uuesti!';
        }
    },

    validateTerms: function(value, attr, computedState) {

        if(value === undefined && this.get("method") !== "code" && this.get("method") !== "mobile") {
            return 'Please accept terms and conditions';
        }
    },

    paymentCallback: function(response) {

        if (undefined !== response && response.status && response.status === "Success") {

            var profile = app.session.get("profile");
                profile.once("purchase:successful", function() {
                    this.trigger("purchase:successful");
                    $log("Billing process successfully ended");
                }.bind(this));
                profile.purchase(app.collection.fullCollection.get(this.model.get("id")));
        } else {
            $log(response);

        }
        return false;
    },

    getAnonymousToken: function(callback) {
        var email = this.get("email");
        if (!email || email === "") email = this.session.get("profile").get("email");

        this.session.once("user:login:success", callback, this);

        return this.session.getToken(email);

    },

    sendCodeAuth: function(callback, product_id,code,type) {
        app.api.call(["authorize_film", product_id, code], {product_type: type}, callback);
    },

    onCodeAuth: function(data) {

        if (data.status !== "ok") {
            var message = data.message;
            this.trigger("purchase:error", message);
            return false;
        }

        if (app.usercollection.get(data.vod_id)) {
         }else {
           app.usercollection.create(data);
        }

        this.trigger("purchase:successful", data);

    },

    verify: function(callback) {
        var info = this.generatePurchaseInfo();
        app.api.call(["payment", "verify", info.product_id], info, callback,true);
    },

    onVerifyResponse: function(data) {

        if (data.status === "ok") {
            this.retrying = false;
            this.set("verified",true);
            this.trigger("purchase:verify:successful");
            return true;
        }

        if (this.session.profile.isAnonymous() && this.retrying !== true) {
            this.retrying = true;
            this.getAnonymousToken(this.verify(this.onVerifyResponse));
        }

        var message = data.message;
        this.trigger("purchase:verify:error", message);
        this.set("verified",false);
        return false;
    },

    purchase: function() {

        if (!this.session.get("auth_id") || this.session.get("auth_id").length === 0 ) {
            this.getAnonymousToken(this.purchase);
            return false;
        }

        var verified = this.get("verified");

        if (verified === false) {
            this.once("purchase:verify:successful", this.purchase, this);
            this.verify(this.onVerifyResponse);
            return false;
        }

        var method = this.get("method");

        if (method === "code") {
            var id = this.model.get("id");
            var type = this.model.type;

            var code = this.get("code");
            this.sendCodeAuth(this.onCodeAuth, id, code, type);
            return false;
        }

        if (this.get("method_id") !== "") {
            var form = this.generatePurchaseForm();

            $("#content-container").append(form);
            form.submit();
            return false;
        } else {
            $log("Error while making purchase: invalid method selected");
            return false;
        }
    },

    generatePurchaseForm: function() {

        var info =  this.generatePurchaseInfo();

        var url = App.Settings.Api.url + "payment/payment/" + info.product_id + "?";

        var data = {
            'api_key' : App.Settings.Api.key,
            'token' : info.auth_id,
            'user_id' : info.user_id,
            'method_id' : info.method_id,
            'type' : info.product_type,
            'sum' : this.model.get("price"),
        }

        var form =  App.Utils.post(url, data);

        return form;

    },
    // Purchase info for backend

    generatePurchaseInfo: function() {
        var product_id = this.model.get("id");
        var auth_id = this.session.get("auth_id");
        var user_id = this.session.get("user_id");
        var product_type = this.model.type;

        if (!product_type) {
            product_type = 'VodTitle'
        }
        if (!auth_id || auth_id < 1)
            auth_id = this.session.get("auth_id");

        if (!product_id || product_id < 1) {
            throw ("Invalid product given for purchase");
        }

        if (!user_id || user_id < 1) {

            throw ("Invalid or missing user for purchase");
            return false;
        }

        var info = {
            'auth_id': auth_id,
            'user_id': this.session.get("user_id"),
            'email': this.get("email"),
            'method_id': this.get("method_id"),
            'method' : this.get("method"),
            'product_id': product_id,
            'product_type' : product_type
        }
        this.set("purchaseInfo", info);

        return info;
    },


    remove: function() {
        // Remove the validation binding
        Backbone.Validation.unbind(this);
        return Backbone.View.prototype.remove.apply(this, arguments);
    }
});
App.Models.PurchaseSubscription = App.Models.Purchase.extend({


    purchase: function() {

        var method = this.get("method");

        if (!this.session.get("auth_id") || this.session.get("auth_id").length ===0) {
            this.getAnonymousToken(this.purchase);
            return false;
        }

        if (method === "code") {
            var id = this.model.get("id");
            var code = this.get("code");
            this.sendCodeAuth(this.onCodeAuth, id, code);
            return false;
        }

        try {

           var info = this.generatePurchaseInfo();
           var price = this.model.get("price");
           this.sendPurchase(this.paymentCallback, info);

        } catch (e) {
            $log("Error while making purchase: " + e);
            return false;
        }
    },

    paymentCallback: function(response) {

        if (undefined !== response && response.status && response.status === "ok") {

            var profile = app.session.get("profile");
            this.trigger("purchase:successful");
            $log("Billing process successfully ended");
        }
        return false;
    },

    sendCodeAuth: function(callback, product_id,code) {
        app.api.call(["authorize_subscription_code", product_id, code], {product_type: 'subscription'}, callback);

    },

    sendPurchase: function(callback, info) {
        var id = this.model.get("id");
        app.api.call(["purchaseSubscription", id, info.auth_id], info, callback);
    },
    // Purchase info for backend

    generatePurchaseInfo: function() {
        var product_id = this.model.get("id");
        var user_id = this.session.get("user_id");
        var method = this.get("method");
        var method_id = this.get("method_id");

        if (!product_id || product_id < 1) {
            throw ("Invalid product given for purchase");
        }
        if (!user_id || user_id < 1) {
            throw ("Invalid or missing user for purchase");
            return false;
        }

        var info = {
            'auth_id': this.session.get("auth_id"),
            'user_id': user_id,
            'method_id' : method_id,
            'price' : this.get("price"),
            'product_id': product_id,
            'product_type' : 'subscription'
        }

        this.set("purchaseInfo", info);

        return info;

    },
})
