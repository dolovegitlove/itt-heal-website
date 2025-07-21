const { chromium } = require('playwright');

async function testLiveSite() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    // Capture ALL console logs from the live site
    page.on('console', msg => {
      const text = msg.text();
      console.log(`[LIVE] ${text}`);
    });
    
    // Capture network errors
    page.on('requestfailed', request => {
      console.log(`[NETWORK ERROR] ${request.url()} - ${request.failure().errorText}`);
    });
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🎯 Testing LIVE site booking flow...\n');
    
    // Complete booking flow with cash payment
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(1000);
    
    await page.click('[role="gridcell"]:not(.disabled)');
    await page.waitForTimeout(500);
    
    await page.evaluate(() => {
      const timeSelect = document.getElementById('booking-time');
      if (timeSelect && timeSelect.options.length > 1) {
        timeSelect.selectedIndex = 1;
        timeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('#next-btn');
    await page.waitForTimeout(500);
    
    await page.fill('#client-name', 'Live Test User');
    await page.fill('#client-email', 'livetest@example.com');
    await page.fill('#client-phone', '940-555-9999');
    await page.click('#next-btn');
    await page.waitForTimeout(500);
    
    // Select cash payment
    console.log('💵 Selecting cash payment...');
    await page.evaluate(() => {
      const cashRadio = document.getElementById('payment-method-cash');
      if (cashRadio) {
        cashRadio.checked = true;
        cashRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    console.log('✅ At booking summary');
    console.log('🎯 Clicking confirm booking on LIVE site...');
    
    await page.click('#confirm-booking-btn');
    
    // Wait for response and check results
    await page.waitForTimeout(15000);
    
    const finalState = await page.evaluate(() => {
      const thankYouContent = document.getElementById('thank-you-content');
      const status = document.getElementById('booking-status');
      const container = document.querySelector('.embedded-booking-container');
      
      return {
        thankYouExists: !!thankYouContent,
        thankYouVisible: thankYouContent && window.getComputedStyle(thankYouContent).display !== 'none',
        statusText: status?.textContent || 'no status',
        statusHTML: status?.innerHTML || 'no HTML',
        containerHTML: container?.innerHTML?.substring(0, 500) || 'no container',
        url: window.location.href
      };
    });
    
    console.log('\n📊 LIVE SITE RESULTS:');
    console.log('Current URL:', finalState.url);
    console.log('Thank you exists:', finalState.thankYouExists);
    console.log('Thank you visible:', finalState.thankYouVisible);
    console.log('Status text:', finalState.statusText);
    console.log('Status HTML preview:', finalState.statusHTML.substring(0, 200));
    
    if (!finalState.thankYouExists || !finalState.thankYouVisible) {
      console.log('\n❌ LIVE SITE ISSUE: Thank you message not showing');
      console.log('Container preview:', finalState.containerHTML.substring(0, 300));
    } else {
      console.log('\n✅ LIVE SITE SUCCESS: Thank you message is showing');
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Live test error:', error);
  } finally {
    await browser.close();
  }
}

testLiveSite().catch(console.error);