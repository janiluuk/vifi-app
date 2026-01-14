/**
 *
 *  Vifi Media Player for Flowplayer 7
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
        $log("Calling init on FP7 player");
        if (playlist) this.setPlaylist(playlist);
        if (playlist.getType() === "event") {
            this.playerId = 'event-player-container';
        } else {
            this.playerId = 'player-container';
        }
        this._videoElement = $("#" + this.playerId);
        if (this._videoElement.length === 0) {
            this._videoElement = $("<div>").attr("id", this.playerId).appendTo("#movie-player-container");
        }
        this._createPlayer();
        return true;
    },
    unload: function()
    {
        this.stop();
        flowplayer.instances[0].destroy();
    },
    getCurrentTime: function() {
        if (this.plugin) return this.plugin.currentTime * 1000;
    },
    _createPlayer: function() {
        if (!this.playlist) return false;
        try {
            var type = this.playlist.getType();
            var playlist = this.playlist.getPlaylistFiles();

            var live = false;
            if (type === 'event') {
                
                if (_.isEmpty(playlist)) {
                    this.trigger("mediaplayer:stream:offline");
                    return false;

                }
                live = true;

            }

            var _this = this;
            var subs = {};

            if (this.subtitles) {
                subs = this.getSubtitleConfig();
            }

            $log("Initializing flowplayer to "+ this.playerId + " element with playlist " + JSON.stringify(playlist));
            this.plugin = flowplayer('#' + this.playerId, {
                token: App.Settings.Player.flowplayer_fp7_token,
                auto_orient: true,
                autoplay: true,
                muted: false,
                engine: 'hlsjs',
                live: live,
                embed: false,
                hls : { native: true },
                src: playlist,
                subtitles: subs,
                plugins: [
                    'subtitles',
                    'qsel',
                    'keyboard',
                    'chromecast',
                    'airplay'
                ]
            }).on('error', function(e) { _this.trigger("mediaplayer:error", e.data);});

            this.plugin.on('loadeddata', function(e) {

                var video = e.target;
                _this.active();
                _this.plugin.togglePlay(true);

                if (_this.subtitles) {
                    _this.subtitles.loadLanguage();
                }

                _this.trigger("mediaplayer:ratio:change", { width: video.videoWidth, height: video.videoHeight});
                _this.plugin.on("pause", function(e) {
                    _this.trigger("mediaplayer:pause");
                });
                _this.plugin.on("playing", function(e) {
                    _this.trigger("mediaplayer:resume");
                });
                _this.plugin.on('error', function(err) {

                    _this.trigger("mediaplayer:error", err);
                });

                _this.plugin.on("ended", function(e) {
                    _this.trigger("mediaplayer:onstop");
                });
                _this.plugin.on("timeupdate", function(e) {
                    _this.trigger("mediaplayer:timeupdate");
                });

                _this.plugin.on("seeked", function(e) {

                    $log("Seeking to " + App.Utils.convertMstoHumanReadable(e.target.currentTime * 1000).toString());
                    _this.trigger("mediaplayer:onseek", e.target.currentTime);
                });
                _this.plugin.on("seeking", function(e) {
                    $log("seeking from:" + App.Utils.convertMstoHumanReadable(e.target.currentTime * 1000).toString());
                    _this.trigger("mediaplayer:onbeforeseek");
                });
                $(".flowplayer a.fp-brand").remove();
                $(".flowplayer a[href*='flowplayer.org']").remove();
            });
        } catch (err) {
            alert(err.message);
        }
        return true;
    },
    /**
     * Get configuration for FP7 player
     * @return new Object(value?: any)
     **/
    getSubtitleConfig: function() {

        if (App.Settings.Player.enable_legacy_subtitles === true) {
            $log("Legacy subtitles enabled, not loading VTT");
            return {};
        }
        if (!this.subtitles) {
            return {};
        }
        if (_.isEmpty(this.subtitles.subtitles)) {
            return {};
        }

        var tracks = _.map(this.subtitles.subtitles, function (item) {
            
            var file = App.Settings.Player.subtitles_url + item.file;
            if (App.Settings.Player.convert_srt_to_vtt === true) { 
                file = file.replace('.srt','.vtt');
            }
            return {label: item.language, kind: 'subtitles', src: file, is_default: (item.code === 'et' || item.code === 'ee') };
        });
        var config = {tracks: tracks};

        return config;
    },    
    _playVideo: function() {
        this.currentStream = this.playlist.nextFile();
        this.type = this.playlist.getType();        
        $log(" SETTING CURRENT STREAM TO: " + this.currentStream.src);
        this.play();

    },
    _initSubtitles: function(content) { 
        $log("Initializing subtitles");

        if (this.subtitles) {
            this.subtitles.unload();
            this.subtitles.unbind();
            this.subtitles.destroy();
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
        this.enableSubtitles();

    },
    loadSubtitles: function(subtitles) {
        var code = subtitles.code;
        this.subtitles.handleSubtitleSelection(code);
    },
    disableSubtitles: function() {
        if (this.subtitles) {
            this.subtitles.disable();
            this.trigger("mediaplayer:subtitles:disabled");
        }
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
                this._stopTrackingEvents();
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
            this.wasMuted = this.plugin.muted;
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
        return this.plugin !== false && this.plugin.hasState('is-loaded');
    },
    playing: function() {
        var playing = (this.plugin && this.plugin.hasState('is-playing') ? true : false);
        return playing;
    },
    duration: function() {
        if (_.isNaN(this.plugin.duration)) {
            return null;
        } else {
            return Math.floor(this.plugin.duration * 1000);
        }
    },
}
_.extend(App.MediaPlayer, Backbone.Events);
_.extend(App.MediaPlayer, App.Player.Platforms.Core);