const { chromium } = require('playwright');

async function debugStepValidation() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🔍 Debugging step validation...');
    
    // Step 1: Select service
    console.log('📋 Step 1: Service selection...');
    await page.click('[data-service="90min"]');
    await page.waitForTimeout(2000);
    
    // Check what step we're on
    let currentStep = await page.evaluate(() => {
      const steps = ['service-selection', 'datetime-selection', 'contact-info', 'payment-info', 'booking-summary'];
      for (let step of steps) {
        const el = document.getElementById(step);
        if (el && window.getComputedStyle(el).display !== 'none') {
          return step;
        }
      }
      return 'unknown';
    });
    console.log('After step 1, current step:', currentStep);
    
    if (currentStep === 'datetime-selection') {
      // Step 2: Date/time
      console.log('📅 Step 2: Testing date/time validation...');
      
      await page.evaluate(() => {
        const dateInput = document.getElementById('booking-date');
        const timeSelect = document.getElementById('booking-time');
        
        if (dateInput) {
          dateInput.value = '2025-07-25';
          dateInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        if (timeSelect && timeSelect.options.length > 1) {
          timeSelect.selectedIndex = 1;
          timeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      
      await page.waitForTimeout(1000);
      
      // Check validation before clicking next
      const step2Validation = await page.evaluate(() => {
        const date = document.getElementById('booking-date')?.value?.trim();
        const time = document.getElementById('booking-time')?.value?.trim();
        const timeSelect = document.getElementById('booking-time');
        const isTimeSelected = time && time.trim() !== '' && timeSelect?.selectedIndex > 0;
        
        return {
          date: date,
          time: time,
          selectedIndex: timeSelect?.selectedIndex,
          isTimeSelected: isTimeSelected,
          wouldPass: !!(date && time && date.trim() !== '' && isTimeSelected)
        };
      });
      
      console.log('Step 2 validation:', step2Validation);
      
      if (step2Validation.wouldPass) {
        console.log('✅ Step 2 should pass, clicking next...');
        await page.click('#next-btn');
        await page.waitForTimeout(2000);
        
        currentStep = await page.evaluate(() => {
          const steps = ['service-selection', 'datetime-selection', 'contact-info', 'payment-info', 'booking-summary'];
          for (let step of steps) {
            const el = document.getElementById(step);
            if (el && window.getComputedStyle(el).display !== 'none') {
              return step;
            }
          }
          return 'unknown';
        });
        console.log('After step 2, current step:', currentStep);
        
        if (currentStep === 'contact-info') {
          // Step 3: Contact info
          console.log('👤 Step 3: Testing contact validation...');
          
          await page.fill('#client-name', 'Test User Jr');
          await page.fill('#client-email', 'test@example.com');
          await page.fill('#client-phone', '555-123-4567');
          
          await page.waitForTimeout(500);
          
          // Check validation
          const step3Validation = await page.evaluate(() => {
            const name = document.getElementById('client-name')?.value?.trim();
            const email = document.getElementById('client-email')?.value?.trim();
            const phone = document.getElementById('client-phone')?.value?.trim();
            
            const emailValid = email && email.includes('@') && email.includes('.');
            const phoneValid = phone && phone.length >= 10;
            const nameValid = name && name.length >= 6 && name.includes(' ');
            
            return {
              name: name,
              email: email,
              phone: phone,
              nameValid: nameValid,
              emailValid: emailValid,
              phoneValid: phoneValid,
              wouldPass: nameValid && emailValid && phoneValid
            };
          });
          
          console.log('Step 3 validation:', step3Validation);
          
          if (step3Validation.wouldPass) {
            console.log('✅ Step 3 should pass, clicking next...');
            await page.click('#next-btn');
            await page.waitForTimeout(2000);
            
            currentStep = await page.evaluate(() => {
              const steps = ['service-selection', 'datetime-selection', 'contact-info', 'payment-info', 'booking-summary'];
              for (let step of steps) {
                const el = document.getElementById(step);
                if (el && window.getComputedStyle(el).display !== 'none') {
                  return step;
                }
              }
              return 'unknown';
            });
            console.log('After step 3, current step:', currentStep);
            
            if (currentStep === 'payment-info') {
              console.log('💳 Step 4: Testing payment selection...');
              
              // Select cash payment
              await page.evaluate(() => {
                const cashRadio = document.getElementById('payment-method-cash');
                if (cashRadio) {
                  cashRadio.checked = true;
                  cashRadio.dispatchEvent(new Event('change', { bubbles: true }));
                }
              });
              
              await page.waitForTimeout(1000);
              
              const step4Validation = await page.evaluate(() => {
                const paymentMethod = document.querySelector('input[name="payment-method"]:checked');
                return {
                  paymentMethod: paymentMethod ? paymentMethod.value : 'none',
                  wouldPass: !!paymentMethod
                };
              });
              
              console.log('Step 4 validation:', step4Validation);
              
              if (step4Validation.wouldPass) {
                console.log('✅ Step 4 should pass, clicking next...');
                await page.click('#next-btn');
                await page.waitForTimeout(2000);
                
                currentStep = await page.evaluate(() => {
                  const steps = ['service-selection', 'datetime-selection', 'contact-info', 'payment-info', 'booking-summary'];
                  for (let step of steps) {
                    const el = document.getElementById(step);
                    if (el && window.getComputedStyle(el).display !== 'none') {
                      return step;
                    }
                  }
                  return 'unknown';
                });
                console.log('After step 4, current step:', currentStep);
                
                if (currentStep === 'booking-summary') {
                  console.log('🎯 SUCCESS: Reached booking summary!');
                  
                  console.log('Testing confirm booking button...');
                  await page.waitForTimeout(1000);
                  await page.click('#confirm-booking-btn');
                  
                  console.log('⏳ Waiting for thank you message...');
                  await page.waitForTimeout(8000);
                  
                  const finalCheck = await page.evaluate(() => {
                    const thankYouContent = document.getElementById('thank-you-content');
                    return {
                      thankYouExists: !!thankYouContent,
                      modalHTML: document.querySelector('#booking')?.innerHTML?.substring(0, 500) || 'no modal'
                    };
                  });
                  
                  console.log('Final check:', finalCheck.thankYouExists ? 'Thank you displayed!' : 'No thank you message');
                } else {
                  console.log('❌ Failed to reach booking summary');
                }
              } else {
                console.log('❌ Step 4 validation failed');
              }
            } else {
              console.log('❌ Failed to reach payment step');
            }
          } else {
            console.log('❌ Step 3 validation failed');
          }
        } else {
          console.log('❌ Failed to reach contact info step');
        }
      } else {
        console.log('❌ Step 2 validation failed');
      }
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await browser.close();
  }
}

debugStepValidation().catch(console.error);