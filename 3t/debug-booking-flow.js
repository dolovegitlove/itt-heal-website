const { chromium } = require('playwright');

async function debugBookingFlow() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🔍 Checking booking flow...');
    
    // Check if confirm booking button exists and is functional
    const buttonStatus = await page.evaluate(() => {
      const btn = document.getElementById('confirm-booking-btn');
      return {
        exists: !!btn,
        visible: btn && window.getComputedStyle(btn).display !== 'none',
        disabled: btn ? btn.disabled : false,
        text: btn ? btn.textContent : 'not found'
      };
    });
    
    console.log('Confirm booking button:', buttonStatus);
    
    // Check if required functions exist
    const functions = await page.evaluate(() => {
      return {
        submitBooking: typeof submitBooking,
        showThankYouInModal: typeof showThankYouInModal
      };
    });
    
    console.log('Functions available:', functions);
    
    // Try to manually click the confirm button
    if (buttonStatus.exists && buttonStatus.visible) {
      console.log('🧪 Testing button click...');
      
      // First check what step we're on
      const currentStep = await page.evaluate(() => {
        const steps = ['service-selection', 'datetime-selection', 'contact-info', 'payment-info', 'booking-summary'];
        for (let step of steps) {
          const el = document.getElementById(step);
          if (el && window.getComputedStyle(el).display !== 'none') {
            return step;
          }
        }
        return 'unknown';
      });
      
      console.log('Current visible step:', currentStep);
      
      if (currentStep === 'booking-summary') {
        console.log('✅ On booking summary step, testing confirm button...');
        
        await page.click('#confirm-booking-btn');
        
        // Wait and check what happens
        await page.waitForTimeout(3000);
        
        const afterClick = await page.evaluate(() => {
          const btn = document.getElementById('confirm-booking-btn');
          const status = document.getElementById('booking-status');
          const thankYouContent = document.getElementById('thank-you-content');
          
          return {
            buttonText: btn ? btn.textContent : 'not found',
            buttonDisabled: btn ? btn.disabled : false,
            statusText: status ? status.textContent : 'not found',
            thankYouExists: !!thankYouContent,
            thankYouVisible: thankYouContent && window.getComputedStyle(thankYouContent).display !== 'none'
          };
        });
        
        console.log('After button click:', afterClick);
      } else {
        console.log('❌ Not on booking summary step, cannot test confirm button');
      }
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await browser.close();
  }
}

debugBookingFlow().catch(console.error);