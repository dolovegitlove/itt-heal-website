/**
 * ITT Heal - Admin Dashboard Shared Configuration
 * Imports from shared frontend constants with admin-specific modifications
 */

// CLAUDE.md Compliance: Pricing loaded from centralized backend API
// No hardcoded pricing configurations - use API endpoints
let PRICING_CONFIG = null;
let ADDON_CONFIG = null;

// Load pricing from centralized API
async function loadPricingConfig() {
  try {
    const [sessionsResponse, addonsResponse] = await Promise.all([
      fetch('/api/pricing/sessions'),
      fetch('/api/pricing/addons')
    ]);
    
    if (sessionsResponse.ok && addonsResponse.ok) {
      const sessionsData = await sessionsResponse.json();
      const addonsData = await addonsResponse.json();
      
      if (sessionsData.success && addonsData.success) {
        // Transform API data to match expected format
        PRICING_CONFIG = {
          sessions: Object.fromEntries(
            Object.entries(sessionsData.data).map(([key, session]) => [
              key,
              {
                duration: session.duration,
                appPrice: session.price,
                webPrice: session.price,
                title: session.name,
                description: session.description,
                features: session.features || [],
                category: session.category,
                badge: session.badge || '',
                popular: session.popular || false,
                premium: session.premium || false
              }
            ])
          )
        };
        
        ADDON_CONFIG = Object.fromEntries(
          addonsData.data.map(addon => [
            addon.id,
            {
              id: addon.id,
              name: addon.name,
              price: addon.price,
              duration_adjustment: addon.duration_adjustment || 0,
              description: addon.description,
              category: addon.category,
              available_for: addon.available_for || []
            }
          ])
        );
        
        console.log('✅ Pricing config loaded from centralized API');
        return true;
      }
    }
  } catch (error) {
    console.error('Failed to load pricing config from API:', error);
  }
  return false;
}

// Initialize all configuration on load
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadPricingConfig(),
    loadServiceTypes()
  ]);
  
  // Ensure ITTHealConfig is available globally after loading
  if (typeof window.ITTHealConfig === 'undefined') {
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
  }
  
  // Dispatch event to notify other components that config is loaded
  window.dispatchEvent(new CustomEvent('ittConfigLoaded', {
    detail: { pricing: PRICING_CONFIG, addons: ADDON_CONFIG, services: SERVICE_TYPES }
  }));
});

// Service type enums - loaded from backend API to maintain single source of truth
let SERVICE_TYPES = null;

// Load service types from API
async function loadServiceTypes() {
  try {
    const response = await fetch('/api/web-booking/services');
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        SERVICE_TYPES = Object.fromEntries(
          result.data.map(service => [service.type, service.type])
        );
        console.log('✅ Service types loaded from API');
        return true;
      }
    }
  } catch (error) {
    console.error('Failed to load service types:', error);
  }
  return false;
}

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
  if (!PRICING_CONFIG?.sessions) {
    console.warn('Pricing config not loaded yet, returning 0');
    return 0;
  }
  const session = PRICING_CONFIG.sessions[sessionKey];
  return session ? session.webPrice : 0;
}

/**
 * Get available addons for a specific session type
 * @param {string} sessionType - Session type (60min, 90min, etc.)
 * @returns {Array} Array of available addons
 */
function getAvailableAddons(sessionType) {
  if (!ADDON_CONFIG) {
    console.warn('Addon config not loaded yet, returning empty array');
    return [];
  }
  return Object.values(ADDON_CONFIG).filter(addon => 
    addon.available_for && addon.available_for.includes(sessionType)
  );
}

/**
 * Calculate total addon price
 * @param {Array} selectedAddons - Array of addon IDs
 * @returns {number} Total price for selected addons
 */
function calculateAddonTotal(selectedAddons) {
  if (!ADDON_CONFIG) {
    console.warn('Addon config not loaded yet, returning 0');
    return 0;
  }
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
  if (!ADDON_CONFIG) {
    console.warn('Addon config not loaded yet, returning 0');
    return 0;
  }
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
  // Check if PRICING_CONFIG and sessions are loaded
  if (!PRICING_CONFIG || !PRICING_CONFIG.sessions) {
    console.warn('PRICING_CONFIG not loaded yet, returning fallback options');
    return [
      { value: '60min_massage', label: 'Loading options...', price: 0, duration: 60 },
      { value: '90min_massage', label: 'Loading options...', price: 0, duration: 90 }
    ];
  }
  
  return Object.entries(PRICING_CONFIG.sessions).map(([key, session]) => ({
    value: key,
    label: `${session.title} - $${session.webPrice}`,
    price: session.webPrice,
    duration: session.duration
  }));
}

/**
 * Check if pricing configuration is loaded
 * @returns {boolean} Whether pricing config is ready
 */
function isPricingConfigReady() {
  return !!(PRICING_CONFIG && PRICING_CONFIG.sessions && ADDON_CONFIG);
}

/**
 * Wait for pricing configuration to load
 * @param {number} maxWaitMs - Maximum time to wait in milliseconds
 * @returns {Promise<boolean>} Whether config loaded successfully
 */
function waitForPricingConfig(maxWaitMs = 5000) {
  return new Promise((resolve) => {
    if (isPricingConfigReady()) {
      resolve(true);
      return;
    }
    
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isPricingConfigReady()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > maxWaitMs) {
        clearInterval(checkInterval);
        console.warn('Timeout waiting for pricing config to load');
        resolve(false);
      }
    }, 100);
  });
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
  calculateBookingPricing,
  isPricingConfigReady,
  waitForPricingConfig
};