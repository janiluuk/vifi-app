$(document).ready(function() {
    // Show loading overlay when app starts
    $("#app-loading-overlay").show();
    
    // Use initCached() instead of init() for faster load with cached data
    // Requires CACHED_INIT_URL environment variable to be set
    // Falls back to init() if cached data fails to load
    // Example: initCached();
    init();
});



window.app = _.extend({}, Backbone.Events);

    // Initialization event
    app.on('app:init', function() {
        $log("Starting at "+new Date().getTime());
    });


    function initApp(data) {
        $("#content-container").addClass(App.Settings.skin);
        var deferred = new $.Deferred();

        App.Platforms.init();
        // check for hash and set state accordingly
        if (window.location.hash.indexOf('#search') !== -1) {
            // start with empty state because Router will configure it later.
            var state = new App.Utils.State();

        } else {

            var state = new App.Utils.State(data.search);

        }

        app.template = new App.Utils.TemplateLoader();
        var session = new App.User.Session();
        var profile = session.get("profile");
        var genres = new App.Films.GenreCollection(data.genres);
        var events = new App.Collections.EventCollection(data.events);
        var banners = new App.Collections.BannerCollection(data.banners);
        var subscriptions = new App.Collections.SubscriptionCollection(data.subscriptions);
        var paymentmethods = new App.Collections.PaymentmethodCollection(data.paymentmethods);
        var usercollection = new App.Collections.UserCollection([], {session:session});
        var sessioncollection = new App.Collections.FilmSessionCollection();
        var originalCollection = new App.Collections.FilmCollection(data.results, {parse:true});

        var collection = new App.Collections.PaginatedCollection(
            originalCollection.models, {
            collection: originalCollection,
            mode: "client",
            querystate: state,
            genres: genres,
            pagination: data.pagination,
            search: data.search
        });
        collection.querystate.setFromUrl();


        var player = new App.Player.MediaPlayer({session: session});
	    var periods = new App.Collections.FilterCollection([{'id': '2016-2020', 'name': '2015-2020'}, {'id': '2010-2015', 'name': '2010-2015'}, {'id': '2000-2009', 'name': '00-ndad'},{'id': '1990-2000', 'name': '90-ndad'}, {'id': '1980-1990', 'name': '80-ndad'},{'id': '1900-1980', 'name': '60-70 ndad'} ]);
	    var durations = new App.Collections.FilterCollection([{'id': '0-30', 'name': '0-30min'}, {'id': '30-60', 'name': '30-60min'}, {'id': '60', 'name': '60+min'}]);
        var sort = new App.Collections.SortCollection([{'id': 'id', 'desc':true, 'name': 'Viimati lisatud', 'default' : true}, {'id': 'title', 'name': 'A-Z'}, {'id': 'star_rating', 'name': 'Vaadatuimad'}]);
        var eventhandler = _.extend({}, Backbone.Events);

        App.Utils.include(["popup", "helper", "menu", "player", "eventplayer", "filmitem", "profile", "page"], function() {
            app.template.load(['film','event'], function () {

                window.app = new App.Views.BaseAppView({platform: App.Platforms.platform, session: session, sessioncollection: sessioncollection, profile: profile,player: player, subscriptions: subscriptions, paymentmethods: paymentmethods, template: app.template, usercollection: usercollection,  eventhandler: eventhandler, banners: banners, collection: collection, sort: sort, filters: { genres: genres, durations: durations, periods: periods}});

                // Bind ready event when everything has been loaded
                app.on('app:ready', function() {
                            $log("App ready, finished at "+new Date().getTime());
                             app.usercollection.fetch();
                             
                             // Report Web Vitals (Phase 4 performance monitoring enhancement)
                             if (App.Settings.performance_monitoring_enabled && App.Utils.Performance) {
                                 setTimeout(function() {
                                     App.Utils.Performance.reportWebVitals();
                                 }, 1000);
                             }

                }.bind(this));

                // Bind startup fail event for catching the initialization failures.

                app.on('app:fail', function() {
                    $error("Could not startup the application!" );
                }.bind(this));

                window.history = Backbone.history.start({pushState: true});
                deferred.resolve(app);

            }.bind(this));
        });
        return deferred.promise();
    }



function init() {

    app.trigger("app:init");
               initGA();
    var url = App.Settings.Api.url+"search?&short=1&limit="+App.Settings.Search.initial_film_amount+"&api_key="+App.Settings.Api.key+"&jsoncallback=?";
    $.getJSON(url, function(data) {
        $.when(initApp(data)).then(function() {
            // Hide loading overlay on successful initialization
            $("#app-loading-overlay").hide();
            app.trigger("app:ready");

            if (App.Settings.sentry_enabled === true) {
                Sentry.init({ dsn: App.Settings.sentry_dsn});
            }
            setTimeout(function() {
                initFB();
                window.scrollTo(0,1);
            },500);


        },function() {
            // Hide loading overlay and show error page on initialization failure
            $("#app-loading-overlay").hide();
            $("#app-error-page").show();
            app.trigger("app:fail"); 
        } );
    }.bind(this), "jsonp").fail(function(jqXHR, textStatus, errorThrown) {
        // Handle JSONP request failure (API connection error)
        $error("Failed to connect to API: " + textStatus);
        $("#app-loading-overlay").hide();
        $("#app-error-page").show();
        app.trigger("app:fail");
    });

}

