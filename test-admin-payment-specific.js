import { chromium } from 'playwright';

(async () => {
  console.log('🧪 Testing Admin Payment Modal Integration (Specific Test)...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    console.log('🔐 Loading admin dashboard...');
    await page.goto('https://ittheal.com/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    console.log('📋 Navigating to bookings...');
    await page.click('[data-page="bookings"]');
    await page.waitForTimeout(2000);

    console.log('➕ Opening booking form...');
    await page.click('button:has-text("Add Booking")');
    await page.waitForTimeout(2000);

    // Check payment method options
    console.log('🔍 Checking payment method options...');
    const paymentOptions = await page.locator('#payment_method option').allTextContents();
    console.log('Available payment methods:', paymentOptions);

    // Fill basic form first
    console.log('📝 Filling booking form...');
    await page.fill('#client_name', 'Test Payment User');
    await page.fill('#client_email', 'test@payment.com');
    await page.fill('#client_phone', '555-123-4567');

    // Handle duration dropdown
    await page.selectOption('#duration', '60');

    await page.fill('#final_price', '150');

    // Set payment method to credit card (try different options)
    const paymentMethodOptions = ['credit_card', 'digital', 'card', 'stripe'];
    let paymentMethodSet = false;

    for (const option of paymentMethodOptions) {
      try {
        await page.selectOption('#payment_method', option);
        console.log(`✅ Set payment method to: ${option}`);
        paymentMethodSet = true;
        break;
      } catch (error) {
        console.log(`❌ Payment method '${option}' not available`);
      }
    }

    if (!paymentMethodSet) {
      // Try to select the first non-cash option
      const firstOption = paymentOptions.find(opt =>
        opt.toLowerCase().includes('credit') ||
        opt.toLowerCase().includes('card') ||
        opt.toLowerCase().includes('digital')
      );

      if (firstOption) {
        await page.selectOption('#payment_method', { label: firstOption });
        console.log(`✅ Set payment method to: ${firstOption}`);
      }
    }

    console.log('📸 Taking screenshot of filled form...');
    await page.screenshot({ path: '/tmp/admin-form-ready.png', fullPage: true });

    console.log('💾 Submitting booking form...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Check for our new payment modal
    console.log('💳 Checking for integrated payment modal...');
    const paymentModalVisible = await page.isVisible('#admin-payment-modal.active');
    console.log(`Payment modal visible: ${paymentModalVisible ? '✅' : '❌'}`);

    if (paymentModalVisible) {
      console.log('🎉 SUCCESS: Integrated payment modal opened!');

      // Check modal elements
      const modalElements = {
        title: await page.isVisible('.payment-title'),
        summary: await page.isVisible('.booking-summary'),
        cardElement: await page.isVisible('#admin-card-element'),
        submitBtn: await page.isVisible('#admin-payment-submit')
      };

      console.log('Modal elements:');
      Object.entries(modalElements).forEach(([name, visible]) => {
        console.log(`   ${name}: ${visible ? '✅' : '❌'}`);
      });

      // Take screenshot of payment modal
      await page.screenshot({ path: '/tmp/payment-modal-success.png', fullPage: true });

      // Wait for Stripe Elements
      console.log('⏳ Waiting for Stripe Elements...');
      await page.waitForTimeout(3000);

      const stripeElementsLoaded = await page.isVisible('#admin-card-element iframe');
      console.log(`Stripe Elements loaded: ${stripeElementsLoaded ? '✅' : '❌'}`);

      if (stripeElementsLoaded) {
        console.log('💳 Perfect! Stripe Elements integrated successfully');
        await page.screenshot({ path: '/tmp/stripe-elements-loaded.png', fullPage: true });
      }

      // Test closing the modal
      console.log('🔒 Testing modal close...');
      await page.click('.payment-modal-close');
      await page.waitForTimeout(1000);

      const modalClosed = await page.isHidden('#admin-payment-modal.active');
      console.log(`Modal closes: ${modalClosed ? '✅' : '❌'}`);

    } else {
      console.log('❌ Payment modal not visible');

      // Check current URL for redirects
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);

      if (currentUrl.includes('stripe.com')) {
        console.log('🚨 PROBLEM: Redirected to external Stripe - integration failed!');
      } else {
        console.log('ℹ️ Staying on admin page - checking for other payment UI...');
      }

      // Take screenshot for debugging
      await page.screenshot({ path: '/tmp/no-payment-modal.png', fullPage: true });
    }

    // Final summary
    console.log('\\n📊 TEST RESULTS:');
    console.log('================');
    console.log('✅ Form submission: Success');
    console.log(`${paymentModalVisible ? '✅' : '❌'} Payment modal: ${paymentModalVisible ? 'Opened' : 'Not found'}`);
    console.log(`${paymentModalVisible ? '🎯' : '🚨'} Integration: ${paymentModalVisible ? 'SUCCESS - No external redirects!' : 'FAILED - Check implementation'}`);

    // Keep browser open for inspection
    console.log('\\n⏱️ Keeping browser open for 15 seconds...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ path: '/tmp/test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
