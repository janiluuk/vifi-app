# Performance Improvements Documentation

## Overview
This document outlines performance issues identified in the ViFi app codebase and the improvements implemented to address them.

## Performance Issues Identified

### 1. **Repeated jQuery Selectors (High Impact)**

**Issue**: Multiple jQuery selectors are executed repeatedly without caching results.

**Locations**:
- `src/js/views/filterbar.js` - Lines 63-72, 82-106
- `src/js/views/browser.js` - Line 268
- `src/js/views/user.js` - Lines 356, 366, 379, 381

**Impact**: Each jQuery selector traverses the DOM tree, which is expensive. Repeated selectors multiply this cost unnecessarily.

**Example**:
```javascript
// BAD: Selector executed multiple times
$("#id_" + field + " option").each(function() {
    $(this).attr("selected", ...); // $(this) called repeatedly
});

// GOOD: Cache selector result
var $options = $("#id_" + field + " option");
$options.each(function() {
    var $this = $(this); // Cache within loop
    $this.attr("selected", ...);
});
```

### 2. **Inefficient jQuery .each() Usage (Medium Impact)**

**Issue**: Using jQuery's `.each()` instead of native JavaScript loops or Array methods.

**Locations**:
- `src/js/views/filterbar.js` - Lines 63, 82, 91
- `src/js/models/player.js` - Line 775
- `src/js/models/utils.js` - Lines 44, 49, 95

**Impact**: jQuery's `.each()` adds overhead compared to native loops. For large collections, this compounds.

**Example**:
```javascript
// BAD: jQuery .each()
$(subtitles).each(function() {
    var code = this.code;
    that.subtitles[code] = this;
});

// GOOD: Native for loop
for (var i = 0; i < subtitles.length; i++) {
    var subtitle = subtitles[i];
    that.subtitles[subtitle.code] = subtitle;
}

// BEST: Modern Array methods (if supported)
subtitles.forEach(function(subtitle) {
    that.subtitles[subtitle.code] = subtitle;
});
```

### 3. **Inefficient DOM Manipulation (High Impact)**

**Issue**: Multiple DOM insertions without batching or using DocumentFragments.

**Locations**:
- `src/js/views/browser.js` - Lines 32, 45
- `src/js/views/user.js` - Lines 343, 356, 366, 379
- `src/js/views/filterbar.js` - Line 172

**Impact**: Each DOM manipulation can cause reflow/repaint. Multiple sequential manipulations severely impact performance.

**Current Good Practice** (already used in some places):
```javascript
// GOOD: Using DocumentFragment
this.fragment = document.createDocumentFragment();
$(this.fragment).append(ich.bannerItemTemplate(item.toJSON()));
$(this.swiperel).empty().append(this.fragment); // Single DOM insertion
```

**Needs Improvement**:
```javascript
// BAD: Multiple appends
$('#id_genres').append(new Option('All Genres', ''));
this.genres.each(function(genre) {
    $('#id_genres').append(new Option(...)); // Repeated DOM access
});

// GOOD: Batch operations
var options = [new Option('All Genres', '')];
this.genres.each(function(genre) {
    options.push(new Option(...));
});
var $genres = $('#id_genres');
options.forEach(function(opt) {
    $genres.append(opt);
});
```

### 4. **Expensive Attribute Selectors (Medium Impact)**

**Issue**: Using complex attribute selectors that are slow to evaluate.

**Locations**:
- `src/js/views/browser.js` - Line 268: `$("#search-form select option[selected=selected]")`
- `src/js/views/filterbar.js` - Line 92: `$('#id_' + option + ' option[value="' + item + '"]')`

**Impact**: Attribute selectors are significantly slower than ID or class selectors.

**Optimization**:
```javascript
// BAD: Complex attribute selector
$("#search-form select option[selected=selected]").each(function() {...});

// BETTER: Narrow scope first, then filter
$("#search-form select").find("option:selected").each(function() {...});

// BEST: Cache and use specific selectors
var $form = $("#search-form");
$form.find("select option:selected").each(function() {...});
```

### 5. **Underscore.js Filter Anti-pattern (Low Impact)**

**Issue**: Inefficient use of `_.filter()` in utility functions.

**Location**: `src/js/models/utils.js` - Line 26

```javascript
// BAD: Filter returns array, then access [0]
var str = _.filter(App.Translations[App.Settings.language], 
    function(item,key) { if (key === string) return item});
if (!_.isEmpty(str)) return str[0];

// GOOD: Use _.find() for single items
var str = _.find(App.Translations[App.Settings.language], 
    function(item, key) { return key === string });
if (str) return str;
```

### 6. **Selector String Concatenation (Low Impact)**

**Issue**: Building selectors with string concatenation inside loops.

**Locations**:
- `src/js/views/filterbar.js` - Lines 63, 92, 93
- `src/js/views/browser.js` - Lines 269-270

**Impact**: String concatenation creates temporary objects and is less efficient than template literals (where supported) or pre-computed selectors.

## Recommendations for Implementation

### High Priority Optimizations:

1. **Cache jQuery Selectors**: 
   - Store frequently used selectors in variables
   - Cache `$(this)` at the start of loop iterations
   
2. **Batch DOM Operations**:
   - Use DocumentFragment for multiple insertions
   - Minimize reflows by batching style changes
   
3. **Optimize Loops**:
   - Replace jQuery `.each()` with native `for` loops where appropriate
   - Use `Array.forEach()`, `.map()`, or `.reduce()` for modern browsers

### Medium Priority Optimizations:

4. **Simplify Selectors**:
   - Replace attribute selectors with class-based or data-attribute selectors
   - Use `:selected` instead of `[selected=selected]`
   
5. **Use Underscore/Lodash Efficiently**:
   - Use `_.find()` instead of `_.filter()[0]`
   - Use `_.findWhere()` for object property matching

### Low Priority Optimizations:

6. **Modern JavaScript**:
   - Consider ES6+ features where supported
   - Use const/let instead of var
   - Use template literals for string building

## Testing Recommendations

1. **Performance Profiling**:
   - Use browser DevTools Performance tab
   - Measure before/after metrics
   - Focus on:
     - JavaScript execution time
     - DOM manipulation time
     - Rendering/paint time

2. **Key Metrics to Monitor**:
   - Time to Interactive (TTI)
   - First Contentful Paint (FCP)
   - Frame rate during animations
   - Memory usage

3. **Specific Test Cases**:
   - Filter bar operations with many options
   - Large collection rendering (user films)
   - Search with many results
   - Player subtitle loading

## Estimated Impact

- **High Impact**: 30-50% reduction in DOM manipulation time
- **Medium Impact**: 15-25% reduction in JavaScript execution time
- **Low Impact**: 5-10% overall performance improvement

## Implementation Strategy

1. Start with high-impact fixes in frequently-used code paths
2. Test each change individually to measure impact
3. Prioritize user-facing features (filter bar, search, collection views)
4. Document performance metrics before and after changes
5. Consider progressive enhancement for older browsers

## Files Requiring Optimization

Priority order based on impact and usage frequency:

1. **src/js/views/filterbar.js** - Filter/search operations (High)
2. **src/js/views/browser.js** - Main browsing experience (High)
3. **src/js/views/user.js** - User collection rendering (High)
4. **src/js/models/utils.js** - Core utility functions (Medium)
5. **src/js/models/player.js** - Media playback (Medium)

## Notes

- Some vendor files (`vendor/` directory) should not be modified
- Maintain backward compatibility with existing browser support
- Follow existing code style and patterns
- Add comments for non-obvious optimizations
