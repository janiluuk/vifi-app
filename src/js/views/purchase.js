App.Views.MobilePurchase = Backbone.View.extend({

    model: App.Models.MobilePurchase,
    events: {
        'click #mobile-payment-start-btn' : 'initPayment',
        'click #mobile-payment-try-again' : 'initPayment'
    },
    initialize: function(options) {

        this.model = options.model;
        this.listenTo(this.model, "purchase:mobile:success", this.onPaymentSuccess, this);
        this.listenTo(this.model, "purchase:mobile:error", this.onPaymentError, this);
        this.listenTo(this.model, "purchase:mobile:timeout", this.onPaymentError, this);
        this.listenTo(this.model, "purchase:mobile:done", this.onPaymentDone, this);
        this.listenTo(this.model, "purchase:mobile:start", this.onPaymentStart, this);
        this.listenTo(this.model, 'change:timeout', this.renderTimeout, this);
        this.listenTo(this.model, 'change:phoneNumber', this.renderPhoneNumber, this);

        _.bindAll(this, 'renderPendingView', 'initPayment', 'renderTimeout', 'render', 'onPaymentDone', 'onPaymentError', 'onPaymentSuccess');

    },

    initPayment: function(e) {
        e.preventDefault();
        app.router.trigger("action","payment", "init", "Payment started for mobile purchase");
        this.$("button").addClass("loading");
        this.model.initPayment();
        return false;
    },

    renderPendingView: function(model) {

        if (!model) model = this.model;
        var body = ich.mobilePaymentPendingTemplate(model.toJSON());
        this.$el.empty().append(body);
        return this;
    },

    renderPhoneNumber: function() {
        var phonenumber = this.model.get("phoneNumber");
        $("#mobilePhoneNumber").html("<strong><a href=\"tel:"+phonenumber+"\">" +phonenumber + "</a></strong>");
        return this;
    },

    renderTimeout: function() {
        $("#mobileTimeout").html(this.model.get("timeout"));
        return this;
    },

    renderFailure: function() {
        this.$el.html(ich.mobilePaymentFailureTemplate(this.model.toJSON()));
        return this;
    },
    renderSuccess: function() {
        this.$el.html(ich.mobilePaymentSuccessTemplate(this.model.toJSON()));
        return this;
    },
    renderProcessing: function() {
        this.$el.html(ich.mobilePaymentProcessingTemplate(this.model.toJSON()));
        return this;
    },

    onPaymentStart: function() {
        this.renderPendingView(this.model);
        return false;
    },

    onPaymentError:function() {
        this.renderFailure();
        return false;
    },
    onPaymentSuccess: function() {
        this.renderProcessing();
        return false;
    },
    onPaymentDone: function() {
        this.renderSuccess();
        return false;
    },
    render: function() {
        this.$el.html(ich.mobilePaymentTemplate(this.model.toJSON()));
        return this;
    }
});

App.Views.PurchaseView = App.Views.DialogView.extend({
    model: App.Models.Film,
    template: '<div id="modalcontent"><div id="loginmodal"/><div id="purchasemodal"/></div>',
    events: {
        'click .mfp-close': 'close'
    },
    initialize: function(options) {
        _.bindAll(this, 'afterClose', 'render');
        options = options || {};
        this.model = options.model;
        this.session = options.session;

        if (!this.paymentView) {
            this.paymentView = new App.Views.PaymentDialog({
                model: options.model,
                session: options.session,
            });

        } else {
            this.paymentView.set({model: options.model, session:options.session});
        }
        this.listenTo(this.paymentView, 'remove', this.close, this);

        if (!this.session.isLoggedIn() || App.Settings.loginEnabled == false) {
            this.listenTo(
                this.session,
                "user:login:success",
                this.showPayment,
                this
            );
            this.loginView = new App.Views.LoginDialog({
                session: this.session
            });
            this.listenTo(this.loginView, "login:continue", this.showPayment, this);

        }
        this.listenTo(this.paymentView.payment, "purchase:ticket:received", function(ticket) {  this.session.trigger("ticket:purchase",ticket);  }.bind(this), this);

        this.render();
    },
    showLogin: function() {
        $(".vifi-popup").hide();
        $("#login-popup").show();
    },
    showPayment: function() {
        $(".vifi-popup").hide();
        $("#film-popup").show();
        App.Utils.lazyload();
    },
    render: function() {
        this.$el.html(this.template).appendTo("body");
        this.openDialog();

        this.setElement(".mfp-content");
        this.assign(this.paymentView, "#purchasemodal");


        if (this.session.isLoggedIn() || !App.Settings.loginEnabled) {
            this.showPayment();
        }
        else {
            this.assign(this.loginView, "#loginmodal");
            this.showLogin();
        }
        return this;
    },
    onClose: function(e) {
        if (this.loginView) {
            this.loginView.close();
        }
        this.paymentView.close();
        $.magnificPopup.close();

        return false;
    }
});

