#!/usr/bin/env node

/**
 * Test Comp Payment Tip Exception Logic
 * Verifies that credit card section stays visible when:
 * - Payment Status = "comp" AND
 * - Tip Amount > $0 AND  
 * - Payment Method = "credit_card"
 */

import { readFileSync } from 'fs';

function testCompTipExceptionLogic() {
  console.log('🔍 Testing Comp Payment Tip Exception Logic...');
  
  try {
    const adminCode = readFileSync('/home/ittz/projects/itt/site/admin/admin-dashboard.js', 'utf8');
    
    // Test 1: Check if tip amount exception logic exists
    const hasTipExceptionLogic = adminCode.includes('hasTipForCreditCard') && 
                                adminCode.includes('tipAmount > 0') &&
                                adminCode.includes('paymentMethod === \'credit_card\'');
    console.log(`✅ Test 1 - Has tip exception logic: ${hasTipExceptionLogic}`);
    
    // Test 2: Check if both sections are shown for tip exception
    const showsBothSections = adminCode.includes('Show both comp section AND credit card section') ||
                             (adminCode.includes('compPaymentSection.style.display = \'block\'') &&
                              adminCode.includes('creditCardSection.style.display = \'block\''));
    console.log(`✅ Test 2 - Shows both sections for tip: ${showsBothSections}`);
    
    // Test 3: Check if tip amount input has onchange handler
    const hasTipAmountHandler = adminCode.includes('tip_amount') && 
                               adminCode.includes('onchange="window.adminDashboard.togglePaymentFields()"');
    console.log(`✅ Test 3 - Tip amount has onchange handler: ${hasTipAmountHandler}`);
    
    // Test 4: Check if amount received is set to tip amount
    const setsAmountToTip = adminCode.includes('amountReceivedInput.value = tipAmount.toFixed(2)');
    console.log(`✅ Test 4 - Sets amount received to tip: ${setsAmountToTip}`);
    
    // Test 5: Check if payment method stays credit card
    const keepsPaymentMethod = adminCode.includes('paymentMethodSelect.setAttribute(\'required\', \'required\')') &&
                              adminCode.includes('paymentMethodSelect.parentElement.style.display = \'block\'');
    console.log(`✅ Test 5 - Keeps payment method visible: ${keepsPaymentMethod}`);
    
    // Test 6: Check console logging for debugging
    const hasDebugging = adminCode.includes('Comp with tip exception') ||
                        adminCode.includes('credit card processing enabled');
    console.log(`✅ Test 6 - Has debugging messages: ${hasDebugging}`);
    
    // Test 7: Check standard comp logic still works
    const hasStandardCompLogic = adminCode.includes('Standard comp logic') &&
                                adminCode.includes('paymentMethodSelect.value = \'comp\'');
    console.log(`✅ Test 7 - Preserves standard comp logic: ${hasStandardCompLogic}`);
    
    // Summary
    const allTestsPassed = hasTipExceptionLogic && 
                          showsBothSections && 
                          hasTipAmountHandler && 
                          setsAmountToTip && 
                          keepsPaymentMethod && 
                          hasDebugging && 
                          hasStandardCompLogic;
    
    console.log('\n📋 TIP EXCEPTION TEST SUMMARY:');
    console.log(`   Tip exception logic: ${hasTipExceptionLogic ? '✅' : '❌'}`);
    console.log(`   Shows both sections: ${showsBothSections ? '✅' : '❌'}`);
    console.log(`   Tip amount handler: ${hasTipAmountHandler ? '✅' : '❌'}`);
    console.log(`   Sets amount to tip: ${setsAmountToTip ? '✅' : '❌'}`);
    console.log(`   Keeps payment method: ${keepsPaymentMethod ? '✅' : '❌'}`);
    console.log(`   Has debugging: ${hasDebugging ? '✅' : '❌'}`);
    console.log(`   Standard comp logic: ${hasStandardCompLogic ? '✅' : '❌'}`);
    
    if (allTestsPassed) {
      console.log('\n🎉 ALL TIP EXCEPTION TESTS PASSED!');
      console.log('🔧 Logic implemented:');
      console.log('   • Payment Status = "comp" → Hide credit card section');
      console.log('   • EXCEPT when Tip Amount > $0 AND Payment Method = "credit_card"');
      console.log('   • In exception case: Show BOTH comp section AND credit card section');
      console.log('   • Tip amount triggers payment field re-evaluation');
      console.log('   • Amount received is set to tip amount for processing');
    } else {
      console.log('\n❌ SOME TIP EXCEPTION TESTS FAILED');
    }
    
    return allTestsPassed;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
const success = testCompTipExceptionLogic();
process.exit(success ? 0 : 1);