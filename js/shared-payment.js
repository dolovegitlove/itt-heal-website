// Frontend constants aligned with backend enums
const PAYMENT_TYPES = {
  card: 'card',
  cash: 'cash',
  bank_transfer: 'bank_transfer',
  insurance: 'insurance',
  other: 'other',
  comp: 'comp'
};

const PAYMENT_STATUS = {
  unpaid: 'unpaid',
  paid: 'paid',
  partial: 'partial',
  refunded: 'refunded',
  complimentary: 'complimentary'
};

const SERVICE_TYPES = {
  '30min': '30min',
  '60min': '60min',
  '90min': '90min',
  '120min': '120min',
  consultation: 'consultation',
  follow_up: 'follow_up',
  subscription: 'subscription',
  package: 'package',
  other: 'other'
};

/**
 * ITT Heal - Shared Payment Component
 * Single source of truth for payment functionality across user booking and admin interfaces
 */

class ITTPaymentManager {
    constructor(options = {}) {
        this.containerId = options.containerId || 'payment-container';
        this.formPrefix = options.formPrefix || '';
        this.onPaymentMethodChange = options.onPaymentMethodChange || null;
        this.isAdminMode = options.isAdminMode || false;
        this.stripe = null;
        this.cardElement = null;
        this.currentPaymentMethod = 'credit_card';
        
        this.init();
    }
    
