import { chromium } from 'playwright';

(async () => {
  console.log('🧪 Testing Mobile Navigation Menu Close Functionality...\n');

  const browser = await chromium.launch({
    headless: true // Run headless on server
  });

  try {
    // Test on mobile viewport
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 }, // iPhone X size
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15'
    });

    const page = await context.newPage();

    console.log('📱 Loading site with mobile viewport...');
    await page.goto('https://ittheal.com', { waitUntil: 'networkidle' });

    // Test 1: Open mobile menu
    console.log('\n✅ Test 1: Opening mobile menu...');
    const hamburgerBtn = await page.$('#hamburger-btn');
    await hamburgerBtn.click();
    await page.waitForTimeout(500);

    // Verify menu is visible
    const menuVisible = await page.$eval('#mobile-menu', el => {
      return window.getComputedStyle(el).display !== 'none';
    });
    console.log(`   Menu visible: ${menuVisible ? '✅' : '❌'}`);

    // Verify ARIA attributes
    const ariaExpanded = await page.$eval('#hamburger-btn', el => el.getAttribute('aria-expanded'));
    console.log(`   aria-expanded="${ariaExpanded}" ${ariaExpanded === 'true' ? '✅' : '❌'}`);

    // Test 2: Click a navigation link
    console.log('\n✅ Test 2: Clicking "Services" link...');
    await page.click('a[href="#services"].mobile-menu-link');
    await page.waitForTimeout(500);

    // Verify menu closed
    const menuHidden = await page.$eval('#mobile-menu', el => {
      return window.getComputedStyle(el).display === 'none';
    });
    console.log(`   Menu hidden after click: ${menuHidden ? '✅' : '❌'}`);

    // Verify ARIA attributes updated
    const ariaExpandedAfter = await page.$eval('#hamburger-btn', el => el.getAttribute('aria-expanded'));
    console.log(`   aria-expanded="${ariaExpandedAfter}" ${ariaExpandedAfter === 'false' ? '✅' : '❌'}`);

    // Test 3: Test with touch event
    console.log('\n✅ Test 3: Testing touch events...');
    await hamburgerBtn.click(); // Open menu again
    await page.waitForTimeout(500);

    // Simulate touch on a link
    const aboutLink = await page.$('a[href="#about"].mobile-menu-link');
    await aboutLink.tap();
    await page.waitForTimeout(500);

    const menuHiddenAfterTouch = await page.$eval('#mobile-menu', el => {
      return window.getComputedStyle(el).display === 'none';
    });
    console.log(`   Menu hidden after touch: ${menuHiddenAfterTouch ? '✅' : '❌'}`);

    // Test 4: Test close button
    console.log('\n✅ Test 4: Testing close button...');
    await hamburgerBtn.click(); // Open menu again
    await page.waitForTimeout(500);

    await page.click('#close-menu-btn');
    await page.waitForTimeout(500);

    const menuHiddenAfterClose = await page.$eval('#mobile-menu', el => {
      return window.getComputedStyle(el).display === 'none';
    });
    console.log(`   Menu hidden after close button: ${menuHiddenAfterClose ? '✅' : '❌'}`);

    // Test 5: Test on desktop (should not close)
    console.log('\n✅ Test 5: Testing desktop viewport (should not auto-close)...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    await hamburgerBtn.click(); // Open menu
    await page.waitForTimeout(500);

    await page.click('a[href="#pricing"].mobile-menu-link');
    await page.waitForTimeout(500);

    // On desktop, menu should remain open (based on our implementation)
    const menuOnDesktop = await page.$eval('#mobile-menu', el => {
      return window.getComputedStyle(el).display !== 'none';
    });
    console.log(`   Menu remains open on desktop: ${menuOnDesktop ? '✅' : '❌'}`);

    console.log('\n✨ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();
