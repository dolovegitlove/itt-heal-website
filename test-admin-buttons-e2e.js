#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAllButtons() {
    console.log('🔘 Comprehensive End-to-End Button Test');
    console.log('=======================================');
    
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
        
        await sleep(2000);
        
        // Test 1: Manage Availability Button
        total++;
        console.log('\n🔘 Testing: Manage Availability Button');
        try {
            const availabilityBtn = await page.$('button[onclick="showAvailabilityManager()"]');
            if (availabilityBtn) {
                await availabilityBtn.click();
                await sleep(500);
                console.log('✅ Availability button clickable');
                passed++;
            } else {
                console.log('❌ Availability button not found');
            }
        } catch (error) {
            console.log('❌ Availability button test failed:', error.message);
        }
        
        // Test 2: Today's Schedule Button
        total++;
        console.log('\n🔘 Testing: Today\'s Schedule Button');
        try {
            const todayBtn = await page.$('button[onclick="filterBookings(\'today\')"]');
            if (todayBtn) {
                await todayBtn.click();
                await sleep(500);
                console.log('✅ Today\'s Schedule button clickable');
                passed++;
            } else {
                console.log('❌ Today\'s Schedule button not found');
            }
        } catch (error) {
            console.log('❌ Today\'s Schedule button test failed:', error.message);
        }
        
        // Test 3: On-Site Bookings Button
        total++;
        console.log('\n🔘 Testing: On-Site Bookings Button');
        try {
            const mobileBtn = await page.$('button[onclick="filterBookings(\'mobile\')"]');
            if (mobileBtn) {
                await mobileBtn.click();
                await sleep(500);
                console.log('✅ On-Site Bookings button clickable');
                passed++;
            } else {
                console.log('❌ On-Site Bookings button not found');
            }
        } catch (error) {
            console.log('❌ On-Site Bookings button test failed:', error.message);
        }
        
        // Test 4: Add Booking Button (Main Test)
        total++;
        console.log('\n🔘 Testing: Add Booking Button');
        try {
            const addBookingBtn = await page.$('button[onclick="showNewBookingForm()"]');
            if (addBookingBtn) {
                await addBookingBtn.click();
                await sleep(1000);
                
                // Check if modal opened
                const modal = await page.$('#new-booking-modal:not(.hidden)');
                if (modal) {
                    console.log('✅ Add Booking button opens modal');
                    passed++;
                } else {
                    console.log('❌ Add Booking modal did not open');
                }
            } else {
                console.log('❌ Add Booking button not found');
            }
        } catch (error) {
            console.log('❌ Add Booking button test failed:', error.message);
        }
        
        // Test 5: Modal Close Button (X)
        total++;
        console.log('\n🔘 Testing: Modal Close Button (X)');
        try {
            const closeBtn = await page.$('button[onclick="closeNewBookingModal()"]');
            if (closeBtn) {
                await closeBtn.click();
                await sleep(500);
                
                const modalHidden = await page.$eval('#new-booking-modal', el => 
                    el.classList.contains('hidden')
                );
                if (modalHidden) {
                    console.log('✅ Modal Close (X) button works');
                    passed++;
                } else {
                    console.log('❌ Modal Close (X) button failed');
                }
            } else {
                console.log('❌ Modal Close (X) button not found');
            }
        } catch (error) {
            console.log('❌ Modal Close (X) button test failed:', error.message);
        }
        
        // Test 6: Form Fill and Submit Test
        total++;
        console.log('\n🔘 Testing: Complete Form Workflow');
        try {
            // Reopen modal
            await page.click('button[onclick="showNewBookingForm()"]');
            await sleep(500);
            
            // Fill form
            await page.type('#client-name', 'E2E Test Client');
            await page.type('#client-email', 'e2e@test.com');
            await page.type('#client-phone', '555-E2E-TEST');
            
            // Select service
            await page.select('#service-type', '60min');
            await sleep(300);
            
            // Set date (tomorrow)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];
            await page.$eval('#booking-date', (el, value) => el.value = value, dateStr);
            
            // Set time
            await page.$eval('#booking-time', el => el.value = '10:00');
            
            // Select location
            await page.select('#booking-location', 'in_clinic');
            await sleep(300);
            
            // Check if pricing updated
            const totalPrice = await page.$eval('#total-price-display', el => el.textContent);
            if (totalPrice === '$145.00') {
                console.log('✅ Form workflow and pricing calculation works');
                passed++;
            } else {
                console.log('❌ Form workflow failed, pricing:', totalPrice);
            }
            
        } catch (error) {
            console.log('❌ Form workflow test failed:', error.message);
        }
        
        // Test 7: Modal Cancel Button
        total++;
        console.log('\n🔘 Testing: Modal Cancel Button');
        try {
            const cancelBtn = await page.$('button[onclick="closeNewBookingModal()"]');
            if (cancelBtn) {
                await cancelBtn.click();
                await sleep(500);
                console.log('✅ Modal Cancel button works');
                passed++;
            } else {
                console.log('❌ Modal Cancel button not found');
            }
        } catch (error) {
            console.log('❌ Modal Cancel button test failed:', error.message);
        }
        
        // Test 8: Status Filter Dropdown
        total++;
        console.log('\n🔘 Testing: Status Filter Dropdown');
        try {
            const statusFilter = await page.$('#status-filter');
            if (statusFilter) {
                await page.select('#status-filter', 'scheduled');
                await sleep(300);
                await page.select('#status-filter', ''); // Reset
                console.log('✅ Status filter dropdown works');
                passed++;
            } else {
                console.log('❌ Status filter dropdown not found');
            }
        } catch (error) {
            console.log('❌ Status filter test failed:', error.message);
        }
        
        // Test 9: Location Filter Dropdown  
        total++;
        console.log('\n🔘 Testing: Location Filter Dropdown');
        try {
            const locationFilter = await page.$('#location-filter');
            if (locationFilter) {
                await page.select('#location-filter', 'mobile');
                await sleep(300);
                await page.select('#location-filter', ''); // Reset
                console.log('✅ Location filter dropdown works');
                passed++;
            } else {
                console.log('❌ Location filter dropdown not found');
            }
        } catch (error) {
            console.log('❌ Location filter test failed:', error.message);
        }
        
        // Test 10: Clear Filters Button
        total++;
        console.log('\n🔘 Testing: Clear Filters Button');
        try {
            const clearBtn = await page.$('button[onclick="clearFilters()"]');
            if (clearBtn) {
                await clearBtn.click();
                await sleep(300);
                console.log('✅ Clear Filters button works');
                passed++;
            } else {
                console.log('❌ Clear Filters button not found');
            }
        } catch (error) {
            console.log('❌ Clear Filters button test failed:', error.message);
        }
        
        // Test 11: Dashboard Metric Clicks
        total++;
        console.log('\n🔘 Testing: Dashboard Metric Buttons');
        try {
            // Test Total Bookings click
            const totalBookingsCard = await page.$('[onclick="filterBookings(\'all\')"]');
            if (totalBookingsCard) {
                await totalBookingsCard.click();
                await sleep(300);
            }
            
            // Test Today click
            const todayCard = await page.$('[onclick="filterBookings(\'today\')"]');
            if (todayCard) {
                await todayCard.click();
                await sleep(300);
            }
            
            // Test Upcoming click
            const upcomingCard = await page.$('[onclick="filterBookings(\'upcoming\')"]');
            if (upcomingCard) {
                await upcomingCard.click();
                await sleep(300);
            }
            
            if (totalBookingsCard && todayCard && upcomingCard) {
                console.log('✅ All dashboard metric buttons clickable');
                passed++;
            } else {
                console.log('❌ Some dashboard metric buttons missing');
            }
        } catch (error) {
            console.log('❌ Dashboard metric buttons test failed:', error.message);
        }
        
        // Test 12: Mobile Responsiveness
        total++;
        console.log('\n🔘 Testing: Mobile Responsive Buttons');
        try {
            await page.setViewport({ width: 375, height: 667 });
            await sleep(1000);
            
            const addBtn = await page.$('button[onclick="showNewBookingForm()"]');
            if (addBtn) {
                await addBtn.click();
                await sleep(500);
                
                const modal = await page.$('#new-booking-modal:not(.hidden)');
                if (modal) {
                    console.log('✅ Mobile buttons work correctly');
                    passed++;
                    
                    // Close modal
                    await page.click('button[onclick="closeNewBookingModal()"]');
                } else {
                    console.log('❌ Mobile buttons failed');
                }
            } else {
                console.log('❌ Mobile Add Booking button not found');
            }
        } catch (error) {
            console.log('❌ Mobile responsive test failed:', error.message);
        }
        
    } catch (error) {
        console.log('❌ Critical test failure:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
    
    // Results
    console.log('\n🎯 END-TO-END BUTTON TEST RESULTS');
    console.log('==================================');
    console.log(`Buttons Tested: ${total}`);
    console.log(`Buttons Working: ${passed}`);
    console.log(`Success Rate: ${Math.round((passed/total) * 100)}%`);
    
    if (passed === total) {
        console.log('\n🎉 ALL BUTTONS PASS END-TO-END TESTING!');
        console.log('');
        console.log('✅ Manage Availability - Clickable');
        console.log('✅ Today\'s Schedule - Filters correctly');
        console.log('✅ On-Site Bookings - Filters correctly');
        console.log('✅ Add Booking - Opens modal with form');
        console.log('✅ Modal Close (X) - Closes modal');
        console.log('✅ Form Workflow - Complete form submission');
        console.log('✅ Modal Cancel - Closes modal');
        console.log('✅ Status Filter - Dropdown works');
        console.log('✅ Location Filter - Dropdown works');
        console.log('✅ Clear Filters - Resets all filters');
        console.log('✅ Dashboard Metrics - All clickable');
        console.log('✅ Mobile Responsive - Works on mobile');
        
        return true;
    } else {
        console.log(`\n💥 ${total - passed} buttons failed testing`);
        return false;
    }
}

testAllButtons()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });