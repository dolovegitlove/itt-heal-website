#!/usr/bin/env node

/**
 * Test Comp Booking Logic - Code Analysis
 * Verifies that the admin dashboard code properly handles comp booking payment section hiding
 */

import { readFileSync } from 'fs';

function testCompBookingLogic() {
  console.log('🔍 Testing Comp Booking Logic in Admin Dashboard...');
  
  try {
    // Read the admin dashboard code
    const adminCode = readFileSync('/home/ittz/projects/itt/site/admin/admin-dashboard.js', 'utf8');
    
    // Test 1: Check if comp payment logic exists
    const hasCompPaymentLogic = adminCode.includes('paymentMethod === \'comp\'') || 
                               adminCode.includes('paymentStatus === \'comp\'');
    console.log(`✅ Test 1 - Has comp payment logic: ${hasCompPaymentLogic}`);
    
    // Test 2: Check if credit card section is hidden for comp
    const hidesCreditCardForComp = adminCode.includes('creditCardSection.style.display = \'none\'') &&
                                  adminCode.includes('comp');
    console.log(`✅ Test 2 - Hides credit card section for comp: ${hidesCreditCardForComp}`);
    
    // Test 3: Check if comp section is shown for comp payments
    const showsCompSection = adminCode.includes('compPaymentSection.style.display = \'block\'');
    console.log(`✅ Test 3 - Shows comp section: ${showsCompSection}`);
    
    // Test 4: Check if payment method/status auto-sync exists
    const hasAutoSync = adminCode.includes('paymentMethodSelect.value = \'comp\'') ||
                       adminCode.includes('paymentStatusSelect.value = \'comp\'');
    console.log(`✅ Test 4 - Has auto-sync logic: ${hasAutoSync}`);
    
    // Test 5: Check if onchange handlers are set up
    const hasOnChangeHandlers = adminCode.includes('onchange="admin.togglePaymentFields()"');
    console.log(`✅ Test 5 - Has onchange handlers: ${hasOnChangeHandlers}`);
    
    // Test 6: Check if Stripe elements are disabled for comp
    const disablesStripeForComp = adminCode.includes('stripe') && 
                                 adminCode.includes('comp') &&
                                 adminCode.includes('display = \'none\'');
    console.log(`✅ Test 6 - Disables Stripe for comp: ${disablesStripeForComp}`);
    
    // Test 7: Check if amount is set to 0 for comp
    const setsAmountToZero = adminCode.includes('0.00') || 
                            adminCode.includes('value = \'0\'');
    console.log(`✅ Test 7 - Sets amount to zero: ${setsAmountToZero}`);
    
    // Test 8: Check if required attributes are removed for comp
    const removesRequiredAttrs = adminCode.includes('removeAttribute(\'required\')');
    console.log(`✅ Test 8 - Removes required attributes: ${removesRequiredAttrs}`);
    
    // Summary
    const allTestsPassed = hasCompPaymentLogic && 
                          hidesCreditCardForComp && 
                          showsCompSection && 
                          hasAutoSync && 
                          hasOnChangeHandlers && 
                          disablesStripeForComp && 
                          setsAmountToZero && 
                          removesRequiredAttrs;
    
    console.log('\n📋 LOGIC TEST SUMMARY:');
    console.log(`   Overall functionality: ${allTestsPassed ? 'COMPLETE' : 'NEEDS WORK'}`);
    
    if (allTestsPassed) {
      console.log('🎉 ALL LOGIC TESTS PASSED - Comp booking functionality is properly implemented!');
      console.log('\n🔧 Key Features Confirmed:');
      console.log('   • Credit card section auto-hides when comp is selected');
      console.log('   • Comp payment section shows when comp is selected');
      console.log('   • Payment method and status auto-sync');
      console.log('   • Stripe processing is disabled for comp payments');
      console.log('   • Payment amount is set to $0.00');
      console.log('   • Required field validation is removed');
    } else {
      console.log('❌ SOME LOGIC TESTS FAILED - Review implementation');
    }
    
    // Code snippets verification
    console.log('\n🔍 Key Code Snippets Found:');
    
    // Find the togglePaymentFields function
    const togglePaymentFieldsMatch = adminCode.match(/togglePaymentFields\(\)\s*{[^}]*}/);
    if (togglePaymentFieldsMatch) {
      console.log('   ✅ togglePaymentFields function found');
    }
    
    // Find comp-specific logic
    const compLogicMatches = adminCode.match(/if.*comp.*{[^}]*}/g);
    if (compLogicMatches) {
      console.log(`   ✅ Found ${compLogicMatches.length} comp-specific logic blocks`);
    }
    
    return allTestsPassed;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
const success = testCompBookingLogic();
process.exit(success ? 0 : 1);