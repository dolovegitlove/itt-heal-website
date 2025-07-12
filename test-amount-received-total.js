#!/usr/bin/env node

/**
 * Test Amount Received = Total with Tip Logic
 * Verifies that Amount Received is auto-set to Total with Tip value
 * and includes special warning language
 */

import { readFileSync } from 'fs';

function testAmountReceivedTotal() {
  console.log('🔍 Testing Amount Received = Total with Tip Logic...');
  
  try {
    const adminCode = readFileSync('/home/ittz/projects/itt/site/admin/admin-dashboard.js', 'utf8');
    
    // Test 1: Check if Amount Received is set to total_with_tip value
    const setsAmountToTotal = adminCode.includes('totalWithTipInput?.value') && 
                             adminCode.includes('amountReceivedInput.value = totalWithTip.toFixed(2)');
    console.log(`✅ Test 1 - Sets Amount Received to Total with Tip: ${setsAmountToTotal}`);
    
    // Test 2: Check if total_with_tip input is accessed correctly
    const accessesTotalInput = adminCode.includes('document.querySelector(\'[name="total_with_tip"]\')');
    console.log(`✅ Test 2 - Accesses total_with_tip input: ${accessesTotalInput}`);
    
    // Test 3: Check if special warning language exists
    const hasWarningLanguage = adminCode.includes('Amount Received must be manually entered') &&
                               adminCode.includes('Total with Tip will be charged');
    console.log(`✅ Test 3 - Has warning language: ${hasWarningLanguage}`);
    
    // Test 4: Check if warning includes IMPORTANT styling
    const hasImportantStyling = adminCode.includes('<strong>⚠️ IMPORTANT:</strong>');
    console.log(`✅ Test 4 - Has IMPORTANT styling: ${hasImportantStyling}`);
    
    // Test 5: Check if console log reflects the change
    const updatedConsoleLog = adminCode.includes('tip (total:') || 
                             adminCode.includes('totalWithTip.toFixed(2)');
    console.log(`✅ Test 5 - Updated console logging: ${updatedConsoleLog}`);
    
    // Test 6: Check fallback to tip amount if total not available
    const hasFallback = adminCode.includes('|| tipAmount');
    console.log(`✅ Test 6 - Has fallback to tip amount: ${hasFallback}`);
    
    // Test 7: Check cache buster updated
    const cacheUpdated = adminCode.includes('v=20250710002500') || 
                        readFileSync('/home/ittz/projects/itt/site/admin/index.html', 'utf8').includes('v=20250710002500');
    console.log(`✅ Test 7 - Cache buster updated: ${cacheUpdated}`);
    
    // Summary
    const allTestsPassed = setsAmountToTotal && 
                          accessesTotalInput && 
                          hasWarningLanguage && 
                          hasImportantStyling && 
                          updatedConsoleLog && 
                          hasFallback && 
                          cacheUpdated;
    
    console.log('\n📋 AMOUNT RECEIVED TEST SUMMARY:');
    console.log(`   Sets to Total with Tip: ${setsAmountToTotal ? '✅' : '❌'}`);
    console.log(`   Accesses total input: ${accessesTotalInput ? '✅' : '❌'}`);
    console.log(`   Warning language: ${hasWarningLanguage ? '✅' : '❌'}`);
    console.log(`   IMPORTANT styling: ${hasImportantStyling ? '✅' : '❌'}`);
    console.log(`   Updated logging: ${updatedConsoleLog ? '✅' : '❌'}`);
    console.log(`   Fallback logic: ${hasFallback ? '✅' : '❌'}`);
    console.log(`   Cache updated: ${cacheUpdated ? '✅' : '❌'}`);
    
    if (allTestsPassed) {
      console.log('\n🎉 ALL AMOUNT RECEIVED TESTS PASSED!');
      console.log('💡 Enhanced Logic:');
      console.log('   • Amount Received = Total with Tip (service + tip)');
      console.log('   • Special warning: "Must be manually entered or Total with Tip will be charged"');
      console.log('   • Fallback to tip amount if total not calculated yet');
      console.log('   • Clear visual warning with ⚠️ IMPORTANT styling');
    } else {
      console.log('\n❌ SOME AMOUNT RECEIVED TESTS FAILED');
    }
    
    return allTestsPassed;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
const success = testAmountReceivedTotal();
process.exit(success ? 0 : 1);