/**
 * Complete Time Loading Test with Rate Limit Handling
 */

const { chromium } = require('playwright');

async function testTimeLoadingComplete() {
    console.log('🧪 Complete Time Loading Test...\n');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000, // Slower to avoid rate limits
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Capture console logs
        page.on('console', msg => {
            const text = msg.text();
            if (!text.includes('Failed to load resource')) {
                console.log(`[Console] ${text}`);
            }
        });
        
        // Navigate to the booking page
        console.log('📍 Loading booking page...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle', timeout: 30000 });
        
        // Wait for module to initialize
        await page.waitForTimeout(3000);
        
        // Scroll to booking section
        await page.locator('#booking').scrollIntoViewIfNeeded();
        await page.waitForTimeout(2000);
        
        // Select 90-minute service
        console.log('\n📍 Selecting 90-minute service...');
        await page.locator('[data-service-type="90min_massage"]').click();
        await page.waitForTimeout(2000);
        
        // Check if Step 2 is visible
        const step2Visible = await page.locator('#datetime-selection').isVisible();
        if (!step2Visible) {
            const nextBtn = page.locator('#next-btn');
            if (await nextBtn.isVisible()) {
                console.log('📍 Clicking Next to show date selection...');
                await nextBtn.click();
                await page.waitForTimeout(2000);
            }
        }
        
        // Wait a bit to avoid rate limits from previous tests
        console.log('\n⏳ Waiting to avoid rate limits...');
        await page.waitForTimeout(5000);
        
        // Set date to Saturday
        console.log('\n📍 Setting date to Saturday July 19...');
        const dateInput = page.locator('#booking-date');
        await dateInput.fill('2025-07-19');
        
        // Wait for debounce and API call
        console.log('📍 Waiting for times to load...');
        await page.waitForTimeout(4000);
        
        // Check time select
        const timeSelect = page.locator('#booking-time');
        let timeOptions = await timeSelect.locator('option').count();
        
        console.log(`\n📊 Initial result: ${timeOptions} time options`);
        
        // If still loading, wait more
        if (timeOptions <= 1) {
            console.log('⏳ Still loading, waiting more...');
            await page.waitForTimeout(5000);
            timeOptions = await timeSelect.locator('option').count();
            console.log(`📊 After extended wait: ${timeOptions} time options`);
        }
        
        // Check final state
        if (timeOptions > 1) {
            console.log('\n✅ SUCCESS: Time slots loaded!');
            
            // List available times
            const slots = [];
            for (let i = 1; i < Math.min(timeOptions, 6); i++) {
                const text = await timeSelect.locator('option').nth(i).textContent();
                slots.push(text);
            }
            console.log('📍 Available times:', slots);
            
            // Select a time
            await timeSelect.selectOption({ index: 1 });
            const selectedTime = await timeSelect.inputValue();
            console.log(`✅ Selected time: ${selectedTime}`);
            
            // Test persistence
            console.log('\n📍 Testing persistence...');
            
            // Change date
            await dateInput.fill('2025-07-21'); // Monday
            await page.waitForTimeout(3000);
            
            // Return to Saturday
            await dateInput.fill('2025-07-19');
            await page.waitForTimeout(3000);
            
            const restoredTime = await timeSelect.inputValue();
            if (restoredTime && restoredTime !== '') {
                console.log(`✅ Time restored: ${restoredTime}`);
            }
            
            console.log('\n✅ TIME LOADING IS WORKING CORRECTLY!');
            
        } else {
            console.log('\n❌ Time slots did not load');
            
            // Check for error message
            const loadingDiv = page.locator('#time-loading');
            if (await loadingDiv.isVisible()) {
                const errorText = await loadingDiv.textContent();
                console.log(`Error displayed: ${errorText}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
if (require.main === module) {
    testTimeLoadingComplete().catch(console.error);
}

module.exports = { testTimeLoadingComplete };