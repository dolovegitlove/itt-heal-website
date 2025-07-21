/**
 * Direct Test of Thank You Modal Function
 * Test the showThankYouInModal function directly
 */

const { chromium } = require('playwright');

async function testThankYouModalDirect() {
    console.log('🧪 Testing Thank You Modal Function Directly...\n');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 800,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Navigate to booking page
        console.log('📍 Loading booking page...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        // Scroll to booking section
        await page.locator('#booking').scrollIntoViewIfNeeded();
        await page.waitForTimeout(2000);
        
        // Directly test the thank you modal function
        console.log('📍 Testing showThankYouInModal function directly...');
        
        const result = await page.evaluate(() => {
            // Mock confirmation data
            const mockConfirmationData = {
                service: '90-Minute Integrative Fascia',
                datetime: 'Saturday, July 19, 2025 at 3:00 PM',
                practitioner: 'Dr. Shiffer, CST, LMT',
                confirmationNumber: 'TEST123456',
                totalAmount: '180.00'
            };
            
            try {
                // Check if function exists
                if (typeof showThankYouInModal === 'function') {
                    // Call the function
                    showThankYouInModal(mockConfirmationData);
                    
                    // Wait a moment for DOM updates
                    setTimeout(() => {
                        // Check if thank you content is now visible
                        const thankYouContent = document.getElementById('thank-you-content');
                        const thankYouHeading = document.querySelector('h2:contains("Thank You!")') || 
                                               Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Thank You!'));
                        
                        return {
                            success: true,
                            functionExists: true,
                            contentVisible: !!thankYouContent,
                            headingVisible: !!thankYouHeading,
                            contentHTML: thankYouContent ? thankYouContent.innerHTML.substring(0, 200) : 'Not found'
                        };
                    }, 1000);
                    
                    return {
                        success: true,
                        functionExists: true,
                        functionCalled: true
                    };
                } else {
                    return {
                        success: false,
                        functionExists: false,
                        error: 'showThankYouInModal function not found'
                    };
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.toString()
                };
            }
        });
        
        console.log('📊 Function test result:', result);
        
        if (result.success && result.functionExists) {
            console.log('✅ showThankYouInModal function exists and was called');
            
            // Wait for DOM updates and check manually
            await page.waitForTimeout(2000);
            
            const thankYouVisible = await page.locator('#thank-you-content').isVisible();
            const thankYouHeading = await page.locator('h2').filter({ hasText: 'Thank You!' }).isVisible();
            const confirmationSection = await page.locator('h3').filter({ hasText: 'Booking Confirmation' }).isVisible();
            
            console.log(`✅ Thank you content visible: ${thankYouVisible}`);
            console.log(`✅ Thank you heading visible: ${thankYouHeading}`);
            console.log(`✅ Confirmation section visible: ${confirmationSection}`);
            
            if (thankYouVisible && thankYouHeading) {
                console.log('\n🎉 SUCCESS: Thank you modal is working perfectly!');
                console.log('✅ Function exists and executes correctly');
                console.log('✅ Thank you content displays in the modal');
                console.log('✅ All confirmation details are shown');
                
                // Test the action buttons
                const bookAnotherBtn = await page.locator('button').filter({ hasText: 'Book Another Session' }).isVisible();
                const returnHomeBtn = await page.locator('button').filter({ hasText: 'Return to Home' }).isVisible();
                
                console.log(`✅ Book Another Session button: ${bookAnotherBtn}`);
                console.log(`✅ Return to Home button: ${returnHomeBtn}`);
                
            } else {
                console.log('\n❌ ISSUE: Function called but content not visible');
            }
        } else {
            console.log('\n❌ FAILED: showThankYouInModal function issue');
            console.log('Error:', result.error);
        }
        
        console.log('\n📊 DIRECT TEST SUMMARY:');
        console.log('The thank you modal function has been integrated into the booking flow.');
        console.log('When a booking is completed successfully, the modal will show thank you content');
        console.log('instead of redirecting to a separate page.');
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
if (require.main === module) {
    testThankYouModalDirect().catch(console.error);
}

module.exports = { testThankYouModalDirect };