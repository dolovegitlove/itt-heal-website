const { chromium } = require('playwright');

async function testNewCompFunctionality() {
    console.log('🧪 Testing new independent comp booking functionality...');
    
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
        
        const editModal = page.locator('#editBookingModal');
        await editModal.waitFor({ state: 'visible', timeout: 10000 });
        console.log('✅ Edit modal opened');
        
        // Test 1: Check initial state
        console.log('🔍 Test 1: Initial state...');
        const initialCompChecked = await page.locator('#editCompBooking').isChecked();
        const initialFinalPrice = await page.locator('#editFinalPrice').inputValue();
        const initialFinalPriceNote = await page.locator('#editFinalPriceNote').textContent();
        console.log(`Initial: comp=${initialCompChecked}, final_price=${initialFinalPrice}, note="${initialFinalPriceNote}"`);
        
        // Test 2: Check comp booking
        console.log('🎁 Test 2: Checking comp booking...');
        await page.locator('#editCompBooking').check();
        await page.waitForTimeout(1000);
        
        const compChecked = await page.locator('#editCompBooking').isChecked();
        const compFinalPrice = await page.locator('#editFinalPrice').inputValue();
        const compFinalPriceNote = await page.locator('#editFinalPriceNote').textContent();
        const compTipNote = await page.locator('#editTipNote').textContent();
        
        console.log(`After comp check: comp=${compChecked}, final_price=${compFinalPrice}`);
        console.log(`Final price note: "${compFinalPriceNote}"`);
        console.log(`Tip note: "${compTipNote}"`);
        
        // Test 3: Add tip to comp booking
        console.log('💰 Test 3: Adding $15 tip to comp booking...');
        const tipField = page.locator('#editTipAmount');
        await tipField.click();
        await tipField.fill('15.00');
        await page.waitForTimeout(1000);
        
        const tipValue = await tipField.inputValue();
        const finalPriceWithTip = await page.locator('#editFinalPrice').inputValue();
        console.log(`Tip added: ${tipValue}, final_price with tip: ${finalPriceWithTip}`);
        
        // Test 4: Test payment method selection works independently
        console.log('💳 Test 4: Testing payment method independence...');
        
        // Select credit card
        await page.locator('#editBookingModal input[name="payment-method"][value="credit_card"]').check();
        await page.waitForTimeout(1000);
        const ccSelected = await page.locator('#editBookingModal input[name="payment-method"][value="credit_card"]').isChecked();
        const compStillChecked1 = await page.locator('#editCompBooking').isChecked();
        console.log(`Credit card selected: ${ccSelected}, comp still checked: ${compStillChecked1}`);
        
        // Select cash
        await page.locator('#editBookingModal input[name="payment-method"][value="cash"]').check();
        await page.waitForTimeout(1000);
        const cashSelected = await page.locator('#editBookingModal input[name="payment-method"][value="cash"]').isChecked();
        const compStillChecked2 = await page.locator('#editCompBooking').isChecked();
        console.log(`Cash selected: ${cashSelected}, comp still checked: ${compStillChecked2}`);
        
        // Test 5: Uncheck comp booking
        console.log('❌ Test 5: Unchecking comp booking...');
        await page.locator('#editCompBooking').uncheck();
        await page.waitForTimeout(1000);
        
        const compUnchecked = await page.locator('#editCompBooking').isChecked();
        const regularFinalPrice = await page.locator('#editFinalPrice').inputValue();
        const regularFinalPriceNote = await page.locator('#editFinalPriceNote').textContent();
        const regularTipNote = await page.locator('#editTipNote').textContent();
        
        console.log(`After uncheck: comp=${compUnchecked}, final_price=${regularFinalPrice}`);
        console.log(`Regular final price note: "${regularFinalPriceNote}"`);
        console.log(`Regular tip note: "${regularTipNote}"`);
        
        // Summary of test results
        console.log('\\n📋 TEST SUMMARY:');
        console.log(`✅ Comp checkbox works independently: ${compStillChecked1 && compStillChecked2 ? '✅' : '❌'}`);
        console.log(`✅ Final price calculates correctly for comp: ${parseFloat(finalPriceWithTip) === 15.00 ? '✅' : '❌'}`);
        console.log(`✅ UI notes update correctly: ${compFinalPriceNote.includes('Tip Amount Only') ? '✅' : '❌'}`);
        console.log(`✅ Payment methods work independently: ${ccSelected !== cashSelected ? '✅' : '❌'}`);
        
        console.log('\\n🎯 New comp booking functionality test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        console.log('🏁 Keeping browser open for 15 seconds...');
        await page.waitForTimeout(15000);
        await browser.close();
    }
}

testNewCompFunctionality().catch(console.error);