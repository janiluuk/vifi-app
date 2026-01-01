App.Player = {};
App.Player.Platforms = {};
App.Player.MediaPlayer = Backbone.Model.extend({
    session: false,
    content: false,
    player: false,
    subtitles: {},
    playlist: {},
    ready: false,
    type: 'vod',
    ratio: 9 / 16,
    initialize: function(options) {
        if (this.ready) return false;
        _.bindAll(this, 'load');

        this.content = new App.Models.FilmContent({
            session: options.session,
            player: this

        });

        this.playlist = new App.Player.Playlist;
        if (options && undefined != options.session) {
            this.set("session", options.session);
        }
        if (options && undefined != options.movie) {
            this.set("movie", options.movie);
            this.load(options.movie);
        }

        this.player = App.MediaPlayer;
        this.content.on('content:subtitles:ready', this.onSubtitlesReady, this);
        this.content.on("content:ready", this.onContentReady, this);
        this.player.on("mediaplayer:timeupdate", this.onTimeUpdate,this);
        this.player.on("mediaplayer:pause", this.disableSubtitles, this);
        this.player.on("mediaplayer:resume", this.enableSubtitles, this);
        this.player.on("mediaplayer:error", this.onPlayerError, this);
        this.player.on("mediaplayer:offline", this.onPlayerOffline, this);        
        this.player.on("subtitles:unload", this.disableSubtitles, this);
        this.player.on("subtitles:load", this.loadSubtitles, this);
        if (App.Settings.debug === true) {
            this.player.on("all", this.onPlayerAction, this);
        }
        this.player.on("mediaplayer:onbeforeseek", this.disableSubtitles, this);
        this.player.on("mediaplayer:onseek", this.enableSubtitles, this);
        this.player.on("mediaplayer:ratio:change", this.onChangeRatio, this);
        this.on("mediaplayer:stop", this.stop, this);
        this.on("mediaplayer:resume", this.play, this);
        this.on("change:movie", this.load, this);
        this.on('controlbar:subtitles:change', this.onSubtitlesChange, this);

        this.ready = true;
    },

    onPlayerAction: function(evt, arg, arg2) {

        if (App.Settings.debug === false) return;
        $log("Got player event: " + evt);
        var parts = evt.split(":");
        var evt = parts.shift();
        var action = parts.shift();
        app.router.trigger("action", evt, action, "Mediaplayer event on " + app.platform.name);

    },

    onPlayerOffline: function(evt) {
        this.trigger("player:offline", evt.response);            
    },

    onPlayerError: function(evt) {
        if (!evt || !evt.fatal) return false;
        if (evt.fatal == true) {
            this.trigger("player:offline", evt.response);            
        }
    },
    onChangeRatio: function(video) {
        if (undefined !== video) {
            var ratio = video.height / video.width;
            this.ratio = ratio;
            $log("setting ratio to " + ratio);
            this.trigger("player:resize", ratio);
        }
    },
    onContentReady: function(content) {

        this.content.set("endingtime", this.getEndingTime(this.content.get("running_time")));
        var _this = this;
        _this.playlist.addFiles(_this.content);

        this.player.speedtest(function(bitrate) {

            if (_this.player.init(_this.playlist)) {
                var files = _this.playlist.getPlaylistFiles();
                
                var file = "";
                if (files) {
                    file = files[0].src;
                }
                app.router.trigger("action", "player", "play", "Playing content " + file);
                _this.trigger("player:ready", _this.content);

            }
        }.bind(this));

    },
    onSubtitlesChange: function(code) {

        if (code == "reset") {
            var item = this.content.get("subtitles");
        } else {

            var item = _.filter(this.content.get("subtitles"), function(item) {
                return item.code == code;
            });
        }

        if (typeof(item) !== "undefined" && _.isEmpty(item) !== true) {
            var file = item[0].file;
            this.loadSubtitles(item[0]);
        } else {
            this.disableSubtitles();

        }
    },

    onTimeUpdate: function(time) {
        var currentTime = Math.ceil(this.getCurrentTime() / 1000);
        if (currentTime == this.currentTime) return;
        this.currentTime = currentTime;
        this.trigger("player:timeupdate", currentTime);
    },

    onSubtitlesReady: function(subtitles) {
        this.player._initSubtitles(subtitles);
    },

    loadSubtitles: function(filename) {
        this.player.loadSubtitles(filename);
        this.trigger("subtitles:loaded");
    },

    disableSubtitles: function() {
        this.player.disableSubtitles();
        this.trigger("subtitles:unloaded");

    },
    enableSubtitles: function() {
        this.player.enableSubtitles();
        this.trigger("subtitles:enabled");
    },
    load: function(movie) {

        if (!movie) return false;
        var id = movie.get("id");

        app.router.trigger("action", "player", "load", "Loading " + movie.get("title"));
        $log("[Player] Loading content " +id);
        this.content.load(id);
    },
    play: function() {
        this.player.play();
    },
    stop: function() {
        if (this.player) {
            this.player.stop();
        }
    },
    unload: function() {
        $log("Unloading player");

        this.stop();
        if (this.player.subtitles) {
            this.player.subtitles.unload();
        }
    },
    isReady: function() {
        return this.player && this.player.isReady();
    },
    /*
     * Calculate ending time for the film.
     * @params duration - total length of film in minutes
     * @params offset - current position of the film which will be reducted
     */
    getEndingTime: function(duration, offset) {
        if (!offset) offset = 0;
        if (!duration || duration == "") return false;
        duration = duration - offset;
        return App.Utils.minutesToTime(duration);
    },
    getCurrentTime: function() {
        return this.player.getCurrentTime() > 0 ? this.player.getCurrentTime() : 0;
    },
    verifyContent: function() {
        return true;
    }
});
_.extend(App.Player.MediaPlayer, Backbone.Events);
/**
 *
 *  Vifi Media Player
 *
 *  author: Jani Luukkanen
 *  janiluuk@gmail.com
 *
 */
