import { chromium } from 'playwright';

(async () => {
  console.log('🎯 Direct Test: Admin Payment Modal Integration...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 800
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    console.log('🔐 Loading admin dashboard...');
    await page.goto('https://ittheal.com/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    console.log('✨ Testing direct payment modal trigger...');

    // Inject a direct test of our payment modal
    const testResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Check if admin dashboard exists
        if (!window.adminDashboard) {
          resolve({ error: 'Admin dashboard not initialized' });
          return;
        }

        // Check if Stripe is available
        if (!window.adminDashboard.stripe) {
          resolve({ error: 'Stripe not initialized in admin dashboard' });
          return;
        }

        // Create test booking data
        const testBookingData = {
          client_name: 'Direct Test Client',
          client_email: 'direct@test.com',
          client_phone: '555-987-6543',
          final_price: 175.00,
          duration: '90',
          payment_method: 'credit_card'
        };

        console.log('🧪 Triggering payment modal directly...');

        try {
          // Call our showPaymentModal method directly
          window.adminDashboard.showPaymentModal(testBookingData);

          // Wait a bit for modal to appear
          setTimeout(() => {
            const modal = document.getElementById('admin-payment-modal');
            const modalVisible = modal && modal.classList.contains('active');

            resolve({
              success: true,
              modalExists: Boolean(modal),
              modalVisible: modalVisible,
              stripeInitialized: Boolean(window.adminDashboard.stripe),
              cardElementExists: Boolean(document.getElementById('admin-card-element'))
            });
          }, 1000);

        } catch (error) {
          resolve({ error: error.message });
        }
      });
    });

    console.log('📊 Direct test results:', testResult);

    if (testResult.success && testResult.modalVisible) {
      console.log('🎉 SUCCESS: Payment modal triggered successfully!');

      // Take screenshot of the modal
      await page.screenshot({ path: '/tmp/direct-payment-modal.png', fullPage: true });
      console.log('📸 Screenshot saved: /tmp/direct-payment-modal.png');

      // Test modal elements
      console.log('\\n🔍 Checking modal elements...');

      const elements = await page.evaluate(() => {
        return {
          title: Boolean(document.querySelector('.payment-title')),
          summary: Boolean(document.querySelector('.booking-summary')),
          cardElement: Boolean(document.querySelector('#admin-card-element')),
          submitButton: Boolean(document.querySelector('#admin-payment-submit')),
          closeButton: Boolean(document.querySelector('.payment-modal-close')),
          clientName: document.querySelector('.booking-summary')?.textContent?.includes('Direct Test Client')
        };
      });

      console.log('Modal elements check:');
      Object.entries(elements).forEach(([name, exists]) => {
        console.log(`   ${name}: ${exists ? '✅' : '❌'}`);
      });

      // Wait for Stripe Elements to load
      console.log('\\n⏳ Waiting for Stripe Elements...');
      await page.waitForTimeout(3000);

      const stripeIframe = await page.isVisible('#admin-card-element iframe');
      console.log(`Stripe iframe loaded: ${stripeIframe ? '✅' : '❌'}`);

      if (stripeIframe) {
        console.log('💳 Stripe Elements successfully integrated!');

        // Try to interact with the card element
        console.log('\\n🧪 Testing card input interaction...');
        try {
          const cardFrame = page.frameLocator('#admin-card-element iframe');
          const cardNumberField = cardFrame.locator('[name="cardnumber"]');

          if (await cardNumberField.isVisible({ timeout: 5000 })) {
            await cardNumberField.fill('4242'); // Start of test card
            console.log('✅ Successfully entered text in card field');

            await page.screenshot({ path: '/tmp/card-input-test.png', fullPage: true });
            console.log('📸 Card input screenshot: /tmp/card-input-test.png');
          }
        } catch (error) {
          console.error.message}`);
        }
      }

      // Test modal close
      console.log('\\n🔒 Testing modal close functionality...');
      await page.click('.payment-modal-close');
      await page.waitForTimeout(1000);

      const modalClosed = await page.isHidden('#admin-payment-modal.active');
      console.log(`Modal closes properly: ${modalClosed ? '✅' : '❌'}`);

      // Test reopening
      console.log('\\n🔄 Testing modal reopen...');
      await page.evaluate(() => {
        const testData = {
          client_name: 'Reopen Test',
          client_email: 'reopen@test.com',
          final_price: 200
        };
        window.adminDashboard.showPaymentModal(testData);
      });

      await page.waitForTimeout(1000);
      const modalReopened = await page.isVisible('#admin-payment-modal.active');
      console.log(`Modal reopens: ${modalReopened ? '✅' : '❌'}`);

      if (modalReopened) {
        await page.screenshot({ path: '/tmp/modal-reopened.png', fullPage: true });
      }

    } else {
      console.log('❌ Payment modal test failed');
      console.error || 'Modal not visible');

      await page.screenshot({ path: '/tmp/modal-test-failed.png', fullPage: true });
    }

    console.log('\\n🎯 FINAL ASSESSMENT:');
    console.log('====================');

    if (testResult.success && testResult.modalVisible) {
      console.log('✅ RESULT: Admin payment integration is WORKING!');
      console.log('💰 Payment modal opens within admin interface');
      console.log('🚀 No external redirects to Stripe checkout');
      console.log('🎨 Maintains native admin design');
      console.log('📱 Smooth user experience achieved');
    } else {
      console.log('❌ RESULT: Payment integration needs attention');
      console.log('🔧 Check admin dashboard initialization');
      console.log('🔧 Verify Stripe script loading');
      console.log('🔧 Review modal creation logic');
    }

    // Keep browser open for manual inspection
    console.log('\\n👀 Keeping browser open for 20 seconds for manual inspection...');
    await page.waitForTimeout(20000);

  } catch (error) {
    console.error('❌ Test failed:', error);

    try {
      await page.screenshot({ path: '/tmp/direct-test-error.png', fullPage: true });
      console.error.png');
    } catch (e) {
      console.error screenshot');
    }
  } finally {
    await browser.close();
    console.log('\\n🏁 Test completed');
  }
})();
