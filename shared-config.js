/**
 * ITT Heal - Admin Dashboard Shared Configuration
 * Imports from shared frontend constants with admin-specific modifications
 */

// Import shared pricing configuration (converted from TypeScript)
const PRICING_CONFIG = {
  sessions: {
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
      badge: 'Therapeutic Flagship'
    },
    '120min': {
      duration: 120,
      appPrice: 225,
      webPrice: 235,
      title: '120-Minute Deep Transformation',
      description: 'Comprehensive therapeutic session',
      features: [
        'Everything in 90-min +',
        'Extended assessment',
        'Multiple therapeutic modalities',
        'Comprehensive aftercare plan'
      ],
      premium: true,
      badge: 'Ultimate Experience'
    },
    'consultation': {
      duration: 30,
      appPrice: 60,
      webPrice: 70,
      title: 'Initial Consultation',
      description: 'Assessment and treatment planning',
      features: [
        'Health history review',
        'Physical assessment',
        'Treatment plan development',
        'Goal setting'
      ]
    }
  }
};

// Shared addon configuration
const ADDON_CONFIG = {
  reflexology: {
    id: 'reflexology',
    name: 'Reflexology',
    price: 25.00,
    duration_adjustment: 15,
    description: 'Foot reflexology treatment targeting pressure points',
    category: 'therapy',
    available_for: ['60min', '90min', '120min']
  },
  aromatherapy: {
    id: 'aromatherapy', 
    name: 'Aromatherapy',
    price: 15.00,
    duration_adjustment: 0,
    description: 'Essential oil therapy during massage',
    category: 'enhancement',
    available_for: ['60min', '90min', '120min']
  },
  hot_stones: {
    id: 'hot_stones',
    name: 'Hot Stones',
    price: 30.00,
    duration_adjustment: 10,
    description: 'Heated stone therapy for deep muscle relaxation',
    category: 'therapy',
    available_for: ['90min', '120min']
  },
  cupping: {
    id: 'cupping',
    name: 'Cupping Therapy',
    price: 20.00,
    duration_adjustment: 10,
    description: 'Therapeutic cupping for muscle tension relief',
    category: 'therapy',
    available_for: ['60min', '90min', '120min']
  }
};

// Service type enums - synchronized with backend
const SERVICE_TYPES = {
  '60min': '60min',
  '90min': '90min',
  '120min': '120min',
  consultation: 'consultation',
  follow_up: 'follow_up'
};

// Payment status enums - synchronized with backend
const PAYMENT_STATUS = {
  unpaid: 'unpaid',
  paid: 'paid',
  partial: 'partial',
  refunded: 'refunded',
  complimentary: 'complimentary'
};

// Session status enums - synchronized with backend
const SESSION_STATUS = {
  scheduled: 'scheduled',
  in_progress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
  no_show: 'no_show',
  pending_approval: 'pending_approval',
  comp_request: 'comp_request'
};

/**
 * Get pricing for a session type (uses web pricing)
 * @param {string} sessionKey - Session type key
 * @returns {number} Session price
 */
function getSessionPrice(sessionKey) {
  const session = PRICING_CONFIG.sessions[sessionKey];
  return session ? session.webPrice : 0;
}

/**
 * Get available addons for a specific session type
 * @param {string} sessionType - Session type (60min, 90min, etc.)
 * @returns {Array} Array of available addons
 */
function getAvailableAddons(sessionType) {
  return Object.values(ADDON_CONFIG).filter(addon => 
    addon.available_for.includes(sessionType)
  );
}

/**
 * Calculate total addon price
 * @param {Array} selectedAddons - Array of addon IDs
 * @returns {number} Total price for selected addons
 */
function calculateAddonTotal(selectedAddons) {
  return selectedAddons.reduce((total, addonId) => {
    const addon = ADDON_CONFIG[addonId];
    return total + (addon?.price || 0);
  }, 0);
}

/**
 * Calculate total duration adjustment from addons
 * @param {Array} selectedAddons - Array of addon IDs
 * @returns {number} Total additional minutes
 */
function calculateDurationAdjustment(selectedAddons) {
  return selectedAddons.reduce((total, addonId) => {
    const addon = ADDON_CONFIG[addonId];
    return total + (addon?.duration_adjustment || 0);
  }, 0);
}

/**
 * Check if an addon is available for a session type
 * @param {string} addonId - Addon ID to check
 * @param {string} sessionType - Session type
 * @returns {boolean} Whether addon is available
 */
function isAddonAvailable(addonId, sessionType) {
  const addon = ADDON_CONFIG[addonId];
  return addon?.available_for.includes(sessionType) || false;
}

/**
 * Get all session option data for dropdowns
 * @returns {Array} Array of session options with pricing
 */
function getSessionOptions() {
  return Object.entries(PRICING_CONFIG.sessions).map(([key, session]) => ({
    value: key,
    label: `${session.title} - $${session.webPrice}`,
    price: session.webPrice,
    duration: session.duration
  }));
}

/**
 * Calculate comprehensive booking pricing
 * @param {Object} bookingData - Booking data object
 * @returns {Object} Pricing breakdown
 */
function calculateBookingPricing(bookingData) {
  const {
    serviceType = '',
    selectedAddons = [],
    tipAmount = 0,
    isCompBooking = false,
    paymentStatus = '',
    paymentMethod = 'credit_card'
  } = bookingData;

  // Get base service price
  const servicePrice = getSessionPrice(serviceType);
  
  // Calculate addons total
  const addonsTotal = calculateAddonTotal(selectedAddons);
  
  // Calculate total price (service + addons)
  const totalPrice = servicePrice + addonsTotal;
  
  // Calculate final price based on comp booking status OR payment status
  let finalPrice;
  const isComplimentary = isCompBooking || paymentStatus === 'complimentary';
  
  if (isComplimentary) {
    // Complimentary booking: final price = tip amount only
    finalPrice = parseFloat(tipAmount) || 0;
  } else {
    // Regular booking: final price = total price + tip
    finalPrice = totalPrice + (parseFloat(tipAmount) || 0);
  }

  return {
    servicePrice,
    addonsTotal,
    totalPrice, // Business value - always service + addons (for reporting/taxes)
    tipAmount: parseFloat(tipAmount) || 0,
    finalPrice, // Payment value - total+tip OR tip-only for comp
    businessValue: totalPrice, // Explicit business value for backend logging
    isCompBooking: isComplimentary,
    durationAdjustment: calculateDurationAdjustment(selectedAddons)
  };
}

// Export for use in admin dashboard
window.ITTHealConfig = {
  PRICING_CONFIG,
  ADDON_CONFIG,
  SERVICE_TYPES,
  PAYMENT_STATUS,
  SESSION_STATUS,
  getSessionPrice,
  getAvailableAddons,
  calculateAddonTotal,
  calculateDurationAdjustment,
  isAddonAvailable,
  getSessionOptions,
  calculateBookingPricing
};