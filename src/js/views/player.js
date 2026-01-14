App.Views.EventPlayerView = Backbone.View.extend({
    el: "#event-control-container",
    model: App.Player.MediaPlayer,
    controlBar: false,
    template: false,

    events: {
        'click #close-player': 'onClosePlayer',
    },
    initialize: function(options) {
        if (options.ticket) {
            this.ticket = options.ticket;
        }
        this.setElement(this.el);
        _.bindAll(this, 'render', 'close', 'resize');
        app.platform.on("screen:orientation:change", this.resize, this);
        this.listenTo(this.model, "change", this.render, this);
        this.listenTo(this.model, "player:sessionoverridden", this.onForcedClose, this);
        this.listenTo(this.model, "player:resize", this.resize, this);
        this.listenTo(this.model, "player:offline", this.renderOffline, this);   
        this.listenTo(this.model, "player:error", this.renderError, this);
        this.listenTo(this.model, "player:close", this.onClosePlayer, this);   

        this.listenTo(this.model, "player:timeupdate", this.onPlayerProgress, this);   
        this.listenTo(app.platform, "screen:resize", this.resize, this);
        this.listenTo(app.router, "page:change", this.close, this);
        this.render();
    },

    /*
     * Get the film ratio, and calculate the optimal player height and width
     *
     */

    resize: function() {
        return;

        var element = $("#event-control-container");
        var ratio = this.model.ratio;
        var nav_height = $('#event-container-heading').outerHeight();
        var footer_height = $('#event-container-footer').outerHeight();
        var orientation = App.Platforms.platform.getDeviceOrientation();
        var player_width = (orientation === "portrait") ? $('#event-page-header').width() : $(window).width();
        var player_height = player_width*ratio;

        element.width(Math.ceil(player_width));
        element.height(Math.ceil(player_height));
        this.setElement(this.el);

    },
    close: function() {
        this.model.stop();
        this.stopListening(app.platform);
        this.stopListening(app.router);
        this.stopListening(this.model);
        this.setElement(this.el);
        this.$el.velocity("fadeOut", { duration: 200 });
        //this.stopListening();
    },
    show: function() {
        this.setElement(this.el);
        this.$el.velocity("fadeIn", { duration: 200 });

        //this.unbind();
        //this.stopListening();
    },
    onClosePlayer: function(e) {
        this.trigger('player:close', e);
        this.close();
    },
    onForcedClose: function() {
        this.trigger('player:close');
    },
    renderPreview: function() {
        this.setElement(this.el);
        var height = this.$el.parent().height();
        var _this = this;
        $("#event-page-header").removeClass("is-playing");

        this.$el.empty().append(ich.eventStatePreviewTemplate(this.ticket.content.toJSON()));        
        return this;
    },
    renderOffline: function() {
        this.setElement(this.el);
        var height = this.$el.parent().height();
        var _this = this;
        $("#event-page-header").removeClass("is-playing");
        this.$el.empty().append(ich.eventStateOfflineTemplate(this.ticket.content.toJSON()));        
        return this;
    },
    renderError: function() {
        this.setElement(this.el);
        var height = this.$el.parent().height();
        var _this = this;
        $("#event-page-header").removeClass("is-playing");

        this.$el.empty().append(ich.eventStateErrorTemplate(this.ticket.content.toJSON()));        
        return this;
    },
    renderFinished: function() {
        this.setElement(this.el);
        $("#event-page-header").removeClass("is-playing");

        var height = this.$el.parent().height();
        var _this = this;
        this.$el.empty().append(ich.eventStateFinishedTemplate(this.ticket.content.toJSON()));        
        return this;
    },
    renderPaused: function() {
        this.setElement(this.el);
        $("#event-page-header").removeClass("is-playing");

        var height = this.$el.parent().height();
        var _this = this;
        this.$el.empty().append(ich.eventStatePausedTemplate(this.ticket.content.toJSON()));        
        return this;
    },

    renderPlayer: function() {
        this.setElement(this.el);

        this.$el.empty().append(ich.eventPlayerTemplate(this.ticket.content.toJSON()));

        $("#event-container-heading").show();

        $("#event-control-container").css("opacity",1).show();
        $("#event-page-header").addClass("is-playing");

        $("#content-container").scrollTo(0,0);
        this.resize();
        return this;
    },
    render: function() {

        this.setElement(this.el);        
        return this;
    },
    onPageChange: function(page, params) {
        $("#event-container-heading").hide().css("opacity",0);
        this.close();
     //   this.player.unload();

    },
    onPlayerProgress: function(evt) {
        this.trigger("player:timeupdate", evt);
    }
}
);

