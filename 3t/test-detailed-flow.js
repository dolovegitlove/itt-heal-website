const { chromium } = require('playwright');

async function testDetailedFlow() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    // Capture ALL console logs
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      if (text.includes('Booking') || text.includes('showThankYou') || text.includes('cash') || text.includes('SUCCESS') || text.includes('FAILED')) {
        console.log(`[LOG] ${text}`);
      }
    });
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('Testing detailed booking flow...\n');
    
    // Complete booking flow
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
    
    // Select cash
    await page.evaluate(() => {
      const cashRadio = document.getElementById('payment-method-cash');
      if (cashRadio) {
        cashRadio.checked = true;
        cashRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    console.log('\nClicking confirm booking...');
    await page.click('#confirm-booking-btn');
    
    // Wait longer for all async operations
    await page.waitForTimeout(15000);
    
    console.log('\n=== CHECKING FINAL STATE ===');
    
    // Check what happened
    const finalState = await page.evaluate(() => {
      const thankYouContent = document.getElementById('thank-you-content');
      const bookingStatus = document.getElementById('booking-status');
      const container = document.querySelector('.embedded-booking-container');
      
      return {
        statusText: bookingStatus?.textContent || 'no status',
        statusHTML: bookingStatus?.innerHTML?.substring(0, 200) || 'no HTML',
        thankYouExists: !!thankYouContent,
        containerHTML: container?.innerHTML?.substring(0, 300) || 'no container'
      };
    });
    
    console.log('Status text:', finalState.statusText);
    console.log('Thank you exists:', finalState.thankYouExists);
    console.log('\nStatus HTML preview:', finalState.statusHTML);
    
    // Search logs for key events
    console.log('\n=== KEY LOG EVENTS ===');
    const keyLogs = logs.filter(log => 
      log.includes('showThankYouInModal') || 
      log.includes('Booking created') ||
      log.includes('cash payment') ||
      log.includes('API result')
    );
    keyLogs.forEach(log => console.log(log));
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testDetailedFlow().catch(console.error);