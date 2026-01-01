App.Collections = {};
// Create a new collection using one of Backbone.Paginator's
// pagers. We're going to begin using the requestPager first.
App.Collections.FilmCollection = Backbone.Collection.extend({
    model: App.Models.Film,
    parse: function(resp, options) {
        var self = this;
        return _.map(resp, function(obj) {
            return new self.model(obj.film, options);
        });
    }
});

App.Collections.EventCollection = Backbone.Collection.extend({
    params: {},
    path: function() {
        return 'events/';
    },
    url: function() {

        if (app.session) {
            var sessionParams = app.session.getParams();
            _.extend(this.params, sessionParams.data);

        }
        return App.Settings.Api.url + this.path() + '?' + $.param(this.params);
    },
    model: App.Models.Event,
    parse: function(resp, options) {
        var self = this;
        return _.map(resp.events, function(obj) {
            return new self.model(obj.event, options);
        });
    }
});

App.Collections.BannerCollection = Backbone.Collection.extend({
    model: App.Models.Banner
});
/* User collection for playlist items */
App.Collections.FilmSessionCollection = Backbone.Collection.extend({
    localStorage: new Backbone.LocalStorage("FilmSession"),
    model: App.User.FilmSession
});
/* User collection for playlist items */
App.Collections.PaginatedCollection = Backbone.PageableCollection.extend({
    baseUrl: App.Settings.Api.url + 'search/',
    url: App.Settings.Api.url + "search?api_key=" + App.Settings.Api.key + "&",
    // Enable infinite paging
    mode: "infinite",
    // As usual, let's specify the model to be used
    // with this collection
    initialize: function(models, options) {
        this.querystate = options.querystate;
        this.initial_search = options.search;
        this.options = options;
        this.originalCollection = options.collection;
        // Whenever the state is changed,
        // update the collection records
        // to match the state
        this.querystate.bind('change', this.update, this);
        if (options.pagination) {
            this.pagination = options.pagination;
        }
    },
    state: App.Settings.Search.state,
    queryParams: App.Settings.Search.default_query_params,
    update: function() {
        _.extend(this.queryParams, this.querystate.attributes);
        if (this.querystate.isEmpty() && this.originalCollection) {
            this.fullCollection.reset(this.originalCollection.toJSON());
        } else this.fetch({
            reset: true,
            url: this.url,
            dataType: 'jsonp'
        });
    },
    parse: function(resp, options) {
        var self = this;
        return _.map(resp.results, function(obj) {

            return new self.model(obj.film, options);
        });
    },
    featured: function() {
        var items = this.fullCollection.filter(function(data) {
            return data.get("featured") == 1
        });
        return items;
    },
    purchased: function() {
        var items = this.filter(function(data) {
            return data.get("ticket");
        });
        return new App.Films.UserCollection(items);
    },
    sortByAttribute: function(attribute, desc) {
        this.setSorting(attribute, desc ? 1 : -1, {
            full: true
        });
        /*
            var asc_comparator = function (model) {

                model.get(attribute);
            }
    */
        this.querystate.set("sort", attribute);
        //
        //            this.fullCollection.comparator = desc ? this.reverseSortBy(asc_comparator) : asc_comparator;
        //            this.fullCollection.sort();
        return true;
    },
    reverseSortBy: function(sortByFunction) {
        return function(left, right) {
            var l = sortByFunction(left);
            var r = sortByFunction(right);
            if (l === void 0) return -1;
            if (r === void 0) return 1;
            return l < r ? 1 : l > r ? -1 : 0;
        };
    }
});
App.Films.GenreCollection = Backbone.Collection.extend({
    url: '',
    baseUrl: '',
    initialize: function(models, options) {},
    update: function() {
        this.url = this.baseUrl + '&api_key=' + App.Settings.Api.key + '&jsoncallback=?';
    },
    parse: function(response) {
        return response.objects;
    }
});
App.Collections.SortCollection = Backbone.Collection.extend({});
App.Collections.FilterCollection = Backbone.Collection.extend({});
App.Collections.UserCollection = Backbone.Collection.extend({
    localStorage: new Backbone.LocalStorage("ticket"),
    model: App.User.Ticket,
    initialize: function(models, options) {
        if (options && undefined !== options.session) {
            this.session = options.session;
        }
        _.bindAll(this, 'updateUserCollection', 'parseModels', 'reset', 'hasTicket', 'clearAll');
        var _this = this;
        this.on("add", this.updateUserCollection);
        this.on("reset", this.updateUserCollection);
        this.on("fetch", this.parseModels, this);
    },
    hasTicket: function(ticket) {
        if (!ticket) return false;

        var id = ticket.vod_id;

        var item = this.get(id);
        if (item && item.isValid())
        return true;

    },
    parseModels: function() {

        var _this = this;
        var refresh = false;
        this.models.forEach(function(ticket) {
            if (typeof ticket === "undefined") {
                $log("[COLLECTION] Got INVALID ticket");
                return;
            }
            if (!ticket.isValid()) {
                $log("[COLLECTION] Invalid model, deleting " + ticket.get("id"));
                ticket.destroy();
                refresh = true;
            }
        });

        var deferred = new $.Deferred();

        if (refresh) {
            this.reset();
            this.fetch().done(function() {
                deferred.resolve(app.usercollection);
            } );
        } else {
            deferred.resolve(app.usercollection);
        }

        return deferred;

    },

    clearAll: function() {
        $log("[COLLECTION] Deleting all entries");
        this.localStorage._clear();
        this.reset();
    },

    clearInvalid: function() {
        _.chain(this.models).clone().each(function(model){
            if (model.isValid() === false) {
                $log("[COLLECTION] Removing "+model.get("id")+ " from user library as invalid");
                model.destroy();
            }
        });
    },

    updateUserCollection: function(model) {
        $log("[COLLECTION] Collection update");
    }
});
App.Collections.SubscriptionCollection = Backbone.Collection.extend({});
App.Collections.PaymentmethodCollection = Backbone.Collection.extend({});
App.Collections.CookieCollection = Backbone.Collection.extend({
    model: App.Models.CookieModel,
    initialize: function() {
        this._readCookies();
        this.on('add', function(model) {
            model.save();
        });
        _.bindAll(this, 'fetch', '_readCookies');

    },
    findByName: function(name) {
        var cookie = this.findWhere({
            'name': name
        });
        if (undefined !== cookie) {
            return cookie;
        }
        return false;
    },
    create: function(name) {
        var cookie = new App.Models.CookieModel({name: name});
        return cookie;
    },
    deleteByName: function(name) {

        var cookie = this.findWhere({
            'name': name
        });

        if (undefined !== cookie) {
            cookie.destroy();
            cookie.clear();
            $log("Destroyed cookie '" + name + "'");
            return true;
        }
        return false;
    },
    remove: function(models) {
        Backbone.Collection.prototype.remove.apply(this, arguments);
        models = _.isArray(models) ? models.slice() : [models];
        var i, l;
        for (i = 0, l = models.length; i < l; i++) {
            models[i].destroy();
        }
    },
    _readCookies: function() {
        var cookies = document.cookie.split('; ');
        var cookieObjects = {};
        for (var i = 0, l = cookies.length; i < l; i++) {
            if (cookies[i].match(/^\n+$/)) {
                continue;
            }
            var cookie = cookies[i].split(/^([^=]+)=(.*$)/);
            cookie = [
                cookie[1],
                cookie[2]
            ];
            if (!cookie[1]) {
                continue;
            }
            cookieObjects[cookie[0]] = {
                name: cookie[0],
                value: decodeURIComponent(cookie[1])
            };
        }
        var that = this;
        this.each(function(existingModel) {
            if (typeof(cookieObjects[existingModel]) === "undefined") {
                existingModel.destroy();
                that.remove(existingModel);
            }
        })
        _.each(cookieObjects, function(potentialModel) {
            if (this.get(potentialModel.name)) {
                this.get(potentialModel.name).set(potentialModel);
            } else {
                this.add(potentialModel);
            }
        }, this);
    },
    fetch: function() {
        this._readCookies();
    }
});