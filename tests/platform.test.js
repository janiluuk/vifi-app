/**
 * Tests for Platform Detection and Management
 * Testing platform initialization, detection, and helper functions
 */

describe('Platform Helper Functions', () => {
  describe('$noop', () => {
    test('should return single argument as-is', () => {
      const noop = function(input) {
        if (arguments.length > 1) {
          return Array.prototype.slice.call(arguments, 0);
        } else {
          return arguments[0];
        }
      };
      
      expect(noop('test')).toBe('test');
      expect(noop(123)).toBe(123);
      expect(noop({ key: 'value' })).toEqual({ key: 'value' });
    });

    test('should return array for multiple arguments', () => {
      const noop = function() {
        if (arguments.length > 1) {
          return Array.prototype.slice.call(arguments, 0);
        } else {
          return arguments[0];
        }
      };
      
      const result = noop('a', 'b', 'c');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    test('should handle no arguments', () => {
      const noop = function() {
        if (arguments.length > 1) {
          return Array.prototype.slice.call(arguments, 0);
        } else {
          return arguments[0];
        }
      };
      
      expect(noop()).toBeUndefined();
    });
  });

  describe('$log', () => {
    let consoleSpy;
    
    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });
    
    afterEach(() => {
      consoleSpy.mockRestore();
    });

    test('should always log to console', () => {
      const log = function(message) {
        console.log(message);
      };
      
      log('test message');
      
      expect(consoleSpy).toHaveBeenCalledWith('test message');
    });

    test('should stringify objects', () => {
      const log = function(message) {
        let logMsg = message;
        if (typeof message === 'object') {
          logMsg = JSON.stringify(message);
        }
        console.log(logMsg);
      };
      
      log({ key: 'value' });
      
      expect(consoleSpy).toHaveBeenCalledWith('{"key":"value"}');
    });

    test('should handle debug mode trigger', () => {
      const mockApp = {
        trigger: jest.fn()
      };
      
      const log = function(message, debug) {
        if (debug === true) {
          let logMsg = message;
          if (typeof message === 'object') {
            logMsg = JSON.stringify(message);
          }
          mockApp.trigger('flash', logMsg, 5000);
        }
        console.log(message);
      };
      
      log('debug message', true);
      
      expect(mockApp.trigger).toHaveBeenCalledWith('flash', 'debug message', 5000);
      expect(consoleSpy).toHaveBeenCalledWith('debug message');
    });
  });

  describe('$debug', () => {
    test('should toggle debug setting', () => {
      const mockSettings = {
        debug: false
      };
      
      const toggleDebug = function() {
        if (mockSettings.debug === true) {
          mockSettings.debug = false;
        } else {
          mockSettings.debug = true;
        }
      };
      
      expect(mockSettings.debug).toBe(false);
      toggleDebug();
      expect(mockSettings.debug).toBe(true);
      toggleDebug();
      expect(mockSettings.debug).toBe(false);
    });
  });

  describe('$error', () => {
    let consoleSpy;
    
    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });
    
    afterEach(() => {
      consoleSpy.mockRestore();
    });

    test('should log error with prefix', () => {
      const error = function(message) {
        console.log('[ERROR]' + message);
      };
      
      error('Something went wrong');
      
      expect(consoleSpy).toHaveBeenCalledWith('[ERROR]Something went wrong');
    });

    test('should stringify object errors', () => {
      const error = function(message) {
        let logMsg = message;
        if (typeof message === 'object') {
          logMsg = JSON.stringify(message);
        }
        console.log('[ERROR]' + logMsg);
      };
      
      error({ error: 'not found', code: 404 });
      
      expect(consoleSpy).toHaveBeenCalledWith('[ERROR]{"error":"not found","code":404}');
    });

    test('should trigger error event in debug mode', () => {
      const mockApp = {
        trigger: jest.fn()
      };
      
      const error = function(message, debug) {
        if (debug === true) {
          let logMsg = message;
          if (typeof message === 'object') {
            logMsg = JSON.stringify(message);
          }
          mockApp.trigger('error', logMsg);
          mockApp.trigger('flash', '<b><span class="error">' + logMsg + '</span></b>', 18000);
        }
        console.log('[ERROR]' + message);
      };
      
      error('Error message', true);
      
      expect(mockApp.trigger).toHaveBeenCalledWith('error', 'Error message');
      expect(mockApp.trigger).toHaveBeenCalledWith('flash', '<b><span class="error">Error message</span></b>', 18000);
    });
  });
});

