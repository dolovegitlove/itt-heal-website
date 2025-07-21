const { chromium } = require('playwright');

async function testBookingWithFix() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    // Add console log listener
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warn') {
        console.log(`Browser ${msg.type()}: ${msg.text()}`);
      }
    });
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🎯 Testing booking flow with API fix...');
    
    // Quick flow through all steps
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(1000);
    
    // Select date from calendar
    await page.click('[role="gridcell"]:not(.disabled)');
    await page.waitForTimeout(500);
    
    // Select time
    await page.evaluate(() => {
      const timeSelect = document.getElementById('booking-time');
      if (timeSelect && timeSelect.options.length > 1) {
        timeSelect.selectedIndex = 1;
        timeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('#next-btn');
    await page.waitForTimeout(500);
    
    // Fill contact info
    await page.fill('#client-name', 'Test User');
    await page.fill('#client-email', 'test@example.com');
    await page.fill('#client-phone', '940-555-1234');
    await page.click('#next-btn');
    await page.waitForTimeout(500);
    
    // Select cash payment
    await page.evaluate(() => {
      const cashRadio = document.getElementById('payment-method-cash');
      if (cashRadio) {
        cashRadio.checked = true;
        cashRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    // Check if at booking summary
    const atSummary = await page.evaluate(() => {
      const summary = document.getElementById('booking-summary');
      return summary && window.getComputedStyle(summary).display !== 'none';
    });
    
    if (atSummary) {
      console.log('✅ At booking summary, confirming booking...');
      
      await page.click('#confirm-booking-btn');
      
      console.log('⏳ Waiting for thank you message (15 seconds)...');
      await page.waitForTimeout(15000);
      
      // Check for thank you content
      const thankYouCheck = await page.evaluate(() => {
        const thankYouContent = document.getElementById('thank-you-content');
        const bookingModal = document.querySelector('#booking');
        const container = bookingModal?.querySelector('.embedded-booking-container');
        
        return {
          thankYouExists: !!thankYouContent,
          thankYouVisible: thankYouContent && window.getComputedStyle(thankYouContent).display !== 'none',
          containerHasThankYou: container?.innerHTML?.includes('Thank You') || false,
          modalHTML: container?.innerHTML?.substring(0, 200) || 'no content'
        };
      });
      
      console.log('\n🎯 FINAL RESULT:');
      console.log('Thank you exists:', thankYouCheck.thankYouExists);
      console.log('Thank you visible:', thankYouCheck.thankYouVisible);
      console.log('Container has thank you:', thankYouCheck.containerHasThankYou);
      
      if (thankYouCheck.thankYouExists || thankYouCheck.containerHasThankYou) {
        console.log('\n✅ SUCCESS: Thank you message is displaying!');
      } else {
        console.log('\n❌ Thank you message not found');
        console.log('Modal preview:', thankYouCheck.modalHTML);
      }
    } else {
      console.log('❌ Did not reach booking summary');
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testBookingWithFix().catch(console.error);