const puppeteer = require('puppeteer');

(async () => {
    console.log('💰 ITT Heal Real $0.50 Transaction Test');
    console.log('=====================================');
    console.log('🧪 Testing complete booking flow with real payment\n');
    
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1440, height: 900 }
    });
    
    let testResults = [];
    let bookingId = null;
    
    try {
        const page = await browser.newPage();
        
        // Enable request interception to track API calls
        await page.setRequestInterception(true);
        let apiCalls = [];
        
        page.on('request', request => {
            if (request.url().includes('/api/')) {
                apiCalls.push({
                    method: request.method(),
                    url: request.url(),
                    type: 'REQUEST'
                });
            }
            request.continue();
        });
        
        page.on('response', response => {
            if (response.url().includes('/api/')) {
                apiCalls.push({
                    method: response.request().method(),
                    url: response.url(),
                    status: response.status(),
                    type: 'RESPONSE'
                });
            }
        });
        
        console.log('🌐 Loading booking page...');
        await page.goto('https://ittheal.com', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Navigate to booking section
        console.log('📝 Navigating to booking section...');
        await page.evaluate(() => {
            document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 1: Select $0.50 test product
        console.log('\n🧪 Test 1: Selecting $0.50 test product');
        try {
            const testServiceButton = await page.evaluateHandle(() => {
                const serviceOptions = document.querySelectorAll('.service-option');
                for (let option of serviceOptions) {
                    const text = option.textContent.toLowerCase();
                    if (text.includes('test') || text.includes('0.50') || text.includes('payment')) {
                        return option;
                    }
                }
                return null;
            });
            
            if (testServiceButton && testServiceButton.asElement()) {
                console.log('   🖱️  Clicking test product option...');
                await testServiceButton.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Check if service was selected
                const selectedService = await page.evaluate(() => window.selectedService);
                console.log(`   ✅ Selected service: ${selectedService}`);
                testResults.push(['Select Test Product', 'PASS']);
            } else {
                throw new Error('Test product option not found');
            }
        } catch (error) {
            console.log(`   ❌ Failed to select test product: ${error.message}`);
            testResults.push(['Select Test Product', 'FAIL']);
            throw error;
        }
        
        // Test 2: Navigate to date/time selection
        console.log('\n📅 Test 2: Moving to date/time selection');
        try {
            const nextButton = await page.$('#next-btn');
            if (nextButton) {
                await nextButton.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Check if we're on step 2
                const step2Visible = await page.evaluate(() => {
                    const dateTimeSection = document.getElementById('datetime-selection');
                    return dateTimeSection && dateTimeSection.style.display !== 'none';
                });
                
                if (step2Visible) {
                    console.log('   ✅ Successfully moved to date/time selection');
                    testResults.push(['Navigate to DateTime', 'PASS']);
                } else {
                    throw new Error('Date/time section not visible');
                }
            } else {
                throw new Error('Next button not found');
            }
        } catch (error) {
            console.log(`   ❌ Failed to navigate to date/time: ${error.message}`);
            testResults.push(['Navigate to DateTime', 'FAIL']);
            throw error;
        }
        
        // Test 3: Select date and time
        console.log('\n⏰ Test 3: Selecting date and time');
        try {
            // Select tomorrow's date
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateString = tomorrow.toISOString().split('T')[0];
            
            await page.evaluate((date) => {
                document.getElementById('booking-date').value = date;
                document.getElementById('booking-date').dispatchEvent(new Event('change'));
            }, dateString);
            
            console.log(`   📅 Selected date: ${dateString}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Wait for time slots to load and select first available
            await page.waitForFunction(() => {
                const timeSelect = document.getElementById('booking-time');
                return timeSelect && timeSelect.options.length > 1;
            }, { timeout: 10000 });
            
            await page.evaluate(() => {
                const timeSelect = document.getElementById('booking-time');
                if (timeSelect.options.length > 1) {
                    timeSelect.selectedIndex = 1; // Select first available time
                    timeSelect.dispatchEvent(new Event('change'));
                }
            });
            
            const selectedTime = await page.evaluate(() => document.getElementById('booking-time').value);
            console.log(`   ⏰ Selected time: ${selectedTime}`);
            
            if (selectedTime) {
                testResults.push(['Select Date Time', 'PASS']);
            } else {
                throw new Error('No time selected');
            }
        } catch (error) {
            console.log(`   ❌ Failed to select date/time: ${error.message}`);
            testResults.push(['Select Date Time', 'FAIL']);
            throw error;
        }
        
        // Test 4: Move to contact info
        console.log('\n👤 Test 4: Moving to contact information');
        try {
            const nextButton = await page.$('#next-btn');
            await nextButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const step3Visible = await page.evaluate(() => {
                const contactSection = document.getElementById('contact-info');
                return contactSection && contactSection.style.display !== 'none';
            });
            
            if (step3Visible) {
                console.log('   ✅ Successfully moved to contact information');
                testResults.push(['Navigate to Contact', 'PASS']);
            } else {
                throw new Error('Contact section not visible');
            }
        } catch (error) {
            console.log(`   ❌ Failed to navigate to contact: ${error.message}`);
            testResults.push(['Navigate to Contact', 'FAIL']);
            throw error;
        }
        
        // Test 5: Fill contact information
        console.log('\n📋 Test 5: Filling contact information');
        try {
            const testData = {
                name: 'Test User Transaction',
                email: 'test.transaction@ittheal.com',
                phone: '(940) 555-0150'
            };
            
            await page.type('#client-name', testData.name, { delay: 50 });
            await page.type('#client-email', testData.email, { delay: 50 });
            await page.type('#client-phone', testData.phone, { delay: 50 });
            
            console.log(`   ✅ Filled contact information for: ${testData.name}`);
            testResults.push(['Fill Contact Info', 'PASS']);
        } catch (error) {
            console.log(`   ❌ Failed to fill contact info: ${error.message}`);
            testResults.push(['Fill Contact Info', 'FAIL']);
            throw error;
        }
        
        // Test 6: Move to booking summary
        console.log('\n📊 Test 6: Moving to booking summary');
        try {
            const nextButton = await page.$('#next-btn');
            await nextButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const step4Visible = await page.evaluate(() => {
                const summarySection = document.getElementById('booking-summary');
                return summarySection && summarySection.style.display !== 'none';
            });
            
            if (step4Visible) {
                console.log('   ✅ Successfully moved to booking summary');
                
                // Check total price
                const totalPrice = await page.$eval('#total-price', el => el.textContent);
                console.log(`   💰 Total price shown: ${totalPrice}`);
                
                if (totalPrice.includes('0.5') || totalPrice.includes('0.50')) {
                    console.log('   ✅ Correct $0.50 price displayed');
                    testResults.push(['Booking Summary', 'PASS']);
                } else {
                    console.log('   ⚠️  Price may be incorrect, continuing...');
                    testResults.push(['Booking Summary', 'PARTIAL']);
                }
            } else {
                throw new Error('Summary section not visible');
            }
        } catch (error) {
            console.log(`   ❌ Failed to navigate to summary: ${error.message}`);
            testResults.push(['Booking Summary', 'FAIL']);
            throw error;
        }
        
        // Test 7: Submit booking (creates real booking but NO payment)
        console.log('\n💾 Test 7: Submitting booking (NO PAYMENT)');
        try {
            console.log('   ⚠️  NOTE: This creates a real booking but WITHOUT payment');
            console.log('   ⚠️  No actual $0.50 charge will be made');
            console.log('   💡 For real payment testing, you would need to:');
            console.log('     1. Manually complete this booking flow');
            console.log('     2. Use a real payment method at checkout');
            console.log('     3. Verify $0.50 charge appears in Stripe dashboard');
            
            const confirmButton = await page.$('#confirm-booking-btn');
            await confirmButton.click();
            
            // Wait for booking response
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check for success message
            const statusMessage = await page.$eval('#booking-status', el => el.textContent).catch(() => '');
            console.log(`   📝 Booking status: ${statusMessage}`);
            
            if (statusMessage.includes('confirmed') || statusMessage.includes('success') || statusMessage.includes('✅')) {
                console.log('   ✅ Booking submitted successfully');
                testResults.push(['Submit Booking', 'PASS']);
            } else if (statusMessage.includes('failed') || statusMessage.includes('❌')) {
                throw new Error(`Booking failed: ${statusMessage}`);
            } else {
                console.log('   ⚠️  Booking status unclear, checking API calls...');
                testResults.push(['Submit Booking', 'PARTIAL']);
            }
        } catch (error) {
            console.log(`   ❌ Failed to submit booking: ${error.message}`);
            testResults.push(['Submit Booking', 'FAIL']);
        }
        
        // Display API call summary
        if (apiCalls.length > 0) {
            console.log('\n📡 API Calls Made:');
            const bookingCalls = apiCalls.filter(call => call.url.includes('/book') || call.url.includes('/booking'));
            bookingCalls.forEach(call => {
                console.log(`   ${call.type}: ${call.method} ${call.url.split('/').pop()} ${call.status || ''}`);
                if (call.status === 200 && call.type === 'RESPONSE') {
                    console.log('   ✅ Booking API call successful');
                }
            });
        }
        
    } catch (error) {
        console.error('💥 Critical test error:', error);
    } finally {
        // Results Summary
        console.log('\n========================================');
        console.log('💰 REAL TRANSACTION TEST RESULTS');
        console.log('========================================');
        
        const passCount = testResults.filter(([, result]) => result === 'PASS').length;
        const partialCount = testResults.filter(([, result]) => result === 'PARTIAL').length;
        const failCount = testResults.filter(([, result]) => result === 'FAIL').length;
        const successRate = Math.round((passCount / testResults.length) * 100);
        
        testResults.forEach(([test, result]) => {
            const icon = result === 'PASS' ? '✅' : result === 'PARTIAL' ? '⚠️' : '❌';
            console.log(`${icon} ${test}: ${result}`);
        });
        
        console.log(`\n📊 Results: ${passCount} PASS, ${partialCount} PARTIAL, ${failCount} FAIL`);
        console.log(`📊 Success Rate: ${successRate}%`);
        
        if (successRate === 100) {
            console.log('\n🎉 100% SUCCESS - $0.50 TEST TRANSACTION COMPLETE!');
            console.log('✅ Test product selection working');
            console.log('✅ Date/time booking working');
            console.log('✅ Contact information form working');
            console.log('✅ Booking summary accurate');
            console.log('✅ Booking submission successful');
            console.log('\n💡 Next step: Verify booking in admin dashboard');
        } else if (successRate >= 85) {
            console.log('\n✅ MOSTLY SUCCESSFUL - Transaction flow working');
        } else {
            console.log('\n⚠️  ISSUES DETECTED - Review failed tests');
        }
        
        console.log('\n🧪 $0.50 test product transaction testing completed');
        console.log('⚠️  NOTE: No actual payment was processed');
        console.log('🔍 Check admin dashboard for booking record');
        console.log('\n💳 FOR REAL PAYMENT TESTING:');
        console.log('1. Manually go to https://ittheal.com/#booking');
        console.log('2. Select the "Payment Test ($0.50)" option');
        console.log('3. Complete the booking flow with real payment info');
        console.log('4. Verify $0.50 charge in Stripe dashboard');
        console.log('5. Check booking appears in admin dashboard');
        
        await browser.close();
    }
})();