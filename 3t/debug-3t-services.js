/**
 * Debug 3t Services - Find actual service data attributes
 * Real Browser UI Testing - X11 Environment
 */

const { chromium } = require('playwright');

async function debug3tServices() {
    console.log('🔍 DEBUGGING 3T SERVICES');
    console.log('========================');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        
        // Scroll to booking section
        await page.locator('#booking').scrollIntoViewIfNeeded();
        await page.waitForTimeout(2000);
        
        // Find all service-related elements
        console.log('\n📋 SERVICE ELEMENTS FOUND:');
        console.log('==========================');
        
        // Look for data-service-type attributes
        const serviceTypes = await page.locator('[data-service-type]').all();
        console.log(`📍 Elements with data-service-type: ${serviceTypes.length}`);
        
        for (let i = 0; i < serviceTypes.length; i++) {
            const element = serviceTypes[i];
            const serviceType = await element.getAttribute('data-service-type');
            const text = await element.textContent();
            const visible = await element.isVisible();
            console.log(`   ${i + 1}. data-service-type="${serviceType}" | visible: ${visible} | text: "${text?.trim()}"`);
        }
        
        // Look for other service-related attributes
        const dataService = await page.locator('[data-service]').all();
        console.log(`\\n📍 Elements with data-service: ${dataService.length}`);
        
        for (let i = 0; i < dataService.length; i++) {
            const element = dataService[i];
            const service = await element.getAttribute('data-service');
            const text = await element.textContent();
            const visible = await element.isVisible();
            console.log(`   ${i + 1}. data-service="${service}" | visible: ${visible} | text: "${text?.trim()}"`);
        }
        
        // Look for duration-based selectors
        const dataDuration = await page.locator('[data-duration]').all();
        console.log(`\\n📍 Elements with data-duration: ${dataDuration.length}`);
        
        for (let i = 0; i < dataDuration.length; i++) {
            const element = dataDuration[i];
            const duration = await element.getAttribute('data-duration');
            const text = await element.textContent();
            const visible = await element.isVisible();
            console.log(`   ${i + 1}. data-duration="${duration}" | visible: ${visible} | text: "${text?.trim()}"`);
        }
        
        // Look for buttons that might be service selectors
        const buttons = await page.locator('button').all();
        console.log(`\\n📍 Buttons found: ${buttons.length}`);
        
        for (let i = 0; i < Math.min(buttons.length, 10); i++) { // Limit to first 10
            const button = buttons[i];
            const text = await button.textContent();
            const visible = await button.isVisible();
            const classes = await button.getAttribute('class');
            console.log(`   ${i + 1}. visible: ${visible} | text: "${text?.trim()}" | classes: "${classes}"`);
        }
        
        // Look for any clickable elements with service-related text
        const serviceWords = ['60', '90', '120', 'minute', 'session', 'massage', 'therapeutic'];
        console.log('\\n📍 SERVICE-RELATED CLICKABLE ELEMENTS:');
        console.log('======================================');
        
        for (const word of serviceWords) {
            const elements = await page.locator(`*:has-text("${word}")`).all();
            if (elements.length > 0) {
                console.log(`\\n🔍 Elements containing "${word}": ${elements.length}`);
                for (let i = 0; i < Math.min(elements.length, 3); i++) {
                    const element = elements[i];
                    const text = await element.textContent();
                    const tagName = await element.evaluate(el => el.tagName);
                    const visible = await element.isVisible();
                    console.log(`   ${tagName} | visible: ${visible} | text: "${text?.trim().substring(0, 100)}"`);
                }
            }
        }
        
        // Check for payment-related elements
        console.log('\\n💳 PAYMENT ELEMENTS:');
        console.log('====================');
        
        const paymentInputs = await page.locator('input[name*="payment"], input[value*="card"], input[value*="cash"]').all();
        console.log(`📍 Payment inputs: ${paymentInputs.length}`);
        
        for (let i = 0; i < paymentInputs.length; i++) {
            const input = paymentInputs[i];
            const name = await input.getAttribute('name');
            const value = await input.getAttribute('value');
            const visible = await input.isVisible();
            console.log(`   ${i + 1}. name="${name}" value="${value}" visible: ${visible}`);
        }
        
        // Check for Stripe elements
        const stripeElements = await page.locator('iframe[name*="stripe"], iframe[src*="stripe"]').all();
        console.log(`\\n📍 Stripe elements: ${stripeElements.length}`);
        
        for (let i = 0; i < stripeElements.length; i++) {
            const iframe = stripeElements[i];
            const name = await iframe.getAttribute('name');
            const src = await iframe.getAttribute('src');
            const visible = await iframe.isVisible();
            console.log(`   ${i + 1}. name="${name}" src="${src}" visible: ${visible}`);
        }
        
    } catch (error) {
        console.error('Debug error:', error);
    } finally {
        await browser.close();
    }
}

// Execute the debug
debug3tServices().then(() => {
    console.log('\\n✅ SERVICE DEBUG COMPLETE');
}).catch(error => {
    console.error('❌ Debug failed:', error);
});