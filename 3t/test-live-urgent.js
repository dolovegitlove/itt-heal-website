const { chromium } = require('playwright');

async function testLiveUrgent() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    // Capture ALL console logs
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      console.log(`[LIVE] ${text}`);
    });
    
    // Capture API responses
    page.on('response', response => {
      const url = response.url();
      if (url.includes('api')) {
        console.log(`[API] ${response.status()} ${url}`);
      }
    });
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🚨 URGENT: Testing live thank you message...\n');
    
    // Complete booking flow EXACTLY as a user would
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(2000);
    
    // Select an available date (not closed)
    const dateSelection = await page.evaluate(() => {
      // Find first available date that's not closed
      const today = new Date();
      const closedDates = window.closedDates || [];
      
      for (let i = 1; i <= 30; i++) {
        const testDate = new Date(today);
        testDate.setDate(testDate.getDate() + i);
        const dateStr = testDate.toISOString().split('T')[0];
        const dayOfWeek = testDate.getDay();
        
        // Skip weekends and closed dates
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !closedDates.includes(dateStr)) {
          const dateInput = document.getElementById('booking-date');
          if (dateInput) {
            dateInput.value = dateStr;
            dateInput.dispatchEvent(new Event('change', { bubbles: true }));
            return { success: true, date: dateStr };
          }
        }
      }
      return { success: false };
    });
    
    console.log('📅 Date selection:', dateSelection);
    await page.waitForTimeout(1000);
    
    // Select time
    await page.evaluate(() => {
      const timeSelect = document.getElementById('booking-time');
      if (timeSelect && timeSelect.options.length > 1) {
        timeSelect.selectedIndex = 1;
        timeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    // Fill contact info
    await page.fill('#client-name', 'URGENT TEST');
    await page.fill('#client-email', 'urgent@test.com');
    await page.fill('#client-phone', '940-555-URGENT');
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    // Select CASH payment
    console.log('💵 Selecting CASH payment for guaranteed test...');
    await page.evaluate(() => {
      const cashRadio = document.getElementById('payment-method-cash');
      if (cashRadio) {
        cashRadio.checked = true;
        cashRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    console.log('🎯 At summary - clicking CONFIRM BOOKING...');
    
    // Click confirm and wait
    await page.click('#confirm-booking-btn');
    
    console.log('⏳ Waiting 15 seconds for all processing...');
    await page.waitForTimeout(15000);
    
    // Check EVERYTHING
    const finalState = await page.evaluate(() => {
      const thankYouContent = document.getElementById('thank-you-content');
      const status = document.getElementById('booking-status');
      const container = document.querySelector('.embedded-booking-container');
      const summaryStep = document.getElementById('booking-summary');
      
      return {
        // Thank you checks
        thankYouExists: !!thankYouContent,
        thankYouVisible: thankYouContent && window.getComputedStyle(thankYouContent).display !== 'none',
        thankYouHTML: thankYouContent?.innerHTML?.substring(0, 500) || 'NONE',
        
        // Status checks
        statusExists: !!status,
        statusText: status?.textContent || 'NO STATUS',
        statusHTML: status?.innerHTML?.substring(0, 500) || 'NO HTML',
        
        // Container checks
        containerHTML: container?.innerHTML?.includes('Thank') || false,
        containerFullHTML: container?.innerHTML?.substring(0, 1000) || 'NO CONTAINER',
        
        // Step visibility
        summaryVisible: summaryStep && window.getComputedStyle(summaryStep).display !== 'none',
        
        // Page state
        url: window.location.href,
        
        // Function checks
        showThankYouExists: typeof showThankYouInModal === 'function',
        serviceNamesExists: typeof serviceNames !== 'undefined'
      };
    });
    
    console.log('\n🚨 URGENT INVESTIGATION RESULTS:');
    console.log('=============================================');
    console.log('Thank you exists:', finalState.thankYouExists);
    console.log('Thank you visible:', finalState.thankYouVisible);
    console.log('Status text:', finalState.statusText);
    console.log('Summary still visible:', finalState.summaryVisible);
    console.log('Container has thank you:', finalState.containerHTML);
    console.log('showThankYouInModal function exists:', finalState.showThankYouExists);
    console.log('serviceNames exists:', finalState.serviceNamesExists);
    console.log('Current URL:', finalState.url);
    
    if (!finalState.thankYouExists) {
      console.log('\n❌ CRITICAL: Thank you element does not exist!');
      console.log('Status HTML:', finalState.statusHTML);
      console.log('Container HTML preview:', finalState.containerFullHTML.substring(0, 300));
    }
    
    if (finalState.thankYouExists && !finalState.thankYouVisible) {
      console.log('\n❌ CRITICAL: Thank you exists but not visible!');
      console.log('Thank you HTML:', finalState.thankYouHTML);
    }
    
    if (finalState.summaryVisible) {
      console.log('\n❌ CRITICAL: Still showing summary step instead of thank you!');
    }
    
    // Search logs for critical events
    console.log('\n📋 CRITICAL LOG SEARCH:');
    const criticalLogs = logs.filter(log => 
      log.includes('showThankYouInModal') || 
      log.includes('Booking created') ||
      log.includes('Thank') ||
      log.includes('cash payment') ||
      log.includes('SUCCESS') ||
      log.includes('FAILED') ||
      log.includes('Error')
    );
    
    console.log('Critical events found:', criticalLogs.length);
    criticalLogs.forEach((log, i) => console.log(`${i+1}. ${log}`));
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ URGENT test error:', error);
  } finally {
    await browser.close();
  }
}

testLiveUrgent().catch(console.error);