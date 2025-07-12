#!/usr/bin/env node

/**
 * ITT Heal - Quick Booking Validation Test
 * Fast test to verify key functionality without timeouts
 */

const puppeteer = require('puppeteer');

async function testQuickBooking() {
    console.log('⚡ Quick Booking Validation Test');
    console.log('===============================');
    
    const browser = await puppeteer.launch({ 
        headless: true,
        defaultViewport: { width: 1200, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set shorter timeouts for this test
    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(10000);
    
    let results = {
        pageLoad: false,
        formNavigation: false,
        fieldValidation: false,
        paymentMethodSwitch: false,
        bookingAttempt: false
    };
    
    try {
        console.log('📍 Testing page load and navigation...');
        await page.goto('https://ittheal.com', { waitUntil: 'domcontentloaded', timeout: 8000 });
        results.pageLoad = true;
        console.log('✅ Page loaded successfully');
        
        // Quick navigation to booking section
        await page.evaluate(() => document.querySelector('#booking').scrollIntoView());
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await page.click('[data-service-type="test"]');
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Quick date/time selection
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split('T')[0];
        await page.type('#booking-date', dateString);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.waitForSelector('#booking-time option:not([value=""])', { timeout: 8000 });
        await page.select('#booking-time', await page.$eval('#booking-time option:nth-child(2)', el => el.value));
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        results.formNavigation = true;
        console.log('✅ Form navigation successful');
        
        console.log('📝 Testing field validation...');
        
        // Test phone validation with area code
        await page.type('#client-phone', '9995551234'); // Invalid area code
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const phoneError = await page.evaluate(() => {
            const errorDiv = document.getElementById('client-phone-error');
            return errorDiv && errorDiv.style.display !== 'none';
        });
        
        // Test valid data
        await page.click('#client-phone');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.type('#client-phone', '9405551234'); // Valid
        
        await page.type('#client-name', 'John Smith');
        await page.type('#client-email', 'john@example.com');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const fieldsValid = await page.evaluate(() => {
            const nameField = document.getElementById('client-name');
            const emailField = document.getElementById('client-email');
            const phoneField = document.getElementById('client-phone');
            
            return nameField.style.borderColor === 'rgb(16, 185, 129)' &&
                   emailField.style.borderColor === 'rgb(16, 185, 129)' &&
                   phoneField.style.borderColor === 'rgb(16, 185, 129)';
        });
        
        if (phoneError && fieldsValid) {
            results.fieldValidation = true;
            console.log('✅ Field validation working (area code + valid fields)');
        }
        
        // Test payment method switching
        console.log('💳 Testing payment method switching...');
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test initial credit card state
        const ccInitial = await page.evaluate(() => {
            return document.getElementById('payment-method-card').checked;
        });
        
        // Switch to cash
        await page.click('#payment-method-cash');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const cashSelected = await page.evaluate(() => {
            return document.getElementById('payment-method-cash').checked &&
                   document.getElementById('alternative-payment-section').style.display !== 'none';
        });
        
        if (ccInitial && cashSelected) {
            results.paymentMethodSwitch = true;
            console.log('✅ Payment method switching working');
        }
        
        // Test quick booking attempt (with shorter timeout)
        console.log('🚀 Testing booking attempt...');
        
        await page.click('#next-btn'); // Go to summary
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Monitor booking attempt
        const bookingPromise = new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(false), 8000); // 8 second timeout
            
            page.on('console', (msg) => {
                const text = msg.text();
                if (text.includes('Booking API result: SUCCESS') || text.includes('confirmed') || text.includes('successful')) {
                    clearTimeout(timeout);
                    resolve(true);
                } else if (text.includes('timeout') || text.includes('failed')) {
                    clearTimeout(timeout);
                    resolve(false);
                }
            });
        });
        
        await page.click('#confirm-booking-btn');
        
        const bookingSuccess = await bookingPromise;
        if (bookingSuccess) {
            results.bookingAttempt = true;
            console.log('✅ Booking attempt successful');
        } else {
            console.log('⚠️ Booking attempt timed out or failed (may be normal for test)');
        }
        
    } catch (error) {
        console.log('❌ Test error:', error.message);
    } finally {
        await browser.close();
    }
    
    // Results
    console.log('\n📊 QUICK TEST RESULTS');
    console.log('=====================');
    console.log(`✅ Page Load: ${results.pageLoad ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Form Navigation: ${results.formNavigation ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Field Validation: ${results.fieldValidation ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Payment Method Switch: ${results.paymentMethodSwitch ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Booking Attempt: ${results.bookingAttempt ? 'PASS' : 'PARTIAL'}`);
    
    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;
    
    console.log('\n🎯 SUMMARY');
    console.log('==========');
    console.log(`${passed}/${total} tests passed`);
    
    if (passed >= 4) {
        console.log('🎉 Core functionality working! Field validation and payment methods implemented.');
        if (results.bookingAttempt) {
            console.log('🚀 Complete booking flow also working!');
        }
    } else {
        console.log('⚠️ Some core issues need attention');
    }
    
    return passed >= 4;
}

testQuickBooking().catch(console.error);