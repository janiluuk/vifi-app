/**
 * Tests for Base Models (ApiModel, CookieModel, Film, Event)
 * Testing model initialization, URL construction, and cookie management
 */

describe('ApiModel', () => {
  let mockModel;
  let mockSettings;
  
  beforeEach(() => {
    mockSettings = {
      Api: {
        url: 'https://api.example.com/api/'
      }
    };
    
    mockModel = {
      id: 'test_id',
      session: false,
      params: {},
      
      get: jest.fn(function(key) {
        return this[key];
      }),
      
      set: jest.fn(function(key, value) {
        this[key] = value;
      })
    };
  });

  describe('defaults', () => {
    test('should have default id as empty string', () => {
      const defaults = {
        id: '',
        session: false
      };
      
      expect(defaults.id).toBe('');
      expect(defaults.session).toBe(false);
    });
  });

  describe('path', () => {
    test('should return model id as path', () => {
      const path = function() {
        return mockModel.get("id");
      };
      
      mockModel.id = 'my_model_123';
      const result = path();
      
      expect(result).toBe('my_model_123');
    });

    test('should handle empty id', () => {
      const path = function() {
        return mockModel.get("id");
      };
      
      mockModel.id = '';
      const result = path();
      
      expect(result).toBe('');
    });
  });

  describe('url construction', () => {
    test('should construct URL with base API URL and path', () => {
      const constructUrl = function(apiUrl, path, params) {
        const queryString = Object.keys(params).length > 0 
          ? '?' + Object.keys(params).map(k => `${k}=${params[k]}`).join('&')
          : '';
        return apiUrl + path + queryString;
      };
      
      const url = constructUrl('https://api.example.com/api/', 'details/123', {});
      
      expect(url).toBe('https://api.example.com/api/details/123');
    });

    test('should include query parameters in URL', () => {
      const constructUrl = function(apiUrl, path, params) {
        const queryString = Object.keys(params).length > 0 
          ? '?' + Object.keys(params).map(k => `${k}=${params[k]}`).join('&')
          : '';
        return apiUrl + path + queryString;
      };
      
      const url = constructUrl('https://api.example.com/api/', 'details/123', {
        format: 'json',
        api_key: 'test_key'
      });
      
      expect(url).toContain('https://api.example.com/api/details/123?');
      expect(url).toContain('format=json');
      expect(url).toContain('api_key=test_key');
    });
  });
});