App.Views.PaymentDialog = Backbone.View.extend({
    events: {
        'click .mfp-close': 'close',
        'click button#confirm-purchase-button': 'initPayment',
        'click #payment-list li': 'selectMethod',
        'submit #single-purchase': 'initPayment'
    },
    initialize: function(options) {
        options = options || {};
        this.session = options.session;
        this.model = options.model;
        this.model.set('payments', app.paymentmethods.toJSON());

        if (this.payment) {
            this.payment.mobilepayment.resetPayment();
        }

        this.payment = new App.Models.Purchase({model:options.model, session:options.session});
        this.mobilePaymentView = new App.Views.MobilePurchase({model: this.payment.mobilepayment});

        this.listenTo(this.model, "change", this.onModelChange, this);
        this.listenTo(this.payment, "purchase:successful", this.onPaymentSuccess, this);

        this.listenTo(this.payment, "purchase:error", this.onPaymentError, this);

        this.listenTo(this.payment, "purchase:verify:error", this.onPaymentError, this);
        this.listenTo(this.payment, "purchase:verify:successful", this.onVerifySuccess, this);


        Backbone.Validation.configure({
            forceUpdate: true
        });
        Backbone.Validation.bind(this, {
            model: this.payment
        });
    },
    onModelChange: function() {
        console.log("YAAAAA");
        this.payment.set({model: this.model, session: this.session});

    },
    selectMethod: function(e) {
        e.preventDefault();
        var el = $(e.currentTarget);
        el.addClass("selected").siblings().removeClass("selected");
        this.payment.set("method", el.attr("id"));
        var method = _.first(app.paymentmethods.filter(function(item) {
            return item.get("identifier") == el.attr("id");
        }));

        if (method && typeof(method.get) !== "undefined") {
            this.setSelectedMethod(method.get("identifier"));
            this.payment.set("method_id", method.get("id"));
            this.updateUI();
        }
    },
    getSelectedMethod: function() {
        var paymentMethod = this.payment.get("method");
        if (undefined !== $.cookie("vifi_payment_method")) {
            paymentMethod = $.cookie("vifi_payment_method");
        }
        return paymentMethod;
    },
    setSelectedMethod: function(method) {
        $.cookie("vifi_payment_method", method);
    },
    getEmail: function() {
        var email = this.session.get("profile").get("email");
        if (email != App.Settings.anonymous_username) {
            return email;
        }
        return false;
    },
    updateUI: function() {

        var email = this.getEmail();
        if (email) {
            $("#payment-method-email").val(email);
        }
        // Payment method
        var method = this.payment.get("method");
        $(".payment-method-data").hide();
        $("#" + method).addClass("selected");
        $("#method").val(method);
        if (method == "code") {
            $("#payment-method-terms").hide();
            $("#payment-code").show();
            $("#confirm-purchase-button").show();

        } else if (method == "mobile") {
            $("#payment-email").hide();
            $("#payment-method-terms").hide();
            $("#payment-mobile").show();
            $("#confirm-purchase-button").hide();
        } else {
            $("#payment-email").show();
            $("#confirm-purchase-button").show();
            $("#payment-method-terms").show();
        }
    },
    initPayment: function(e) {
        if (e) e.preventDefault();
        var method = this.payment.get("method");

        if (method == "code") {
            $("#payment-method-email").val('');
        }
        var data = this.$("form").serializeObject();
        this.payment.set(data);
        if (this.payment.isValid(true)) {
            this.payment.purchase(this.model);
            this.$("#confirm-purchase-button").addClass("loading");
        }
        app.router.trigger("action","payment", "start", "Payment started with "+this.payment.get("method")+ " for "+ this.model.get("title"));

        return false;
    },
    onVerifySuccess: function() {
        this.$("#confirm-purchase-button").removeClass("loading");
    },
    onPaymentSuccess: function() {

        app.router.trigger("action","payment", "success", "Payment successful with "+this.payment.get("method")+ " for "+ this.model.get("title"));

        this.$("#confirm-purchase-button").removeClass("loading");
        this.remove();
        app.scrollToTop();
        var ticket = app.usercollection.get(this.model.get("id"));

        if (ticket && ticket.get("type") == 'film') {
            app.movieview.playMovie();
        }
    },
    onPaymentError: function(message) {

        message = tr(message);
        app.router.trigger("action","payment", "error", "Payment unsuccesful with "+this.payment.get("method")+ " for "+ this.model.get("title")+", "+message);

        this.$("#confirm-purchase-button").removeClass("loading");
        Backbone.Validation.callbacks.invalid(this, 'code', message);
        app.trigger("error", message);

    },

    remove: function() {
        // Remove the validation binding
        Backbone.Validation.unbind(this);
        this.trigger("remove");
        $.magnificPopup.close();
        this.mobilePaymentView.model.resetPayment();
        this.mobilePaymentView.remove();
        return Backbone.View.prototype.remove.apply(this, arguments);
    },
    render: function() {
        if (this.model.type !== 'film') {
            this.model.set("isMovie", false);
        } else {
            this.model.set("isMovie", true);
        }
        
        this.$el.html(ich.purchaseDialogTemplate(this.model.toJSON()));
        if (!this.mobilePaymentView) {
                setTimeout(function() {
                    this.render();
        }.bind(this), 200);

        } else {
                this.mobilePaymentView.setElement("#payment-mobile");
                this.mobilePaymentView.render();
        }
        var method = this.getSelectedMethod();
        $("#"+method).click();
        App.Utils.lazyload();
        return this;
    },
});

