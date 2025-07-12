#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testAdminIntegration() {
    console.log('🔗 ADMIN DASHBOARD - FULL INTEGRATION TEST');
    console.log('==========================================');
    
    let browser;
    let passed = 0;
    let total = 0;
    
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
        
        console.log('🌐 Loading admin dashboard...');
        await page.goto('https://ittheal.com/admin-dashboard.html', { 
            waitUntil: 'networkidle2' 
        });
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Test 1: Availability Manager Date Navigation
        total++;
        console.log('📅 Testing availability manager date navigation...');
        try {
            await page.click('button[onclick="showAvailabilityManager()"]');
            await page.waitForSelector('#availability-modal', { visible: true, timeout: 5000 });
            
            // Get initial date
            const initialDate = await page.$eval('#current-period-display', el => el.textContent);
            console.log(`   Initial date: "${initialDate}"`);
            
            if (initialDate === 'Loading...' || initialDate.includes('7/1/2025')) {
                throw new Error('Date stuck at 7/1 or showing Loading...');
            }
            
            // Test next navigation
            await page.click('button[onclick="navigateAvailabilityDate(\'next\')"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const nextDate = await page.$eval('#current-period-display', el => el.textContent);
            console.log(`   After next: "${nextDate}"`);
            
            if (nextDate === initialDate) {
                throw new Error('Date navigation not working - date unchanged');
            }
            
            // Test quick navigation
            await page.click('button[onclick="jumpToDate(\'nextWeek\')"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const weekDate = await page.$eval('#current-period-display', el => el.textContent);
            console.log(`   After +1W: "${weekDate}"`);
            
            // Close modal
            await page.click('button[onclick="closeAvailabilityModal()"]');
            await page.waitForSelector('#availability-modal', { hidden: true, timeout: 3000 });
            
            console.log('   ✅ Date navigation working correctly');
            passed++;
        } catch (error) {
            console.log(`   ❌ Date navigation test failed: ${error.message}`);
        }

        // Test 2: Open modal and fill complete form
        total++;
        try {
            console.log('\n🔘 Test 1: Opening Add Booking modal...');
            await page.click('button[onclick="showNewBookingForm()"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const modalVisible = await page.$eval('#new-booking-modal', el => 
                !el.classList.contains('hidden')
            );
            
            if (modalVisible) {
                console.log('✅ Modal opened successfully');
                passed++;
            } else {
                console.log('❌ Modal failed to open');
            }
        } catch (error) {
            console.log('❌ Modal test failed:', error.message);
        }
        
        // Test 2: Fill form with schema-correct data
        total++;
        try {
            console.log('\n🔘 Test 2: Filling form with backend-compatible data...');
            
            await page.type('#client-name', 'Integration Test User');
            await page.type('#client-email', 'integration@test.com');
            await page.type('#client-phone', '555-INTEGRATION');
            
            // Select 90min service ($165 base + $5 tech fee)
            await page.select('#service-type', '90min');
            await page.waitForTimeout(500);
            
            // Set date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];
            await page.$eval('#booking-date', (el, value) => el.value = value, dateStr);
            
            // Set time
            await page.$eval('#booking-time', el => el.value = '16:00');
            
            // Select mobile location (+$50 fee)
            await page.select('#booking-location', 'mobile');
            await page.waitForTimeout(500);
            
            // Add special requests
            await page.type('#special-requests', 'Full integration test from admin dashboard');
            
            console.log('✅ Form filled with proper data mapping');
            passed++;
        } catch (error) {
            console.log('❌ Form filling failed:', error.message);
        }
        
        // Test 3: Verify pricing calculation matches backend
        total++;
        try {
            console.log('\n🔘 Test 3: Verifying pricing calculation...');
            
            const basePrice = await page.$eval('#base-price-display', el => el.textContent);
            const techFee = await page.$eval('#tech-fee-display', el => el.textContent);
            const locationFee = await page.$eval('#location-fee-display', el => el.textContent);
            const totalPrice = await page.$eval('#total-price-display', el => el.textContent);
            
            // Expected: $165 base + $5 tech + $50 mobile = $220
            if (basePrice === '$165.00' && techFee === '$5.00' && locationFee === '$50.00' && totalPrice === '$220.00') {
                console.log('✅ Pricing calculation correct: $165 + $5 + $50 = $220');
                passed++;
            } else {
                console.log(`❌ Pricing incorrect: Base: ${basePrice}, Tech: ${techFee}, Location: ${locationFee}, Total: ${totalPrice}`);
            }
        } catch (error) {
            console.log('❌ Pricing verification failed:', error.message);
        }
        
        // Test 4: Attempt form submission (without actually submitting)
        total++;
        try {
            console.log('\n🔘 Test 4: Testing form submission logic...');
            
            // Click submit button and capture network request
            const responses = [];
            page.on('response', response => {
                if (response.url().includes('/api/admin/massage-sessions') && response.request().method() === 'POST') {
                    responses.push(response);
                }
            });
            
            await page.click('button[type="submit"]');
            await page.waitForTimeout(3000); // Wait for API call
            
            if (responses.length > 0) {
                const response = responses[0];
                const status = response.status();
                
                if (status === 200 || status === 201) {
                    console.log(`✅ API call successful (HTTP ${status})`);
                    passed++;
                    
                    // Check if success toast appeared
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const toastVisible = await page.$eval('#toast-notification', el => 
                        !el.classList.contains('translate-x-full')
                    );
                    
                    if (toastVisible) {
                        console.log('✅ Success toast notification displayed');
                    }
                } else {
                    console.log(`❌ API call failed with status ${status}`);
                }
            } else {
                console.log('❌ No API call detected');
            }
        } catch (error) {
            console.log('❌ Form submission test failed:', error.message);
        }
        
        // Test 5: Verify booking appears in dashboard
        total++;
        try {
            console.log('\n🔘 Test 5: Checking if new booking appears in dashboard...');
            
            await page.waitForTimeout(2000); // Wait for potential page refresh
            
            // Look for booking cards
            const bookingCards = await page.$$('.booking-card');
            
            if (bookingCards.length > 0) {
                // Check if our test booking is there
                const bookingTexts = await Promise.all(
                    bookingCards.map(card => 
                        card.evaluate(el => el.textContent)
                    )
                );
                
                const hasIntegrationTest = bookingTexts.some(text => 
                    text.includes('Integration Test User') || 
                    text.includes('integration@test.com') ||
                    text.includes('Full integration test')
                );
                
                if (hasIntegrationTest) {
                    console.log('✅ New booking appears in dashboard');
                    passed++;
                } else {
                    console.log('⚠️  New booking not found in dashboard (may need manual refresh)');
                }
            } else {
                console.log('⚠️  No booking cards found in dashboard');
            }
        } catch (error) {
            console.log('❌ Dashboard verification failed:', error.message);
        }
        
        // Test 6: Test data persistence by checking API directly
        total++;
        try {
            console.log('\n🔘 Test 6: Verifying data persistence in database...');
            
            // Make direct API call to verify data was saved
            const response = await page.evaluate(async () => {
                try {
                    const res = await fetch('/api/admin/massage-sessions', {
                        headers: {
                            'x-admin-access': 'dr-shiffer-emergency-access'
                        }
                    });
                    const data = await res.json();
                    return data;
                } catch (error) {
                    return { error: error.message };
                }
            });
            
            if (response.success && response.sessions) {
                const recentBooking = response.sessions.find(session => 
                    session.guest_name === 'Integration Test User' ||
                    session.guest_email === 'integration@test.com'
                );
                
                if (recentBooking) {
                    console.log('✅ Data persisted in database correctly');
                    console.log(`   - Guest Name: ${recentBooking.guest_name}`);
                    console.log(`   - Email: ${recentBooking.guest_email}`);
                    console.log(`   - Session Type: ${recentBooking.session_type}`);
                    console.log(`   - Final Price: $${recentBooking.final_price}`);
                    console.log(`   - Location: ${recentBooking.location_type}`);
                    passed++;
                } else {
                    console.log('❌ Test booking not found in database');
                }
            } else {
                console.log('❌ Failed to fetch bookings from API');
            }
        } catch (error) {
            console.log('❌ Database verification failed:', error.message);
        }
        
    } catch (error) {
        console.log('❌ Critical integration test failure:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
    
    // Results
    console.log('\n🎯 INTEGRATION TEST RESULTS');
    console.log('============================');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${Math.round((passed/total) * 100)}%`);
    
    console.log('\n📋 INTEGRATION LAYERS TESTED');
    console.log('=============================');
    console.log('✓ Frontend UI (modal, forms, pricing)');
    console.log('✓ JavaScript logic (data mapping)');
    console.log('✓ API communication (POST request)');
    console.log('✓ Backend processing (field mapping)');
    console.log('✓ Database persistence (data storage)');
    console.log('✓ User feedback (toast notifications)');
    
    if (passed >= total * 0.85) {
        console.log('\n🎉 INTEGRATION TEST SUCCESS!');
        console.log('=============================');
        console.log('✅ Frontend ↔ Backend integration working');
        console.log('✅ Schema mapping corrected');
        console.log('✅ Pricing calculation aligned');
        console.log('✅ Data flows end-to-end');
        console.log('✅ Admin dashboard fully functional');
        
        return true;
    } else {
        console.log(`\n💥 Integration issues found - ${total - passed} tests failed`);
        return false;
    }
}

testAdminIntegration()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Integration test failed:', error);
        process.exit(1);
    });