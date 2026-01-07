App.Views = {};
App.Views.BaseAppView = Backbone.View.extend({
    el: $("#vifi-page-container"),
    events: {
        'click .goTop': 'scrollToTop',
    },
    scrollTop: 0,
    initialize: function(options) {
        this.options = options || {};
        this.session = options.session;
        this.fbuser = new App.User.FBPerson(); // Holds the authenticated Facebook user
        this.user = options.session.get("profile");
        this.collection = options.collection;
        this.usercollection = options.usercollection;
        this.sessioncollection = options.sessioncollection;
        this.subscriptions = options.subscriptions;
        this.paymentmethods = options.paymentmethods;
        this.evt = options.eventhandler;
        this.template = options.template;
        this.player = options.player;
        options.model = this.user;
        _.bindAll(this, 'render', 'showBrowserPage', 'onResizeScreen');
        this.listenTo(this.session, "ticket:purchase:done", this.showTicketPurchase, this);
        this.api = new App.Utils.Api({
            model: this.session
        });
        this.notification = new App.Utils.Notification({
            model: this
        });
        this.notification.attach(this.session);
        this.sidemenu = new App.Views.SideMenu({
            model: this.user,
            session: this.session
        });
        this.quickmenu = new App.Views.QuickbarMenu({
            model: this.user,
            collection: this.tion
        });
        this.topmenu = new App.Views.TopMenu({
            model: this.user,
            collection: this.usercollection
        });
        this.platform = App.Platforms.platform;
        /* Filterbar open by default */
        options.initialFilterState = true;
        /* If mobile and default view, minimize filterbar. React on screen changes. */
        if (this.platform.name === "mobile") {
            options.initialFilterState = this.collection.querystate.isDefault() ? false : true;
            //this.platform.on("screen:orientation:change", this.onResizeScreen);
            //this.initMobile();
        }
        this.homepage = new App.Views.HomePage(options);
        this.render();
        this.router = new App.Router();
    },
    render: function() {
        this.topmenu.render();
        this.sidemenu.render();
        this.homepage.render();
        return this;
    },
    scrollToTop: function(instant, callback) {
        if (instant) {
            $("body, #content-container").scrollTop(0);
        } else {
            $("body, #content-container").stop().velocity({
                scrollTop: 0
            }, 500, callback);
        }
    },
    showMoviePage: function() {
        app.router.trigger("page:change", "moviepage");        
        this.scrollTop = this.$("#content-container").scrollTop() + $("body").scrollTop();
        app.goto(app.movieview, true);
    },
    showEventPage: function() {
        this.scrollTop = this.$("#content-container").scrollTop() + $("body").scrollTop();
        app.goto(app.eventview, true);
    },

    showTicketPurchase: function(ticket) {
        var id = ticket.vod_id;
        app.usercollection.fetch().done(function() {
            var title = app.usercollection.get(id);
            if (title) {
                title.set("validtotext", title.getValidityText());
                if (!this.returnview) this.returnview = new App.Views.PostPurchaseDialogView({
                    model: title,
                    ticket: ticket,
                    session: app.user.session
                });
                else this.returnview.model.set(title.toJSON());
                this.returnview.render();

            } else {
                app.router.navigate("/notfound", {
                    trigger: true
                });
                return false;
            }
        }.bind(this));
    },
    showBrowserPage: function() {

        app.goto(app.homepage);
        app.router.trigger("page:change", "homepage");

        $(".main-wrapper:not(#homepage)").hide();
        $("#homepage").css("visibility", "visible");
        $("#homepage").show();
        if (!this.browserInitialized) { 
            if (window.mySwiper) mySwiper.resizeFix();
            app.homepage.browserview.filterview.filterbarview.enableCarosel();
            this.browserInitialized = true;
          
        }
        app.homepage.browserview.$isotope.isotope('layout');
        app.homepage.browserview.renderResults();  
        if (this.scrollTop !== 0) {
            $("#content-container").scrollTop(this.scrollTop);
        }
        App.Utils.lazyload();
    },
    /* Pure evil addressbar hiding on resizing the screen */
    onResizeScreen: function() {
        $("body").height(this.platform.resolution.height - 5);
        var height = this.platform.resolution.height;
        this.$el.css("height", height);
        this.browserInitialized = false;
    },
    /* Pure evil addressbar hiding */
    initMobile: function() { 
        this.onResizeScreen();
        $("body,html").css("overflow", "visible");
    },
    showSearchPage: function() {
        app.homepage.browserview.collection.onSearchFieldChange();
    },
    showContentPage: function(id) {
        this.trigger("page:change", id);

        $(".main-wrapper:not(#contentpage)").hide();
        this.$("#content-container").scrollTop(0);
        $("#contentpage").show();
        if (id) {
            $(".side-menu-list a.active").removeClass("active");
            $(".side-menu-list a#menu-" + id).addClass("active");
        }
        this.currentPage = app.router.views.contentview;
    },
    goto: function(view, scroll) {
        // cache the current view and the new view
        var previous = this.currentPage || null;
        var next = view;
        if (previous === next) {
            this.currentPage = next;
            return;
        }
        var deferred = new $.Deferred();
        if (previous) {
            previous.transitionOut(function() {deferred.resolve(); });
        } else {
            deferred.resolve();
        }

        deferred.done(function() { 
            if (next)
            next.transitionIn(function() {
                if (scroll) $("body, #content-container").scrollTop(0);
            }.bind(this));
            //      next.render({ page: true });  // render the next view
            //    this.$el.append( next.$el );  // append the next view to the body (the el for this root view)
        }.bind(this));
        
        this.currentPage = next;
    }
});
// Base view class for providing transition capabilities
// perhaps better named something like AnimView?
App.Views.Page = Backbone.View.extend({
    transition: function() {
        return { in : "slideDownIn",
            out: 'slideUpOut'
        }
    },
    // base render class that checks whether the the view is to be a 'page'
    // aka meant for transitions; This is somewhat of an anti-pattern in that
    // each view inheriting from this will have to trigger this render method
    // with a 'super' call. A better remedy is to provide a check for a method
    // like onRender() and trigger it with correct context so that views which
    // inherit from this can provide an onRender() method for any additional
    // rendering logic specific to that view.
    render: function(options) {
        // as part of refactor, show the current instance of the view using render
        options = options || {};
        if (options.page === true) {
            this.$el.addClass('page');
        }
        // From comment above, refactoring to use onRender() instead of override
        if (_.isFunction(this.onRender())) {
            // trigger whatever current/caller view's onRender() method
            this.onRender();
        }
        return this;
    },
    transitionIn: function(callback) {
        var view = this;
        view.$el.velocity('transition.' + view.transition().in, {
            duration: 400,
            easing: 'easeInSine',
            complete: function() {
                if (_.isFunction(callback)) {
                    callback();
                }
            }.bind(this)
        });
    },
    transitionOut: function(callback) {
        var view = this;
        view.$el.velocity('transition.' + view.transition().out, {
            duration: 500,
            easing: 'easeOutSine',
            complete: function() {
                if (_.isFunction(callback)) {
                    callback(); // hard to track bug! He's binding to transitionend each time transitionOut called
                    // resulting in the callback being triggered callback * num of times transitionOut
                    // has executed
                }
            }.bind(this)
        });
    }
});
App.Views.HomePage = App.Views.Page.extend({
    el: $("#homepage"),
    transition: function() {
        return { in : 'slideUpIn',
            out: 'slideDownOut'
        }
    },
    initialize: function(options) {
        this.browserview = new App.Views.BrowserPage({
            collection: options.collection,
            filters: options.filters,
            sort: options.sort,
            initialState: options.initialFilterState,
        });
        var featured = options.collection.featured();
        if (App.Settings.Featured.featured_slides_randomize === true) {
            featured = _.shuffle(featured);
        }
        featured = _.rest(featured.reverse(), _.size(featured) - App.Settings.Featured.featured_slides_limit);
        this.featuredview = new App.Views.FeaturedView({
            collection: featured,
            banners: options.banners,
            querystate: options.collection.querystate
        });
        this.featuredview.on("search:open", this.onSearchOpen, this);
        this.featuredview.on("search:close", this.onSearchClose, this);
    },
    render: function() {
        this.featuredview.render();
        this.browserview.render();
        return this;
    },
    onSearchOpen: function() {
        this.browserview.trigger("minimize");
    },
    onSearchClose: function() {
        this.browserview.trigger("maximize");
    },
});
App.Views.TopMenu = Backbone.View.extend({
    events: {
        'submit form#main-search-form': 'onSearchSubmit',
        'keypress #main-search-box': 'onSearchChange',
        'blur #main-search-box': 'onSearchChange',
        'change #main-search-box input[type="text"]': 'onSearchChange',
        'click #search-button': 'toggleSearchBox',
        'click #menu-dragger': 'toggleSideBar',
        'click #my-items': 'toggleTopBar',
        'click .login': 'login',
        'click #main-vifi-logo' : 'goHome',
        'click #quickbar-switch': 'toggleQuickMenu',
        'click #clear-search-text-button': 'clearSearch'
    },
    model: App.User.FBPerson,
    el: $("#top-main-toolbar"),
    initialize: function(options) {
        if (options.model) this.model = options.model;
        this.listenTo(this.collection, "change", this.render, this);
        this.listenTo(this.collection, "add", this.render, this);
        this.listenTo(this.collection, "reset", this.render, this);
        this.listenTo(this.collection, "remove", this.render, this);
        this.model.on('change', this.render, this);
    },
    onSearchChange: function(e) { 
        var query = $('#main-search-box').val();
        if (query !== "") {
            $("#clear-search-text-button").velocity("fadeIn", {
                duration: 400
            });
        } else {
            $("#clear-search-text-button").velocity("fadeOut", {
                duration: 400
            });
        }
        return true;
    },
    goHome: function(e) {
        app.router.navigate("/", {
            trigger: false
        });
        app.showBrowserPage();
        e.preventDefault();


        return false;
    },
    render: function() {
        if (app.usercollection && app.usercollection.length > 0)
            this.model.set("collectionLength", app.usercollection.length);
        else {
            this.model.set("collectionLength", 0)
        }
        this.model.set("has_profile_picture", false, {silent: true});

        if (this.model.get("profile_picture") !== "") this.model.set("has_profile_picture", true, {silent:true});
        this.$el.html(ich.topmenuTemplate(this.model.toJSON()));
        var search = this.$("#main-search-box").val();

        this.$("#main-search-box").val(search);
        if (search && search !== "")
        this.$("#main-search-box").trigger("keypress");
        return this;
    },
    login: function(e) {
        $(document).trigger("login");
        return false;
    },
    logout: function(e) {
        app.router.navigate("/", {
            trigger: true
        });
        $(document).trigger('logout');
        return false;
    },
    toggleQuickMenu: function(e) {
        app.quickmenu.toggleQuickBar();
        return false;
    },
    toggleSearchBox: function(e) {
        var el = this.$("#toolbar-search-group");
        var visible = el.hasClass("pullDownRight");
        el.toggleClass("pullDownRight");
        el.toggleClass("pullUpRight", visible);
        if (e) $(e.currentTarget).toggleClass("active", !visible);
        if (!visible) $("#main-search-box").focus();
        else $("#main-search-box").blur();
        return false;
    },
    toggleSideBar: function(e) {
        app.sidemenu.toggleSideBar(e);
        return false;
    },
    clearSearch: function(e) {
        e.preventDefault();
        if (app.collection.querystate.isDefault() === false) { 
            app.collection.querystate.setDefault();
        }
        app.homepage.browserview.onSearchFieldChange(e);
        this.toggleSearchBox();
        app.scrollToTop();
        return false;
    },
    onSearchSubmit: function(e) {
        e.preventDefault();
        var query = $('#main-search-box').val();
        if (query === '') return this.clearSearch(e);
        if (app.collection.querystate.isDefault() === true) { 
            $("[data-val=reset]").click();
        }
        app.homepage.browserview.onSearchFieldChange(e);
        this.toggleSearchBox();
        app.scrollToTop();
        return false;
    },
});
App.Views.QuickbarMenu = Backbone.View.extend({
    el: "#quickbar-overlay",
    state: 'closed',
    events: {
        'click .open-library': 'open',
        'click #overlay-close' :'closeQuickBar',
    },
    initialize: function(options) {
        var options = options || {};
        if (options.collection) this.collection = options.collection;
        _.bindAll(this, 'openQuickBar', 'closeQuickBar', 'toggleQuickBar', 'render');
        this.listenTo(this.session, "user:login", this.render, this);
        this.listenTo(this.session, "user:logout", this.render, this);
        this.listenTo(this.collection, "add", this.render, this);
        this.listenTo(this.collection, "reset", this.render, this);
        this.listenTo(this, "quickbar:open", this.openQuickBar);
        this.listenTo(this, "quickbar:close", this.closeQuickBar);
        this.listenTo(this, "quickbar:toggle", this.toggleQuickbar);
        this.quickBarView = new App.Views.UserCollectionView({
            collection: this.collection
        });
        this.$el.html(ich.quickbarMenuTemplate());
        this.quickBarView.setElement("div#quickbar-content");
    },
    toggleQuickBar: function(e) {
        if ($("#quickbar-overlay").hasClass("visible")) this.state = "open";
        else this.state = "closed";
        if (this.state === "open") {
            this.closeQuickBar();
        } else {
            this.openQuickBar();
        }
        if (e) $(e.currentTarget).toggleClass("active", this.state !== "closed");
    },
    closeQuickBar: function() {
        this.state = "closed";
        this.$el.removeClass("visible");
        return false;
    },
    openQuickBar: function() {
        this.render();
        this.state = "open";
        this.$el.addClass("visible");
    },
    render: function() {
        this.quickBarView.render();
        return this;
    }
});
App.Views.SideMenu = Backbone.View.extend({
    el: $("#side-menu-container"),
    state: 'closed',
    events: {
        'click .logout': 'logout'
    },
    initialize: function(options) {
        var options = options || {};
        if (options.model) this.model = options.model;
        if (options.session) this.session = options.session;
        _.bindAll(this, 'enableSideMenu', 'toggleSideBar', 'render');
        this.listenTo(this.session, "user:login:success", this.render, this);
        this.listenTo(this.session, "user:logout", this.closeSideBar, this);
        this.loginForm = new App.Views.LoginForm({
            session: this.session
        });
        this.enableSideMenu();
    },
    enableSideMenu: function() {
        window.snapper = new Snap({
            element: document.getElementById("content-container"),
            disable: 'right',
            maxPosition: 260
        });
    },
    logout: function(e) {
        e.preventDefault();
        $(document).trigger("logout");
        this.render();
    },
    toggleSideBar: function(e) {
        if (!window.snapper) return false;
        if ($("body").hasClass("snapjs-left")) this.state = "left";
        else this.state = "closed";
        if (this.state === "left") {
            this.closeSideBar();
        } else {
            window.snapper.open('left');
            this.state = "left";
        }
        if (e) $(e.currentTarget).toggleClass("active", this.state !== "closed");
    },
    closeSideBar: function() {
        if (!window.snapper) return false;
        window.snapper.close();
        this.state = "closed";
    },
    render: function() {
        var templateData = _.extend({}, this.model.toJSON(), {
            social_facebook_url: App.Settings.Social.facebook_url,
            social_twitter_url: App.Settings.Social.twitter_url,
            rss_feed_url: App.Settings.Social.rss_feed_url
        });
        this.$el.html(ich.sidemenuTemplate(templateData));
        this.assign(this.loginForm, "#login-register-form");
        return this;
    }
});
App.Views.CarouselView = Backbone.View.extend({
    swiperState: false,
    changeTab: function(e) {
        e.preventDefault();
        var attr = $(e.currentTarget).attr("data-rel");
        var el = $("#" + attr);
        $(e.currentTarget).siblings().removeClass("active");
        $(el).siblings().removeClass("active").hide();
        $(el).addClass("active").show();
        App.Utils.lazyload();
        return false;
    },
    startCarousel: function(initialSlide) {
        var _this = this;
        initialSlide = initialSlide || 0;
        this.swiper = new Swiper(this.options.swiperEl, {
            slidesPerView: 'auto',
            mode: 'horizontal',
            loop: false,
            centeredSlides: true,
            cssWidthAndHeight: true,
            initialSlide: initialSlide,
            onTouchEnd: function(e) {
                var idx = e.activeIndex;
                $(_this.options.swiperEl + " .swiper-wrapper .swiper-slide:nth-child(" + (idx + 1) + ")").siblings().removeClass("active");
                App.Utils.lazyload();
                return false;
            },
            onSwiperCreated: function() {
                if (_this.options.swipeTo) {
                    var el = $(_this.options.swiperEl + " .swiper-wrapper .swiper-slide:nth-child(" + (_this.options.swipeTo + 1) + ")");
                    el.click();
                    var tab = el.attr("data-rel");
                    $("#" + tab).show().siblings().hide();
                }
            },
        });
        this.$('.swiper-slide').on('click', this.changeTab);
        $(this.options.swiperEl + " .swiper-slide").each(function(item) {
            $(this).click(function(e) {
                _this.options.swipeTo = item;
                e.preventDefault();
                _this.swiper.swipeTo(item);
            })
        });
        return this.swiper;
    }
});
App.Views.DialogView = Backbone.View.extend({
    initialize: function(options) {},
    onClose: function() {
        $.magnificPopup.close();
    },
    openDialog: function(e, content) {
        if (e) e.preventDefault();
        var html = content ? content : this.$el.html();
        var _this = this;

        // this part overrides "close" method in MagnificPopup object
        $.magnificPopup.instance.close = function() {

            if (_this.mustConfirm && (!_this.isConfirmed)) {
                return;
            }

            // "proto" variable holds MagnificPopup class prototype
            // The above change that we did to instance is not applied to the prototype,
            // which allows us to call parent method:
            $.magnificPopup.proto.close.call(this);
        };

        $.magnificPopup.open({
            items: {
                src: html,
                type: 'inline',
            },
            prependTo: document.getElementById("dialog"),
            removalDelay: 500, //delay removal by X to allow out-animation
            callbacks: {
                beforeOpen: this.beforeOpen,
                afterOpen: this.afterOpen,
                afterClose: function() {},
                beforeClose: function() {},
            },
            showCloseBtn: false,
            closeBtnInside: false
        });
        return false;
    },
    afterOpen: function(e) {},
    beforeOpen: function(e) {},
    afterClose: function(e) {},
});
App.Views.ContentView = App.Views.Page.extend({
    el: "#contentpage",
    initialize: function(options) {
        // Access the template function from ich object without eval
        var templateFn = ich[options.template];
        this.content = templateFn ? templateFn().html() : '';
        this.template = ich.contentPageTemplate({
            content: this.content,
            title: options.title
        });
    },
    render: function() {
        this.$el.empty().append(this.template);
        return this;
    }
});
App.Views.ContactView = App.Views.ContentView.extend({
    bindings: {
        '[name=contact_email]': {
            observe: 'contact_email',
            setOptions: {
                validate: false
            }
        },
        '[name=contact_body]': {
            observe: 'contact_body',
            setOptions: {
                validate: false
            }
        },
        '[name=contact_phone]': {
            observe: 'contact_phone',
            setOptions: {
                validate: false
            }
        },
        '[name=contact_name]': {
            observe: 'contact_name',
            setOptions: {
                validate: false
            }
        },
    },
    events: {
        'submit #contact-form': 'onSubmit'
    },
    initialize: function(options) {
        this.template = ich.contactPageTemplate();
        this.model = new App.Forms.ContactForm();
        // This hooks up the validation
        Backbone.Validation.bind(this);
    },
    onSubmit: function(e) {
        e.preventDefault();
        var form = $("#contact-form").serializeArray();
        var message = {
            name: _.where(form, {
                name: "contact_name"
            }).pop().value,
            phone: _.where(form, {
                name: "contact_phone"
            }).pop().value,
            email: _.where(form, {
                name: "contact_email"
            }).pop().value,
            body: _.where(form, {
                name: "contact_body"
            }).pop().value
        };
        var msg = [message.body, message.name, message.phone, message.email].join("\n\n");
        var subject = "Feedback from " + App.Settings.sitename;
        var res = this.model.validate();
        if (res === undefined) {
            this.removeOnDone($("#submit_contact_form"));
            app.api.post(["user", "sendfeedback"], {
                message: msg,
                email: message.email,
                subject: subject
            });
            this.$("#contact-form button").attr("disabled", "disabled").css("opacity", "0.5");
        }
        e.stopPropagation();
        return false;
    },
    render: function() {
        this.$el.empty().append(this.template);
        this.stickit();
        return this;
    },
    remove: function() {
        // Remove the validation binding
        Backbone.Validation.unbind(this);
        return Backbone.View.prototype.remove.apply(this, arguments);
    }
});
App.Views.RecoveryView = App.Views.ContentView.extend({
    events: {
        'submit #recovery-form': 'onSubmit'
    },
    initialize: function(options) {
        this.content = ich.recoveryPageTemplate(options).html();
        this.template = ich.contentPageTemplate({
            content: this.content,
            title: "Recovery"
        });
    },
    onFail: function(data) {
        if (!data) return false;
        this.$("form .error").remove();
        var div = $("<div>").addClass("row-fluid error").html(data.message);
        this.$("form:visible:first").prepend(div);
        return false;
    },
    onSubmit: function(e) {
        e.preventDefault();
        var email = this.$("#recover-email").val();
        var key = this.$("#recover-key").val();
        var pass = this.$("#recover-password").val();
        var passverify = this.$("#recover-password-confirm").val();
        if (pass !== passverify) {
            this.onFail({
                message: "Passwords do not match!"
            });
        }
        if (pass === "" || passverify === "") {
            this.onFail({
                message: "Fill all the fields!"
            });
        } else {
            app.session.get("profile").recoverPassword(email, key, pass);
        }
        return false;
    }
});
App.Views.Error = App.Views.ContentView.extend({
    type: false,
    events: {
        'click .retry': 'retry'
    },
    initialize: function(options) {
        this.template = ich.errorPageTemplate({
            subject: options.subject,
            description: options.description
        }).html();
    },
    retry: function() {
        Backbone.history.loadUrl(Backbone.history.fragment);
    }
});