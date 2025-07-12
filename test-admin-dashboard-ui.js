#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testAdminDashboardUI() {
    console.log('🌐 Starting Real Browser UI Test for Admin Dashboard');
    console.log('===================================================');
    
    let browser;
    let passed = 0;
    let total = 0;
    
    try {
        // Launch browser
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
        
        console.log('🔗 Navigating to admin dashboard...');
        await page.goto('https://ittheal.com/admin-dashboard.html', { 
            waitUntil: 'networkidle2',
            timeout: 10000 
        });
        
        // Test 1: Page loads successfully
        total++;
        const title = await page.title();
        if (title.includes('Dr. Shiffer Admin Dashboard')) {
            console.log('✅ Test 1: Page loads with correct title');
            passed++;
        } else {
            console.log('❌ Test 1: Page title incorrect:', title);
        }
        
        // Wait for content to load
        await page.waitForSelector('.admin-header', { timeout: 5000 });
        await page.waitForTimeout(2000); // Wait for potential API calls
        
        // Test 2: Header and emergency banner present
        total++;
        const hasHeader = await page.$('.admin-header') !== null;
        const hasEmergencyBanner = await page.$('.emergency-access') !== null;
        if (hasHeader && hasEmergencyBanner) {
            console.log('✅ Test 2: Header and emergency banner present');
            passed++;
        } else {
            console.log('❌ Test 2: Missing header or emergency banner');
        }
        
        // Test 3: Dashboard metrics are visible
        total++;
        const bookingCount = await page.$('#booking-count');
        const todayCount = await page.$('#today-count'); 
        const upcomingCount = await page.$('#upcoming-count');
        if (bookingCount && todayCount && upcomingCount) {
            console.log('✅ Test 3: Dashboard metrics visible');
            passed++;
        } else {
            console.log('❌ Test 3: Dashboard metrics missing');
        }
        
        // Test 4: Quick action buttons present
        total++;
        const addBookingBtn = await page.$('button[onclick="showNewBookingForm()"]');
        const availabilityBtn = await page.$('button[onclick="showAvailabilityManager()"]');
        const todayBtn = await page.$('button[onclick="filterBookings(\'today\')"]');
        const mobileBtn = await page.$('button[onclick="filterBookings(\'mobile\')"]');
        
        if (addBookingBtn && availabilityBtn && todayBtn && mobileBtn) {
            console.log('✅ Test 4: All quick action buttons present');
            passed++;
        } else {
            console.log('❌ Test 4: Missing quick action buttons');
        }
        
        // Test 5: Click "Add Booking" button to open modal
        total++;
        try {
            await page.click('button[onclick="showNewBookingForm()"]');
            await page.waitForSelector('#new-booking-modal:not(.hidden)', { timeout: 3000 });
            console.log('✅ Test 5: Add Booking modal opens successfully');
            passed++;
        } catch (error) {
            console.log('❌ Test 5: Add Booking modal failed to open:', error.message);
        }
        
        // Test 6: Modal form fields are present
        total++;
        const clientName = await page.$('#client-name');
        const clientEmail = await page.$('#client-email'); 
        const serviceType = await page.$('#service-type');
        const bookingDate = await page.$('#booking-date');
        const bookingLocation = await page.$('#booking-location');
        
        if (clientName && clientEmail && serviceType && bookingDate && bookingLocation) {
            console.log('✅ Test 6: All modal form fields present');
            passed++;
        } else {
            console.log('❌ Test 6: Missing modal form fields');
        }
        
        // Test 7: Fill out the form and test pricing updates
        total++;
        try {
            await page.type('#client-name', 'Test Client UI');
            await page.type('#client-email', 'test@uitest.com');
            await page.type('#client-phone', '555-TEST-123');
            
            // Select service type to trigger pricing
            await page.select('#service-type', '60min');
            await page.waitForTimeout(500); // Let pricing update
            
            // Check if pricing updated
            const basePrice = await page.$eval('#base-price-display', el => el.textContent);
            if (basePrice === '$145.00') {
                console.log('✅ Test 7: Pricing calculation works correctly');
                passed++;
            } else {
                console.log('❌ Test 7: Pricing calculation failed, got:', basePrice);
            }
        } catch (error) {
            console.log('❌ Test 7: Form filling failed:', error.message);
        }
        
        // Test 8: Test location fee calculation
        total++;
        try {
            await page.select('#booking-location', 'mobile');
            await page.waitForTimeout(500);
            
            const locationFee = await page.$eval('#location-fee-display', el => el.textContent);
            const totalPrice = await page.$eval('#total-price-display', el => el.textContent);
            
            if (locationFee === '$25.00' && totalPrice === '$170.00') {
                console.log('✅ Test 8: Location fee calculation works correctly');
                passed++;
            } else {
                console.log('❌ Test 8: Location fee calculation failed. Fee:', locationFee, 'Total:', totalPrice);
            }
        } catch (error) {
            console.log('❌ Test 8: Location fee test failed:', error.message);
        }
        
        // Test 9: Close modal using X button
        total++;
        try {
            await page.click('button[onclick="closeNewBookingModal()"]');
            await page.waitForTimeout(500);
            
            const modalHidden = await page.$eval('#new-booking-modal', el => el.classList.contains('hidden'));
            if (modalHidden) {
                console.log('✅ Test 9: Modal closes successfully');
                passed++;
            } else {
                console.log('❌ Test 9: Modal failed to close');
            }
        } catch (error) {
            console.log('❌ Test 9: Modal close test failed:', error.message);
        }
        
        // Test 10: Test dashboard metric clicks (Today filter)
        total++;
        try {
            await page.click('[onclick="filterBookings(\'today\')"]');
            await page.waitForTimeout(1000);
            console.log('✅ Test 10: Today filter button clickable');
            passed++;
        } catch (error) {
            console.log('❌ Test 10: Today filter button click failed:', error.message);
        }
        
        // Test 11: Test filter dropdown functionality
        total++;
        try {
            const statusFilter = await page.$('#status-filter');
            const locationFilter = await page.$('#location-filter');
            const dateFilter = await page.$('#date-filter');
            const clearBtn = await page.$('button[onclick="clearFilters()"]');
            
            if (statusFilter && locationFilter && dateFilter && clearBtn) {
                console.log('✅ Test 11: All filter controls present');
                passed++;
            } else {
                console.log('❌ Test 11: Missing filter controls');
            }
        } catch (error) {
            console.log('❌ Test 11: Filter controls test failed:', error.message);
        }
        
        // Test 12: Test clear filters button
        total++;
        try {
            await page.click('button[onclick="clearFilters()"]');
            await page.waitForTimeout(500);
            console.log('✅ Test 12: Clear filters button clickable');
            passed++;
        } catch (error) {
            console.log('❌ Test 12: Clear filters button click failed:', error.message);
        }
        
        // Test 13: Mobile responsiveness test
        total++;
        try {
            await page.setViewport({ width: 375, height: 667 }); // iPhone size
            await page.waitForTimeout(1000);
            
            const headerVisible = await page.$('.admin-header');
            const cardsVisible = await page.$$('.stats-card');
            
            if (headerVisible && cardsVisible.length > 0) {
                console.log('✅ Test 13: Mobile responsive layout works');
                passed++;
            } else {
                console.log('❌ Test 13: Mobile responsive layout failed');
            }
        } catch (error) {
            console.log('❌ Test 13: Mobile responsive test failed:', error.message);
        }
        
        // Test 14: Test luxury spa styling is applied
        total++;
        try {
            const headerBg = await page.$eval('.admin-header', el => 
                window.getComputedStyle(el).background
            );
            
            if (headerBg.includes('gradient') || headerBg.includes('linear')) {
                console.log('✅ Test 14: Luxury spa gradient styling applied');
                passed++;
            } else {
                console.log('❌ Test 14: Luxury spa styling not detected');
            }
        } catch (error) {
            console.log('❌ Test 14: Styling test failed:', error.message);
        }
        
        // Test 15: Test console for JavaScript errors
        total++;
        const logs = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                logs.push(msg.text());
            }
        });
        
        await page.reload({ waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        
        if (logs.length === 0) {
            console.log('✅ Test 15: No JavaScript console errors');
            passed++;
        } else {
            console.log('❌ Test 15: JavaScript errors found:', logs);
        }
        
    } catch (error) {
        console.log('❌ Critical test failure:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
    
    // Final Results
    console.log('\n🎯 REAL BROWSER UI TEST RESULTS');
    console.log('===============================');
    console.log(`Tests Passed: ${passed}/${total}`);
    console.log(`Success Rate: ${Math.round((passed/total) * 100)}%`);
    
    if (passed === total) {
        console.log('🎉 ALL UI TESTS PASSED! Admin dashboard is fully functional.');
        console.log('');
        console.log('✅ Page loads correctly');
        console.log('✅ All UI elements present');  
        console.log('✅ Add Booking modal works');
        console.log('✅ Form fields functional');
        console.log('✅ Pricing calculations work');
        console.log('✅ Modal open/close works');
        console.log('✅ Filter buttons clickable');
        console.log('✅ Mobile responsive');
        console.log('✅ Luxury spa styling applied');
        console.log('✅ No JavaScript errors');
        
        return true;
    } else {
        console.log(`💥 ${total - passed} tests failed. Admin dashboard needs fixes.`);
        return false;
    }
}

// Run the test
testAdminDashboardUI()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });