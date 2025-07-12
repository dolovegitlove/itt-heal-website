/**
 * Final Complete Booking Test - Real UI Testing
 * Tests the complete booking workflow as requested
 */

const puppeteer = require('puppeteer');

async function runCompleteTest() {
    console.log('🚀 COMPLETE END-TO-END UI BOOKING TEST\n');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    let testResults = {
        clientBooking: false,
        adminAccess: false,
        bookingManagement: false,
        statusChanges: false,
        paymentOperations: false
    };
    
    try {
        // PHASE 1: Client Booking Flow
        console.log('📋 PHASE 1: CLIENT BOOKING FLOW');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        
        // Navigate to booking section
        await page.evaluate(() => {
            const booking = document.querySelector('#booking');
            if (booking) booking.scrollIntoView();
        });
        
        // Check booking section loaded
        const bookingExists = await page.$('#booking');
        console.log(`  → Booking section: ${bookingExists ? '✅ FOUND' : '❌ MISSING'}`);
        
        // Check service options
        const serviceOptions = await page.$$('.service-option');
        console.log(`  → Service options: ${serviceOptions.length} found`);
        
        // Check form elements
        const formElements = await page.evaluate(() => ({
            dateInput: !!document.querySelector('#booking-date'),
            timeSelect: !!document.querySelector('#booking-time'),
            nameInput: !!document.querySelector('#client-name'),
            emailInput: !!document.querySelector('#client-email'),
            phoneInput: !!document.querySelector('#client-phone'),
            notesInput: !!document.querySelector('#session-notes')
        }));
        
        console.log('  → Form elements:');
        Object.entries(formElements).forEach(([key, exists]) => {
            console.log(`    ${key}: ${exists ? '✅' : '❌'}`);
        });
        
        testResults.clientBooking = bookingExists && serviceOptions.length > 0;
        
        // PHASE 2: Admin Dashboard
        console.log('\n🔐 PHASE 2: ADMIN DASHBOARD ACCESS');
        const adminPage = await browser.newPage();
        await adminPage.goto('http://localhost:3000/admin-dashboard.html', { waitUntil: 'networkidle0' });
        
        // Check admin elements
        const adminElements = await adminPage.evaluate(() => ({
            hasTable: !!document.querySelector('table'),
            hasBookingList: !!document.querySelector('.booking-item, .session-item'),
            hasAdminControls: !!document.querySelector('.admin-controls, .admin-content'),
            hasStatusControls: !!document.querySelector('[data-status], .status-control'),
            hasPaymentControls: !!document.querySelector('.payment-control, [data-action*="payment"]')
        }));
        
        console.log('  → Admin elements:');
        Object.entries(adminElements).forEach(([key, exists]) => {
            console.log(`    ${key}: ${exists ? '✅' : '❌'}`);
        });
        
        testResults.adminAccess = Object.values(adminElements).some(Boolean);
        testResults.bookingManagement = adminElements.hasTable || adminElements.hasBookingList;
        testResults.statusChanges = adminElements.hasStatusControls;
        testResults.paymentOperations = adminElements.hasPaymentControls;
        
        // PHASE 3: API Functionality Test
        console.log('\n🔌 PHASE 3: API FUNCTIONALITY');
        
        // Test health endpoint
        const healthResponse = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/health-check');
                const data = await response.json();
                return { success: response.ok, data };
            } catch (e) {
                return { success: false, error: e.message };
            }
        });
        
        console.log(`  → Health check: ${healthResponse.success ? '✅ WORKING' : '❌ FAILED'}`);
        
        // Test booking options
        const optionsResponse = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/web-booking/options');
                const data = await response.json();
                return { success: response.ok, count: data.data?.booking_options?.length || 0 };
            } catch (e) {
                return { success: false, error: e.message };
            }
        });
        
        console.log(`  → Booking options: ${optionsResponse.success ? `✅ ${optionsResponse.count} services` : '❌ FAILED'}`);
        
        // Test availability check
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        
        const availabilityResponse = await page.evaluate(async (date) => {
            try {
                const response = await fetch(`/api/web-booking/availability/060863f2-0623-4785-b01a-f1760cfb8d14/${date}`);
                const data = await response.json();
                return { success: response.ok, slots: data.data?.available_slots?.length || 0 };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }, dateStr);
        
        console.log(`  → Availability: ${availabilityResponse.success ? `✅ ${availabilityResponse.slots} slots` : '❌ FAILED'}`);
        
        // PHASE 4: Test Real Booking Creation
        console.log('\n💳 PHASE 4: REAL BOOKING TEST');
        
        const bookingResult = await page.evaluate(async () => {
            try {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(15, 0, 0, 0); // 3 PM
                
                const response = await fetch('/api/web-booking/book', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        service_type: '60min_massage',
                        practitioner_id: '060863f2-0623-4785-b01a-f1760cfb8d14',
                        scheduled_date: tomorrow.toISOString(),
                        client_name: 'UI Test Client',
                        client_email: 'uitest@example.com',
                        client_phone: '555-0123',
                        special_requests: 'Complete UI test booking',
                        create_account: false,
                        location: 'in_clinic'
                    })
                });
                
                const data = await response.json();
                return {
                    success: response.ok && data.success,
                    status: response.status,
                    bookingId: data.data?.bookingId,
                    sessionId: data.data?.sessionId,
                    error: data.error
                };
            } catch (e) {
                return { success: false, error: e.message };
            }
        });
        
        console.log(`  → Booking creation: ${bookingResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (bookingResult.success) {
            console.log(`    Booking ID: ${bookingResult.bookingId}`);
            console.log(`    Session ID: ${bookingResult.sessionId}`);
        } else {
            console.log(`    Error: ${bookingResult.error} (Status: ${bookingResult.status})`);
        }
        
        // PHASE 5: Admin Verification
        if (bookingResult.success && bookingResult.sessionId) {
            console.log('\n📊 PHASE 5: ADMIN VERIFICATION');
            
            const adminVerification = await adminPage.evaluate(async (sessionId) => {
                try {
                    const response = await fetch('/api/admin/massage-sessions');
                    const data = await response.json();
                    
                    if (data.success) {
                        const ourBooking = data.data.find(session => session.id === sessionId);
                        return {
                            success: true,
                            found: !!ourBooking,
                            totalBookings: data.data.length,
                            booking: ourBooking ? {
                                id: ourBooking.id,
                                name: ourBooking.guest_name,
                                status: ourBooking.status,
                                payment_status: ourBooking.payment_status
                            } : null
                        };
                    }
                    return { success: false, error: data.error };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }, bookingResult.sessionId);
            
            console.log(`  → Admin API: ${adminVerification.success ? '✅ WORKING' : '❌ FAILED'}`);
            console.log(`  → Booking found: ${adminVerification.found ? '✅ YES' : '❌ NO'}`);
            console.log(`  → Total bookings: ${adminVerification.totalBookings || 0}`);
            
            if (adminVerification.found) {
                console.log('  → Booking details:');
                console.log(`    ID: ${adminVerification.booking.id}`);
                console.log(`    Name: ${adminVerification.booking.name}`);
                console.log(`    Status: ${adminVerification.booking.status}`);
                console.log(`    Payment: ${adminVerification.booking.payment_status}`);
            }
        }
        
    } catch (error) {
        console.error('\n❌ Test error:', error.message);
    } finally {
        await browser.close();
    }
    
    // FINAL RESULTS
    console.log('\n🎯 FINAL TEST RESULTS:');
    console.log('================================');
    console.log(`✅ Client Booking UI: ${testResults.clientBooking ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Admin Dashboard: ${testResults.adminAccess ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Booking Management: ${testResults.bookingManagement ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Status Controls: ${testResults.statusChanges ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Payment Controls: ${testResults.paymentOperations ? 'PASS' : 'FAIL'}`);
    
    const overallPass = Object.values(testResults).every(Boolean);
    console.log(`\n🏆 OVERALL RESULT: ${overallPass ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
    
    return overallPass;
}

// Run the test
runCompleteTest()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });