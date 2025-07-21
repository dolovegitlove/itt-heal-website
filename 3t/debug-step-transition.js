const { chromium } = require('playwright');

async function debugStepTransition() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    // Listen for step transition logs
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('transitionStep') || text.includes('currentStep') || text.includes('Next Step') || text.includes('Step')) {
        console.log(`[STEP] ${text}`);
      }
    });
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🚨 DEBUGGING: Step transition failure...\n');
    
    // Complete flow step by step and monitor currentStep
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(2000);
    
    let stepCheck = await page.evaluate(() => window.currentStep);
    console.log('After service selection - currentStep:', stepCheck);
    
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
    
    console.log('📅 About to click next from datetime...');
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    stepCheck = await page.evaluate(() => window.currentStep);
    console.log('After datetime - currentStep:', stepCheck);
    
    await page.fill('#client-name', 'STEP TEST');
    await page.fill('#client-email', 'step@test.com');
    await page.fill('#client-phone', '940-555-STEP');
    
    console.log('📋 About to click next from contact...');
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    stepCheck = await page.evaluate(() => window.currentStep);
    console.log('After contact - currentStep:', stepCheck);
    
    await page.evaluate(() => {
      const cashRadio = document.getElementById('payment-method-cash');
      if (cashRadio) {
        cashRadio.checked = true;
        cashRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    
    console.log('💵 About to click next from payment...');
    
    // Monitor the next button click closely
    const beforeClick = await page.evaluate(() => {
      return {
        currentStep: window.currentStep,
        nextBtnExists: !!document.getElementById('next-btn'),
        nextBtnDisabled: document.getElementById('next-btn')?.disabled || false,
        paymentMethod: document.querySelector('input[name="payment-method"]:checked')?.value || 'none'
      };
    });
    
    console.log('Before payment next click:', beforeClick);
    
    await page.click('#next-btn');
    await page.waitForTimeout(2000);
    
    const afterClick = await page.evaluate(() => {
      const summaryStep = document.getElementById('booking-summary');
      const paymentStep = document.getElementById('payment-info');
      const contactStep = document.getElementById('contact-info');
      
      return {
        currentStep: window.currentStep,
        summaryVisible: summaryStep && window.getComputedStyle(summaryStep).display !== 'none',
        paymentVisible: paymentStep && window.getComputedStyle(paymentStep).display !== 'none',
        contactVisible: contactStep && window.getComputedStyle(contactStep).display !== 'none',
        nextBtnVisible: document.getElementById('next-btn') && window.getComputedStyle(document.getElementById('next-btn')).display !== 'none'
      };
    });
    
    console.log('\n📊 AFTER PAYMENT NEXT CLICK:');
    console.log('Current step:', afterClick.currentStep);
    console.log('Summary visible:', afterClick.summaryVisible);
    console.log('Payment visible:', afterClick.paymentVisible);
    console.log('Contact visible:', afterClick.contactVisible);
    console.log('Next button visible:', afterClick.nextBtnVisible);
    
    if (afterClick.currentStep !== 5) {
      console.log('❌ CRITICAL: Failed to advance to step 5 (summary)!');
      console.log('Stuck at step:', afterClick.currentStep);
      
      // Check for validation errors
      const validationCheck = await page.evaluate(() => {
        const errors = Array.from(document.querySelectorAll('.error, .validation-error'));
        return {
          errorCount: errors.length,
          errorMessages: errors.map(e => e.textContent)
        };
      });
      
      console.log('Validation errors:', validationCheck);
      
      // Try to force the transition manually
      console.log('\n🔧 ATTEMPTING MANUAL TRANSITION...');
      
      const manualTransition = await page.evaluate(async () => {
        try {
          console.log('🔧 Forcing step transition manually...');
          
          // Call the transition function directly
          if (typeof transitionStep === 'function') {
            await transitionStep('payment-info', 'booking-summary');
            console.log('✅ Manual transitionStep called');
          }
          
          // Update current step
          window.currentStep = 5;
          
          // Hide next button
          const nextBtn = document.getElementById('next-btn');
          if (nextBtn) {
            nextBtn.style.display = 'none';
          }
          
          // Update booking summary
          if (typeof updateBookingSummary === 'function') {
            updateBookingSummary();
            console.log('✅ updateBookingSummary called');
          }
          
          return { success: true };
        } catch (error) {
          console.error('❌ Manual transition failed:', error);
          return { success: false, error: error.message };
        }
      });
      
      console.log('Manual transition result:', manualTransition);
      
      await page.waitForTimeout(2000);
      
      const afterManual = await page.evaluate(() => {
        const summaryStep = document.getElementById('booking-summary');
        const confirmBtn = document.getElementById('confirm-booking-btn');
        
        return {
          currentStep: window.currentStep,
          summaryVisible: summaryStep && window.getComputedStyle(summaryStep).display !== 'none',
          confirmBtnVisible: confirmBtn && window.getComputedStyle(confirmBtn).display !== 'none'
        };
      });
      
      console.log('After manual transition:', afterManual);
      
      if (afterManual.summaryVisible && afterManual.confirmBtnVisible) {
        console.log('✅ Manual transition successful!');
      }
    }
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Step transition debug error:', error);
  } finally {
    await browser.close();
  }
}

debugStepTransition().catch(console.error);