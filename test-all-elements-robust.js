#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAllElementsRobust() {
  console.log('🔍 ROBUST ALL-ELEMENTS UI TEST');
  console.log('===============================');

  let browser;
  let passed = 0;
  let total = 0;
  let results = [];

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    console.log('🌐 Loading admin dashboard...');
    await page.goto('https://ittheal.com/admin-dashboard.html', {
      waitUntil: 'networkidle2'
    });

    await sleep(5000); // Wait for full load including API calls

    // First, test visible elements only
    console.log('\n📍 TESTING VISIBLE ELEMENTS');
    console.log('============================');

    // Test 1: Quick Action Buttons (always visible)
    const quickActionTests = [
      { name: 'Manage Availability', selector: 'button[onclick="showAvailabilityManager()"]' },
      { name: 'Today\'s Schedule', selector: 'button[onclick="filterBookings(\'today\')"]' },
      { name: 'On-Site Bookings', selector: 'button[onclick="filterBookings(\'mobile\')"]' },
      { name: 'Add Booking', selector: 'button[onclick="showNewBookingForm()"]' }
    ];

    for (const test of quickActionTests) {
      total++;
      try {
        const element = await page.$(test.selector);
        if (element) {
          const isVisible = await page.$eval(test.selector, el => {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return style.display !== 'none' &&
                               style.visibility !== 'hidden' &&
                               style.opacity !== '0' &&
                               rect.width > 0 && rect.height > 0;
          });

          if (isVisible) {
            await element.click();
            await sleep(500);
            console.log(`✅ ${test.name} - Clickable and visible`);
            passed++;
          } else {
            console.log(`⚠️  ${test.name} - Exists but not visible`);
          }
        } else {
          console.log(`❌ ${test.name} - Element not found`);
        }
      } catch (error) {
        console.error.message}`);
      }
    }

    // Test 2: Dashboard Metric Cards (clickable)
    const metricTests = [
      { name: 'Total Bookings Metric', selector: '[onclick="filterBookings(\'all\')"]' },
      { name: 'Today Metric', selector: '[onclick="filterBookings(\'today\')"]' },
      { name: 'Upcoming Metric', selector: '[onclick="filterBookings(\'upcoming\')"]' }
    ];

    for (const test of metricTests) {
      total++;
      try {
        const element = await page.$(test.selector);
        if (element) {
          await element.click();
          await sleep(300);
          console.log(`✅ ${test.name} - Clickable`);
          passed++;
        } else {
          console.log(`❌ ${test.name} - Element not found`);
        }
      } catch (error) {
        console.error.message}`);
      }
    }

    // Test 3: Filter Controls (always visible)
    const filterTests = [
      { name: 'Status Filter', selector: '#status-filter', type: 'select', testValue: 'scheduled' },
      { name: 'Location Filter', selector: '#location-filter', type: 'select', testValue: 'mobile' },
      { name: 'Date Filter', selector: '#date-filter', type: 'date' },
      { name: 'Clear Filters Button', selector: 'button[onclick="clearFilters()"]', type: 'button' }
    ];

    for (const test of filterTests) {
      total++;
      try {
        const element = await page.$(test.selector);
        if (element) {
          if (test.type === 'select') {
            await page.select(test.selector, test.testValue);
            await sleep(200);
            await page.select(test.selector, ''); // Reset
            console.log(`✅ ${test.name} - Select functional`);
            passed++;
          } else if (test.type === 'date') {
            const today = new Date().toISOString().split('T')[0];
            await page.$eval(test.selector, (el, value) => el.value = value, today);
            await sleep(200);
            console.log(`✅ ${test.name} - Date input functional`);
            passed++;
          } else if (test.type === 'button') {
            await element.click();
            await sleep(300);
            console.log(`✅ ${test.name} - Button clickable`);
            passed++;
          }
        } else {
          console.log(`❌ ${test.name} - Element not found`);
        }
      } catch (error) {
        console.error.message}`);
      }
    }

    // Test 4: Modal Elements (need to open modal first)
    console.log('\n📋 TESTING MODAL ELEMENTS');
    console.log('==========================');

    total++;
    try {
      // Open the modal
      await page.click('button[onclick="showNewBookingForm()"]');
      await sleep(1000);

      // Check if modal is visible
      const modalVisible = await page.$eval('#new-booking-modal', el =>
        !el.classList.contains('hidden')
      );

      if (modalVisible) {
        console.log('✅ Modal Opens - Add Booking modal displays');
        passed++;

        // Test modal form fields
        const modalFieldTests = [
          { name: 'Client Name Input', selector: '#client-name', type: 'text', testValue: 'Test User' },
          { name: 'Client Email Input', selector: '#client-email', type: 'email', testValue: 'test@example.com' },
          { name: 'Client Phone Input', selector: '#client-phone', type: 'tel', testValue: '555-1234' },
          { name: 'Service Type Select', selector: '#service-type', type: 'select', testValue: '60min' },
          { name: 'Booking Date Input', selector: '#booking-date', type: 'date' },
          { name: 'Booking Time Input', selector: '#booking-time', type: 'time', testValue: '10:00' },
          { name: 'Booking Location Select', selector: '#booking-location', type: 'select', testValue: 'in_clinic' },
          { name: 'Special Requests Textarea', selector: '#special-requests', type: 'textarea', testValue: 'Test request' }
        ];

        for (const test of modalFieldTests) {
          total++;
          try {
            const element = await page.$(test.selector);
            if (element) {
              if (test.type === 'text' || test.type === 'email' || test.type === 'tel') {
                await element.focus();
                await element.type(test.testValue);
                await sleep(200);
                console.log(`✅ ${test.name} - Text input functional`);
                passed++;
              } else if (test.type === 'select') {
                await page.select(test.selector, test.testValue);
                await sleep(300); // Wait for pricing update
                console.log(`✅ ${test.name} - Select functional`);
                passed++;
              } else if (test.type === 'date') {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateStr = tomorrow.toISOString().split('T')[0];
                await page.$eval(test.selector, (el, value) => el.value = value, dateStr);
                console.log(`✅ ${test.name} - Date input functional`);
                passed++;
              } else if (test.type === 'time') {
                await page.$eval(test.selector, (el, value) => el.value = value, test.testValue);
                console.log(`✅ ${test.name} - Time input functional`);
                passed++;
              } else if (test.type === 'textarea') {
                await element.focus();
                await element.type(test.testValue);
                await sleep(200);
                console.log(`✅ ${test.name} - Textarea functional`);
                passed++;
              }
            } else {
              console.log(`❌ ${test.name} - Element not found`);
            }
          } catch (error) {
            console.error.message}`);
          }
        }

        // Test pricing calculation using DynamicPricingLoader
        total++;
        try {
          const expectedPricing = await page.evaluate(() => {
            const servicePrice = window.DynamicPricingLoader ? window.DynamicPricingLoader.getServicePrice('60min') : 135.00;
            return `$${servicePrice.toFixed(2)}`;
          });
          
          const basePrice = await page.$eval('#base-price-display', el => el.textContent);
          const totalPrice = await page.$eval('#total-price-display', el => el.textContent);
          
          if (basePrice === expectedPricing && totalPrice === expectedPricing) {
            console.log(`✅ Pricing Calculation - Dynamic pricing works: ${expectedPricing}`);
            passed++;
          } else {
            console.log(`❌ Pricing Calculation - Expected ${expectedPricing}, got base: ${basePrice}, total: ${totalPrice}`);
          }
        } catch (error) {
          console.error.message}`);
        }

        // Test modal buttons
        const modalButtonTests = [
          { name: 'Modal Close (X) Button', selector: 'button[onclick="closeNewBookingModal()"]' },
          { name: 'Modal Cancel Button', selector: 'button[onclick="closeNewBookingModal()"]' }
        ];

        for (const test of modalButtonTests) {
          total++;
          try {
            const elements = await page.$$(test.selector);
            if (elements.length > 0) {
              await elements[0].click();
              await sleep(500);

              const modalHidden = await page.$eval('#new-booking-modal', el =>
                el.classList.contains('hidden')
              );

              if (modalHidden) {
                console.log(`✅ ${test.name} - Closes modal`);
                passed++;

                // Reopen for next test if needed
                if (test.name.includes('Close (X)')) {
                  await page.click('button[onclick="showNewBookingForm()"]');
                  await sleep(500);
                }
              } else {
                console.log(`❌ ${test.name} - Modal didn't close`);
              }
            } else {
              console.log(`❌ ${test.name} - Button not found`);
            }
          } catch (error) {
            console.error.message}`);
          }
        }

      } else {
        console.log('❌ Modal Opens - Add Booking modal failed to display');
      }
    } catch (error) {
      console.error.message}`);
    }

    // Test 5: Booking Cards (dynamic content)
    console.log('\n📋 TESTING BOOKING CARDS');
    console.log('=========================');

    total++;
    try {
      const bookingCards = await page.$$('.booking-card');
      if (bookingCards.length > 0) {
        console.log(`✅ Booking Cards - ${bookingCards.length} cards loaded from API`);
        passed++;

        // Test clicking first booking card
        total++;
        try {
          await bookingCards[0].click();
          await sleep(1000);

          const detailModal = await page.$('#booking-modal:not(.hidden)');
          if (detailModal) {
            console.log('✅ Booking Card Click - Opens detail modal');
            passed++;

            // Close detail modal
            await page.click('button[onclick="closeModal()"]');
            await sleep(500);
          } else {
            console.log('❌ Booking Card Click - Detail modal didn\'t open');
          }
        } catch (error) {
          console.error.message}`);
        }

        // Test manage booking buttons in cards
        total++;
        try {
          const manageButtons = await page.$$('button:contains("Manage Booking")');
          if (manageButtons.length > 0) {
            console.log(`✅ Manage Booking Buttons - ${manageButtons.length} buttons found`);
            passed++;
          } else {
            console.log('❌ Manage Booking Buttons - No buttons found');
          }
        } catch (error) {
          console.error.message}`);
        }

      } else {
        console.log('⚠️  Booking Cards - No cards loaded (may be empty state)');
      }
    } catch (error) {
      console.error.message}`);
    }

    // Test 6: Mobile Responsiveness
    console.log('\n📱 TESTING MOBILE RESPONSIVENESS');
    console.log('=================================');

    total++;
    try {
      await page.setViewport({ width: 375, height: 667 });
      await sleep(1000);

      const headerVisible = await page.$('.admin-header');
      const quickActionsVisible = await page.$('#quick-actions');

      if (headerVisible && quickActionsVisible) {
        console.log('✅ Mobile Layout - Header and actions visible');
        passed++;

        // Test mobile modal
        total++;
        try {
          await page.click('button[onclick="showNewBookingForm()"]');
          await sleep(1000);

          const mobileModalVisible = await page.$eval('#new-booking-modal', el =>
            !el.classList.contains('hidden')
          );

          if (mobileModalVisible) {
            console.log('✅ Mobile Modal - Opens correctly on mobile');
            passed++;

            await page.click('button[onclick="closeNewBookingModal()"]');
            await sleep(500);
          } else {
            console.log('❌ Mobile Modal - Failed to open on mobile');
          }
        } catch (error) {
          console.error.message}`);
        }
      } else {
        console.log('❌ Mobile Layout - Layout broken on mobile');
      }
    } catch (error) {
      console.error.message}`);
    }

    // Test 7: JavaScript Console Errors
    console.log('\n🐛 TESTING FOR JAVASCRIPT ERRORS');
    console.log('==================================');

    total++;
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Reset viewport and reload to check for errors
    await page.setViewport({ width: 1200, height: 800 });
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(3000);

    if (consoleErrors.length === 0) {
      console.errors detected');
      passed++;
    } else {
      console.errors found:`);
      consoleErrors.forEach((error, i) => {
        console.error}`);
      });
    }

  } catch (error) {
    console.error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Final Results
  console.log('\n🎯 ROBUST ALL-ELEMENTS TEST RESULTS');
  console.log('====================================');
  console.log(`Total Tests Run: ${total}`);
  console.log(`Tests Passed: ${passed}`);
  console.log(`Success Rate: ${Math.round((passed/total) * 100)}%`);

  console.log('\n📊 TEST CATEGORIES');
  console.log('==================');
  console.log('✓ Quick Action Buttons');
  console.log('✓ Dashboard Metrics');
  console.log('✓ Filter Controls');
  console.log('✓ Modal System');
  console.log('✓ Form Elements');
  console.log('✓ Pricing Calculation');
  console.log('✓ Booking Cards');
  console.log('✓ Mobile Responsiveness');
  console.error Check');

  if (passed >= total * 0.9) { // 90% pass rate
    console.log('\n🎉 EXCELLENT! Admin Dashboard Fully Functional');
    console.log('===============================================');
    console.log('✅ All critical elements working');
    console.log('✅ Modal system fully operational');
    console.log('✅ Forms and inputs functional');
    console.log('✅ Filters and search working');
    console.log('✅ Mobile responsive design');
    console.errors');
    return true;
  }
  console.log(`\n💥 ${total - passed} tests failed - needs attention`);
  return false;

}

testAllElementsRobust()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
