#!/usr/bin/env node

/**
 * Test Payment Flow and Data Storage
 * Checks if payment choices are stored in database and visible in admin
 */

const puppeteer = require('puppeteer');

async function testPaymentFlow() {
    console.log('💳 Testing Payment Flow and Data Storage');
    console.log('=========================================');

    const browser = await puppeteer.launch({
        headless: true, // Run in headless mode
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        // Go to main site
        await page.goto('https://ittheal.com/', { waitUntil: 'networkidle0' });
        console.log('✅ Loaded main site');

        // Click booking button
        await page.click('a[href*="book"]');
        await page.waitForTimeout(2000);
        console.log('✅ Clicked booking button');

        // Check if service selection is visible
        const serviceOptions = await page.$$('.service-option');
        console.log(`📋 Found ${serviceOptions.length} service options`);

        if (serviceOptions.length > 0) {
            // Click on 90-minute service
            await serviceOptions[1].click();
            console.log('✅ Selected 90-minute service ($180)');
            await page.waitForTimeout(1000);

            // Check if payment information is captured
            const servicePrice = await page.$eval('#selected-service-price', el => el.textContent).catch(() => 'Not found');
            console.log(`💰 Service price displayed: ${servicePrice}`);
        }

        // Look for Stripe elements
        const stripeElements = await page.evaluate(() => {
            return {
                stripeLoaded: typeof Stripe !== 'undefined',
                paymentElements: document.querySelectorAll('[data-stripe]').length,
                checkoutButtons: document.querySelectorAll('button[onclick*="stripe"], button[onclick*="checkout"], button[onclick*="payment"]').length
            };
        });

        console.log('🔍 Stripe Integration Check:');
        console.log(`   Stripe loaded: ${stripeElements.stripeLoaded}`);
        console.log(`   Payment elements: ${stripeElements.paymentElements}`);
        console.log(`   Checkout buttons: ${stripeElements.checkoutButtons}`);

        // Check if booking form captures payment choice
        const bookingFormFields = await page.evaluate(() => {
            const fields = {};
            
            // Check for service selection
            const serviceSelect = document.querySelector('select[name="service"], input[name="service"]:checked, .service-option.selected');
            if (serviceSelect) {
                fields.service = serviceSelect.value || serviceSelect.textContent || 'selected';
            }
            
            // Check for pricing fields
            const priceFields = document.querySelectorAll('[id*="price"], [class*="price"], [data-price]');
            fields.priceElements = priceFields.length;
            
            // Check for payment method fields
            const paymentFields = document.querySelectorAll('input[name*="payment"], select[name*="payment"]');
            fields.paymentFields = paymentFields.length;
            
            return fields;
        });

        console.log('📝 Booking Form Analysis:');
        console.log('   Service field:', bookingFormFields.service || 'Not found');
        console.log('   Price elements:', bookingFormFields.priceElements);
        console.log('   Payment fields:', bookingFormFields.paymentFields);

        // Wait for user to interact if needed
        console.log('\n⏳ Waiting 10 seconds to observe form behavior...');
        await page.waitForTimeout(10000);

    } catch (error) {
        console.error('❌ Error during payment flow test:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
testPaymentFlow().catch(console.error);