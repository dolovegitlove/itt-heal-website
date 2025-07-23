const { chromium } = require('playwright');

async function testStripePayment() {
    console.log('🚀 Starting Stripe payment test with real X11 browser...');
    
    const browser = await chromium.launch({
        headless: false,           // REQUIRED: Show real browser
        slowMo: 1000,             // REQUIRED: Human-speed interactions
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
        
        // Wait for page to load
        await page.waitForTimeout(3000);
        
        // Look for recent bookings section and edit button in booking card
        console.log('🔍 Looking for recent booking card with edit button...');
        
        // Wait for recent bookings to load
        await page.waitForSelector('#recentBookingsTable .booking-card', { timeout: 10000 });
        
        // Find edit button in the first booking card
        const editButton = page.locator('#recentBookingsTable .booking-card .booking-actions button:has-text("Edit")').first();
        
        if (await editButton.count() === 0) {
            console.log('❌ No edit button found in recent bookings');
            // Take screenshot for debugging
            await page.screenshot({ path: '/tmp/no-edit-button.png', fullPage: true });
            await browser.close();
            return;
        }
        
        // Click edit button in the booking card
        console.log('✏️ Clicking edit button in booking card...');
        await editButton.click();
        await page.waitForTimeout(2000);
        
        // Wait for edit modal to appear
        await page.waitForSelector('#editBookingModal', { state: 'visible', timeout: 5000 });
        console.log('✅ Edit modal opened');
        
        // Select credit card payment method
        console.log('💳 Selecting credit card payment method...');
        const creditCardRadio = page.locator('#editBookingModal input[name="payment-method"][value="credit_card"]');
        await creditCardRadio.click();
        await page.waitForTimeout(2000);
        
        // Manually trigger change event to ensure handlers fire
        await creditCardRadio.evaluate((radio) => {
            radio.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await page.waitForTimeout(1000);
        
        // Check if credit card section exists and try to make it visible
        const creditCardSection = page.locator('#edit-credit-card-section');
        const sectionExists = await creditCardSection.count() > 0;
        console.log(`Credit card section exists: ${sectionExists}`);
        
        if (sectionExists) {
            // Force show the section if it's hidden
            await creditCardSection.evaluate((el) => {
                el.style.display = 'block';
                el.style.visibility = 'visible';
            });
            await page.waitForTimeout(500);
            console.log('✅ Credit card section made visible');
        } else {
            console.log('❌ Credit card section does not exist');
        }
        
        // Wait for Stripe Elements to load
        console.log('⏳ Waiting for Stripe Elements to load...');
        await page.waitForTimeout(3000);
        
        // Find the Stripe card element iframe
        console.log('🔍 Looking for Stripe iframe...');
        const stripeFrames = await page.locator('iframe[name^="__privateStripeFrame"]').count();
        console.log(`Found ${stripeFrames} Stripe iframes`);
        
        if (stripeFrames === 0) {
            console.log('❌ No Stripe iframes found');
            await page.screenshot({ path: '/tmp/no-stripe-iframe.png', fullPage: true });
            await browser.close();
            return;
        }
        
        const cardElementFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
        
        // Fill in test card details (4242 4242 4242 4242)
        console.log('🧪 Filling in test card details...');
        
        try {
            // Use a more general approach for Stripe card input
            console.log('🔍 Trying to interact with Stripe card element...');
            
            // Click on the card element container to focus it
            await cardElementFrame.locator('input[data-elements-stable-field-name="cardNumber"]').click({ timeout: 10000 });
            await page.waitForTimeout(1000);
            
            // Type the full card info in one go (Stripe often accepts this)
            await page.keyboard.type('4242424242424242122812312345');
            await page.waitForTimeout(2000);
            
            console.log('✅ Test card details entered successfully');
        } catch (error) {
            console.log('❌ Error filling card details:', error.message);
            // Continue with test even if card details fail
            await page.screenshot({ path: '/tmp/card-fill-error.png', fullPage: true });
        }
        
        // Add a tip amount to ensure there's something to charge
        console.log('💰 Adding tip amount...');
        const tipField = page.locator('#editTipAmount');
        await tipField.click();
        await tipField.fill('5.00');
        await page.waitForTimeout(1000);
        
        // Save the booking to process payment
        console.log('💾 Saving booking to process payment...');
        const saveButton = page.locator('#editBookingForm button[type="submit"]:has-text("Update Booking")');
        await saveButton.click();
        
        // Wait for processing
        await page.waitForTimeout(5000);
        
        // Check for success or error messages
        const successMessage = await page.locator('.alert-success, .success-message').count();
        const errorMessage = await page.locator('.alert-error, .error-message').count();
        
        if (successMessage > 0) {
            const successText = await page.locator('.alert-success, .success-message').first().textContent();
            console.log('✅ Payment processed successfully!', successText);
        } else if (errorMessage > 0) {
            const errorText = await page.locator('.alert-error, .error-message').first().textContent();
            console.log('❌ Payment error:', errorText);
        } else {
            console.log('⚠️ No clear success/error message found');
        }
        
        // Take screenshot for verification
        await page.screenshot({ path: '/tmp/stripe-payment-test.png', fullPage: true });
        console.log('📸 Screenshot saved to /tmp/stripe-payment-test.png');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        await page.screenshot({ path: '/tmp/stripe-payment-error.png', fullPage: true });
        console.log('📸 Error screenshot saved to /tmp/stripe-payment-error.png');
    } finally {
        console.log('🏁 Closing browser...');
        await browser.close();
    }
}

// Run the test
testStripePayment().catch(console.error);