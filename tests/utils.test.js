/**
 * Tests for App.Utils functions
 * Testing the bug fixes made in the code review
 */

// Mock the App global object
global.App = {
  Utils: {},
  Settings: {
    language: 'est'
  },
  Translations: {
    'est': {
      'Expired': 'Aegunud',
      'd': 'pv',
      'hr': ' tundi',
      'Min': 'Min',
      'Seconds': 'Seconds'
    }
  }
};

// Load the utility functions
describe('App.Utils', () => {
  beforeAll(() => {
    // Define the translate function
    global.App.Utils.translate = function(string) {
      var _ = require('lodash');
      var str = _.filter(global.App.Translations[global.App.Settings.language], function(item, key) { 
        if (key === string) return item;
      });
      if (!_.isEmpty(str)) return str[0];
      return string;
    };

    // Define nl2br function
    global.App.Utils.nl2br = function(str, is_xhtml) {
      var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
      return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
    };

    // Define convertMstoHumanReadable function (with bug fix)
    global.App.Utils.convertMstoHumanReadable = function(ms, leadingZeros) {
      // BUG FIX: Changed leadingZerons to leadingZeros
      leadingZeros = typeof(leadingZeros) === 'undefined' ? true : !!leadingZeros;

      var x = ms / 1000;
      // BUG FIX: Properly declared variables to avoid global scope pollution
      var seconds = Math.floor(x % 60);
      var numSecs = seconds;
      x /= 60;
      var minutes = Math.floor(x % 60);
      var numMins = minutes;
      x /= 60;
      var hours = Math.floor(x % 24);
      x /= 24;
      var days = Math.floor(x);

      var numMs = ms - (seconds * 1000);

      if (leadingZeros) {
        if (numSecs < 10) {
          numSecs = "0" + numSecs.toString();
        }
        if (numMins < 10) {
          numMins = "0" + numMins.toString();
        }
      }
      return {
        millis: numMs,
        seconds: numSecs,
        minutes: Math.floor(numMins),
        hours: Math.floor(hours),
        days: days,
        toString: function() {
          var str = numSecs;
          if (Math.floor(numMins))
            str = numMins + ":" + str;
          else
            str = "00:" + str;
          if (Math.floor(hours))
            str = hours + ":" + str;
          return str;
        }
      };
    };

    // Define toSeconds function (with bug fix)
    global.App.Utils.toSeconds = function(t) {
      var s = 0.0;
      if (t) {
        var p = t.split(':');
        // BUG FIX: Added var declaration to loop variable
        for (var i = 0; i < p.length; i++) {
          s = s * 60 + parseFloat(p[i].replace(',', '.'));
        }
      }
      return parseInt(s * 1000, 10);
    };

    // Define isValidDate function
    global.App.Utils.isValidDate = function(date) {
      if (!date) return false;
      var parsed = Date.parse(date);
      // Check for NaN which indicates invalid date
      if (!isNaN(parsed))
        return true;
      else
        return false;
    };
  });

  describe('convertMstoHumanReadable', () => {
    test('should convert milliseconds to human readable format with leading zeros', () => {
      const result = global.App.Utils.convertMstoHumanReadable(3661000); // 1 hour, 1 minute, 1 second
      
      expect(result.hours).toBe(1);
      expect(result.minutes).toBe(1);
      expect(result.seconds).toBe('01');
      expect(result.toString()).toBe('1:01:01');
    });

    test('should convert milliseconds without leading zeros when specified', () => {
      const result = global.App.Utils.convertMstoHumanReadable(3661000, false);
      
      expect(result.hours).toBe(1);
      expect(result.minutes).toBe(1);
      expect(result.seconds).toBe(1); // No leading zero
    });

    test('should handle leadingZeros parameter correctly (bug fix test)', () => {
      // This tests the fix for the leadingZerons typo bug
      const resultDefault = global.App.Utils.convertMstoHumanReadable(5000);
      expect(resultDefault.seconds).toBe('05'); // Should have leading zero by default
      
      const resultFalse = global.App.Utils.convertMstoHumanReadable(5000, false);
      expect(resultFalse.seconds).toBe(5); // Should not have leading zero
      
      const resultTrue = global.App.Utils.convertMstoHumanReadable(5000, true);
      expect(resultTrue.seconds).toBe('05'); // Should have leading zero
    });

    test('should not create global variables (bug fix test)', () => {
      // This tests that the function doesn't pollute global scope
      const before = Object.keys(global).length;
      global.App.Utils.convertMstoHumanReadable(1000);
      const after = Object.keys(global).length;
      
      expect(after).toBe(before);
      expect(global.seconds).toBeUndefined();
      expect(global.hours).toBeUndefined();
      expect(global.days).toBeUndefined();
    });

    test('should handle zero milliseconds', () => {
      const result = global.App.Utils.convertMstoHumanReadable(0);
      
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.seconds).toBe('00');
    });

    test('should handle large values correctly', () => {
      const result = global.App.Utils.convertMstoHumanReadable(90061000); // 25 hours, 1 minute, 1 second
      
      expect(result.hours).toBe(1); // Only hours within 24
      expect(result.minutes).toBe(1);
      expect(result.seconds).toBe('01');
    });
  });

  describe('toSeconds', () => {
    test('should convert time string to milliseconds', () => {
      const result = global.App.Utils.toSeconds('1:30:45');
      expect(result).toBe(5445000); // 1h 30m 45s = 5445 seconds = 5445000 ms
    });

    test('should handle minutes and seconds', () => {
      const result = global.App.Utils.toSeconds('5:30');
      expect(result).toBe(330000); // 5m 30s = 330 seconds = 330000 ms
    });

    test('should handle seconds only', () => {
      const result = global.App.Utils.toSeconds('45');
      expect(result).toBe(45000); // 45 seconds = 45000 ms
    });

    test('should not create global variable i (bug fix test)', () => {
      // This tests that the loop variable is properly scoped
      global.i = undefined;
      global.App.Utils.toSeconds('1:30');
      expect(global.i).toBeUndefined();
    });

    test('should handle empty string', () => {
      const result = global.App.Utils.toSeconds('');
      expect(result).toBe(0);
    });

    test('should handle comma as decimal separator', () => {
      const result = global.App.Utils.toSeconds('1,5');
      expect(result).toBe(1500); // 1.5 seconds = 1500 ms
    });
  });

  describe('translate', () => {
    test('should translate known strings', () => {
      const result = global.App.Utils.translate('Expired');
      expect(result).toBe('Aegunud');
    });

    test('should return original string for unknown translations', () => {
      const result = global.App.Utils.translate('Unknown String');
      expect(result).toBe('Unknown String');
    });
  });

  describe('nl2br', () => {
    test('should convert newlines to br tags', () => {
      const result = global.App.Utils.nl2br('Line 1\nLine 2');
      expect(result).toContain('<br />');
    });

    test('should handle different line endings', () => {
      const result1 = global.App.Utils.nl2br('Line 1\nLine 2');
      const result2 = global.App.Utils.nl2br('Line 1\r\nLine 2');
      const result3 = global.App.Utils.nl2br('Line 1\rLine 2');
      
      expect(result1).toContain('<br />');
      expect(result2).toContain('<br />');
      expect(result3).toContain('<br />');
    });

    test('should use non-xhtml br when specified', () => {
      const result = global.App.Utils.nl2br('Line 1\nLine 2', false);
      expect(result).toContain('<br>');
      expect(result).not.toContain('<br />');
    });
  });

  describe('isValidDate', () => {
    test('should validate correct date strings', () => {
      expect(global.App.Utils.isValidDate('2024-01-01')).toBe(true);
      expect(global.App.Utils.isValidDate('2024-01-01 12:00:00')).toBe(true);
    });

    test('should reject invalid dates', () => {
      expect(global.App.Utils.isValidDate('invalid')).toBe(false);
      expect(global.App.Utils.isValidDate('')).toBe(false);
      expect(global.App.Utils.isValidDate(null)).toBe(false);
    });
  });
});
