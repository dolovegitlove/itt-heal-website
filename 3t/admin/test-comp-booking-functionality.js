const { chromium } = require('playwright');

async function testCompBookingFunctionality() {
    console.log('🧪 Testing comp booking functionality...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        console.log('📱 Navigating to admin page...');
        await page.goto('https://ittheal.com/3t/admin/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(8000);
        
        console.log('✏️ Opening edit modal...');
        const editButton = page.locator('.booking-card .booking-actions button:has-text("Edit")').first();
        await editButton.click();
        await page.waitForTimeout(3000);
        
        // Wait for modal
        const editModal = page.locator('#editBookingModal');
        await editModal.waitFor({ state: 'visible', timeout: 10000 });
        console.log('✅ Edit modal opened');
        
        // Test 1: Check initial state
        console.log('🔍 Test 1: Checking initial state...');
        const initialCompChecked = await page.locator('#editCompBooking').isChecked();
        const initialPaymentMethod = await page.locator('#editBookingModal input[name="payment-method"]:checked').getAttribute('value');
        console.log(`Initial comp checkbox: ${initialCompChecked}, payment method: ${initialPaymentMethod}`);
        
        // Test 2: Select comp payment method
        console.log('🎁 Test 2: Selecting comp payment method...');
        const compRadio = page.locator('#edit-payment-method-comp');
        await compRadio.click();
        await page.waitForTimeout(1000);
        
        const compCheckedAfterCompSelection = await page.locator('#editCompBooking').isChecked();
        console.log(`Comp checkbox after comp selection: ${compCheckedAfterCompSelection}`);
        
        if (compCheckedAfterCompSelection) {
            console.log('✅ SUCCESS: Comp checkbox automatically checked when comp payment method selected');
        } else {
            console.log('❌ FAIL: Comp checkbox not automatically checked');
        }
        
        // Test 3: Select credit card method
        console.log('💳 Test 3: Selecting credit card payment method...');
        const creditCardRadio = page.locator('#editBookingModal input[name="payment-method"][value="credit_card"]');
        await creditCardRadio.click();
        await page.waitForTimeout(1000);
        
        const compCheckedAfterCardSelection = await page.locator('#editCompBooking').isChecked();
        console.log(`Comp checkbox after credit card selection: ${compCheckedAfterCardSelection}`);
        
        if (!compCheckedAfterCardSelection) {
            console.log('✅ SUCCESS: Comp checkbox automatically unchecked when credit card selected');
        } else {
            console.log('❌ FAIL: Comp checkbox still checked after credit card selection');
        }
        
        // Test 4: Select cash method
        console.log('💵 Test 4: Selecting cash payment method...');
        const cashRadio = page.locator('#editBookingModal input[name="payment-method"][value="cash"]');
        await cashRadio.click();
        await page.waitForTimeout(1000);
        
        const compCheckedAfterCashSelection = await page.locator('#editCompBooking').isChecked();
        console.log(`Comp checkbox after cash selection: ${compCheckedAfterCashSelection}`);
        
        if (!compCheckedAfterCashSelection) {
            console.log('✅ SUCCESS: Comp checkbox automatically unchecked when cash selected');
        } else {
            console.log('❌ FAIL: Comp checkbox still checked after cash selection');
        }
        
        // Test 5: Back to comp - add tip scenario
        console.log('🎁💰 Test 5: Testing comp booking with tip...');
        await compRadio.click();
        await page.waitForTimeout(1000);
        
        // Add tip amount
        const tipField = page.locator('#editTipAmount');
        await tipField.click();
        await tipField.fill('10.00');
        await page.waitForTimeout(1000);
        
        const compCheckedWithTip = await page.locator('#editCompBooking').isChecked();
        console.log(`Comp checkbox with $10 tip: ${compCheckedWithTip}`);
        
        if (compCheckedWithTip) {
            console.log('✅ SUCCESS: Comp booking with tip works correctly');
        } else {
            console.log('❌ FAIL: Comp booking with tip not working');
        }
        
        // Test 6: Switch to credit card for tip processing
        console.log('💳💰 Test 6: Switching to credit card for tip processing...');
        await creditCardRadio.click();
        await page.waitForTimeout(1000);
        
        const compCheckedAfterCardForTip = await page.locator('#editCompBooking').isChecked();
        const tipValue = await tipField.inputValue();
        console.log(`Comp checkbox after credit card for tip: ${compCheckedAfterCardForTip}, tip preserved: ${tipValue === '10.00'}`);
        
        console.log('🎯 Comp booking functionality test completed!');
        
        // Summary
        console.log('\n📋 SUMMARY:');
        console.log('1. Comp payment method → auto-checks comp booking: ' + (compCheckedAfterCompSelection ? '✅' : '❌'));
        console.log('2. Credit card payment method → unchecks comp booking: ' + (!compCheckedAfterCardSelection ? '✅' : '❌'));
        console.log('3. Cash payment method → unchecks comp booking: ' + (!compCheckedAfterCashSelection ? '✅' : '❌'));
        console.log('4. Comp booking with tip functionality: ' + (compCheckedWithTip ? '✅' : '❌'));
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        console.log('🏁 Keeping browser open for 15 seconds...');
        await page.waitForTimeout(15000);
        await browser.close();
    }
}

testCompBookingFunctionality().catch(console.error);