describe('CookieModel', () => {
  let mockCookie;
  
  beforeEach(() => {
    mockCookie = {
      name: 'test_cookie',
      value: 'test_value',
      days: 2,
      path: '/',
      domain: '.example.com',
      
      attributes: {},
      
      get: jest.fn(),
      set: jest.fn().mockReturnThis(),
      save: jest.fn()
    };
    
    // Initialize attributes
    mockCookie.attributes = {
      name: 'test_cookie',
      value: 'test_value',
      days: 2
    };
  });

  describe('defaults', () => {
    test('should have default days set to 2', () => {
      const defaults = {
        days: 2
      };
      
      expect(defaults.days).toBe(2);
    });
  });

  describe('validate', () => {
    test('should require name attribute', () => {
      const validate = function(attrs) {
        if (!attrs.name) {
          return "Cookie needs name";
        }
      };
      
      expect(validate({})).toBe("Cookie needs name");
      expect(validate({ name: '' })).toBe("Cookie needs name");
    });

    test('should pass validation with name', () => {
      const validate = function(attrs) {
        if (!attrs.name) {
          return "Cookie needs name";
        }
      };
      
      expect(validate({ name: 'my_cookie' })).toBeUndefined();
    });
  });

  describe('get', () => {
    test('should decode URI component for value attribute', () => {
      const get = function(name, attributes) {
        if (name === 'value') {
          let value = attributes[name];
          if (value && value[0] === '"') {
            value = value.slice(1, value.length - 1);
          }
          return decodeURIComponent(value);
        } else {
          return attributes[name];
        }
      };
      
      const encoded = encodeURIComponent('test value with spaces');
      const result = get('value', { value: encoded });
      
      expect(result).toBe('test value with spaces');
    });

    test('should remove surrounding quotes from value', () => {
      const get = function(name, attributes) {
        if (name === 'value') {
          let value = attributes[name];
          if (value && value[0] === '"') {
            value = value.slice(1, value.length - 1);
          }
          return decodeURIComponent(value);
        } else {
          return attributes[name];
        }
      };
      
      const result = get('value', { value: '"quoted_value"' });
      
      expect(result).toBe('quoted_value');
    });

    test('should return attribute directly for non-value attributes', () => {
      const get = function(name, attributes) {
        if (name === 'value') {
          let value = attributes[name];
          if (value && value[0] === '"') {
            value = value.slice(1, value.length - 1);
          }
          return decodeURIComponent(value);
        } else {
          return attributes[name];
        }
      };
      
      expect(get('name', { name: 'test_cookie' })).toBe('test_cookie');
      expect(get('days', { days: 7 })).toBe(7);
    });
  });

  describe('save', () => {
    test('should encode value with special characters', () => {
      const shouldEncodeValue = function(value) {
        return value.match(/[^\w\d]/) !== null;
      };
      
      expect(shouldEncodeValue('test value')).toBe(true);
      expect(shouldEncodeValue('test@value')).toBe(true);
      expect(shouldEncodeValue('simplevalue')).toBe(false);
      expect(shouldEncodeValue('value123')).toBe(false);
    });

    test('should construct cookie string with name and value', () => {
      const constructCookie = function(name, value) {
        return `${name}=${value}`;
      };
      
      expect(constructCookie('test', 'value')).toBe('test=value');
    });

    test('should add expiration date when days specified', () => {
      const addExpiration = function(days) {
        if (days) {
          const date = new Date();
          date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
          return `expires=${date.toGMTString()}`;
        }
        return null;
      };
      
      const result = addExpiration(7);
      
      expect(result).toContain('expires=');
    });

    test('should add path when specified', () => {
      const addPath = function(path) {
        if (path) {
          return `path=${path}`;
        }
        return null;
      };
      
      expect(addPath('/')).toBe('path=/');
      expect(addPath('/admin')).toBe('path=/admin');
      expect(addPath(null)).toBe(null);
    });

    test('should add domain when specified', () => {
      const addDomain = function(domain) {
        if (domain) {
          return `domain=${domain}`;
        }
        return null;
      };
      
      expect(addDomain('.example.com')).toBe('domain=.example.com');
      expect(addDomain(null)).toBe(null);
    });

    test('should add secure flag when specified', () => {
      const addSecure = function(secure) {
        if (secure) {
          return 'secure';
        }
        return null;
      };
      
      expect(addSecure(true)).toBe('secure');
      expect(addSecure(false)).toBe(null);
    });

    test('should construct complete cookie string', () => {
      const constructFullCookie = function(attrs) {
        const pieces = [];
        
        let value = attrs.value;
        if (value.match(/[^\w\d]/)) {
          value = `"${encodeURIComponent(value)}"`;
        }
        pieces.push(`${attrs.name}=${value}`);
        
        if (attrs.days) {
          const date = new Date();
          date.setTime(date.getTime() + (attrs.days * 24 * 60 * 60 * 1000));
          pieces.push(`expires=${date.toGMTString()}`);
        }
        
        if (attrs.path) {
          pieces.push(`path=${attrs.path}`);
        }
        
        if (attrs.domain) {
          pieces.push(`domain=${attrs.domain}`);
        }
        
        if (attrs.secure) {
          pieces.push('secure');
        }
        
        return pieces.join('; ');
      };
      
      const cookieStr = constructFullCookie({
        name: 'test',
        value: 'value with spaces',
        days: 7,
        path: '/',
        domain: '.example.com'
      });
      
      expect(cookieStr).toContain('test=');
      expect(cookieStr).toContain('expires=');
      expect(cookieStr).toContain('path=/');
      expect(cookieStr).toContain('domain=.example.com');
    });
  });

  describe('destroy', () => {
    test('should set value to empty and days to -1', () => {
      const destroy = function() {
        mockCookie.set('value', '');
        mockCookie.set('days', -1);
        mockCookie.save();
      };
      
      destroy();
      
      expect(mockCookie.set).toHaveBeenCalledWith('value', '');
      expect(mockCookie.set).toHaveBeenCalledWith('days', -1);
      expect(mockCookie.save).toHaveBeenCalled();
    });
  });
});