App.Views.PostPurchaseDialogView = App.Views.DialogView.extend({
    model: App.User.Ticket,
    mustConfirm: true,
    isConfirmed: false,
    template: '<div id="modalcontent"><div id="post-purchase-modal"/></div>',
    events: {
        'click .mfp-close': 'close',
    },
    initialize: function(options) {
        _.bindAll(this, 'afterClose', 'render');
        options = options || {};
        this.session = options.session;
        this.model = options.model;
        this.ticket = options.ticket;

        this.listenTo(this.model, 'change', this.render, this);
       // this.listenTo(this.session, 'change', this.render, this);

        if (this.view) this.view.remove();
        this.view = new App.Views.PurchaseSuccessDialog({
            session: this.session,
            parent: this
        });
    },

    render: function() {

        this.$el.empty().append(this.template).appendTo("body");
        this.openDialog();
        this.setElement(".mfp-content");
        this.assign(this.view, "#post-purchase-modal");
       this.view.render();
        return this;
    },
    afterClose: function(e) {
        this.view.close();
        return false;
    }

});
App.Views.PurchaseSuccessDialog = Backbone.View.extend({
    events: {
        'click .mfp-close': 'close',
        'click .continue-button': 'onContinue'
    },
    initialize: function(options) {
        options = options || {};
        this.parent = options.parent;
        this.session = options.session;
    },
    onContinue: function(e) {
        this.parent.isConfirmed = true;

        e.preventDefault();

        var id = this.parent.model.get("id");
        app.user.purchases.clearNewPurchases();
        app.router.trigger("action","payment", "success", "Payment successful for title "+this.parent.model.get("id")+ " for "+app.user.get("email") ? app.user.get("email") : " anonymous user");
        app.router.showFilm(id, true);

        this.close();
        this.parent.close();
        return false;
    },
    render: function() {
        this.$el.html(ich.purchaseSuccessTemplate({
            email: this.parent.ticket.email,
            purchase: this.parent.model.toJSON()
        }));
        return this;
    }
});

App.Views.SubscriptionPaymentDialog = App.Views.PaymentDialog.extend({
    render: function() {
        this.model.set('payments', app.paymentmethods.toJSON());
        this.$el.html(ich.subscriptionPurchaseDialogTemplate(this.model.toJSON()));
        this.updateUI();
        return this;
    },
    onPaymentSuccess: function() {
        this.remove();
    },
});
App.Views.PurchaseSubscriptionView = App.Views.PurchaseView.extend({
    initialize: function(options) {
        options = options || {};
        this.session = options.session;
        this.paymentView = new App.Views.SubscriptionPaymentDialog({
            model: options.model,
            payment: new App.Models.PurchaseSubscription({
                model: options.model,
                session: options.session
            }),
            session: options.session,
            parent: this
        });
        this.loginView = new App.Views.LoginDialog({
            model: options.session,
            session: options.session,
            parent: this
        });
        this.render();
    }
});
App.Views.ActivateSubscription = App.Views.DialogView.extend({
    render: function() {
        this.$el.html(ich.subscriptionActivateDialogTemplate());
        this.openDialog(false, ich.subscriptionPurchaseDialogTemplate());
        return this;
    }
});
