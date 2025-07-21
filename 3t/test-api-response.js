/**
 * Test API Response Handling
 */

const { chromium } = require('playwright');

async function testAPIResponse() {
    console.log('🧪 Testing API Response Handling...\n');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Intercept API responses
        page.on('response', response => {
            if (response.url().includes('/api/web-booking/availability')) {
                console.log(`📍 API Response: ${response.status()} ${response.url()}`);
                response.text().then(text => {
                    console.log(`📍 Response body: ${text.substring(0, 200)}...`);
                });
            }
        });
        
        // Capture console logs
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Error') || text.includes('📍') || text.includes('🔍') || text.includes('📋')) {
                console.log(`[Console] ${text}`);
            }
        });
        
        // Navigate to the booking page
        console.log('📍 Loading booking page...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        // Select service and navigate to date selection
        await page.locator('#booking').scrollIntoViewIfNeeded();
        await page.locator('[data-service-type="90min_massage"]').click();
        await page.waitForTimeout(2000);
        
        const step2Visible = await page.locator('#datetime-selection').isVisible();
        if (!step2Visible) {
            const nextBtn = page.locator('#next-btn');
            if (await nextBtn.isVisible()) {
                await nextBtn.click();
                await page.waitForTimeout(2000);
            }
        }
        
        // Set date to Saturday (known working date)
        console.log('\n📍 Setting date to Saturday July 19...');
        await page.locator('#booking-date').fill('2025-07-19');
        
        // Wait for API call
        await page.waitForTimeout(3000);
        
        // Check dropdown state
        const timeSelect = page.locator('#booking-time');
        const options = await timeSelect.locator('option').count();
        console.log(`\n📍 Dropdown has ${options} options`);
        
        // Get all option texts
        for (let i = 0; i < options; i++) {
            const text = await timeSelect.locator('option').nth(i).textContent();
            console.log(`  Option ${i}: "${text}"`);
        }
        
        // Check if dropdown is enabled
        const isEnabled = await timeSelect.isEnabled();
        console.log(`📍 Dropdown enabled: ${isEnabled}`);
        
        // Check loading div
        const loadingDiv = page.locator('#time-loading');
        const loadingVisible = await loadingDiv.isVisible();
        console.log(`📍 Loading div visible: ${loadingVisible}`);
        if (loadingVisible) {
            const loadingText = await loadingDiv.textContent();
            console.log(`📍 Loading text: "${loadingText}"`);
        }
        
        // Try to manually trigger the API call
        console.log('\n📍 Manually triggering API call...');
        const result = await page.evaluate(() => {
            if (window.BookingAvailability && window.BookingAvailability.loadTimeSlots) {
                window.BookingAvailability.loadTimeSlots();
                return 'Triggered';
            }
            return 'Module not found';
        });
        console.log(`📍 Manual trigger result: ${result}`);
        
        await page.waitForTimeout(3000);
        
        // Check again
        const optionsAfter = await timeSelect.locator('option').count();
        console.log(`\n📍 Dropdown has ${optionsAfter} options after manual trigger`);
        
    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
if (require.main === module) {
    testAPIResponse().catch(console.error);
}

module.exports = { testAPIResponse };