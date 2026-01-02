/**
 
 *
 *  Vifi Media Player for Flash
 *
 *  author: Jani Luukkanen
 *  janiluuk@gmail.com
 *
 */

App.MediaPlayer = {
    content: null,
    currentStream: null,
    plugin: false,
    allowFastFoward: true,
    init: function(playlist) {

        if (playlist) {
            this.setPlaylist(playlist);
            this.currentStream = playlist.nextFile();
        }
        _.bindAll(this, 'loadSubtitles');

        this._videoElement = $("#" + this.playerId);
        if (!this._videoElement) {
            $("<div>").attr("id", this.playerId).appendTo("body");
        } else {
            //  this._trackEvents();
        }

        return this._createPlayer();

    },
    loadFile: function(file) {

        if (this.plugin)
            this.plugin.setClip({
                url: "mp4:" + file
            });

    },
    formatUrl: function(url) {
        if (!url) return false;
        return url.substring(url.length - 3, url.length) == 'mp4' ? url.substring(url.length - 3, url.length) + ':' + url : url;
    },
    _createPlayer: function() {

        if (!this.playlist) return false;
        if (!this.currentStream) this.currentStream = this.playlist.nextFile();

        var url = this.formatUrl(this.currentStream.src);

        if (this.plugin) this.plugin = false;

        var _this = this;

        this.plugin = flowplayer(this.playerId, {
            src: '/swf/flowplayer.commercial-3.2.15.swf',
            wmode: 'opaque'
        }, {
            key: App.Settings.Player.flowplayer_flash_key,
            log: {
                level: 'none'
            },
            // change the default controlbar to modern
            onStart: function(clip) {
                var f = this;

            },
            onResume: function() {
            },
            onKeypress: function(key) {
                alert(key);
            },
            onMouseOver: function() {
                _this.trigger("mediaplayer:mouseover");
            },
            onMouseOut: function() {
                _this.trigger("mediaplayer:mouseout");


            },
            onFullscreen: function() {
                _this.trigger("mediaplayer:fullscreen");

            },
            onFullscreenExit: function() {
                _this.trigger("mediaplayer:fullscreen-exit");


            },
            onError: function() {
                _this.trigger("mediaplayer:error");


            },

            // canvas background
            canvas: {
                backgroundGradient: 'none'
            },
            clip: {
                autoBuffering: true,
                autoplay: false,
                scaling: 'fit',
                provider: 'rtmp',
                connectionProvider: 'secure',
                url: url,
                accelerated: true,
                fadeInSpeed: 7000,
                // on last second, fade out screen
                onLastSecond: function() {
                    this.getScreen().animate({
                        opacity: 0
                    }, 3000);
                },
                onSeek: function() {

                    _this.trigger("mediaplayer:seek");
                },
             
                onFinish: function() {

                    _this.trigger("mediaplayer:finish");
                },
                // if screen is hidden, show it upon startup
                onStart: function() {
                    this.getScreen().css({
                        opacity: 1
                    });

                    _this.trigger("mediaplayer:ratio:change", $f().getClip());
                }


            },
            plugins: {
                rtmp: {
                    url: '/swf/flowplayer.rtmp-3.2.11.swf',
                    netConnectionUrl: App.Settings.Player.rtmp_url                    
                },
                // the captions plugin
                captions: {
                    url: '/swf/flowplayer.captions-3.2.9.swf',
                    captionTarget: 'content',
                    button: null
                },
                    secure: {
                    url:'/swf/flowplayer.securestreaming-3.2.3.swf',
                    token: 'jambal4ika'
                },
             
                content: {
                    url: '/swf/flowplayer.content-3.2.8.swf',
                    bottom: 7,
                    height: "17%",
                    width: '80%',
                    backgroundColor: 'transparent',
                    backgroundGradient: 'none',
                    border: 0,
                    textDecoration: 'outline',
                    style: {
                        body: {
                            fontSize: '26',
                            fontWeight: 'bold',
                            fontFamily: 'Arial',
                            textAlign: 'center',
                            color: '#FFF683'
                        }
                    }
                }
            }
        }); // .controls("player-controls");

        this.play();
        return this.plugin;

    },

    _playVideo: function() {
        $log(" SETTING CURRENT STREAM TO: " + this.currentStream.src);
        this.plugin.play();
        this.wasMuted = $f().getStatus().muted;
    },
    _initSubtitles: function(content) {  

    },
    loadSubtitles: function(subtitles) {

        var file = App.Settings.Player.subtitles_url + subtitles.file;

        if (typeof($f) === "undefined") return false;

        setTimeout(function() { 
            if (typeof(this.plugin) === "undefined" || typeof(this.plugin.getPlugin("captions")) === "undefined") {
                $log("PLUGIN NOT FOUND");
                setTimeout(function() { 

                    this.loadSubtitles(file);

                }.bind(this),2000);

                return false;
            } else { 
                this.plugin.getPlugin('content').show();
                $f().getPlugin('content').css("opacity",1)
                $log("Enabling subtitles...");
                this.plugin.getPlugin("captions").loadCaptions(0,file);
            }
        }.bind(this),2500);
    },

    disableSubtitles: function() { 
        if (typeof($f) === "undefined") return false;
        this.plugin.getPlugin('content').hide();

    },
    enableSubtitles: function() { 

        if (typeof($f) === "undefined") return false;
        this.plugin.getPlugin('content').show();

    },

    stop: function(forced) {
        if (this.plugin) {
            try {
                this.plugin.pause();
                this.deactive();

                if (!forced) this.trigger("mediaplayer:onstop");
                else $f().unload();

            } catch (e) {} // If this doesn't succeed, it doesn't matter, just die gracefully
        }
    },
    resume: function(forced) {
        if (this.plugin) {
            try {
                this.plugin.play();
                this.trigger("mediaplayer:onplay");
                
            } catch (e) { $log(e); } // If this doesn't succeed, it doesn't matter, just die gracefully

        }
    },
    pause: function() {
        // May get called without the correct initialization, so wrapping in block.
        // This should always fail gracefully.

        try {
            this.plugin.pause();
            this.trigger("mediaplayer:onpause");
        } catch (e) {
            $log(" FAILED TO PAUSE VIDEO: " + e);
        }
    },

    fastforward: function() {
        var currentTime = this.plugin.getTime();
        this.plugin.seek(currentTime + 10);
        this.trigger("mediaplayer:onfastforward");
    },
    rewind: function() {
        var currentTime = this.plugin.getTime();
        this.plugin.seek(currentTime - 10);
        this.trigger("mediaplayer:onrewind", 1);
    },
    getCurrentTime: function() {
        if (typeof($f()) === "undefined") return 0;
	else
        return $f().getTime() * 1000;
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
        return (this.plugin.ready === true);
    },
    playing: function() {
        return (this.plugin.isPlaying() === true) ? true : false;
    },

    duration: function() {
        if (_.isNaN(this.plugin.getClip().duration)) {
            return null;
        } else {
            return Math.floor(this.plugin.getClip().duration * 1000);
        }
    },   
}
_.extend(App.MediaPlayer, Backbone.Events);
_.extend(App.MediaPlayer, App.Player.Platforms.Core);
