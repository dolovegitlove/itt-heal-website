const { chromium } = require('playwright');

async function testManualInput() {
    console.log('🚀 Testing manual Stripe card input...');
    
    const browser = await chromium.launch({
        headless: false,           // Show real browser for manual testing
        slowMo: 1000,
        args: [
            '--window-size=1920,1080',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    const page = await browser.newPage();
    
    try {
        // Navigate to admin page
        console.log('📱 Navigating to admin page...');
        await page.goto('https://ittheal.com/3t/admin/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(3000);
        
        // Open edit modal
        console.log('✏️ Opening edit modal...');
        const editButton = page.locator('#recentBookingsTable .booking-card .booking-actions button:has-text("Edit")').first();
        await editButton.click();
        await page.waitForTimeout(3000);
        
        // Ensure credit card is selected
        const creditCardRadio = page.locator('#editBookingModal input[name="payment-method"][value="credit_card"]');
        await creditCardRadio.click();
        await page.waitForTimeout(3000);
        
        console.log('🖱️ Modal is open with credit card selected.');
        console.log('📋 MANUAL TEST INSTRUCTIONS:');
        console.log('1. Click on the card input field');
        console.log('2. Try typing: 4242424242424242');
        console.log('3. Try typing expiry: 12/28');
        console.log('4. Try typing CVC: 123');
        console.log('5. Try typing ZIP: 12345');
        console.log('6. Check if the input appears in the field');
        console.log('');
        console.log('⏳ Browser will stay open for 60 seconds for manual testing...');
        
        // Keep browser open for manual testing
        await page.waitForTimeout(60000);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

testManualInput().catch(console.error);