#!/usr/bin/env node

/**
 * User Booking Complimentary Test
 * Tests that complimentary bookings hide credit card section in user booking flow
 */

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'https://ittheal.com',
  testEmail: 'complimentary@test.com',
  testPhone: '555-COMP-123',
  headless: true, // Run in headless mode for VPS
  timeout: 30000,
  screenshotDir: './test-screenshots-comp'
};

// Ensure screenshot directory exists
if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
  fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
}

class ComplimentaryBookingTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      regularBooking: { status: 'pending', errors: [] },
      complimentaryBooking: { status: 'pending', errors: [] },
      creditCardVisibility: { status: 'pending', errors: [] }
    };
  }

  async init() {
    console.log('🚀 Starting User Complimentary Booking Test...\n');
    console.log('📋 Test Objectives:');
    console.log('   1. Regular booking shows credit card section');
    console.log('   2. Complimentary booking hides credit card section');
    console.log('   3. Both booking types process correctly\n');

    this.browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      defaultViewport: { width: 1280, height: 720 }
    });

    this.page = await this.browser.newPage();
    await this.page.setDefaultTimeout(TEST_CONFIG.timeout);

    // Monitor console logs
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`🔴 Console error: ${msg.text()}`);
      }
    });

    // Monitor network requests
    await this.page.setRequestInterception(true);
    this.page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        console.log(`📡 API Request: ${request.method()} ${request.url()}`);
      }
      request.continue();
    });
  }

  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}_${timestamp}.png`;
    const filepath = path.join(TEST_CONFIG.screenshotDir, filename);
    await this.page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 Screenshot: ${filename}`);
    return filepath;
  }

  async waitAndClick(selector, description) {
    console.log(`   🖱️  Clicking: ${description}...`);
    await this.page.waitForSelector(selector, { visible: true });
    await this.page.click(selector);
    await this.page.waitForTimeout(500);
  }

  async waitAndType(selector, text, description) {
    console.log(`   ⌨️  Typing in ${description}: ${text}`);
    await this.page.waitForSelector(selector, { visible: true });
    await this.page.click(selector, { clickCount: 3 });
    await this.page.type(selector, text);
    await this.page.waitForTimeout(300);
  }

  async testRegularBooking() {
    console.log('\n🧪 TEST 1: REGULAR BOOKING (WITH PAYMENT)');
    console.log('==========================================');

    try {
      // Navigate to booking page
      await this.page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' });
      await this.takeScreenshot('01-homepage');

      // Look for booking section
      const bookingSection = await this.page.$('#booking, .booking-section, [data-section="booking"]');
      if (!bookingSection) {
        console.log('   ⚠️  No booking section found on homepage, looking for booking button...');
        
        // Try to find and click booking button
        const bookingButtonSelectors = [
          'a[href*="booking"]',
          'button:has-text("Book Now")',
          'button:has-text("Book Appointment")',
          '.book-now-btn'
        ];

        let bookingButtonFound = false;
        for (const selector of bookingButtonSelectors) {
          if (await this.page.$(selector)) {
            await this.waitAndClick(selector, 'Booking button');
            bookingButtonFound = true;
            break;
          }
        }

        if (!bookingButtonFound) {
          throw new Error('No booking section or button found');
        }
      }

      await this.page.waitForTimeout(2000);
      await this.takeScreenshot('02-booking-page');

      // Select a service and time slot
      console.log('\n📅 Selecting service and time slot...');
      
      // Try to select a service (adapt selectors as needed)
      const serviceSelectors = [
        '.service-option:first-child',
        'input[name="service"][value*="60"]',
        'button[data-service="60-minute"]'
      ];

      for (const selector of serviceSelectors) {
        if (await this.page.$(selector)) {
          await this.waitAndClick(selector, 'Service option');
          break;
        }
      }

      // Select date/time (this will vary based on implementation)
      const timeSlotSelectors = [
        '.time-slot:not(.unavailable):first',
        '.available-slot:first',
        'button.time-slot:not([disabled]):first'
      ];

      for (const selector of timeSlotSelectors) {
        if (await this.page.$(selector)) {
          await this.waitAndClick(selector, 'Time slot');
          break;
        }
      }

      await this.page.waitForTimeout(1000);

      // Fill in client information
      console.log('\n📝 Filling client information...');
      
      await this.waitAndType('input[name="name"], #client-name, #name', 'John Regular', 'Name');
      await this.waitAndType('input[name="email"], #client-email, #email', 'john.regular@test.com', 'Email');
      await this.waitAndType('input[name="phone"], #client-phone, #phone', '555-123-4567', 'Phone');

      await this.takeScreenshot('03-client-info-filled');

      // Check for checkout/payment button
      const checkoutButtonSelectors = [
        'button:has-text("Continue to Payment")',
        'button:has-text("Checkout")',
        'button[type="submit"]:has-text("Book")',
        '.checkout-btn'
      ];

      for (const selector of checkoutButtonSelectors) {
        if (await this.page.$(selector)) {
          await this.waitAndClick(selector, 'Checkout button');
          break;
        }
      }

      await this.page.waitForTimeout(2000);

      // Check if credit card section is visible
      console.log('\n💳 Checking credit card section visibility...');
      
      const creditCardSelectors = [
        '#card-element',
        '.stripe-card-element',
        '[data-stripe="card-element"]',
        '.payment-form',
        '#payment-form'
      ];

      let creditCardVisible = false;
      for (const selector of creditCardSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          const isVisible = await element.isIntersectingViewport();
          if (isVisible) {
            creditCardVisible = true;
            console.log(`   ✅ Credit card section found and visible (${selector})`);
            break;
          }
        }
      }

      if (!creditCardVisible) {
        console.log('   ❌ ERROR: Credit card section not visible for regular booking!');
        this.testResults.regularBooking.errors.push('Credit card section not visible');
        this.testResults.regularBooking.status = 'failed';
      } else {
        console.log('   ✅ SUCCESS: Credit card section properly displayed for regular booking');
        this.testResults.regularBooking.status = 'passed';
      }

      await this.takeScreenshot('04-regular-booking-payment');

    } catch (error) {
      console.error(`   ❌ Regular booking test failed: ${error.message}`);
      this.testResults.regularBooking.status = 'failed';
      this.testResults.regularBooking.errors.push(error.message);
    }
  }

  async testComplimentaryBooking() {
    console.log('\n🧪 TEST 2: COMPLIMENTARY BOOKING (NO PAYMENT)');
    console.log('==============================================');

    try {
      // Navigate to booking page with complimentary parameter
      // This assumes the booking system will support a URL parameter
      const compUrl = `${TEST_CONFIG.baseUrl}?booking_type=complimentary`;
      console.log(`   📍 Navigating to: ${compUrl}`);
      
      await this.page.goto(compUrl, { waitUntil: 'networkidle2' });
      await this.takeScreenshot('05-comp-booking-page');

      // Note: The actual implementation would need to support this parameter
      console.log('\n   ⚠️  NOTE: User booking system needs to be updated to support complimentary bookings');
      console.log('   The following changes are needed:');
      console.log('   1. Add URL parameter support (?booking_type=complimentary)');
      console.log('   2. Pass complimentary flag to booking checkout');
      console.log('   3. Hide credit card section when complimentary flag is set');
      console.log('   4. Skip Stripe payment processing for complimentary bookings');

      // Simulate what should happen
      console.log('\n📋 Expected Behavior for Complimentary Bookings:');
      console.log('   - Booking form displays normally');
      console.log('   - Service selection works as usual');
      console.log('   - Client information is collected');
      console.log('   - Credit card section is HIDDEN');
      console.log('   - Submit button says "Complete Booking" instead of "Pay Now"');
      console.log('   - No payment processing occurs');
      console.log('   - Booking is created with payment_status = "comp"');

      this.testResults.complimentaryBooking.status = 'pending';
      this.testResults.complimentaryBooking.errors.push('Feature not yet implemented in user booking system');

    } catch (error) {
      console.error(`   ❌ Complimentary booking test failed: ${error.message}`);
      this.testResults.complimentaryBooking.status = 'failed';
      this.testResults.complimentaryBooking.errors.push(error.message);
    }
  }

  async generateImplementationGuide() {
    console.log('\n📚 IMPLEMENTATION GUIDE FOR USER COMPLIMENTARY BOOKINGS');
    console.log('======================================================\n');

    console.log('1️⃣  **booking-checkout.js** - Modify showCheckoutModal function:');
    console.log('```javascript');
    console.log('function showCheckoutModal(bookingData, isComplimentary = false) {');
    console.log('  // ... existing code ...');
    console.log('  ');
    console.log('  // Conditionally show/hide credit card section');
    console.log('  const creditCardSection = isComplimentary ? \'\' : `');
    console.log('    <div id="card-element-container">');
    console.log('      <label>Credit Card</label>');
    console.log('      <div id="card-element"></div>');
    console.log('      <div id="card-errors"></div>');
    console.log('    </div>');
    console.log('  `;');
    console.log('  ');
    console.log('  // Update submit button text');
    console.log('  const submitText = isComplimentary ? "Complete Booking" : "Pay Now";');
    console.log('  ');
    console.log('  // Only initialize Stripe if not complimentary');
    console.log('  if (!isComplimentary && window.stripe) {');
    console.log('    initializeStripeElements();');
    console.log('  }');
    console.log('}');
    console.log('```\n');

    console.log('2️⃣  **Booking Form** - Add complimentary flag support:');
    console.log('```javascript');
    console.log('// Check URL parameters for complimentary booking');
    console.log('const urlParams = new URLSearchParams(window.location.search);');
    console.log('const isComplimentary = urlParams.get("booking_type") === "complimentary";');
    console.log('');
    console.log('// Pass flag when showing checkout');
    console.log('showCheckoutModal(bookingData, isComplimentary);');
    console.log('```\n');

    console.log('3️⃣  **Form Submission** - Handle complimentary bookings:');
    console.log('```javascript');
    console.log('async function submitBooking(formData, isComplimentary) {');
    console.log('  if (isComplimentary) {');
    console.log('    // Skip payment processing');
    console.log('    formData.payment_status = "comp";');
    console.log('    formData.payment_method = "comp";');
    console.log('    ');
    console.log('    // Submit directly to booking API');
    console.log('    const response = await fetch("/api/bookings", {');
    console.log('      method: "POST",');
    console.log('      headers: { "Content-Type": "application/json" },');
    console.log('      body: JSON.stringify(formData)');
    console.log('    });');
    console.log('  } else {');
    console.log('    // Normal payment flow with Stripe');
    console.log('    const { error, paymentIntent } = await stripe.confirmCardPayment(...);');
    console.log('  }');
    console.log('}');
    console.log('```\n');

    console.log('4️⃣  **Visual Indicators** - Show complimentary status:');
    console.log('```javascript');
    console.log('if (isComplimentary) {');
    console.log('  // Add visual indicator');
    console.log('  const compBadge = document.createElement("div");');
    console.log('  compBadge.className = "comp-badge";');
    console.log('  compBadge.innerHTML = "🎁 Complimentary Session";');
    console.log('  checkoutModal.prepend(compBadge);');
    console.log('}');
    console.log('```');
  }

  async run() {
    try {
      await this.init();
      
      // Test 1: Regular booking
      await this.testRegularBooking();
      
      // Test 2: Complimentary booking
      await this.testComplimentaryBooking();
      
      // Generate implementation guide
      await this.generateImplementationGuide();
      
      // Display results
      console.log('\n📊 FINAL TEST RESULTS');
      console.log('======================');
      console.log(`🧪 Test 1 - Regular Booking: ${this.testResults.regularBooking.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}`);
      if (this.testResults.regularBooking.errors.length > 0) {
        this.testResults.regularBooking.errors.forEach(err => console.log(`   - ${err}`));
      }
      
      console.log(`🧪 Test 2 - Complimentary Booking: ${this.testResults.complimentaryBooking.status === 'passed' ? '✅ PASSED' : this.testResults.complimentaryBooking.status === 'pending' ? '⏳ PENDING IMPLEMENTATION' : '❌ FAILED'}`);
      if (this.testResults.complimentaryBooking.errors.length > 0) {
        this.testResults.complimentaryBooking.errors.forEach(err => console.log(`   - ${err}`));
      }

      console.log('\n💡 Next Steps:');
      console.log('1. Implement complimentary booking support in booking-checkout.js');
      console.log('2. Add URL parameter handling for booking_type=complimentary');
      console.log('3. Update form submission to handle comp bookings');
      console.log('4. Test the implementation with this test script');

    } catch (error) {
      console.error('❌ Test suite error:', error);
    } finally {
      if (this.browser) {
        console.log('\n🏁 Closing browser...');
        await this.browser.close();
      }
    }
  }
}

// Run the test
const test = new ComplimentaryBookingTest();
test.run().catch(console.error);