#!/usr/bin/env node

/**
 * SIMPLE STRIPE TEST - No frame switching, single session
 */

const puppeteer = require('puppeteer');

async function testStripe() {
    console.log('🧪 SIMPLE STRIPE TEST');
    console.log('===================');
    
    let browser, page;
    const results = [];
    
    try {
        // Single browser session, no restarts
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        page = await browser.newPage();
        await page.goto('https://ittheal.com', { waitUntil: 'domcontentloaded' });
        
        // Test 1: Stripe SDK
        const stripeLoaded = await page.evaluate(() => typeof Stripe !== 'undefined');
        results.push({ name: 'Stripe SDK', passed: stripeLoaded });
        console.log(`✅ Stripe SDK: ${stripeLoaded ? 'LOADED' : 'MISSING'}`);
        
        // Test 2: Payment API
        const apiResult = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/web-booking/create-payment-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: 150,
                        service_type: 'test',
                        client_info: { name: 'Test', email: 'test@example.com' }
                    })
                });
                return { status: response.status, ok: response.ok };
            } catch (e) {
                return { error: e.message };
            }
        });
        
        results.push({ name: 'Payment API', passed: apiResult.status === 200 });
        console.log(`✅ Payment API: ${apiResult.status === 200 ? 'WORKING' : 'FAILED'} (${apiResult.status})`);
        
        // Test 3: Basic Navigation (single step)
        try {
            const testButton = await page.$('div[onclick*="selectService(\'test\'"]');
            if (testButton) {
                await testButton.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const nextBtn = await page.$('#next-btn');
                const canNavigate = !!nextBtn;
                results.push({ name: 'Basic Navigation', passed: canNavigate });
                console.log(`✅ Navigation: ${canNavigate ? 'WORKING' : 'FAILED'}`);
            }
        } catch (e) {
            results.push({ name: 'Basic Navigation', passed: false });
            console.log(`❌ Navigation: FAILED - ${e.message}`);
        }
        
        // Summary
        const passed = results.filter(r => r.passed).length;
        const total = results.length;
        const rate = Math.round((passed / total) * 100);
        
        console.log('');
        console.log(`📊 Results: ${passed}/${total} (${rate}%)`);
        
        if (rate >= 66) {
            console.log('🎉 STRIPE: FUNCTIONAL');
            return true;
        } else {
            console.log('⚠️  STRIPE: NEEDS WORK');
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Test Error: ${error.message}`);
        return false;
    } finally {
        if (browser) await browser.close();
    }
}

testStripe().then(success => {
    process.exit(success ? 0 : 1);
});