App.Player.Platforms.Core = {
    _active: false,
    _eventsToTrack: ['loadstart', 'ended', 'timeupdate', 'play', 'pause', 'loadstart', 'timeupdate', 'error', 'loadeddata', 'volumechange', 'duration'],
    _videoElement: null,
    wasMuted: false,
    playerId: "player-container",
    name: "MediaPlayer",
    userBitrate: 1000,
    _testSize: 200000,
    speedtest: function(callback) {
        callback = callback || $noop;
        if (!App.Settings.Player.speedtest_url) {
            if (callback) callback();
            return;
        }
        //$log(" ___ PERFORMING SPEEDTEST ___ ");
        var _this = this;
        var imageAddr = App.Settings.Player.speedtest_url + "?n=" + Math.random();
        var startTime, endTime;
        startTime = (new Date()).getTime();

        function getResults() {
            //  $log(" ___ SPEEDTEST SUCCESS ___ ");
            var duration = Math.round((endTime - startTime) / 1000);
            if (duration === 0 ) duration = 1;
            var bitsLoaded = _this._testSize * 8;
            var speedBps = Math.round(bitsLoaded / duration);
            var bitrate = (speedBps / 1024).toFixed(2);

            if (parseInt(bitrate) > 100) _this.userBitrate = bitrate;
            if (callback) callback(bitrate);

            $log("___ USER BITRATE DETECTED: " + bitrate + " ____");
        }
        var download = new Image();
        download.onload = function() {
            endTime = (new Date()).getTime();
            getResults();
        }
        download.src = imageAddr;

    },
    setVideoElement: function(element) {
        this._videoElement = $(element);
    },
    _trackEvents: function() {
        $log("___ TRACK EVENTS CALLED ___ ");
        if (this.eventsBound) return;
        //$log(" ___ BINDING EVENTS ___ ");
        this.plugin.bind(this._eventsToTrack.join(" "), this._eventHandler, this);
        this.eventsBound = true;
    },

    active: function() {
        this._active = true;
        //        App.KeyHandler.bind("all", this._keyhandler, this);
    },
    deactive: function() {
        this._active = false;
        //      App.KeyHandler.unbind("all", this._keyhandler);
    },
    unload: function() {
        this.stop();
    },
    setPlaylist: function(playlist) {
        $log(" Setting new Playlist ");
        this.trigger("mediaplayer:onnewplaylist", playlist);
        this.stop(true);
        this.playlist = playlist;
        this.currentIndex = playlist.currentIndex;
        this.currentStream = null;
        $(this._videoElement).show();
    },
    setCurrentIndex: function(index) {
        $log(" Setting current Index to "+index);
        if (this.playlist) {
            this.currentIndex = index;
            this.playlist.setCurrentIndex(index);
        }
    },
    nextVideo: function() {
        this.currentStream = this.playlist.nextFile();
        this.type = this.playlist.getType();

        if (this.currentStream) {
            this.trigger('mediaplayer:onnextvideo', this.playlist.currentItemIndex());
            this._playVideo();
        } else {
            this.trigger("mediaplayer:onplaylistend");
        }
    },
    play: function() {


        if (!this.currentStream && !(this.currentStream = this.playlist.nextFile())) {

            $log("Can't press play on a mediaplayer without a content");
            return;
        }
        if (!this.plugin) {
            alert("no player found");
            return false;
        }

        if (this.plugin && !this.plugin.paused && (typeof(this._videoElement.playbackRate) !== 'undefined' && this._videoElement.playbackRate != 1)) {
            $log(" Restting Playback Rate");
            this._videoElement.playbackRate = 1;
        } else if (this._videoElement && this.currentStream == null) {
            $log(" Playing Next File ")
            this._playVideo();
        } else if (this._videoElement) {
            if (!this.plugin.playing) {
                // $log(" Calling Video Element Play")
                this.resume();

            } else {
                // $log(" Calling Video Element Pause ")
                this.pause();
            }
        }
        this.active();
        if (App.Settings.debug === true) this._trackEvents();

    },
    resume: function() {
        try {
            this.plugin.play();
            this.trigger("mediaplayer:onplay");
        } catch (e) {
            $log(" FAILED TO PLAY VIDEO: " + e);
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
    _keyMap: {
        'onPlay': this.play,
        'onPause': this.pause,
        'onRew': this.rewind,
        'onFF': this.fastforward,
        'onStop': this.stop,
    },
    _keyhandler: function(event) {
        $log("MediaPlayer Event Handler Got: " + event);
        var event = event.replace("keyhandler:", "");
        switch (event) {
            case 'onPause':
                this.pause();
                break;
            case 'onPlay':
                this.play();
                break;
            case 'onStop':
                this.stop();
                break;
            case 'onRew':
                this.rewind();
                break;
            case 'onMute':
                this.mute();
                break;
            case 'onFF':
                this.fastforward();
                break;
        }
    },

    _eventHandler: function(e) {
        if (e.type != 'progress') $log(e.type);
        switch (e.type) {
            case 'progress':
                this.trigger("mediaplayer:timeupdate", Math.round(e.currentTarget.currentTime * 1000));
                break;
            case 'fullscreen':
                this.trigger("mediaplayer:fullscreen");
                break;
            case 'fullscreen-exit':
                this.trigger("mediaplayer:fullscreen-exit");
                break;
            case 'finish':
                this.trigger("mediaplayer:mediaend", this.playlist.currentItemIndex());
                this.nextVideo();
                break;
            case 'resume':
                this.trigger("mediaplayer:play", this._playVideo());
                break;
            case 'pause':
                this.trigger("mediaplayer:pause");
                break;
            case 'seek':
                this.trigger("mediaplayer:seek");
                break;
            case 'beforeseek':
                this.trigger("mediaplayer:beforeseek");
                break;
            case 'error':
                this.trigger("mediaplayer:videoerror");
                break;
            case 'volume':
                $log(" VOLUME CHANGE EVENT ");
                if (player.wasMuted != this.muted) {
                    this.trigger("mediaplayer:muted");
                }
                this.trigger("mediaplayer:volumechange", e.currentTarget.volume);
                break;
        }
    },
    _stopTrackingEvents: function() {
        $log(" UNBINDING MEDIA EVENTS");
        if (this.plugin)
        this.plugin.unbind();
        this.eventsBound = false;
    }
}


App.Player.Playlist = function() {
    this.files = [];

    this.currentIndex = 0;
    this.looping = true;
    /*
    A Playlist Format, an Array of Arrays of Hashes

    [
        {
            // First Video
            renditions: [
                {
                    url: "http://testvids.adifferentengine.com/MyTest-400.mp4",
                    bitrate: 400,
                },
                {
                    url: "http://testvids.adifferentengine.com/MyTest-1500.mp4",
                    bitrate: 1500
                },
                {
                    url: "http://testvids.adifferentengine.com/MyTest-3000.mp4",
                    bitrate: 3000
                }
            ]
        }
    ]

    */
    this.resetIndex = function() {
        this.currentIndex = 0;
    },
    this.currentItemIndex = function() {
        return this.currentIndex - 1;
    },
    this.nextFile = function() {
        if (this.currentIndex == this.files.length) {
            $log(" REACHED THE END OF PLAYLIST");
            this.resetIndex();
            if (!this.looping) return null;
        }
        this.setCurrentIndex(this.currentItemIndex() + 1);
        // Should be the largest bitrate
        var file = this.getPlaylistItem(this.files[this.currentIndex]);

        return file;
    },

    this.getType = function() {
        if (!_.isEmpty(this.files)) return this.files[this.currentIndex].get("type");
        return "unknown";
    }
    this.getPlaylistItem = function(content) {
        if (!content) return false;

        var profiles = content.get("videos");
        if (_.isEmpty(profiles)) return false;

        if (this.userBitrate) user_bitrate = parseInt(this.userBitrate);
        else user_bitrate = parseInt(App.MediaPlayer.userBitrate);

        var file = profiles[0];
        $log("Parsing"+JSON.stringify(profiles));
        
        var file_bitrate = parseInt(file.bitrate);
        var min_bitrate = file_bitrate;
        _.each(profiles, function(profile) {
            var profile_bitrate = parseInt(profile.bitrate);

            $log(" TESTING file.bitrate: " + profile.bitrate + ", my bitrate: " + user_bitrate);
            if (profile_bitrate > file_bitrate && profile_bitrate < user_bitrate) {

                file = profile;
            }

            if (min_bitrate > profile_bitrate) min_bitrate = profile.bitrate;
        });
        $log("Minimum bitrate: " + min_bitrate);

        $log("Choosing " + file.src + " as the default video");

        return file;
    },
    this.getPlaylistFiles = function() {
        var content = this.nextFile();
        if (this.getType() == 'event') {
            var files = this.generateEventPlaylistItem();
        } else {
            var files = this.generatePlaylistItem(content.src);
        }
        return files;
    }
    this.getBitrates = function() {
        var profiles = this.files[this.currentIndex].get("videos");
        var bitrates = _.pluck(profiles, "bitrate");
        return bitrates;
    }
    this.generatePlaylistItem = function(file) {
        if (!file) return false;
        if (file[0] == '/') file = file.substring(1);
        var mp4_url = App.Settings.Player.mp4_url + file;
        var mpegurl = App.Settings.Player.hls_url + '/' + file + '/playlist.m3u8'
        var playlist_item = [

            {
                type: 'application/x-mpegurl',
                mpegurl: mpegurl,
                src: mpegurl,

            },

            {
                type: 'video/flash',
                flash: 'mp4:' + file.replace('.mp4', ''),
                src: 'mp4:' + file.replace('.mp4', '')

            }
        ];

        return playlist_item;
    },

    this.generateEventPlaylistItem = function() {
        var playlist_item = this.files[this.currentIndex].get("videos");
        return playlist_item;
    },    
    this.addFiles = function(files) {
        this.files.push(files);
    }
    this.addPreroll = function(renditions, isAd) {
        var isAd = _.isNull(isAd) ? true : isAd; // We default to it being an ad.
        if (!_.isArray(videos)) videos = [videos];
        this.files.unshift({
            isAd: isAd,
            videos: videos
        });
    }
    this.addItem = function(videos, isAd) {
        var isAd = _.isNull(isAd) ? false : isAd;
        if (!_.isArray(videos)) videos = [videos];
        this.files.push({
            isAd: isAd,
            videos: videos
        });
    }
    this.setUserBitrate = function(bitrate) {
        this.userBitrate = bitrate;
    }
    this.setCurrentIndex = function(index) {
        $log("Playlist index set to: " + index)
        this.currentIndex = index;
    }
    this.addUrl = function(url) {
        this.files.push([{
            profile: null,
            src: url,
            bitrate: 0,
            code: 0,
        }]);
    }
    this.loop = function(toLoop) {
        this.looping = !!toLoop; // force a boolean
    };
    return this;
};

App.Player.Subtitles = Backbone.Model.extend({

    defaults: function() {
        return {
            subtitledata: false
        }
    },
    subtitles: {},
    currentSubtitle: null,
    defaultCode: 'ee',
    srtUrl: App.Settings.Player.subtitles_url,
    subtitleFile: '',
    language: 'ee',
    ival: false,
    enabled: true,
    initialize: function() {
        _.bindAll(this, 'load', 'start', 'start', 'enable', 'disable', 'loadLanguage');
        this.on("button:player-subtitles", this.handleSubtitleSelection, this);
    },

    /**
     * React to subtitle selection.
     * @param {string} sel Selected code (ee,fi ..)
     *
     *
     */

    handleSubtitleSelection: function(sel) {

        if (sel == "none") { this.disable(); return;}
        if (sel == "reset") { sel = this.defaultCode; }
        if (this.subtitles) {
            this.loadLanguage(sel);
        }
    },

    /**
     * Disable subtitles
     * @return {void}
     */

    disable: function() {
        this.trigger("subtitles:hide");
        this.enabled = false;
        this.trigger("subtitles:disabled");
        $log("Disabling subtitles");
        if (this.ival) clearInterval(this.ival);
    },

    /**
     * Enable subtitles
     * @return {void}
     */

    enable: function() {
        if (this.enabled) return;
        this.trigger("subtitles:hide");
        this.enabled = true;
        $log("Enabling subtitles");
        this.trigger("subtitles:enabled");
        this.start();

    },

    /**
     * Disable timer and set all to defaults
     *
     * @return boolean True if success
     */

    unload: function() {

        if (!this.enabled) return false;
        this.disable();
        this.subtitles = false;
        this.currentSubtitle = false;
        this.language = false;
        this.trigger("subtitles:unloaded");

        return true;
    },

    /**
     *
     * Parse a string and cut it into timecode keyed object + set the new
     * data to be ready for processing
     *
     * @param {string} srt Complete SRT string
     *
     * @return {Object} Object containing timecoded entries for showing the
     * captions.
     *
     */

    parseSrt: function(srt) {
        if (!srt) return {};
        srt = srt.replace(/\r\n|\r|\n/g, '\n');
        srt = App.Utils.strip(srt);
        var srt_ = srt.split('\n\n');
        var subtitledata = {};

        for (s in srt_) {
            st = srt_[s].split('\n');
            if (st.length >= 2) {

                n = st[0];
                i = App.Utils.strip(st[1].split(' --> ')[0]);
                o = App.Utils.strip(st[1].split(' --> ')[1]);
                t = st[2];
                if (st.length > 2) {
                    for (j = 3; j < st.length; j++) t += '\n' + st[j];
                }
                is = App.Utils.toSeconds(i);
                os = App.Utils.toSeconds(o);
                subtitledata[is] = {
                    i: i,
                    is: is,
                    os: os,
                    o: o,
                    t: t
                };
            }
        }
        this.set("subtitledata", subtitledata);
        this.trigger("change:subtitledata", subtitledata);

        return subtitledata;
    },

    /**
     * Start periodic polling
     *
     */

    start: function() {

        this.trigger("subtitles:hide");
        this.currentSubtitle = -1;
        var subtitledata = this.get("subtitledata");
        //$log(subtitledata);

        //if (!subtitledata) throw new("No subtitle data to parse!");

        this.ival = setInterval(function() {
            if (!this.enabled) clearInterval(this.ival);
            var currentTime = app.player.getCurrentTime();
            var subtitle = -1;
            for (s in subtitledata) {
                if (s > currentTime) break;
                subtitle = s;
            }

            if (subtitle > 0) {
                if (subtitle != this.currentSubtitle) {
                    if (currentTime > 0) this.trigger("subtitles:show", subtitledata[subtitle].t);
                    this.currentSubtitle = subtitle;
                    $log("Setting subtitle at " + currentTime + " - " + subtitledata[subtitle].t);
                    //$log(app.player.subtitles.subtitledata[subtitle]);
                } else if (subtitledata[subtitle].os < currentTime) {
                    this.trigger("subtitles:hide");
                }
            }
        }.bind(this), 100);
    },
    /**
     * Load collection containing App.Player.SubtitleFile items
     *
     * @param {App.Player.SubtitleFileCollection} subtitles Collection containing Subtitle items
     * @param {boolean} nodefault Set to true if default language should not be loaded.
     *
     */

    load: function(subtitles, nodefault) {

        if (!subtitles) return false;
        this.subtitles = {};
        var that = this;
        var i = 0;
        $(subtitles).each(function() {
            var code = this.code;
            that.subtitles[code] = this;
            i++;
        });

        $log("Downloaded " + i + " subtitles");
        this.trigger("subtitles:added", subtitles);
        if (!nodefault) this.loadLanguage();
    },

    /**
     *
     * @param {string} code Country identificator (f.ex fi,se,ee)
     *
     * @return {boolean} True if successful
     */

    loadLanguage: function(code) {
        if (!App.Settings.Player.enable_legacy_subtitles) {
            $log("Legacy subtitles disabled, not loading SRT");
            return false;
        }

        if (!code) code = this.defaultCode;

        if (this.subtitles && this.subtitles[code]) {

            this.subtitleFile = this.srtUrl + this.subtitles[code].file;
            $log("Loaded " + code + " language from " + this.subtitleFile);
            if (this.ival) clearInterval(this.ival);
            this.enable();
            this.language = code;
            this.trigger("subtitles:load", code);
            this.trigger("subtitles:loadfile", this.subtitleFile);
            this.start();

            return true;
        }

        return false;
    },


});
_.extend(App.Player.Subtitles, Backbone.Events);