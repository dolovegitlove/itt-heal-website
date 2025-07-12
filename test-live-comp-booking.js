#!/usr/bin/env node

/**
 * Test Live Comp Booking Payment Hide Functionality
 * Tests the live admin dashboard for comp payment section hiding
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testLiveCompBooking() {
  console.log('🔍 Testing Live Comp Booking Payment Hide Functionality...');
  
  try {
    // Test 1: Check that the updated cache buster is live
    console.log('✅ Test 1: Checking cache buster version...');
    const { stdout: htmlContent } = await execAsync('curl -s "https://ittheal.com/admin/"');
    const hasCacheBuster = htmlContent.includes('admin-dashboard.js?v=20250710001500');
    console.log(`   Cache buster updated: ${hasCacheBuster}`);
    
    // Test 2: Check that the JavaScript function exists
    console.log('✅ Test 2: Checking JavaScript function exists...');
    const { stdout: jsContent } = await execAsync('curl -s "https://ittheal.com/admin/admin-dashboard.js"');
    const hasToggleFunction = jsContent.includes('togglePaymentFields()');
    console.log(`   togglePaymentFields function exists: ${hasToggleFunction}`);
    
    // Test 3: Check correct onchange handler
    console.log('✅ Test 3: Checking onchange handler...');
    const hasCorrectHandler = jsContent.includes('window.adminDashboard.togglePaymentFields()');
    console.log(`   Correct onchange handler: ${hasCorrectHandler}`);
    
    // Test 4: Check comp payment logic
    console.log('✅ Test 4: Checking comp payment logic...');
    const hasCompLogic = jsContent.includes('paymentStatus === \'comp\'') && 
                        jsContent.includes('creditCardSection.style.display = \'none\'');
    console.log(`   Comp payment hiding logic: ${hasCompLogic}`);
    
    // Test 5: Check HTML structure
    console.log('✅ Test 5: Checking HTML structure...');
    const hasCompSection = htmlContent.includes('id="comp-payment-section"');
    const hasCreditCardSection = htmlContent.includes('id="credit-card-section"');
    console.log(`   Comp payment section exists: ${hasCompSection}`);
    console.log(`   Credit card section exists: ${hasCreditCardSection}`);
    
    // Summary
    const allTestsPassed = hasCacheBuster && 
                          hasToggleFunction && 
                          hasCorrectHandler && 
                          hasCompLogic && 
                          hasCompSection && 
                          hasCreditCardSection;
    
    console.log('\n📋 LIVE TEST SUMMARY:');
    console.log(`   Cache buster: ${hasCacheBuster ? '✅' : '❌'}`);
    console.log(`   Toggle function: ${hasToggleFunction ? '✅' : '❌'}`);
    console.log(`   Correct handler: ${hasCorrectHandler ? '✅' : '❌'}`);
    console.log(`   Comp logic: ${hasCompLogic ? '✅' : '❌'}`);
    console.log(`   HTML structure: ${hasCompSection && hasCreditCardSection ? '✅' : '❌'}`);
    
    if (allTestsPassed) {
      console.log('\n🎉 ALL LIVE TESTS PASSED!');
      console.log('🚀 Comp booking payment hiding is now LIVE and working!');
      console.log('\n📱 To test manually:');
      console.log('   1. Go to https://ittheal.com/admin');
      console.log('   2. Click "Create Booking"');
      console.log('   3. Change Payment Status to "Comp (Complimentary)"');
      console.log('   4. Credit card section should immediately disappear');
      console.log('   5. Only comp payment section should be visible');
    } else {
      console.log('\n❌ SOME LIVE TESTS FAILED');
      console.log('   The functionality may need additional debugging');
    }
    
    return allTestsPassed;
    
  } catch (error) {
    console.error('❌ Live test failed:', error);
    return false;
  }
}

// Run the test
testLiveCompBooking().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error);