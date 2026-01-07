Backbone.History.prototype.navigate = _.wrap(Backbone.History.prototype.navigate, function(){
    // Get arguments as an array
    var args = _.toArray(arguments);
    // firs argument is the original function
    var original = args.shift();
    // Set the before event
    Backbone.history.trigger('before:url-change', args);
    // Call original function
    var res = original.apply(this, args);
    // After event
    Backbone.history.trigger('url-changed');
    // Return original result
    return res;
});

App.Models = {};

App.Models.ApiModel = Backbone.Model.extend({
    defaults: {
        'id': '',
        'session': false,
    },
    params: {}

});

_.extend(App.Models.ApiModel.prototype, {
    path: function() { return this.get("id"); },
    url: function() {
        return App.Settings.Api.url + this.path() + '?' + $.param(this.params);
    },
    // override backbone synch to force a jsonp call
    sync: function(method, model, options) {

        // Default JSON-request options.
        // passing options.url will override
        // the default construction of the url in Backbone.sync
        var data = (typeof(options) === "undefined") ? {} : options.data;

        var session = this.get("session");
        if (!session || typeof session.attributes === "undefined") session = app.session;
        var sessionParams= session.getParams(data);

        var type="GET";
        var dataType = "jsonp";
        var jsonp = "jsoncallback";
        switch (method) {
            case "update":
            type="POST";
            jsonp = false;
            options=sessionParams;
            options.dataType=false;
            break;
        }

        if (undefined === model || model === false) model = this;

        _.extend(this.params, sessionParams.data);

        var params = _.extend({
            type: type,
            dataType: dataType,
            url: model.url(),
            jsonp: jsonp, // the api requires the jsonp callback name to be this exact name
            processData: true
        }, options);

        // Make the request.
        return $.ajax(params);
    },

});

App.Models.Product = App.Models.ApiModel.extend({
    type: 'film'
});
App.Models.Subscription = App.Models.Product.extend({
    type: 'subscription'
});

App.Models.Banner = Backbone.Model.extend({

});
App.Models.CookieModel = Backbone.Model.extend({
        idAttribute: 'name',
        defaults: {
            days: 2
        },

        destroy: function () {
            this.set({
                value: "",
                days: -1
            }).save();

            $.removeCookie(this.get("name"), App.Settings.Cookies.cookie_options);
        },

        validate: function (attrs) {
            if(!attrs.name) {
                return "Cookie needs name";
            }
        },

        get: function (name) {
            if(name === 'value') {
                var value = this.attributes[name];
                if(value[0] === '"') {
                    value = value.slice(1, value.length - 1);
                }
                return decodeURIComponent(value);
            } else {
                return this.attributes[name];
            }
        },

        save: function () {
            var pieces = [];
            var value = this.get('value');
            if(value.match(/[^\w\d]/)) {
                value = '"'.concat(encodeURIComponent(value), '"');
            }
            pieces.push(this.get('name').concat("=", value));
            if (this.get('days')) {
                var date = new Date();
                date.setTime(date.getTime()+(this.get('days')*24*60*60*1000));
                pieces.push("expires".concat('=',date.toGMTString()));
            }
            if (this.get('path')) {
                pieces.push("path".concat('=', this.get('path')));
            }
            if (this.get('domain')) {
                pieces.push("domain".concat('=', this.get('domain')));
            }
            if (this.get('secure')) {
                pieces.push("secure");
            }
            $log("Saving cookie :"+pieces.join('; '));
            document.cookie = pieces.join('; ');
        }
    });


App.Models.Film = App.Models.Product.extend({

    type: 'film',
    path: function() { return 'details/'; },

});

App.Models.Event = App.Models.Product.extend({
    type: 'event',
    path: function() { return 'event/details/' },

});
_.extend(App.Models.Event.prototype,  {
    path: function() { return "event/details/" + this.get("id"); },
});

_.extend(App.Models.Film.prototype,  {
    path: function() { return "details/" + this.get("id"); },

    /**
     *  Retrieve Rotten tomatoe review's for the mobie
     *  @param int id
     *
     */
    fetchRT: function(id) {
        var imdb_id;
        if (id) imdb_id = id;
        else imdb_id = this.get("imdb_id");

        if (undefined === imdb_id || imdb_id === "") return false;
        this.set("rt_ratings","");
        this.set("rt_links","");

        var url = '/proxy.php?url=http://api.rottentomatoes.com/api/public/v1.0/movie_alias.json?apikey='+App.Settings.rt_api_key+'&type=imdb&id='+imdb_id.replace("tt","");

        var _this = this;

        $.ajax({
            url: url,
            async: true,
            dataType: "jsonp",
            success: function(res) {
                _this.set("rt_links", res.links);
                if (typeof(res.ratings) !== "undefined" && (res.ratings.critics_score > 0 || res.ratings.audience_score > 0) )
                _this.set("rt_ratings", res.ratings);

            }
        });
        return true;
    },
 });


