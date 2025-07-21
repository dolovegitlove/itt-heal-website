const { chromium } = require('playwright');

async function testCenteringFix() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--window-size=375,812', '--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 812 });
    
    console.log('🔍 Testing centering fix on live site...');
    await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
    
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(2000);
    
    await page.waitForSelector('#custom-calendar-container', { timeout: 10000 });
    
    // Clear cache and reload to ensure we get the updated CSS
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(2000);
    await page.waitForSelector('#custom-calendar-container', { timeout: 10000 });
    
    const centeringInfo = await page.evaluate(() => {
      const container = document.getElementById('custom-calendar-container');
      const wrapper = document.querySelector('.calendar-viewport-wrapper');
      
      const containerRect = container.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      const wrapperStyle = window.getComputedStyle(wrapper);
      
      return {
        viewport: viewportWidth,
        wrapper: {
          width: Math.round(wrapperRect.width),
          left: Math.round(wrapperRect.left),
          padding: wrapperStyle.padding,
          paddingLeft: wrapperStyle.paddingLeft,
          paddingRight: wrapperStyle.paddingRight
        },
        container: {
          width: Math.round(containerRect.width),
          left: Math.round(containerRect.left),
          centerOffset: Math.round((viewportWidth / 2) - (containerRect.left + containerRect.width / 2))
        }
      };
    });
    
    console.log('\n📐 Updated centering analysis:');
    console.log('Viewport width:', centeringInfo.viewport);
    console.log('Wrapper padding:', centeringInfo.wrapper.padding);
    console.log('Wrapper width:', centeringInfo.wrapper.width);
    console.log('Wrapper left:', centeringInfo.wrapper.left);
    console.log('Container width:', centeringInfo.container.width);
    console.log('Container left:', centeringInfo.container.left);
    console.log('Center offset:', centeringInfo.container.centerOffset + 'px');
    
    const isCentered = Math.abs(centeringInfo.container.centerOffset) <= 2;
    console.log('\n✅ Result: Calendar is', isCentered ? 'PROPERLY CENTERED' : 'STILL OFF-CENTER');
    
    if (!isCentered) {
      console.log('⚠️ Still needs adjustment. Offset:', centeringInfo.container.centerOffset + 'px');
    }
    
    await page.screenshot({ path: 'centering-fix-test.png', fullPage: false });
    console.log('\n📸 Screenshot saved: centering-fix-test.png');
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testCenteringFix().catch(console.error);