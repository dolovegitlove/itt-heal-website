const { chromium } = require('playwright');

async function debugCSSLayout() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🚨 DEBUGGING: CSS Layout Issues...\n');
    
    // Complete flow to summary step
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(2000);
    
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
    
    await page.fill('#client-name', 'CSS TEST');
    await page.fill('#client-email', 'css@test.com');
    await page.fill('#client-phone', '940-555-CSS');
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    await page.evaluate(() => {
      const cashRadio = document.getElementById('payment-method-cash');
      if (cashRadio) {
        cashRadio.checked = true;
        cashRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.click('#next-btn');
    await page.waitForTimeout(2000);
    
    console.log('📋 Checking CSS layout at summary step...');
    
    // Get comprehensive layout information
    const layoutInfo = await page.evaluate(() => {
      const steps = [
        'service-selection',
        'datetime-selection', 
        'contact-info',
        'payment-info',
        'booking-summary'
      ];
      
      const confirmBtn = document.getElementById('confirm-booking-btn');
      const container = document.querySelector('.embedded-booking-container');
      
      const stepInfo = {};
      steps.forEach(stepId => {
        const element = document.getElementById(stepId);
        if (element) {
          const style = window.getComputedStyle(element);
          stepInfo[stepId] = {
            display: style.display,
            opacity: style.opacity,
            visibility: style.visibility,
            zIndex: style.zIndex,
            position: style.position,
            transform: style.transform,
            height: style.height,
            overflow: style.overflow
          };
        } else {
          stepInfo[stepId] = { error: 'Element not found' };
        }
      });
      
      const confirmBtnInfo = confirmBtn ? {
        display: window.getComputedStyle(confirmBtn).display,
        visibility: window.getComputedStyle(confirmBtn).visibility,
        opacity: window.getComputedStyle(confirmBtn).opacity,
        position: window.getComputedStyle(confirmBtn).position,
        zIndex: window.getComputedStyle(confirmBtn).zIndex,
        top: confirmBtn.offsetTop,
        left: confirmBtn.offsetLeft,
        width: confirmBtn.offsetWidth,
        height: confirmBtn.offsetHeight,
        parentVisible: confirmBtn.parentElement ? window.getComputedStyle(confirmBtn.parentElement).display !== 'none' : false,
        boundingRect: confirmBtn.getBoundingClientRect()
      } : { error: 'Confirm button not found' };
      
      return {
        steps: stepInfo,
        confirmBtn: confirmBtnInfo,
        containerHeight: container ? container.offsetHeight : 'no container',
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
    });
    
    console.log('📊 LAYOUT ANALYSIS:');
    console.log('===================');
    
    Object.entries(layoutInfo.steps).forEach(([step, info]) => {
      console.log(`${step}:`, info);
    });
    
    console.log('\n📊 CONFIRM BUTTON ANALYSIS:');
    console.log('============================');
    console.log('Confirm button info:', JSON.stringify(layoutInfo.confirmBtn, null, 2));
    
    console.log('\n📊 CONTAINER INFO:');
    console.log('Container height:', layoutInfo.containerHeight);
    console.log('Viewport:', layoutInfo.viewport);
    
    // Check which step is actually visible
    const visibleStep = Object.entries(layoutInfo.steps).find(([step, info]) => 
      info.display !== 'none' && info.opacity !== '0' && info.visibility !== 'hidden'
    );
    
    console.log('\n📊 CURRENT VISIBLE STEP:', visibleStep ? visibleStep[0] : 'NONE');
    
    if (visibleStep && visibleStep[0] !== 'booking-summary') {
      console.log('❌ CRITICAL: Not on summary step! Currently on:', visibleStep[0]);
    }
    
    // Try to force the summary step to be visible
    console.log('\n🔧 ATTEMPTING TO FORCE SUMMARY STEP VISIBLE...');
    
    const forceResult = await page.evaluate(() => {
      const summaryStep = document.getElementById('booking-summary');
      const confirmBtn = document.getElementById('confirm-booking-btn');
      
      if (summaryStep) {
        // Force summary step to be visible
        summaryStep.style.display = 'block';
        summaryStep.style.opacity = '1';
        summaryStep.style.visibility = 'visible';
        summaryStep.style.position = 'relative';
        summaryStep.style.zIndex = '1000';
        
        // Hide other steps
        ['service-selection', 'datetime-selection', 'contact-info', 'payment-info'].forEach(stepId => {
          const step = document.getElementById(stepId);
          if (step) {
            step.style.display = 'none';
          }
        });
        
        if (confirmBtn) {
          confirmBtn.style.display = 'block';
          confirmBtn.style.visibility = 'visible';
          confirmBtn.style.opacity = '1';
          confirmBtn.style.position = 'relative';
          confirmBtn.style.zIndex = '1001';
        }
        
        return { 
          summaryForced: true,
          confirmBtnVisible: confirmBtn ? window.getComputedStyle(confirmBtn).display !== 'none' : false
        };
      }
      
      return { summaryForced: false };
    });
    
    console.log('Force result:', forceResult);
    
    // Now try clicking the confirm button
    if (forceResult.summaryForced && forceResult.confirmBtnVisible) {
      console.log('\n🎯 ATTEMPTING TO CLICK FORCED CONFIRM BUTTON...');
      
      try {
        await page.click('#confirm-booking-btn', { timeout: 5000 });
        console.log('✅ Confirm button clicked successfully after forcing!');
        
        // Wait and check for thank you message
        await page.waitForTimeout(10000);
        
        const afterClickState = await page.evaluate(() => {
          const thankYou = document.getElementById('thank-you-content');
          const status = document.getElementById('booking-status');
          
          return {
            thankYouExists: !!thankYou,
            thankYouVisible: thankYou && window.getComputedStyle(thankYou).display !== 'none',
            statusText: status?.textContent || 'no status'
          };
        });
        
        console.log('After click state:', afterClickState);
        
        if (afterClickState.thankYouExists && afterClickState.thankYouVisible) {
          console.log('✅ SUCCESS: Thank you message appeared after forcing!');
        } else {
          console.log('❌ Thank you message still not appearing');
        }
        
      } catch (error) {
        console.log('❌ Still failed to click confirm button:', error.message);
      }
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ CSS layout debug error:', error);
  } finally {
    await browser.close();
  }
}

debugCSSLayout().catch(console.error);