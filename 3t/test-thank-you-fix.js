const { chromium } = require('playwright');

async function testThankYouFix() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    // Add console log listener
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('showThankYouInModal') || text.includes('Thank') || text.includes('cash payment')) {
        console.log(`Browser: ${text}`);
      }
    });
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🎯 Testing thank you fix for cash payments...\n');
    
    // Quick booking flow
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
    
    await page.fill('#client-name', 'Test User');
    await page.fill('#client-email', 'test@example.com');
    await page.fill('#client-phone', '940-555-1234');
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
    
    const atSummary = await page.evaluate(() => {
      const summary = document.getElementById('booking-summary');
      return summary && window.getComputedStyle(summary).display !== 'none';
    });
    
    if (atSummary) {
      console.log('✅ At booking summary\n');
      console.log('🎯 Clicking confirm booking...');
      
      await page.click('#confirm-booking-btn');
      
      console.log('⏳ Waiting for thank you message...\n');
      
      // Wait for showThankYouInModal to be called
      await page.waitForTimeout(10000);
      
      // Check result
      const result = await page.evaluate(() => {
        const thankYouContent = document.getElementById('thank-you-content');
        const container = document.querySelector('.embedded-booking-container');
        
        return {
          thankYouExists: !!thankYouContent,
          thankYouVisible: thankYouContent && window.getComputedStyle(thankYouContent).display !== 'none',
          containerHasThankYou: container?.innerHTML?.includes('Thank You') || false,
          thankYouTitle: thankYouContent?.querySelector('h2')?.textContent || 'not found'
        };
      });
      
      console.log('\n📊 RESULTS:');
      console.log('Thank you exists:', result.thankYouExists);
      console.log('Thank you visible:', result.thankYouVisible);
      console.log('Container has thank you:', result.containerHasThankYou);
      console.log('Thank you title:', result.thankYouTitle);
      
      if (result.thankYouExists && result.thankYouVisible) {
        console.log('\n✅ SUCCESS: Thank you message is now displaying properly for cash payments!');
      } else {
        console.log('\n❌ Thank you message still not showing');
      }
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testThankYouFix().catch(console.error);