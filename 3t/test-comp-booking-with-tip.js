const { chromium } = require('playwright');

async function testCompBookingWithTip() {
    console.log('🎯 Testing Comp Booking with Tip Functionality...');
    
    const browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        // Navigate to admin dashboard
        console.log('📱 Loading admin dashboard...');
        await page.goto('https://ittheal.com/3t/admin/', { waitUntil: 'networkidle' });
        
        // Wait for dashboard to load
        await page.waitForTimeout(3000);
        
        // Click on Bookings section
        console.log('📋 Navigating to bookings section...');
        await page.click('[data-section="bookings"]');
        await page.waitForTimeout(1000);
        
        // Click "Create New Booking" button
        console.log('➕ Opening create booking modal...');
        const createButton = await page.locator('button:has-text("Create New Booking")');
        if (await createButton.count() > 0) {
            await createButton.click();
            await page.waitForTimeout(1000);
            
            // Fill out basic booking information
            console.log('📝 Filling booking details...');
            await page.fill('#clientName', 'Test Comp Client');
            await page.fill('#clientEmail', 'testcomp@example.com');
            await page.fill('#clientPhone', '555-0123');
            
            // Set service type
            await page.selectOption('#serviceType', '60min_massage');
            await page.waitForTimeout(500);
            
            // Set to comp booking
            console.log('🎁 Setting payment status to comp...');
            await page.selectOption('#paymentStatus', 'comp');
            await page.waitForTimeout(500);
            
            // Add a tip amount
            console.log('💰 Adding tip amount...');
            await page.fill('#tipAmount', '20.00');
            await page.waitForTimeout(1000);
            
            // Check if payment method automatically switches to credit card
            const selectedPaymentMethod = await page.locator('input[name="create_payment_method"]:checked').getAttribute('value');
            console.log('💳 Selected payment method:', selectedPaymentMethod);
            
            // Check if credit card section is visible
            const creditCardVisible = await page.locator('#create-credit-card-section').isVisible();
            console.log('🔍 Credit card section visible:', creditCardVisible);
            
            // Check final price
            const finalPrice = await page.locator('#finalPrice').inputValue();
            console.log('💵 Final price:', finalPrice);
            
            // Verify the pricing note
            const priceNote = await page.locator('#finalPriceNote').textContent();
            console.log('📝 Price note:', priceNote);
            
            // Test results
            const expectedTipOnly = parseFloat(finalPrice) === 20.00;
            const correctPaymentMethod = selectedPaymentMethod === 'credit_card';
            const correctNote = priceNote.includes('Tip Amount Only');
            
            console.log('\n📊 Test Results:');
            console.log(`   ✅ Comp booking shows tip-only pricing: ${expectedTipOnly}`);
            console.log(`   ✅ Payment method auto-switched to credit card: ${correctPaymentMethod}`);
            console.log(`   ✅ Price note shows "Tip Amount Only": ${correctNote}`);
            console.log(`   ✅ Credit card section visible for tip processing: ${creditCardVisible}`);
            
            if (expectedTipOnly && correctPaymentMethod && correctNote && creditCardVisible) {
                console.log('🎉 Comp booking with tip functionality working correctly!');
            } else {
                console.log('⚠️ Some issues found with comp booking with tip functionality');
            }
            
        } else {
            console.log('❌ Create New Booking button not found');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    testCompBookingWithTip();
}

module.exports = { testCompBookingWithTip };