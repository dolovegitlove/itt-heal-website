const { chromium } = require('playwright');

async function testStep6Button() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    args: ['--window-size=1400,1000', '--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1400, height: 1000 });
    
    console.log('🔍 Testing Step 6 TEST button...');
    await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
    
    // Click service to open modal
    console.log('\n📅 Opening modal...');
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(3000);
    
    // Skip to step 5 (booking summary) as quickly as possible
    console.log('\n⚡ Fast-forwarding to step 5...');
    
    // Try to click next buttons multiple times to get to step 5
    for (let i = 0; i < 5; i++) {
      try {
        await page.click('#next-btn', { timeout: 2000 });
        await page.waitForTimeout(500);
      } catch (e) {
        console.log(`Step ${i + 2}: Next button not available or clicked successfully`);
      }
    }
    
    // Look for the test button
    console.log('\n🔍 Looking for TEST Step 6 button...');
    const testButtonExists = await page.evaluate(() => {
      const button = document.getElementById('test-step6-btn');
      const summary = document.getElementById('booking-summary');
      return {
        buttonExists: !!button,
        buttonVisible: button ? button.offsetParent !== null : false,
        summaryVisible: summary ? summary.style.display !== 'none' : false,
        summaryDisplay: summary ? summary.style.display : 'not found',
        buttonHTML: button ? button.outerHTML : 'not found'
      };
    });
    
    console.log('Test button check:', testButtonExists);
    
    if (testButtonExists.buttonExists) {
      console.log('\n🎯 Clicking TEST Step 6 button...');
      
      try {
        await page.click('#test-step6-btn');
        await page.waitForTimeout(2000);
        
        const step6Result = await page.evaluate(() => {
          const step6 = document.getElementById('payment-confirmation');
          const step5 = document.getElementById('booking-summary');
          const step7 = document.getElementById('thank-you-page');
          const modal = document.getElementById('booking');
          const backdrop = document.getElementById('booking-backdrop');
          
          return {
            step6Exists: !!step6,
            step6Display: step6 ? step6.style.display : 'not found',
            step6Visible: step6 ? step6.offsetParent !== null : false,
            step5Hidden: step5 ? step5.style.display === 'none' : false,
            step7Display: step7 ? step7.style.display : 'not found',
            modalDisplay: modal ? modal.style.display : 'not found',
            backdropDisplay: backdrop ? backdrop.style.display : 'not found',
            modalPosition: modal ? window.getComputedStyle(modal).position : 'not found',
            modalTransform: modal ? window.getComputedStyle(modal).transform : 'not found'
          };
        });
        
        console.log('\n📊 Step 6 Test Results:');
        console.log('Step 6 exists:', step6Result.step6Exists);
        console.log('Step 6 display:', step6Result.step6Display);
        console.log('Step 6 visible:', step6Result.step6Visible);
        console.log('Step 5 hidden:', step6Result.step5Hidden);
        console.log('Modal position:', step6Result.modalPosition);
        console.log('Modal transform:', step6Result.modalTransform);
        console.log('Modal display:', step6Result.modalDisplay);
        console.log('Backdrop display:', step6Result.backdropDisplay);
        
        if (step6Result.step6Visible) {
          console.log('✅ STEP 6 IS WORKING!');
          
          // Test step 7
          console.log('\n🎯 Testing Step 7 transition...');
          await page.click('#continue-to-thank-you-btn');
          await page.waitForTimeout(2000);
          
          const step7Result = await page.evaluate(() => {
            const step7 = document.getElementById('thank-you-page');
            const step6 = document.getElementById('payment-confirmation');
            
            return {
              step7Visible: step7 ? step7.offsetParent !== null : false,
              step7Display: step7 ? step7.style.display : 'not found',
              step6Hidden: step6 ? step6.style.display === 'none' : false
            };
          });
          
          console.log('Step 7 results:', step7Result);
          
          if (step7Result.step7Visible) {
            console.log('✅ STEP 7 IS ALSO WORKING!');
            console.log('🎉 BOTH STEPS 6 & 7 ARE FUNCTIONAL!');
          } else {
            console.log('❌ Step 7 failed to show');
          }
        } else {
          console.log('❌ Step 6 failed to show properly');
        }
        
      } catch (e) {
        console.log('❌ Failed to click test button:', e.message);
      }
    } else {
      console.log('❌ Test button not found');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'step6-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved: step6-test.png');
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testStep6Button().catch(console.error);