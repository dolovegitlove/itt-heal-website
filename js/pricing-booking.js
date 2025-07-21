// Note: This is a frontend file, enum values should be defined locally or imported from shared frontend constants

/**
 * Pricing Display and Booking Interactions
 * Version: 20250625-pricing-001
 * 
 * Handles pricing display, session selection, and booking interface interactions
 */

(function() {
    'use strict';
    
    // Pricing configuration
    const PRICING_CONFIG = {
        sessions: {
            '30min': {
                duration: 30,
                appPrice: 85,
                webPrice: 95,
                title: '30-Minute Quick Relief',
                description: 'Targeted therapeutic session',
                features: [
                    'Focused assessment',
                    'Targeted therapy',
                    'Quick relief protocol'
                ],
                quickOption: true
            },
            '60min': {
                duration: 60,
                appPrice: 135,
                webPrice: 145,
                title: '60-Minute Reset',
                description: 'Standard therapeutic session',
                features: [
                    'Full body assessment',
                    'Targeted therapy',
                    'Take-home exercises'
                ],
                popular: true,
                badge: 'Most Popular'
            },
            '90min': {
                duration: 90,
                appPrice: 180,
                webPrice: 190,
                title: '90-Minute Integrative Fascia',
                description: 'Extended therapeutic session with deeper work',
                features: [
                    'Everything in 60-min +',
                    'Extended fascial work',
                    'Comprehensive bodywork',
                    'Deep relaxation time'
                ],
                premium: true,
                badge: 'Therapeutic Flagship',
                note: '89% of clients choose this for their second visit'
            }
        },
        promos: {
            introDiscount: {
                active: true,
                percentage: 25,
                title: 'Limited Time: Introductory Pricing',
                subtitle: 'Save 25%!',
                disclaimer: '*Regular pricing begins August 2025'
            },
            firstSession: {
                active: true,
                percentage: 10,
                title: 'First Session Discount',
                subtitle: 'Book today and get 10% off your first 90-minute session via app'
            }
        }
    };
    
    let selectedSession = null;
    
    /**
     * Initialize pricing and booking interface
     */
    function initPricingInterface() {
        console.log('Initializing pricing interface...');
        
        // Initialize session cards
        initSessionCards();
        
        // Initialize booking buttons
        initBookingButtons();
        
        // Initialize app download handlers
        initAppDownloadHandlers();
        
        // Update pricing displays
        updatePricingDisplays();
        
        console.log('Pricing interface initialized');
    }
    
    /**
     * Initialize session cards with interactive behavior
     */
    function initSessionCards() {
        const sessionCards = document.querySelectorAll('.session-card, .pricing-card');
        
        sessionCards.forEach(card => {
            // Add hover effects
            card.addEventListener('mouseenter', () => {
                if (!card.classList.contains('selected')) {
                    card.style.transform = 'translateY(-2px)';
                    card.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                }
            });
            
            card.addEventListener('mouseleave', () => {
                if (!card.classList.contains('selected')) {
                    card.style.transform = '';
                    card.style.boxShadow = '';
                }
            });
            
            // Add click handler for card selection
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on a button inside the card
                if (e.target.tagName === 'BUTTON') {
                    return;
                }
                
                const duration = card.dataset.duration;
                if (duration) {
                    selectSession(duration + 'min');
                }
            });
        });
    }
    
    /**
     * Initialize booking buttons
     */
    function initBookingButtons() {
        // Find all booking buttons
        const bookingButtons = document.querySelectorAll(
            '[onclick*="handleBooking"], [onclick*="handleNativeBooking"], .book-session-button'
        );
        
        bookingButtons.forEach(button => {
            // Remove inline onclick and add proper event listener
            button.removeAttribute('onclick');
            
            // Determine session type from button context
            const sessionType = determineSessionType(button);
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Booking button clicked for:', sessionType);
                handleBookingClick(sessionType, button);
            });
        });
    }
    
    /**
     * Determine session type from button context
     */
    function determineSessionType(button) {
        const buttonText = button.textContent.toLowerCase();
        const parentCard = button.closest('.session-card, .pricing-card');
        
        if (buttonText.includes('60') || buttonText.includes('60min')) {
            return '60min_massage';
        } else if (buttonText.includes('90') || buttonText.includes('90min')) {
            return '90min_massage';
        } else if (buttonText.includes('test')) {
            return 'test_product';
        } else if (parentCard) {
            const duration = parentCard.dataset.duration;
            if (duration) {
                return duration + 'min_massage';
            }
        }
        
        // Default fallback
        return '90min_massage';
    }
    
    /**
     * Handle booking button click
     */
    function handleBookingClick(sessionType, button) {
        // Add loading state
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Loading...';
        
        // Restore button after a short delay
        setTimeout(() => {
            button.disabled = false;
            button.textContent = originalText;
        }, 2000);
        
        // Call native booking if available
        if (typeof window.handleNativeBooking === 'function') {
            console.log('Calling handleNativeBooking with:', sessionType);
            window.handleNativeBooking(sessionType);
        } else {
            console.log('Native booking not available, showing fallback');
            showBookingFallback(sessionType);
        }
    }
    
    /**
     * Show booking fallback when native booking is not available
     */
    function showBookingFallback(sessionType) {
        const sessionInfo = getSessionInfo(sessionType);
        
        alert(`Booking system loading...\n\nSession: ${sessionInfo.title}\nPrice: $${sessionInfo.price}\n\nPlease try again in a moment or call 940.268.5999`);
    }
    
    /**
     * Get session information by type
     */
    function getSessionInfo(sessionType) {
        if (sessionType.includes('60min')) {
            return {
                title: PRICING_CONFIG.sessions['60min'].title,
                price: PRICING_CONFIG.sessions['60min'].appPrice
            };
        } else if (sessionType.includes('90min')) {
            return {
                title: PRICING_CONFIG.sessions['90min'].title,
                price: PRICING_CONFIG.sessions['90min'].appPrice
            };
        } else {
            return {
                title: 'Test Product',
                price: 0.50
            };
        }
    }
    
    /**
     * Select a session
     */
    function selectSession(sessionKey) {
        selectedSession = sessionKey;
        
        // Update UI to show selection
        document.querySelectorAll('.session-card, .pricing-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = document.querySelector(`[data-duration="${sessionKey.replace('min', '')}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            selectedCard.style.borderColor = 'var(--sage-600)';
            selectedCard.style.transform = 'translateY(-2px)';
            selectedCard.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.2)';
        }
        
        console.log('Session selected:', sessionKey);
    }
    
    /**
     * Initialize app download handlers
     */
    function initAppDownloadHandlers() {
        // Handle app download buttons
        const appButtons = document.querySelectorAll('[onclick*="downloadApp"]');
        
        appButtons.forEach(button => {
            button.removeAttribute('onclick');
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                const platform = button.textContent.toLowerCase().includes('ios') ? 'ios' : 'android';
                handleAppDownload(platform);
            });
        });
    }
    
    /**
     * Handle app download
     */
    function handleAppDownload(platform) {
        console.log('App download requested for:', platform);
        
        // Show coming soon message
        const message = `📱 Our healing app is coming soon in Q3 2025!\\n\\nFor now, you can:\\n• Book directly on this website\\n• Call us at 940.268.5999\\n• Sign up for early access notifications`;
        
        alert(message);
        
        // Optional: Trigger early access signup
        showEarlyAccessSignup(platform);
    }
    
    /**
     * Show early access signup
     */
    function showEarlyAccessSignup(platform) {
        // This could open a modal or redirect to a signup form
        console.log('Early access signup for:', platform);
        
        // For now, just log the interest
        if (typeof window.trackEvent === 'function') {
            window.trackEvent('app_interest', {
                platform: platform,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * Update pricing displays with current pricing
     */
    function updatePricingDisplays() {
        // Update pricing text elements
        const priceElements = document.querySelectorAll('.price-display-large');
        
        priceElements.forEach(element => {
            const card = element.closest('.session-card, .pricing-card');
            if (card) {
                const duration = card.dataset.duration;
                if (duration && PRICING_CONFIG.sessions[duration + 'min']) {
                    const session = PRICING_CONFIG.sessions[duration + 'min'];
                    element.textContent = '$' + session.appPrice;
                }
            }
        });
        
        // Update promotional banners
        updatePromotionalBanners();
    }
    
    /**
     * Update promotional banners
     */
    function updatePromotionalBanners() {
        const introBanner = document.querySelector('[style*="linear-gradient(135deg, #10b981, #047857)"]');
        if (introBanner && PRICING_CONFIG.promos.introDiscount.active) {
            const promo = PRICING_CONFIG.promos.introDiscount;
            introBanner.innerHTML = `
                <div style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">
                    🎉 ${promo.title} - ${promo.subtitle}
                </div>
                <div style="font-size: 0.875rem; opacity: 0.9;">${promo.disclaimer}</div>
            `;
        }
    }
    
    /**
     * Handle session comparison
     */
    function showSessionComparison() {
        const comparisonData = {
            '60min': PRICING_CONFIG.sessions['60min'],
            '90min': PRICING_CONFIG.sessions['90min']
        };
        
        console.log('Session comparison:', comparisonData);
        
        // This could trigger a modal or expand a comparison section
        return comparisonData;
    }
    
    /**
     * Calculate pricing with promotions
     */
    function calculateFinalPrice(sessionKey, platform = 'app') {
        const session = PRICING_CONFIG.sessions[sessionKey];
        if (!session) return 0;
        
        let price = platform === 'app' ? session.appPrice : session.webPrice;
        
        // Apply promotional discounts
        if (PRICING_CONFIG.promos.introDiscount.active) {
            const discount = PRICING_CONFIG.promos.introDiscount.percentage / 100;
            price = price * (1 - discount);
        }
        
        return Math.round(price * 100) / 100; // Round to 2 decimal places
    }
    
    /**
     * Initialize everything when DOM is ready
     */
    function init() {
        console.log('Initializing pricing and booking interface...');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initPricingInterface);
        } else {
            initPricingInterface();
        }
    }
    
    // Export functions to global scope
    window.PricingBooking = {
        selectSession,
        handleBookingClick,
        calculateFinalPrice,
        showSessionComparison,
        getSessionInfo,
        init
    };
    
    // Create global handleBooking function for backward compatibility
    window.handleBooking = function(duration) {
        console.log('Legacy handleBooking called with:', duration);
        const sessionType = duration + 'min_massage';
        handleBookingClick(sessionType, null);
    };
    
    // Auto-initialize
    init();
    
})();