/**
 * Haptic Feedback Utility Module
 * Provides consistent haptic feedback across ITT Heal interfaces
 */
(function() {
    'use strict';

    const HapticFeedback = {
        // Check if haptic feedback is supported
        isSupported: () => {
            return 'vibrate' in navigator || 
                   ('hapticFeedback' in window) ||
                   ('DeviceMotionEvent' in window);
        },

        // Different haptic patterns for different interactions
        patterns: {
            // Success feedback - positive confirmation
            success: {
                vibrate: [50, 30, 50], // Short-pause-short
                intensity: 'light'
            },
            
            // Error feedback - something went wrong
            error: {
                vibrate: [100, 50, 100, 50, 100], // Strong triple buzz
                intensity: 'medium'
            },
            
            // Warning feedback - attention needed
            warning: {
                vibrate: [80, 40, 80], // Medium double buzz
                intensity: 'light'
            },
            
            // Selection feedback - item selected/tapped
            selection: {
                vibrate: [30], // Quick single tap
                intensity: 'light'
            },
            
            // Progress feedback - step completed
            progress: {
                vibrate: [40, 20, 40], // Quick double tap
                intensity: 'light'
            },
            
            // Navigation feedback - moving between sections
            navigation: {
                vibrate: [25], // Very light tap
                intensity: 'light'
            },
            
            // Payment feedback - important financial action
            payment: {
                vibrate: [60, 30, 60, 30, 60], // Triple confirmation
                intensity: 'medium'
            },
            
            // Booking confirmation - major success
            booking: {
                vibrate: [80, 50, 40, 30, 60], // Celebration pattern
                intensity: 'medium'
            }
        },

        // Trigger haptic feedback with fallbacks
        trigger(patternName, options = {}) {
            if (!this.isSupported()) {
                console.log(`📳 Haptic feedback not supported (would trigger: ${patternName})`);
                return false;
            }

            const pattern = this.patterns[patternName];
            if (!pattern) {
                console.warn(`📳 Unknown haptic pattern: ${patternName}`);
                return false;
            }

            try {
                // Method 1: Web Vibration API (most widely supported)
                if ('vibrate' in navigator) {
                    const success = navigator.vibrate(pattern.vibrate);
                    if (success) {
                        console.log(`📳 Haptic feedback triggered: ${patternName}`);
                        return true;
                    }
                }

                // Method 2: Haptic Feedback API (newer devices)
                if ('hapticFeedback' in window && window.hapticFeedback) {
                    window.hapticFeedback.impact(pattern.intensity);
                    console.log(`📳 Haptic impact triggered: ${patternName} (${pattern.intensity})`);
                    return true;
                }

                // Method 3: iOS Safari workaround
                if (this.isIOS()) {
                    this.triggerIOSHaptic(pattern);
                    return true;
                }

                console.log(`📳 Haptic feedback attempted but may not have worked: ${patternName}`);
                return false;

            } catch (error) {
                console.warn('📳 Haptic feedback error:', error);
                return false;
            }
        },

        // Check if running on iOS
        isIOS() {
            return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        },

        // iOS-specific haptic feedback
        triggerIOSHaptic(pattern) {
            // iOS devices support haptic feedback through touch events
            // This is a workaround for iOS Safari limitations
            if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
                // For iOS 13+ devices, trigger through DeviceMotion
                const event = new CustomEvent('hapticfeedback', {
                    detail: { pattern: pattern.vibrate, intensity: pattern.intensity }
                });
                document.dispatchEvent(event);
            }
        },

        // Convenience methods for common interactions
        success() { return this.trigger('success'); },
        error() { return this.trigger('error'); },
        warning() { return this.trigger('warning'); },
        selection() { return this.trigger('selection'); },
        progress() { return this.trigger('progress'); },
        navigation() { return this.trigger('navigation'); },
        payment() { return this.trigger('payment'); },
        booking() { return this.trigger('booking'); },

        // Custom pattern trigger
        custom(vibratePattern, intensity = 'light') {
            if (!this.isSupported()) return false;
            
            try {
                if ('vibrate' in navigator) {
                    return navigator.vibrate(vibratePattern);
                }
                return false;
            } catch (error) {
                console.warn('📳 Custom haptic feedback error:', error);
                return false;
            }
        },

        // Initialize haptic feedback system
        init() {
            console.log('📳 Haptic Feedback System initialized');
            console.log(`📳 Support status: ${this.isSupported() ? 'Supported' : 'Not supported'}`);
            
            if (this.isSupported()) {
                // Test haptic feedback capability
                this.trigger('selection');
            }

            // Add haptic feedback to common elements automatically
            this.attachToCommonElements();
        },

        // Automatically attach haptic feedback to common UI elements
        attachToCommonElements() {
            // Add haptic feedback to all buttons
            document.addEventListener('click', (event) => {
                const target = event.target;
                
                // Skip if haptic feedback is explicitly disabled
                if (target.dataset.haptic === 'false' || target.closest('[data-haptic="false"]')) {
                    return;
                }

                // Button clicks
                if (target.matches('button, .btn, [role="button"]')) {
                    if (target.matches('.btn-success, .confirm-btn, .book-btn')) {
                        this.trigger('success');
                    } else if (target.matches('.btn-danger, .delete-btn, .cancel-btn')) {
                        this.trigger('warning');
                    } else {
                        this.trigger('selection');
                    }
                }

                // Links and navigation
                if (target.matches('a, .nav-link, .tab')) {
                    this.trigger('navigation');
                }

                // Form selections
                if (target.matches('input[type="radio"], input[type="checkbox"], .service-option')) {
                    this.trigger('selection');
                }

                // Payment related
                if (target.matches('.payment-btn, .stripe-btn, .pay-btn')) {
                    this.trigger('payment');
                }
            });

            // Add haptic feedback to form changes
            document.addEventListener('change', (event) => {
                const target = event.target;
                
                if (target.dataset.haptic === 'false') return;

                if (target.matches('select, input[type="date"], input[type="time"]')) {
                    this.trigger('selection');
                }
            });

            // Add haptic feedback to successful form submissions
            document.addEventListener('submit', (event) => {
                if (event.target.dataset.haptic === 'false') return;
                this.trigger('progress');
            });
        },

        // Method to trigger haptic for specific booking events
        bookingEvents: {
            serviceSelected() { HapticFeedback.trigger('selection'); },
            dateSelected() { HapticFeedback.trigger('selection'); },
            timeSelected() { HapticFeedback.trigger('selection'); },
            stepCompleted() { HapticFeedback.trigger('progress'); },
            bookingConfirmed() { HapticFeedback.trigger('booking'); },
            paymentStarted() { HapticFeedback.trigger('payment'); },
            paymentCompleted() { HapticFeedback.trigger('booking'); },
            errorOccurred() { HapticFeedback.trigger('error'); },
            warningShown() { HapticFeedback.trigger('warning'); }
        },

        // Method to trigger haptic for admin dashboard events
        adminEvents: {
            bookingSelected() { HapticFeedback.trigger('selection'); },
            bookingApproved() { HapticFeedback.trigger('success'); },
            bookingDeleted() { HapticFeedback.trigger('warning'); },
            dataLoaded() { HapticFeedback.trigger('progress'); },
            filterApplied() { HapticFeedback.trigger('selection'); },
            exportCompleted() { HapticFeedback.trigger('success'); },
            errorEncountered() { HapticFeedback.trigger('error'); }
        }
    };

    // Make HapticFeedback globally available
    window.HapticFeedback = HapticFeedback;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => HapticFeedback.init());
    } else {
        HapticFeedback.init();
    }

    // Export for module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = HapticFeedback;
    }

})();