#!/usr/bin/env node

/**
 * Test payment method switching by directly calling the function
 */

const puppeteer = require('puppeteer');

async function testPaymentMethodDirect() {
    console.log('💳 Payment Method Direct Test');
    console.log('=============================');
    
    const browser = await puppeteer.launch({ 
        headless: true,
        defaultViewport: { width: 1200, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    page.setDefaultTimeout(8000);
    
    // Monitor console for debug messages
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('🔄') || text.includes('🔍') || text.includes('payment')) {
            console.log(`[CONSOLE] ${text}`);
        }
    });
    
    try {
        await page.goto('https://ittheal.com', { waitUntil: 'domcontentloaded' });
        
        // Quick navigation to payment step
        await page.evaluate(() => document.querySelector('#booking').scrollIntoView());
        await page.click('[data-service-type="test"]');
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split('T')[0];
        await page.type('#booking-date', dateString);
        await new Promise(resolve => setTimeout(resolve, 1500));
        await page.waitForSelector('#booking-time option:not([value=""])', { timeout: 5000 });
        await page.select('#booking-time', await page.$eval('#booking-time option:nth-child(2)', el => el.value));
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fill form quickly
        await page.type('#client-name', 'John Smith');
        await page.type('#client-email', 'john@example.com');
        await page.type('#client-phone', '9405551234');
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('💳 Testing payment method switching directly...');
        
        // Check if selectPaymentMethod function exists
        const functionExists = await page.evaluate(() => {
            return typeof selectPaymentMethod === 'function';
        });
        console.log('selectPaymentMethod function exists:', functionExists);
        
        // Call the function directly
        console.log('📍 Calling selectPaymentMethod("cash") directly...');
        await page.evaluate(() => {
            selectPaymentMethod('cash');
        });
        
        const cashState = await page.evaluate(() => {
            const checked = document.querySelector('input[name="payment-method"]:checked');
            return {
                method: checked ? checked.value : 'none',
                ccSectionVisible: document.getElementById('credit-card-section').style.display !== 'none',
                altSectionVisible: document.getElementById('alternative-payment-section').style.display !== 'none'
            };
        });
        console.log('After calling selectPaymentMethod("cash"):', cashState);
        
        // Call other payment method
        console.log('📍 Calling selectPaymentMethod("other") directly...');
        await page.evaluate(() => {
            selectPaymentMethod('other');
        });
        
        const otherState = await page.evaluate(() => {
            const checked = document.querySelector('input[name="payment-method"]:checked');
            return {
                method: checked ? checked.value : 'none',
                ccSectionVisible: document.getElementById('credit-card-section').style.display !== 'none',
                altSectionVisible: document.getElementById('alternative-payment-section').style.display !== 'none'
            };
        });
        console.log('After calling selectPaymentMethod("other"):', otherState);
        
        // Test with booking
        console.log('💵 Testing booking with cash...');
        await page.evaluate(() => {
            selectPaymentMethod('cash');
        });
        
        await page.click('#next-btn'); // Go to summary
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check what payment method is detected in booking
        await page.click('#confirm-booking-btn');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
    } catch (error) {
        console.log('❌ Test error:', error.message);
    } finally {
        await browser.close();
    }
}

testPaymentMethodDirect().catch(console.error);