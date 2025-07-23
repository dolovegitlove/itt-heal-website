// Note: This is a frontend file, enum values should be defined locally or imported from shared frontend constants

/**
 * Native Booking System Functionality
 * Version: 20250625-native-001
 * 
 * Handles Stripe integration, payment processing, and native booking functionality
 */

(function() {
    'use strict';
    
    // Stripe configuration
    let stripe = null;
    // Session types for frontend use
    const SESSION_TYPES = {
        '60min': '60min',
        '90min': '90min',
        '120min': '120min',
        consultation: 'consultation',
        follow_up: 'follow_up'
    };
    
    const STRIPE_CONFIG = {
        publishableKey: 'pk_live_51RRBjzFxOpfkAGIdJjkEORbCZPPZjvMQW8scmVNxxgcuB0v96NQVgmvbvA6ilCBZzyKj4CuyZMDjh4udoMihhflX00uqEC3iQk', // Live key
        products: {
            '30min_massage': {
                name: '30-Minute Quick Relief Session',
                price: 8500, // $85.00 in cents
                description: 'Targeted therapeutic massage session',
                duration: 30
            },
            [SESSION_TYPES['60min']]: {
                name: '60-Minute Therapeutic Session',
                price: 13500, // $135.00 in cents
                description: 'Standard therapeutic massage session',
                duration: 60
            },
            [SESSION_TYPES['90min']]: {
                name: '90-Minute Integrative Fascia Session',
                price: 18000, // $180.00 in cents
                description: 'Extended therapeutic session with fascial work',
                duration: 90
            },
            [SESSION_TYPES['120min']]: {
                name: '120-Minute Premium Session',
                price: 22000, // $220.00 in cents
                description: 'Premium therapeutic session with comprehensive work',
                duration: 120
            },
            'test_product': {
                name: 'Test Product',
                price: 50, // $0.50 in cents
                description: 'Test payment processing',
                duration: 1
            }
        }
    };
    
    // Booking state
    let currentBooking = null;
    let isProcessing = false;
    
    /**
     * Initialize Stripe and native booking system
     */
    function initNativeBooking() {
        console.log('Initializing native booking system...');
        
        // Initialize Stripe
        initStripe();
        
        // Setup booking event handlers
        setupBookingHandlers();
        
        console.log('Native booking system initialized');
    }
    
    /**
     * Initialize Stripe
     */
    function initStripe() {
        if (typeof Stripe !== 'undefined') {
            try {
                stripe = Stripe(STRIPE_CONFIG.publishableKey);
                console.log('Stripe initialized successfully');
            } catch (error) {
                console.error('Failed to initialize Stripe:', error);
                handleError('stripe_init_failed', error);
            }
        } else {
            console.warn('Stripe library not loaded');
            setTimeout(initStripe, 1000); // Retry after 1 second
        }
    }
    
    /**
     * Setup booking event handlers
     */
    function setupBookingHandlers() {
        // Global booking handler
        window.handleNativeBooking = handleNativeBooking;
        
        // Enhanced booking handler
        window.handleBookingWithOptions = handleBookingWithOptions;
        
        console.log('Booking handlers setup complete');
    }
    
    /**
     * Main native booking handler
     */
    function handleNativeBooking(productId, options = {}) {
        console.log('Native booking initiated for:', productId, options);
        
        if (isProcessing) {
            console.log('Booking already in progress');
            return;
        }
        
        const product = STRIPE_CONFIG.products[productId];
        if (!product) {
            console.error('Unknown product:', productId);
            handleError('unknown_product', { productId });
            return;
        }
        
        currentBooking = {
            productId,
            product,
            options,
            timestamp: new Date().toISOString()
        };
        
        // Show booking confirmation
        showBookingConfirmation(currentBooking);
    }
    
    /**
     * Enhanced booking handler with additional options
     */
    function handleBookingWithOptions(productId, options = {}) {
        const enhancedOptions = {
            source: 'website',
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            ...options
        };
        
        return handleNativeBooking(productId, enhancedOptions);
    }
    
    /**
     * Show booking confirmation dialog
     */
    function showBookingConfirmation(booking) {
        const { product } = booking;
        
        const confirmation = confirm(
            `Confirm Your Booking\\n\\n` +
            `Service: ${product.name}\\n` +
            `Duration: ${product.duration} minutes\\n` +
            `Price: $${(product.price / 100).toFixed(2)}\\n\\n` +
            `Click OK to proceed to payment`
        );
        
        if (confirmation) {
            proceedToPayment(booking);
        } else {
            console.log('Booking cancelled by user');
            currentBooking = null;
        }
    }
    
    /**
     * Proceed to payment processing
     */
    function proceedToPayment(booking) {
        if (!stripe) {
            console.error('Stripe not initialized');
            showPaymentError('Payment system not ready. Please try again.');
            return;
        }
        
        isProcessing = true;
        
        console.log('Proceeding to payment for:', booking.productId);
        
        // Create checkout session
        createCheckoutSession(booking)
            .then(sessionId => {
                if (sessionId) {
                    return redirectToCheckout(sessionId);
                } else {
                    throw new Error('Failed to create checkout session');
                }
            })
            .catch(error => {
                console.error('Payment processing failed:', error);
                handleError('payment_failed', error);
                showPaymentError('Payment processing failed. Please try again.');
            })
            .finally(() => {
                isProcessing = false;
            });
    }
    
    /**
     * Create Stripe checkout session
     */
    async function createCheckoutSession(booking) {
        try {
            console.log('Creating checkout session...');
            
            const { product, options } = booking;
            
            // In a real implementation, this would call your backend API
            // For now, we'll simulate the checkout process
            
            const sessionData = {
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        unit_amount: product.price,
                        product_data: {
                            name: product.name,
                            description: product.description,
                        },
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: window.location.origin + '/success?session_id={CHECKOUT_SESSION_ID}',
                cancel_url: window.location.href,
                metadata: {
                    product_id: booking.productId,
                    duration: product.duration.toString(),
                    source: options.source || 'website'
                }
            };
            
            // Simulate API call to create session
            const response = await simulateCheckoutSession(sessionData);
            
            if (response.success) {
                console.log('Checkout session created:', response.sessionId);
                return response.sessionId;
            } else {
                throw new Error(response.error || 'Failed to create session');
            }
            
        } catch (error) {
            console.error('Error creating checkout session:', error);
            throw error;
        }
    }
    
    /**
     * Simulate checkout session creation (replace with real API call)
     */
    async function simulateCheckoutSession(sessionData) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For testing purposes, we'll simulate success
        // In production, this would make an actual API call to your backend
        
        console.log('Simulated checkout session data:', sessionData);
        
        if (sessionData.line_items && sessionData.line_items.length > 0) {
            return {
                success: true,
                sessionId: 'cs_test_' + Math.random().toString(36).substr(2, 9)
            };
        } else {
            return {
                success: false,
                error: 'Invalid session data'
            };
        }
    }
    
    /**
     * Redirect to Stripe checkout
     */
    async function redirectToCheckout(sessionId) {
        try {
            console.log('Redirecting to checkout:', sessionId);
            
            const { error } = await stripe.redirectToCheckout({
                sessionId: sessionId
            });
            
            if (error) {
                throw error;
            }
            
        } catch (error) {
            console.error('Checkout redirect failed:', error);
            throw error;
        }
    }
    
    /**
     * Show payment error message
     */
    function showPaymentError(message) {
        alert(`Payment Error\\n\\n${message}\\n\\nYou can also book by calling:\\n940.268.5999`);
    }
    
    /**
     * Handle booking completion (success/failure)
     */
    function handleBookingComplete(success, data = {}) {
        isProcessing = false;
        currentBooking = null;
        
        if (success) {
            console.log('Booking completed successfully:', data);
            showBookingSuccess(data);
        } else {
            console.log('Booking failed:', data);
            showBookingFailure(data);
        }
    }
    
    /**
     * Show booking success message
     */
    function showBookingSuccess(data) {
        const message = `Booking Confirmed! 🎉\\n\\nYour session has been booked.\\nYou'll receive a confirmation email shortly.\\n\\nQuestions? Call 940.268.5999`;
        
        alert(message);
        
        // Track successful booking
        if (typeof window.trackEvent === 'function') {
            window.trackEvent('booking_success', {
                ...data,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * Show booking failure message
     */
    function showBookingFailure(data) {
        const message = `Booking Failed\\n\\nSomething went wrong with your booking.\\nPlease try again or call us directly.\\n\\nPhone: 940.268.5999`;
        
        alert(message);
        
        // Track failed booking
        if (typeof window.trackEvent === 'function') {
            window.trackEvent('booking_failure', {
                ...data,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * Get booking status
     */
    function getBookingStatus() {
        return {
            isProcessing,
            currentBooking,
            stripeReady: !!stripe
        };
    }
    
    /**
     * Cancel current booking
     */
    function cancelBooking() {
        if (currentBooking) {
            console.log('Booking cancelled:', currentBooking.productId);
            currentBooking = null;
            isProcessing = false;
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Validate booking data
     */
    function validateBooking(productId, options = {}) {
        if (!productId || typeof productId !== 'string') {
            return { valid: false, error: 'Invalid product ID' };
        }
        
        if (!STRIPE_CONFIG.products[productId]) {
            return { valid: false, error: 'Product not found' };
        }
        
        if (isProcessing) {
            return { valid: false, error: 'Booking already in progress' };
        }
        
        return { valid: true };
    }
    
    /**
     * Handle errors with logging and user notification
     */
    function handleError(errorType, error) {
        const errorData = {
            type: errorType,
            message: error?.message || 'Unknown error',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            currentBooking
        };
        
        console.error('Booking error:', errorData);
        
        // Log error for debugging
        if (typeof window.logError === 'function') {
            window.logError(errorData);
        }
        
        // Show user-friendly error message
        let userMessage = 'Something went wrong. Please try again.';
        
        switch (errorType) {
            case 'stripe_init_failed':
                userMessage = 'Payment system initialization failed. Please refresh the page.';
                break;
            case 'unknown_product':
                userMessage = 'Invalid service selected. Please choose a valid option.';
                break;
            case 'payment_failed':
                userMessage = 'Payment processing failed. Please try again.';
                break;
        }
        
        userMessage += '\\n\\nYou can also book by calling: 940.268.5999';
        
        setTimeout(() => {
            alert(userMessage);
        }, 100);
    }
    
    /**
     * Initialize everything when DOM is ready
     */
    function init() {
        console.log('Initializing native booking system...');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initNativeBooking);
        } else {
            initNativeBooking();
        }
    }
    
    // Export functions to global scope
    window.NativeBooking = {
        handleNativeBooking,
        handleBookingWithOptions,
        getBookingStatus,
        cancelBooking,
        validateBooking,
        init
    };
    
    // Auto-initialize
    init();
    
})();