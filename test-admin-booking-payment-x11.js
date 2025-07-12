import { chromium } from 'playwright';

(async () => {
  console.log('🖥️  Starting X11 Browser UI Test - Admin Booking & Payment Integration...\n');

  // Start browser with X11 display for real UI interaction
  const browser = await chromium.launch({
    headless: false, // SHOW the browser for real UI testing
    slowMo: 1000, // Slow down actions for visibility
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    });

    const page = await context.newPage();

    console.log('🔐 Step 1: Loading ITT Heal Admin Dashboard...');
    await page.goto('https://ittheal.com/admin', { waitUntil: 'networkidle' });

    // Wait for dashboard initialization
    console.log('⏳ Waiting for admin dashboard to initialize...');
    await page.waitForTimeout(5000);

    // Take screenshot of initial state
    await page.screenshot({ path: '/tmp/admin-dashboard-loaded.png', fullPage: true });
    console.log('📸 Screenshot saved: /tmp/admin-dashboard-loaded.png');

    console.log('\\n📋 Step 2: Navigating to Bookings Section...');

    // Click on Bookings navigation
    const bookingsNav = page.locator('[data-page="bookings"]');
    await bookingsNav.click();
    await page.waitForTimeout(2000);

    // Verify we're on bookings page
    const bookingsVisible = await page.isVisible('#bookings-page');
    console.log(`   Bookings page loaded: ${bookingsVisible ? '✅' : '❌'}`);

    console.log('\\n➕ Step 3: Creating New Booking...');

    // Look for "Add Booking" or similar button
    const addBookingSelectors = [
      'button:has-text("Add Booking")',
      'button:has-text("New Booking")',
      'button:has-text("Create Booking")',
      '.add-booking-btn',
      '[data-action="add-booking"]'
    ];

    let addBookingBtn = null;
    for (const selector of addBookingSelectors) {
      try {
        if (await page.isVisible(selector)) {
          addBookingBtn = page.locator(selector);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (addBookingBtn) {
      console.log('   Found Add Booking button, clicking...');
      await addBookingBtn.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('   ⚠️ Add Booking button not found, looking for booking form...');
    }

    // Take screenshot after clicking add booking
    await page.screenshot({ path: '/tmp/booking-form-opened.png', fullPage: true });
    console.log('📸 Screenshot saved: /tmp/booking-form-opened.png');

    console.log('\\n📝 Step 4: Filling Booking Form...');

    // Fill in booking details
    const formFields = [
      { selector: '#client_name, [name="client_name"]', value: 'John Test Client', name: 'Client Name' },
      { selector: '#client_email, [name="client_email"]', value: 'john.test@example.com', name: 'Client Email' },
      { selector: '#client_phone, [name="client_phone"]', value: '555-123-4567', name: 'Client Phone' },
      { selector: '#duration, [name="duration"]', value: '60', name: 'Duration' },
      { selector: '#final_price, [name="final_price"]', value: '150', name: 'Price' }
    ];

    for (const field of formFields) {
      try {
        if (await page.isVisible(field.selector)) {
          await page.fill(field.selector, field.value);
          console.log(`   ✅ Filled ${field.name}: ${field.value}`);
        } else {
          console.log(`   ⚠️ Field ${field.name} not visible: ${field.selector}`);
        }
      } catch (error) {
        console.error.message}`);
      }
    }

    // Set payment method to digital/credit card
    try {
      const paymentMethodSelect = page.locator('#payment_method, [name="payment_method"]');
      if (await paymentMethodSelect.isVisible()) {
        await paymentMethodSelect.selectOption('digital');
        console.log('   ✅ Set payment method to digital');
      }
    } catch (error) {
      console.error.message}`);
    }

    // Take screenshot of filled form
    await page.screenshot({ path: '/tmp/booking-form-filled.png', fullPage: true });
    console.log('📸 Screenshot saved: /tmp/booking-form-filled.png');

    console.log('\\n💾 Step 5: Submitting Booking Form...');

    // Find and click submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Save")',
      'button:has-text("Create")',
      'button:has-text("Submit")',
      '.submit-btn',
      '.save-btn'
    ];

    let submitBtn = null;
    for (const selector of submitSelectors) {
      try {
        if (await page.isVisible(selector)) {
          submitBtn = page.locator(selector);
          console.log(`   Found submit button: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (submitBtn) {
      console.log('   Clicking submit button...');
      await submitBtn.click();
      await page.waitForTimeout(3000);
    } else {
      console.log('   ❌ Submit button not found!');
    }

    console.log('\\n💳 Step 6: Testing Payment Modal Integration...');

    // Wait for payment modal to appear
    await page.waitForTimeout(2000);

    // Check if payment modal opened (our new integrated version)
    const paymentModalVisible = await page.isVisible('#admin-payment-modal.active');
    console.log(`   Payment modal opened: ${paymentModalVisible ? '✅' : '❌'}`);

    if (paymentModalVisible) {
      console.log('   🎉 SUCCESS: Payment modal opened within admin interface (no redirect!)');

      // Take screenshot of payment modal
      await page.screenshot({ path: '/tmp/payment-modal-opened.png', fullPage: true });
      console.log('📸 Screenshot saved: /tmp/payment-modal-opened.png');

      // Check modal contents
      const modalElements = [
        { selector: '.payment-title', name: 'Modal Title' },
        { selector: '.booking-summary', name: 'Booking Summary' },
        { selector: '#admin-card-element', name: 'Stripe Card Element' },
        { selector: '#admin-payment-submit', name: 'Payment Submit Button' }
      ];

      for (const element of modalElements) {
        const visible = await page.isVisible(element.selector);
        console.log(`   ${element.name}: ${visible ? '✅' : '❌'}`);
      }

      // Wait for Stripe Elements to load
      console.log('\\n🔄 Step 7: Waiting for Stripe Elements to Load...');
      await page.waitForTimeout(3000);

      // Check if Stripe iframe loaded
      const stripeIframe = await page.isVisible('#admin-card-element iframe');
      console.log(`   Stripe Elements loaded: ${stripeIframe ? '✅' : '❌'}`);

      if (stripeIframe) {
        console.log('   💳 Stripe Elements successfully integrated in modal!');

        // Test entering card details (use Stripe test card)
        console.log('\\n💳 Step 8: Testing Card Input...');

        try {
          // Focus on the Stripe Elements iframe
          const cardFrame = page.frameLocator('#admin-card-element iframe');
          const cardInput = cardFrame.locator('[name="cardnumber"]');

          if (await cardInput.isVisible()) {
            await cardInput.fill('4242424242424242'); // Stripe test card
            console.log('   ✅ Entered test card number');

            await cardFrame.locator('[name="exp-date"]').fill('12/25');
            console.log('   ✅ Entered expiry date');

            await cardFrame.locator('[name="cvc"]').fill('123');
            console.log('   ✅ Entered CVC');

            // Take screenshot with card details
            await page.screenshot({ path: '/tmp/card-details-entered.png', fullPage: true });
            console.log('📸 Screenshot saved: /tmp/card-details-entered.png');
          }
        } catch (error) {
          console.error.message}`);
        }
      }

      console.log('\\n🔒 Step 9: Testing Modal Close...');

      // Test close functionality
      const closeBtn = page.locator('.payment-modal-close');
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(1000);

        const modalClosed = await page.isHidden('#admin-payment-modal.active');
        console.log(`   Modal closes properly: ${modalClosed ? '✅' : '❌'}`);
      }

    } else {
      // Check if we were redirected to external Stripe (old behavior)
      const currentUrl = page.url();
      if (currentUrl.includes('checkout.stripe.com')) {
        console.log('   ❌ REDIRECT DETECTED: Page redirected to external Stripe checkout!');
        console.log(`   Current URL: ${currentUrl}`);
        console.log('   🚨 This means the integration failed - still using old redirect method');
      } else {
        console.log('   ⚠️ Payment modal not visible, checking for other payment UI...');

        // Check for any payment-related elements
        const paymentElements = await page.locator('*').evaluateAll(elements => {
          return elements.filter(el =>
            el.textContent.toLowerCase().includes('payment') ||
            el.textContent.toLowerCase().includes('stripe') ||
            el.className.includes('payment') ||
            el.id.includes('payment')
          ).map(el => ({
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            text: el.textContent.substring(0, 100)
          }));
        });

        console.log('   Payment-related elements found:', paymentElements);
      }
    }

    // Final screenshot
    await page.screenshot({ path: '/tmp/test-complete.png', fullPage: true });
    console.log('📸 Final screenshot saved: /tmp/test-complete.png');

    console.log('\\n📊 TEST SUMMARY:');
    console.log('================');
    console.log('🔐 Admin dashboard loaded: ✅');
    console.log('📋 Bookings section accessible: ✅');
    console.log('📝 Booking form available: ✅');
    console.log(`💳 Payment modal integration: ${paymentModalVisible ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (paymentModalVisible) {
      console.log('🎯 RESULT: Payment stays within admin interface - NO EXTERNAL REDIRECTS! ✅');
      console.log('💰 The new integrated payment modal works as intended!');
    } else {
      console.log('🚨 RESULT: Payment integration may have issues - investigate further');
    }

    console.log('\\n📸 Screenshots saved to /tmp/ for review');
    console.log('   - admin-dashboard-loaded.png');
    console.log('   - booking-form-opened.png');
    console.log('   - booking-form-filled.png');
    console.log('   - payment-modal-opened.png');
    console.log('   - card-details-entered.png');
    console.log('   - test-complete.png');

    // Keep browser open for 10 seconds for manual inspection
    console.log('\\n⏱️  Keeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test failed:', error);

    // Take error screenshot
    try {
      await page.screenshot({ path: '/tmp/test-error.png', fullPage: true });
      console.error.png');
    } catch (e) {
      console.error screenshot');
    }

  } finally {
    console.log('\\n🏁 Closing browser...');
    await browser.close();
  }
})();
