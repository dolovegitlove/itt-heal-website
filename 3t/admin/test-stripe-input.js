const { chromium } = require('playwright');

async function testStripeInput() {
    console.log('🚀 Testing Stripe card input field interaction...');
    
    const browser = await chromium.launch({
        headless: false,           // REQUIRED: Show real browser
        slowMo: 2000,             // Very slow for debugging
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
        await page.waitForTimeout(2000);
        
        // Select credit card payment method
        console.log('💳 Selecting credit card payment method...');
        const creditCardRadio = page.locator('#editBookingModal input[name="payment-method"][value="credit_card"]');
        await creditCardRadio.click();
        await page.waitForTimeout(3000);
        
        // Force show credit card section
        const creditCardSection = page.locator('#edit-credit-card-section');
        await creditCardSection.evaluate((el) => {
            el.style.display = 'block';
            el.style.visibility = 'visible';
        });
        await page.waitForTimeout(2000);
        
        console.log('⏳ Waiting for Stripe Elements to fully load...');
        await page.waitForTimeout(5000);
        
        // Debug: Check how many Stripe iframes exist
        const stripeFrames = await page.locator('iframe[name^="__privateStripeFrame"]').count();
        console.log(`🔍 Found ${stripeFrames} Stripe iframes`);
        
        if (stripeFrames === 0) {
            console.log('❌ No Stripe iframes found - element may not be initialized');
            await page.screenshot({ path: '/tmp/no-stripe-frames.png', fullPage: true });
            await browser.close();
            return;
        }
        
        // Try different approaches to interact with Stripe card element
        console.log('🧪 Attempting different input methods...');
        
        // Method 1: Try clicking on the iframe container first
        try {
            console.log('Method 1: Clicking iframe container...');
            const stripeContainer = page.locator('#stripe-card-element');
            await stripeContainer.click();
            await page.waitForTimeout(1000);
            
            // Then try to focus the card input inside
            const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
            const cardInput = cardFrame.locator('input[name="cardnumber"], input[data-elements-stable-field-name="cardNumber"]');
            
            console.log('Focusing card input...');
            await cardInput.focus();
            await page.waitForTimeout(1000);
            
            console.log('Typing card number...');
            await page.keyboard.type('4242424242424242', { delay: 100 });
            await page.waitForTimeout(2000);
            
            console.log('✅ Method 1 successful');
            
        } catch (error1) {
            console.log('❌ Method 1 failed:', error1.message);
            
            // Method 2: Try direct keyboard input after clicking container
            try {
                console.log('Method 2: Direct keyboard input...');
                const stripeContainer = page.locator('#stripe-card-element');
                await stripeContainer.click();
                await page.waitForTimeout(1000);
                
                // Type directly without targeting specific input
                await page.keyboard.type('4242424242424242', { delay: 200 });
                await page.waitForTimeout(2000);
                
                console.log('✅ Method 2 successful');
                
            } catch (error2) {
                console.log('❌ Method 2 failed:', error2.message);
                
                // Method 3: Try using evaluate to set value directly
                try {
                    console.log('Method 3: Direct value setting...');
                    const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
                    
                    await cardFrame.evaluate(() => {
                        const inputs = document.querySelectorAll('input');
                        if (inputs.length > 0) {
                            inputs[0].focus();
                            inputs[0].value = '4242424242424242';
                            inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                            inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    });
                    
                    await page.waitForTimeout(2000);
                    console.log('✅ Method 3 attempted');
                    
                } catch (error3) {
                    console.log('❌ Method 3 failed:', error3.message);
                }
            }
        }
        
        // Take screenshot to see current state
        await page.screenshot({ path: '/tmp/stripe-input-test.png', fullPage: true });
        console.log('📸 Screenshot saved to /tmp/stripe-input-test.png');
        
        // Check if any input was successful by looking for changes in the iframe
        const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
        try {
            const inputValue = await cardFrame.locator('input').first().inputValue();
            console.log(`💳 Current card input value: "${inputValue}"`);
            if (inputValue && inputValue.length > 0) {
                console.log('✅ Input was successful!');
            } else {
                console.log('❌ No input detected');
            }
        } catch (e) {
            console.log('⚠️ Could not check input value:', e.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        await page.screenshot({ path: '/tmp/stripe-input-error.png', fullPage: true });
    } finally {
        console.log('🏁 Keeping browser open for manual inspection... (closing in 10 seconds)');
        await page.waitForTimeout(10000);
        await browser.close();
    }
}

testStripeInput().catch(console.error);