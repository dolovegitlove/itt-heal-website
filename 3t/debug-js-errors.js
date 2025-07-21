const { chromium } = require('playwright');

async function debugJSErrors() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    // Capture ALL console output and errors
    const allLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      allLogs.push(`[${msg.type().toUpperCase()}] ${text}`);
      if (msg.type() === 'error' || text.includes('Error') || text.includes('error')) {
        console.log(`❌ [ERROR] ${text}`);
      }
    });
    
    // Capture uncaught exceptions
    page.on('pageerror', error => {
      console.log(`💥 [PAGE ERROR] ${error.message}`);
      console.log(`Stack: ${error.stack}`);
    });
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🚨 DEBUGGING: JavaScript errors affecting currentStep...\n');
    
    // Check initial state after page load
    await page.waitForTimeout(3000);
    
    const initialState = await page.evaluate(() => {
      return {
        currentStep: window.currentStep,
        currentStepType: typeof window.currentStep,
        selectedService: window.selectedService,
        selectedPrice: window.selectedPrice,
        nextBtnFunction: typeof nextStep,
        transitionFunction: typeof transitionStep,
        errors: window.errorList || []
      };
    });
    
    console.log('📊 INITIAL PAGE STATE:');
    console.log('currentStep:', initialState.currentStep, '(type:', initialState.currentStepType + ')');
    console.log('selectedService:', initialState.selectedService);
    console.log('selectedPrice:', initialState.selectedPrice);
    console.log('nextStep function exists:', initialState.nextBtnFunction !== 'undefined');
    console.log('transitionStep function exists:', initialState.transitionFunction !== 'undefined');
    
    // Test step progression with error monitoring
    console.log('\n📋 Testing step 1 → 2 (service selection)...');
    
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(1000);
    
    const afterServiceState = await page.evaluate(() => {
      return {
        currentStep: window.currentStep,
        selectedService: window.selectedService,
        selectedPrice: window.selectedPrice
      };
    });
    
    console.log('After service selection:', afterServiceState);
    
    // Try clicking next
    console.log('\n📋 Clicking next to go to step 2...');
    
    try {
      await page.click('#next-btn');
      await page.waitForTimeout(2000);
      
      const afterFirstNext = await page.evaluate(() => {
        return {
          currentStep: window.currentStep,
          currentStepType: typeof window.currentStep,
          visibleStep: Array.from(document.querySelectorAll('.step-content')).find(el => 
            window.getComputedStyle(el).display !== 'none'
          )?.id || 'none'
        };
      });
      
      console.log('After first next:', afterFirstNext);
      
      if (afterFirstNext.currentStep === undefined) {
        console.log('❌ CRITICAL: currentStep is still undefined after first next!');
        
        // Check for any JS errors that occurred
        const recentErrors = allLogs.filter(log => 
          log.includes('ERROR') || log.includes('error') || log.includes('Error')
        );
        
        console.log('\n🔍 JAVASCRIPT ERRORS FOUND:');
        recentErrors.forEach((error, i) => console.log(`${i+1}. ${error}`));
        
        // Try to manually fix currentStep
        console.log('\n🔧 ATTEMPTING TO MANUALLY FIX currentStep...');
        
        const manualFix = await page.evaluate(() => {
          try {
            console.log('🔧 Setting currentStep manually...');
            window.currentStep = 2;
            console.log('✅ currentStep set to:', window.currentStep);
            return { success: true, currentStep: window.currentStep };
          } catch (error) {
            console.error('❌ Failed to set currentStep:', error);
            return { success: false, error: error.message };
          }
        });
        
        console.log('Manual fix result:', manualFix);
        
        // If manual fix worked, continue testing
        if (manualFix.success) {
          console.log('\n📋 Continuing with manually fixed currentStep...');
          
          // Complete the flow to see if it works with manual fixes
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
          
          // Force step progression
          await page.evaluate(async () => {
            window.currentStep = 3;
            await transitionStep('datetime-selection', 'contact-info');
          });
          
          await page.fill('#client-name', 'Error Test');
          await page.fill('#client-email', 'error@test.com');
          await page.fill('#client-phone', '940-555-ERROR');
          
          await page.evaluate(async () => {
            window.currentStep = 4;
            await transitionStep('contact-info', 'payment-info');
          });
          
          await page.evaluate(() => {
            const cashRadio = document.getElementById('payment-method-cash');
            if (cashRadio) {
              cashRadio.checked = true;
              cashRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
          
          await page.evaluate(async () => {
            window.currentStep = 5;
            await transitionStep('payment-info', 'booking-summary');
            updateBookingSummary();
          });
          
          await page.waitForTimeout(2000);
          
          const finalState = await page.evaluate(() => {
            const summaryStep = document.getElementById('booking-summary');
            const confirmBtn = document.getElementById('confirm-booking-btn');
            
            return {
              currentStep: window.currentStep,
              summaryVisible: summaryStep && window.getComputedStyle(summaryStep).display !== 'none',
              confirmBtnVisible: confirmBtn && window.getComputedStyle(confirmBtn).display !== 'none'
            };
          });
          
          console.log('Final state with manual fixes:', finalState);
          
          if (finalState.summaryVisible && finalState.confirmBtnVisible) {
            console.log('✅ SUCCESS: Manual fixes allow proper flow to summary!');
            console.log('This confirms the issue is currentStep not being maintained properly.');
          }
        }
      }
      
    } catch (error) {
      console.log('❌ Error clicking next button:', error.message);
    }
    
    // Print all collected logs
    console.log('\n📋 ALL CONSOLE OUTPUT:');
    console.log('======================');
    allLogs.forEach((log, i) => console.log(`${i+1}. ${log}`));
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ JS errors debug test error:', error);
  } finally {
    await browser.close();
  }
}

debugJSErrors().catch(console.error);