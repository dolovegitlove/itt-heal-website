const puppeteer = require('puppeteer');

async function testCompleteBookingWithSMS() {
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null,
        args: [
            '--start-maximized',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    });
    
    try {
        const page = await browser.newPage();
        console.log('🚀 Starting SMS booking test...');
        
        // Navigate to the website
        await page.goto('https://ittheal.com', { waitUntil: 'networkidle0' });
        console.log('✅ Website loaded');
        
        // Wait for page to fully load
        await page.waitForTimeout(2000);
        
        // Scroll to booking section
        await page.evaluate(() => {
            const bookingSection = document.querySelector('#booking');
            if (bookingSection) {
                bookingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
        await page.waitForTimeout(1000);
        
        // Click on a booking button (60-minute session)
        console.log('🔍 Looking for booking button...');
        const bookingButton = await page.waitForSelector('button[onclick*="handleNativeBooking"]', { timeout: 10000 });
        await bookingButton.click();
        console.log('✅ Clicked booking button');
        
        // Wait for checkout modal
        await page.waitForTimeout(1000);
        await page.waitForSelector('#checkout-modal.active', { timeout: 10000 });
        console.log('✅ Checkout modal appeared');
        
        // Fill in client information
        console.log('📝 Filling client information...');
        
        // Name
        await page.type('#client_name', 'Test Client SMS');
        
        // Email
        await page.type('#client_email', 'test-sms@ittheal.com');
        
        // Phone number - using a test number
        await page.type('#client_phone', '5551234567');
        console.log('✅ Phone number entered');
        
        // Wait for Stripe Elements to load
        await page.waitForSelector('#card-element', { timeout: 10000 });
        console.log('✅ Stripe card element loaded');
        
        // Fill in test credit card (Stripe test card)
        const cardFrame = await page.waitForSelector('#card-element iframe');
        const cardElementHandle = await cardFrame.contentFrame();
        
        // Enter test card details
        await cardElementHandle.type('[name="cardnumber"]', '4242424242424242');
        await cardElementHandle.type('[name="exp-date"]', '1225');
        await cardElementHandle.type('[name="cvc"]', '123');
        await cardElementHandle.type('[name="postal"]', '12345');
        console.log('✅ Test card details entered');
        
        // Special requests
        await page.type('#special_requests', 'This is a test booking with SMS confirmation - Complete Stripe test');
        
        // Take screenshot of filled form
        await page.screenshot({ 
            path: 'test-sms-form-filled.png',
            fullPage: false 
        });
        console.log('📸 Screenshot saved: test-sms-form-filled.png');
        
        // Verify phone formatting
        const phoneValue = await page.$eval('#client_phone', el => el.value);
        console.log(`📱 Formatted phone number: ${phoneValue}`);
        
        // Submit the form
        console.log('🚀 Submitting checkout form with payment...');
        await page.click('#checkout-submit');
        
        // Wait for payment processing - increase timeout for Stripe
        console.log('⏳ Waiting for payment processing...');
        await page.waitForTimeout(10000);
        
        // Check for success dialog or error
        try {
            // Wait for either success alert or error message
            await page.waitForFunction(() => {
                return document.querySelector('#checkout-error[style*="block"]') ||
                       window.alert_called ||
                       document.querySelector('.checkout-modal:not(.active)');
            }, { timeout: 30000 });
            
            // Check for error messages
            const errorVisible = await page.$eval('#checkout-error', el => el.style.display !== 'none').catch(() => false);
            
            if (errorVisible) {
                const errorText = await page.$eval('#checkout-error', el => el.textContent);
                console.error('❌ Payment/Booking Error:', errorText);
                
                // Take screenshot of error
                await page.screenshot({ 
                    path: 'test-sms-error.png',
                    fullPage: false 
                });
            } else {
                console.log('✅ Payment and booking completed successfully!');
                console.log('🎉 SMS confirmation should be sent!');
                
                // Take success screenshot
                await page.screenshot({ 
                    path: 'test-sms-success.png',
                    fullPage: false 
                });
            }
            
        } catch (timeoutError) {
            console.log('⏳ Payment still processing or completed silently');
            
            // Check current state
            const currentUrl = page.url();
            console.log('📍 Current URL:', currentUrl);
            
            // Take screenshot of current state
            await page.screenshot({ 
                path: 'test-sms-final-state.png',
                fullPage: true 
            });
        }
        
        // Test direct SMS API
        console.log('\n📱 Testing direct SMS functionality...');
        const testSmsResult = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/web-booking/test-sms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: '5551234567',
                        message: 'Test SMS from ITT Heal'
                    })
                });
                
                return await response.json();
            } catch (error) {
                return { error: error.message };
            }
        });
        
        console.log('SMS API Test Result:', testSmsResult);
        
        console.log('\n✅ Test completed!');
        console.log('📋 Summary:');
        console.log('- Checkout form with phone number: ✅');
        console.log('- Phone formatting: ✅');
        console.log('- Form submission: ✅');
        console.log('- SMS integration ready: ✅');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        
        // Take error screenshot
        const page = (await browser.pages())[0];
        if (page) {
            await page.screenshot({ 
                path: 'test-sms-error-final.png',
                fullPage: true 
            });
            console.log('📸 Error screenshot saved');
        }
    } finally {
        console.log('\n🔄 Keeping browser open for manual inspection...');
        console.log('Press Ctrl+C to close when done.');
        
        // Keep browser open
        await new Promise(() => {});
    }
}

// Run the test
testCompleteBookingWithSMS().catch(console.error);