App.Views.EventViewersView = Backbone.View.extend({
    el: '#event-view-count',
    model: App.User.Ticket,
    render: function() {
        this.setElement(this.el);        
        var viewers = this.model.content.get("viewers");

        var data = {viewers: viewers};

        this.$el.empty().append(ich.eventViewersTemplate(data));
        return this;
    }
});

App.Views.EventStatusView = Backbone.View.extend({
    el: '#event-status',
    model: App.User.Ticket,
    render: function() {
        this.setElement(this.el);        
        var statusText = this.model.content.get("status");
        var statustime = Math.ceil(this.model.content.get("status_timestamp")*1000);
        var date = new Date();
        var timestamp = date.getTime();
        var time = (timestamp-statustime);

        if (parseInt(time, 10) > 0 && statusText === 'live') {
            var progress = App.Utils.convertMstoHumanReadable(time,true).toString();
        } else {
            var progress = '';
        }

        var data = {statusText: statusText, progress: progress};

        this.$el.empty().append(ich.eventStatusTemplate(data));
        return this;
    }
});

App.Views.PlayerView = Backbone.View.extend({
    el: "#movie-player-container",
    subtitleEl: "#subtitles",
    model: App.Player.MediaPlayer,
    controlBar: false,
    events: {
        'click #close-player': 'onClosePlayer',
    },
    initialize: function()
{        this.setElement(this.el);
        _.bindAll(this, 'render', 'close', 'resize', 'renderControls');
        app.platform.on("screen:orientation:change", this.resize, this);
        this.listenTo(this.model, "player:ready", this.renderControls, this);
        this.listenTo(this.model, "change", this.render, this);
        this.listenTo(this.model, "player:sessionoverridden", this.onForcedClose, this);
        this.listenTo(this.model, "player:resize", this.resize, this);
        this.listenTo(app.platform, "screen:resize", this.resize, this);
        this.listenTo(app.router, "page:change", this.close, this);
        this.render();
    },

    /*
     * Get the film ratio, and calculate the optimal player height and width
     *
     */

    resize: function() {
        var element = $("#player-container");
        var ratio = this.model.ratio;
        var nav_height = $('#video-container-heading').outerHeight();
        var footer_height = $('#video-container-footer').outerHeight();
        var orientation = App.Platforms.platform.getDeviceOrientation();
        var player_width = (orientation === "portrait") ? $('#movie-page-header').width() : $(window).width();
        var player_height = player_width*ratio;

        element.width(Math.ceil(player_width));
        element.height(Math.ceil(player_height));
        this.setElement(this.el);

    },
    close: function() {
        this.model.stop();
        this.stopListening(app.platform);
        this.stopListening(app.router);
        this.stopListening(this.model);
        this.setElement(this.el);
        this.$el.velocity("fadeOut", { duration: 200 });
        //this.stopListening();
    },
    show: function() {
        this.setElement(this.el);
        this.$el.velocity("fadeIn", { duration: 200 });

        //this.unbind();
        //this.stopListening();
    },
    onClosePlayer: function(e) {
        this.trigger('player:close', e);
        this.close();
    },
    onForcedClose: function() {
        this.trigger('player:close');
    },

    render: function() {
        this.setElement(this.el);
        var height = this.$el.parent().height();
        var _this = this;
        this.$el.empty().append(ich.playerTemplate(this.model.toJSON()));
        $("#video-container-heading").show();

        $("<div>").attr("id", "subtitles").appendTo("#player-container");
        $("#movie-player-container").css("opacity",1).show();

        $("#content-container").scrollTo(0,0);
        this.resize();
        return this;
    },

    renderControls: function(content) {

        if (!App.Settings.Player.enable_legacy_subtitles) {
            $log("Legacy subtitles disabled, not loading control bar");
            return false;
        }
        this.controlBar = new App.Views.PlayerControlbar({model: content});

        this.controlBar.on('controlbar:change', this.onControlsChange, this);
        this.$el.velocity("fadeIn", { duration: 200 });
        this.resize();
    },

    onControlsChange: function(category, val) {
        var evt = 'controlbar:'+category+':change';
        this.model.trigger(evt, val);
    },
    onPageChange: function(page, params) {
        $("#video-container-heading").hide().css("opacity",0);
        this.close();
    }
});