    async init() {
        // Initialize Stripe if not admin mode
        if (!this.isAdminMode && window.Stripe) {
            this.stripe = Stripe('pk_live_51RRBjzFxOpfkAGIdJjkEORbCZPPZjvMQW8scmVNxxgcuB0v96NQVgmvbvA6ilCBZzyKj4CuyZMDjh4udoMihhflX00uqEC3iQk');
            this.setupStripeElements();
        }
        
        this.render();
        this.attachEventListeners();
    }
    
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('Payment container not found:', this.containerId);
            return;
        }
        
        container.innerHTML = this.getPaymentHTML();
    }
    
    getPaymentHTML() {
        const prefix = this.formPrefix;
        
        return `
            <!-- Payment Method Selection -->
            <div class="payment-method-section">
                <label class="form-label">Payment Method</label>
                <div class="payment-methods-grid">
                    <label class="payment-method-option" data-method="credit_card">
                        <input type="radio" name="${prefix}payment_method" value="credit_card" ${this.currentPaymentMethod === 'credit_card' ? 'checked' : ''}>
                        <div class="payment-method-content">
                            <div class="payment-method-title">💳 Credit Card</div>
                            <div class="payment-method-desc">Secure online payment${this.isAdminMode ? '' : ' via Stripe'}</div>
                        </div>
                    </label>
                    
                    <label class="payment-method-option" data-method=PAYMENT_TYPES['cash']>
                        <input type="radio" name="${prefix}payment_method" value=PAYMENT_TYPES['cash']>
                        <div class="payment-method-content">
                            <div class="payment-method-title">💵 Cash</div>
                            <div class="payment-method-desc">Pay${this.isAdminMode ? ' at appointment' : ' in cash at your appointment'}</div>
                        </div>
                    </label>
                    
                    <label class="payment-method-option" data-method=SERVICE_TYPES['other']_TYPES['other']>
                        <input type="radio" name="${prefix}payment_method" value=SERVICE_TYPES['other']_TYPES['other']>
                        <div class="payment-method-content">
                            <div class="payment-method-title">📱 Other</div>
                            <div class="payment-method-desc">${this.isAdminMode ? 'Venmo, CashApp, etc.' : 'Venmo, CashApp - arranged with practitioner'}</div>
                        </div>
                    </label>
                    
                    <label class="payment-method-option" data-method=PAYMENT_TYPES['comp']>
                        <input type="radio" name="${prefix}payment_method" value=PAYMENT_TYPES['comp']>
                        <div class="payment-method-content">
                            <div class="payment-method-title">🎁 Comp</div>
                            <div class="payment-method-desc">Complimentary${this.isAdminMode ? '' : ' appointment'}</div>
                        </div>
                    </label>
                </div>
            </div>
            
            <!-- Comp Type Selection -->
            <div id="${prefix}comp-type-section" class="comp-type-section" style="display: none;">
                <label class="form-label" for="${prefix}comp-type">Comp Type *</label>
                <select name="${prefix}comp_type" id="${prefix}comp-type" class="form-select">
                    <option value="">Select comp type...</option>
                    <option value="family">Family</option>
                    <option value="friends">Friends</option>
                    <option value="veterans">Veterans</option>
                    <option value="elderly">Elderly</option>
                    <option value="practitioner">Practitioner Comp</option>
                    <option value="referral">Referral Comp</option>
                    <option value="staff">Staff Comp</option>
                    <option value="marketing">Marketing/Promotional</option>
                    <option value="charity">Charity/Community Service</option>
                    <option value=SERVICE_TYPES['other']_TYPES['other']>Other</option>
                </select>
            </div>
            
            <!-- Credit Card Section -->
            <div id="${prefix}credit-card-section" class="credit-card-section" style="display: ${this.currentPaymentMethod === 'credit_card' ? 'block' : 'none'};">
                ${!this.isAdminMode ? `
                <div id="${prefix}stripe-card-element" class="stripe-card-element">
                    <!-- Stripe card element will be mounted here -->
                </div>
                <div id="${prefix}stripe-card-errors" class="stripe-card-errors"></div>
                
                <div class="payment-security-notice">
                    <p>🔒 Your payment is secure and encrypted. We use Stripe for payment processing.</p>
                </div>
                ` : `
                <div class="admin-credit-card-note">
                    <p>💳 Credit card payment will be processed separately</p>
                </div>
                `}
            </div>
            
            <!-- Alternative Payment Instructions -->
            <div id="${prefix}alternative-payment-section" class="alternative-payment-section" style="display: none;">
                <div class="payment-instructions">
                    <p id="${prefix}payment-instructions">Payment instructions will appear here.</p>
                </div>
            </div>
        `;
    }
    
    getPaymentCSS() {
        return `
            .payment-method-section {
                margin-bottom: 1.5rem;
            }
            
            .payment-methods-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 0.75rem;
                margin-top: 0.5rem;
            }
            
            .payment-method-option {
                display: flex;
                align-items: center;
                padding: 0.75rem;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                cursor: pointer;
                background: white;
                transition: all 0.2s ease;
            }
            
            .payment-method-option:hover {
                border-color: #10b981;
                background: #f0fdf4;
            }
            
            .payment-method-option.selected {
                border-color: #10b981;
                background: #f0fdf4;
            }
            
            .payment-method-option input[type="radio"] {
                margin-right: 0.75rem;
            }
            
            .payment-method-content {
                flex: 1;
            }
            
            .payment-method-title {
                font-weight: 600;
                color: var(--text-primary, #1f2937);
                margin-bottom: 0.25rem;
            }
            
            .payment-method-desc {
                font-size: 0.875rem;
                color: var(--text-secondary, #6b7280);
            }
            
            .comp-type-section,
            .credit-card-section,
            .alternative-payment-section {
                margin-bottom: 1.5rem;
            }
            
            .stripe-card-element {
                padding: 0.75rem;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                background: white;
                margin: 1rem 0;
            }
            
            .stripe-card-errors {
                color: #dc2626;
                margin-top: 0.5rem;
                font-size: 0.875rem;
            }
            
            .payment-security-notice {
                background: #f0f9ff;
                border: 1px solid #3b82f6;
                border-radius: 8px;
                padding: 1rem;
                margin-top: 1rem;
            }
            
            .payment-security-notice p {
                color: #1e40af;
                margin: 0;
                font-size: 0.875rem;
            }
            
            .admin-credit-card-note {
                background: #f8faf8;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                padding: 1rem;
            }
            
            .admin-credit-card-note p {
                color: #6b7280;
                margin: 0;
                font-size: 0.875rem;
            }
            
            .payment-instructions {
                background: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 8px;
                padding: 1rem;
            }
            
            .payment-instructions p {
                color: #92400e;
                margin: 0;
                font-size: 0.875rem;
            }
        `;
    }
    
    setupStripeElements() {
        if (!this.stripe) return;
        
        const elements = this.stripe.elements();
        this.cardElement = elements.create(PAYMENT_TYPES['card'], {
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
        
        // Mount after DOM is ready
        setTimeout(() => {
            const cardElementContainer = document.getElementById(`${this.formPrefix}stripe-card-element`);
            if (cardElementContainer) {
                this.cardElement.mount(cardElementContainer);
                
                // Handle real-time validation errors from the card Element
                this.cardElement.on('change', (event) => {
                    const displayError = document.getElementById(`${this.formPrefix}stripe-card-errors`);
                    if (event.error) {
                        displayError.textContent = event.error.message;
                    } else {
                        displayError.textContent = '';
                    }
                });
            }
        }, 100);
    }
    
    attachEventListeners() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        // Payment method selection
        container.addEventListener('change', (e) => {
            if (e.target.name === `${this.formPrefix}payment_method`) {
                this.handlePaymentMethodChange(e.target.value);
            }
        });
        
        // Visual selection for payment method options
        container.addEventListener('click', (e) => {
            const option = e.target.closest('.payment-method-option');
            if (option) {
                const method = option.dataset.method;
                if (method) {
                    this.selectPaymentMethod(method);
                }
            }
        });
    }
    
    selectPaymentMethod(method) {
        this.currentPaymentMethod = method;
        
        // Update radio button
        const radio = document.querySelector(`input[name="${this.formPrefix}payment_method"][value="${method}"]`);
        if (radio) {
            radio.checked = true;
        }
        
        this.handlePaymentMethodChange(method);
        
        // Trigger callback to recalculate pricing
        if (this.onPaymentMethodChange) {
            this.onPaymentMethodChange(method);
        }
    }
    
    handlePaymentMethodChange(method) {
        const prefix = this.formPrefix;
        
        // Update visual selection
        document.querySelectorAll('.payment-method-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`.payment-method-option[data-method="${method}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        // Show/hide sections
        const creditCardSection = document.getElementById(`${prefix}credit-card-section`);
        const alternativeSection = document.getElementById(`${prefix}alternative-payment-section`);
        const compTypeSection = document.getElementById(`${prefix}comp-type-section`);
        const instructionsP = document.getElementById(`${prefix}payment-instructions`);
        
        if (method === 'credit_card') {
            if (creditCardSection) creditCardSection.style.display = 'block';
            if (alternativeSection) alternativeSection.style.display = 'none';
            if (compTypeSection) compTypeSection.style.display = 'none';
        } else if (method === PAYMENT_TYPES['comp']) {
            if (creditCardSection) creditCardSection.style.display = 'none';
            if (alternativeSection) alternativeSection.style.display = 'block';
            if (compTypeSection) compTypeSection.style.display = 'block';
            
            if (instructionsP) {
                instructionsP.textContent = this.isAdminMode 
                    ? 'Complimentary booking - no payment required. Select comp type above.'
                    : 'Your complimentary appointment will be confirmed. Please select the comp type above. No payment required.';
            }
        } else {
            if (creditCardSection) creditCardSection.style.display = 'none';
            if (alternativeSection) alternativeSection.style.display = 'block';
            if (compTypeSection) compTypeSection.style.display = 'none';
            
            if (instructionsP) {
                if (method === PAYMENT_TYPES['cash']) {
                    instructionsP.textContent = this.isAdminMode
                        ? 'Cash payment to be collected at appointment.'
                        : 'Your booking will be confirmed. Please bring exact cash payment to your appointment. Receipt will be provided for Dr. reconciliation.';
                } else if (method === SERVICE_TYPES['other']_TYPES['other']) {
                    instructionsP.textContent = this.isAdminMode
                        ? 'Alternative payment method (Venmo, CashApp, etc.)'
                        : 'Your booking will be confirmed. Venmo/CashApp payment details will be provided via SMS/email. Receipt will be provided for Dr. reconciliation.';
                }
            }
        }
        
        // Call callback if provided
        if (this.onPaymentMethodChange) {
            this.onPaymentMethodChange(method);
        }
    }
    
    // Payment processing methods
    async createPaymentIntent(amount, serviceType, clientInfo) {
        if (!this.isAdminMode && this.currentPaymentMethod === 'credit_card') {
            const response = await fetch('/api/web-booking/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amount,
                    service_type: serviceType,
                    client_info: clientInfo
                })
            });
            
            if (!response.ok) {
                throw new Error(`Payment setup failed: ${response.status}`);
            }
            
            return await response.json();
        }
        
        return null;
    }
    
    async confirmCardPayment(clientSecret, clientInfo) {
        if (!this.stripe || !this.cardElement) {
            throw new Error('Stripe not initialized');
        }
        
        const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: this.cardElement,
                billing_details: {
                    name: clientInfo.name,
                    email: clientInfo.email
                }
            }
        });
        
        if (error) {
            throw new Error(`Stripe payment failed: ${error.message}`);
        }
        
        return paymentIntent;
    }
    
    getSelectedPaymentMethod() {
        const radio = document.querySelector(`input[name="${this.formPrefix}payment_method"]:checked`);
        return radio ? radio.value : this.currentPaymentMethod;
    }
    
    getCompType() {
        const compTypeSelect = document.getElementById(`${this.formPrefix}comp-type`);
        return compTypeSelect ? compTypeSelect.value : '';
    }
    
    validatePayment() {
        const method = this.getSelectedPaymentMethod();
        
        if (method === PAYMENT_TYPES['comp']) {
            const compType = this.getCompType();
            if (!compType) {
                throw new Error('Please select a comp type');
            }
        }
        
        return true;
    }
    
    // Method to auto-select payment method based on payment status and tip
    updatePaymentMethodBasedOnStatus(paymentStatus, tipAmount) {
        const isComplimentary = paymentStatus === BOOKING_TYPES['complimentary']'complimentary'];
        const hasTip = parseFloat(tipAmount) > 0;
        const currentMethod = this.getSelectedPaymentMethod();
        
        if (isComplimentary) {
            if (hasTip) {
                // Complimentary with tip - need actual payment method for tip processing
                // Keep current selection if it's not comp, otherwise default to credit card
                if (currentMethod === PAYMENT_TYPES['comp']) {
                    this.selectPaymentMethod('credit_card');
                    this.showPaymentMethodNote('Payment method changed to Credit Card for tip processing');
                }
            } else {
                // Pure complimentary - no payment needed
                if (currentMethod !== PAYMENT_TYPES['comp']) {
                    this.selectPaymentMethod(PAYMENT_TYPES['comp']);
                    this.showPaymentMethodNote('Payment method set to Complimentary');
                }
            }
        }
        // For non-complimentary status, let user choose payment method freely
    }
    
    // Helper method to show temporary payment method change notifications
    showPaymentMethodNote(message) {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        // Remove existing note
        const existingNote = container.querySelector('.payment-method-note');
        if (existingNote) {
            existingNote.remove();
        }
        
        // Create new note
        const note = document.createElement('div');
        note.className = 'payment-method-note';
        note.style.cssText = `
            background: #e0f2fe;
            border: 1px solid #0891b2;
            border-radius: 6px;
            padding: 0.5rem 0.75rem;
            margin-top: 0.5rem;
            color: #0e7490;
            font-size: 0.875rem;
            animation: fadeInOut 3s ease-in-out;
        `;
        note.textContent = message;
        
        // Add CSS animation if not already added
        if (!document.getElementById('payment-method-note-styles')) {
            const style = document.createElement('style');
            style.id = 'payment-method-note-styles';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateY(-10px); }
                    15%, 85% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        container.appendChild(note);
        
        // Remove after animation
        setTimeout(() => {
            if (note.parentNode) {
                note.remove();
            }
        }, 3000);
    }
    
    // Method to populate form data from existing booking (for edit mode)
    populateFromBooking(booking) {
        if (booking.payment_method) {
            this.selectPaymentMethod(booking.payment_method);
        }
        
        if (booking.comp_type) {
            const compTypeSelect = document.getElementById(`${this.formPrefix}comp-type`);
            if (compTypeSelect) {
                compTypeSelect.value = booking.comp_type;
            }
        }
    }
    
    // Method to inject CSS
    injectCSS() {
        const styleId = 'itt-payment-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = this.getPaymentCSS();
            document.head.appendChild(style);
        }
    }
    
    destroy() {
        if (this.cardElement) {
            this.cardElement.destroy();
        }
    }
}

// Export for use in other modules
window.ITTPaymentManager = ITTPaymentManager;