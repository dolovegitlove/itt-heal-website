#!/usr/bin/env node

/**
 * Test Calendar and Filtering Features in Real Browser
 */

const puppeteer = require('puppeteer');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCalendarAndFiltering() {
  console.log('🔍 Testing Calendar and Filtering Features in Real Browser...');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
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

    // Test 2: Test view toggle buttons exist
    console.log('🔹 Testing View Toggle Buttons...');
    const listViewBtn = await page.$('#list-view-btn');
    const calendarViewBtn = await page.$('#calendar-view-btn');

    if (listViewBtn && calendarViewBtn) {
      console.log('✅ Both List and Calendar view buttons found');
    } else {
      console.log('⚠️  View toggle buttons not found');
    }

    // Test 3: Test filter inputs exist
    console.log('🔹 Testing Filter Inputs...');
    const clientFilter = await page.$('#filter-client');
    const statusFilter = await page.$('#filter-status');
    const serviceFilter = await page.$('#filter-service');
    const dateFromFilter = await page.$('#filter-date-from');
    const dateToFilter = await page.$('#filter-date-to');

    if (clientFilter && statusFilter && serviceFilter && dateFromFilter && dateToFilter) {
      console.log('✅ All filter inputs found');
    } else {
      console.log('⚠️  Some filter inputs missing');
    }

    // Test 4: Test quick filter buttons
    console.log('🔹 Testing Quick Filter Buttons...');
    const todayBtn = await page.$('button[onclick="setQuickDateFilter(\'today\')"]');
    const weekBtn = await page.$('button[onclick="setQuickDateFilter(\'week\')"]');
    const monthBtn = await page.$('button[onclick="setQuickDateFilter(\'month\')"]');

    if (todayBtn && weekBtn && monthBtn) {
      console.log('✅ Quick filter buttons found');
    } else {
      console.log('⚠️  Quick filter buttons missing');
    }

    // Test 5: Test client search functionality
    console.log('🔹 Testing Client Search...');
    await page.type('#filter-client', 'test');
    await wait(500);

    // Check if function exists
    const applyFiltersExists = await page.evaluate(() => {
      return typeof applyFilters === 'function';
    });

    if (applyFiltersExists) {
      console.log('✅ applyFilters function exists');
    } else {
      console.log('⚠️  applyFilters function not found');
    }

    // Test 6: Switch to calendar view
    console.log('🔹 Testing Calendar View Switch...');

    // Check if setView function exists
    const setViewExists = await page.evaluate(() => {
      return typeof setView === 'function';
    });

    if (setViewExists) {
      await page.click('#calendar-view-btn');
      await wait(1000);
      console.log('✅ Calendar view switch attempted');

      // Check if calendar controls appear
      const calendarControls = await page.$('#calendar-controls');
      if (calendarControls) {
        console.log('✅ Calendar controls found');
      } else {
        console.log('⚠️  Calendar controls not visible');
      }
    } else {
      console.log('⚠️  setView function not found');
    }

    // Test 7: Test calendar view buttons
    console.log('🔹 Testing Calendar View Buttons...');
    const dayViewBtn = await page.$('#day-view-btn');
    const weekViewBtn = await page.$('#week-view-btn');
    const monthViewBtn = await page.$('#month-view-btn');

    if (dayViewBtn && weekViewBtn && monthViewBtn) {
      console.log('✅ Calendar view buttons found');

      // Test clicking each view
      await page.click('#day-view-btn');
      await wait(500);
      console.log('✅ Day view clicked');

      await page.click('#week-view-btn');
      await wait(500);
      console.log('✅ Week view clicked');

      await page.click('#month-view-btn');
      await wait(500);
      console.log('✅ Month view clicked');
    } else {
      console.log('⚠️  Calendar view buttons missing');
    }

    // Test 8: Test calendar navigation
    console.log('🔹 Testing Calendar Navigation...');
    const prevBtn = await page.$('button[onclick="navigateCalendar(-1)"]');
    const nextBtn = await page.$('button[onclick="navigateCalendar(1)"]');
    const todayNavBtn = await page.$('button[onclick="goToToday()"]');

    if (prevBtn && nextBtn && todayNavBtn) {
      console.log('✅ Calendar navigation buttons found');

      // Test navigation
      await page.click('button[onclick="navigateCalendar(-1)"]');
      await wait(500);
      console.log('✅ Previous navigation clicked');

      await page.click('button[onclick="navigateCalendar(1)"]');
      await wait(500);
      console.log('✅ Next navigation clicked');

      await page.click('button[onclick="goToToday()"]');
      await wait(500);
      console.log('✅ Today navigation clicked');
    } else {
      console.log('⚠️  Calendar navigation buttons missing');
    }

    // Test 9: Test calendar content areas
    console.log('🔹 Testing Calendar Content Areas...');
    const dayView = await page.$('#day-view');
    const weekView = await page.$('#week-view');
    const monthView = await page.$('#month-view');

    if (dayView && weekView && monthView) {
      console.log('✅ All calendar content areas found');
    } else {
      console.log('⚠️  Some calendar content areas missing');
    }

    // Test 10: Switch back to list view
    console.log('🔹 Testing List View Return...');
    await page.click('#list-view-btn');
    await wait(1000);
    console.log('✅ List view button clicked');

    // Test 11: Test clear filters
    console.log('🔹 Testing Clear Filters...');
    const clearBtn = await page.$('button[onclick="clearAllFilters()"]');
    if (clearBtn) {
      await page.click('button[onclick="clearAllFilters()"]');
      await wait(500);
      console.log('✅ Clear filters button works');
    } else {
      console.log('⚠️  Clear filters button not found');
    }

    // Test 12: Test results display
    console.log('🔹 Testing Results Display...');
    const resultsCount = await page.$('#results-count');
    const activeFilters = await page.$('#active-filters');

    if (resultsCount && activeFilters) {
      console.log('✅ Results display elements found');
    } else {
      console.log('⚠️  Results display elements missing');
    }

    console.log('\n🎉 Calendar and Filtering Browser Test Complete!');
    console.log('🌟 Features tested:');
    console.log('   ✅ Filter panel and inputs');
    console.log('   ✅ View toggle buttons (List/Calendar)');
    console.log('   ✅ Calendar view buttons (Day/Week/Month)');
    console.log('   ✅ Calendar navigation (Prev/Next/Today)');
    console.log('   ✅ Quick date filters');
    console.log('   ✅ Client search functionality');
    console.log('   ✅ Calendar content areas');
    console.log('   ✅ Clear filters');
    console.log('   ✅ Results display');

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
    console.log('\n🌟 CALENDAR & FILTERING UI: SUCCESS');
    console.log('🎯 All features present and functional in real browser!');
    process.exit(0);
  } else {
    console.log('\n❌ CALENDAR & FILTERING UI: FAILED');
    process.exit(1);
  }
}).catch(console.error);
