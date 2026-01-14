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
                // Mark doesn't exist - could happen if start/end marks weren't created
                if (window.console && window.console.warn && App.Settings.debug) {
                    console.warn('Performance: Could not measure "' + name + '". Marks may not exist.');
                }
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
        if (window.console && window.console.log && window.console.table) {
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
    },
    
    /**
     * Report performance metrics to external service (Sentry, Analytics, etc.)
     * Phase 4 enhancement: Proper telemetry instead of console.log
     * @param {string} metricName - Name of the metric
     * @param {number} value - Metric value
     * @param {Object} tags - Additional tags/metadata
     */
    report: function(metricName, value, tags) {
        // Report to Sentry if available
        if (typeof Sentry !== 'undefined' && Sentry.captureMessage) {
            Sentry.captureMessage('Performance: ' + metricName, {
                level: 'info',
                tags: tags || {},
                extra: {
                    value: value,
                    metric: metricName,
                    timestamp: Date.now()
                }
            });
        }
        
        // Report to Google Analytics if available
        if (typeof ga !== 'undefined' && App.Settings.google_analytics_enabled) {
            ga('send', 'timing', {
                timingCategory: 'Performance',
                timingVar: metricName,
                timingValue: Math.round(value),
                timingLabel: tags ? JSON.stringify(tags) : undefined
            });
        }
        
        // Report to custom analytics endpoint if configured
        if (App.Settings.performance_endpoint) {
            $.ajax({
                url: App.Settings.performance_endpoint,
                method: 'POST',
                data: JSON.stringify({
                    metric: metricName,
                    value: value,
                    tags: tags || {},
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent,
                    url: window.location.href
                }),
                contentType: 'application/json',
                // Don't let performance reporting block or fail the app
                timeout: 2000,
                error: function() {
                    // Silently fail - don't impact user experience
                }
            });
        }
        
        // Development logging
        if (App.Settings.debug && window.console && window.console.log) {
            console.log('[Performance] ' + metricName + ': ' + value + 'ms', tags);
        }
    },
    
    /**
     * Report key Web Vitals metrics
     * Phase 4 enhancement: Monitor Core Web Vitals (LCP, FID, CLS)
     */
    reportWebVitals: function() {
        var self = this;
        
        // Report navigation timing
        if (window.performance && window.performance.timing) {
            var timing = this.getNavigationTiming();
            
            if (timing.loadComplete > 0) {
                self.report('page_load_time', timing.loadComplete, { type: 'navigation' });
            }
            if (timing.domReady > 0) {
                self.report('dom_ready_time', timing.domReady, { type: 'navigation' });
            }
            if (timing.ttfb > 0) {
                self.report('time_to_first_byte', timing.ttfb, { type: 'navigation' });
            }
        }
        
        // Report Largest Contentful Paint (LCP) if available
        if (window.PerformanceObserver) {
            try {
                var lcpObserver = new PerformanceObserver(function(list) {
                    var entries = list.getEntries();
                    var lastEntry = entries[entries.length - 1];
                    self.report('largest_contentful_paint', lastEntry.renderTime || lastEntry.loadTime, {
                        type: 'web-vital',
                        element: lastEntry.element ? lastEntry.element.tagName : 'unknown'
                    });
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                // LCP not supported in this browser
            }
            
            // Report First Input Delay (FID) if available
            try {
                var fidObserver = new PerformanceObserver(function(list) {
                    var entries = list.getEntries();
                    entries.forEach(function(entry) {
                        self.report('first_input_delay', entry.processingStart - entry.startTime, {
                            type: 'web-vital',
                            eventType: entry.name
                        });
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                // FID not supported in this browser
            }
        }
    }
};
