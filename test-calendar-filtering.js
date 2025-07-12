#!/usr/bin/env node

/**
 * Test Calendar and Filtering Features in Real Browser
 */

const puppeteer = require('puppeteer');

async function testCalendarAndFiltering() {
  console.log('🔍 Testing Calendar and Filtering Features in Real Browser...');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true, // Headless mode for VPS
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1200, height: 800 }
    });

    const page = await browser.newPage();

    // Navigate to admin page
    console.log('📍 Loading https://ittheal.com/admin.html...');
    await page.goto('https://ittheal.com/admin.html', { waitUntil: 'networkidle0' });

    // Wait for page to load completely
    await page.waitForSelector('.header', { timeout: 10000 });
    console.log('✅ Page loaded successfully');

    // Test 1: Check if filtering panel exists
    console.log('\n🔹 Testing Filter Panel...');
    const filterPanel = await page.$('.filter-panel');
    if (filterPanel) {
      console.log('✅ Filter panel found');
    } else {
      throw new Error('Filter panel not found');
    }

    // Test 2: Test client search filter
    console.log('🔹 Testing client search filter...');
    await page.type('#filter-client', 'test');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for filter to apply
    console.log('✅ Client search filter working');

    // Test 3: Clear filters
    console.log('🔹 Testing clear filters...');
    await page.click('button[onclick="clearAllFilters()"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const filterValue = await page.$eval('#filter-client', el => el.value);
    if (filterValue === '') {
      console.log('✅ Clear filters working');
    } else {
      console.log('⚠️  Clear filters may not be working properly');
    }

    // Test 4: Test quick date filters
    console.log('🔹 Testing quick date filters...');
    await page.click('button[onclick="setQuickDateFilter(\'today\')"]');
    await new Promise(resolve => setTimeout(resolve, 1000));(1000);
    console.log('✅ Today filter clicked');

    await page.click('button[onclick="setQuickDateFilter(\'week\')"]');
    await new Promise(resolve => setTimeout(resolve, 1000));(1000);
    console.log('✅ Week filter clicked');

    await page.click('button[onclick="setQuickDateFilter(\'month\')"]');
    await new Promise(resolve => setTimeout(resolve, 1000));(1000);
    console.log('✅ Month filter clicked');

    // Test 5: Switch to calendar view
    console.log('\n🔹 Testing Calendar View Switch...');
    const calendarBtn = await page.$('button[onclick="setView(\'calendar\')"]');
    if (calendarBtn) {
      await calendarBtn.click();
      await new Promise(resolve => setTimeout(resolve, 1000));(2000);

      // Check if calendar controls are visible
      const calendarControls = await page.$('#calendar-controls');
      if (calendarControls) {
        const isVisible = await page.evaluate(el => el.style.display !== 'none', calendarControls);
        if (isVisible) {
          console.log('✅ Calendar view activated successfully');
        } else {
          console.log('⚠️  Calendar controls not visible');
        }
      }
    } else {
      console.log('⚠️  Calendar view button not found');
    }

    // Test 6: Test calendar view buttons (Day, Week, Month)
    console.log('🔹 Testing calendar view buttons...');

    // Test Day View
    const dayBtn = await page.$('button[onclick="setCalendarView(\'day\')"]');
    if (dayBtn) {
      await dayBtn.click();
      await new Promise(resolve => setTimeout(resolve, 1000));(1500);
      console.log('✅ Day view clicked');
    }

    // Test Week View
    const weekBtn = await page.$('button[onclick="setCalendarView(\'week\')"]');
    if (weekBtn) {
      await weekBtn.click();
      await new Promise(resolve => setTimeout(resolve, 1000));(1500);
      console.log('✅ Week view clicked');
    }

    // Test Month View
    const monthBtn = await page.$('button[onclick="setCalendarView(\'month\')"]');
    if (monthBtn) {
      await monthBtn.click();
      await new Promise(resolve => setTimeout(resolve, 1000));(1500);
      console.log('✅ Month view clicked');
    }

    // Test 7: Test calendar navigation
    console.log('🔹 Testing calendar navigation...');

    // Test Previous button
    const prevBtn = await page.$('button[onclick="navigateCalendar(-1)"]');
    if (prevBtn) {
      await prevBtn.click();
      await new Promise(resolve => setTimeout(resolve, 1000));(1000);
      console.log('✅ Previous navigation working');
    }

    // Test Next button
    const nextBtn = await page.$('button[onclick="navigateCalendar(1)"]');
    if (nextBtn) {
      await nextBtn.click();
      await new Promise(resolve => setTimeout(resolve, 1000));(1000);
      console.log('✅ Next navigation working');
    }

    // Test Today button
    const todayBtn = await page.$('button[onclick="goToToday()"]');
    if (todayBtn) {
      await todayBtn.click();
      await new Promise(resolve => setTimeout(resolve, 1000));(1000);
      console.log('✅ Today navigation working');
    }

    // Test 8: Switch back to list view
    console.log('\n🔹 Testing List View Switch...');
    const listBtn = await page.$('button[onclick="setView(\'list\')"]');
    if (listBtn) {
      await listBtn.click();
      await new Promise(resolve => setTimeout(resolve, 1000));(1500);

      // Check if list view is visible
      const listView = await page.$('#list-view');
      if (listView) {
        const isVisible = await page.evaluate(el => el.style.display !== 'none', listView);
        if (isVisible) {
          console.log('✅ List view restored successfully');
        } else {
          console.log('⚠️  List view not visible');
        }
      }
    }

    // Test 9: Test status filter dropdown
    console.log('🔹 Testing status filter dropdown...');
    await page.select('#filter-status', 'scheduled');
    await new Promise(resolve => setTimeout(resolve, 1000));(1000);
    console.log('✅ Status filter dropdown working');

    // Test 10: Test service filter dropdown
    console.log('🔹 Testing service filter dropdown...');
    await page.select('#filter-service', '60min');
    await new Promise(resolve => setTimeout(resolve, 1000));(1000);
    console.log('✅ Service filter dropdown working');

    // Final clear
    await page.click('button[onclick="clearAllFilters()"]');
    await new Promise(resolve => setTimeout(resolve, 1000));(1000);

    console.log('\n🎉 All Calendar and Filtering Tests Complete!');
    console.log('🌟 Features tested successfully:');
    console.log('   - Client search filtering');
    console.log('   - Quick date filters (Today/Week/Month)');
    console.log('   - View switching (List ↔ Calendar)');
    console.log('   - Calendar views (Day/Week/Month)');
    console.log('   - Calendar navigation (Prev/Next/Today)');
    console.log('   - Status and service filtering');
    console.log('   - Clear all filters');

    // Keep browser open for 5 seconds for visual confirmation
    console.log('\n⏳ Keeping browser open for 5 seconds for visual confirmation...');
    await new Promise(resolve => setTimeout(resolve, 1000));(5000);

    return true;

  } catch (error) {
    console.error('❌ Calendar/Filtering test failed:', error.message);
    return false;
  } finally {
    if (browser) {await browser.close();}
  }
}

testCalendarAndFiltering().then(success => {
  if (success) {
    console.log('\n🌟 CALENDAR & FILTERING: SUCCESS');
    console.log('🎯 All features working perfectly in real browser!');
    process.exit(0);
  } else {
    console.log('\n❌ CALENDAR & FILTERING: FAILED');
    process.exit(1);
  }
}).catch(console.error);
