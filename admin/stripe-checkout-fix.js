/**
 * Fix admin Stripe payment to use same checkout session flow as user bookings
 */

// Replace the complex inline payment with simple checkout session
async function createAdminCheckoutSession(bookingData) {
  console.log('🔄 Creating Stripe checkout session for admin booking...');

  try {
    // Use the same backend endpoint as user bookings
    const response = await fetch('https://ittheal.com/api/bookings/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-access': 'dr-shiffer-emergency-access'
      },
      body: JSON.stringify({
        amount: bookingData.final_price,
        description: `Payment for ${bookingData.client_name}`,
        metadata: {
          booking_id: bookingData.id || 'admin_created',
          client_name: bookingData.client_name,
          client_email: bookingData.client_email,
          admin_initiated: 'true'
        },
        success_url: window.location.origin + '/admin?payment=success',
        cancel_url: window.location.origin + '/admin?payment=cancelled'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.sessionId || data.session_id) {
      // Redirect to Stripe Checkout (same as user flow)
      const stripe = Stripe('pk_test_51RRBjzFxOpfkAGId3DsG7kyXDLKUET2Ht5jvpxzxKlELzjgwkRctz4goXrNJ5TqfQqufJBhEDuBoxfoZhxlbkNdm00cqSQtKVN');

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId || data.session_id
      });

      if (error) {
        console.error('Stripe redirect error:', error);
        throw error;
      }

      return { success: true };
    }
    throw new Error('No session ID returned');


  } catch (error) {
    console.error('❌ Checkout session error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Simplified payment handler for admin
async function processAdminStripePayment(bookingData) {
  console.log('💳 Processing admin Stripe payment...');

  // Skip if not digital payment
  if (bookingData.payment_method !== 'digital') {
    return { success: true, message: 'Non-digital payment' };
  }

  // Show simple confirmation
  const confirm = window.confirm(
    'Process Stripe Payment\n\n' +
    `Amount: $${bookingData.final_price.toFixed(2)}\n` +
    `Client: ${bookingData.client_name}\n\n` +
    'You will be redirected to Stripe\'s secure checkout page.'
  );

  if (!confirm) {
    return { success: false, message: 'Payment cancelled' };
  }

  // Create checkout session and redirect
  return await createAdminCheckoutSession(bookingData);
}

// Export for admin dashboard
window.adminStripeCheckout = {
  processPayment: processAdminStripePayment,
  createCheckoutSession: createAdminCheckoutSession
};
