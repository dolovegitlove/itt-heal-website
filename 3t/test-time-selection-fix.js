const { chromium } = require('playwright');

async function testTimeSelectionFix() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('validation') || text.includes('time') || text.includes('currentStep')) {
        console.log(`[DEBUG] ${text}`);
      }
    });
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🚨 TESTING: Time selection validation fix...\n');
    
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(2000);
    
    console.log('📅 Testing PROPER date and time selection...');
    
    // Select available date properly
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
            console.log('📅 Date set to:', dateStr);
            break;
          }
        }
      }
    });
    await page.waitForTimeout(2000);
    
    // Check time options loaded
    const timeOptionsCheck = await page.evaluate(() => {
      const timeSelect = document.getElementById('booking-time');
      return {
        exists: !!timeSelect,
        optionsCount: timeSelect?.options?.length || 0,
        options: Array.from(timeSelect?.options || []).map((opt, i) => ({ index: i, value: opt.value, text: opt.text }))
      };
    });
    
    console.log('⏰ Time options:', timeOptionsCheck);
    
    if (timeOptionsCheck.optionsCount > 1) {
      // Select the FIRST REAL TIME (index 1, not 0)
      console.log('⏰ Selecting first available time...');
      
      const timeSelection = await page.evaluate(() => {
        const timeSelect = document.getElementById('booking-time');
        if (timeSelect && timeSelect.options.length > 1) {
          // Select index 1 (first real time option)
          timeSelect.selectedIndex = 1;
          timeSelect.dispatchEvent(new Event('change', { bubbles: true }));
          
          console.log('⏰ Time selected:', {
            selectedIndex: timeSelect.selectedIndex,
            selectedValue: timeSelect.value,
            selectedText: timeSelect.options[timeSelect.selectedIndex].text
          });
          
          return {
            success: true,
            selectedIndex: timeSelect.selectedIndex,
            selectedValue: timeSelect.value,
            selectedText: timeSelect.options[timeSelect.selectedIndex].text
          };
        }
        return { success: false };
      });
      
      console.log('Time selection result:', timeSelection);
      await page.waitForTimeout(1000);
      
      // Check validation before clicking next
      const validationCheck = await page.evaluate(() => {
        const dateInput = document.getElementById('booking-date');
        const timeSelect = document.getElementById('booking-time');
        const date = dateInput?.value;
        const time = timeSelect?.value;
        const isTimeSelected = time && time.trim() !== '' && timeSelect?.selectedIndex > 0;
        
        return {
          date: date,
          time: time,
          dateValid: !!date && date.length > 0,
          timeValid: !!time && time.length > 0,
          timeSelectIndex: timeSelect?.selectedIndex,
          isTimeSelected: isTimeSelected,
          willPassValidation: !(!date || !time || date.trim() === '' || !isTimeSelected)
        };
      });
      
      console.log('📊 VALIDATION CHECK BEFORE NEXT:');
      console.log('Date:', validationCheck.date);
      console.log('Time:', validationCheck.time);
      console.log('Date valid:', validationCheck.dateValid);
      console.log('Time valid:', validationCheck.timeValid);
      console.log('Time selected index:', validationCheck.timeSelectIndex);
      console.log('Is time selected:', validationCheck.isTimeSelected);
      console.log('Will pass validation:', validationCheck.willPassValidation);
      
      if (validationCheck.willPassValidation) {
        console.log('\n✅ Validation should pass - clicking next...');
        
        await page.click('#next-btn');
        await page.waitForTimeout(2000);
        
        const afterNext = await page.evaluate(() => {
          const contactStep = document.getElementById('contact-info');
          return {
            currentStep: window.currentStep,
            onContactStep: contactStep && window.getComputedStyle(contactStep).display !== 'none'
          };
        });
        
        console.log('After next click:', afterNext);
        
        if (afterNext.onContactStep && afterNext.currentStep === 3) {
          console.log('✅ SUCCESS: Date/time validation now working!');
          console.log('✅ Successfully progressed to contact step with currentStep = 3');
          
          // Continue testing the full flow
          console.log('\n📋 Testing complete flow...');
          
          await page.fill('#client-name', 'VALIDATION FIX TEST');
          await page.fill('#client-email', 'validation@test.com');  
          await page.fill('#client-phone', '940-555-VALID');
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
          
          const finalCheck = await page.evaluate(() => {
            const summaryStep = document.getElementById('booking-summary');
            const confirmBtn = document.getElementById('confirm-booking-btn');
            
            return {
              currentStep: window.currentStep,
              summaryVisible: summaryStep && window.getComputedStyle(summaryStep).display !== 'none',
              confirmBtnVisible: confirmBtn && window.getComputedStyle(confirmBtn).display !== 'none'
            };
          });
          
          console.log('Final check:', finalCheck);
          
          if (finalCheck.summaryVisible && finalCheck.confirmBtnVisible && finalCheck.currentStep === 5) {
            console.log('✅ COMPLETE SUCCESS: Full flow now working!');
            console.log('Ready to test thank you message...');
            
            // Test the confirm booking
            await page.click('#confirm-booking-btn');
            await page.waitForTimeout(10000);
            
            const thankYouCheck = await page.evaluate(() => {
              const thankYou = document.getElementById('thank-you-content');
              return {
                thankYouExists: !!thankYou,
                thankYouVisible: thankYou && window.getComputedStyle(thankYou).display !== 'none'
              };
            });
            
            console.log('Thank you check:', thankYouCheck);
            
            if (thankYouCheck.thankYouExists && thankYouCheck.thankYouVisible) {
              console.log('🎉 TOTAL SUCCESS: Thank you message now working end-to-end!');
            }
          }
        } else {
          console.log('❌ Still not progressing properly');
        }
      } else {
        console.log('❌ Validation will still fail - need to debug further');
      }
    }
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Time selection fix test error:', error);
  } finally {
    await browser.close();
  }
}

testTimeSelectionFix().catch(console.error);