#!/usr/bin/env node

/**
 * Quick test for payment method switching specifically
 */

const puppeteer = require('puppeteer');

async function testPaymentMethodSwitch() {
    console.log('💳 Payment Method Switch Test');
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
        
        console.log('💳 Testing payment method switching...');
        
        // Check initial state
        const initialState = await page.evaluate(() => {
            const checked = document.querySelector('input[name="payment-method"]:checked');
            return {
                method: checked ? checked.value : 'none',
                ccSectionVisible: document.getElementById('credit-card-section').style.display !== 'none'
            };
        });
        console.log('Initial state:', initialState);
        
        // Switch to cash
        console.log('📍 Clicking cash payment option...');
        await page.click('#payment-method-cash');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const cashState = await page.evaluate(() => {
            const checked = document.querySelector('input[name="payment-method"]:checked');
            return {
                method: checked ? checked.value : 'none',
                ccSectionVisible: document.getElementById('credit-card-section').style.display !== 'none',
                altSectionVisible: document.getElementById('alternative-payment-section').style.display !== 'none'
            };
        });
        console.log('Cash state:', cashState);
        
        // Switch to other
        console.log('📍 Clicking other payment option...');
        await page.click('#payment-method-other');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const otherState = await page.evaluate(() => {
            const checked = document.querySelector('input[name="payment-method"]:checked');
            return {
                method: checked ? checked.value : 'none',
                ccSectionVisible: document.getElementById('credit-card-section').style.display !== 'none',
                altSectionVisible: document.getElementById('alternative-payment-section').style.display !== 'none'
            };
        });
        console.log('Other state:', otherState);
        
        // Test booking with cash selected
        console.log('💵 Testing booking with cash selected...');
        await page.click('#payment-method-cash');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await page.click('#next-btn'); // Go to summary
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Click confirm and monitor console
        await page.click('#confirm-booking-btn');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('Test completed');
        
    } catch (error) {
        console.log('❌ Test error:', error.message);
    } finally {
        await browser.close();
    }
}

testPaymentMethodSwitch().catch(console.error);