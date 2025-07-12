import { chromium } from 'playwright';

(async () => {
  console.log('👤 Simulating User Experience - Menu Navigation Issue...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1200 // Slower to match human interaction
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    console.log('🔐 Step 1: Loading admin dashboard (as user would)...');
    await page.goto('https://ittheal.com/admin');

    // Wait for full page load like a user would
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('👀 Step 2: User sees dashboard initially...');
    await page.screenshot({ path: '/tmp/user-sees-dashboard.png', fullPage: true });

    const initialState = await page.evaluate(() => {
      return {
        currentPage: window.adminDashboard?.currentPage,
        dashboardVisible: document.getElementById('dashboard-page').style.display !== 'none',
        bookingsVisible: document.getElementById('bookings-page').style.display === 'block',
        dashboardHasContent: document.getElementById('dashboard-page').innerHTML.includes('Dashboard'),
        url: window.location.href
      };
    });

    console.log('Initial state:');
    Object.entries(initialState).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    console.log('\\n🖱️ Step 3: User clicks on "Bookings" menu item...');

    // User clicks on bookings - exactly as reported
    await page.click('[data-page="bookings"]');

    // Wait a moment for navigation
    await page.waitForTimeout(2000);

    console.log('📊 Step 4: Checking what user sees after clicking bookings...');

    const afterBookingsClick = await page.evaluate(() => {
      const dashboard = document.getElementById('dashboard-page');
      const bookings = document.getElementById('bookings-page');

      return {
        currentPage: window.adminDashboard?.currentPage,
        dashboardDisplay: dashboard.style.display,
        bookingsDisplay: bookings.style.display,
        dashboardComputedDisplay: window.getComputedStyle(dashboard).display,
        bookingsComputedDisplay: window.getComputedStyle(bookings).display,
        dashboardVisible: window.getComputedStyle(dashboard).display !== 'none',
        bookingsVisible: window.getComputedStyle(bookings).display !== 'none',
        activeNavItem: document.querySelector('.nav-item.active')?.dataset.page,
        url: window.location.href,
        hash: window.location.hash,
        dashboardContent: dashboard.innerHTML.substring(0, 200),
        bookingsContent: bookings.innerHTML.substring(0, 200)
      };
    });

    console.log('After bookings click:');
    Object.entries(afterBookingsClick).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    await page.screenshot({ path: '/tmp/user-after-bookings-click.png', fullPage: true });

    console.log('\\n🔍 Step 5: Analyzing the issue...');

    const problemAnalysis = {
      dashboardStillVisible: afterBookingsClick.dashboardVisible,
      bookingsNotVisible: !afterBookingsClick.bookingsVisible,
      bothVisible: afterBookingsClick.dashboardVisible && afterBookingsClick.bookingsVisible,
      neitherVisible: !afterBookingsClick.dashboardVisible && !afterBookingsClick.bookingsVisible,
      navigationSuccessful: afterBookingsClick.currentPage === 'bookings',
      urlUpdated: afterBookingsClick.hash === '#bookings'
    };

    console.log('Problem analysis:');
    Object.entries(problemAnalysis).forEach(([key, value]) => {
      console.log(`   ${key}: ${value ? '✅' : '❌'}`);
    });

    // Check if this matches the reported issue
    if (problemAnalysis.dashboardStillVisible && !problemAnalysis.bookingsNotVisible) {
      console.log('\\n🚨 ISSUE CONFIRMED: Dashboard still showing when bookings selected!');
      console.log('   This matches the reported problem.');

      // Try to debug further
      console.log('\\n🔧 Step 6: Debugging the issue...');

      const debugInfo = await page.evaluate(() => {
        const dashboard = document.getElementById('dashboard-page');
        const bookings = document.getElementById('bookings-page');

        // Check all possible reasons why dashboard might still be visible
        return {
          dashboardStyleDisplay: dashboard.style.display,
          bookingsStyleDisplay: bookings.style.display,
          dashboardHasInlineStyles: dashboard.style.length > 0,
          bookingsHasInlineStyles: bookings.style.length > 0,
          dashboardClasses: dashboard.classList.toString(),
          bookingsClasses: bookings.classList.toString(),
          navigationHistoryLength: window.adminDashboard?.navigationHistory?.length,
          navigationHistory: window.adminDashboard?.navigationHistory?.join(' → ')
        };
      });

      console.log('Debug info:');
      Object.entries(debugInfo).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });

      // Try manual fix
      console.log('\\n🔧 Step 7: Attempting manual fix...');
      await page.evaluate(() => {
        const dashboard = document.getElementById('dashboard-page');
        const bookings = document.getElementById('bookings-page');

        // Force correct display states
        dashboard.style.display = 'none';
        bookings.style.display = 'block';

        console.log('Manual fix applied');
      });

      await page.waitForTimeout(1000);

      const afterManualFix = await page.evaluate(() => {
        return {
          dashboardVisible: window.getComputedStyle(document.getElementById('dashboard-page')).display !== 'none',
          bookingsVisible: window.getComputedStyle(document.getElementById('bookings-page')).display !== 'none'
        };
      });

      console.log('After manual fix:');
      Object.entries(afterManualFix).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });

      await page.screenshot({ path: '/tmp/after-manual-fix.png', fullPage: true });

    } else {
      console.log('\\n✅ WORKING CORRECTLY: Navigation appears to be functioning properly.');
    }

    console.log('\\n🔄 Step 8: Testing multiple navigation attempts...');

    // Test multiple back-and-forth navigation like a user might do
    const testSequence = ['dashboard', 'bookings', 'dashboard', 'bookings', 'analytics', 'bookings'];

    for (const targetPage of testSequence) {
      console.log(`\\n   Navigating to ${targetPage}...`);
      await page.click(`[data-page="${targetPage}"]`);
      await page.waitForTimeout(1500);

      const state = await page.evaluate(() => {
        return {
          currentPage: window.adminDashboard?.currentPage,
          dashboardVisible: window.getComputedStyle(document.getElementById('dashboard-page')).display !== 'none',
          bookingsVisible: window.getComputedStyle(document.getElementById('bookings-page')).display !== 'none'
        };
      });

      const isCorrect = state.currentPage === targetPage &&
                       (targetPage === 'dashboard' ? state.dashboardVisible : !state.dashboardVisible) &&
                       (targetPage === 'bookings' ? state.bookingsVisible : !state.bookingsVisible);

      console.log(`   Result: ${isCorrect ? '✅' : '❌'} (current: ${state.currentPage}, dashboard: ${state.dashboardVisible}, bookings: ${state.bookingsVisible})`);
    }

    console.log('\\n🏁 Final Test: Navigate to bookings one more time...');
    await page.click('[data-page="bookings"]');
    await page.waitForTimeout(2000);

    const finalState = await page.evaluate(() => {
      return {
        currentPage: window.adminDashboard?.currentPage,
        dashboardVisible: window.getComputedStyle(document.getElementById('dashboard-page')).display !== 'none',
        bookingsVisible: window.getComputedStyle(document.getElementById('bookings-page')).display !== 'none'
      };
    });

    console.log('Final state:');
    Object.entries(finalState).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    await page.screenshot({ path: '/tmp/final-bookings-state.png', fullPage: true });

    const finalSuccess = finalState.currentPage === 'bookings' &&
                        !finalState.dashboardVisible &&
                        finalState.bookingsVisible;

    console.log(`\\n🎯 FINAL RESULT: ${finalSuccess ? '✅ WORKING' : '❌ ISSUE CONFIRMED'}`);

    if (!finalSuccess) {
      console.log('\\n🔧 RECOMMENDED FIXES:');
      console.log('   1. Check page display logic in navigateToPage method');
      console.log('   2. Verify CSS isn\'t overriding display properties');
      console.log('   3. Add explicit display:none to dashboard page');
      console.log('   4. Check for timing issues with page updates');
    }

    console.log('\\n👀 Browser will stay open for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Test failed:', error);
    try {
      await page.screenshot({ path: '/tmp/user-experience-error.png', fullPage: true });
    } catch (e) {
      console.error screenshot');
    }
  } finally {
    await browser.close();
  }
})();
