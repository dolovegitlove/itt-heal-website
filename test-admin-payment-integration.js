import { chromium } from 'playwright';

(async () => {
  console.log('🧪 Testing Admin Payment Integration (No Redirect)...\n');

  const browser = await chromium.launch({
    headless: true
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    console.log('🔐 Loading admin dashboard...');
    await page.goto('https://ittheal.com/admin', { waitUntil: 'networkidle' });

    // Wait for dashboard to initialize
    await page.waitForTimeout(3000);

    console.log('📋 Checking if Stripe is loaded...');
    const stripeLoaded = await page.evaluate(() => {
      return typeof window.Stripe !== 'undefined';
    });
    console.log(`   Stripe available: ${stripeLoaded ? '✅' : '❌'}`);

    console.log('🎛️ Checking admin dashboard initialization...');
    const adminDashboardExists = await page.evaluate(() => {
      return typeof window.adminDashboard !== 'undefined' &&
             window.adminDashboard.stripe !== undefined;
    });
    console.log(`   Admin dashboard with Stripe: ${adminDashboardExists ? '✅' : '❌'}`);

    // Test creating a test booking to trigger payment flow
    console.log('📝 Testing payment modal creation...');

    const testBookingData = {
      client_name: 'Test Payment Client',
      client_email: 'test@payment.com',
      client_phone: '5551234567',
      final_price: 150,
      duration: '60'
    };

    // Inject test booking data and trigger payment modal
    const modalCreated = await page.evaluate((bookingData) => {
      try {
        if (window.adminDashboard && window.adminDashboard.showPaymentModal) {
          window.adminDashboard.showPaymentModal(bookingData);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Modal creation error:', error);
        return false;
      }
    }, testBookingData);

    console.log(`   Payment modal creation: ${modalCreated ? '✅' : '❌'}`);

    if (modalCreated) {
      // Wait for modal to appear
      await page.waitForTimeout(1000);

      // Check if modal is visible
      const modalVisible = await page.isVisible('#admin-payment-modal.active');
      console.log(`   Payment modal visible: ${modalVisible ? '✅' : '❌'}`);

      if (modalVisible) {
        // Check if Stripe Elements loaded in modal
        const stripeElementsInModal = await page.isVisible('#admin-card-element iframe');
        console.log(`   Stripe Elements in modal: ${stripeElementsInModal ? '✅' : '❌'}`);

        // Check modal content
        const bookingInfo = await page.textContent('.booking-summary');
        console.log(`   Booking info displayed: ${bookingInfo.includes('Test Payment Client') ? '✅' : '❌'}`);

        // Test close functionality
        console.log('🔒 Testing modal close functionality...');
        await page.click('[data-close-payment]');
        await page.waitForTimeout(500);

        const modalClosed = await page.isHidden('#admin-payment-modal.active');
        console.log(`   Modal closes properly: ${modalClosed ? '✅' : '❌'}`);

        console.log('\\n✨ Payment Integration Test Results:');
        console.log(`   • Stripe loaded: ${stripeLoaded ? '✅' : '❌'}`);
        console.log(`   • Admin integration: ${adminDashboardExists ? '✅' : '❌'}`);
        console.log(`   • Modal creation: ${modalCreated ? '✅' : '❌'}`);
        console.log(`   • Modal display: ${modalVisible ? '✅' : '❌'}`);
        console.log(`   • Stripe Elements: ${stripeElementsInModal ? '✅' : '❌'}`);
        console.log(`   • Modal closes: ${modalClosed ? '✅' : '❌'}`);

        const allPassed = stripeLoaded && adminDashboardExists && modalCreated &&
                          modalVisible && stripeElementsInModal && modalClosed;

        console.log(`\\n🎯 Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

        if (allPassed) {
          console.log('\\n🎉 SUCCESS: Admin payment now uses integrated modal (no redirect to external Stripe page)');
          console.log('💰 Payment stays within the native admin design');
          console.log('🔄 Smooth user experience matching the main site');
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();