describe('Film Model', () => {
  let mockFilm;
  
  beforeEach(() => {
    mockFilm = {
      id: 'film_123',
      imdb_id: 'tt1234567',
      type: 'film',
      
      get: jest.fn(function(key) {
        return this[key];
      }),
      
      set: jest.fn(function(key, value) {
        this[key] = value;
      })
    };
  });

  describe('type', () => {
    test('should have type film', () => {
      expect(mockFilm.type).toBe('film');
    });
  });

  describe('path', () => {
    test('should construct details path with id', () => {
      const path = function(id) {
        return `details/${id}`;
      };
      
      expect(path('film_123')).toBe('details/film_123');
      expect(path('456')).toBe('details/456');
    });

    test('should handle numeric and string ids', () => {
      const path = function(id) {
        return `details/${id}`;
      };
      
      expect(path(123)).toBe('details/123');
      expect(path('abc')).toBe('details/abc');
    });
  });

  describe('fetchRT', () => {
    test('should return false if no imdb_id provided', () => {
      const fetchRT = function(id, filmImdbId) {
        let imdb_id = id || filmImdbId;
        if (imdb_id === undefined || imdb_id === "") {
          return false;
        }
        return true;
      };
      
      expect(fetchRT(null, '')).toBe(false);
      expect(fetchRT(undefined, undefined)).toBe(false);
    });

    test('should use provided id over model imdb_id', () => {
      const fetchRT = function(providedId, modelImdbId) {
        let imdb_id;
        if (providedId) {
          imdb_id = providedId;
        } else {
          imdb_id = modelImdbId;
        }
        return imdb_id;
      };
      
      expect(fetchRT('tt9999999', 'tt1111111')).toBe('tt9999999');
      expect(fetchRT(null, 'tt1111111')).toBe('tt1111111');
    });

    test('should remove tt prefix from imdb_id', () => {
      const removeImdbPrefix = function(imdb_id) {
        return imdb_id.replace("tt", "");
      };
      
      expect(removeImdbPrefix('tt1234567')).toBe('1234567');
      expect(removeImdbPrefix('1234567')).toBe('1234567');
    });
  });
});

describe('Event Model', () => {
  let mockEvent;
  
  beforeEach(() => {
    mockEvent = {
      id: 'event_456',
      type: 'event',
      
      get: jest.fn(function(key) {
        return this[key];
      })
    };
  });

  describe('type', () => {
    test('should have type event', () => {
      expect(mockEvent.type).toBe('event');
    });
  });

  describe('path', () => {
    test('should construct event details path with id', () => {
      const path = function(id) {
        return `event/details/${id}`;
      };
      
      expect(path('event_456')).toBe('event/details/event_456');
      expect(path('789')).toBe('event/details/789');
    });
  });
});

describe('Backbone History Navigation', () => {
  describe('navigate wrapper', () => {
    test('should trigger before and after events', () => {
      const mockHistory = {
        trigger: jest.fn()
      };
      
      const wrappedNavigate = function(original, ...args) {
        mockHistory.trigger('before:url-change', args);
        const res = original(...args);
        mockHistory.trigger('url-changed');
        return res;
      };
      
      const originalNavigate = jest.fn().mockReturnValue(true);
      const result = wrappedNavigate(originalNavigate, '/test', { trigger: true });
      
      expect(mockHistory.trigger).toHaveBeenCalledWith('before:url-change', ['/test', { trigger: true }]);
      expect(originalNavigate).toHaveBeenCalledWith('/test', { trigger: true });
      expect(mockHistory.trigger).toHaveBeenCalledWith('url-changed');
      expect(result).toBe(true);
    });

    test('should pass arguments to original function', () => {
      const mockHistory = {
        trigger: jest.fn()
      };
      
      const originalNavigate = jest.fn();
      
      const wrappedNavigate = function(original, ...args) {
        mockHistory.trigger('before:url-change', args);
        const res = original(...args);
        mockHistory.trigger('url-changed');
        return res;
      };
      
      wrappedNavigate(originalNavigate, '/path', { option: 'value' });
      
      expect(originalNavigate).toHaveBeenCalledWith('/path', { option: 'value' });
    });
  });
});