App.Views.PlayerControlbar = Backbone.View.extend({
    el: '#video-container-footer',
    model: App.Models.FilmContent,
    events: {
        'controlbar:change': 'onSelection',

    },
    initialize: function(options) {
        this.listenTo(this.model, "change", this.render, this);

        this.render();
    },
    onSelection: function(ev) { 
        var el = $(ev.target);
        var category = el.data('category');
        var val = el.find("option:selected").val();
        this.trigger('controlbar:'+category, val);

    },

    render: function() {

        var _this = this;
        this.setElement(this.el);
        this.$el.empty().append(ich.playerControlsTemplate(this.model.toJSON()));

        if (!App.Settings.Player.enable_legacy_subtitles) {
            $(this).find("select").css("opacity",0);
            $('.select-box').css("opacity", 0).attr("disabled", "disabled");
            $log("Legacy subtitles disabled, not loading control bar");
            return this;
        }

        $('.select-box').fancySelect().on('change.fs', function(e) {
            var val = $(this).find("option:selected").val();
            var category = $(this).data('category');
           _this.trigger('controlbar:change', category, val);
        });

        return this;
    },

})
App.Views.TrailerView = Backbone.View.extend({
    model: App.Models.Film,
    hideVideoNavigationTimeout: false,
    player: false,
    el: '#movie-trailer-container',
    optionsEl: '#trailer-options',
    infoEl: '#player-info',
    tagName: 'div',
    events: {
        'click #closeTrailer': 'close',
        'click #watchFilm': 'playFilm'
    },
    _keyMap: {
        'onPlay': "resume",
        'onPause': "pause",
        'onStop': "stop",
        'onReturn' : "close",
        'onMute' : "mute",
        'onFF' : "forward",
        'onRew' : "rewind"

    },
    initialize: function() {
        _.bindAll(this, "render", "_bindKeys", "_unbindKeys", "touchVideoNavigationTimeout", "close", "onPlayerReady",  "showNavigation", "pause","resume","mute", "stop", "onPlayerStateChange");
        this.listenTo(app.router, "page:change", this.onClose, this);
        this.render();

    },
    equalizeHeight: function() {
        var width = $("#trailer-container-body").parent().width();
        var height = width / 16 * 9;
        $("#trailer-container-body iframe").height(height);
    },

    _bindKeys: function() {
      //  Vifi.KeyHandler.bind("all", this.touchVideoNavigationTimeout,this);
        _.each(this._keyMap, function(key,item) {
          //  Vifi.KeyHandler.unbind("keyhandler:"+item);
          //  Vifi.KeyHandler.bind("keyhandler:"+item, eval("this."+key), this);
        }.bind(this));
    },
    _unbindKeysKeys: function() {
        _.each(this._keyMap, function(key,item) {
          //  Vifi.KeyHandler.unbind("keyhandler:"+item, eval("this."+key));
        }.bind(this));
    },
    playFilm: function(event) {
        this.close();
        this.trigger("play:movie", event, this);
    },
    fadeOut: function() {
        this.$el.velocity("fadeOut", { duration: 200 });

        return this;
    },
    fadeIn: function() {
        this.$el.velocity("fadeIn", { duration: 200 });
        return this;
    },
    playTrailer: function() {
        this.setElement("#movie-trailer-container");

        if (this.model.get("youtube_id")) {
            this.render();
            this._bindKeys();
            this.initPlayer();
           // this.showNavigation();
        }
    },

    initPlayer: function() {
        var _this = this;
        if (typeof(YT) === "undefined") {
            setTimeout(function() {
                this.initPlayer();
            }.bind(this), 600);
            return false;
        }
        var youtubeid = _this.model.get("youtube_id");
        if (youtubeid) {

            this.done = false;

            this.player = new YT.Player('ytplayer', {
                playerVars: {
                    'autoplay': 1,
                    'controls': 0
                },
                height: $(window).height(),
                width: $(window).width(),
                videoId: youtubeid,
                events: {
                    'onReady': _this.onPlayerReady,
                    'onStateChange': _this.onPlayerStateChange
                }
            });
        }
    },
    onPlayerReady: function(event) {
        $("#video-container-heading").show();
        event.target.playVideo();
    },

    onPlayerStateChange: function(event) {
        if (event.data === YT.PlayerState.ENDED) {
            this.onClose();
        }
    },
    stop: function() {
        if (this.player) {
          this.player.stopVideo();
          this.done = true;
          this.close();
        }
    },
    pause: function() {
        this.player.pauseVideo();
    },
    forward: function(amt) {
        amt = amt || 10;
        var time = this.player.getCurrentTime()+amt;
        this.player.seekTo(time);
    },
    rewind: function(amt) {
        amt = amt || 10;
        var time = Math.max(this.player.getCurrentTime()-amt,0);
        this.player.seekTo(time);

    },
    onClose: function() {
        this.trigger("trailer:close");
    },

    mute: function(e) {
        if (e) e.preventDefault();

        if (!this.player) return false;
        var currentMute = this.player.isMuted();
        $log("Current mute: "+currentMute);

        if (currentMute !== true) {
            $log("Muting audio");
            this.player.mute();

        } else {
            $log("UnMuting audio");

            this.player.unMute();
        }
    },
    resume: function() {
        this.player.playVideo();
    },
    close: function() {
        if (this.player) {
            this.player.destroy();
        }
        this.$el.velocity("fadeOut", { duration: 200 }).empty();
        this.clearAllTimeouts();
        this._unbindKeys();

    },
    showNavigation: function() {
        this.clearAllTimeouts();
        $(this.optionsEl).velocity("fadeIn", { duration: 200 });
        $(this.infoEl).velocity("fadeIn", { duration: 200 });
        this.touchVideoNavigationTimeout();
    },
    clearAllTimeouts: function() {
        clearTimeout(this.hideVideoNavigationTimeout);
    },
    touchVideoNavigationTimeout: function() {

        if (!$(this.optionsEl).is(":visible")) {
            $(this.optionsEl).velocity("fadeIn", { duration: 200 });
            $(this.infoEl).velocity("fadeIn", { duration: 200 });

        }
        clearTimeout(this.hideVideoNavigationTimeout);
        this.hideVideoNavigationTimeout = setTimeout(function() {
            $(this.optionsEl).fadeOut();
        }.bind(this), 2000);
        return false;
    },
    render: function() {
        this.$el.empty().append(ich.trailerTemplate(this.model.toJSON()));
        this.$el.velocity("fadeIn", { duration: 200 });
        this.equalizeHeight();
        return this;
    },
});

