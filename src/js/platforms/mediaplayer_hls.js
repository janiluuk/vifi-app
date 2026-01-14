/**
 *
 *  Vifi Media Player for HTML5
 *
 *  author: Jani Luukkanen
 *  janiluuk@gmail.com
 *
 */
App.MediaPlayer = {
    currentStream: null,
    plugin: false,
    wasMuted: false,
    bitrate: false,
    allowFastFoward: true,
    player: false,
    _eventsToTrack: ['error', 'finish', 'fullscreen', 'fullscreen-exit', 'progress', 'seek', 'pause', 'unload', 'resume', 'ready', 'volume'],
    init: function(playlist) {
        $log("Calling init on HLS player");
        if (playlist) this.setPlaylist(playlist);
        this._videoElement = $("#" + this.playerId);
        if (this._videoElement.length === 0) {
            this._videoElement = $("<div>").attr("id", this.playerId).appendTo("#movie-player-container");
        }
        this._createPlayer();
        return true;
    },
    getCurrentTime: function() {
        if (this.plugin) return this.plugin.video.time * 1000;
    },
    _createPlayer: function() {
        if (!this.playlist) return false;
        try {

            var playlistFiles = this.playlist.getPlaylistFiles();
            var _this = this;
            var sources = {
                sources: playlistFiles
            };
            $log("Initializing flowplayer to "+ this.playerId + " element");
            flowplayer('#' + this.playerId, {
                defaultQuality: "720p",
                adaptiveRatio: true,
                hlsFix: false,
                autoPlay: true,
                engine: 'html5',
                embed: false,
                clip: sources
            }, function(ev, api) {
                var video = api.video;
                _this.plugin = api; 
                _this.active();
                _this.trigger("mediaplayer:ratio:change", video);
                if (App.Settings.debug === true) _this._trackEvents();
                api.bind("pause", function(e, api) {
                    _this.trigger("mediaplayer:pause");
                });
                api.bind("resume", function(e, api, video) {
                    _this.trigger("mediaplayer:resume");
                });
                api.bind("finish", function(e, api, video) {
                    _this.trigger("mediaplayer:onstop");
                });
                api.bind("seek", function(e, api, time) {
                    $log("Seeking to " + App.Utils.convertMstoHumanReadable(time * 1000).toString());
                    $log("seeking:" + api.seeking + " " + App.Utils.convertMstoHumanReadable(api.video.time * 1000).toString() + " / " + App.Utils.convertMstoHumanReadable(api.video.duration * 1000).toString());
                    _this.trigger("mediaplayer:onseek", time);
                });
                api.bind("beforeseek", function(e, api, time) {
                    $log("seeking:" + App.Utils.convertMstoHumanReadable(time * 1000).toString());
                    _this.trigger("mediaplayer:onbeforeseek");
                });
                api.resume();
                $(".flowplayer a.fp-brand").remove();
                $(".flowplayer a[href*='flowplayer.org']").remove();
            }.bind(this));
        } catch (err) {
            alert(err.message);
        }
        return true;
    },
    _playVideo: function() {
        this.currentStream = this.playlist.nextFile();
        $log(" SETTING CURRENT STREAM TO: " + this.currentStream.src);
        this.play();
    },
    _initSubtitles: function(content) { 
        $log("Initializing subtitles");

        if (this.subtitles) {
            this.subtitles.unload();
            this.subtitles.unbind();
        }   
        this.subtitles = new App.Player.Subtitles();

        if (this.subtitlesView) { 
            this.subtitlesView.close();
            this.subtitlesView.unbind();
        }
        this.subtitlesView = new App.Views.Subtitles({
            model: this.subtitles
        });
        this.subtitles.load(content);
    },
    loadSubtitles: function(subtitles) {
        var code = subtitles.code;
        this.subtitles.handleSubtitleSelection(code);
    },
    disableSubtitles: function() {
        if (this.subtitles) this.subtitles.disable();
        this.trigger("mediaplayer:subtitles:disabled");
    },
    enableSubtitles: function() {
        if (this.subtitles) {
            this.subtitles.enable();
            this.trigger("mediaplayer:subtitles:enabled");
        }
    },
    stop: function(forced) {
        if (this.plugin) {
            try {
                this.plugin.pause();
                this.deactive();
//                this._stopTrackingEvents();
                if (!forced) this.trigger("mediaplayer:onstop");
            } catch (e) {} // If this doesn't succeed, it doesn't matter, just die gracefully
        }
    },
    fastforward: function() {
        var currentTime = this.plugin.video.time;
        this.plugin.seek(currentTime + 10);
        this.trigger("mediaplayer:onfastforward");
    },
    rewind: function() {
        var currentTime = this.plugin.video.time;
        this.plugin.seek(currentTime - 10);
        this.trigger("mediaplayer:onrewind", 1);
    },
    mute: function(muted) {
        if (this.plugin) {
            // need to hold on to this so we know when we've switched state in our onvolumechange handler.
            this.wasMuted = this.plugin.getStatus().muted;
            if (!this.wasMuted) {
                this.plugin.mute();
                this.trigger("mediaplayer:onmute");
            } else {
                this.trigger("mediaplayer:onunmute");
                this.plugin.unmute();
            }
        }
    },
    isReady: function() {
        return this.plugin !== false && this.plugin.ready;
    },
    playing: function() {
        var playing = (this.plugin.playing ? true : false);
        return playing;
    },
    duration: function() {
        if (_.isNaN(this.plugin.video.duration)) {
            return null;
        } else {
            return Math.floor(this.plugin.video.duration * 1000);
        }
    },
}
_.extend(App.MediaPlayer, Backbone.Events);
_.extend(App.MediaPlayer, App.Player.Platforms.Core);