function initCached() {
    var cachedUrl = process.env.CACHED_INIT_URL || "//www.example.com/init.json";
    
    $.ajax({
        url: cachedUrl,
        dataType: "json",
        timeout: 2000,  // 2 second timeout for cached data
        success: function(data) {
            console.log("Loaded cached init data from:", cachedUrl);
            $.when(initApp(data)).then(function() {
                // Hide loading overlay on successful initialization
                $("#app-loading-overlay").hide();
                app.trigger("app:ready");
                
                if (App.Settings.sentry_enabled === true) {
                    Sentry.init({ dsn: App.Settings.sentry_dsn});
                }
                setTimeout(function() {
                    initFB();
                    window.scrollTo(0,1);
                },500);
            }, function() {
                // Hide loading overlay and show error page on initialization failure
                $("#app-loading-overlay").hide();
                $("#app-error-page").show();
                app.trigger("app:fail");
            });
        },
        error: function(xhr, status, error) {
            console.warn("Failed to load cached init data, falling back to API:", error);
            // Fallback to regular initialization (only once, no infinite loop)
            init();
        }
    });
}


/* Facebook login */

function handleSessionResponse(response) {

    //if we dont have a session (which means the user has been logged out, redirect the user)
    if (!response.authResponse) {
        return;
    }
    //if we do have a non-null response.session, call FB.logout(),
    //the JS method will log the user out of Facebook and remove any authorization cookies
    if (typeof FB !== 'undefined') {
        FB.logout(response.authResponse);
    }
}

/** Init google analytics */
function initGA() {
    if (App.Settings.google_analytics_enabled === true) {
        (function(i, s, o, g, r, a, m) {
            i['GoogleAnalyticsObject'] = r;
            i[r] = i[r] || function() {
                (i[r].q = i[r].q || []).push(arguments);
            };
            i[r].l = 1 * new Date();
            a = s.createElement(o);
            m = s.getElementsByTagName(o)[0];
            a.async = 1;
            a.src = g;

            m.parentNode.insertBefore(a, m)
        })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
        ga('create', App.Settings.google_analytics_code, 'auto');
        ga('send', 'pageview');
    }
}

/** Init Facebook events */

function initFB() {

    window.fbAsyncInit = function () {

    FB.Event.subscribe('auth.statusChange', function (response) {
        $(document).trigger('fbStatusChange', response);
    });

    FB.init({
        appId: '169875156439063', // App ID
        channelUrl: process.env.CHANNEL_URL || '//beta.example.com/channel.html', // Channel File
        status: true, // check login status
        cookie: true, // enable cookies to allow the server to access the session
        xfbml: true, // parse XFBML
        version          : 'v4.0',
        frictionlessRequests: true,
        init: true,
        level: "info",
        signedRequest: null,
        viewMode: "website",
        autoRun: true
    });

    };
 (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "//connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));

    // Load the SDK Asynchronously
    $(document).on('fbStatusChange', function (event, data) {
        if (data.status === 'connected') {

            FB.api('/me', {fields: 'email, first_name, last_name'}, function (response) {
                app.fbuser.set(response);
                // Store the newly authenticated FB user
                app.session.profile.trigger("user:facebook-connect", app.fbuser);
            });
        } else {
            app.fbuser.set(app.fbuser.defaults); // Reset current FB user
        }
    });
    $(document).on('logout', function () {
        if (FB.getAccessToken() !== null) {
            FB.logout();
            app.fbuser.set(app.fbuser.defaults);
        }
        app.session.logout();
        return false;
    });

    $(document).on('login', function () {

        FB.login(function(response) {
        }, {scope: 'email, public_profile'});
        return false;
    });
}

/** Initialize Disqus if enabled */
function initDisqus() {
    if (!App.Settings.commentsEnabled) return false;

    window.disqus_shortname = App.Settings.disqus_shortname;

    var dso   = document.createElement("script");
    dso.type  = "text/javascript";
    dso.async = true;
    dso.src  = '//' + disqus_shortname + '.disqus.com/embed.js';
    document.getElementsByTagName('body')[0].appendChild(dso);
}

/* * * Disqus Reset Function * * */
var resetDisqus = function (newIdentifier, newUrl, newTitle, newLanguage) {

    DISQUS.reset({
        reload: true,
        config: function () {
            this.page.identifier = newIdentifier;
            this.page.url = newUrl;
            this.page.title = newTitle;
            this.language = newLanguage;
        }
    });
};

/** Workaround for "real links" to bind to the app */
$(document).on("click", "a[href^='/']", function(event) {
  var href = $(event.currentTarget).attr('href')
  var passThrough = href.indexOf('logout') >= 0;
  if (!passThrough && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
    event.preventDefault()
    url = href.replace(/^\//,'').replace('\#\!\/','');
    app.router.navigate(url, { trigger: true });
  }
    return false;
});