window.$noop = function(input) {
    // if more then one return an array.
    if (arguments.length > 1) return Array.prototype.slice.call(arguments, 0);
    else return arguments[0]; // Don't return an array if only one thing came in.
}
window.$log = function(log) { 
    if (App.Settings.debug === true) {
        if (typeof(log) === "object") {
            log = JSON.stringify(log);
        }
        app.trigger("flash", log, 5000);
    }
            console.log(log);

};

window.$debug = function() { 
    if (App.Settings.debug === true) {
            App.Settings.debug = false;
        } else {
            App.Settings.debug = true;
        }
};



window.$error = function(log) { 
    if (App.Settings.debug === true) {
        if (typeof(log) === "object") {
            log = JSON.stringify(log);
        }
        app.trigger("error", log);
        app.trigger("flash", '<b><span class="error">' + log + '</span></b>', 18000);
    }
    console.log('[ERROR]' + log);
};
App.Platforms = {
    platform: null,
    proxy: function() {
        return ""
    }, // Default
    supportedPlatforms: {},
    addSupportedPlatform: function(platform) {
        this.supportedPlatforms[platform.name] = platform;
        if (platform.defaultPlatform == true) {
            this.defaultPlatform = platform;
        }
    },
    init: function() {
        _.each(this.supportedPlatforms, function(platform) {
            if (!platform.defaultPlatform && platform.detectPlatform()) {
                this.platform = platform;
                return;
            }
        }, this);
        if (!this.platform && !this.defaultPlatform) {
            console.log("!!!! NO PLATFORM DETECTED, AND NO DEFAULT PLATFORM !!!!");
            return;
        } else if (!this.platform) {
            //console.log(" COULD NOT DETECT PLATFORM, USING DEFAULT (" + this.defaultPlatform.name + ")");
            this.platform = this.defaultPlatform;
        }
        $log("<< PLATFORM IS: (" + this.platform.name + ") >>");
        this.platform.init();
        this.platform.addPlatformCSS();
        this.platform.fetchMediaPlayer();
    }
}
// Master "Class" for Platforms.
App.Platform = function(name) {
    this.name = name;
    this.defaultPlatform = true;
    this._mediaPlayer = "html5";
    this.start = $noop;
    this.exit = $noop;
    this._keys = {
        KEY_RETURN: 8, // backspace
        KEY_UP: 38,
        KEY_DOWN: 40,
        KEY_LEFT: 37,
        KEY_RIGHT: 39,
        KEY_ENTER: 13, // Enter
        KEY_RED: 65, // a
        KEY_GREEN: 66, // b
        KEY_YELLOW: 67, // c
        KEY_BLUE: 68, // d
        KEY_BACK: 8, // backspace
        KEY_PLAY: 80, // p
        KEY_FF: 190, // .
        KEY_RW: 188, // ,
        KEY_PAUSE: 189,
        KEY_STOP: 83, // s
        KEY_VOL_UP: 187, // +
        KEY_VOL_DOWN: 48, // 0
        KEY_MUTE: 77, // m
        KEY_CANCEL: 27 // ESC
    }
    this.resolution = {
        height: 720,
        width: 1280
    }
    // You can override this if you'd like
    this.init = $noop;
    // Might want to set this to something different
    this.needsProxy = null;
}
App.Platform.prototype.initready = function() {
    $log("<< Platform ready (" + this.name + " " + this.matrix() + " on " + window.screen.width + "x" + window.screen.height + " ) >>");
}
// override this if necesng
// ry
App.Platform.prototype.keys = function() {
    return this._keys;
}
App.Platform.prototype.setMediaPlayer = function(mediaplayer) {
    this._mediaPlayer = mediaplayer;
}
App.Platform.prototype.fetchMediaPlayer = function() {
    if (this._mediaPlayer) {
        //  $log("Adding media player path");
        var path = "/js/platforms/mediaplayer_" + this._mediaPlayer.toLowerCase() + ".js";
        //$log("Adding media player path: " + path);
        $('<script async src="' + path + '" type="text/javascript"></script>').appendTo("head");
        var pluginpath = "/js/vendor/flowplayer." + this._mediaPlayer.toLowerCase() + ".js";
        $log("Adding flowplayer path: " + pluginpath);
        $("<script/>", {
            src: pluginpath,
            type: 'text/javascript'
        }).appendTo("body");
    }
}
App.Platform.prototype.cleanAppVersion = function() {
    var version = navigator.appVersion.match(/^[^\s]*/)[0] || null;
    if (version == null) return null;
    split = version.split(".")
    return {
        major: split[0],
        minor: split[1],
        mod: split[2]
    }
};
App.Platform.prototype.setResolution = function(width, height) {
    this.resolution.height = height;
    this.resolution.width = width;
}
App.Platform.prototype.matrix = function() {
    return this.resolution.width + "x" + this.resolution.height;
}
App.Platform.prototype.addPlatformCSS = function() {
    if (this._mediaPlayer) {
        $log(" ADDING PLATFORM CSS FOR PLATFORM: " + this.name + " path: /style/vendor/flowplayer." + this._mediaPlayer.toLowerCase() + ".css");
        $("<link/>", {
            rel: "stylesheet",
            type: "text/css",
            href: "/style/vendor/flowplayer." + this._mediaPlayer.toLowerCase() + ".css"
        }).appendTo("head");
    }
}
// Override this
App.Platform.prototype.detectPlatform = function() {
    if (!this.defaultPlatform) $log(" <<< PLATFORM MUST OVERRIDE THE DETECT PLATFORM METHOD >>>");
}
App.Platform.prototype.getDeviceOrientation = function() {
    if (window.orientation && Math.abs(window.orientation) === 90) {
        return "landscape";
    } else {
        return "portrait";
    }
}
App.Platform.prototype.proxy = function() {
    return this.needsProxy ? "/inc/proxy.php" : "";
}
_.extend(App.Platform.prototype, Backbone.Events);
(function() {
    var browser = new App.Platform('browser');
    browser.init = function() {
        $(window).on('resize', function(e) {
            this.updateScreen();
            // alert("screen changed to "+this.matrix()+" "+this.orientation);
        }.bind(browser));
        this.updateScreen(true);
    };    
    browser.updateScreen = function(silent) {
        if (typeof(screen) !== "undefined") {
            window.screen.availWidth = $(window).width();
            window.screen.availHeight = $(window).height();
        }
        this.setResolution(screen.availWidth, screen.availHeight);
        if (!silent) this.trigger("screen:resize", screen.availWidth, screen.availHeight);

    };    
    // browser.needsProxy = true;
    // We want this to fail, and get added as default
    browser.setResolution(window.screen.width, window.screen.height);
    browser.defaultPlatform = true;
    browser.setMediaPlayer(App.Settings.Player.defaultMediaPlayer);
    App.Platforms.addSupportedPlatform(browser);
}());
(function() {
    var browser = new App.Platform('mobile');
    // browser.needsProxy = true;
    browser.detectPlatform = function() {
        return jQuery.browser.mobile;
    };
    browser.updateScreen = function(silent) {
        var orientation = this.getDeviceOrientation();
        if (typeof(screen) !== "undefined") {
            window.screen.availWidth = $(window).width();
            window.screen.availHeight = $(window).height();
        }
        this.setResolution(screen.availWidth, screen.availHeight);
        if (!silent) this.trigger("screen:resize", screen.availWidth, screen.availHeight);
        if (orientation != this.orientation) {
            this.orientation = orientation;
            if (!silent) this.trigger("screen:orientation:change", this.orientation);
        }
    };
    browser.init = function() {
        $(window).on('resize', function(e) {
            this.updateScreen();
            // alert("screen changed to "+this.matrix()+" "+this.orientation);
        }.bind(browser));
        this.updateScreen(true);
    };
    window.addEventListener("orientationchange", this.updateScreen);
    browser.setResolution($(window).outerWidth(), $(window).outerHeight());
    browser.defaultPlatform = false;
    browser.setMediaPlayer(App.Settings.Player.defaultMediaPlayer);
    App.Platforms.addSupportedPlatform(browser);
}());
/* The second default platform "flash" */
(function() {
    var browser = new App.Platform('flash');
    // browser.needsProxy = true;
    browser.detectPlatform = function() {
        return false;
        try {
            if (navigator.plugins != null && navigator.plugins.length > 0) {
                return navigator.plugins["Shockwave Flash"] && true;
            }
            if (~navigator.userAgent.toLowerCase().indexOf("webtv")) {
                return true;
            }
            if (~navigator.appVersion.indexOf("MSIE") && !~navigator.userAgent.indexOf("Opera")) {
                try {
                    return new ActiveXObject("ShockwaveFlash.ShockwaveFlash") && true;
                } catch (e) {}
            }
            return false;
        } catch (error) {
            return false;
        }
    }
    browser.defaultPlatform = false;
    App.Platforms.addSupportedPlatform(browser);
    browser.setMediaPlayer("flash");
}());
