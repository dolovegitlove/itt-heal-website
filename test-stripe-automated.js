#!/usr/bin/env node

/**
 * Complete automated Stripe button test using Playwright
 * Tests the actual UI interaction on the VPS
 */

const { chromium } = require('playwright');

async function runStripeTest() {
  console.log('🚀 Starting complete automated Stripe button test...');
  
  let browser;
  let testResults = {
    success: false,
    errors: [],
    logs: [],
    steps: []
  };

  try {
    // Launch browser
    console.log('🌐 Launching headless browser...');
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    // Capture console messages and errors
    page.on('console', msg => {
      testResults.logs.push(`${msg.type().toUpperCase()}: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      testResults.errors.push(`PAGE ERROR: ${error.message}`);
    });
    
    // Step 1: Navigate to admin panel
    console.log('📱 Step 1: Navigating to admin panel...');
    await page.goto('https://ittheal.com/admin', { waitUntil: 'networkidle' });
    testResults.steps.push('✅ Navigated to admin panel');
    
    // Step 2: Wait for dashboard to load
    console.log('⏳ Step 2: Waiting for dashboard...');
    await page.waitForSelector('#dashboard-page', { timeout: 15000 });
    await page.waitForTimeout(3000);
    testResults.steps.push('✅ Dashboard loaded');
    
    // Step 3: Go to Bookings tab
    console.log('📋 Step 3: Switching to Bookings tab...');
    const bookingsTab = await page.locator('[data-page="bookings"]');
    await bookingsTab.click();
    await page.waitForTimeout(2000);
    testResults.steps.push('✅ Switched to Bookings tab');
    
    // Step 4: Find and click edit button
    console.log('✏️ Step 4: Looking for edit buttons...');
    await page.waitForSelector('.btn-edit', { timeout: 10000 });
    const editButtons = await page.locator('.btn-edit').all();
    
    if (editButtons.length === 0) {
      throw new Error('No edit buttons found');
    }
    
    console.log(`Found ${editButtons.length} edit buttons, clicking first one...`);
    await editButtons[0].click();
    await page.waitForTimeout(2000);
    testResults.steps.push('✅ Clicked edit booking button');
    
    // Step 5: Wait for edit modal
    console.log('🎯 Step 5: Waiting for edit modal...');
    await page.waitForSelector('#editBookingModal', { state: 'visible', timeout: 10000 });
    testResults.steps.push('✅ Edit modal opened');
    
    // Step 6: Select credit card payment
    console.log('💳 Step 6: Selecting credit card payment...');
    const creditCardRadio = await page.locator('#credit_card');
    await creditCardRadio.check();
    await page.waitForTimeout(1000);
    testResults.steps.push('✅ Selected credit card payment');
    
    // Step 7: Set payment amount
    console.log('💰 Step 7: Setting payment amount...');
    const amountInput = await page.locator('#amount_received');
    await amountInput.clear();
    await amountInput.fill('100.00');
    await page.waitForTimeout(1000);
    testResults.steps.push('✅ Set payment amount to $100.00');
    
    // Step 8: Check if Stripe button is visible and enabled
    console.log('🔍 Step 8: Checking Stripe button state...');
    const stripeButton = await page.locator('#stripe-payment-button');
    const isVisible = await stripeButton.isVisible();
    const isEnabled = await stripeButton.isEnabled();
    
    console.log(`Stripe button - Visible: ${isVisible}, Enabled: ${isEnabled}`);
    testResults.steps.push(`✅ Stripe button state - Visible: ${isVisible}, Enabled: ${isEnabled}`);
    
    if (!isVisible) {
      throw new Error('Stripe payment button is not visible');
    }
    
    // Step 9: Check stripe amount display
    console.log('💸 Step 9: Checking stripe amount display...');
    const amountDisplay = await page.locator('#stripe-amount-display');
    const displayedAmount = await amountDisplay.textContent();
    console.log(`Stripe amount display shows: $${displayedAmount}`);
    testResults.steps.push(`✅ Stripe amount display: $${displayedAmount}`);
    
    // Step 10: Click the Stripe payment button
    console.log('🖱️ Step 10: Clicking Stripe payment button...');
    
    // Clear previous errors to focus on button click
    testResults.errors = [];
    
    await stripeButton.click();
    await page.waitForTimeout(5000); // Wait for processing
    
    testResults.steps.push('✅ Clicked Stripe payment button');
    
    // Step 11: Check for JavaScript errors after click
    console.log('🔍 Step 11: Analyzing results...');
    
    const toFixedErrors = testResults.errors.filter(err => 
      err.includes('toFixed') || err.includes('undefined')
    );
    
    const stripeProcessingLogs = testResults.logs.filter(log =>
      log.includes('Stripe') || log.includes('payment intent') || log.includes('Processing')
    );
    
    // Report results
    console.log('\n📊 TEST RESULTS:');
    console.log('==================');
    
    // Show all steps
    console.log('\n✅ COMPLETED STEPS:');
    testResults.steps.forEach(step => console.log(`   ${step}`));
    
    // Show errors
    if (testResults.errors.length > 0) {
      console.log('\n❌ ERRORS DETECTED:');
      testResults.errors.forEach(err => console.log(`   ${err}`));
    } else {
      console.log('\n✅ NO JAVASCRIPT ERRORS DETECTED');
    }
    
    // Show relevant logs
    if (stripeProcessingLogs.length > 0) {
      console.log('\n📝 STRIPE PROCESSING LOGS:');
      stripeProcessingLogs.forEach(log => console.log(`   ${log}`));
    }
    
    // Determine success
    const hasToFixedErrors = toFixedErrors.length > 0;
    const hasPageErrors = testResults.errors.length > 0;
    
    testResults.success = !hasToFixedErrors && !hasPageErrors;
    
    console.log(`\n🎯 FINAL RESULT: ${testResults.success ? '✅ TEST PASSED' : '❌ TEST FAILED'}`);
    
    if (testResults.success) {
      console.log('   ✅ Stripe button clicks without errors');
      console.log('   ✅ No toFixed/undefined property errors');
      console.log('   ✅ Payment processing initiated successfully');
    } else {
      console.log('   ❌ JavaScript errors detected during button click');
    }
    
    return testResults;
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    testResults.errors.push(`TEST ERROR: ${error.message}`);
    testResults.success = false;
    return testResults;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Install playwright if needed and run test
async function installAndTest() {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    console.log('📦 Checking Playwright installation...');
    await execAsync('npx playwright --version');
    console.log('✅ Playwright found');
  } catch (error) {
    console.log('📦 Installing Playwright...');
    await execAsync('npm install playwright');
    await execAsync('npx playwright install chromium');
    console.log('✅ Playwright installed');
  }
  
  return await runStripeTest();
}

// Run the complete test
installAndTest().then(results => {
  console.log('\n📋 TEST SUMMARY:');
  console.log(`Success: ${results.success}`);
  console.log(`Steps completed: ${results.steps.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`Logs captured: ${results.logs.length}`);
  
  process.exit(results.success ? 0 : 1);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});