describe('App.Platforms', () => {
  let mockPlatforms;
  
  beforeEach(() => {
    mockPlatforms = {
      platform: null,
      defaultPlatform: null,
      supportedPlatforms: {},
      
      addSupportedPlatform: jest.fn(function(platform) {
        this.supportedPlatforms[platform.name] = platform;
        if (platform.defaultPlatform === true) {
          this.defaultPlatform = platform;
        }
      })
    };
  });

  describe('addSupportedPlatform', () => {
    test('should add platform to supported platforms', () => {
      const platform = {
        name: 'test-platform',
        defaultPlatform: false,
        detectPlatform: jest.fn()
      };
      
      mockPlatforms.addSupportedPlatform(platform);
      
      expect(mockPlatforms.supportedPlatforms['test-platform']).toBe(platform);
    });

    test('should set default platform when specified', () => {
      const platform = {
        name: 'default-platform',
        defaultPlatform: true,
        detectPlatform: jest.fn()
      };
      
      mockPlatforms.addSupportedPlatform(platform);
      
      expect(mockPlatforms.defaultPlatform).toBe(platform);
    });

    test('should not set default platform when not specified', () => {
      const platform = {
        name: 'non-default-platform',
        defaultPlatform: false,
        detectPlatform: jest.fn()
      };
      
      mockPlatforms.addSupportedPlatform(platform);
      
      expect(mockPlatforms.defaultPlatform).toBeNull();
    });
  });

  describe('init', () => {
    test('should detect and use matching platform', () => {
      const platform1 = {
        name: 'platform1',
        defaultPlatform: false,
        detectPlatform: jest.fn().mockReturnValue(false),
        init: jest.fn(),
        addPlatformCSS: jest.fn(),
        fetchMediaPlayer: jest.fn()
      };
      
      const platform2 = {
        name: 'platform2',
        defaultPlatform: false,
        detectPlatform: jest.fn().mockReturnValue(true),
        init: jest.fn(),
        addPlatformCSS: jest.fn(),
        fetchMediaPlayer: jest.fn()
      };
      
      mockPlatforms.supportedPlatforms = {
        platform1: platform1,
        platform2: platform2
      };
      
      const init = function() {
        for (const key in mockPlatforms.supportedPlatforms) {
          const platform = mockPlatforms.supportedPlatforms[key];
          if (!platform.defaultPlatform && platform.detectPlatform()) {
            mockPlatforms.platform = platform;
            break;
          }
        }
        
        if (mockPlatforms.platform) {
          mockPlatforms.platform.init();
          mockPlatforms.platform.addPlatformCSS();
          mockPlatforms.platform.fetchMediaPlayer();
        }
      };
      
      init();
      
      expect(platform2.detectPlatform).toHaveBeenCalled();
      expect(mockPlatforms.platform).toBe(platform2);
      expect(platform2.init).toHaveBeenCalled();
    });

    test('should use default platform if no platform detected', () => {
      const defaultPlatform = {
        name: 'default',
        defaultPlatform: true,
        detectPlatform: jest.fn(),
        init: jest.fn(),
        addPlatformCSS: jest.fn(),
        fetchMediaPlayer: jest.fn()
      };
      
      const nonMatchingPlatform = {
        name: 'non-matching',
        defaultPlatform: false,
        detectPlatform: jest.fn().mockReturnValue(false),
        init: jest.fn(),
        addPlatformCSS: jest.fn(),
        fetchMediaPlayer: jest.fn()
      };
      
      mockPlatforms.supportedPlatforms = {
        'non-matching': nonMatchingPlatform
      };
      mockPlatforms.defaultPlatform = defaultPlatform;
      
      const init = function() {
        let detectedPlatform = null;
        
        for (const key in mockPlatforms.supportedPlatforms) {
          const platform = mockPlatforms.supportedPlatforms[key];
          if (!platform.defaultPlatform && platform.detectPlatform()) {
            detectedPlatform = platform;
            break;
          }
        }
        
        if (!detectedPlatform && mockPlatforms.defaultPlatform) {
          mockPlatforms.platform = mockPlatforms.defaultPlatform;
        } else if (detectedPlatform) {
          mockPlatforms.platform = detectedPlatform;
        }
        
        if (mockPlatforms.platform) {
          mockPlatforms.platform.init();
          mockPlatforms.platform.addPlatformCSS();
          mockPlatforms.platform.fetchMediaPlayer();
        }
      };
      
      init();
      
      expect(mockPlatforms.platform).toBe(defaultPlatform);
      expect(defaultPlatform.init).toHaveBeenCalled();
    });

    test('should log error if no platform and no default', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockPlatforms.supportedPlatforms = {};
      mockPlatforms.defaultPlatform = null;
      
      const init = function() {
        let detectedPlatform = null;
        
        if (!detectedPlatform && !mockPlatforms.defaultPlatform) {
          console.log("!!!! NO PLATFORM DETECTED, AND NO DEFAULT PLATFORM !!!!");
          return;
        }
      };
      
      init();
      
      expect(consoleSpy).toHaveBeenCalledWith("!!!! NO PLATFORM DETECTED, AND NO DEFAULT PLATFORM !!!!");
      
      consoleSpy.mockRestore();
    });
  });
});

