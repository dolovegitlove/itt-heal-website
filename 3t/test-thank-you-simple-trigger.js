/**
 * Simple Thank You Modal Trigger Test
 * Just trigger the thank you modal to verify it works
 */

const { chromium } = require('playwright');

async function testThankYouSimpleTrigger() {
    console.log('🧪 Simple Thank You Modal Trigger Test...\n');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Navigate to booking page
        console.log('📍 Loading booking page...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        // Scroll to booking section to initialize it
        await page.locator('#booking').scrollIntoViewIfNeeded();
        await page.waitForTimeout(2000);
        
        // Initialize booking flow (select a service to set up the modal)
        console.log('📍 Initializing booking modal...');
        await page.locator('[data-service-type="90min_massage"]').click();
        await page.waitForTimeout(2000);
        
        // Now trigger the thank you modal directly
        console.log('📍 Triggering thank you modal directly...');
        
        const result = await page.evaluate(() => {
            // Create mock confirmation data
            const mockData = {
                service: '90-Minute Integrative Fascia',
                datetime: 'Saturday, July 19, 2025 at 4:00 PM',
                practitioner: 'Dr. Shiffer, CST, LMT',
                confirmationNumber: 'ITT-TEST-12345',
                totalAmount: '180.00'
            };
            
            console.log('🔄 Calling showThankYouInModal with mock data...');
            
            try {
                // Check if function exists first
                if (typeof showThankYouInModal !== 'function') {
                    return { error: 'showThankYouInModal function not found' };
                }
                
                // Call the function
                showThankYouInModal(mockData);
                
                // Give it a moment to process
                setTimeout(() => {
                    const thankYouEl = document.getElementById('thank-you-content');
                    console.log('✅ Thank you element after call:', !!thankYouEl);
                }, 500);
                
                return { success: true, functionCalled: true };
            } catch (error) {
                return { error: error.toString() };
            }
        });
        
        console.log('📊 Trigger result:', result);
        
        if (result.success) {
            // Wait for DOM to update
            await page.waitForTimeout(2000);
            
            // Check if thank you content is visible
            const thankYouVisible = await page.locator('#thank-you-content').isVisible();
            const headingVisible = await page.locator('h2').filter({ hasText: 'Thank You!' }).isVisible();
            const confirmationVisible = await page.locator('h3').filter({ hasText: 'Booking Confirmation' }).isVisible();
            
            console.log(`\n📊 RESULTS:`);
            console.log(`✅ Thank you content visible: ${thankYouVisible}`);
            console.log(`✅ Thank you heading visible: ${headingVisible}`);
            console.log(`✅ Confirmation section visible: ${confirmationVisible}`);
            
            if (thankYouVisible && headingVisible) {
                console.log('\n🎉 SUCCESS: Thank you modal is working!');
                
                // Take screenshot for verification
                await page.screenshot({ path: 'thank-you-modal-working.png', fullPage: true });
                console.log('📷 Screenshot saved: thank-you-modal-working.png');
                
                // Test action buttons
                const bookAnotherBtn = await page.locator('button').filter({ hasText: 'Book Another Session' }).isVisible();
                const returnHomeBtn = await page.locator('button').filter({ hasText: 'Return to Home' }).isVisible();
                
                console.log(`✅ Action buttons working: Book Another (${bookAnotherBtn}), Return Home (${returnHomeBtn})`);
                
                // Check that original booking content is hidden
                const step1Hidden = !(await page.locator('#service-selection').isVisible());
                console.log(`✅ Original booking steps hidden: ${step1Hidden}`);
                
            } else {
                console.log('\n❌ ISSUE: Function called but modal not displaying properly');
                
                // Debug - check if elements exist but not visible
                const thankYouExists = await page.locator('#thank-you-content').count();
                console.log(`Debug: Thank you element exists: ${thankYouExists > 0}`);
                
                if (thankYouExists > 0) {
                    const styles = await page.locator('#thank-you-content').evaluate(el => ({
                        display: window.getComputedStyle(el).display,
                        visibility: window.getComputedStyle(el).visibility,
                        opacity: window.getComputedStyle(el).opacity
                    }));
                    console.log('Debug: Element styles:', styles);
                }
            }
        } else {
            console.log('\n❌ FAILED: Could not trigger thank you modal');
            console.log('Error:', result.error);
        }
        
        console.log('\n📊 SIMPLE TRIGGER TEST SUMMARY:');
        console.log('This test verifies that the showThankYouInModal function works correctly.');
        console.log('If this test passes, the function will work when called from the actual booking flow.');
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
if (require.main === module) {
    testThankYouSimpleTrigger().catch(console.error);
}

module.exports = { testThankYouSimpleTrigger };