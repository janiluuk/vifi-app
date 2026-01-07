/**
 * Performance Monitoring Utility
 * 
 * Provides hooks for measuring and tracking performance metrics in the application.
 * Use this to monitor the effectiveness of performance optimizations.
 */

App.Utils.Performance = {
    
    /**
     * Mark the start of a performance measurement
     * @param {string} name - Unique identifier for the measurement
     */
    mark: function(name) {
        if (window.performance && window.performance.mark) {
            window.performance.mark(name);
        }
    },
    
    /**
     * Measure time between two marks
     * @param {string} name - Name for the measurement
     * @param {string} startMark - Starting mark name
     * @param {string} endMark - Ending mark name
     * @returns {number} Duration in milliseconds
     */
    measure: function(name, startMark, endMark) {
        if (window.performance && window.performance.measure) {
            try {
                window.performance.measure(name, startMark, endMark);
                var measures = window.performance.getEntriesByName(name);
                if (measures.length > 0) {
                    return measures[measures.length - 1].duration;
                }
            } catch (e) {
                // Mark doesn't exist, fail silently
            }
        }
        return 0;
    },
    
    /**
     * Get all performance marks
     * @returns {Array} Array of performance marks
     */
    getMarks: function() {
        if (window.performance && window.performance.getEntriesByType) {
            return window.performance.getEntriesByType('mark');
        }
        return [];
    },
    
    /**
     * Get all performance measures
     * @returns {Array} Array of performance measures
     */
    getMeasures: function() {
        if (window.performance && window.performance.getEntriesByType) {
            return window.performance.getEntriesByType('measure');
        }
        return [];
    },
    
    /**
     * Clear specific marks and measures
     * @param {string} name - Name of mark/measure to clear (optional)
     */
    clear: function(name) {
        if (window.performance) {
            if (name) {
                window.performance.clearMarks(name);
                window.performance.clearMeasures(name);
            } else {
                window.performance.clearMarks();
                window.performance.clearMeasures();
            }
        }
    },
    
    /**
     * Log performance metrics to console (development only)
     * @param {string} context - Context description for the log
     */
    log: function(context) {
        if (window.console && window.console.table) {
            var measures = this.getMeasures();
            if (measures.length > 0) {
                console.log('Performance Metrics: ' + context);
                console.table(measures.map(function(m) {
                    return {
                        name: m.name,
                        duration: m.duration.toFixed(2) + 'ms',
                        startTime: m.startTime.toFixed(2)
                    };
                }));
            }
        }
    },
    
    /**
     * Measure function execution time
     * @param {Function} fn - Function to measure
     * @param {string} name - Name for the measurement
     * @returns {*} Result of the function
     */
    measureFunction: function(fn, name) {
        var startMark = name + '-start';
        var endMark = name + '-end';
        
        this.mark(startMark);
        var result = fn();
        this.mark(endMark);
        this.measure(name, startMark, endMark);
        
        return result;
    },
    
    /**
     * Get navigation timing metrics (page load performance)
     * @returns {Object} Navigation timing metrics
     */
    getNavigationTiming: function() {
        if (!window.performance || !window.performance.timing) {
            return {};
        }
        
        var timing = window.performance.timing;
        var navigationStart = timing.navigationStart;
        
        return {
            // DNS lookup time
            dns: timing.domainLookupEnd - timing.domainLookupStart,
            // TCP connection time
            tcp: timing.connectEnd - timing.connectStart,
            // Time to first byte
            ttfb: timing.responseStart - timing.requestStart,
            // Download time
            download: timing.responseEnd - timing.responseStart,
            // DOM processing time
            domProcessing: timing.domComplete - timing.domLoading,
            // DOM ready time (from navigation start)
            domReady: timing.domContentLoadedEventEnd - navigationStart,
            // Full load time (from navigation start)
            loadComplete: timing.loadEventEnd - navigationStart
        };
    },
    
    /**
     * Get resource timing metrics
     * @param {string} resourceType - Filter by resource type (optional)
     * @returns {Array} Resource timing entries
     */
    getResourceTiming: function(resourceType) {
        if (!window.performance || !window.performance.getEntriesByType) {
            return [];
        }
        
        var resources = window.performance.getEntriesByType('resource');
        
        if (resourceType) {
            resources = resources.filter(function(r) {
                return r.initiatorType === resourceType;
            });
        }
        
        return resources.map(function(r) {
            return {
                name: r.name,
                type: r.initiatorType,
                duration: r.duration.toFixed(2),
                size: r.transferSize || 0
            };
        });
    }
};

// Example usage (commented out - add to code where needed):
/*
// Mark start of operation
App.Utils.Performance.mark('filter-update-start');

// ... perform filter update ...

// Mark end and measure
App.Utils.Performance.mark('filter-update-end');
var duration = App.Utils.Performance.measure('filter-update', 'filter-update-start', 'filter-update-end');

// Log results (development)
App.Utils.Performance.log('Filter Update');
*/
