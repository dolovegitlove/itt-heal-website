const { chromium } = require('playwright');

async function testFullFlowFixed() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('currentStep') || text.includes('nextStep') || text.includes('validation') || text.includes('Thank')) {
        console.log(`[FLOW] ${text}`);
      }
    });
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🎉 TESTING: Complete fixed flow...\n');
    
    // Step 1: Service selection
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(1000);
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    // Step 2: Date/time selection
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
    
    await page.evaluate(() => {
      const timeSelect = document.getElementById('booking-time');
      if (timeSelect && timeSelect.options.length > 1) {
        timeSelect.selectedIndex = 1;
        timeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.waitForTimeout(1000);
    await page.click('#next-btn');
    await page.waitForTimeout(2000);
    
    const afterDatetime = await page.evaluate(() => window.currentStep);
    console.log('After datetime step, currentStep:', afterDatetime);
    
    // Step 3: Contact info
    await page.fill('#client-name', 'FULL FLOW TEST');
    await page.fill('#client-email', 'fullflow@test.com');
    await page.fill('#client-phone', '9405551234');
    
    console.log('📋 About to click next from contact step...');
    await page.click('#next-btn');
    await page.waitForTimeout(2000);
    
    const afterContact = await page.evaluate(() => {
      return {
        currentStep: window.currentStep,
        paymentVisible: document.getElementById('payment-info') && window.getComputedStyle(document.getElementById('payment-info')).display !== 'none',
        contactVisible: document.getElementById('contact-info') && window.getComputedStyle(document.getElementById('contact-info')).display !== 'none'
      };
    });
    console.log('After contact step:', afterContact);
    
    if (afterContact.paymentVisible && afterContact.currentStep === 4) {
      console.log('✅ Successfully reached payment step!');
      
      // Step 4: Payment selection
      await page.evaluate(() => {
        const cashRadio = document.getElementById('payment-method-cash');
        if (cashRadio) {
          cashRadio.checked = true;
          cashRadio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      
      console.log('💵 About to click next from payment step...');
      await page.click('#next-btn');
      await page.waitForTimeout(2000);
      
      const afterPayment = await page.evaluate(() => {
        return {
          currentStep: window.currentStep,
          summaryVisible: document.getElementById('booking-summary') && window.getComputedStyle(document.getElementById('booking-summary')).display !== 'none',
          confirmBtnVisible: document.getElementById('confirm-booking-btn') && window.getComputedStyle(document.getElementById('confirm-booking-btn')).display !== 'none'
        };
      });
      console.log('After payment step:', afterPayment);
      
      if (afterPayment.summaryVisible && afterPayment.confirmBtnVisible && afterPayment.currentStep === 5) {
        console.log('✅ SUCCESS: Reached summary step with confirm button!');
        
        // Final step: Confirm booking
        console.log('🎯 Clicking confirm booking...');
        await page.click('#confirm-booking-btn');
        
        console.log('⏳ Waiting for thank you message...');
        await page.waitForTimeout(15000);
        
        const thankYouResult = await page.evaluate(() => {
          const thankYou = document.getElementById('thank-you-content');
          const status = document.getElementById('booking-status');
          
          return {
            thankYouExists: !!thankYou,
            thankYouVisible: thankYou && window.getComputedStyle(thankYou).display !== 'none',
            statusText: status?.textContent || 'no status',
            thankYouHTML: thankYou?.innerHTML?.substring(0, 200) || 'NONE'
          };
        });
        
        console.log('\n🎉 FINAL RESULT:');
        console.log('=================');
        console.log('Thank you exists:', thankYouResult.thankYouExists);
        console.log('Thank you visible:', thankYouResult.thankYouVisible);
        console.log('Status text:', thankYouResult.statusText);
        console.log('Thank you HTML preview:', thankYouResult.thankYouHTML);
        
        if (thankYouResult.thankYouExists && thankYouResult.thankYouVisible) {
          console.log('\n🎉🎉🎉 COMPLETE SUCCESS! 🎉🎉🎉');
          console.log('Thank you message is now working end-to-end!');
          console.log('The entire booking flow is FIXED!');
        } else {
          console.log('\n❌ Thank you message still not showing after confirm');
        }
      } else {
        console.log('❌ Failed to reach summary step');
      }
    } else {
      console.log('❌ Failed to reach payment step');
    }
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Full flow test error:', error);
  } finally {
    await browser.close();
  }
}

testFullFlowFixed().catch(console.error);