    /**
     *
     *  App Engine
     *
     *  author: Jani Luukkanen
     *  janiluuk@gmail.com
     *
     */
    App.Utils = {};
    App.Views = {
        FB: {}
    };
    App.Films = {};
    App.Player = {};
    App.User = {};
    App.Event = {};
    App.MediaPlayer = {}
    App.ContentPages = {
        'gdpr': 'Isikuandmete töötlemine',
        'termsandconditions': 'Kasutus- ,müügi- ja ostutingimused',
        'watchfilmsfromtv': 'Filmi vaatamine läbi teleri',
        'faq': 'Korduma kippuvad küsimused'
    };
    App.Router = Backbone.Router.extend({
        views: {},
        models: {},
        routes: {
            '': 'root',
            'search': 'homePage',
            'notfound': 'notFound',
            'search/:searchStateHash': 'search',
            'film/:id': 'showFilm',
            'films/:id': 'showFilm',
            'films/:id/watch/:code': 'playFilm',
            'event/:id': 'showEvent',
            'events/:id': 'showEvent',
            'me': 'me',
            'return': 'purchaseReturn',
            'return/:id': 'purchaseReturn',
            'purchaseSuccess/:id': 'purchaseSuccess',
            'error/:type': 'showErrorPage',
            'recovery/:key/:email': 'showRecoveryPage',
            'contact': 'showContactPage',
            'me/my-films': 'filmcollection',
            'me/pair-device': 'pairdevice',
            'subscription-plans': 'subscription',
            'revoke': 'revoke',
            'page/:id': 'showContentPage',
            '*notFound': 'notFound'
        },
        initialize: function(options) {
            options = options ||  {};
            this.options = options;
            this.on('route', this.onRoute, this);
            this.on('change:title', this.onChangeTitle, this);
            this.on('action', this.onAction, this);
            Backbone.history.bind('before:url-change', this.onUrlChange);
            _.bindAll(this, 'showContentPage', 'onUrlChange');
        },
        onAction: function(category, action, label) {
            if (!category || !action) {
                return false;
            }
            if (App.Settings.google_analytics_enabled) {
                if (!label) label = action;
                
                ga('send', {
                    hitType: 'event',
                    eventCategory: category,
                    eventAction: action,
                    eventLabel: label
                });
            }
        },
        onUrlChange: function() {
            this.trigger("page:change");
         //   app.sidemenu.closeSideBar();
        },
        onRoute: function(route, params) {
            this.trigger("page:change", route, params);
            app.sidemenu.closeSideBar();
            this.currentPage = route;
        },
        onChangeTitle: function(title) {
            $(document).attr('title', title + ' - ' + App.Settings.sitename);
            App.Settings.page_change_callback(title, window.location.hash);
            if (App.Settings.google_analytics_enabled) {
                ga('set', 'page', window.location.hash);
                ga('send', 'pageview', {
                    'page': this.currentPage,
                    'title': title,
                });
            }
        },
        purchaseReturn: function() {
            var films = app.user.checkPurchases();
            var _this = this;
            var _latestTicket = false;
            var _latestItem = false;
            if (films) {

                _.each(films, function(item) {

                    $log("[COOKIE] New film cookie prepared: " + JSON.stringify(item));
                    item.id = item.vod_id;
                    var ticket = new App.User.Ticket(item, {
                        parse: true
                    });
/**                    $log("[COOKIE] Ticket generated out of cookie: " + JSON.stringify(ticket));**/
                    _latestTicket = ticket;
                    _latestItem = item;

                    app.usercollection.add(ticket);
                    ticket.save();
                });
                if (!_latestTicket) return false;

                if (!_this.returnview) {
                    _this.returnview = new App.Views.PostPurchaseDialogView({
                        model: _latestTicket,
                        session: app.sessiom,
                        ticket: _latestItem,
                    });
                } else _this.returnview.model.set(_latestTicket.toJSON());
                _this.returnview.render();
                return false;
            }
            this.navigate('/', {
                trigger: true
            });
            return false;
        },
        root: function() {
            if (!app.collection.querystate.isDefault()) {
                app.collection.querystate.setDefault();
            }
            this.search();
            this.navigate('/');
        },
        search: function(searchStateHash) {
            var currentPage = this.currentPage;
            if (!app.collection.querystate.isDefault()) app.collection.querystate.setQueryString();
            if (currentPage != "homePage" && currentPage != "search" && currentPage != "root") {
                app.showBrowserPage();
            }
            this.trigger("change:title", "Search results");
        },
        playFilm: function(id, code) {
            var film = new App.Models.Film({
                id: id,
            });
            var _this = this;
            film.fetch().done(function() {
                var purchase = new App.Models.Purchase({
                    model: film,
                    session: app.session
                });
                purchase.sendCodeAuth(purchase.onCodeAuth, film.get("id"), code);
                purchase.on('purchase:successful', function() {
                    _this.showFilm(film.get("id"), true);
                }, this);
            });
        },
        showEvent: function(id, autoplay) {

            var event = new App.Models.Event({
                id: id
            });
            var _this = this;
            event.fetch().done(function() {

                if (!app.eventview) {
                    app.eventview = new App.Views.EventDetailView({
                        model: event
                    });
                } else {
                    $log("Loading movie info to page");
                    app.eventview.model.set(event.toJSON());
                }
                app.eventview.render();
                var url = event.get("seo_friendly_url");
                _this.navigate(url, {
                    trigger: false
                });
                app.showEventPage();
                _this.trigger("change:title", event.get("title"));
                if (autoplay === true) app.eventview.playEvent();
            });
        },
        showFilm: function(id, autoplay) {
            var films = app.user.checkPurchases();
            /*
             *  Check if user has purchases, navigate to confirmation page if so.
             */
            if (films) {
                this.navigate("/return", {
                    trigger: true
                });
                return false;
            }
            var film = new App.Models.Film({
                id: id
            });
            var _this = this;
            film.fetch().done(function() {
                var playButtonText = tr("Watch film") + " " + film.get("price") + ")";
                if (app.user.hasProduct(film)) {
                    playButtonText = tr("Continue watching");
                }
                film.set("playButton", playButtonText);
                if (!app.movieview) {
                    app.movieview = new App.Views.MovieDetailView({
                        model: film
                    });
                } else {
                    $log("Loading movie info to page");
                    app.movieview.model.set(film.toJSON());
                }
                app.movieview.render();
                var url = film.get("seo_friendly_url");
                _this.navigate(url, {
                    trigger: false
                });
                app.showMoviePage();
                _this.trigger("change:title", film.get("title"));
                if (autoplay === true) app.movieview.playMovie();
            });
        },
        purchaseSuccess: function(id) {
            var title = app.usercollection.get(id);
            if (!title) {
                this.navigate('search', {
                    trigger: true,
                    replace: true
                });
                return false;
            }
            if (!this.returnview) this.returnview = new App.Views.PostPurchaseDialogView({
                model: title,
                session: app.user.session
            });
            else this.returnview.model.set(title.toJSON());
            return false;
        },
        homePage: function() {
            var currentPage = this.currentPage;
            if (currentPage != "homePage" && currentPage != "search" && currentPage != "root") {
                app.showBrowserPage();
            }
            if (currentPage == "showFilm") {
                app.collection.querystate.setQueryString();
            }
            this.trigger("change:title", "Home");
        },
        me: function() {
            if (!this.views.profile) this.views.profile = new App.Views.ProfileView({
                swiperEl: '#profile-tabbar-swiper-container',
                model: app.session.get("profile"),
                swipeTo: 0
            });
            else {
                this.views.profile.model.set(app.session.get("profile").toJSON());
                this.views.profile.options.swipeTo = 0;
            }
            this.views.profile.render();
            app.showContentPage("me");
            this.trigger("change:title", "My profile");
        },
        subscription: function() {
            if (!this.views.subscriptionview) this.views.subscriptionview = new App.Views.SubscriptionView({
                subscriptions: app.options.subscriptions
            });
            this.views.subscriptionview.render();
            app.showContentPage("subscription", "Subscription information");
        },
        filmcollection: function() {
            this.views.profile = new App.Views.ProfileView({
                swiperEl: '#profile-tabbar-swiper-container',
                model: app.session.get("profile"),
                swipeTo: 1
            });
            this.views.profile.render();
            app.showContentPage("myfilms", "My films");
        },
        pairdevice: function() {
            var profile = app.session.get("profile");
            if (!this.views.pairview) {
                this.views.pairview = new App.Views.UserPairView({
                    model: profile,
                    el: "#contentpage"
                });
                $('#contentpage').empty();
                this.views.pairview.render();
            }
            app.showContentPage("pairtv", "Pair Device");
        },

        notFound: function() {
           this.showErrorPage('404', tr('Not Found'), tr('This page is no longer available'));
        },

        showErrorPage: function(type, subject, description) {
            this.views.errorview = new App.Views.Error({
                type: type,
                subject: subject,
                description: description
            });
            this.views.errorview.render();
            app.showContentPage("error", "Error!");
        },
        showRecoveryPage: function(key, email) {
            this.views.recoveryview = new App.Views.RecoveryView({
                key: key,
                email: email
            });
            this.views.recoveryview.render();
            app.showContentPage("recovery", "Recovery form");
        },
        showContactPage: function() {
            if (typeof(L) === "undefined") {
                $('<link/>', {
                    rel: 'stylesheet',
                    href: '//unpkg.com/leaflet@1.6.0/dist/leaflet.css'
                }).appendTo('head');
                $("<script />", {
                    src: '//unpkg.com/leaflet@1.6.0/dist/leaflet.js',
                    type: 'text/javascript'
                }).appendTo('head');
            }
            this.views.contactview = new App.Views.ContactView();
            this.views.contactview.render();
            this.views.contactview.$el.fadeIn();
            app.showContentPage("contact", "Contact Us!");
            app.router.init_map();
        },
        init_map: function() {
            if (typeof(L) === "undefined") {
                setTimeout(function() {
                    this.init_map();
                }.bind(this), 760);
                return false;
            }
            var mymap = L.map('map_canvas').setView([59.431327835282154, 24.74103927612305], 13);
            L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
                maxZoom: 18,
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' + '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                id: 'mapbox/streets-v11',
                tileSize: 512,
                zoomOffset: -1
            }).addTo(mymap);
            var marker = L.marker([59.43795770000001, 24.75549920000003]).addTo(mymap);
            marker.bindPopup("<b>Vificom OÜ</b><br>Roseni 5, Tallinn").openPopup();
        },
        showContentPage: function(template, title) {
            if (!template) {
                throw new Error("Invalid template");
            }
            var name = template.split("-").join("");
            if (_.isEmpty(title)) {
                title = _.find(App.ContentPages, function(title, idx) {
                    return idx == name
                });
            }
            this.trigger("change:title", title);
            this.views.contentview = new App.Views.ContentView({
                title: title,
                template: name + "Template"
            });
            this.views.contentview.$el.hide();
            this.views.contentview.render().transitionIn(function() {
                app.showContentPage(name);
            });
        }
    });