const { chromium } = require('playwright');

async function testBookingThankYouPage() {
    console.log('🧪 Testing booking modal thank you page display...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Navigate to the 3t page
        console.log('📍 Navigating to 3t page...');
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
        
        // Scroll to booking section
        console.log('📍 Scrolling to booking section...');
        await page.evaluate(() => {
            document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
        });
        await page.waitForTimeout(1000);
        
        // Check if booking form is visible
        const bookingFormVisible = await page.isVisible('.embedded-booking-container');
        console.log('✅ Booking form visible:', bookingFormVisible);
        
        // Test the showThankYouInModal function directly
        console.log('🧪 Testing showThankYouInModal function...');
        
        const result = await page.evaluate(() => {
            // Mock confirmation data
            const mockData = {
                service: '60min Healing Session',
                serviceName: '60min Healing Session',
                service_type: '60min_massage',
                datetime: 'Monday, July 20, 2025 at 3:00 PM',
                practitioner: 'Dr. Shiffer, CST, LMT',
                confirmationNumber: 'TEST-123456',
                totalAmount: '300.00'
            };
            
            // Check if function exists
            if (typeof showThankYouInModal !== 'function') {
                return { success: false, error: 'showThankYouInModal function not found' };
            }
            
            try {
                // Call the function
                showThankYouInModal(mockData);
                
                // Wait a moment for DOM updates
                setTimeout(() => {
                    // Check if thank you content is displayed
                    const thankYouContent = document.getElementById('thank-you-content');
                    if (thankYouContent) {
                        console.log('✅ Thank you content found and displayed');
                    }
                }, 100);
                
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
        
        console.log('📋 Function test result:', result);
        
        // Wait to see the thank you page
        await page.waitForTimeout(3000);
        
        // Check if thank you content is visible
        const thankYouVisible = await page.isVisible('#thank-you-content');
        console.log('✅ Thank you content visible:', thankYouVisible);
        
        // Take screenshot
        await page.screenshot({ path: 'booking-thank-you-test.png', fullPage: true });
        console.log('📸 Screenshot saved as booking-thank-you-test.png');
        
        console.log('✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test error:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the test
testBookingThankYouPage().catch(console.error);