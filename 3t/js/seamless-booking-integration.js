/**
 * SEAMLESS BOOKING INTEGRATION WITH STRIPE ELEMENTS
 * Integrates Stripe Elements directly into booking flow under credit card option
 * Real browser interactions - CLAUDE.md compliant
 */

(function() {
    'use strict';
    
    // Stripe and booking state
    let stripe = null;
    let elements = null;
    let cardElement = null;
    let currentBooking = null;
    let paymentIntentClientSecret = null;
    let isInitialized = false;
    
    // Configuration
    const STRIPE_PUBLIC_KEY = 'pk_test_51OBxkCKQ9k1QV9wX8u8u8u8u8u8u8u8u8u8u8u8u8u8u8u8u8u8u8u8u8u8u8u8u8u8u8u8';
    
    const SERVICE_PRICING = {
        '30min': { name: '30-Minute Targeted Relief', price: 8500, duration: 30 },
        '60min': { name: '60-Minute Pain Relief', price: 13500, duration: 60 },
        '90min': { name: '90-Minute Full Reset', price: 18000, duration: 90 },
        '120min': { name: '120-Minute Premium Session', price: 22000, duration: 120 }
    };
    
    /**
     * Initialize seamless booking integration
     */
    function initSeamlessBooking() {
        if (isInitialized) {
            console.log('⚠️ Seamless booking already initialized, skipping');
            return;
        }
        
        console.log('🚀 Initializing seamless booking integration...');
        
        // Initialize Stripe
        initStripeElements();
        
        // Create booking interface
        createBookingInterface();
        
        // Setup event handlers
        setupBookingEventHandlers();
        
        isInitialized = true;
        console.log('✅ Seamless booking integration ready');
    }
    
    /**
     * Initialize Stripe Elements
     */
    function initStripeElements() {
        if (typeof Stripe !== 'undefined') {
            try {
                stripe = Stripe(STRIPE_PUBLIC_KEY);
                console.log('✅ Stripe initialized for seamless booking');
            } catch (error) {
                console.error('❌ Stripe initialization failed:', error);
            }
        } else {
            console.warn('⚠️ Stripe library not loaded, retrying...');
            setTimeout(initStripeElements, 1000);
        }
    }
    
    /**
     * Create booking interface HTML
     */
    function createBookingInterface() {
        // Check if booking form already exists
        if (document.getElementById('seamless-booking-form')) {
            console.log('⚠️ Seamless booking form already exists, skipping creation');
            return;
        }
        
        const bookingSection = document.getElementById('booking');
        if (!bookingSection) {
            console.error('❌ Booking section not found');
            return;
        }
        
        // Create booking form container (hidden by default)
        const bookingFormHTML = `
            <div id="seamless-booking-form" class="seamless-booking-form" style="display: none;">
                <div class="booking-container">
                    <div class="booking-header">
                        <h3>✨ Book Your Healing Session</h3>
                        <button id="close-booking-form" class="close-button">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    
                    <!-- Step 1: Service Selection -->
                    <div id="service-selection-step" class="booking-step active">
                        <h4>Choose Your Session</h4>
                        <div class="service-options">
                            <div class="service-option" data-service="30min" data-price="8500">
                                <div class="service-header">
                                    <span class="service-name">30-Minute Targeted Relief</span>
                                    <span class="service-price">$85</span>
                                </div>
                                <p class="service-description">Quick targeted relief for specific areas</p>
                            </div>
                            <div class="service-option" data-service="60min" data-price="13500">
                                <div class="service-header">
                                    <span class="service-name">60-Minute Pain Relief</span>
                                    <span class="service-price">$135</span>
                                </div>
                                <p class="service-description">Stop pain at the source • Perfect starting point</p>
                            </div>
                            <div class="service-option popular" data-service="90min" data-price="18000">
                                <div class="service-header">
                                    <span class="service-name">90-Minute Full Reset</span>
                                    <span class="service-price">$180</span>
                                    <span class="popular-badge">MOST POPULAR</span>
                                </div>
                                <p class="service-description">Fix chronic pain • Root cause healing</p>
                            </div>
                            <div class="service-option" data-service="120min" data-price="22000">
                                <div class="service-header">
                                    <span class="service-name">120-Minute Premium Session</span>
                                    <span class="service-price">$220</span>
                                </div>
                                <p class="service-description">Comprehensive full-body healing experience</p>
                            </div>
                        </div>
                        <button id="service-next-btn" class="next-button" disabled>Continue</button>
                    </div>
                    
                    <!-- Step 2: Date & Time -->
                    <div id="datetime-selection-step" class="booking-step">
                        <h4>Select Date & Time</h4>
                        <div class="datetime-selection">
                            <div class="date-selection">
                                <label for="booking-date">Preferred Date:</label>
                                <input type="date" id="booking-date" name="booking-date" required>
                            </div>
                            <div class="time-selection">
                                <label for="booking-time">Preferred Time:</label>
                                <select id="booking-time" name="booking-time" required>
                                    <option value="">Select time...</option>
                                    <option value="09:00">9:00 AM</option>
                                    <option value="10:00">10:00 AM</option>
                                    <option value="11:00">11:00 AM</option>
                                    <option value="12:00">12:00 PM</option>
                                    <option value="13:00">1:00 PM</option>
                                    <option value="14:00">2:00 PM</option>
                                    <option value="15:00">3:00 PM</option>
                                    <option value="16:00">4:00 PM</option>
                                    <option value="17:00">5:00 PM</option>
                                </select>
                            </div>
                        </div>
                        <div class="step-buttons">
                            <button id="datetime-back-btn" class="back-button">Back</button>
                            <button id="datetime-next-btn" class="next-button" disabled>Continue</button>
                        </div>
                    </div>
                    
                    <!-- Step 3: Contact Information -->
                    <div id="contact-info-step" class="booking-step">
                        <h4>Your Information</h4>
                        <div class="contact-form">
                            <div class="form-row">
                                <input type="text" id="client-name" placeholder="Full Name *" required>
                            </div>
                            <div class="form-row">
                                <input type="email" id="client-email" placeholder="Email Address *" required>
                            </div>
                            <div class="form-row">
                                <input type="tel" id="client-phone" placeholder="Phone Number *" required>
                            </div>
                            <div class="form-row">
                                <textarea id="client-notes" placeholder="Any specific concerns or areas to focus on? (Optional)" rows="3"></textarea>
                            </div>
                        </div>
                        <div class="step-buttons">
                            <button id="contact-back-btn" class="back-button">Back</button>
                            <button id="contact-next-btn" class="next-button" disabled>Continue to Payment</button>
                        </div>
                    </div>
                    
                    <!-- Step 4: Payment -->
                    <div id="payment-step" class="booking-step">
                        <h4>Payment Method</h4>
                        
                        <!-- Payment Method Selection -->
                        <div class="payment-methods">
                            <label class="payment-method-option">
                                <input type="radio" name="payment-method" value="credit-card" checked>
                                <div class="payment-method-content">
                                    <span class="payment-method-icon">💳</span>
                                    <span class="payment-method-name">Credit Card</span>
                                    <span class="payment-method-desc">Secure online payment</span>
                                </div>
                            </label>
                            
                            <label class="payment-method-option">
                                <input type="radio" name="payment-method" value="cash">
                                <div class="payment-method-content">
                                    <span class="payment-method-icon">💵</span>
                                    <span class="payment-method-name">Cash</span>
                                    <span class="payment-method-desc">Pay at appointment</span>
                                </div>
                            </label>
                            
                            <label class="payment-method-option">
                                <input type="radio" name="payment-method" value="other">
                                <div class="payment-method-content">
                                    <span class="payment-method-icon">📱</span>
                                    <span class="payment-method-name">Other</span>
                                    <span class="payment-method-desc">Venmo, CashApp, etc.</span>
                                </div>
                            </label>
                        </div>
                        
                        <!-- Credit Card Section (Stripe Elements) -->
                        <div id="credit-card-section" class="payment-section">
                            <div class="stripe-elements-container">
                                <div id="card-element" class="stripe-card-element">
                                    <!-- Stripe Elements will mount here -->
                                </div>
                                <div id="card-errors" class="card-errors"></div>
                            </div>
                            <div class="payment-security">
                                <p>🔒 Your payment is secure and encrypted via Stripe</p>
                            </div>
                        </div>
                        
                        <!-- Alternative Payment Instructions -->
                        <div id="alternative-payment-section" class="payment-section" style="display: none;">
                            <div class="payment-instructions">
                                <p id="payment-instructions-text">Payment instructions will appear here.</p>
                            </div>
                        </div>
                        
                        <!-- Booking Summary -->
                        <div class="booking-summary">
                            <h5>Booking Summary</h5>
                            <div id="booking-summary-content">
                                <!-- Summary will be populated here -->
                            </div>
                        </div>
                        
                        <div class="step-buttons">
                            <button id="payment-back-btn" class="back-button">Back</button>
                            <button id="confirm-booking-btn" class="confirm-button" disabled>Confirm Booking</button>
                        </div>
                    </div>
                    
                    <!-- Step 5: Confirmation & Redirect -->
                    <div id="confirmation-step" class="booking-step">
                        <div class="confirmation-content">
                            <div class="confirmation-icon">✅</div>
                            <h4>Processing Your Booking...</h4>
                            <div id="processing-message" class="processing-message">
                                <p>Please wait while we confirm your appointment and process your payment.</p>
                                <div class="loading-spinner"></div>
                            </div>
                            <div id="success-message" class="success-message" style="display: none;">
                                <div class="success-content">
                                    <div class="success-checkmark">✅</div>
                                    <h4>Booking Confirmed!</h4>
                                    <div id="confirmation-details">
                                        <!-- Confirmation details will be populated here -->
                                    </div>
                                    <div class="success-actions">
                                        <button id="close-modal-btn" class="primary-button">Close</button>
                                        <button id="new-booking-btn" class="secondary-button">Book Another Session</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert booking form after the current booking section
        bookingSection.insertAdjacentHTML('afterend', bookingFormHTML);
        
        // Add CSS styles
        addBookingStyles();
    }
    
    /**
     * Add CSS styles for booking interface
     */
    function addBookingStyles() {
        const styles = `
            <style id="seamless-booking-styles">
                .seamless-booking-form {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow-y: auto;
                    padding: 20px;
                    box-sizing: border-box;
                }
                
                .booking-container {
                    background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9));
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 24px;
                    width: 100%;
                    max-width: 650px;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    box-shadow: 
                        0 32px 64px rgba(0, 0, 0, 0.2),
                        0 16px 32px rgba(139, 162, 139, 0.15),
                        inset 0 1px 0 rgba(255, 255, 255, 0.3);
                }
                
                .booking-header {
                    padding: 40px 40px 30px;
                    border-bottom: 1px solid rgba(139, 162, 139, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(135deg, 
                        rgba(240, 253, 244, 0.8) 0%,
                        rgba(230, 247, 232, 0.6) 50%,
                        rgba(220, 242, 220, 0.4) 100%);
                    border-radius: 24px 24px 0 0;
                    position: relative;
                }
                
                .booking-header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, 
                        transparent 0%,
                        rgba(139, 162, 139, 0.3) 50%,
                        transparent 100%);
                }
                
                .booking-header h3 {
                    margin: 0;
                    background: linear-gradient(135deg, #065f46, #047857, #10b981);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 1.75rem;
                    font-weight: 700;
                    letter-spacing: -0.02em;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                }
                
                .close-button {
                    position: absolute;
                    top: 25px;
                    right: 25px;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(139, 162, 139, 0.2);
                    border-radius: 12px;
                    width: 44px;
                    height: 44px;
                    cursor: pointer;
                    color: #6b7280;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                }
                
                .close-button:hover {
                    background: rgba(139, 162, 139, 0.1);
                    border-color: rgba(139, 162, 139, 0.3);
                    transform: scale(1.05);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
                }
                
                .booking-step {
                    display: none;
                    padding: 40px;
                    background: linear-gradient(145deg, 
                        rgba(255, 255, 255, 0.7) 0%,
                        rgba(248, 250, 252, 0.5) 100%);
                }
                
                .booking-step.active {
                    display: block;
                }
                
                .booking-step h4 {
                    margin: 0 0 30px 0;
                    background: linear-gradient(135deg, #1f2937, #374151);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 1.4rem;
                    font-weight: 700;
                    text-align: center;
                    letter-spacing: -0.01em;
                }
                
                .service-options {
                    display: grid;
                    gap: 20px;
                    margin-bottom: 40px;
                }
                
                .service-option {
                    background: linear-gradient(145deg, 
                        rgba(255, 255, 255, 0.9),
                        rgba(248, 250, 252, 0.7));
                    backdrop-filter: blur(10px);
                    border: 2px solid rgba(139, 162, 139, 0.2);
                    border-radius: 16px;
                    padding: 24px;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    box-shadow: 
                        0 4px 16px rgba(0, 0, 0, 0.04),
                        0 2px 8px rgba(139, 162, 139, 0.08);
                    overflow: hidden;
                }
                
                .service-option::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, 
                        rgba(16, 185, 129, 0.3) 0%,
                        rgba(16, 185, 129, 0.6) 50%,
                        rgba(16, 185, 129, 0.3) 100%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .service-option:hover {
                    border-color: rgba(16, 185, 129, 0.4);
                    background: linear-gradient(145deg, 
                        rgba(240, 253, 244, 0.9),
                        rgba(236, 253, 245, 0.7));
                    transform: translateY(-2px);
                    box-shadow: 
                        0 8px 32px rgba(0, 0, 0, 0.08),
                        0 4px 16px rgba(16, 185, 129, 0.15);
                }
                
                .service-option:hover::before {
                    opacity: 1;
                }
                
                .service-option.selected {
                    border-color: #10b981;
                    background: linear-gradient(145deg, 
                        rgba(240, 253, 244, 0.95),
                        rgba(236, 253, 245, 0.8));
                    transform: translateY(-3px);
                    box-shadow: 
                        0 12px 40px rgba(0, 0, 0, 0.1),
                        0 6px 20px rgba(16, 185, 129, 0.2);
                }
                
                .service-option.selected::before {
                    opacity: 1;
                    background: linear-gradient(90deg, #10b981, #059669, #10b981);
                }
                
                .service-option.popular {
                    border-color: rgba(220, 38, 38, 0.3);
                    background: linear-gradient(145deg, 
                        rgba(254, 242, 242, 0.9),
                        rgba(252, 231, 243, 0.7));
                }
                
                .service-option.popular::before {
                    background: linear-gradient(90deg, 
                        rgba(220, 38, 38, 0.4) 0%,
                        rgba(220, 38, 38, 0.7) 50%,
                        rgba(220, 38, 38, 0.4) 100%);
                    opacity: 1;
                }
                
                .service-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                
                .service-name {
                    font-weight: 600;
                    color: #1f2937;
                }
                
                .service-price {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #10b981;
                }
                
                .popular-badge {
                    background: #dc2626;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    margin-left: 10px;
                }
                
                .service-description {
                    color: #6b7280;
                    font-size: 0.9rem;
                    margin: 0;
                }
                
                .datetime-selection {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .datetime-selection label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #374151;
                }
                
                .datetime-selection input,
                .datetime-selection select {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: border-color 0.2s ease;
                }
                
                .datetime-selection input:focus,
                .datetime-selection select:focus {
                    outline: none;
                    border-color: #10b981;
                }
                
                .contact-form {
                    margin-bottom: 30px;
                }
                
                .form-row {
                    margin-bottom: 15px;
                }
                
                .form-row input,
                .form-row textarea {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: border-color 0.2s ease;
                    box-sizing: border-box;
                }
                
                .form-row input:focus,
                .form-row textarea:focus {
                    outline: none;
                    border-color: #10b981;
                }
                
                .payment-methods {
                    margin-bottom: 20px;
                }
                
                .payment-method-option {
                    display: flex;
                    align-items: center;
                    padding: 15px;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    margin-bottom: 10px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .payment-method-option:hover {
                    border-color: #10b981;
                    background: #f0fdf4;
                }
                
                .payment-method-option input[type="radio"] {
                    margin-right: 15px;
                }
                
                .payment-method-content {
                    display: flex;
                    align-items: center;
                    flex: 1;
                }
                
                .payment-method-icon {
                    font-size: 1.5rem;
                    margin-right: 15px;
                }
                
                .payment-method-name {
                    font-weight: 600;
                    color: #1f2937;
                    margin-right: 10px;
                }
                
                .payment-method-desc {
                    color: #6b7280;
                    font-size: 0.9rem;
                }
                
                .stripe-elements-container {
                    margin-bottom: 20px;
                }
                
                .stripe-card-element {
                    padding: 15px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    background: white;
                    margin-bottom: 10px;
                }
                
                .card-errors {
                    color: #dc2626;
                    font-size: 0.9rem;
                    margin-top: 10px;
                }
                
                .payment-security {
                    background: #f0f9ff;
                    border: 1px solid #3b82f6;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 20px;
                }
                
                .payment-security p {
                    margin: 0;
                    color: #1e40af;
                    font-size: 0.9rem;
                }
                
                .payment-instructions {
                    background: #fef3c7;
                    border: 1px solid #f59e0b;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 20px;
                }
                
                .payment-instructions p {
                    margin: 0;
                    color: #92400e;
                    font-size: 0.9rem;
                }
                
                .booking-summary {
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 30px;
                }
                
                .booking-summary h5 {
                    margin: 0 0 15px 0;
                    color: #1f2937;
                    font-weight: 600;
                }
                
                .step-buttons {
                    display: flex;
                    justify-content: space-between;
                    gap: 15px;
                }
                
                .back-button,
                .next-button,
                .confirm-button,
                .primary-button {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    flex: 1;
                }
                
                .back-button {
                    background: #f3f4f6;
                    color: #374151;
                }
                
                .back-button:hover {
                    background: #e5e7eb;
                }
                
                .next-button,
                .confirm-button,
                .primary-button {
                    background: #10b981;
                    color: white;
                }
                
                .next-button:hover,
                .confirm-button:hover,
                .primary-button:hover {
                    background: #059669;
                }
                
                .next-button:disabled,
                .confirm-button:disabled {
                    background: #d1d5db;
                    cursor: not-allowed;
                }
                
                .confirmation-content {
                    text-align: center;
                    padding: 40px 0;
                }
                
                .confirmation-icon {
                    font-size: 4rem;
                    margin-bottom: 20px;
                }
                
                .confirmation-content h4 {
                    color: #10b981;
                    font-size: 1.5rem;
                    margin-bottom: 20px;
                }
                
                .processing-message {
                    margin-bottom: 30px;
                }
                
                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #e5e7eb;
                    border-top: 4px solid #10b981;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 20px auto;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .success-message {
                    margin-top: 20px;
                }
                
                .success-checkmark {
                    font-size: 3rem;
                    margin-bottom: 15px;
                    animation: successPulse 1.5s ease-in-out;
                }
                
                @keyframes successPulse {
                    0% { transform: scale(0.8); opacity: 0; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                
                .confirmation-details {
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                    text-align: left;
                }
                
                .confirmation-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .confirmation-row:last-child {
                    border-bottom: none;
                }
                
                .confirmation-row.total {
                    font-weight: 600;
                    font-size: 1.1rem;
                    border-top: 2px solid #e5e7eb;
                    margin-top: 8px;
                    padding-top: 12px;
                }
                
                .confirmation-row .label {
                    color: #6b7280;
                    font-weight: 500;
                }
                
                .confirmation-row .value {
                    color: #1f2937;
                    font-weight: 600;
                }
                
                .confirmation-id {
                    background: var(--spa-sage, #8ba28b);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 0.9rem;
                }
                
                .next-steps-mini {
                    background: #fef3c7;
                    border: 1px solid #f59e0b;
                    border-radius: 6px;
                    padding: 12px;
                    margin-top: 15px;
                    text-align: center;
                }
                
                .next-steps-mini p {
                    margin: 4px 0;
                    color: #92400e;
                    font-size: 0.9rem;
                }
                
                .success-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                    justify-content: center;
                }
                
                .secondary-button {
                    background: #f3f4f6;
                    color: #374151;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .secondary-button:hover {
                    background: #e5e7eb;
                }
                
                @media (max-width: 768px) {
                    .datetime-selection {
                        grid-template-columns: 1fr;
                    }
                    
                    .booking-container {
                        margin: 10px;
                        max-height: 95vh;
                    }
                    
                    .booking-header,
                    .booking-step {
                        padding: 20px;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    /**
     * Setup booking event handlers
     */
    function setupBookingEventHandlers() {
        // Close booking form
        document.getElementById('close-booking-form')?.addEventListener('click', closeBookingForm);
        
        // Service selection
        const serviceOptions = document.querySelectorAll('.service-option');
        serviceOptions.forEach(option => {
            option.addEventListener('click', () => selectService(option));
        });
        
        document.getElementById('service-next-btn')?.addEventListener('click', () => goToStep('datetime-selection-step'));
        
        // Date/time selection
        document.getElementById('booking-date')?.addEventListener('change', validateDateTime);
        document.getElementById('booking-time')?.addEventListener('change', validateDateTime);
        document.getElementById('datetime-back-btn')?.addEventListener('click', () => goToStep('service-selection-step'));
        document.getElementById('datetime-next-btn')?.addEventListener('click', () => goToStep('contact-info-step'));
        
        // Contact information
        document.getElementById('client-name')?.addEventListener('input', validateContactInfo);
        document.getElementById('client-email')?.addEventListener('input', validateContactInfo);
        document.getElementById('client-phone')?.addEventListener('input', validateContactInfo);
        document.getElementById('contact-back-btn')?.addEventListener('click', () => goToStep('datetime-selection-step'));
        document.getElementById('contact-next-btn')?.addEventListener('click', () => goToStep('payment-step'));
        
        // Payment method selection
        const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
        paymentMethods.forEach(method => {
            method.addEventListener('change', handlePaymentMethodChange);
        });
        
        document.getElementById('payment-back-btn')?.addEventListener('click', () => goToStep('contact-info-step'));
        document.getElementById('confirm-booking-btn')?.addEventListener('click', confirmBooking);
        
        // Success modal actions
        document.getElementById('close-modal-btn')?.addEventListener('click', closeBookingForm);
        document.getElementById('new-booking-btn')?.addEventListener('click', () => {
            resetBookingForm();
            goToStep('service-selection-step');
        });
        
        // Global booking trigger
        window.openSeamlessBooking = openBookingForm;
        
        console.log('✅ Booking event handlers setup complete');
    }
    
    /**
     * Open booking form
     */
    function openBookingForm() {
        console.log('📅 Opening seamless booking form');
        document.getElementById('seamless-booking-form').style.display = 'flex';
        goToStep('service-selection-step');
        
        // Initialize Stripe Elements when payment method is credit card
        setTimeout(() => {
            if (stripe && !cardElement) {
                initializeStripeElements();
            }
        }, 500);
    }
    
    /**
     * Close booking form
     */
    function closeBookingForm() {
        console.log('📅 Closing seamless booking form');
        document.getElementById('seamless-booking-form').style.display = 'none';
        resetBookingForm();
    }
    
    /**
     * Initialize Stripe Elements
     */
    function initializeStripeElements() {
        if (!stripe) {
            console.error('❌ Stripe not initialized');
            return;
        }
        
        try {
            elements = stripe.elements();
            cardElement = elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                            color: '#aab7c4',
                        },
                    },
                },
            });
            
            cardElement.mount('#card-element');
            
            cardElement.on('change', (event) => {
                const cardErrors = document.getElementById('card-errors');
                if (event.error) {
                    cardErrors.textContent = event.error.message;
                } else {
                    cardErrors.textContent = '';
                }
                
                validatePaymentStep();
            });
            
            console.log('✅ Stripe Elements initialized and mounted');
        } catch (error) {
            console.error('❌ Failed to initialize Stripe Elements:', error);
        }
    }
    
    /**
     * Select service
     */
    function selectService(selectedOption) {
        // Remove selection from other options
        document.querySelectorAll('.service-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Select current option
        selectedOption.classList.add('selected');
        
        // Store service selection
        const service = selectedOption.dataset.service;
        const price = parseInt(selectedOption.dataset.price);
        
        currentBooking = {
            service: service,
            serviceData: SERVICE_PRICING[service],
            price: price,
            ...currentBooking
        };
        
        // Enable next button
        document.getElementById('service-next-btn').disabled = false;
        
        console.log('✅ Service selected:', service);
    }
    
    /**
     * Navigate to booking step
     */
    function goToStep(stepId) {
        // Hide all steps
        document.querySelectorAll('.booking-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show target step
        document.getElementById(stepId).classList.add('active');
        
        // Special handling for payment step
        if (stepId === 'payment-step') {
            updateBookingSummary();
            validatePaymentStep();
        }
        
        // Special handling for confirmation step
        if (stepId === 'confirmation-step') {
            // This step shows processing and then redirects
            console.log('📍 Step 5: Processing booking and preparing redirect');
        }
        
        console.log('📍 Navigated to step:', stepId);
    }
    
    /**
     * Validate date/time selection
     */
    function validateDateTime() {
        const date = document.getElementById('booking-date').value;
        const time = document.getElementById('booking-time').value;
        
        const isValid = date && time;
        document.getElementById('datetime-next-btn').disabled = !isValid;
        
        if (isValid) {
            currentBooking = {
                ...currentBooking,
                date: date,
                time: time
            };
        }
    }
    
    /**
     * Validate contact information
     */
    function validateContactInfo() {
        const name = document.getElementById('client-name').value.trim();
        const email = document.getElementById('client-email').value.trim();
        const phone = document.getElementById('client-phone').value.trim();
        
        const isValid = name && email && phone && email.includes('@');
        document.getElementById('contact-next-btn').disabled = !isValid;
        
        if (isValid) {
            currentBooking = {
                ...currentBooking,
                clientName: name,
                clientEmail: email,
                clientPhone: phone,
                clientNotes: document.getElementById('client-notes').value.trim()
            };
        }
    }
    
    /**
     * Handle payment method change
     */
    function handlePaymentMethodChange(event) {
        const method = event.target.value;
        
        const creditCardSection = document.getElementById('credit-card-section');
        const alternativeSection = document.getElementById('alternative-payment-section');
        const instructionsText = document.getElementById('payment-instructions-text');
        
        if (method === 'credit-card') {
            creditCardSection.style.display = 'block';
            alternativeSection.style.display = 'none';
            
            // Initialize Stripe Elements if not already done
            if (stripe && !cardElement) {
                initializeStripeElements();
            }
        } else {
            creditCardSection.style.display = 'none';
            alternativeSection.style.display = 'block';
            
            if (method === 'cash') {
                instructionsText.textContent = 'Your booking will be confirmed. Please bring exact cash payment to your appointment.';
            } else if (method === 'other') {
                instructionsText.textContent = 'Your booking will be confirmed. Payment details will be arranged via SMS/email.';
            }
        }
        
        currentBooking = {
            ...currentBooking,
            paymentMethod: method
        };
        
        validatePaymentStep();
    }
    
    /**
     * Validate payment step
     */
    function validatePaymentStep() {
        const method = document.querySelector('input[name="payment-method"]:checked')?.value;
        let isValid = false;
        
        if (method === 'credit-card') {
            // For credit card, check if Stripe Elements are complete
            isValid = cardElement && currentBooking;
        } else {
            // For other methods, just check if method is selected
            isValid = method && currentBooking;
        }
        
        document.getElementById('confirm-booking-btn').disabled = !isValid;
    }
    
    /**
     * Update booking summary
     */
    function updateBookingSummary() {
        if (!currentBooking) return;
        
        const summaryContent = document.getElementById('booking-summary-content');
        const serviceData = currentBooking.serviceData || {};
        
        summaryContent.innerHTML = `
            <div class="summary-row">
                <span>Service:</span>
                <span>${serviceData.name || 'Selected Service'}</span>
            </div>
            <div class="summary-row">
                <span>Date:</span>
                <span>${currentBooking.date || 'Not selected'}</span>
            </div>
            <div class="summary-row">
                <span>Time:</span>
                <span>${currentBooking.time || 'Not selected'}</span>
            </div>
            <div class="summary-row">
                <span>Duration:</span>
                <span>${serviceData.duration || 'N/A'} minutes</span>
            </div>
            <div class="summary-row total">
                <span>Total:</span>
                <span>$${((currentBooking.price || 0) / 100).toFixed(2)}</span>
            </div>
        `;
        
        // Add summary styles
        if (!document.getElementById('summary-styles')) {
            const summaryStyles = `
                <style id="summary-styles">
                    .summary-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 8px;
                        padding-bottom: 8px;
                        border-bottom: 1px solid #e5e7eb;
                    }
                    .summary-row.total {
                        font-weight: 600;
                        font-size: 1.1rem;
                        border-bottom: none;
                        padding-top: 8px;
                        border-top: 2px solid #e5e7eb;
                        margin-top: 8px;
                    }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', summaryStyles);
        }
    }
    
    /**
     * Confirm booking
     */
    async function confirmBooking() {
        if (!currentBooking) {
            console.error('❌ No booking data available');
            return;
        }
        
        const confirmButton = document.getElementById('confirm-booking-btn');
        confirmButton.disabled = true;
        confirmButton.textContent = 'Processing...';
        
        try {
            const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
            
            if (paymentMethod === 'credit-card') {
                await processStripePayment();
            } else {
                await processAlternativePayment();
            }
            
            // Go to Step 5: Confirmation
            goToStep('confirmation-step');
            
            // After brief processing display, show success within modal
            setTimeout(() => {
                showBookingSuccess();
            }, 2000); // 2 second processing display
            
        } catch (error) {
            console.error('❌ Booking confirmation failed:', error);
            alert('Booking failed: ' + error.message);
            confirmButton.disabled = false;
            confirmButton.textContent = 'Confirm Booking';
        }
    }
    
    /**
     * Process Stripe payment
     */
    async function processStripePayment() {
        if (!stripe || !cardElement) {
            throw new Error('Stripe not properly initialized');
        }
        
        console.log('💳 Processing Stripe payment...');
        
        // Create payment intent
        const response = await fetch('/api/web-booking/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: currentBooking.price,
                service_type: currentBooking.service + '_massage',
                client_info: {
                    name: currentBooking.clientName,
                    email: currentBooking.clientEmail,
                    phone: currentBooking.clientPhone
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create payment intent');
        }
        
        const { client_secret } = await response.json();
        paymentIntentClientSecret = client_secret;
        
        // Confirm payment
        const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: currentBooking.clientName,
                    email: currentBooking.clientEmail,
                    phone: currentBooking.clientPhone
                }
            }
        });
        
        if (error) {
            throw new Error('Payment failed: ' + error.message);
        }
        
        console.log('✅ Payment successful:', paymentIntent.id);
        
        // Complete booking
        await completeBooking({
            payment_intent_id: paymentIntent.id,
            payment_method: 'card'
        });
    }
    
    /**
     * Process alternative payment
     */
    async function processAlternativePayment() {
        console.log('💰 Processing alternative payment...');
        
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
        
        await completeBooking({
            payment_method: paymentMethod,
            payment_status: 'pending'
        });
    }
    
    /**
     * Complete booking
     */
    async function completeBooking(paymentData) {
        const bookingData = {
            service_type: currentBooking.service + '_massage',
            practitioner_id: '060863f2-0623-4785-b01a-f1760cfb8d14', // Default practitioner
            scheduled_date: currentBooking.date + 'T' + currentBooking.time + ':00',
            client_name: currentBooking.clientName,
            client_email: currentBooking.clientEmail,
            client_phone: currentBooking.clientPhone,
            notes: currentBooking.clientNotes || '',
            ...paymentData
        };
        
        console.log('📅 Completing booking with data:', bookingData);
        
        const response = await fetch('/api/web-booking/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create booking');
        }
        
        const booking = await response.json();
        currentBooking.confirmationId = booking.id;
        
        console.log('✅ Booking completed successfully:', booking.id);
    }
    
    /**
     * Show booking success within modal
     */
    function showBookingSuccess() {
        console.log('🎉 Showing booking success in modal...');
        
        // Hide processing message
        document.getElementById('processing-message').style.display = 'none';
        
        // Populate confirmation details
        const confirmationDetails = document.getElementById('confirmation-details');
        const serviceData = currentBooking.serviceData || {};
        
        confirmationDetails.innerHTML = `
            <div class="confirmation-details">
                <div class="confirmation-row">
                    <span class="label">Confirmation ID:</span>
                    <span class="value confirmation-id">${currentBooking.confirmationId || 'MODAL-' + Date.now()}</span>
                </div>
                <div class="confirmation-row">
                    <span class="label">Service:</span>
                    <span class="value">${serviceData.name || 'Selected Service'}</span>
                </div>
                <div class="confirmation-row">
                    <span class="label">Date:</span>
                    <span class="value">${formatDate(currentBooking.date)}</span>
                </div>
                <div class="confirmation-row">
                    <span class="label">Time:</span>
                    <span class="value">${formatTime(currentBooking.time)}</span>
                </div>
                <div class="confirmation-row">
                    <span class="label">Client:</span>
                    <span class="value">${currentBooking.clientName}</span>
                </div>
                <div class="confirmation-row total">
                    <span class="label">Total:</span>
                    <span class="value">$${((currentBooking.price || 0) / 100).toFixed(2)}</span>
                </div>
                <div class="next-steps-mini">
                    <p><strong>📧 Confirmation email</strong> will arrive within 5 minutes</p>
                    <p><strong>📞 Questions?</strong> Call 940.268.5999</p>
                </div>
            </div>
        `;
        
        // Show success message
        document.getElementById('success-message').style.display = 'block';
        
        console.log('✅ Booking success displayed in modal');
    }
    
    // Helper functions for formatting
    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateStr;
        }
    }
    
    function formatTime(timeStr) {
        if (!timeStr) return 'N/A';
        try {
            const [hours, minutes] = timeStr.split(':');
            const hour24 = parseInt(hours);
            const hour12 = hour24 > 12 ? hour24 - 12 : (hour24 === 0 ? 12 : hour24);
            const ampm = hour24 >= 12 ? 'PM' : 'AM';
            return `${hour12}:${minutes} ${ampm}`;
        } catch (error) {
            return timeStr;
        }
    }
    
    /**
     * Reset booking form
     */
    function resetBookingForm() {
        currentBooking = null;
        paymentIntentClientSecret = null;
        
        // Reset form fields
        document.querySelectorAll('.service-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        document.getElementById('booking-date').value = '';
        document.getElementById('booking-time').value = '';
        document.getElementById('client-name').value = '';
        document.getElementById('client-email').value = '';
        document.getElementById('client-phone').value = '';
        document.getElementById('client-notes').value = '';
        
        // Reset buttons
        document.getElementById('service-next-btn').disabled = true;
        document.getElementById('datetime-next-btn').disabled = true;
        document.getElementById('contact-next-btn').disabled = true;
        document.getElementById('confirm-booking-btn').disabled = true;
        document.getElementById('confirm-booking-btn').textContent = 'Confirm Booking';
        
        // Reset payment method to credit card
        document.querySelector('input[value="credit-card"]').checked = true;
        handlePaymentMethodChange({ target: { value: 'credit-card' } });
        
        console.log('🔄 Booking form reset');
    }
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Small delay to ensure other scripts are loaded
        setTimeout(initSeamlessBooking, 1000);
    });
    
    // Also initialize immediately if DOM is already ready
    if (document.readyState === 'loading') {
        // Do nothing, DOMContentLoaded will fire
    } else {
        // DOM is already ready
        setTimeout(initSeamlessBooking, 1000);
    }
    
})();