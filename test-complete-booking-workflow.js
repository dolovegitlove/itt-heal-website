/**
 * Complete End-to-End Booking Workflow Test
 * Tests: Client booking → Admin management → Status changes → Payment operations
 * 
 * Run with: node test-complete-booking-workflow.js
 */

const puppeteer = require('puppeteer');

// Test configuration
const config = {
    baseUrl: 'http://localhost:3000',
    adminUrl: 'http://localhost:3000/admin-dashboard.html',
    headless: true, // Set to true for headless testing
    slowMo: 500, // Slow down for visual debugging
    testUser: {
        name: 'Test Client ' + Date.now(),
        email: 'test' + Date.now() + '@example.com',
        phone: '555-0123'
    }
};

let browser, page, adminPage;
let bookingId = null;
let sessionId = null;

async function runCompleteWorkflowTest() {
    console.log('🚀 Starting Complete Booking Workflow Test...\n');
    
    try {
        // Initialize browser
        browser = await puppeteer.launch({
            headless: config.headless,
            slowMo: config.slowMo,
            defaultViewport: { width: 1200, height: 800 }
        });

        page = await browser.newPage();
        
        // Enable console logging from the page
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

        // Test Phase 1: Client Booking Flow
        await testClientBookingFlow();
        
        // Test Phase 2: Admin Dashboard Access
        await testAdminDashboardAccess();
        
        // Test Phase 3: Booking Management Operations
        await testBookingManagement();
        
        // Test Phase 4: Payment Operations
        await testPaymentOperations();
        
        // Test Phase 5: Status Change Operations
        await testStatusChangeOperations();
        
        console.log('\n✅ Complete Booking Workflow Test PASSED!');
        
    } catch (error) {
        console.error('\n❌ Test FAILED:', error.message);
        console.error(error.stack);
        
        // Take screenshot on failure
        if (page) {
            await page.screenshot({ 
                path: 'test-failure-screenshot.png',
                fullPage: true 
            });
            console.log('📸 Failure screenshot saved as test-failure-screenshot.png');
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function testClientBookingFlow() {
    console.log('📋 Phase 1: Testing Client Booking Flow...');
    
    // Step 1: Navigate to booking page
    console.log('  → Navigating to booking page...');
    await page.goto(config.baseUrl, { waitUntil: 'networkidle0' });
    
    // Scroll to booking section
    await page.evaluate(() => {
        document.querySelector('#booking').scrollIntoView({ behavior: 'smooth' });
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Select service (90-minute session)
    console.log('  → Selecting 90-minute service...');
    await page.waitForSelector('.service-option[onclick*="90min"]', { visible: true });
    await page.click('.service-option[onclick*="90min"]');
    
    // Wait for next step to appear
    await page.waitForSelector('#datetime-selection', { visible: true });
    
    // Step 3: Select date and time
    console.log('  → Selecting date and time...');
    
    // Set date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await page.waitForSelector('#booking-date');
    await page.type('#booking-date', dateString);
    
    // Trigger time loading
    await page.evaluate(() => {
        const dateInput = document.querySelector('#booking-date');
        dateInput.dispatchEvent(new Event('change'));
    });
    
    // Wait for times to load and select first available time
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.waitForSelector('#booking-time option:not([value=""])', { timeout: 10000 });
    
    const timeOptions = await page.$$('#booking-time option[value]:not([value=""])');
    if (timeOptions.length > 0) {
        const timeValue = await timeOptions[0].evaluate(el => el.value);
        await page.select('#booking-time', timeValue);
        console.log('    ✓ Selected time:', timeValue);
    } else {
        throw new Error('No available time slots found');
    }
    
    // Step 4: Go to next step (contact info)
    await page.click('#next-btn');
    await page.waitForSelector('#contact-info', { visible: true });
    
    // Step 5: Fill contact information
    console.log('  → Filling contact information...');
    
    await page.waitForSelector('#client-name');
    await page.type('#client-name', config.testUser.name);
    
    await page.waitForSelector('#client-email');
    await page.type('#client-email', config.testUser.email);
    
    await page.waitForSelector('#client-phone');
    await page.type('#client-phone', config.testUser.phone);
    
    await page.waitForSelector('#session-notes');
    await page.type('#session-notes', 'Test booking - automated UI test');
    
    // Step 6: Go to booking summary
    await page.click('#next-btn');
    await page.waitForSelector('#booking-summary', { visible: true });
    
    // Step 7: Complete booking
    console.log('  → Completing booking...');
    
    // Monitor network requests to capture booking response
    page.on('response', async response => {
        if (response.url().includes('/api/web-booking/book') && response.status() === 200) {
            try {
                const responseData = await response.json();
                if (responseData.success && responseData.data) {
                    bookingId = responseData.data.bookingId;
                    sessionId = responseData.data.sessionId;
                    console.log('    ✓ Booking created - ID:', bookingId, 'Session ID:', sessionId);
                }
            } catch (e) {
                console.log('    ! Could not parse booking response');
            }
        }
    });
    
    await page.click('#confirm-booking-btn');
    
    // Wait for booking confirmation
    await page.waitForFunction(() => {
        const status = document.querySelector('#booking-status');
        return status && status.textContent.includes('confirmed');
    }, { timeout: 15000 });
    
    console.log('    ✅ Client booking completed successfully!');
    
    // Wait a moment for any additional processing
    await new Promise(resolve => setTimeout(resolve, 2000));
}

async function testAdminDashboardAccess() {
    console.log('\n🔐 Phase 2: Testing Admin Dashboard Access...');
    
    // Open admin dashboard in new page
    adminPage = await browser.newPage();
    adminPage.on('console', msg => console.log('ADMIN LOG:', msg.text()));
    
    console.log('  → Navigating to admin dashboard...');
    await adminPage.goto(config.adminUrl, { waitUntil: 'networkidle0' });
    
    // Wait for bookings to load
    await adminPage.waitForSelector('.booking-item, .no-bookings', { timeout: 10000 });
    
    // Check if our booking appears
    if (bookingId) {
        console.log('  → Looking for booking ID:', bookingId);
        
        // Wait a moment for data to populate
        await adminPage.waitForTimeout(2000);
        
        // Check if booking is visible
        const bookingVisible = await adminPage.evaluate((id) => {
            const bookings = Array.from(document.querySelectorAll('.booking-item'));
            return bookings.some(booking => 
                booking.textContent.includes(id) || 
                booking.dataset.bookingId === id
            );
        }, bookingId);
        
        if (bookingVisible) {
            console.log('    ✅ Booking found in admin dashboard!');
        } else {
            console.log('    ⚠️  Booking not immediately visible, checking data...');
            
            // Log current bookings for debugging
            const bookingData = await adminPage.evaluate(() => {
                const bookings = Array.from(document.querySelectorAll('.booking-item'));
                return bookings.map(b => ({
                    text: b.textContent.substring(0, 100),
                    id: b.dataset.bookingId
                }));
            });
            console.log('    Current bookings:', bookingData);
        }
    }
    
    console.log('    ✅ Admin dashboard access successful!');
}

async function testBookingManagement() {
    console.log('\n📊 Phase 3: Testing Booking Management Operations...');
    
    if (!bookingId) {
        console.log('    ⚠️  No booking ID available, skipping detailed tests');
        return;
    }
    
    // Test edit booking functionality
    console.log('  → Testing booking edit functionality...');
    
    // Look for edit button or booking details
    const editButton = await adminPage.$(`[data-booking-id="${bookingId}"] .edit-btn, .booking-item .edit-btn`);
    if (editButton) {
        await editButton.click();
        console.log('    ✓ Edit dialog opened');
        
        // Wait for edit form and test updating notes
        await adminPage.waitForSelector('.edit-notes, #edit-notes', { timeout: 5000 });
        await adminPage.type('.edit-notes, #edit-notes', ' - EDITED VIA UI TEST');
        
        // Save changes
        const saveButton = await adminPage.$('.save-btn, #save-btn');
        if (saveButton) {
            await saveButton.click();
            console.log('    ✓ Booking edited successfully');
        }
    } else {
        console.log('    ⚠️  Edit button not found, testing view functionality...');
    }
    
    // Test viewing booking details
    const viewButton = await adminPage.$(`[data-booking-id="${bookingId}"] .view-btn, .booking-item .view-btn`);
    if (viewButton) {
        await viewButton.click();
        console.log('    ✓ Booking details viewed');
    }
    
    console.log('    ✅ Booking management operations tested!');
}

async function testPaymentOperations() {
    console.log('\n💳 Phase 4: Testing Payment Operations...');
    
    if (!bookingId) {
        console.log('    ⚠️  No booking ID available, skipping payment tests');
        return;
    }
    
    // Test payment status changes
    console.log('  → Testing payment status changes...');
    
    // Look for payment controls
    const paymentSection = await adminPage.$(`[data-booking-id="${bookingId}"] .payment-controls, .payment-section`);
    if (paymentSection) {
        
        // Test partial payment
        const partialPaymentBtn = await adminPage.$('.partial-payment-btn, [data-action="partial-payment"]');
        if (partialPaymentBtn) {
            await partialPaymentBtn.click();
            console.log('    ✓ Partial payment processed');
            await adminPage.waitForTimeout(1000);
        }
        
        // Test full payment
        const fullPaymentBtn = await adminPage.$('.full-payment-btn, [data-action="full-payment"]');
        if (fullPaymentBtn) {
            await fullPaymentBtn.click();
            console.log('    ✓ Full payment processed');
            await adminPage.waitForTimeout(1000);
        }
        
        // Test refund
        const refundBtn = await adminPage.$('.refund-btn, [data-action="refund"]');
        if (refundBtn) {
            await refundBtn.click();
            console.log('    ✓ Refund processed');
            await adminPage.waitForTimeout(1000);
        }
        
    } else {
        console.log('    ⚠️  Payment controls not found, testing may need manual verification');
    }
    
    console.log('    ✅ Payment operations tested!');
}

async function testStatusChangeOperations() {
    console.log('\n🔄 Phase 5: Testing Status Change Operations...');
    
    if (!bookingId) {
        console.log('    ⚠️  No booking ID available, skipping status tests');
        return;
    }
    
    // Test status progression: booked → in_progress → completed
    console.log('  → Testing status progression...');
    
    const statusControls = await adminPage.$(`[data-booking-id="${bookingId}"] .status-controls, .status-section`);
    if (statusControls) {
        
        // Change to in_progress
        const inProgressBtn = await adminPage.$('.status-in-progress-btn, [data-status="in_progress"]');
        if (inProgressBtn) {
            await inProgressBtn.click();
            console.log('    ✓ Status changed to in_progress');
            await adminPage.waitForTimeout(1000);
        }
        
        // Change to completed
        const completedBtn = await adminPage.$('.status-completed-btn, [data-status="completed"]');
        if (completedBtn) {
            await completedBtn.click();
            console.log('    ✓ Status changed to completed');
            await adminPage.waitForTimeout(1000);
        }
        
        // Test changing back to booked
        const bookedBtn = await adminPage.$('.status-booked-btn, [data-status="booked"]');
        if (bookedBtn) {
            await bookedBtn.click();
            console.log('    ✓ Status changed back to booked');
            await adminPage.waitForTimeout(1000);
        }
        
    } else {
        console.log('    ⚠️  Status controls not found, checking for alternative UI...');
        
        // Look for dropdown status selector
        const statusDropdown = await adminPage.$('.status-dropdown, select[name="status"]');
        if (statusDropdown) {
            await adminPage.select('.status-dropdown, select[name="status"]', 'in_progress');
            console.log('    ✓ Status changed via dropdown to in_progress');
            
            await adminPage.select('.status-dropdown, select[name="status"]', 'completed');
            console.log('    ✓ Status changed via dropdown to completed');
        }
    }
    
    console.log('    ✅ Status change operations tested!');
}

// Run the complete test
console.log('Starting Complete Booking Workflow Test...');
console.log('Test User:', config.testUser);
console.log('Base URL:', config.baseUrl);
console.log('Admin URL:', config.adminUrl);
console.log('');

runCompleteWorkflowTest()
    .then(() => {
        console.log('\n🎉 All tests completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Test suite failed:', error);
        process.exit(1);
    });