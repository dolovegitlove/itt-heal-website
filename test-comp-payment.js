#!/usr/bin/env node

/**
 * Test comp payment system end-to-end
 */

const puppeteer = require('puppeteer');

async function testCompPayment() {
  console.log('🧪 Testing comp payment system end-to-end...');

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to booking form
    console.log('📱 Navigating to booking form...');
    await page.goto('https://ittheal.com', { waitUntil: 'networkidle2' });

    // Click on booking button
    await page.click('button[onclick*="handleBooking"]');

    // Wait for booking form to load
    await page.waitForSelector('.service-option', { timeout: 5000 });

    // Select a service
    console.log('🎯 Selecting service...');
    await page.click('.service-option[data-service="60min_massage"]');

    // Click next to go to date/time selection
    await page.click('#next-btn');

    // Wait for date/time section
    await page.waitForSelector('#booking-date', { timeout: 5000 });

    // Select a future date
    console.log('📅 Selecting date...');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // Next week
    const dateString = futureDate.toISOString().split('T')[0];
    await page.evaluate((date) => {
      document.getElementById('booking-date').value = date;
      document.getElementById('booking-date').dispatchEvent(new Event('change'));
    }, dateString);

    // Wait for time slots to load
    await page.waitForTimeout(2000);

    // Select a time slot
    console.log('⏰ Selecting time slot...');
    await page.select('#booking-time', '14:00');

    // Click next to go to contact info
    await page.click('#next-btn');

    // Wait for contact info section
    await page.waitForSelector('#client-name', { timeout: 5000 });

    // Fill in contact information
    console.log('📝 Filling contact information...');
    await page.type('#client-name', 'Test User');
    await page.type('#client-email', 'test@example.com');
    await page.type('#client-phone', '555-123-4567');

    // Click next to go to payment
    await page.click('#next-btn');

    // Wait for payment section
    await page.waitForSelector('#payment-method-comp', { timeout: 5000 });

    // Select comp payment method
    console.log('🎁 Selecting comp payment method...');
    await page.click('#payment-method-comp');

    // Wait for comp type section to appear
    await page.waitForSelector('#comp-type-section', { timeout: 2000 });

    // Check if comp type section is visible
    const compTypeVisible = await page.evaluate(() => {
      const section = document.getElementById('comp-type-section');
      return section && section.style.display !== 'none';
    });

    if (compTypeVisible) {
      console.log('✅ Comp type section is visible');

      // Select comp type
      await page.select('#comp-type', 'charity');
      console.log('✅ Comp type selected: charity');

      // Check if total price shows $0
      const totalPrice = await page.evaluate(() => {
        return document.getElementById('payment-total-price').textContent;
      });

      if (totalPrice === '$0') {
        console.log('✅ Total price correctly shows $0 for comp payment');
      } else {
        console.log('❌ Total price should be $0 but shows:', totalPrice);
      }

      // Check payment instructions
      const instructions = await page.evaluate(() => {
        return document.getElementById('payment-instructions').textContent;
      });

      if (instructions.includes('complimentary')) {
        console.log('✅ Payment instructions correctly mention complimentary');
      } else {
        console.log('❌ Payment instructions should mention complimentary');
      }

    } else {
      console.log('❌ Comp type section is not visible');
    }

    console.log('🎉 Comp payment system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testCompPayment();
