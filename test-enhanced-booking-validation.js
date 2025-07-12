#!/usr/bin/env node

/**
 * ITT Heal - Enhanced Booking Validation & Payment Methods Test
 * Tests field validation and all payment method options
 */

const puppeteer = require('puppeteer');

async function testEnhancedBookingFlow() {
    console.log('🧪 Enhanced Booking Validation & Payment Methods Test');
    console.log('====================================================');
    
    const browser = await puppeteer.launch({ 
        headless: true,
        defaultViewport: { width: 1200, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Monitor validation messages
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('validation') || text.includes('error') || text.includes('payment')) {
            console.log(`[CONSOLE] ${msg.type()}: ${text}`);
        }
    });
    
    let testResults = {
        nameValidation: false,
        emailValidation: false,
        phoneValidation: false,
        paymentMethodSwitch: false,
        cashBooking: false,
        otherPaymentBooking: false,
        creditCardBooking: false
    };
    
    try {
        console.log('📍 Step 1: Navigate to booking page');
        await page.goto('https://ittheal.com', { waitUntil: 'networkidle2' });
        
        console.log('📍 Step 2: Navigate to booking section');
        await page.evaluate(() => {
            document.querySelector('#booking').scrollIntoView({ behavior: 'smooth' });
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('📍 Step 3: Select test service & progress to contact form');
        await page.click('[data-service-type="test"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Set date and time
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split('T')[0];
        await page.type('#booking-date', dateString);
        await new Promise(resolve => setTimeout(resolve, 3000));
        await page.waitForSelector('#booking-time option:not([value=""])', { timeout: 10000 });
        await page.select('#booking-time', await page.$eval('#booking-time option:nth-child(2)', el => el.value));
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\n🧪 Testing Field Validation');
        console.log('============================');
        
        // Test Name Validation
        console.log('📝 Testing name validation...');
        
        // Test short name
        await page.click('#client-name');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.type('#client-name', 'Jo');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const nameError1 = await page.evaluate(() => {
            const errorDiv = document.getElementById('client-name-error');
            return errorDiv ? errorDiv.style.display !== 'none' : false;
        });
        
        // Test single word name
        await page.click('#client-name');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.type('#client-name', 'John');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const nameError2 = await page.evaluate(() => {
            const errorDiv = document.getElementById('client-name-error');
            return errorDiv ? errorDiv.style.display !== 'none' : false;
        });
        
        // Test valid name
        await page.click('#client-name');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.type('#client-name', 'John Smith');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const nameValid = await page.evaluate(() => {
            const field = document.getElementById('client-name');
            return field.style.borderColor === 'rgb(16, 185, 129)'; // Green border
        });
        
        if (nameError1 && nameError2 && nameValid) {
            console.log('✅ Name validation working correctly');
            testResults.nameValidation = true;
        } else {
            console.log('❌ Name validation failed');
        }
        
        // Test Email Validation
        console.log('📧 Testing email validation...');
        
        // Test invalid email
        await page.click('#client-email');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.type('#client-email', 'invalid@');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const emailError1 = await page.evaluate(() => {
            const errorDiv = document.getElementById('client-email-error');
            return errorDiv ? errorDiv.style.display !== 'none' : false;
        });
        
        // Test email without TLD
        await page.click('#client-email');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.type('#client-email', 'test@domain');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const emailError2 = await page.evaluate(() => {
            const errorDiv = document.getElementById('client-email-error');
            return errorDiv ? errorDiv.style.display !== 'none' : false;
        });
        
        // Test valid email
        await page.click('#client-email');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.type('#client-email', 'john.smith@example.com');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const emailValid = await page.evaluate(() => {
            const field = document.getElementById('client-email');
            return field.style.borderColor === 'rgb(16, 185, 129)';
        });
        
        if (emailError1 && emailError2 && emailValid) {
            console.log('✅ Email validation working correctly');
            testResults.emailValidation = true;
        } else {
            console.log('❌ Email validation failed');
        }
        
        // Test Phone Validation
        console.log('📱 Testing phone validation...');
        
        // Test recursive digits
        await page.click('#client-phone');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.type('#client-phone', '9999999999');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const phoneError1 = await page.evaluate(() => {
            const errorDiv = document.getElementById('client-phone-error');
            return errorDiv ? errorDiv.style.display !== 'none' : false;
        });
        
        // Test short number
        await page.click('#client-phone');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.type('#client-phone', '123456');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const phoneError2 = await page.evaluate(() => {
            const errorDiv = document.getElementById('client-phone-error');
            return errorDiv ? errorDiv.style.display !== 'none' : false;
        });
        
        // Test valid phone
        await page.click('#client-phone');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.type('#client-phone', '9405551234');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const phoneValid = await page.evaluate(() => {
            const field = document.getElementById('client-phone');
            return field.style.borderColor === 'rgb(16, 185, 129)';
        });
        
        if (phoneError1 && phoneError2 && phoneValid) {
            console.log('✅ Phone validation working correctly');
            testResults.phoneValidation = true;
        } else {
            console.log('❌ Phone validation failed');
        }
        
        console.log('\n💳 Testing Payment Methods');
        console.log('==========================');
        
        // Proceed to payment step
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test payment method switching
        console.log('🔄 Testing payment method switching...');
        
        // Check credit card is selected by default
        const ccSelected = await page.evaluate(() => {
            return document.getElementById('payment-method-card').checked;
        });
        
        const ccSectionVisible = await page.evaluate(() => {
            const section = document.getElementById('credit-card-section');
            return section && section.style.display !== 'none';
        });
        
        // Switch to cash
        await page.click('#payment-method-cash');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const cashSelected = await page.evaluate(() => {
            return document.getElementById('payment-method-cash').checked;
        });
        
        const altSectionVisible = await page.evaluate(() => {
            const section = document.getElementById('alternative-payment-section');
            return section && section.style.display !== 'none';
        });
        
        // Switch to other
        await page.click('#payment-method-other');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const otherSelected = await page.evaluate(() => {
            return document.getElementById('payment-method-other').checked;
        });
        
        if (ccSelected && ccSectionVisible && cashSelected && altSectionVisible && otherSelected) {
            console.log('✅ Payment method switching working correctly');
            testResults.paymentMethodSwitch = true;
        } else {
            console.log('❌ Payment method switching failed');
        }
        
        // Test Cash Payment Booking
        console.log('💵 Testing cash payment booking...');
        await page.click('#payment-method-cash');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await page.click('#next-btn'); // Go to summary
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to submit cash booking
        const confirmButton = await page.$('#confirm-booking-btn');
        if (confirmButton) {
            await page.click('#confirm-booking-btn');
            
            // Wait for booking response
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const cashBookingStatus = await page.evaluate(() => {
                const status = document.getElementById('booking-status');
                return status ? status.textContent.trim() : '';
            });
            
            console.log('💵 Cash booking result:', cashBookingStatus);
            if (cashBookingStatus.includes('confirmed') || cashBookingStatus.includes('✅')) {
                testResults.cashBooking = true;
            }
        }
        
        // Test Other Payment Method
        console.log('📱 Testing other payment method booking...');
        // Reset form for new test
        await page.reload();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Quick navigation to payment step
        await page.evaluate(() => {
            document.querySelector('#booking').scrollIntoView({ behavior: 'smooth' });
        });
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
        
        // Fill form again
        await page.type('#client-name', 'Jane Doe');
        await page.type('#client-email', 'jane.doe@test.com');
        await page.type('#client-phone', '9405559876');
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Select other payment
        await page.click('#payment-method-other');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await page.click('#next-btn'); // Go to summary
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const confirmButton2 = await page.$('#confirm-booking-btn');
        if (confirmButton2) {
            await page.click('#confirm-booking-btn');
            
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const otherBookingStatus = await page.evaluate(() => {
                const status = document.getElementById('booking-status');
                return status ? status.textContent.trim() : '';
            });
            
            console.log('📱 Other payment booking result:', otherBookingStatus);
            if (otherBookingStatus.includes('confirmed') || otherBookingStatus.includes('✅')) {
                testResults.otherPaymentBooking = true;
            }
        }
        
    } catch (error) {
        console.log('❌ Test failed with error:', error.message);
    } finally {
        await browser.close();
    }
    
    // Results Summary
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('=======================');
    console.log(`✅ Name Validation: ${testResults.nameValidation ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Email Validation: ${testResults.emailValidation ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Phone Validation: ${testResults.phoneValidation ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Payment Method Switch: ${testResults.paymentMethodSwitch ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Cash Payment Booking: ${testResults.cashBooking ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Other Payment Booking: ${testResults.otherPaymentBooking ? 'PASS' : 'FAIL'}`);
    
    const totalPassed = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    
    console.log('\n🎯 OVERALL RESULTS');
    console.log('==================');
    console.log(`Tests Passed: ${totalPassed}/${totalTests}`);
    console.log(`Success Rate: ${Math.round((totalPassed/totalTests) * 100)}%`);
    
    if (totalPassed === totalTests) {
        console.log('🎉 ALL TESTS PASSED! Booking system fully functional with validation and payment options.');
    } else {
        console.log('⚠️ Some tests failed. Review the issues above.');
    }
    
    return totalPassed === totalTests;
}

testEnhancedBookingFlow().catch(console.error);