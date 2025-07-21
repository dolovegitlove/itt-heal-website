const { chromium } = require('playwright');

async function testThankYouDisplay() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    // Add console log listener to capture JavaScript logs
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`Browser ${msg.type()}: ${msg.text()}`);
      }
    });
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🎯 Testing thank you message display...');
    
    // Directly test the showThankYouInModal function
    console.log('\n📝 Testing showThankYouInModal function directly...');
    
    const functionTest = await page.evaluate(() => {
      // Check if function exists
      if (typeof showThankYouInModal !== 'function') {
        return { error: 'showThankYouInModal function not found' };
      }
      
      // Test with mock data
      const testData = {
        service: '90 Minute Session',
        datetime: 'Friday, July 25, 2025 at 2:00 PM',
        practitioner: 'Dr. Shiffer',
        confirmationNumber: 'TEST-12345',
        totalAmount: '150.00'
      };
      
      try {
        // Call the function
        showThankYouInModal(testData);
        
        // Check results
        setTimeout(() => {
          const thankYouContent = document.getElementById('thank-you-content');
          const bookingModal = document.getElementById('booking');
          const container = bookingModal?.querySelector('.embedded-booking-container');
          
          console.log('Thank you content exists:', !!thankYouContent);
          console.log('Container HTML includes Thank You:', container?.innerHTML?.includes('Thank You') || false);
        }, 1000);
        
        return { success: true };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('Function test result:', functionTest);
    
    await page.waitForTimeout(2000);
    
    // Check visual result
    const visualCheck = await page.evaluate(() => {
      const thankYouContent = document.getElementById('thank-you-content');
      const bookingModal = document.getElementById('booking');
      const container = bookingModal?.querySelector('.embedded-booking-container');
      
      return {
        thankYouExists: !!thankYouContent,
        thankYouVisible: thankYouContent && window.getComputedStyle(thankYouContent).display !== 'none',
        containerHTML: container?.innerHTML?.substring(0, 200) || 'no container',
        bookingModalVisible: bookingModal && window.getComputedStyle(bookingModal).display !== 'none'
      };
    });
    
    console.log('\nVisual check:', visualCheck);
    
    // Now test the full booking flow
    console.log('\n🔄 Testing full booking flow...');
    
    // Quick flow through all steps
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(500);
    
    // Select date from calendar
    await page.click('[role="gridcell"]:not(.disabled)');
    await page.waitForTimeout(500);
    
    // Select time and proceed
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
    await page.fill('#client-phone', '555-123-4567');
    await page.click('#next-btn');
    await page.waitForTimeout(500);
    
    // Select payment
    await page.evaluate(() => {
      const cashRadio = document.getElementById('payment-method-cash');
      if (cashRadio) {
        cashRadio.checked = true;
        cashRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('#next-btn');
    await page.waitForTimeout(500);
    
    // Check if we're at booking summary
    const atSummary = await page.evaluate(() => {
      const summary = document.getElementById('booking-summary');
      return summary && window.getComputedStyle(summary).display !== 'none';
    });
    
    if (atSummary) {
      console.log('✅ At booking summary, clicking confirm...');
      
      await page.click('#confirm-booking-btn');
      
      console.log('⏳ Waiting for processing (10 seconds)...');
      await page.waitForTimeout(10000);
      
      // Final check
      const finalCheck = await page.evaluate(() => {
        const thankYouContent = document.getElementById('thank-you-content');
        const bookingStatus = document.getElementById('booking-status');
        const container = document.querySelector('.embedded-booking-container');
        
        return {
          thankYouExists: !!thankYouContent,
          statusText: bookingStatus?.textContent || 'none',
          containerHasThankYou: container?.innerHTML?.includes('Thank You') || false
        };
      });
      
      console.log('\n🎯 FINAL RESULT:', finalCheck);
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

testThankYouDisplay().catch(console.error);