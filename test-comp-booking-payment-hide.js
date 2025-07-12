#!/usr/bin/env node

/**
 * Test Admin Comp Booking Payment Section Auto-Hide
 * Verifies that credit card processing section is completely hidden when comp is selected
 */

import puppeteer from 'puppeteer';

async function testCompBookingPaymentHide() {
  console.log('🧪 Testing Comp Booking Payment Section Auto-Hide...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to admin dashboard
    console.log('📱 Navigating to admin dashboard...');
    await page.goto('https://ittheal.com/admin', { waitUntil: 'networkidle2' });
    
    // Wait for dashboard to load
    await page.waitForSelector('#admin-dashboard', { timeout: 10000 });
    
    // Click on Create Booking button
    console.log('➕ Opening Create Booking modal...');
    await page.click('[data-open-modal="create-booking"]');
    
    // Wait for modal to appear
    await page.waitForSelector('#create-booking-modal', { timeout: 5000 });
    
    // Test 1: Check initial state (credit card section should be visible)
    console.log('✅ Test 1: Checking initial state...');
    const initialCreditCardVisible = await page.evaluate(() => {
      const creditCardSection = document.getElementById('credit-card-section');
      return creditCardSection ? creditCardSection.style.display !== 'none' : false;
    });
    
    console.log(`   Initial credit card section visible: ${initialCreditCardVisible}`);
    
    // Test 2: Select comp payment method
    console.log('🎁 Test 2: Selecting comp payment method...');
    await page.select('#payment_method', 'comp');
    
    // Wait for DOM update
    await page.waitForTimeout(500);
    
    // Check if credit card section is hidden
    const creditCardHiddenAfterCompMethod = await page.evaluate(() => {
      const creditCardSection = document.getElementById('credit-card-section');
      return creditCardSection ? creditCardSection.style.display === 'none' : true;
    });
    
    console.log(`   Credit card section hidden after comp method: ${creditCardHiddenAfterCompMethod}`);
    
    // Test 3: Check if comp section is shown
    const compSectionVisible = await page.evaluate(() => {
      const compSection = document.getElementById('comp-payment-section');
      return compSection ? compSection.style.display === 'block' : false;
    });
    
    console.log(`   Comp section visible: ${compSectionVisible}`);
    
    // Test 4: Reset and test payment status = comp
    console.log('🔄 Test 4: Testing payment status = comp...');
    await page.select('#payment_method', 'credit_card');
    await page.waitForTimeout(300);
    await page.select('#payment_status', 'comp');
    await page.waitForTimeout(500);
    
    // Check if credit card section is hidden
    const creditCardHiddenAfterCompStatus = await page.evaluate(() => {
      const creditCardSection = document.getElementById('credit-card-section');
      return creditCardSection ? creditCardSection.style.display === 'none' : true;
    });
    
    console.log(`   Credit card section hidden after comp status: ${creditCardHiddenAfterCompStatus}`);
    
    // Test 5: Check if payment method auto-syncs
    const paymentMethodAutoSynced = await page.evaluate(() => {
      const paymentMethodSelect = document.getElementById('payment_method');
      return paymentMethodSelect ? paymentMethodSelect.value === 'comp' : false;
    });
    
    console.log(`   Payment method auto-synced to comp: ${paymentMethodAutoSynced}`);
    
    // Test 6: Verify Stripe elements are not present
    const stripeElementsHidden = await page.evaluate(() => {
      const stripeElements = document.querySelectorAll('.stripe-card-element, #admin-card-element, #booking-card-element');
      return Array.from(stripeElements).every(el => el.style.display === 'none' || el.offsetParent === null);
    });
    
    console.log(`   Stripe elements hidden: ${stripeElementsHidden}`);
    
    // Test 7: Check payment amount display
    const paymentAmountHandled = await page.evaluate(() => {
      const amountDisplay = document.getElementById('stripe-amount-display');
      return amountDisplay ? amountDisplay.textContent === '0.00' : true;
    });
    
    console.log(`   Payment amount set to $0.00: ${paymentAmountHandled}`);
    
    // Summary
    console.log('\n📋 TEST SUMMARY:');
    console.log(`   ✅ Initial state correct: ${initialCreditCardVisible}`);
    console.log(`   ✅ Credit card hidden (method): ${creditCardHiddenAfterCompMethod}`);
    console.log(`   ✅ Comp section shown: ${compSectionVisible}`);
    console.log(`   ✅ Credit card hidden (status): ${creditCardHiddenAfterCompStatus}`);
    console.log(`   ✅ Payment method auto-sync: ${paymentMethodAutoSynced}`);
    console.log(`   ✅ Stripe elements hidden: ${stripeElementsHidden}`);
    console.log(`   ✅ Amount set to $0.00: ${paymentAmountHandled}`);
    
    const allTestsPassed = creditCardHiddenAfterCompMethod && 
                          compSectionVisible && 
                          creditCardHiddenAfterCompStatus && 
                          paymentMethodAutoSynced && 
                          stripeElementsHidden;
    
    if (allTestsPassed) {
      console.log('\n🎉 ALL TESTS PASSED - Comp booking payment hiding works correctly!');
    } else {
      console.log('\n❌ SOME TESTS FAILED - Review implementation');
    }
    
    // Take screenshot for verification
    await page.screenshot({ path: 'comp-booking-test.png', fullPage: true });
    console.log('📸 Screenshot saved: comp-booking-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testCompBookingPaymentHide().catch(console.error);