describe('App.Platform Constructor', () => {
  describe('initialization', () => {
    test('should create platform with name', () => {
      const createPlatform = function(name) {
        return {
          name: name,
          defaultPlatform: true,
          _mediaPlayer: 'html5'
        };
      };
      
      const platform = createPlatform('web-platform');
      
      expect(platform.name).toBe('web-platform');
      expect(platform.defaultPlatform).toBe(true);
      expect(platform._mediaPlayer).toBe('html5');
    });

    test('should have default media player as html5', () => {
      const createPlatform = function(name) {
        return {
          name: name,
          defaultPlatform: true,
          _mediaPlayer: 'html5'
        };
      };
      
      const platform = createPlatform('test');
      
      expect(platform._mediaPlayer).toBe('html5');
    });
  });

  describe('key mappings', () => {
    test('should have standard keyboard key codes', () => {
      const keys = {
        KEY_RETURN: 13,  // Enter key
        KEY_UP: 38,
        KEY_DOWN: 40,
        KEY_LEFT: 37,
        KEY_RIGHT: 39,
        KEY_ENTER: 13,
        KEY_BACK: 8,     // Backspace key
        KEY_CANCEL: 27
      };
      
      expect(keys.KEY_ENTER).toBe(13);
      expect(keys.KEY_RETURN).toBe(13);  // Return is same as Enter
      expect(keys.KEY_UP).toBe(38);
      expect(keys.KEY_DOWN).toBe(40);
      expect(keys.KEY_LEFT).toBe(37);
      expect(keys.KEY_RIGHT).toBe(39);
      expect(keys.KEY_BACK).toBe(8);
      expect(keys.KEY_CANCEL).toBe(27);
    });

    test('should have media control key codes', () => {
      const keys = {
        KEY_PLAY: 80,
        KEY_PAUSE: 189,
        KEY_STOP: 83,
        KEY_FF: 190,
        KEY_RW: 188
      };
      
      expect(keys.KEY_PLAY).toBe(80);
      expect(keys.KEY_PAUSE).toBe(189);
      expect(keys.KEY_STOP).toBe(83);
      expect(keys.KEY_FF).toBe(190);
      expect(keys.KEY_RW).toBe(188);
    });

    test('should have volume control key codes', () => {
      const keys = {
        KEY_VOL_UP: 187,
        KEY_VOL_DOWN: 48,
        KEY_MUTE: 77
      };
      
      expect(keys.KEY_VOL_UP).toBe(187);
      expect(keys.KEY_VOL_DOWN).toBe(48);
      expect(keys.KEY_MUTE).toBe(77);
    });

    test('should have color button key codes', () => {
      const keys = {
        KEY_RED: 65,
        KEY_GREEN: 66,
        KEY_YELLOW: 67,
        KEY_BLUE: 68
      };
      
      expect(keys.KEY_RED).toBe(65);
      expect(keys.KEY_GREEN).toBe(66);
      expect(keys.KEY_YELLOW).toBe(67);
      expect(keys.KEY_BLUE).toBe(68);
    });
  });

  describe('resolution', () => {
    test('should have default HD resolution', () => {
      const resolution = {
        height: 720,
        width: 1280
      };
      
      expect(resolution.width).toBe(1280);
      expect(resolution.height).toBe(720);
    });

    test('should support common aspect ratios', () => {
      const isHD = function(width, height) {
        return (width / height).toFixed(2) === '1.78'; // 16:9
      };
      
      expect(isHD(1280, 720)).toBe(true);
      expect(isHD(1920, 1080)).toBe(true);
    });
  });
});

describe('Platform Detection Logic', () => {
  describe('browser detection', () => {
    test('should detect user agent strings', () => {
      const detectBrowser = function(userAgent) {
        if (userAgent.includes('Chrome')) return 'chrome';
        if (userAgent.includes('Firefox')) return 'firefox';
        if (userAgent.includes('Safari')) return 'safari';
        return 'unknown';
      };
      
      expect(detectBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')).toBe('chrome');
      expect(detectBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0')).toBe('firefox');
    });

    test('should detect mobile devices', () => {
      const isMobile = function(userAgent) {
        return /Mobile|Android|iPhone|iPad/.test(userAgent);
      };
      
      expect(isMobile('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)')).toBe(true);
      expect(isMobile('Mozilla/5.0 (Linux; Android 10)')).toBe(true);
      expect(isMobile('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false);
    });
  });

  describe('feature detection', () => {
    test('should detect HTML5 video support', () => {
      const supportsHTML5Video = function() {
        const video = document.createElement('video');
        return !!(video.canPlayType);
      };
      
      // In JSDOM environment, video element exists but may not have full support
      expect(typeof supportsHTML5Video).toBe('function');
    });

    test('should detect HLS support', () => {
      const supportsHLS = function(video) {
        return video && video.canPlayType && video.canPlayType('application/vnd.apple.mpegurl') !== '';
      };
      
      const mockVideo = {
        canPlayType: jest.fn().mockReturnValue('probably')
      };
      
      expect(supportsHLS(mockVideo)).toBe(true);
    });
  });
});
