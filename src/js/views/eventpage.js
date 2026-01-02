App.Views.EventDetailView = App.Views.Page.extend({
    model: App.Models.Event,
    transition: function() {
        return { in : 'slideDownIn',
            out: 'slideUpOut'
        }
    },
    el: "#eventpage",
    events: {
        'click button.play-event': 'playEvent',
        'click div.state-default': 'playEvent',
        'click #close-player': 'closePlayer',
        'click #close-trailer': 'closeTrailer',
        'click button.error-event': 'onStatusError',
        'click button.preview-event': 'onStatusPreview',
        'click button.offline-event': 'onStatusOffline',
        'click button.finished-event': 'onStatusFinished',
        'click button.pause-event': 'onStatusPaused',
        'click button.online-event': 'onStatusOnline',
        'click #film-tabbar-swiper-container .swiper-slide': 'changeTab'

    },
    initialize: function(options) {
        this.listenTo(this.model, 'change:id', this.render);
        _.bindAll(this, 'playEvent', 'render', 'stopTimer', 'startTimer');
        this.template = _.template(app.template.get("event"));
        //    'click button.error-event': this.player.renderError,
        // 'click button.offline-event': this.player.renderOffline,
        // 'click button.preview-event': this.player.renderPreview,
        // 'click button.finished-event': this.player.renderFinished,
    },

    render: function() {
        this.model.set("playButton", App.Utils.translate('Watch'));
        this.$el.empty().append(this.template(this.model.toJSON()));
        return this;
    },
    onStatusError: function() {
        this.playerView.renderError();
    },
    onStatusOffline: function() {
        this.playerView.renderOffline();
    },
    onStatusPreview: function() {
        this.playerView.renderPreview();
    },
    onStatusPaused: function() {
        this.playerView.renderPaused();
    },
    onStatusFinished: function() {
        this.playerView.renderFinished();
    },
    onStatusOnline: function() {
        this.initPlayer();
        $("#event-page-header").addClass("is-playing");
    },
    playEvent: function(e) {
        if (e) e.preventDefault();
        if (e) e.stopPropagation();

        if (!app.user.hasProduct(this.model)) {
            this.showCarousel();
            this.purchaseView = new App.Views.PurchaseView({
                model: this.model,
                session: app.session
            })
            return false;
        }

        var id = this.model.get("id");

        var ticket = this.getTicket();

        if (_.isEmpty(ticket)) {
            return false;
        }

        if (this.playerView) {
            this.playerView.stopListening();
            this.playerView.close();
            if (!_.isEmpty(this.content)) {
                this.content = false;
            }
            this.ticket = false;
        }

        this.hideCarousel();

        this.playerView = new App.Views.EventPlayerView({
                model: app.player,
                ticket: this.getTicket()
        });

        if (this.eventStatusView) {
            this.eventStatusView.close();
        }
        if (this.eventViewersView) {
            this.eventViewersView.close();
        }

        this.eventStatusView = new App.Views.EventStatusView({model: ticket});
        this.eventViewersView = new App.Views.EventViewersView({model: ticket});
        this.content = ticket.content;

        var _this = this;
        this.updateStatus().done(function(item) {

            _this.content = ticket.content;

            this.content.fetch();
            
            if (_this.content.get('status') === 'live')
                this.initPlayer();
            else {
                this.onStatusChange();
            }
            this.eventViewersView.render();

            this.startTimer();

        }.bind(this));
        this.listenTo(this.content, "change:status", this.onStatusChange, this);
        this.listenTo(app.router, "page:change", this.onPageChange, this);


        $("#close-player").show();
        $("#event-page-header").addClass("is-playing");

        return false;
    },

    initPlayer: function() {
        this.hideCarousel();

        this.playerView = new App.Views.EventPlayerView({
                model: app.player,
                ticket: this.getTicket()
        });
        this.listenTo(this.playerView, 'player:close',this.onClosePlayer, this);
        this.listenTo(this.playerView, 'player:timeupdate',this.onTimeupdate, this);

        this.playerView.renderPlayer();

        var playlist = new App.Player.Playlist;
        var ticket = this.getTicket();
        playlist.addFiles(ticket.content);
        app.player.player.init(playlist);
    },

    onStatusChange: function(status) {
        var ticket = this.getTicket();
        var status = ticket.content.get("status");
        this.onTimeupdate();

        switch(status) {
            case 'paused':
            this.onStatusPaused();
            break;
            case 'offline':
            this.onStatusOffline();
            break;
            case 'live':
            this.onStatusOnline();
            break;
            case 'preview':
            this.onStatusPreview();
            break;
            case 'error':
            this.onStatusError();
            break;
            case 'finished':
            this.onStatusFinished();
            break;

        }
        return;
    },
    onTimeupdate: function() {
        this.eventStatusView.render();
    },
    closePlayer: function(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        this.playerView.close();
        this.playerView.model.stop();
        this.stopTimer();
        this.render();
    },
    onClosePlayer: function() {
        this.closePlayer();
    },
    onPageChange: function() {
        this.closePlayer();
    },
    showCarousel: function() {
        $("#close-player").hide();
        $(".event-state.state-default").show();
    },
    hideCarousel: function() {
        $(".event-state.state-default").hide();
    },

    getTicket: function() {
        if (!_.isEmpty(this.ticket)) {
            return this.ticket;
        }
        if (!this.model || !this.model.get) {
            throw "No ticket found for event!";
            return false;
        }
        var id = this.model.get("id");
        var ticket = app.usercollection.get(id);
        if (_.isEmpty(ticket)) {
            throw "No ticket found for user!";
            return false;
        }
        this.ticket = ticket;
        return ticket;
    },

    updateStatus: function() {
        var ticket = this.getTicket();
        var deferred = new $.Deferred();
        this.eventViewersView.render();

        ticket.content.fetch().done(function(item) {
            deferred.resolve(ticket.content);
        }).error(function(err) { deferred.reject(err); });
        return deferred;
    },
    /**
     * Start polling
     *
     */

    startTimer: function() {
        this.stopTimer();
        this.polling = true;

        this.interval = setInterval(function() {

            if (this.polling === false) {
                this.stopTimer();
                return false;
            }
            this.updateStatus().done(function() { $log("Content "+ this.model.get("id") + " fetched"); }.bind(this)).fail(function(err) {  this.onTimeout(err); }.bind(this));

        }.bind(this),5000);
    },

    /*
     * Timeout event
     *
     */

    onTimeout: function() {
        this.polling = false;
        this.set("statusMessage", tr("Timed out"));
        this.stopTimer();
    },

    /*
     * Stop polling
     *
     */

    stopTimer: function() {
        this.polling = false;
        if (this.interval) {
            clearInterval(this.interval);
        }
    },

    changeTab: function(e) {
        e.preventDefault();
        var attr = $(e.currentTarget).attr("data-rel");
        var el = $("#" + attr);
        if ($(el).hasClass("active")) return false;
        $(el).siblings().removeClass("active").hide();
        $(el).addClass("active");
        $(el).show();
        setTimeout(function() {
            App.Utils.lazyload();
            this.applyIsotope();
        }.bind(this), 400);
        return false;
    },
    startCarousel: function() {
        if (_.size(this.model.get("images").backdrops) < 2) {
            $("#moviepage .arrow-left, #moviepage .arrow-right").css("visibility", "hidden");
        } else { 
            window.myMovieSwiper = $('#gallery-swiper-container').swiper({
                //Your options here:
                mode: 'horizontal',
                cssWidthAndHeight: false,
                pagination: '.pagination-1',
                paginationClickable: true,
                createPagination: true,
                onSlideChangeStart: function(e) {}
            });
            $('#moviepage .arrow-left').show().on('click', function(e) {
                e.preventDefault()
                myMovieSwiper.swipePrev();
            });
            $('#moviepage .arrow-right').show().on('click', function(e) {
                e.preventDefault()
                myMovieSwiper.swipeNext();
                App.Utils.lazyload();
            });
        }
        window.filmnavSwiper = new Swiper('#film-tabbar-swiper-container', {
            slidesPerView: 'auto',
            mode: 'horizontal',
            loop: false,
            centeredSlides: true,
            cssWidthAndHeight: true,
            onTouchEnd: function(e) {
                var idx = e.activeIndex;
                $("#film-tabbar-swiper-container .swiper-wrapper .swiper-slide:nth-child(" + (idx + 1) + ")").click();
            },
        });
        $("#film-tabbar-swiper-container .swiper-slide").each(function(item) {
            $(this).click(function(e) {
                e.preventDefault();
                filmnavSwiper.swipeTo(item);
            })
        });
    }
});