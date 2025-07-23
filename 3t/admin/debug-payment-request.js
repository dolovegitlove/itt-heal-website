const { chromium } = require('playwright');

async function debugPaymentRequest() {
    console.log('🔍 Debugging payment request data...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Intercept network requests to see what's being sent
    page.on('request', request => {
        if (request.url().includes('create-payment-intent')) {
            console.log('🔍 PAYMENT REQUEST INTERCEPTED:');
            console.log('URL:', request.url());
            console.log('Method:', request.method());
            console.log('Headers:', request.headers());
            console.log('Body:', request.postData());
            console.log('---');
        }
    });
    
    page.on('response', response => {
        if (response.url().includes('create-payment-intent')) {
            console.log('🔍 PAYMENT RESPONSE INTERCEPTED:');
            console.log('Status:', response.status());
            console.log('Headers:', response.headers());
            console.log('---');
        }
    });
    
    // Also capture console logs for detailed debugging
    page.on('console', msg => {
        if (msg.text().includes('Payment') || msg.text().includes('payment')) {
            console.log('💬 Console:', msg.text());
        }
    });
    
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
        
        // Select credit card payment method
        console.log('💳 Selecting credit card payment method...');
        const creditCardRadio = page.locator('#editBookingModal input[name="payment-method"][value="credit_card"]');
        await creditCardRadio.click();
        await page.waitForTimeout(2000);
        
        // Add a tip
        console.log('💰 Adding tip amount...');
        const tipField = page.locator('#editTipAmount');
        await tipField.click();
        await tipField.fill('5.00');
        await page.waitForTimeout(1000);
        
        // Submit the form to trigger payment API call
        console.log('💾 Submitting form to trigger payment API call...');
        const saveButton = page.locator('#editBookingForm button[type="submit"]:has-text("Update Booking")');
        await saveButton.click();
        
        // Wait for API calls to complete
        await page.waitForTimeout(10000);
        
    } catch (error) {
        console.error('❌ Debug test failed:', error.message);
    } finally {
        console.log('🏁 Closing browser...');
        await browser.close();
    }
}

debugPaymentRequest().catch(console.error);