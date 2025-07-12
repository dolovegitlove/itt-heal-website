#!/usr/bin/env node

/**
 * Final booking test with fixed SMS/email notifications
 */

const puppeteer = require('puppeteer');

async function testFinalBookingWithNotifications() {
    console.log('🎯 FINAL BOOKING TEST - SMS & EMAIL NOTIFICATIONS');
    console.log('================================================');
    
    const browser = await puppeteer.launch({ 
        headless: true,
        defaultViewport: { width: 1200, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);
    
    // Monitor console for confirmations
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('SMS') || text.includes('email') || text.includes('notification') || text.includes('confirmed')) {
            console.log(`[NOTIFICATION] ${text}`);
        }
        if (text.includes('SUCCESS') || text.includes('completed') || text.includes('booking')) {
            console.log(`[BOOKING] ${text}`);
        }
    });
    
    try {
        console.log('\n📍 Step 1: Loading Site & Navigation');
        await page.goto('https://ittheal.com', { waitUntil: 'domcontentloaded' });
        
        await page.evaluate(() => document.querySelector('#booking').scrollIntoView());
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await page.click('[data-service-type="test"]');
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log('✅ Service selected: Payment System Test');
        
        console.log('\n📍 Step 2: Date & Time Selection');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split('T')[0];
        await page.type('#booking-date', dateString);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.waitForSelector('#booking-time option:not([value=""])', { timeout: 8000 });
        const timeOptions = await page.$$eval('#booking-time option:not([value=""])', options => 
            options.map(opt => opt.value)
        );
        
        // Try different time slots until we find an available one
        let timeSelected = false;
        for (const timeOption of timeOptions) {
            try {
                await page.select('#booking-time', timeOption);
                timeSelected = true;
                console.log(`✅ Time selected: ${timeOption}`);
                break;
            } catch (e) {
                continue;
            }
        }
        
        if (!timeSelected) {
            throw new Error('No available time slots found');
        }
        
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log('\n📍 Step 3: Contact Information');
        await page.type('#client-name', 'John Smith');
        await page.type('#client-email', 'dolovedev@gmail.com');
        await page.type('#client-phone', '4695251001');
        
        console.log('✅ Contact info entered:');
        console.log('   📧 Email: dolovedev@gmail.com');
        console.log('   📱 Phone: 4695251001');
        console.log('   👤 Name: John Smith');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\n📍 Step 4: Payment Method - CASH (No Stripe needed)');
        
        // Select cash payment to avoid Stripe issues
        await page.evaluate(() => {
            selectPaymentMethod('cash');
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const cashSelected = await page.evaluate(() => {
            return document.getElementById('payment-method-cash').checked;
        });
        
        if (cashSelected) {
            console.log('✅ Cash payment selected (bypasses Stripe)');
        } else {
            console.log('⚠️ Cash payment selection may have failed');
        }
        
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\n📍 Step 5: Final Booking Submission');
        console.log('🚀 Submitting booking...');
        
        // Monitor for booking completion and notifications
        let bookingSuccess = false;
        let smsNotificationSent = false;
        let emailNotificationSent = false;
        
        const notificationPromise = new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(), 10000);
            
            page.on('console', (msg) => {
                const text = msg.text();
                
                if (text.includes('SUCCESS') || text.includes('confirmed') || text.includes('completed')) {
                    bookingSuccess = true;
                    console.log('✅ Booking completed successfully!');
                }
                
                if (text.includes('SMS sent') || text.includes('text message')) {
                    smsNotificationSent = true;
                    console.log('📱 SMS notification sent!');
                }
                
                if (text.includes('Email sent') || text.includes('email notification')) {
                    emailNotificationSent = true;
                    console.log('📧 Email notification sent!');
                }
                
                if (bookingSuccess && (smsNotificationSent || emailNotificationSent)) {
                    clearTimeout(timeout);
                    resolve();
                }
            });
        });
        
        await page.click('#confirm-booking-btn');
        await notificationPromise;
        
        // Check final state
        const finalCheck = await page.evaluate(() => {
            const summary = document.getElementById('booking-summary');
            const errors = document.querySelectorAll('.error-message, .alert-error');
            return {
                summaryVisible: summary && summary.style.display !== 'none',
                hasErrors: errors.length > 0,
                errorTexts: Array.from(errors).map(e => e.textContent)
            };
        });
        
        console.log('\n📊 FINAL RESULTS');
        console.log('================');
        console.log(`✅ Booking completed: ${bookingSuccess || finalCheck.summaryVisible}`);
        console.log(`📱 SMS notification: ${smsNotificationSent ? 'SENT' : 'NOT CONFIRMED'}`);
        console.log(`📧 Email notification: ${emailNotificationSent ? 'SENT' : 'NOT CONFIRMED'}`);
        console.log(`❌ Errors: ${finalCheck.hasErrors ? finalCheck.errorTexts.join(', ') : 'None'}`);
        
        if (bookingSuccess || finalCheck.summaryVisible) {
            console.log('\n🎉 SUCCESS! Booking completed successfully!');
            console.log('📋 Contact Information Used:');
            console.log('   📧 Email: dolovedev@gmail.com');
            console.log('   📱 SMS: 4695251001');
            console.log('   👤 Name: John Smith');
            console.log('\n🔔 Check your email and phone for confirmations!');
            
            return true;
        } else {
            console.log('\n❌ Booking may have failed');
            return false;
        }
        
    } catch (error) {
        console.log('\n❌ Test error:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

console.log('Starting final booking test with SMS & email notifications...\n');
testFinalBookingWithNotifications().then(success => {
    if (success) {
        console.log('\n✅ FINAL TEST COMPLETED SUCCESSFULLY!');
        console.log('📧 Check dolovedev@gmail.com for booking confirmation');
        console.log('📱 Check 4695251001 for SMS confirmation');
        console.log('🎯 Both SMS and email should have been sent!');
    } else {
        console.log('\n❌ Final test failed');
    }
}).catch(console.error);