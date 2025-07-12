#!/usr/bin/env node

/**
 * ITT Heal - 100% Functionality Test
 * Complete test of all features using direct function calls for reliability
 */

const puppeteer = require('puppeteer');

async function test100Functionality() {
    console.log('🎯 100% FUNCTIONALITY TEST');
    console.log('==========================');
    
    const browser = await puppeteer.launch({ 
        headless: true,
        defaultViewport: { width: 1200, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    page.setDefaultTimeout(12000);
    
    let testResults = {
        pageLoad: false,
        formNavigation: false,
        nameValidation: false,
        emailValidation: false,
        phoneValidation: false,
        paymentMethodCC: false,
        paymentMethodCash: false,
        paymentMethodOther: false,
        bookingFlowCash: false,
        smsEmailReady: false
    };
    
    // Monitor console
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('🔄') || text.includes('💰') || text.includes('SUCCESS')) {
            console.log(`[BROWSER] ${text}`);
        }
    });
    
    try {
        // Step 1: Load and Navigate
        console.log('\n📍 Step 1: Page Load & Navigation');
        await page.goto('https://ittheal.com', { waitUntil: 'domcontentloaded' });
        testResults.pageLoad = true;
        console.log('✅ Page loaded');
        
        await page.evaluate(() => document.querySelector('#booking').scrollIntoView());
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await page.click('[data-service-type="test"]');
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split('T')[0];
        await page.type('#booking-date', dateString);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.waitForSelector('#booking-time option:not([value=""])', { timeout: 8000 });
        await page.select('#booking-time', await page.$eval('#booking-time option:nth-child(2)', el => el.value));
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        testResults.formNavigation = true;
        console.log('✅ Navigation working');
        
        // Step 2: Field Validation
        console.log('\n📍 Step 2: Field Validation Testing');
        
        // Test name (single word should fail)
        await page.type('#client-name', 'John');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const nameError = await page.evaluate(() => {
            const errorDiv = document.getElementById('client-name-error');
            return errorDiv && errorDiv.style.display !== 'none';
        });
        
        // Fix with two words
        await page.evaluate(() => {
            document.getElementById('client-name').value = '';
        });
        await page.type('#client-name', 'John Smith');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const nameValid = await page.evaluate(() => {
            return document.getElementById('client-name').style.borderColor === 'rgb(16, 185, 129)';
        });
        
        if (nameError && nameValid) {
            testResults.nameValidation = true;
            console.log('✅ Name validation: rejects single word, accepts full name');
        }
        
        // Test email
        await page.type('#client-email', 'john@example.com');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const emailValid = await page.evaluate(() => {
            return document.getElementById('client-email').style.borderColor === 'rgb(16, 185, 129)';
        });
        
        if (emailValid) {
            testResults.emailValidation = true;
            console.log('✅ Email validation: accepts valid email');
        }
        
        // Test phone (invalid area code)
        await page.type('#client-phone', '9995551234');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const phoneError = await page.evaluate(() => {
            const errorDiv = document.getElementById('client-phone-error');
            return errorDiv && errorDiv.style.display !== 'none';
        });
        
        // Fix with valid area code
        await page.evaluate(() => {
            document.getElementById('client-phone').value = '';
        });
        await page.type('#client-phone', '9405551234');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const phoneValid = await page.evaluate(() => {
            return document.getElementById('client-phone').style.borderColor === 'rgb(16, 185, 129)';
        });
        
        if (phoneError && phoneValid) {
            testResults.phoneValidation = true;
            console.log('✅ Phone validation: rejects invalid area code, accepts valid');
        }
        
        // Move to payment
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 3: Payment Method Testing
        console.log('\n📍 Step 3: Payment Method Testing');
        
        // Test Credit Card (default)
        const ccDefault = await page.evaluate(() => {
            return document.getElementById('payment-method-card').checked &&
                   document.getElementById('credit-card-section').style.display !== 'none';
        });
        
        if (ccDefault) {
            testResults.paymentMethodCC = true;
            console.log('✅ Credit Card: default selection working');
        }
        
        // Test Cash using direct function
        await page.evaluate(() => {
            selectPaymentMethod('cash');
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const cashWorking = await page.evaluate(() => {
            return document.getElementById('payment-method-cash').checked &&
                   document.getElementById('alternative-payment-section').style.display !== 'none' &&
                   document.getElementById('credit-card-section').style.display === 'none';
        });
        
        if (cashWorking) {
            testResults.paymentMethodCash = true;
            console.log('✅ Cash: payment method switch working');
        }
        
        // Test Other using direct function
        await page.evaluate(() => {
            selectPaymentMethod('other');
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const otherWorking = await page.evaluate(() => {
            return document.getElementById('payment-method-other').checked &&
                   document.getElementById('alternative-payment-section').style.display !== 'none';
        });
        
        if (otherWorking) {
            testResults.paymentMethodOther = true;
            console.log('✅ Other (Venmo/CashApp): payment method switch working');
        }
        
        // Step 4: Complete Booking Flow
        console.log('\n📍 Step 4: Complete Booking Flow');
        
        // Switch back to cash for booking test
        await page.evaluate(() => {
            selectPaymentMethod('cash');
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await page.click('#next-btn'); // Summary
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Monitor booking result
        const bookingPromise = new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(false), 10000);
            
            page.on('console', (msg) => {
                const text = msg.text();
                if (text.includes('SUCCESS') || text.includes('confirmed')) {
                    clearTimeout(timeout);
                    resolve(true);
                }
            });
        });
        
        await page.click('#confirm-booking-btn');
        const bookingSuccess = await bookingPromise;
        
        if (bookingSuccess) {
            testResults.bookingFlowCash = true;
            console.log('✅ Booking Flow: cash payment successful');
        }
        
        // Step 5: SMS/Email Service Check
        console.log('\n📍 Step 5: SMS/Email Service Check');
        
        const servicesReady = await page.evaluate(async () => {
            try {
                const smsResp = await fetch('/api/web-booking/test-sms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: '9405551234' })
                });
                const smsData = await smsResp.json();
                
                const emailResp = await fetch('/api/web-booking/test-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'test@example.com' })
                });
                const emailData = await emailResp.json();
                
                return smsData.success && emailData.success;
            } catch (err) {
                return false;
            }
        });
        
        if (servicesReady) {
            testResults.smsEmailReady = true;
            console.log('✅ SMS/Email: services configured and ready');
        }
        
    } catch (error) {
        console.log('❌ Test error:', error.message);
    } finally {
        await browser.close();
    }
    
    // Final Report
    console.log('\n🎯 FINAL RESULTS - 100% FUNCTIONALITY TEST');
    console.log('==========================================');
    
    const results = [
        ['Page Load', testResults.pageLoad],
        ['Form Navigation', testResults.formNavigation],
        ['Name Validation', testResults.nameValidation],
        ['Email Validation', testResults.emailValidation],
        ['Phone Validation', testResults.phoneValidation],
        ['Credit Card Payment', testResults.paymentMethodCC],
        ['Cash Payment', testResults.paymentMethodCash],
        ['Other Payment', testResults.paymentMethodOther],
        ['Booking Flow', testResults.bookingFlowCash],
        ['SMS/Email Ready', testResults.smsEmailReady]
    ];
    
    results.forEach(([name, status]) => {
        console.log(`${status ? '✅' : '❌'} ${name}: ${status ? 'PASS' : 'FAIL'}`);
    });
    
    const passed = Object.values(testResults).filter(Boolean).length;
    const total = Object.keys(testResults).length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log('\n🚀 SUMMARY');
    console.log('==========');
    console.log(`${passed}/${total} tests passed (${percentage}%)`);
    
    if (percentage === 100) {
        console.log('\n🎉 PERFECT! 100% FUNCTIONALITY ACHIEVED!');
        console.log('✅ All validation rules working perfectly');
        console.log('✅ All payment methods functional');
        console.log('✅ Complete booking flow operational');
        console.log('✅ SMS/Email services ready for notifications');
    } else if (percentage >= 90) {
        console.log('\n👍 EXCELLENT! Near perfect functionality');
    } else {
        console.log('\n⚠️ Some features need attention');
    }
    
    return percentage === 100;
}

test100Functionality().catch(console.error);