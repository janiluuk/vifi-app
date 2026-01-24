
App.Models.FilmContent = App.Models.ApiModel.extend({
    path: function() {
        return 'content/' + this.get("id");
    },
    params: {},
    defaults: function() {
        return {
            'id': false,
            'videos': [{
                'src': '',
                'profile': '',
                'code': ''
            }],
            'images': {
                'thumb': '',
                'poster': ''
            },
            'subtitles': [{
                'filename': '',
                'code': '',
                'language': ''
            }],
            session: {},
        }
    },
    initialize: function(options) {
        this.on("change:id", this.onSessionLoad, this);
        this.on("change:videos", this.onLoadContent, this);
        this.on("change:subtitles", this.onLoadSubtitles, this);

        if (options && undefined !== options.player) {
            this.set("player", options.player);
        }
    },
    /*
     * Fetch Film session and auth code from the user ticket if they exist
     */
    onSessionLoad: function(film) {
        this.params = {};
        var id = this.get("id");
        if (id) { 

            $log("[Content] Looking for existing ticket with film id: " + id);
            var session = this.get("session");
            if (session.profile.getMovieSession(id)) this.params.session_id = session.profile.getMovieSession(id);
            if (session.profile.getMovieAuthCode(id)) this.params.auth_code = session.profile.getMovieAuthCode(id);
            if (_.isEmpty(this.params) === false) {
                $log("[Content] Found existing ticket: " + JSON.stringify(this.params));
            } else {
                $log("[Content] No existing ticket for film id: " + id);
            }
        }
    },
    /*
     * Reset content items to defaults
     */
    resetContent: function() {
        this.set("videos", false);
        this.set("subtitles", false);
        $log("[Content] Reset content");
    },
    /*
     * Load defined film content to the player
     *
     * @param int id - Id of the content to be included
     * @return jQuery.deferred
     *
     */
    load: function(id) {
        this.set("id", id);
        var deferred = new $.Deferred();
        this.fetch().done(function() {
            deferred.resolve();
        }).error(function() {
            deferred.reject();
        });
        return deferred.promise();
    },
    onLoadContent: function(event) {
        if (this.get("videos").length > 0) this.trigger("content:ready", this.get("videos"));
        else this.trigger("content:reset");
    },

    onLoadSubtitles: function(event) {
        if (this.get("subtitles") !== null && this.get("subtitles").length > 0) this.trigger("content:subtitles:ready", this.get("subtitles"));
    },
    /*
     * Add subtitles to the content as their own collection
     * @param array
     *
     */
    addVideos: function(videos) { 
        var videofiles = [];
        _.each(videos, function(video) { 
            var videofile = new App.Player.VideoFile();
            videofile.set("bitrate", video.bitrate);
            videofile.set("src", video.mp4);
            videofile.set("profile", video.profile);
            videofiles.push(videofile);
        });
        var collection = new App.Player.VideoFileCollection(videofiles);
        this.set("videos", collection);
        $log("[Content] Got videos: " + collection.toJSON());
        this.trigger("content:videos:loaded", this.get("videos"));
    },
    /*
     * Add subtitles to the content as their own collection
     * @param array
     *
     */
    addSubtitles: function(subtitles) { 
        var subs = [];
        _.each(subtitles, function(video) { 
            var subtitle = new App.Player.SubtitleFile();
            subtitle.set("language", video.language);
            subtitle.set("file", video.file);
            subtitle.set("code", video.code);
            subs.push(subtitle);
        });
        var collection = new App.Player.SubtitleFileCollection(subs);
        this.set("subtitles", collection);
    },
    getVideos: function() {
        return this.get("videos");
    }
});
App.Models.EventContent = App.Models.FilmContent.extend({
    defaults: function() {
        return {
            'id': false,
            'videos': [{
                'src': '',
                'profile': '',
                'code': '',
                'type' : '',
                'bitrate': 0
            }],
            'images': {
                'backdrop': '',
                'poster': ''
            },
            'auth_code': '',
            session: {},
        }
    },

    path: function() {
        this.params.auth_code = this.get("auth_code");
        return 'event/content/' + this.get("id");
    },
});


