import { chromium } from 'playwright';

(async () => {
  console.log('🔍 Testing Dashboard Persistence Issue...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 800
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Monitor console logs for any errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error:', msg.text());
      }
    });

    console.log('🔐 Loading admin dashboard...');
    await page.goto('https://ittheal.com/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    console.log('📊 Testing edge cases that might cause dashboard to persist...');

    // Test 1: Rapid navigation clicking
    console.log('\\n🔄 Test 1: Rapid navigation clicking...');
    await page.click('[data-page="bookings"]');
    await page.waitForTimeout(100);
    await page.click('[data-page="dashboard"]');
    await page.waitForTimeout(100);
    await page.click('[data-page="bookings"]');
    await page.waitForTimeout(2000);

    const rapidClickResult = await page.evaluate(() => {
      return {
        currentPage: window.adminDashboard?.currentPage,
        dashboardDisplay: window.getComputedStyle(document.getElementById('dashboard-page')).display,
        bookingsDisplay: window.getComputedStyle(document.getElementById('bookings-page')).display
      };
    });

    console.log('Rapid click result:');
    Object.entries(rapidClickResult).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    // Test 2: Navigation during loading
    console.log('\\n⏳ Test 2: Navigation during potential loading states...');

    // Trigger data loading
    await page.evaluate(() => {
      if (window.adminDashboard && window.adminDashboard.loadInitialData) {
        window.adminDashboard.loadInitialData();
      }
    });

    // Navigate while loading
    await page.click('[data-page="bookings"]');
    await page.waitForTimeout(3000);

    const loadingNavResult = await page.evaluate(() => {
      return {
        currentPage: window.adminDashboard?.currentPage,
        dashboardDisplay: window.getComputedStyle(document.getElementById('dashboard-page')).display,
        bookingsDisplay: window.getComputedStyle(document.getElementById('bookings-page')).display,
        dashboardHasLoadingContent: document.getElementById('dashboard-page').innerHTML.includes('Loading'),
        bookingsHasLoadingContent: document.getElementById('bookings-page').innerHTML.includes('Loading')
      };
    });

    console.log('Navigation during loading result:');
    Object.entries(loadingNavResult).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    // Test 3: Check for any auto-refresh that might reset to dashboard
    console.log('\\n🔄 Test 3: Monitoring for auto-refresh or reset...');

    await page.click('[data-page="bookings"]');
    await page.waitForTimeout(1000);

    // Monitor for changes over time
    const monitorResults = [];
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(1000);
      const state = await page.evaluate(() => {
        return {
          currentPage: window.adminDashboard?.currentPage,
          dashboardDisplay: window.getComputedStyle(document.getElementById('dashboard-page')).display,
          bookingsDisplay: window.getComputedStyle(document.getElementById('bookings-page')).display,
          timestamp: Date.now()
        };
      });
      monitorResults.push(state);
    }

    console.log('Monitor results over 5 seconds:');
    monitorResults.forEach((result, index) => {
      console.log(`   ${index + 1}s: current=${result.currentPage}, dashboard=${result.dashboardDisplay}, bookings=${result.bookingsDisplay}`);
    });

    // Check if there was any unexpected change
    const unexpectedChange = monitorResults.some(result =>
      result.currentPage !== 'bookings' ||
      result.dashboardDisplay !== 'none' ||
      result.bookingsDisplay !== 'block'
    );

    console.log(`Unexpected page changes detected: ${unexpectedChange ? '❌ YES' : '✅ NO'}`);

    // Test 4: Check specific DOM manipulation
    console.log('\\n🔍 Test 4: Checking DOM manipulation...');

    const domCheck = await page.evaluate(() => {
      const dashboard = document.getElementById('dashboard-page');
      const bookings = document.getElementById('bookings-page');

      return {
        dashboardStyleAttribute: dashboard.style.display,
        bookingsStyleAttribute: bookings.style.display,
        dashboardComputedStyle: window.getComputedStyle(dashboard).display,
        bookingsComputedStyle: window.getComputedStyle(bookings).display,
        dashboardClasses: dashboard.className,
        bookingsClasses: bookings.className,
        dashboardParent: dashboard.parentElement.id,
        bookingsParent: bookings.parentElement.id
      };
    });

    console.log('DOM Check:');
    Object.entries(domCheck).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    // Test 5: Check for CSS interference
    console.log('\\n🎨 Test 5: Checking for CSS interference...');

    const cssCheck = await page.evaluate(() => {
      const dashboard = document.getElementById('dashboard-page');
      const bookings = document.getElementById('bookings-page');

      // Check for any CSS rules that might override display
      const dashboardStyles = window.getComputedStyle(dashboard);
      const bookingsStyles = window.getComputedStyle(bookings);

      return {
        dashboardVisibility: dashboardStyles.visibility,
        bookingsVisibility: bookingsStyles.visibility,
        dashboardOpacity: dashboardStyles.opacity,
        bookingsOpacity: bookingsStyles.opacity,
        dashboardZIndex: dashboardStyles.zIndex,
        bookingsZIndex: bookingsStyles.zIndex,
        dashboardPosition: dashboardStyles.position,
        bookingsPosition: bookingsStyles.position
      };
    });

    console.log('CSS Check:');
    Object.entries(cssCheck).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    // Final verification
    console.log('\\n🎯 Final Verification...');

    await page.click('[data-page="bookings"]');
    await page.waitForTimeout(2000);

    const finalCheck = await page.evaluate(() => {
      return {
        currentPage: window.adminDashboard?.currentPage,
        dashboardVisible: window.getComputedStyle(document.getElementById('dashboard-page')).display === 'block',
        bookingsVisible: window.getComputedStyle(document.getElementById('bookings-page')).display === 'block',
        bothVisible: window.getComputedStyle(document.getElementById('dashboard-page')).display === 'block' &&
                    window.getComputedStyle(document.getElementById('bookings-page')).display === 'block',
        activeNavItem: document.querySelector('.nav-item.active')?.dataset.page
      };
    });

    console.log('Final Check:');
    Object.entries(finalCheck).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    await page.screenshot({ path: '/tmp/dashboard-persistence-test.png', fullPage: true });

    if (finalCheck.bothVisible) {
      console.log('\\n🚨 ISSUE DETECTED: Both dashboard and bookings are visible!');
      console.log('   This confirms the bug you reported.');
    } else if (finalCheck.dashboardVisible && !finalCheck.bookingsVisible) {
      console.log('\\n🚨 ISSUE DETECTED: Dashboard showing instead of bookings!');
      console.log('   Navigation is not working correctly.');
    } else if (!finalCheck.dashboardVisible && finalCheck.bookingsVisible) {
      console.log('\\n✅ WORKING CORRECTLY: Only bookings is visible.');
    } else {
      console.log('\\n⚠️ UNEXPECTED STATE: Neither page is visible.');
    }

    console.log('\\n📸 Screenshots saved to /tmp/ for debugging');
    console.log('\\n👀 Keeping browser open for manual inspection...');
    await page.waitForTimeout(20000);

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: '/tmp/persistence-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
