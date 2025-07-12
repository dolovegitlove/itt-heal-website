#!/usr/bin/env node

/**
 * Test Script: Stripe Payment Processing Fix
 * Tests the end-to-end payment flow to ensure the timeout issue is resolved
 */

const puppeteer = require('puppeteer');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testCard: {
    number: '4242424242424242',
    expiry: '1234',
    cvc: '123'
  },
  testClient: {
    name: 'Test Client Payment Fix',
    email: 'test-payment-fix@ittheal.com',
    phone: '5551234567'
  }
};

async function testStripePaymentFlow() {
  console.log('🧪 Starting Stripe Payment Flow Test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 Browser Error:', msg.text());
      } else if (msg.text().includes('Payment') || msg.text().includes('Stripe')) {
        console.log('💳 Payment Log:', msg.text());
      }
    });
    
    // Navigate to the website
    console.log('📖 Loading website...');
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await page.waitForSelector('.service-option', { timeout: 10000 });
    
    // Select a service (90min massage)
    console.log('🎯 Selecting 90-minute service...');
    await page.click('[data-service-type="90min_massage"]');
    await page.waitForTimeout(1000);
    
    // Fill in booking form
    console.log('📝 Filling booking form...');
    
    // Select date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await page.waitForSelector('#booking-date');
    await page.type('#booking-date', dateString);
    await page.waitForTimeout(500);
    
    // Wait for time slots to load and select first available
    await page.waitForSelector('.time-slot:not(.disabled)', { timeout: 5000 });
    await page.click('.time-slot:not(.disabled)');
    await page.waitForTimeout(500);
    
    // Fill client information
    await page.waitForSelector('#client-name');
    await page.type('#client-name', TEST_CONFIG.testClient.name);
    await page.type('#client-email', TEST_CONFIG.testClient.email);
    await page.type('#client-phone', TEST_CONFIG.testClient.phone);
    
    // Wait for Stripe Elements to load
    console.log('💳 Waiting for Stripe Elements...');
    await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 10000 });
    
    // Fill in card details in Stripe iframe
    const cardNumberFrame = await page.frames().find(frame => 
      frame.name().includes('__privateStripeFrame') && 
      frame.url().includes('card-number')
    );
    
    if (cardNumberFrame) {
      await cardNumberFrame.type('[name="cardnumber"]', TEST_CONFIG.testCard.number);
    }
    
    const cardExpiryFrame = await page.frames().find(frame => 
      frame.name().includes('__privateStripeFrame') && 
      frame.url().includes('card-expiry')
    );
    
    if (cardExpiryFrame) {
      await cardExpiryFrame.type('[name="exp-date"]', TEST_CONFIG.testCard.expiry);
    }
    
    const cardCvcFrame = await page.frames().find(frame => 
      frame.name().includes('__privateStripeFrame') && 
      frame.url().includes('card-cvc')
    );
    
    if (cardCvcFrame) {
      await cardCvcFrame.type('[name="cvc"]', TEST_CONFIG.testCard.cvc);
    }
    
    console.log('✅ Card details filled');
    
    // Start payment process
    console.log('🚀 Starting payment process...');
    const startTime = Date.now();
    
    await page.click('#complete-booking-btn');
    
    // Monitor payment status messages
    let paymentCompleted = false;
    let timeoutOccurred = false;
    let paymentStatus = '';
    
    const checkPaymentStatus = async () => {
      const statusElement = await page.$('#payment-status');
      if (statusElement) {
        paymentStatus = await page.evaluate(el => el.textContent, statusElement);
        console.log(`📊 Status: ${paymentStatus}`);
        
        if (paymentStatus.includes('Booking confirmed') || paymentStatus.includes('✅')) {
          paymentCompleted = true;
        } else if (paymentStatus.includes('timeout') || paymentStatus.includes('❌')) {
          timeoutOccurred = true;
        }
      }
    };
    
    // Check status every second for up to 45 seconds
    const statusInterval = setInterval(checkPaymentStatus, 1000);
    
    // Wait for completion or timeout
    let attempts = 0;
    const maxAttempts = 45; // 45 seconds max
    
    while (!paymentCompleted && !timeoutOccurred && attempts < maxAttempts) {
      await page.waitForTimeout(1000);
      attempts++;
      
      if (attempts % 5 === 0) {
        console.log(`⏱️  Waiting for payment completion... ${attempts}/${maxAttempts}s`);
      }
    }
    
    clearInterval(statusInterval);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Final status check
    await checkPaymentStatus();
    
    console.log('\n📊 TEST RESULTS:');
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`📝 Final Status: ${paymentStatus}`);
    console.log(`✅ Payment Completed: ${paymentCompleted}`);
    console.log(`❌ Timeout Occurred: ${timeoutOccurred}`);
    
    if (paymentCompleted) {
      console.log('🎉 SUCCESS: Payment flow completed successfully!');
      console.log('✅ The timeout issue has been resolved.');
    } else if (timeoutOccurred) {
      console.log('❌ FAILURE: Payment timed out - issue still exists.');
    } else {
      console.log('⚠️  UNCLEAR: Payment process did not complete within test time.');
    }
    
    // Wait a bit to see final state
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('💥 Test Error:', error);
  } finally {
    await browser.close();
  }
}

// API Test Function
async function testPaymentApis() {
  console.log('\n🔧 Testing Payment APIs...');
  
  try {
    // Test create payment intent
    const paymentIntentResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/web-booking/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 180,
        service_type: '90min_massage',
        client_info: TEST_CONFIG.testClient
      })
    });
    
    const paymentIntentData = await paymentIntentResponse.json();
    console.log('💳 Payment Intent API:', paymentIntentData.success ? 'SUCCESS' : 'FAILED');
    
    if (paymentIntentData.success) {
      // Test payment status endpoint
      const statusResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/web-booking/payment-status/${paymentIntentData.paymentIntentId}`);
      const statusData = await statusResponse.json();
      console.log('📊 Payment Status API:', statusData.success ? 'SUCCESS' : 'FAILED');
    }
    
  } catch (error) {
    console.error('API Test Error:', error);
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Starting Stripe Payment Fix Tests\n');
  
  // Test APIs first
  await testPaymentApis();
  
  // Then test full UI flow
  await testStripePaymentFlow();
  
  console.log('\n🏁 Test Suite Complete');
}

// Only run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testStripePaymentFlow, testPaymentApis };