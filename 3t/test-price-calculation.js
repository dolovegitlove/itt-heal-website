/**
 * Test Price Calculation Fix
 * Verify that session prices are correctly picked up in the total
 */

const { chromium } = require('playwright');

async function testPriceCalculation() {
    console.log('🧪 Testing Price Calculation...\n');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 800,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Capture console logs to see price calculation debug info
        const logs = [];
        page.on('console', msg => {
            const text = msg.text();
            logs.push(text);
            if (text.includes('💰') || text.includes('Price calculation')) {
                console.log(`[Console] ${text}`);
            }
        });
        
        // Navigate to booking page
        console.log('📍 Loading booking page...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        // Scroll to booking section
        await page.locator('#booking').scrollIntoViewIfNeeded();
        await page.waitForTimeout(2000);
        
        // Test different service selections
        const servicesToTest = [
            { selector: '[data-service-type="90min_massage"]', expectedPrice: 180, name: '90-minute massage' },
            { selector: '[data-service-type="60min_massage"]', expectedPrice: 135, name: '60-minute massage' },
            { selector: '[data-service-type="30min_massage"]', expectedPrice: 85, name: '30-minute massage' }
        ];
        
        for (const service of servicesToTest) {
            console.log(`\n📍 Testing ${service.name}...`);
            
            // Select the service
            await page.locator(service.selector).click();
            await page.waitForTimeout(2000);
            
            // Check if price is displayed correctly
            const totalPriceElement = page.locator('#total-price');
            const totalPriceText = await totalPriceElement.textContent();
            const displayedPrice = parseInt(totalPriceText.replace('$', ''));
            
            console.log(`💰 Service: ${service.name}`);
            console.log(`   Expected: $${service.expectedPrice}`);
            console.log(`   Displayed: ${totalPriceText}`);
            
            if (displayedPrice === service.expectedPrice) {
                console.log(`✅ Correct price for ${service.name}`);
            } else {
                console.log(`❌ Wrong price for ${service.name}: expected $${service.expectedPrice}, got ${totalPriceText}`);
            }
            
            // Wait a bit before next test
            await page.waitForTimeout(1000);
        }
        
        // Test progression through booking flow to verify price carries through
        console.log('\n📍 Testing price persistence through booking flow...');
        
        // Select 90min service for final test
        await page.locator('[data-service-type="90min_massage"]').click();
        await page.waitForTimeout(2000);
        
        // Check initial price
        let totalPrice = await page.locator('#total-price').textContent();
        console.log(`📊 Step 1 price: ${totalPrice}`);
        
        // Proceed to Step 2 (auto-advances, but check manually if needed)
        const step2Visible = await page.locator('#datetime-selection').isVisible();
        if (!step2Visible) {
            await page.locator('#next-btn').click();
            await page.waitForTimeout(2000);
        }
        
        // Check price still shows
        totalPrice = await page.locator('#total-price').textContent();
        console.log(`📊 Step 2 price: ${totalPrice}`);
        
        // Set date and time
        await page.locator('#booking-date').fill('2025-07-19');
        await page.waitForTimeout(3000);
        
        const timeOptions = await page.locator('#booking-time option').count();
        if (timeOptions > 1) {
            await page.locator('#booking-time').selectOption({ index: 1 });
            await page.waitForTimeout(1000);
            
            // Proceed to Step 3
            await page.locator('#next-btn').click();
            await page.waitForTimeout(2000);
            
            // Fill contact info
            await page.locator('#client-name').fill('John Doe');
            await page.locator('#client-email').fill('john@example.com');
            await page.locator('#client-phone').fill('555-123-4567');
            
            await page.locator('#next-btn').click();
            await page.waitForTimeout(2000);
            
            // Check if payment step shows correct total
            const paymentTotalElement = page.locator('#payment-total-price');
            if (await paymentTotalElement.isVisible()) {
                const paymentTotal = await paymentTotalElement.textContent();
                console.log(`📊 Payment step price: ${paymentTotal}`);
                
                if (paymentTotal === '$180') {
                    console.log('✅ Price correctly carried through to payment step');
                } else {
                    console.log('❌ Price not correctly carried to payment step');
                }
            }
        } else {
            console.log('⚠️ No time slots available - cannot complete full flow test');
        }
        
        // Summary of price calculation logs
        const priceCalculationLogs = logs.filter(log => 
            log.includes('Price calculation') || 
            log.includes('selectedService')
        );
        
        console.log('\n📊 PRICE CALCULATION TEST SUMMARY:');
        console.log(`Total price calculation logs: ${priceCalculationLogs.length}`);
        
        if (priceCalculationLogs.length > 0) {
            console.log('\n📋 Price calculation debug logs:');
            priceCalculationLogs.forEach(log => console.log(`  - ${log}`));
        } else {
            console.log('⚠️ No price calculation debug logs found');
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
if (require.main === module) {
    testPriceCalculation().catch(console.error);
}

module.exports = { testPriceCalculation };