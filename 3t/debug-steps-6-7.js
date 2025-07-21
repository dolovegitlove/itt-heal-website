const { chromium } = require('playwright');

async function debugSteps67() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    args: ['--window-size=1200,900', '--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1200, height: 900 });
    
    console.log('🔍 Debugging steps 6 & 7 visibility...');
    await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
    
    // Check if elements exist on page load
    const elementsExist = await page.evaluate(() => {
      const step6 = document.getElementById('payment-confirmation');
      const step7 = document.getElementById('thank-you-page');
      const continueBtn = document.getElementById('continue-to-thank-you-btn');
      const bookAnotherBtn = document.getElementById('book-another-btn');
      const confirmationSummary = document.getElementById('confirmation-summary');
      
      return {
        step6Exists: !!step6,
        step7Exists: !!step7,
        continueBtnExists: !!continueBtn,
        bookAnotherBtnExists: !!bookAnotherBtn,
        confirmationSummaryExists: !!confirmationSummary,
        step6Display: step6 ? step6.style.display : 'not found',
        step7Display: step7 ? step7.style.display : 'not found',
        step6HTML: step6 ? step6.innerHTML.substring(0, 200) + '...' : 'not found',
        step7HTML: step7 ? step7.innerHTML.substring(0, 200) + '...' : 'not found'
      };
    });
    
    console.log('\n📋 Elements Existence Check:');
    console.log('Step 6 (payment-confirmation) exists:', elementsExist.step6Exists);
    console.log('Step 7 (thank-you-page) exists:', elementsExist.step7Exists);
    console.log('Continue button exists:', elementsExist.continueBtnExists);
    console.log('Book another button exists:', elementsExist.bookAnotherBtnExists);
    console.log('Confirmation summary exists:', elementsExist.confirmationSummaryExists);
    
    console.log('\n👁️ Display Status:');
    console.log('Step 6 display:', elementsExist.step6Display);
    console.log('Step 7 display:', elementsExist.step7Display);
    
    console.log('\n🔍 Content Preview:');
    console.log('Step 6 content:', elementsExist.step6HTML);
    console.log('Step 7 content:', elementsExist.step7HTML);
    
    // Check JavaScript functions exist
    const functionsExist = await page.evaluate(() => {
      return {
        showPaymentConfirmationExists: typeof showPaymentConfirmation === 'function',
        showThankYouPageExists: typeof showThankYouPage === 'function'
      };
    });
    
    console.log('\n⚙️ JavaScript Functions:');
    console.log('showPaymentConfirmation function exists:', functionsExist.showPaymentConfirmationExists);
    console.log('showThankYouPage function exists:', functionsExist.showThankYouPageExists);
    
    // Try to manually trigger step 6
    console.log('\n🧪 Manual Test: Triggering Step 6...');
    const manualTest = await page.evaluate(() => {
      try {
        const testData = {
          serviceName: 'Test Service',
          appointmentDate: '2025-07-21',
          appointmentTime: '2:00 PM',
          clientName: 'Test User',
          locationType: 'clinic',
          totalAmount: '150.00'
        };
        
        if (typeof showPaymentConfirmation === 'function') {
          showPaymentConfirmation(testData);
          
          const step6 = document.getElementById('payment-confirmation');
          const step5 = document.getElementById('booking-summary');
          
          return {
            success: true,
            step6Display: step6 ? step6.style.display : 'not found',
            step5Display: step5 ? step5.style.display : 'not found',
            confirmationContent: document.getElementById('confirmation-summary')?.innerHTML || 'no content'
          };
        } else {
          return { success: false, error: 'showPaymentConfirmation function not found' };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('Manual test result:', manualTest);
    
    if (manualTest.success) {
      console.log('✅ Step 6 can be triggered manually');
      console.log('Step 6 display after trigger:', manualTest.step6Display);
      console.log('Step 5 display after trigger:', manualTest.step5Display);
      
      await page.waitForTimeout(3000);
      
      // Try to trigger step 7
      console.log('\n🧪 Manual Test: Triggering Step 7...');
      const step7Test = await page.evaluate(() => {
        try {
          if (typeof showThankYouPage === 'function') {
            showThankYouPage({});
            
            const step7 = document.getElementById('thank-you-page');
            const step6 = document.getElementById('payment-confirmation');
            
            return {
              success: true,
              step7Display: step7 ? step7.style.display : 'not found',
              step6Display: step6 ? step6.style.display : 'not found'
            };
          } else {
            return { success: false, error: 'showThankYouPage function not found' };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      console.log('Step 7 test result:', step7Test);
      
      if (step7Test.success) {
        console.log('✅ Step 7 can be triggered manually');
        console.log('Step 7 display after trigger:', step7Test.step7Display);
        console.log('Step 6 display after trigger:', step7Test.step6Display);
      }
    }
    
    // Check if the issue is in the payment flow trigger
    console.log('\n🔍 Checking payment flow integration...');
    const paymentFlowCheck = await page.evaluate(() => {
      // Look for the payment success handler
      const scriptTags = Array.from(document.querySelectorAll('script'));
      let foundPaymentFlow = false;
      
      scriptTags.forEach(script => {
        if (script.innerHTML.includes('showPaymentConfirmation(confirmationData)')) {
          foundPaymentFlow = true;
        }
      });
      
      return {
        paymentFlowFound: foundPaymentFlow,
        scriptTagCount: scriptTags.length
      };
    });
    
    console.log('Payment flow integration:', paymentFlowCheck);
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await browser.close();
  }
}

debugSteps67().catch(console.error);