#!/usr/bin/env node

/**
 * Test Calendar Booking Data Display
 */

const puppeteer = require('puppeteer');

async function testCalendarBookingData() {
  console.log('🔍 Testing Calendar Booking Data Display...');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1200, height: 800 }
    });

    const page = await browser.newPage();

    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log('BROWSER LOG:', text);
    });

    // Navigate to admin page
    console.log('📍 Loading https://ittheal.com/admin.html...');
    await page.goto('https://ittheal.com/admin.html', { waitUntil: 'networkidle0' });

    // Wait for page to load
    await page.waitForSelector('.header', { timeout: 10000 });
    console.log('✅ Page loaded');

    // Wait for bookings to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Switch to calendar view
    console.log('🔹 Switching to calendar view...');
    await page.click('#calendar-view-btn');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Click on Day view to trigger debug logs
    console.log('🔹 Clicking Day view...');
    await page.click('#day-view-btn');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check for bookings in the calendar
    const daySlots = await page.$('#day-time-slots');
    if (daySlots) {
      const dayContent = await page.evaluate(el => el.innerHTML, daySlots);
      console.log('📅 Day view content length:', dayContent.length);

      if (dayContent.includes('Available booking dates:')) {
        console.log('🔍 Debug info found - checking booking dates');

        // Extract debug info
        const debugMatch = dayContent.match(/Available booking dates: ([^<]+)/);
        if (debugMatch) {
          console.log('📊 Booking dates in system:', debugMatch[1]);
        }
      }

      if (dayContent.includes('booking-item')) {
        console.log('✅ Bookings are displaying in calendar');
      } else if (dayContent.includes('Available')) {
        console.log('⚠️  No bookings showing for current date - may need different date');
      } else {
        console.log('❌ Calendar not showing proper content');
      }
    }

    // Test navigating to different dates
    console.log('🔹 Testing date navigation...');
    for (let i = 0; i < 3; i++) {
      await page.click('button[onclick="navigateCalendar(1)"]');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const titleElement = await page.$('#calendar-title');
      if (titleElement) {
        const title = await page.evaluate(el => el.textContent, titleElement);
        console.log(`📅 Navigated to: ${title}`);
      }
    }

    // Go back to today
    await page.click('button[onclick="goToToday()"]');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check console logs for debug information
    const debugLogs = consoleLogs.filter(log => log.includes('Calendar Debug'));
    console.log('\n📊 Debug Information Summary:');
    debugLogs.forEach(log => console.log('  ', log));

    // Test month view to see if any bookings show
    console.log('\n🔹 Testing Month view...');
    await page.click('#month-view-btn');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const monthDays = await page.$('#month-days');
    if (monthDays) {
      const monthContent = await page.evaluate(el => el.innerHTML, monthDays);
      if (monthContent.includes('Guest') || monthContent.includes('@')) {
        console.log('✅ Bookings found in month view');
      } else {
        console.log('⚠️  No bookings visible in month view');
      }
    }

    console.log('\n🎉 Calendar Booking Data Test Complete!');
    return true;

  } catch (error) {
    console.error('❌ Calendar booking data test failed:', error.message);
    return false;
  } finally {
    if (browser) {await browser.close();}
  }
}

testCalendarBookingData().then(success => {
  if (success) {
    console.log('\n✅ CALENDAR DATA TEST: COMPLETE');
    process.exit(0);
  } else {
    console.log('\n❌ CALENDAR DATA TEST: FAILED');
    process.exit(1);
  }
}).catch(console.error);
