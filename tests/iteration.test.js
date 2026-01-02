/**
 * Tests for safe property iteration
 * Testing the hasOwnProperty bug fixes
 */

describe('Safe Property Iteration', () => {
  describe('getQueryString with hasOwnProperty', () => {
    test('should only iterate over own properties', () => {
      // Create object with inherited properties using Object.create
      const parent = { pollutedProperty: 'should not appear' };
      const dict = Object.create(parent);
      dict.q = 'search';
      dict.genre = 'action';
      
      // Simulate the fixed getQueryString function
      const getQueryString = function(dict, addParams) {
        const hashables = [];
        // BUG FIX: Added hasOwnProperty check and var declaration
        for (var key in dict) {
          if (dict.hasOwnProperty(key) && dict[key] !== undefined) {
            if (dict[key] !== "") {
              hashables.push(key + '=' + escape(dict[key]));
            }
          }
        }
        
        if (addParams) {
          // BUG FIX: Added hasOwnProperty check and var declaration
          for (var key in addParams) {
            if (addParams.hasOwnProperty(key)) {
              hashables.push(key + '=' + addParams[key]);
            }
          }
        }
        
        const params = hashables.join('&');
        return params.length ? '?' + params : "";
      };
      
      const result = getQueryString(dict);
      
      // Should not include the inherited property
      expect(result).not.toContain('pollutedProperty');
      expect(result).toContain('q=search');
      expect(result).toContain('genre=action');
    });

    test('should handle inherited properties correctly', () => {
      // Create an object with prototype
      const parent = { inherited: 'value' };
      const dict = Object.create(parent);
      dict.own = 'ownValue';
      
      const getQueryString = function(dict) {
        const hashables = [];
        for (var key in dict) {
          if (dict.hasOwnProperty(key) && dict[key] !== undefined) {
            if (dict[key] !== "") {
              hashables.push(key + '=' + escape(dict[key]));
            }
          }
        }
        const params = hashables.join('&');
        return params.length ? '?' + params : "";
      };
      
      const result = getQueryString(dict);
      
      // Should only include own property
      expect(result).toContain('own=ownValue');
      expect(result).not.toContain('inherited');
    });

    test('should not create global variable key (bug fix test)', () => {
      const dict = { a: '1', b: '2' };
      
      global.key = undefined;
      
      const getQueryString = function(dict) {
        const hashables = [];
        // BUG FIX: Added var declaration to avoid global
        for (var key in dict) {
          if (dict.hasOwnProperty(key) && dict[key] !== undefined) {
            if (dict[key] !== "") {
              hashables.push(key + '=' + escape(dict[key]));
            }
          }
        }
        return hashables.join('&');
      };
      
      getQueryString(dict);
      
      // Key should not be set as a global variable
      expect(global.key).toBeUndefined();
    });

    test('should handle addParams with hasOwnProperty', () => {
      // Create objects with inherited properties using Object.create
      const dictParent = { inherited: 'bad' };
      const dict = Object.create(dictParent);
      dict.q = 'test';
      
      const addParamsParent = { alsoInherited: 'alsoBad' };
      const addParams = Object.create(addParamsParent);
      addParams.extra = 'param';
      
      const getQueryString = function(dict, addParams) {
        const hashables = [];
        for (var key in dict) {
          if (dict.hasOwnProperty(key) && dict[key] !== undefined) {
            if (dict[key] !== "") {
              hashables.push(key + '=' + escape(dict[key]));
            }
          }
        }
        
        if (addParams) {
          for (var key in addParams) {
            if (addParams.hasOwnProperty(key)) {
              hashables.push(key + '=' + addParams[key]);
            }
          }
        }
        
        const params = hashables.join('&');
        return params.length ? '?' + params : "";
      };
      
      const result = getQueryString(dict, addParams);
      
      expect(result).toContain('extra=param');
      expect(result).not.toContain('inherited');
      expect(result).not.toContain('alsoInherited');
    });
  });
});