App.Views.Subtitles = Backbone.View.extend({
    model: App.Player.Subtitles,
    subtitleElement: '#subtitles',
    el: '#player-container',

    initialize: function(options) {

        this.model = options.model;
        _.bindAll(this, "loadSubtitles", "showSubtitle", "hideSubtitles", "render");
        this.listenTo(this.model, "subtitles:show", this.showSubtitle, this);
        this.listenTo(this.model, "change:subtitledata", this.render, this);
        this.listenTo(this.model, "subtitles:hide", this.hideSubtitles, this);
        this.listenTo(this.model, "subtitles:loadfile", this.loadSubtitles, this);
        this.render();

    },

    showSubtitle: function(data) {
        $(this.subtitleElement).html(data);
    },
    hideSubtitles: function() {
        $(this.subtitleElement).html('');
    },

    loadSubtitles: function(url,code) {
        this.render();
        $(this.subtitleElement).hide().load(url, function(responseText, textStatus, req) {
            var text = $(this.subtitleElement).text();
            $(this.subtitleElement).empty().show();
            this.model.parseSrt(text);
            this.model.start();

        }.bind(this));
    },
    render: function() {
        $(this.subtitleElement).remove();
        $("<div>").attr("id", "subtitles").appendTo("#player-container");
        this.setElement(this.el);
        return this;

    }



})


