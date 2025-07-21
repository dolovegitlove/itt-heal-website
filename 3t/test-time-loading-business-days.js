/**
 * Test Time Loading with Valid Business Days
 * Tests the booking availability module with proper dates
 */

const { chromium } = require('playwright');

async function testTimeLoadingBusinessDays() {
    console.log('🧪 Testing Time Loading with Business Days...\n');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 800,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Capture console logs
        const logs = [];
        page.on('console', msg => {
            const text = msg.text();
            logs.push(text);
            if (text.includes('🔧') || text.includes('📍') || text.includes('✅') || 
                text.includes('❌') || text.includes('🔍') || text.includes('📅')) {
                console.log(`[Console] ${text}`);
            }
        });
        
        // Navigate to the booking page
        console.log('📍 Step 1: Loading booking page...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        // Check if BookingAvailability module loaded
        const moduleExists = await page.evaluate(() => {
            return typeof window.BookingAvailability !== 'undefined';
        });
        console.log(`📍 BookingAvailability module exists: ${moduleExists}`);
        
        // Scroll to booking section
        await page.locator('#booking').scrollIntoViewIfNeeded();
        await page.waitForTimeout(2000);
        
        // Select 90-minute service
        console.log('📍 Step 2: Selecting 90-minute service...');
        const serviceCard = page.locator('[data-service-type="90min_massage"]');
        await serviceCard.click();
        await page.waitForTimeout(2000);
        
        // Check if Step 2 is visible
        const step2Visible = await page.locator('#datetime-selection').isVisible();
        console.log(`📍 Step 2 visible: ${step2Visible}`);
        
        if (!step2Visible) {
            // Try to proceed to Step 2
            const nextBtn = page.locator('#next-btn');
            if (await nextBtn.isVisible()) {
                console.log('📍 Clicking Next to show Step 2...');
                await nextBtn.click();
                await page.waitForTimeout(2000);
            }
        }
        
        // Test with Monday (business day)
        console.log('\n📍 Step 3: Testing with Monday (business day)...');
        
        const dateInput = page.locator('#booking-date');
        const timeSelect = page.locator('#booking-time');
        
        // Get next Monday
        const getNextMonday = () => {
            const date = new Date();
            const day = date.getDay();
            const daysUntilMonday = day === 0 ? 1 : (8 - day) % 7 || 7;
            date.setDate(date.getDate() + daysUntilMonday);
            return date.toISOString().split('T')[0];
        };
        
        const mondayDate = getNextMonday();
        console.log(`📍 Setting date to Monday: ${mondayDate}`);
        await dateInput.fill(mondayDate);
        
        // Wait for time loading
        console.log('📍 Waiting for time slots to load...');
        await page.waitForTimeout(3000);
        
        // Check if times loaded
        let timeOptions = await timeSelect.locator('option').count();
        console.log(`📍 Time options available: ${timeOptions}`);
        
        if (timeOptions <= 1) {
            // Try manual trigger
            console.log('📍 Trying manual trigger...');
            const triggered = await page.evaluate(() => {
                if (window.BookingAvailability && typeof window.BookingAvailability.refresh === 'function') {
                    window.BookingAvailability.refresh();
                    return true;
                }
                return false;
            });
            console.log(`📍 Manual trigger attempted: ${triggered}`);
            
            await page.waitForTimeout(3000);
            timeOptions = await timeSelect.locator('option').count();
            console.log(`📍 Time options after manual trigger: ${timeOptions}`);
        }
        
        // List available times
        if (timeOptions > 1) {
            console.log('✅ SUCCESS: Time slots loaded!');
            const timeOptionsText = [];
            for (let i = 0; i < Math.min(timeOptions, 5); i++) {
                const optionText = await timeSelect.locator('option').nth(i).textContent();
                timeOptionsText.push(optionText);
            }
            console.log('📍 Sample time slots:', timeOptionsText);
        } else {
            console.log('❌ FAIL: No time slots loaded');
            
            // Check error messages
            const loadingDiv = page.locator('#time-loading');
            if (await loadingDiv.isVisible()) {
                const errorText = await loadingDiv.textContent();
                console.log(`Error message: ${errorText}`);
            }
        }
        
        // Test with Wednesday (another business day)
        console.log('\n📍 Step 4: Testing with Wednesday...');
        
        const getNextWednesday = () => {
            const date = new Date();
            const day = date.getDay();
            const daysUntilWednesday = (3 - day + 7) % 7 || 7;
            date.setDate(date.getDate() + daysUntilWednesday);
            return date.toISOString().split('T')[0];
        };
        
        const wednesdayDate = getNextWednesday();
        await dateInput.fill(wednesdayDate);
        await page.waitForTimeout(3000);
        
        const wedTimeOptions = await timeSelect.locator('option').count();
        console.log(`📍 Wednesday time options: ${wedTimeOptions}`);
        
        // Summary
        console.log('\n📊 TEST SUMMARY:');
        console.log(`Module loaded: ${moduleExists}`);
        console.log(`Monday times: ${timeOptions > 1 ? 'LOADED' : 'FAILED'}`);
        console.log(`Wednesday times: ${wedTimeOptions > 1 ? 'LOADED' : 'FAILED'}`);
        console.log(`Total console logs: ${logs.length}`);
        
        // Show relevant logs
        const relevantLogs = logs.filter(log => 
            log.includes('BookingAvailability') || 
            log.includes('Loading times') ||
            log.includes('API') ||
            log.includes('Error')
        );
        
        if (relevantLogs.length > 0) {
            console.log('\n📋 Relevant logs:');
            relevantLogs.forEach(log => console.log(`  - ${log}`));
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
if (require.main === module) {
    testTimeLoadingBusinessDays().catch(console.error);
}

module.exports = { testTimeLoadingBusinessDays };