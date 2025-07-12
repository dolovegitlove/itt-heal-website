#!/usr/bin/env node

/**
 * Final Complete End-to-End Booking Test
 * Tests the entire flow: website form -> API -> admin visibility
 */

const puppeteer = require('puppeteer');

const TEST_BOOKING = {
  name: `Test User ${Date.now()}`,
  email: `booking.test.${Date.now()}@example.com`,
  phone: `555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
  service: '60min',
  notes: `E2E test booking created at ${new Date().toISOString()}`
};

async function getAdminBookingCount() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();

  try {
    await page.goto('https://ittheal.com/admin.html', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const count = await page.evaluate(() => {
      const table = document.querySelector('.bookings-table tbody');
      if (table) {
        return table.querySelectorAll('tr').length;
      }

      const bookingItems = document.querySelectorAll('[data-booking-id], .booking-item, .booking-card');
      return bookingItems.length;
    });

    return count || 0;
  } catch (error) {
    console.error('Error getting admin count:', error.message);
    return -1;
  } finally {
    await browser.close();
  }
}

async function testCompleteBookingFlow() {
  console.log('🎯 Final Complete End-to-End Booking Test');
  console.log('=========================================');
  console.log(`📧 Test Email: ${TEST_BOOKING.email}`);
  console.log(`📱 Test Phone: ${TEST_BOOKING.phone}`);
  console.log('');

  // Get initial booking count
  console.log('📊 Getting initial booking count from admin...');
  const initialCount = await getAdminBookingCount();
  console.log(`   Initial count: ${initialCount}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();

  try {
    // Navigate to booking section
    console.log('\n🌐 Navigating to booking form...');
    await page.goto('https://ittheal.com/d/#booking', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('   ✅ Loaded booking page');

    // Wait for form to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 1: Select service
    console.log('\n📝 Step 1: Selecting service...');
    await page.evaluate(() => {
      const option = document.querySelector('.service-option');
      if (option) {
        option.click();
      } else {
        throw new Error('No service option found');
      }
    });
    console.log('   ✅ Service selected (60-minute)');

    // Click Next
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.evaluate(() => {
      document.getElementById('next-btn').click();
    });
    console.log('   ✅ Proceeded to date/time selection');

    // Step 2: Select date and time
    console.log('\n📅 Step 2: Selecting date and time...');

    // Use July 1st which has availability
    const dateString = '2025-07-01';

    await page.evaluate((date) => {
      const dateInput = document.getElementById('booking-date');
      dateInput.value = date;
      dateInput.dispatchEvent(new Event('change', { bubbles: true }));
    }, dateString);
    console.log(`   ✅ Date set to: ${dateString}`);

    // Wait for time slots to load
    console.log('   ⏳ Loading available time slots...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Select first available time slot
    const timeSelected = await page.evaluate(() => {
      const timeSelect = document.getElementById('booking-time');
      if (timeSelect && timeSelect.options.length > 1) {
        timeSelect.selectedIndex = 1; // Select first available slot
        return timeSelect.options[1].text;
      }
      return null;
    });

    if (timeSelected) {
      console.log(`   ✅ Time selected: ${timeSelected}`);
    } else {
      throw new Error('No time slots available');
    }

    // Click Next
    await page.evaluate(() => {
      document.getElementById('next-btn').click();
    });
    console.log('   ✅ Proceeded to contact information');

    // Step 3: Fill contact information
    console.log('\n👤 Step 3: Filling contact information...');

    await page.type('#client-name', TEST_BOOKING.name);
    await page.type('#client-email', TEST_BOOKING.email);
    await page.type('#client-phone', TEST_BOOKING.phone);
    await page.type('#session-notes', TEST_BOOKING.notes);

    console.log('   ✅ Contact information filled');

    // Click Next
    await page.evaluate(() => {
      document.getElementById('next-btn').click();
    });
    console.log('   ✅ Proceeded to booking summary');

    // Step 4: Submit booking
    console.log('\n✅ Step 4: Submitting booking...');

    // Wait for summary to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Click confirm booking
    await page.evaluate(() => {
      document.getElementById('confirm-booking-btn').click();
    });
    console.log('   ✅ Booking submitted');

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check for success message
    const status = await page.evaluate(() => {
      const statusDiv = document.getElementById('booking-status');
      return statusDiv ? statusDiv.textContent : 'No status found';
    });

    console.log(`   📋 Booking status: ${status}`);

    if (status.includes('confirmed') || status.includes('✅')) {
      console.log('   ✅ Booking appears successful!');
    } else {
      console.log('   ⚠️ Booking status unclear');
    }

    // Wait a bit more for processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n🔍 Checking admin for new booking...');

    // Check admin for the new booking
    const finalCount = await getAdminBookingCount();
    console.log(`   Final count: ${finalCount}`);

    if (finalCount > initialCount) {
      console.log(`   ✅ SUCCESS! New booking appeared in admin (${initialCount} → ${finalCount})`);
      console.log('\n🎉 COMPLETE END-TO-END BOOKING FLOW WORKS!');
      console.log('✅ Users can now book sessions through the website');
      console.log('✅ Bookings appear in the admin dashboard');
      console.log('✅ Complete integration working');
    } else {
      console.log('   ❌ Booking not found in admin dashboard');
      console.log(`   📧 Search manually for: ${TEST_BOOKING.email}`);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n📈 Test Summary:');
  console.log(`   Test Email: ${TEST_BOOKING.email}`);
  console.log(`   Test Phone: ${TEST_BOOKING.phone}`);
  console.log(`   Initial Count: ${initialCount}`);
  console.log('   Check admin dashboard manually if needed');
}

testCompleteBookingFlow().catch(console.error);
