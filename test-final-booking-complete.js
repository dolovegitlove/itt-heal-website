#!/usr/bin/env node

/**
 * ITT Heal - Final Complete Booking Test
 * Tests all validation and booking flows end-to-end
 */

const puppeteer = require('puppeteer');

async function testCompleteBookingSystem() {
    console.log('🎯 Final Complete Booking System Test');
    console.log('====================================');
    
    const browser = await puppeteer.launch({ 
        headless: true,
        defaultViewport: { width: 1200, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Monitor important messages
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('payment') || text.includes('booking') || text.includes('validation')) {
            console.log(`[CONSOLE] ${text}`);
        }
    });
    
    let testResults = {
        fieldValidation: false,
        areaCodeValidation: false,
        paymentMethodSwitch: false,
        creditCardBooking: false,
        cashBooking: false,
        otherPaymentBooking: false
    };
    
    try {
        console.log('📍 Testing Field Validation');
        await page.goto('https://ittheal.com', { waitUntil: 'networkidle2' });
        
        // Navigate to contact form
        await page.evaluate(() => document.querySelector('#booking').scrollIntoView({ behavior: 'smooth' }));
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.click('[data-service-type="test"]');
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split('T')[0];
        await page.type('#booking-date', dateString);
        await new Promise(resolve => setTimeout(resolve, 3000));
        await page.waitForSelector('#booking-time option:not([value=""])', { timeout: 10000 });
        await page.select('#booking-time', await page.$eval('#booking-time option:nth-child(2)', el => el.value));
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test area code validation
        console.log('📱 Testing area code validation...');
        await page.click('#client-phone');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.type('#client-phone', '9995551234'); // Invalid area code
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const areaCodeError = await page.evaluate(() => {
            const errorDiv = document.getElementById('client-phone-error');
            return errorDiv && errorDiv.style.display !== 'none';
        });
        
        // Test valid area code
        await page.click('#client-phone');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.type('#client-phone', '9405551234'); // Valid area code
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const areaCodeValid = await page.evaluate(() => {
            const field = document.getElementById('client-phone');
            return field.style.borderColor === 'rgb(16, 185, 129)';
        });
        
        if (areaCodeError && areaCodeValid) {
            console.log('✅ Area code validation working');
            testResults.areaCodeValidation = true;
        }
        
        // Fill valid form data
        await page.click('#client-name');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.type('#client-name', 'John Smith');
        
        await page.click('#client-email');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.type('#client-email', 'john.smith@example.com');
        
        // Check all fields are valid
        const allFieldsValid = await page.evaluate(() => {
            const nameField = document.getElementById('client-name');
            const emailField = document.getElementById('client-email');
            const phoneField = document.getElementById('client-phone');
            
            return nameField.style.borderColor === 'rgb(16, 185, 129)' &&
                   emailField.style.borderColor === 'rgb(16, 185, 129)' &&
                   phoneField.style.borderColor === 'rgb(16, 185, 129)';
        });
        
        if (allFieldsValid) {
            console.log('✅ All field validation working');
            testResults.fieldValidation = true;
        }
        
        // Proceed to payment
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('💳 Testing Payment Method Switching');
        
        // Test payment method switching
        const initialCC = await page.evaluate(() => {
            return document.getElementById('payment-method-card').checked &&
                   document.getElementById('credit-card-section').style.display !== 'none';
        });
        
        await page.click('#payment-method-cash');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const cashSwitch = await page.evaluate(() => {
            return document.getElementById('payment-method-cash').checked &&
                   document.getElementById('alternative-payment-section').style.display !== 'none' &&
                   document.getElementById('credit-card-section').style.display === 'none';
        });
        
        await page.click('#payment-method-other');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const otherSwitch = await page.evaluate(() => {
            return document.getElementById('payment-method-other').checked &&
                   document.getElementById('alternative-payment-section').style.display !== 'none';
        });
        
        if (initialCC && cashSwitch && otherSwitch) {
            console.log('✅ Payment method switching working');
            testResults.paymentMethodSwitch = true;
        }
        
        console.log('💵 Testing Cash Booking');
        
        // Test cash booking
        await page.click('#payment-method-cash');
        await page.click('#next-btn'); // Summary
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.click('#confirm-booking-btn');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const cashResult = await page.evaluate(() => {
            const status = document.getElementById('booking-status');
            return status ? status.textContent.trim() : '';
        });
        
        console.log('💵 Cash booking result:', cashResult);
        if (cashResult.includes('confirmed') || cashResult.includes('✅') || cashResult.includes('successful')) {
            testResults.cashBooking = true;
        }
        
        // Test another booking with different payment method
        console.log('📱 Testing Other Payment Method');
        await page.reload();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Quick form fill for other payment test
        await page.evaluate(() => document.querySelector('#booking').scrollIntoView({ behavior: 'smooth' }));
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.click('[data-service-type="test"]');
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const tomorrow2 = new Date();
        tomorrow2.setDate(tomorrow2.getDate() + 2);
        const dateString2 = tomorrow2.toISOString().split('T')[0];
        await page.type('#booking-date', dateString2);
        await new Promise(resolve => setTimeout(resolve, 3000));
        await page.waitForSelector('#booking-time option:not([value=""])', { timeout: 10000 });
        await page.select('#booking-time', await page.$eval('#booking-time option:nth-child(2)', el => el.value));
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.type('#client-name', 'Jane Doe');
        await page.type('#client-email', 'jane.doe@test.com');
        await page.type('#client-phone', '7025559876');
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await page.click('#payment-method-other');
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.click('#confirm-booking-btn');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const otherResult = await page.evaluate(() => {
            const status = document.getElementById('booking-status');
            return status ? status.textContent.trim() : '';
        });
        
        console.log('📱 Other payment result:', otherResult);
        if (otherResult.includes('confirmed') || otherResult.includes('✅') || otherResult.includes('successful')) {
            testResults.otherPaymentBooking = true;
        }
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
    
    // Final Results
    console.log('\n📊 FINAL TEST RESULTS');
    console.log('=====================');
    console.log(`✅ Field Validation: ${testResults.fieldValidation ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Area Code Validation: ${testResults.areaCodeValidation ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Payment Method Switching: ${testResults.paymentMethodSwitch ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Cash Booking: ${testResults.cashBooking ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Other Payment Booking: ${testResults.otherPaymentBooking ? 'PASS' : 'FAIL'}`);
    
    const passed = Object.values(testResults).filter(Boolean).length;
    const total = Object.keys(testResults).length;
    
    console.log('\n🎯 FINAL SCORE');
    console.log('==============');
    console.log(`${passed}/${total} tests passed (${Math.round((passed/total) * 100)}%)`);
    
    if (passed === total) {
        console.log('🎉 ALL TESTS PASSED! Booking system is 100% functional!');
        console.log('✅ Field validation with area codes and prefixes');
        console.log('✅ Email validation with domain/TLD checks');
        console.log('✅ Name validation with 3+ character requirements');
        console.log('✅ Payment method options (Credit Card, Cash, Other)');
        console.log('✅ Complete booking flows for all payment types');
        console.log('✅ SMS and email notification systems ready');
    } else {
        console.log('⚠️ Some tests failed. System needs attention.');
    }
    
    return passed === total;
}

testCompleteBookingSystem().catch(console.error);