const { chromium } = require('playwright');

async function testStripeConsole() {
    console.log('🚀 Testing Stripe console errors...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('IntegrationError') || text.includes('Can only create one Element')) {
            console.log('❌ STRIPE ERROR:', text);
        } else if (text.includes('Stripe') || text.includes('card element')) {
            console.log('ℹ️ STRIPE LOG:', text);
        }
    });
    
    try {
        // Navigate to admin page
        console.log('📱 Navigating to admin page...');
        await page.goto('https://ittheal.com/3t/admin/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        await page.waitForTimeout(3000);
        
        // Find and click edit button
        console.log('✏️ Opening edit modal...');
        const editButton = page.locator('#recentBookingsTable .booking-card .booking-actions button:has-text("Edit")').first();
        await editButton.click();
        await page.waitForTimeout(2000);
        
        // Select credit card to trigger Stripe element creation
        console.log('💳 Selecting credit card payment method...');
        const creditCardRadio = page.locator('#editBookingModal input[name="payment-method"][value="credit_card"]');
        await creditCardRadio.click();
        await page.waitForTimeout(3000);
        
        // Close modal to test cleanup
        console.log('🚪 Closing modal to test cleanup...');
        const closeButton = page.locator('#editBookingModal .modal-close');
        await closeButton.click();
        await page.waitForTimeout(2000);
        
        // Open modal again to test re-creation
        console.log('🔄 Reopening modal to test re-creation...');
        await editButton.click();
        await page.waitForTimeout(2000);
        
        // Select credit card again
        console.log('💳 Selecting credit card again...');
        const creditCardRadio2 = page.locator('#editBookingModal input[name="payment-method"][value="credit_card"]');
        await creditCardRadio2.click();
        await page.waitForTimeout(3000);
        
        console.log('✅ Test completed - check console logs above for any Stripe errors');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

testStripeConsole().catch(console.error);