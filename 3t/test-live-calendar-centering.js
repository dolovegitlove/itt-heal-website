const { chromium } = require('playwright');

async function testLiveCalendarCentering() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--window-size=375,812', '--no-sandbox', '--disable-setuid-sandbox'] // Galaxy Z Fold inner screen
  });

  try {
    const page = await browser.newPage();
    
    // Test Galaxy Z Fold dimensions
    await page.setViewportSize({ width: 375, height: 812 });
    
    console.log('🔍 Testing live calendar centering on Galaxy Z Fold dimensions...');
    await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
    
    console.log('📱 Selecting service to access calendar...');
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(2000);
    
    console.log('📅 Waiting for calendar to load...');
    await page.waitForSelector('#custom-calendar-container', { timeout: 10000 });
    
    // Check calendar positioning and centering
    const calendarInfo = await page.evaluate(() => {
      const container = document.getElementById('custom-calendar-container');
      const wrapper = document.querySelector('.calendar-viewport-wrapper');
      
      if (!container || !wrapper) return { error: 'Calendar elements not found' };
      
      const containerRect = container.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      const containerStyle = window.getComputedStyle(container);
      const wrapperStyle = window.getComputedStyle(wrapper);
      
      return {
        viewport: {
          width: viewportWidth,
          height: window.innerHeight
        },
        wrapper: {
          width: Math.round(wrapperRect.width),
          height: Math.round(wrapperRect.height),
          left: Math.round(wrapperRect.left),
          right: Math.round(wrapperRect.right),
          styles: {
            display: wrapperStyle.display,
            justifyContent: wrapperStyle.justifyContent,
            maxWidth: wrapperStyle.maxWidth,
            padding: wrapperStyle.padding
          }
        },
        container: {
          width: Math.round(containerRect.width),
          height: Math.round(containerRect.height),
          left: Math.round(containerRect.left),
          right: Math.round(containerRect.right),
          centerOffset: Math.round((viewportWidth / 2) - (containerRect.left + containerRect.width / 2)),
          styles: {
            maxWidth: containerStyle.maxWidth,
            margin: containerStyle.margin,
            padding: containerStyle.padding,
            boxSizing: containerStyle.boxSizing
          }
        }
      };
    });
    
    console.log('\n📐 Calendar positioning analysis:');
    console.log('Viewport:', calendarInfo.viewport);
    console.log('\nWrapper positioning:');
    console.log('- Width:', calendarInfo.wrapper.width);
    console.log('- Left edge:', calendarInfo.wrapper.left);
    console.log('- Right edge:', calendarInfo.wrapper.right);
    console.log('- Display:', calendarInfo.wrapper.styles.display);
    console.log('- Justify-content:', calendarInfo.wrapper.styles.justifyContent);
    
    console.log('\nContainer positioning:');
    console.log('- Width:', calendarInfo.container.width);
    console.log('- Left edge:', calendarInfo.container.left);
    console.log('- Right edge:', calendarInfo.container.right);
    console.log('- Center offset from viewport center:', calendarInfo.container.centerOffset);
    console.log('- Max-width:', calendarInfo.container.styles.maxWidth);
    console.log('- Margin:', calendarInfo.container.styles.margin);
    
    // Check if calendar is properly centered
    const isCentered = Math.abs(calendarInfo.container.centerOffset) <= 5; // Allow 5px tolerance
    const fitsInViewport = calendarInfo.container.right <= calendarInfo.viewport.width;
    
    console.log('\n📋 Centering analysis:');
    console.log('- Is centered (±5px):', isCentered);
    console.log('- Fits in viewport:', fitsInViewport);
    console.log('- Overflows right edge:', calendarInfo.container.right > calendarInfo.viewport.width);
    
    if (!isCentered) {
      console.log('\n⚠️ CENTERING ISSUE DETECTED');
      console.log('Expected center offset: 0px');
      console.log('Actual center offset:', calendarInfo.container.centerOffset + 'px');
      
      if (calendarInfo.container.centerOffset > 0) {
        console.log('Calendar is shifted LEFT of center');
      } else {
        console.log('Calendar is shifted RIGHT of center');
      }
    }
    
    // Take screenshot for visual inspection
    await page.screenshot({ path: 'live-calendar-centering-test.png', fullPage: false });
    console.log('\n📸 Screenshot saved: live-calendar-centering-test.png');
    
    // Test navigation to July to check positioning during month changes
    console.log('\n🗓️ Testing centering during month navigation...');
    let attempts = 0;
    while (attempts < 12) {
      const monthText = await page.textContent('#current-month-year');
      if (monthText.includes('July 2025')) break;
      await page.click('#next-month');
      await page.waitForTimeout(300);
      attempts++;
    }
    
    // Re-check positioning after navigation
    const julyCalendarInfo = await page.evaluate(() => {
      const container = document.getElementById('custom-calendar-container');
      const rect = container.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      return {
        centerOffset: Math.round((viewportWidth / 2) - (rect.left + rect.width / 2)),
        width: Math.round(rect.width)
      };
    });
    
    console.log('July calendar centering:');
    console.log('- Center offset:', julyCalendarInfo.centerOffset + 'px');
    console.log('- Width:', julyCalendarInfo.width + 'px');
    
    await page.waitForTimeout(3000); // Keep browser open for inspection
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testLiveCalendarCentering().catch(console.error);