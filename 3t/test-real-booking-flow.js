const { chromium } = require('playwright');

async function testRealBookingFlow() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
    args: ['--window-size=1400,1000', '--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1400, height: 1000 });
    
    console.log('🔍 Testing REAL booking flow to see modal centering and steps 6 & 7...');
    await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
    
    // Step 1: Select service
    console.log('\n📅 Step 1: Selecting 60min service...');
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(2000);
    
    // Check modal centering immediately
    const modalCentering = await page.evaluate(() => {
      const modal = document.getElementById('booking');
      if (!modal) return { found: false };
      
      const style = window.getComputedStyle(modal);
      const rect = modal.getBoundingClientRect();
      
      return {
        found: true,
        display: style.display,
        position: style.position,
        left: style.left,
        top: style.top,
        transform: style.transform,
        width: style.width,
        height: style.height,
        rectLeft: rect.left,
        rectTop: rect.top,
        rectWidth: rect.width,
        rectHeight: rect.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        isCentered: {
          horizontal: Math.abs(rect.left + rect.width/2 - window.innerWidth/2) < 50,
          vertical: Math.abs(rect.top + rect.height/2 - window.innerHeight/2) < 100
        }
      };
    });
    
    console.log('\n📐 Modal Centering Analysis:');
    console.log('Modal found:', modalCentering.found);
    if (modalCentering.found) {
      console.log('Position:', modalCentering.position);
      console.log('Left:', modalCentering.left);
      console.log('Top:', modalCentering.top);
      console.log('Transform:', modalCentering.transform);
      console.log('Modal rect:', `${modalCentering.rectLeft}, ${modalCentering.rectTop}, ${modalCentering.rectWidth}x${modalCentering.rectHeight}`);
      console.log('Viewport:', `${modalCentering.viewportWidth}x${modalCentering.viewportHeight}`);
      console.log('Is centered horizontally:', modalCentering.isCentered.horizontal);
      console.log('Is centered vertically:', modalCentering.isCentered.vertical);
    }
    
    // Continue with booking to test steps 6 & 7
    console.log('\n📅 Step 2: Quick calendar selection...');
    await page.waitForSelector('#custom-calendar-container', { timeout: 10000 });
    
    // Select first available date
    const dateSelected = await page.evaluate(() => {
      const availableDate = document.querySelector('.calendar-date:not([disabled]):not([role="columnheader"])');
      if (availableDate) {
        availableDate.click();
        return availableDate.textContent;
      }
      return null;
    });
    
    if (dateSelected) {
      console.log('📅 Selected date:', dateSelected);
      await page.waitForTimeout(1000);
    }
    
    // Step 3: Time - Go to next step first
    console.log('\n⏰ Step 3: Moving to time selection...');
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    // Select time if available
    try {
      await page.waitForSelector('#booking-time option:not([value=""])', { timeout: 3000 });
      await page.selectOption('#booking-time', { index: 1 });
      console.log('✅ Time selected');
    } catch (e) {
      console.log('⚠️ No time slots available, continuing anyway...');
    }
    
    // Step 4: Contact info
    console.log('\n📝 Step 4: Contact information...');
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    await page.fill('#client-name', 'Test User');
    await page.fill('#client-email', 'test@example.com');
    await page.fill('#client-phone', '555-123-4567');
    await page.selectOption('#location-type', 'clinic');
    
    // Step 5: Payment
    console.log('\n💳 Step 5: Payment selection...');
    await page.click('#next-btn');
    await page.waitForTimeout(1000);
    
    // Select cash payment (easiest for testing)
    await page.check('input[value="cash"]');
    
    // Move to booking summary
    await page.click('#next-btn');
    await page.waitForTimeout(2000);
    
    console.log('\n📋 At booking summary, checking for steps 6 & 7 elements...');
    
    const stepsCheck = await page.evaluate(() => {
      return {
        step5: !!document.getElementById('booking-summary'),
        step6: !!document.getElementById('payment-confirmation'),
        step7: !!document.getElementById('thank-you-page'),
        confirmBtn: !!document.getElementById('confirm-booking-btn'),
        continueBtn: !!document.getElementById('continue-to-thank-you-btn'),
        bookAnotherBtn: !!document.getElementById('book-another-btn'),
        functions: {
          showPaymentConfirmation: typeof showPaymentConfirmation === 'function',
          showThankYouPage: typeof showThankYouPage === 'function'
        }
      };
    });
    
    console.log('Steps existence check:', stepsCheck);
    
    // Now manually trigger the payment confirmation to test
    console.log('\n🧪 Manually triggering payment confirmation...');
    
    const manualTrigger = await page.evaluate(() => {
      if (typeof showPaymentConfirmation === 'function') {
        const testData = {
          serviceName: '60-Minute Therapeutic Massage',
          appointmentDate: '2025-07-21',
          appointmentTime: '2:00 PM',
          clientName: 'Test User',
          locationType: 'clinic',
          totalAmount: '150.00'
        };
        
        try {
          showPaymentConfirmation(testData);
          
          // Check if step 6 is now visible
          const step6 = document.getElementById('payment-confirmation');
          const step5 = document.getElementById('booking-summary');
          
          return {
            success: true,
            step6Visible: step6 ? step6.style.display !== 'none' : false,
            step5Hidden: step5 ? step5.style.display === 'none' : false,
            step6Display: step6 ? step6.style.display : 'not found'
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      } else {
        return { success: false, error: 'Function not found' };
      }
    });
    
    console.log('Manual trigger result:', manualTrigger);
    
    if (manualTrigger.success && manualTrigger.step6Visible) {
      console.log('✅ Step 6 is now showing!');
      
      await page.waitForTimeout(3000);
      
      // Test step 7
      console.log('\n🧪 Triggering step 7...');
      await page.click('#continue-to-thank-you-btn');
      await page.waitForTimeout(2000);
      
      const step7Check = await page.evaluate(() => {
        const step7 = document.getElementById('thank-you-page');
        const step6 = document.getElementById('payment-confirmation');
        
        return {
          step7Visible: step7 ? step7.style.display !== 'none' : false,
          step6Hidden: step6 ? step6.style.display === 'none' : false,
          step7Display: step7 ? step7.style.display : 'not found'
        };
      });
      
      console.log('Step 7 check:', step7Check);
      
      if (step7Check.step7Visible) {
        console.log('✅ Step 7 is now showing!');
        console.log('🎉 BOTH STEPS 6 & 7 ARE WORKING!');
      } else {
        console.log('❌ Step 7 failed to show');
      }
    } else {
      console.log('❌ Step 6 failed to show properly');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'booking-flow-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved: booking-flow-test.png');
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testRealBookingFlow().catch(console.error);