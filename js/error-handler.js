/**
 * Error Handling and Logging System
 * Version: 20250625-error-001
 * 
 * Centralized error handling, logging, and debugging functionality
 */

(function() {
    'use strict';
    
    // Error tracking configuration
    const ERROR_CONFIG = {
        maxErrors: 50, // Maximum number of errors to store locally
        logLevel: 'info', // debug, info, warn, error
        enableConsoleLogging: true,
        enableLocalStorage: true,
        enableRemoteLogging: false, // Set to true when backend is available
        remoteEndpoint: '/api/errors'
    };
    
    // Error storage
    let errorLog = [];
    let performanceMetrics = {};
    
    /**
     * Initialize error handling system
     */
    function initErrorHandler() {
        console.log('Initializing error handler...');
        
        // Setup global error handlers
        setupGlobalErrorHandlers();
        
        // Setup performance monitoring
        setupPerformanceMonitoring();
        
        // Load existing error log from storage
        loadErrorLog();
        
        // Setup periodic cleanup
        setupCleanup();
        
        console.log('Error handler initialized');
    }
    
    /**
     * Setup global error handlers
     */
    function setupGlobalErrorHandlers() {
        // Handle uncaught JavaScript errors
        window.addEventListener('error', (event) => {
            const errorData = {
                type: 'javascript_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
            };
            
            logError(errorData);
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            const errorData = {
                type: 'promise_rejection',
                message: event.reason?.message || 'Unhandled promise rejection',
                reason: event.reason,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
            };
            
            logError(errorData);
        });
        
        // Handle resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                const errorData = {
                    type: 'resource_error',
                    element: event.target.tagName,
                    source: event.target.src || event.target.href,
                    message: 'Failed to load resource',
                    timestamp: new Date().toISOString(),
                    url: window.location.href
                };
                
                logError(errorData);
            }
        }, true);
    }
    
    /**
     * Setup performance monitoring
     */
    function setupPerformanceMonitoring() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (window.performance && window.performance.timing) {
                    const timing = window.performance.timing;
                    const metrics = {
                        pageLoadTime: timing.loadEventEnd - timing.navigationStart,
                        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                        firstPaint: timing.responseStart - timing.navigationStart,
                        timestamp: new Date().toISOString()
                    };
                    
                    performanceMetrics.pageLoad = metrics;
                    log('Performance metrics captured', metrics, 'info');
                }
            }, 0);
        });
        
        // Monitor JavaScript errors by function
        const originalConsoleError = console.error;
        console.error = function(...args) {
            const errorData = {
                type: 'console_error',
                message: args.join(' '),
                timestamp: new Date().toISOString(),
                stack: new Error().stack
            };
            
            logError(errorData);
            originalConsoleError.apply(console, args);
        };
    }
    
    /**
     * Main error logging function
     */
    function logError(errorData, category = 'general') {
        // Add additional context
        errorData.category = category;
        errorData.sessionId = getSessionId();
        errorData.errorId = generateErrorId();
        
        // Add to error log
        errorLog.push(errorData);
        
        // Limit log size
        if (errorLog.length > ERROR_CONFIG.maxErrors) {
            errorLog = errorLog.slice(-ERROR_CONFIG.maxErrors);
        }
        
        // Console logging
        if (ERROR_CONFIG.enableConsoleLogging) {
            console.error('🚨 Error logged:', errorData);
        }
        
        // Local storage
        if (ERROR_CONFIG.enableLocalStorage) {
            saveErrorLog();
        }
        
        // Remote logging
        if (ERROR_CONFIG.enableRemoteLogging) {
            sendErrorToServer(errorData);
        }
        
        // Trigger error event for other systems
        window.dispatchEvent(new CustomEvent('errorLogged', { detail: errorData }));
    }
    
    /**
     * General logging function with different levels
     */
    function log(message, data = null, level = 'info') {
        const logEntry = {
            level,
            message,
            data,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
        
        // Check if we should log this level
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(ERROR_CONFIG.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        
        if (messageLevelIndex >= currentLevelIndex) {
            if (ERROR_CONFIG.enableConsoleLogging) {
                const consoleMethod = console[level] || console.log;
                consoleMethod('📝 Log:', message, data || '');
            }
            
            // Store important logs
            if (level === 'error' || level === 'warn') {
                logError({
                    type: 'application_log',
                    level,
                    message,
                    data,
                    timestamp: logEntry.timestamp
                });
            }
        }
    }
    
    /**
     * Debug logging specifically for development
     */
    function debug(message, data = null) {
        if (ERROR_CONFIG.logLevel === 'debug') {
            log(message, data, 'debug');
        }
    }
    
    /**
     * Track specific events for analytics
     */
    function trackEvent(eventName, eventData = {}) {
        const trackingData = {
            event: eventName,
            data: eventData,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            sessionId: getSessionId()
        };
        
        log(`Event tracked: ${eventName}`, trackingData, 'info');
        
        // Store in separate tracking log
        const trackingLog = getTrackingLog();
        trackingLog.push(trackingData);
        
        // Limit tracking log size
        if (trackingLog.length > 100) {
            const limitedLog = trackingLog.slice(-100);
            localStorage.setItem('luxury_tracking_log', JSON.stringify(limitedLog));
        } else {
            localStorage.setItem('luxury_tracking_log', JSON.stringify(trackingLog));
        }
        
        // Send to analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventData);
        }
    }
    
    /**
     * Get or create session ID
     */
    function getSessionId() {
        let sessionId = sessionStorage.getItem('luxury_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('luxury_session_id', sessionId);
        }
        return sessionId;
    }
    
    /**
     * Generate unique error ID
     */
    function generateErrorId() {
        return 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Load error log from localStorage
     */
    function loadErrorLog() {
        if (ERROR_CONFIG.enableLocalStorage) {
            try {
                const stored = localStorage.getItem('luxury_error_log');
                if (stored) {
                    errorLog = JSON.parse(stored);
                    log(`Loaded ${errorLog.length} errors from storage`, null, 'info');
                }
            } catch (error) {
                console.warn('Failed to load error log from storage:', error);
            }
        }
    }
    
    /**
     * Save error log to localStorage
     */
    function saveErrorLog() {
        if (ERROR_CONFIG.enableLocalStorage) {
            try {
                localStorage.setItem('luxury_error_log', JSON.stringify(errorLog));
            } catch (error) {
                console.warn('Failed to save error log to storage:', error);
            }
        }
    }
    
    /**
     * Get tracking log from localStorage
     */
    function getTrackingLog() {
        try {
            const stored = localStorage.getItem('luxury_tracking_log');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    }
    
    /**
     * Send error to server (when backend is available)
     */
    async function sendErrorToServer(errorData) {
        try {
            const response = await fetch(ERROR_CONFIG.remoteEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(errorData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            debug('Error sent to server successfully', errorData.errorId);
            
        } catch (error) {
            console.warn('Failed to send error to server:', error);
            // Don't log this error to avoid infinite loops
        }
    }
    
    /**
     * Get error statistics
     */
    function getErrorStats() {
        const stats = {
            totalErrors: errorLog.length,
            errorsByType: {},
            errorsByCategory: {},
            recentErrors: errorLog.slice(-10),
            performanceMetrics
        };
        
        errorLog.forEach(error => {
            stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1;
            stats.errorsByCategory[error.category] = (stats.errorsByCategory[error.category] || 0) + 1;
        });
        
        return stats;
    }
    
    /**
     * Clear error log
     */
    function clearErrorLog() {
        errorLog = [];
        if (ERROR_CONFIG.enableLocalStorage) {
            localStorage.removeItem('luxury_error_log');
            localStorage.removeItem('luxury_tracking_log');
        }
        log('Error log cleared', null, 'info');
    }
    
    /**
     * Setup periodic cleanup
     */
    function setupCleanup() {
        // Clean up old errors every hour
        setInterval(() => {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const initialCount = errorLog.length;
            
            errorLog = errorLog.filter(error => new Date(error.timestamp) > oneDayAgo);
            
            if (errorLog.length < initialCount) {
                log(`Cleaned up ${initialCount - errorLog.length} old errors`, null, 'info');
                saveErrorLog();
            }
        }, 60 * 60 * 1000); // Every hour
    }
    
    /**
     * Handle specific booking errors
     */
    function handleBookingError(error, context = {}) {
        const errorData = {
            type: 'booking_error',
            message: error.message || 'Booking error occurred',
            context,
            timestamp: new Date().toISOString(),
            stack: error.stack
        };
        
        logError(errorData, 'booking');
        
        // Show user-friendly message
        const userMessage = 'There was an issue with your booking. Please try again or call 940.268.5999 for assistance.';
        setTimeout(() => alert(userMessage), 100);
    }
    
    /**
     * Handle Stripe-related errors
     */
    function handleStripeError(error, context = {}) {
        const errorData = {
            type: 'stripe_error',
            message: error.message || 'Payment processing error',
            code: error.code,
            context,
            timestamp: new Date().toISOString()
        };
        
        logError(errorData, 'payment');
        
        // Show specific payment error messages
        let userMessage = 'Payment processing failed. ';
        
        switch (error.code) {
            case 'card_declined':
                userMessage += 'Your card was declined. Please try a different payment method.';
                break;
            case 'insufficient_funds':
                userMessage += 'Insufficient funds. Please use a different card.';
                break;
            case 'network_error':
                userMessage += 'Network error. Please check your connection and try again.';
                break;
            default:
                userMessage += 'Please try again or call 940.268.5999 for assistance.';
        }
        
        setTimeout(() => alert(userMessage), 100);
    }
    
    /**
     * Initialize everything when DOM is ready
     */
    function init() {
        console.log('Initializing error handling system...');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initErrorHandler);
        } else {
            initErrorHandler();
        }
    }
    
    // Export functions to global scope
    window.ErrorHandler = {
        logError,
        log,
        debug,
        trackEvent,
        getErrorStats,
        clearErrorLog,
        handleBookingError,
        handleStripeError,
        init
    };
    
    // Export commonly used functions directly to window
    window.logError = logError;
    window.trackEvent = trackEvent;
    
    // Auto-initialize
    init();
    
})();