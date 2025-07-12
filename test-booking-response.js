#!/usr/bin/env node

/**
 * Quick test to check booking API response
 */

const puppeteer = require('puppeteer');

async function testBookingResponse() {
    console.log('📋 Testing Booking API Response');
    console.log('==============================');
    
    const browser = await puppeteer.launch({ 
        headless: true,
        defaultViewport: { width: 1200, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);
    
    // Enhanced console monitoring
    page.on('console', msg => {
        console.log(`[CONSOLE] ${msg.text()}`);
    });
    
    page.on('response', response => {
        const url = response.url();
        if (url.includes('/api/web-booking')) {
            console.log(`[API] ${response.status()} - ${url}`);
        }
    });
    
    try {
        await page.goto('https://ittheal.com', { waitUntil: 'domcontentloaded' });
        
        // Quick navigation
        await page.evaluate(() => document.querySelector('#booking').scrollIntoView());
        await page.click('[data-service-type="test"]');
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await page.type('#booking-date', tomorrow.toISOString().split('T')[0]);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.waitForSelector('#booking-time option:not([value=""])', { timeout: 8000 });
        await page.select('#booking-time', await page.$eval('#booking-time option:nth-child(2)', el => el.value));
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Fill form
        await page.type('#client-name', 'John Smith');
        await page.type('#client-email', 'john@example.com');
        await page.type('#client-phone', '9405551234');
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Select cash payment
        await page.evaluate(() => selectPaymentMethod('cash'));
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await page.click('#next-btn'); // Summary
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log('\n🚀 Attempting booking...');
        await page.click('#confirm-booking-btn');
        
        // Wait longer for response
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // Check final state
        const finalState = await page.evaluate(() => {
            const summary = document.getElementById('booking-summary');
            const form = document.getElementById('booking-form');
            return {
                summaryVisible: summary && summary.style.display !== 'none',
                formVisible: form && form.style.display !== 'none',
                anyErrors: document.querySelector('.error-message') !== null
            };
        });
        
        console.log('\nFinal state:', finalState);
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

testBookingResponse().catch(console.error);