const { chromium } = require('playwright');

async function compareStripe() {
    console.log('🚀 Comparing Stripe between main site and admin...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        // Test main site first
        console.log('📱 Testing main site Stripe...');
        const mainPage = await browser.newPage();
        await mainPage.goto('https://ittheal.com/3t/', { waitUntil: 'domcontentloaded' });
        await mainPage.waitForTimeout(3000);
        
        // Navigate to booking flow
        await mainPage.click('text=Book Now');
        await mainPage.waitForTimeout(2000);
        
        // Go through steps to reach payment
        await mainPage.click('[data-service="60min"]'); // Select service
        await mainPage.waitForTimeout(1000);
        await mainPage.click('#next-btn'); // Next to date
        await mainPage.waitForTimeout(1000);
        await mainPage.fill('#selected-date', '2025-07-25');
        await mainPage.click('#next-btn'); // Next to time
        await mainPage.waitForTimeout(1000);
        await mainPage.click('.time-slot'); // Select time
        await mainPage.waitForTimeout(1000);
        await mainPage.fill('#client-name', 'Test User');
        await mainPage.fill('#client-email', 'test@example.com');
        await mainPage.fill('#client-phone', '555-1234');
        await mainPage.click('#next-btn'); // Next to payment
        await mainPage.waitForTimeout(3000);
        
        // Check if Stripe element loads
        const mainStripeFrames = await mainPage.locator('iframe[name^="__privateStripeFrame"]').count();
        console.log(`Main site Stripe iframes: ${mainStripeFrames}`);
        
        if (mainStripeFrames > 0) {
            // Try input on main site
            try {
                const mainCardFrame = mainPage.frameLocator('iframe[name^="__privateStripeFrame"]').first();
                await mainCardFrame.locator('input[name="cardnumber"]').click();
                await mainPage.keyboard.type('4242');
                await mainPage.waitForTimeout(1000);
                console.log('✅ Main site input works');
            } catch (e) {
                console.log('❌ Main site input failed:', e.message);
            }
        }
        
        // Test admin site
        console.log('📱 Testing admin site Stripe...');
        const adminPage = await browser.newPage();
        await adminPage.goto('https://ittheal.com/3t/admin/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForTimeout(3000);
        
        // Open edit modal
        const editButton = adminPage.locator('#recentBookingsTable .booking-card .booking-actions button:has-text("Edit")').first();
        await editButton.click();
        await adminPage.waitForTimeout(3000);
        
        // Select credit card
        const creditCardRadio = adminPage.locator('#editBookingModal input[name="payment-method"][value="credit_card"]');
        await creditCardRadio.click();
        await adminPage.waitForTimeout(3000);
        
        // Check if Stripe element loads
        const adminStripeFrames = await adminPage.locator('iframe[name^="__privateStripeFrame"]').count();
        console.log(`Admin site Stripe iframes: ${adminStripeFrames}`);
        
        if (adminStripeFrames > 0) {
            // Try input on admin site
            try {
                const adminCardFrame = adminPage.frameLocator('iframe[name^="__privateStripeFrame"]').first();
                await adminCardFrame.locator('input[name="cardnumber"]').click();
                await adminPage.keyboard.type('4242');
                await adminPage.waitForTimeout(1000);
                console.log('✅ Admin site input works');
            } catch (e) {
                console.log('❌ Admin site input failed:', e.message);
            }
        }
        
        console.log('⏳ Keeping browsers open for 30 seconds for comparison...');
        await mainPage.waitForTimeout(30000);
        
    } catch (error) {
        console.error('❌ Comparison failed:', error.message);
    } finally {
        await browser.close();
    }
}

compareStripe().catch(console.error);