#!/usr/bin/env node

/**
 * Browser automation test for Stripe payment button in admin edit booking
 */

const puppeteer = require('puppeteer');

async function testStripeButton() {
  console.log('🚀 Starting Stripe button UI test...');

  let browser;
  try {
    // Launch browser in headless mode
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('📱 Navigating to admin panel...');
    await page.goto('https://ittheal.com/admin', { waitUntil: 'networkidle2' });

    // Wait for dashboard to load
    console.log('⏳ Waiting for dashboard to load...');
    await page.waitForSelector('#dashboard-page', { timeout: 10000 });
    await page.waitForTimeout(3000); // Allow dashboard to fully initialize

    console.log('📋 Looking for bookings...');

    // Click on Bookings tab
    const bookingsTab = await page.$('[data-page="bookings"]');
    if (bookingsTab) {
      await bookingsTab.click();
      await page.waitForTimeout(2000);
    }

    // Find first booking with edit button
    const editButtons = await page.$$('.btn-edit');
    if (editButtons.length === 0) {
      throw new Error('No edit buttons found in bookings');
    }

    console.log(`✏️ Found ${editButtons.length} edit buttons, clicking first one...`);
    await editButtons[0].click();
    await page.waitForTimeout(2000);

    // Wait for edit modal to appear
    console.log('🎯 Waiting for edit booking modal...');
    await page.waitForSelector('#editBookingModal', { visible: true, timeout: 5000 });

    // Check if payment method section exists
    const paymentSection = await page.$('#credit_card');
    if (paymentSection) {
      console.log('💳 Selecting credit card payment method...');
      await paymentSection.click();
      await page.waitForTimeout(1000);
    }

    // Look for Stripe payment button
    console.log('🔍 Looking for Stripe payment button...');
    const stripeButton = await page.$('#stripe-payment-button');

    if (!stripeButton) {
      throw new Error('Stripe payment button not found');
    }

    // Check if button is enabled
    const isDisabled = await page.evaluate(el => el.disabled, stripeButton);
    console.log(`⚡ Stripe button disabled: ${isDisabled}`);

    if (isDisabled) {
      // Try to enable it by filling amount
      const amountInput = await page.$('#amount_received');
      if (amountInput) {
        console.log('💰 Setting payment amount...');
        await amountInput.clear();
        await amountInput.type('100');
        await page.waitForTimeout(500);
      }
    }

    // Check if stripe amount display is working
    const stripeAmountDisplay = await page.$('#stripe-amount-display');
    if (stripeAmountDisplay) {
      const displayAmount = await page.evaluate(el => el.textContent, stripeAmountDisplay);
      console.log(`💸 Stripe amount display: $${displayAmount}`);
    }

    // Set up console message listener to catch errors
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Set up error listener
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    console.log('🖱️ Clicking Stripe payment button...');

    // Click the Stripe button
    await stripeButton.click();

    // Wait for any processing
    await page.waitForTimeout(3000);

    // Check for errors
    const errors = pageErrors.filter(err =>
      err.includes('undefined') ||
      err.includes('toFixed') ||
      err.includes('Cannot read properties')
    );

    const relevantConsole = consoleMessages.filter(msg =>
      msg.text.includes('Stripe') ||
      msg.text.includes('payment') ||
      msg.text.includes('error') ||
      msg.type === 'error'
    );

    // Report results
    console.log('\n📊 TEST RESULTS:');
    console.log('================');

    if (errors.length > 0) {
      console.log('❌ ERRORS DETECTED:');
      errors.forEach(err => console.log(`   ${err}`));
    } else {
      console.errors detected');
    }

    if (relevantConsole.length > 0) {
      console.log('\n📝 RELEVANT CONSOLE MESSAGES:');
      relevantConsole.forEach(msg => console.log(`   ${msg.type.toUpperCase()}: ${msg.text}`));
    }

    // Check if payment intent creation was attempted
    const paymentIntentLogs = consoleMessages.filter(msg =>
      msg.text.includes('Creating Stripe payment intent') ||
      msg.text.includes('payment intent created') ||
      msg.text.includes('Failed to create payment intent')
    );

    if (paymentIntentLogs.length > 0) {
      console.log('\n💳 PAYMENT INTENT STATUS:');
      paymentIntentLogs.forEach(msg => console.log(`   ${msg.text}`));
    }

    // Check for successful completion
    const success = errors.length === 0 && !pageErrors.some(err => err.includes('Failed to create payment intent'));

    console.log(`\n🎯 OVERALL TEST RESULT: ${success ? '✅ PASSED' : '❌ FAILED'}`);

    return success;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testStripeButton().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Fatal test error:', error);
  process.exit(1);
});
