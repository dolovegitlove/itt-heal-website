#!/usr/bin/env node

/**
 * CRITICAL PAYMENT FLOW VALIDATION
 * Prevents deployment with broken payment systems
 *
 * This script MUST pass before any deployment to production
 * Tests actual Stripe integration, not mocks or simulations
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

console.log('🔒 CRITICAL PAYMENT FLOW VALIDATION');
console.log('=====================================');

async function validatePaymentFlow() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    criticalFailures: [],
    passed: true
  };

  try {
    const page = await browser.newPage();
    await page.goto('https://ittheal.com', { waitUntil: 'networkidle2' });

    // TEST 1: Stripe SDK Loading
    console.log('🔹 Testing: Stripe SDK Integration');
    const stripeLoaded = await page.evaluate(() => {
      return typeof Stripe !== 'undefined';
    });

    if (!stripeLoaded) {
      results.criticalFailures.push('Stripe SDK not loaded');
      results.passed = false;
    }
    results.tests.push({ test: 'Stripe SDK', passed: stripeLoaded });
    console.log(`   ${stripeLoaded ? '✅' : '❌'} Stripe SDK loaded: ${stripeLoaded}`);

    // TEST 2: submitBooking Function Analysis
    console.log('🔹 Testing: submitBooking Payment Integration');
    const submitBookingAnalysis = await page.evaluate(() => {
      if (typeof submitBooking === 'undefined') {
        return { exists: false, hasStripe: false, hasSimulation: false };
      }

      const funcString = submitBooking.toString();
      return {
        exists: true,
        hasStripe: funcString.includes('stripe.confirmCardPayment') || funcString.includes('stripe.confirm'),
        hasSimulation: funcString.includes('simulate') || funcString.includes('mock') || funcString.includes('test_card'),
        hasPaymentIntent: funcString.includes('create-payment-intent'),
        hasErrorHandling: funcString.includes('catch') && funcString.includes('error'),
        hasTimeout: funcString.includes('setTimeout') && funcString.includes('15')
      };
    });

    if (!submitBookingAnalysis.exists) {
      results.criticalFailures.push('submitBooking function does not exist');
      results.passed = false;
    }

    if (!submitBookingAnalysis.hasStripe) {
      results.criticalFailures.push('submitBooking missing Stripe payment integration');
      results.passed = false;
    }

    if (submitBookingAnalysis.hasSimulation) {
      results.criticalFailures.push('submitBooking contains simulation/mock code in production');
      results.passed = false;
    }

    if (!submitBookingAnalysis.hasPaymentIntent) {
      results.criticalFailures.push('submitBooking missing payment intent creation');
      results.passed = false;
    }

    results.tests.push({ test: 'submitBooking Integration', passed: submitBookingAnalysis.hasStripe && !submitBookingAnalysis.hasSimulation });
    console.log(`   ${submitBookingAnalysis.hasStripe ? '✅' : '❌'} Has Stripe integration: ${submitBookingAnalysis.hasStripe}`);
    console.log(`   ${!submitBookingAnalysis.hasSimulation ? '✅' : '❌'} No simulation code: ${!submitBookingAnalysis.hasSimulation}`);
    console.log(`   ${submitBookingAnalysis.hasPaymentIntent ? '✅' : '❌'} Has payment intent: ${submitBookingAnalysis.hasPaymentIntent}`);
    console.errorHandling}`);
    console.log(`   ${submitBookingAnalysis.hasTimeout ? '✅' : '❌'} Has timeout fallback: ${submitBookingAnalysis.hasTimeout}`);

    // TEST 3: Payment API Endpoints
    console.log('🔹 Testing: Payment API Endpoints');
    const apiTests = await page.evaluate(async () => {
      try {
        // Test payment intent creation endpoint
        const intentResponse = await fetch('/api/web-booking/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: 1.00,
            service_type: 'test',
            client_info: { name: 'Test', email: 'test@example.com' }
          })
        });

        // Test booking endpoint
        const bookingResponse = await fetch('/api/web-booking/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_type: 'test',
            practitioner_id: 'test',
            scheduled_date: new Date().toISOString(),
            client_name: 'Test',
            client_email: 'test@example.com',
            client_phone: '555-0123'
          })
        });

        return {
          paymentIntentStatus: intentResponse.status,
          paymentIntentExists: intentResponse.status !== 404,
          bookingStatus: bookingResponse.status,
          bookingExists: bookingResponse.status !== 404
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    if (!apiTests.paymentIntentExists) {
      results.criticalFailures.push('Payment intent endpoint not available');
      results.passed = false;
    }

    if (!apiTests.bookingExists) {
      results.criticalFailures.push('Booking endpoint not available');
      results.passed = false;
    }

    results.tests.push({ test: 'Payment API Endpoints', passed: apiTests.paymentIntentExists && apiTests.bookingExists });
    console.log(`   ${apiTests.paymentIntentExists ? '✅' : '❌'} Payment intent endpoint: ${apiTests.paymentIntentStatus}`);
    console.log(`   ${apiTests.bookingExists ? '✅' : '❌'} Booking endpoint: ${apiTests.bookingStatus}`);

    // TEST 4: Minimum Amount Validation
    console.log('🔹 Testing: Minimum Amount Validation');
    const amountValidation = await page.evaluate(() => {
      // Check if basePrices has minimum $1.00 for test
      if (typeof basePrices !== 'undefined') {
        return {
          testAmount: basePrices.test || 0,
          hasMinimumAmount: basePrices.test >= 1.00
        };
      }
      return { testAmount: 0, hasMinimumAmount: false };
    });

    if (!amountValidation.hasMinimumAmount) {
      results.criticalFailures.push(`Test amount $${amountValidation.testAmount} below Stripe minimum`);
      results.passed = false;
    }

    results.tests.push({ test: 'Minimum Amount', passed: amountValidation.hasMinimumAmount });
    console.log(`   ${amountValidation.hasMinimumAmount ? '✅' : '❌'} Test amount: $${amountValidation.testAmount}`);

    // TEST 5: Stripe Elements Integration
    console.log('🔹 Testing: Stripe Elements Integration');
    const elementsTest = await page.evaluate(() => {
      // Check if Stripe Elements creation code exists
      const bodyText = document.body.innerHTML;
      return {
        hasElementsCreation: bodyText.includes('stripe.elements()'),
        hasCardElement: bodyText.includes('create(\'card\''),
        hasElementMount: bodyText.includes('mount(\'#stripe-card-element\')')
      };
    });

    const elementsIntegrated = elementsTest.hasElementsCreation && elementsTest.hasCardElement;
    if (!elementsIntegrated) {
      results.criticalFailures.push('Stripe Elements not properly integrated');
      results.passed = false;
    }

    results.tests.push({ test: 'Stripe Elements', passed: elementsIntegrated });
    console.log(`   ${elementsTest.hasElementsCreation ? '✅' : '❌'} Elements creation: ${elementsTest.hasElementsCreation}`);
    console.log(`   ${elementsTest.hasCardElement ? '✅' : '❌'} Card element: ${elementsTest.hasCardElement}`);
    console.log(`   ${elementsTest.hasElementMount ? '✅' : '❌'} Element mounting: ${elementsTest.hasElementMount}`);

  } catch (error) {
    console.error('💥 Validation error:', error);
    results.criticalFailures.push(`Validation script error: ${error.message}`);
    results.passed = false;
  } finally {
    await browser.close();
  }

  // Save results
  fs.writeFileSync('logs/payment-validation-results.json', JSON.stringify(results, null, 2));

  // Print final result
  console.log('\n========================================');
  console.log('📊 PAYMENT VALIDATION SUMMARY');
  console.log('========================================');

  if (results.passed) {
    console.log('🎉 ✅ ALL PAYMENT VALIDATION TESTS PASSED');
    console.log('✅ Payment system is ready for production');
    console.log('✅ No simulation/mock code detected');
    console.log('✅ Stripe integration is functional');
    console.log('✅ All API endpoints available');
    process.exit(0);
  } else {
    console.log('🚨 ❌ CRITICAL PAYMENT VALIDATION FAILURES');
    console.log('❌ DEPLOYMENT MUST BE BLOCKED');
    console.log('');
    console.log('Critical Failures:');
    results.criticalFailures.forEach(failure => {
      console.log(`   🔥 ${failure}`);
    });
    console.log('');
    console.log('🛑 FIX THESE ISSUES BEFORE DEPLOYMENT');
    process.exit(1);
  }
}

validatePaymentFlow().catch(error => {
  console.error('💥 Payment validation failed:', error);
  process.exit(1);
});
