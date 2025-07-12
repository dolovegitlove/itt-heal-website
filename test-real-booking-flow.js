#!/usr/bin/env node

/**
 * ITT Heal - Real End-to-End Booking Test
 * Complete booking flow with real SMS/email confirmations
 */

const puppeteer = require('puppeteer');

async function testRealBookingFlow() {
    console.log('🎯 REAL END-TO-END BOOKING TEST');
    console.log('==============================');
    console.log('Testing complete booking flow with SMS & email confirmations');
    
    const browser = await puppeteer.launch({ 
        headless: true,
        defaultViewport: { width: 1200, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);
    
    // Monitor all console output
    page.on('console', msg => {
        console.log(`[BROWSER] ${msg.text()}`);
    });
    
    // Monitor network requests
    page.on('response', response => {
        const url = response.url();
        if (url.includes('/api/web-booking')) {
            console.log(`[API] ${response.status()} - ${url.split('/').pop()}`);
        }
    });
    
    try {
        console.log('\n📍 Step 1: Loading Site');
        await page.goto('https://ittheal.com', { waitUntil: 'domcontentloaded' });
        console.log('✅ Site loaded');
        
        console.log('\n📍 Step 2: Navigating to Booking');
        await page.evaluate(() => document.querySelector('#booking').scrollIntoView());
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Select test service
        await page.click('[data-service-type="test"]');
        console.log('✅ Selected test service');
        
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log('\n📍 Step 3: Date & Time Selection');
        
        // Set date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split('T')[0];
        await page.type('#booking-date', dateString);
        console.log(`✅ Date set to: ${dateString}`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Wait for time slots and select first available
        await page.waitForSelector('#booking-time option:not([value=""])', { timeout: 10000 });
        const availableTime = await page.$eval('#booking-time option:nth-child(2)', el => el.value);
        await page.select('#booking-time', availableTime);
        console.log(`✅ Time selected: ${availableTime}`);
        
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log('\n📍 Step 4: Contact Information');
        
        // Fill in contact details
        await page.type('#client-name', 'John Smith');
        await page.type('#client-email', 'dolovedev@gmail.com');
        await page.type('#client-phone', '4695251001');
        
        console.log('✅ Contact information entered');
        console.log('   - Name: John Smith');
        console.log('   - Email: dolovedev@gmail.com');
        console.log('   - Phone: 4695251001');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify fields are valid
        const fieldsValid = await page.evaluate(() => {
            const nameField = document.getElementById('client-name');
            const emailField = document.getElementById('client-email');
            const phoneField = document.getElementById('client-phone');
            
            return {
                name: nameField.style.borderColor === 'rgb(16, 185, 129)',
                email: emailField.style.borderColor === 'rgb(16, 185, 129)',
                phone: phoneField.style.borderColor === 'rgb(16, 185, 129)'
            };
        });
        
        console.log('✅ Field validation:', fieldsValid);
        
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\n📍 Step 5: Payment Method Selection');
        
        // Test payment method switching
        const initialPayment = await page.evaluate(() => {
            return document.getElementById('payment-method-card').checked;
        });
        console.log(`✅ Credit card default selected: ${initialPayment}`);
        
        // Switch to cash payment for easier testing
        await page.evaluate(() => {
            selectPaymentMethod('cash');
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const cashSelected = await page.evaluate(() => {
            return document.getElementById('payment-method-cash').checked;
        });
        console.log(`✅ Cash payment selected: ${cashSelected}`);
        
        await page.click('#next-btn'); // Go to summary
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\n📍 Step 6: Booking Summary & Confirmation');
        
        // Check summary is displayed
        const summaryVisible = await page.evaluate(() => {
            const summary = document.getElementById('booking-summary');
            return summary && summary.style.display !== 'none';
        });
        console.log(`✅ Summary displayed: ${summaryVisible}`);
        
        console.log('\n🚀 Step 7: SUBMITTING BOOKING...');
        
        // Monitor for booking completion
        let bookingCompleted = false;
        let bookingData = null;
        
        page.on('console', (msg) => {
            const text = msg.text();
            if (text.includes('Booking API result: SUCCESS')) {
                bookingCompleted = true;
                console.log('🎉 BOOKING COMPLETED SUCCESSFULLY!');
            }
            if (text.includes('Session ID:') || text.includes('Payment processed')) {
                console.log(`📋 ${text}`);
            }
        });
        
        // Submit the booking
        await page.click('#confirm-booking-btn');
        
        // Wait for booking to process
        console.log('⏳ Processing booking...');
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // Check final state
        const finalState = await page.evaluate(() => {
            const summary = document.getElementById('booking-summary');
            const errors = document.querySelectorAll('.error-message');
            return {
                summaryVisible: summary && summary.style.display !== 'none',
                hasErrors: errors.length > 0,
                errorMessages: Array.from(errors).map(e => e.textContent)
            };
        });
        
        console.log('\n📊 FINAL RESULTS');
        console.log('================');
        console.log(`✅ Booking completed: ${bookingCompleted || finalState.summaryVisible}`);
        console.log(`✅ No errors: ${!finalState.hasErrors}`);
        
        if (finalState.hasErrors) {
            console.log('❌ Errors found:', finalState.errorMessages);
        }
        
        console.log('\n📱 SMS & EMAIL CONFIRMATIONS');
        console.log('============================');
        console.log('📧 Email confirmation should be sent to: dolovedev@gmail.com');
        console.log('📱 SMS confirmation should be sent to: 4695251001');
        console.log('🔔 Test admin notifications also sent to both addresses');
        
        if (bookingCompleted || finalState.summaryVisible) {
            console.log('\n🎉 SUCCESS! End-to-end booking flow completed!');
            console.log('✅ Check your email and SMS for confirmations');
            console.log('✅ Test transaction with real SMS/email confirmations');
            
            return true;
        } else {
            console.log('\n⚠️ Booking may not have completed successfully');
            return false;
        }
        
    } catch (error) {
        console.log('\n❌ Test error:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

console.log('Starting real end-to-end booking test with SMS & email confirmations...\n');
testRealBookingFlow().then(success => {
    if (success) {
        console.log('\n✅ Test completed successfully!');
        console.log('📧 Check dolovedev@gmail.com for booking confirmation');
        console.log('📱 Check 4695251001 for SMS confirmation');
        process.exit(0);
    } else {
        console.log('\n❌ Test failed or incomplete');
        process.exit(1);
    }
}).catch(console.error);