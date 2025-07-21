const { chromium } = require('playwright');

async function testAPIUrlFix() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300,
    args: ['--window-size=1200,900']
  });

  try {
    const page = await browser.newPage();
    
    await page.goto('https://ittheal.com/3t/');
    
    console.log('🎯 Testing API URL fix for credit card payments...\n');
    
    // Test the API URL directly in the browser context
    const apiTest = await page.evaluate(async () => {
      console.log('📋 Testing credit card payment API URL...');
      
      try {
        // Test the fixed URL directly
        const testResponse = await fetch('https://ittheal.com/api/web-booking/confirm-payment/test123', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_method: "card",
            payment_intent_id: "pi_test_12345"
          })
        });
        
        console.log('📋 API Response status:', testResponse.status);
        console.log('📋 API Response headers:', Object.fromEntries(testResponse.headers.entries()));
        
        if (testResponse.status === 404) {
          const text = await testResponse.text();
          console.log('📋 404 Response:', text);
          return { 
            success: false, 
            status: testResponse.status,
            message: 'Endpoint returns 404 - session ID test123 not found (expected for test)',
            response: text
          };
        } else if (testResponse.status === 400) {
          const result = await testResponse.json();
          console.log('📋 400 Response:', result);
          return { 
            success: true, 
            status: testResponse.status,
            message: 'Endpoint exists and validates request (400 expected for invalid session)',
            response: result
          };
        } else {
          const result = await testResponse.json();
          console.log('📋 Response:', result);
          return { 
            success: true, 
            status: testResponse.status,
            message: 'Endpoint responding',
            response: result
          };
        }
      } catch (error) {
        console.error('📋 API test error:', error);
        return { 
          success: false, 
          message: 'API call failed',
          error: error.message
        };
      }
    });
    
    console.log('📊 API URL TEST RESULTS:');
    console.log('Status:', apiTest.status);
    console.log('Message:', apiTest.message);
    console.log('Response:', JSON.stringify(apiTest.response, null, 2));
    
    if (apiTest.status === 400 || apiTest.status === 200) {
      console.log('\n✅ SUCCESS: API endpoint is reachable (URL fix worked!)');
      console.log('The confirm-payment endpoint is now accessible from /3t/ subdirectory');
      
      // Now test if showThankYouInModal function exists and works
      const thankYouTest = await page.evaluate(() => {
        if (typeof showThankYouInModal === 'function') {
          console.log('📋 Testing showThankYouInModal function...');
          
          // Mock successful confirmation data
          const mockConfirmationData = {
            service: "60min Massage", 
            clientName: "Test User",
            clientEmail: "test@example.com",
            clientPhone: "940-555-1234",
            bookingId: "test123",
            bookingResult: {
              success: true,
              data: {
                session: {
                  id: "test123",
                  service_type: "60min_massage",
                  scheduled_date: new Date().toISOString()
                }
              }
            }
          };
          
          try {
            showThankYouInModal(mockConfirmationData);
            console.log('✅ showThankYouInModal called successfully');
            return { success: true, message: 'Function exists and executed' };
          } catch (error) {
            console.error('❌ showThankYouInModal error:', error);
            return { success: false, message: 'Function exists but failed', error: error.message };
          }
        } else {
          return { success: false, message: 'showThankYouInModal function not found' };
        }
      });
      
      console.log('\n📊 THANK YOU FUNCTION TEST:');
      console.log('Success:', thankYouTest.success);
      console.log('Message:', thankYouTest.message);
      
      // Check if thank you message appeared
      await page.waitForTimeout(2000);
      
      const finalState = await page.evaluate(() => {
        const thankYouContent = document.getElementById('thank-you-content');
        const status = document.getElementById('booking-status');
        
        return {
          thankYouExists: !!thankYouContent,
          thankYouVisible: thankYouContent && window.getComputedStyle(thankYouContent).display !== 'none',
          statusText: status?.textContent || 'no status'
        };
      });
      
      console.log('\n📊 FINAL STATE:');
      console.log('Thank you exists:', finalState.thankYouExists);
      console.log('Thank you visible:', finalState.thankYouVisible);
      
      if (finalState.thankYouExists && finalState.thankYouVisible) {
        console.log('\n✅ COMPLETE SUCCESS: Credit card payment thank you message fixed!');
        console.log('• API URL fix resolved the 404 error');
        console.log('• showThankYouInModal function works correctly');
        console.log('• Thank you message displays properly');
      }
      
    } else {
      console.log('\n❌ API endpoint still not reachable');
    }
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testAPIUrlFix().catch(console.error);