App.Player.VideoFile = Backbone.Model.extend({
    defaults: { 
        bitrate: false,
        src: false,
        active: false,
        type: false,
        resolution: false,
        selected: false
    },
    getPlaylist: function() {
        var file = this.get("src");
        if (!file) return false;
        if (file[0] === '/') file = file.substring(1);
        var mp4_url = App.Settings.mp4_url + file;
        var mpegurl = App.Settings.hls_url + '/' + file + '/playlist.m3u8';
        var playlist_item = [{
            type: 'video/mp4',
            src: mp4_url,
            mp4: mp4_url
        }, {
            type: 'application/x-mpegurl',
            mpegurl: mpegurl,
            src: mpegurl,
        }, {
            type: 'video/flash',
            flash: 'mp4:' + file.replace('.mp4', ''),
            src: 'mp4:' + file.replace('.mp4', '')
        }];
        return playlist_item;
    }
});

App.Player.VideoFileCollection = Backbone.Collection.extend({
    model: App.Player.VideoFile,
    findMinBitrate: function(min_bitrate) { 
        var items = this.filter(function(item) {
            if (item.get("bitrate") < min_bitrate) return item;
        });
        if (_.size(items) === 0) {
            items.push(this.getLowest());
        }
        return items;
    },
    findClosestBitrate: function(bitrate) {
        var collection = this.findMinBitrate(bitrate);
        var curr = collection[0];
        if (collection.size === 1) return curr;
        _.each(collection.findMinBitrate(bitrate), function(item) {
            if (Math.abs(bitrate - item.get("bitrate")) < Math.abs(bitrate - curr.get("bitrate"))) curr = item;
        });
        return curr;
    },
    getBitrates: function() {
        return this.pluck("bitrate");
    },
    setActive: function(file) { 
        return this.map(function(item) {
            if (item === file) item.set("active", true);
            else item.set("active", false);
        });
    },
    getActive: function() { 
        return this.map(function(item) {
            if (item.get("active") === true) return item;
        });
    },
    getLowest: function() {
        return this.min(this.pluck("bitrate"));
    },
    getHighest: function() {
        return this.max(this.pluck("bitrate"));
    }
});
App.Player.SubtitleFile = Backbone.Model.extend({
    defaults: {
        'filename': '',
        'code': '',
        'language': '',
        'active': false
    }
});
App.Player.SubtitleFileCollection = Backbone.Collection.extend({
    model: App.Player.SubtitleFile
});
/*
App.Player.Playlist = Backbone.Collection.extend({
    model: App.Player.Content,
    defaults : { 
      looping: false,
      currentIndex : 0
    },
    setCurrentIndex : function(index) {
      if (undefined === typeof(this.models[index])) return false;
      $log("Playlist index set to: " + index);
      this.set("currentIndex", index);
      this.set("activeItem", this.models[index]);
      return true;
    },
    isLast: function() {
      return this.get("currentIndex")+1 === this.size();
    },
    isLooping: function() {
        return this.get("looping");
    },
    loop: function(toLoop) {
        this  loopoping = !!toLoop; // force a boolean
    },
    currentItem: function() {
        var currentIndex = this.get("currentIndex");
        var item = this.models[currentIndex];
        return item;
    },
    currentIndex: function() {
      return this.get("currentIndex");
    },
    hasNext: function() {
      var next = this.get("currentIndex")+1;
      return (undefined === typeof(this.models[next])) ? false : true;
    },
    resetIndex : function() {
      this.set("currentIndex",0);
    },
    nextItem : function() {
      if (this.isLast()) {
        $log(" REACHED THE END OF PLAYLIST");
        this.resetIndex();
        if (!this.isLooping()) return null;
      }
      this.setCurrentIndex(this.currentIndex() + 1);
      var item = this.currentItem();
      return file;
    }
});
_.extend(App.Player.Playlist, Backbone.Events);
*/
/*
var videos = [
    new App.Player.VideoFile({
        "bitrate": 1500,
        "src": 'fff.mp4',
        'type': 'video/mp4'
    }),
    new App.Player.VideoFile({
        "bitrate": 6500,
        "src": 'asdjaisdj.mp4',
        'type': 'video/mp4'
    }),
    new App.Player.VideoFile({
        "bitrate": 500,
        "src": 'add.mp4',
        'type': 'video/mp4'
    }),
    new App.Player.VideoFile({
        "bitrate": 200,
        "src": 'asdjaisdj.mp4',
        'type': 'video/mp4'
    }),
    new App.Player.VideoFile({
        "bitrate": 2500,
        "src": 'asdjaisdj.mp4',
        'type': 'video/flv'
    })
];
var coll = new App.Player.VideoFileCollection(videos);
*/