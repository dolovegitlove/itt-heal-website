const { chromium } = require('playwright');

async function testConfirmBooking() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    // Capture ALL console logs
    const allLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      allLogs.push(text);
      if (text.includes('showThankYouInModal') || text.includes('Booking') || text.includes('SUCCESS') || text.includes('FAILED') || text.includes('Thank')) {
        console.log(`[CRITICAL] ${text}`);
      }
    });
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🚨 TESTING: Confirm booking process...\n');
    
    // Complete flow to summary step
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(2000);
    
    // Select available date
    await page.evaluate(() => {
      const today = new Date();
      const closedDates = window.closedDates || [];
      
      for (let i = 1; i <= 30; i++) {
        const testDate = new Date(today);
        testDate.setDate(testDate.getDate() + i);
        const dateStr = testDate.toISOString().split('T')[0];
        const dayOfWeek = testDate.getDay();
        
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !closedDates.includes(dateStr)) {
          const dateInput = document.getElementById('booking-date');
          if (dateInput) {
            dateInput.value = dateStr;
            dateInput.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
      }
    });
    await page.waitForTimeout(1000);
    
    await page.evaluate(() => {
      const timeSelect = document.getElementById('booking-time');
      if (timeSelect && timeSelect.options.length > 1) {
        timeSelect.selectedIndex = 1;
        timeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    await page.fill('#client-name', 'CONFIRM TEST');
    await page.fill('#client-email', 'confirm@test.com');
    await page.fill('#client-phone', '940-555-CONF');
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    // Select cash and go to summary
    await page.evaluate(() => {
      const cashRadio = document.getElementById('payment-method-cash');
      if (cashRadio) {
        cashRadio.checked = true;
        cashRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('#next-btn');
    await page.waitForTimeout(2000);
    
    console.log('📋 At summary step - ready to confirm...');
    
    // Check confirm button state
    const confirmState = await page.evaluate(() => {
      const confirmBtn = document.getElementById('confirm-booking-btn');
      const summary = document.getElementById('booking-summary');
      
      return {
        confirmBtnExists: !!confirmBtn,
        confirmBtnVisible: confirmBtn && window.getComputedStyle(confirmBtn).display !== 'none',
        confirmBtnEnabled: confirmBtn && !confirmBtn.disabled,
        confirmBtnText: confirmBtn?.textContent?.trim() || 'no text',
        summaryVisible: summary && window.getComputedStyle(summary).display !== 'none'
      };
    });
    
    console.log('📊 CONFIRM BUTTON STATE:');
    console.log('Exists:', confirmState.confirmBtnExists);
    console.log('Visible:', confirmState.confirmBtnVisible);
    console.log('Enabled:', confirmState.confirmBtnEnabled);
    console.log('Text:', confirmState.confirmBtnText);
    console.log('Summary visible:', confirmState.summaryVisible);
    
    if (!confirmState.confirmBtnVisible || !confirmState.confirmBtnEnabled) {
      console.log('❌ CRITICAL: Confirm button not ready for clicking!');
      return;
    }
    
    console.log('\n🎯 CLICKING CONFIRM BOOKING...');
    
    // Click the confirm button
    await page.click('#confirm-booking-btn');
    
    console.log('⏳ Waiting for booking process...');
    
    // Wait and monitor what happens
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(1000);
      
      const currentState = await page.evaluate(() => {
        const thankYou = document.getElementById('thank-you-content');
        const status = document.getElementById('booking-status');
        const summary = document.getElementById('booking-summary');
        
        return {
          thankYouExists: !!thankYou,
          thankYouVisible: thankYou && window.getComputedStyle(thankYou).display !== 'none',
          statusText: status?.textContent || 'no status',
          summaryVisible: summary && window.getComputedStyle(summary).display !== 'none',
          iteration: i + 1
        };
      });
      
      console.log(`${currentState.iteration}s: Thank you exists: ${currentState.thankYouExists}, visible: ${currentState.thankYouVisible}, status: "${currentState.statusText}", summary: ${currentState.summaryVisible}`);
      
      if (currentState.thankYouExists && currentState.thankYouVisible) {
        console.log('✅ THANK YOU MESSAGE APPEARED!');
        break;
      }
      
      if (currentState.statusText.includes('SUCCESS') || currentState.statusText.includes('confirmed')) {
        console.log('✅ SUCCESS status detected');
      }
    }
    
    // Final comprehensive check
    const finalState = await page.evaluate(() => {
      const thankYou = document.getElementById('thank-you-content');
      const status = document.getElementById('booking-status');
      const container = document.querySelector('.embedded-booking-container');
      
      return {
        thankYouExists: !!thankYou,
        thankYouVisible: thankYou && window.getComputedStyle(thankYou).display !== 'none',
        thankYouHTML: thankYou?.innerHTML || 'NONE',
        statusText: status?.textContent || 'no status',
        statusHTML: status?.innerHTML || 'no HTML',
        containerContainsThankYou: container?.innerHTML?.includes('Thank You') || false,
        showThankYouFunction: typeof showThankYouInModal === 'function',
        serviceNamesVar: typeof serviceNames !== 'undefined'
      };
    });
    
    console.log('\n🚨 FINAL INVESTIGATION:');
    console.log('=====================================');
    console.log('Thank you exists:', finalState.thankYouExists);
    console.log('Thank you visible:', finalState.thankYouVisible);
    console.log('Status text:', finalState.statusText);
    console.log('Container has thank you:', finalState.containerContainsThankYou);
    console.log('showThankYouInModal function exists:', finalState.showThankYouFunction);
    console.log('serviceNames variable exists:', finalState.serviceNamesVar);
    
    if (!finalState.thankYouExists) {
      console.log('\n❌ CRITICAL ISSUE: Thank you element never created!');
      console.log('Status HTML:', finalState.statusHTML);
    }
    
    // Look for critical log events
    console.log('\n📋 SEARCHING LOGS FOR CRITICAL EVENTS:');
    const criticalEvents = allLogs.filter(log => 
      log.includes('showThankYouInModal') || 
      log.includes('cash payment') ||
      log.includes('Booking created') ||
      log.includes('SUCCESS') ||
      log.includes('FAILED') ||
      log.includes('Error') ||
      log.includes('Thank')
    );
    
    console.log(`Found ${criticalEvents.length} critical events:`);
    criticalEvents.forEach((event, i) => console.log(`${i+1}. ${event}`));
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Confirm booking test error:', error);
  } finally {
    await browser.close();
  }
}

testConfirmBooking().catch(console.error);