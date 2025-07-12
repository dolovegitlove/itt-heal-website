import { chromium } from 'playwright';

(async () => {
  console.log('🧪 Testing Admin Navigation Issues...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    console.log('🔐 Loading admin dashboard...');
    await page.goto('https://ittheal.com/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    console.log('📊 Step 1: Checking initial state...');
    const initialState = await page.evaluate(() => {
      return {
        currentPage: window.adminDashboard?.currentPage,
        dashboardVisible: window.getComputedStyle(document.getElementById('dashboard-page')).display,
        bookingsVisible: window.getComputedStyle(document.getElementById('bookings-page')).display,
        dashboardContent: document.getElementById('dashboard-page').innerHTML.substring(0, 100),
        bookingsContent: document.getElementById('bookings-page').innerHTML.substring(0, 100)
      };
    });

    console.log('Initial state:');
    Object.entries(initialState).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    console.log('\\n🔄 Step 2: Testing navigation to bookings...');

    // Take screenshot before navigation
    await page.screenshot({ path: '/tmp/before-navigation.png', fullPage: true });

    // Click on bookings navigation
    await page.click('[data-page="bookings"]');
    await page.waitForTimeout(2000);

    // Check state after navigation
    const afterNavigation = await page.evaluate(() => {
      return {
        currentPage: window.adminDashboard?.currentPage,
        dashboardVisible: window.getComputedStyle(document.getElementById('dashboard-page')).display,
        bookingsVisible: window.getComputedStyle(document.getElementById('bookings-page')).display,
        activeNavItem: document.querySelector('.nav-item.active')?.dataset.page,
        navigationHistory: window.adminDashboard?.navigationHistory,
        dashboardHasContent: document.getElementById('dashboard-page').innerHTML.length > 1000,
        bookingsHasContent: document.getElementById('bookings-page').innerHTML.length > 100
      };
    });

    console.log('After clicking bookings:');
    Object.entries(afterNavigation).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    // Take screenshot after navigation
    await page.screenshot({ path: '/tmp/after-bookings-click.png', fullPage: true });

    console.log('\\n🔍 Step 3: Checking if navigation worked...');

    const navigationWorked = afterNavigation.currentPage === 'bookings' &&
                           afterNavigation.dashboardVisible === 'none' &&
                           afterNavigation.bookingsVisible === 'block';

    console.log(`Navigation to bookings: ${navigationWorked ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (!navigationWorked) {
      console.log('\\n🔧 Debugging navigation issue...');

      // Check for JavaScript errors
      const errors = await page.evaluate(() => {
        return window.navigationErrors || [];
      });

      if (errors.length > 0) {
        console.errors found:');
        errors.forEach(error => console.error}`));
      }

      // Check if navigateToPage method exists
      const methodCheck = await page.evaluate(() => {
        return {
          adminDashboardExists: Boolean(window.adminDashboard),
          navigateToPageExists: Boolean(window.adminDashboard && window.adminDashboard.navigateToPage),
          navigateToPageType: typeof window.adminDashboard?.navigateToPage
        };
      });

      console.log('Method check:');
      Object.entries(methodCheck).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });

      // Try manual navigation
      console.log('\\n🔧 Attempting manual navigation...');
      await page.evaluate(() => {
        if (window.adminDashboard && window.adminDashboard.navigateToPage) {
          window.adminDashboard.navigateToPage('bookings');
        }
      });

      await page.waitForTimeout(1000);

      const manualNavResult = await page.evaluate(() => {
        return {
          currentPage: window.adminDashboard?.currentPage,
          dashboardVisible: window.getComputedStyle(document.getElementById('dashboard-page')).display,
          bookingsVisible: window.getComputedStyle(document.getElementById('bookings-page')).display
        };
      });

      console.log('Manual navigation result:');
      Object.entries(manualNavResult).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });

      const manualWorked = manualNavResult.currentPage === 'bookings' &&
                          manualNavResult.dashboardVisible === 'none' &&
                          manualNavResult.bookingsVisible === 'block';

      console.log(`Manual navigation: ${manualWorked ? '✅ SUCCESS' : '❌ FAILED'}`);
    }

    console.log('\\n📋 Step 4: Testing other navigation items...');

    const menuItems = ['dashboard', 'schedule', 'analytics', 'reports', 'clients'];

    for (const item of menuItems) {
      console.log(`\\n   Testing ${item}...`);

      await page.click(`[data-page="${item}"]`);
      await page.waitForTimeout(1000);

      const itemResult = await page.evaluate((itemName) => {
        const pageElement = document.getElementById(`${itemName}-page`);
        return {
          currentPage: window.adminDashboard?.currentPage,
          pageVisible: pageElement ? window.getComputedStyle(pageElement).display : 'not found',
          activeNav: document.querySelector('.nav-item.active')?.dataset.page
        };
      }, item);

      const itemWorked = itemResult.currentPage === item &&
                        itemResult.pageVisible === 'block' &&
                        itemResult.activeNav === item;

      console.log(`   ${item}: ${itemWorked ? '✅' : '❌'} (current: ${itemResult.currentPage}, visible: ${itemResult.pageVisible})`);
    }

    console.log('\\n🎯 Final Test: Return to bookings...');
    await page.click('[data-page="bookings"]');
    await page.waitForTimeout(2000);

    const finalTest = await page.evaluate(() => {
      return {
        currentPage: window.adminDashboard?.currentPage,
        dashboardVisible: window.getComputedStyle(document.getElementById('dashboard-page')).display,
        bookingsVisible: window.getComputedStyle(document.getElementById('bookings-page')).display,
        bookingsHasContent: document.getElementById('bookings-page').innerHTML.length > 100
      };
    });

    console.log('Final bookings test:');
    Object.entries(finalTest).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    await page.screenshot({ path: '/tmp/final-bookings-test.png', fullPage: true });

    const finalWorked = finalTest.currentPage === 'bookings' &&
                       finalTest.dashboardVisible === 'none' &&
                       finalTest.bookingsVisible === 'block';

    console.log(`\\n🏆 RESULT: Bookings navigation ${finalWorked ? '✅ WORKS' : '❌ BROKEN'}`);

    if (!finalWorked) {
      console.log('\\n🚨 ISSUE: Dashboard still showing when bookings selected');
      console.log('   - Check page visibility styles');
      console.log('   - Check JavaScript navigation logic');
      console.log('   - Review page switching implementation');
    }

    console.log('\\n👀 Keeping browser open for inspection...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: '/tmp/navigation-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
