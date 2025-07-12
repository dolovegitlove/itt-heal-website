#!/usr/bin/env node

/**
 * ITT Heal - Isolated Payment Test
 * Test just the payment processing step to isolate the issue
 */

const puppeteer = require('puppeteer');

async function testPaymentOnly() {
    console.log('🔍 Testing payment processing isolation...');
    
    const browser = await puppeteer.launch({ 
        headless: true,  // Headless for VPS
        defaultViewport: { width: 1200, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Monitor console and network
    page.on('console', msg => {
        console.log(`[CONSOLE] ${msg.type()}: ${msg.text()}`);
    });
    
    page.on('response', response => {
        if (response.url().includes('stripe') || response.url().includes('payment')) {
            console.log(`[NETWORK] ${response.status()} ${response.url()}`);
        }
    });
    
    try {
        console.log('📍 Loading booking page...');
        await page.goto('https://ittheal.com', { waitUntil: 'networkidle2' });
        
        console.log('📍 Scrolling to booking section...');
        await page.evaluate(() => {
            document.querySelector('#booking').scrollIntoView({ behavior: 'smooth' });
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('📍 Selecting test service...');
        await page.click('[data-service-type="test"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('📍 Clicking next to date selection...');
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('📍 Setting date...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split('T')[0];
        await page.type('#booking-date', dateString);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('📍 Selecting time...');
        await page.waitForSelector('#booking-time option:not([value=""])', { timeout: 10000 });
        await page.select('#booking-time', await page.$eval('#booking-time option:nth-child(2)', el => el.value));
        
        console.log('📍 Clicking next to contact...');
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('📍 Filling contact info...');
        await page.type('#client-name', 'Test User');
        await page.type('#client-email', 'test@example.com');
        await page.type('#client-phone', '9405551234');
        
        console.log('📍 Clicking next to payment...');
        await page.click('#next-btn');
        await new Promise(resolve => setTimeout(resolve, 5000));  // Give more time for payment step
        
        console.log('📍 Checking payment step loaded...');
        const paymentStep = await page.evaluate(() => {
            const step = document.querySelector('#payment-info');
            return {
                exists: !!step,
                visible: step ? step.style.display !== 'none' : false,
                hasStripeElement: !!document.querySelector('#stripe-card-element'),
                hasPaymentIntent: !!document.querySelector('#booking-status')
            };
        });
        
        console.log('💳 Payment step status:', paymentStep);
        
        if (paymentStep.hasStripeElement) {
            console.log('📍 Stripe element found - checking for iframe...');
            
            // Wait for Stripe iframe to load
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const stripeIframe = await page.evaluate(() => {
                const iframe = document.querySelector('#stripe-card-element iframe');
                return {
                    exists: !!iframe,
                    src: iframe ? iframe.src : null,
                    loaded: iframe ? iframe.contentDocument !== null : false
                };
            });
            
            console.log('🎫 Stripe iframe status:', stripeIframe);
        }
        
        // Check what's in the booking status
        const bookingStatus = await page.evaluate(() => {
            const status = document.querySelector('#booking-status');
            return status ? status.textContent.trim() : 'No status element';
        });
        
        console.log('📊 Booking status:', bookingStatus);
        
        // Wait and watch for changes
        console.log('👁️ Watching for status changes for 10 seconds...');
        for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const currentStatus = await page.evaluate(() => {
                const status = document.querySelector('#booking-status');
                return status ? status.textContent.trim() : 'No status';
            });
            if (currentStatus !== bookingStatus) {
                console.log(`📊 Status changed to: ${currentStatus}`);
                break;
            }
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

testPaymentOnly().catch(console.error);