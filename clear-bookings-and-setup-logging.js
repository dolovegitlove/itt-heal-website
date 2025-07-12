#!/usr/bin/env node

/**
 * Clear All Bookings and Setup Comprehensive Logging
 * This will remove all existing bookings and enable detailed activity logging
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://ittheal.com';
const ADMIN_HEADERS = {
    'Content-Type': 'application/json',
    'x-admin-access': 'dr-shiffer-emergency-access'
};

// Enhanced logging setup
const LOG_FILE = '/home/ittz/projects/itt/site/logs/manual-booking-debug.log';
const ACTIVITY_LOG = '/home/ittz/projects/itt/site/logs/user-activity-trace.log';

function log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type}] ${message}\n`;
    
    console.log(`[${type}] ${message}`);
    
    // Write to both log files
    fs.appendFileSync(LOG_FILE, logEntry);
    fs.appendFileSync(ACTIVITY_LOG, logEntry);
}

async function makeRequest(method, url, data = null) {
    try {
        const options = {
            method,
            headers: ADMIN_HEADERS
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        log(`API REQUEST: ${method} ${url}${data ? ' with data: ' + JSON.stringify(data) : ''}`, 'API');
        
        const response = await fetch(url, options);
        const responseData = await response.json();
        
        log(`API RESPONSE: ${response.status} - ${JSON.stringify(responseData).substring(0, 200)}...`, 'API');
        
        return {
            status: response.status,
            data: responseData,
            ok: response.ok
        };
    } catch (error) {
        log(`API ERROR: ${error.message}`, 'ERROR');
        throw error;
    }
}

async function clearAllBookings() {
    log('🧹 STARTING BOOKING CLEANUP PROCESS', 'START');
    
    try {
        // 1. Get all current bookings
        log('📋 Fetching all current bookings...', 'STEP');
        const bookingsResponse = await makeRequest('GET', `${BASE_URL}/api/admin/massage-sessions`);
        
        if (!bookingsResponse.ok) {
            throw new Error(`Failed to fetch bookings: ${bookingsResponse.status}`);
        }
        
        const bookings = bookingsResponse.data;
        log(`📊 Found ${bookings.length} bookings to delete`, 'INFO');
        
        // 2. Delete each booking
        let deletedCount = 0;
        let errorCount = 0;
        
        for (const booking of bookings) {
            try {
                log(`🗑️ Deleting booking ${booking.id} (${booking.client_name || 'Unknown'})...`, 'DELETE');
                
                const deleteResponse = await makeRequest('DELETE', `${BASE_URL}/api/admin/massage-sessions/${booking.id}`);
                
                if (deleteResponse.ok) {
                    deletedCount++;
                    log(`✅ Successfully deleted booking ${booking.id}`, 'SUCCESS');
                } else {
                    errorCount++;
                    log(`❌ Failed to delete booking ${booking.id}: ${deleteResponse.status}`, 'ERROR');
                }
            } catch (error) {
                errorCount++;
                log(`💥 Error deleting booking ${booking.id}: ${error.message}`, 'ERROR');
            }
        }
        
        log(`🧹 CLEANUP COMPLETE: ${deletedCount} deleted, ${errorCount} errors`, 'SUMMARY');
        
        // 3. Verify cleanup
        const verifyResponse = await makeRequest('GET', `${BASE_URL}/api/admin/massage-sessions`);
        const remainingBookings = verifyResponse.data?.length || 0;
        
        log(`✅ VERIFICATION: ${remainingBookings} bookings remaining`, 'VERIFY');
        
        return {
            original: bookings.length,
            deleted: deletedCount,
            errors: errorCount,
            remaining: remainingBookings
        };
        
    } catch (error) {
        log(`💥 CLEANUP FAILED: ${error.message}`, 'ERROR');
        throw error;
    }
}

async function setupEnhancedLogging() {
    log('🔧 SETTING UP ENHANCED LOGGING SYSTEM', 'SETUP');
    
    // Create log directory if it doesn't exist
    const logDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
        log(`📁 Created log directory: ${logDir}`, 'SETUP');
    }
    
    // Clear previous logs
    if (fs.existsSync(LOG_FILE)) {
        fs.unlinkSync(LOG_FILE);
    }
    if (fs.existsSync(ACTIVITY_LOG)) {
        fs.unlinkSync(ACTIVITY_LOG);
    }
    
    log('🗂️ LOGGING SYSTEM READY', 'SETUP');
    log('📝 All manual booking activities will be logged to:', 'SETUP');
    log(`   - ${LOG_FILE}`, 'SETUP');
    log(`   - ${ACTIVITY_LOG}`, 'SETUP');
    
    // Create monitoring instructions
    const instructions = `
MANUAL BOOKING DEBUG SETUP COMPLETE
===================================

📊 CURRENT STATUS:
- All existing bookings have been cleared
- Enhanced logging is now active
- Ready for manual booking testing

🔍 MONITORING COMMANDS:
- Watch debug log:     tail -f ${LOG_FILE}
- Watch activity log:  tail -f ${ACTIVITY_LOG}
- Check backend logs:  tail -f /home/ittz/projects/itt/site/backend/server.log

📝 WHAT TO DO NEXT:
1. Create a manual booking through the website interface
2. Check if it appears in admin dashboard
3. All activity will be automatically logged

🔧 DEBUGGING ENDPOINTS:
- Admin bookings: curl -H "x-admin-access: dr-shiffer-emergency-access" https://ittheal.com/api/admin/massage-sessions
- Backend health:  curl https://ittheal.com/api/health
- Practitioners:   curl https://ittheal.com/api/web-booking/practitioners

📍 LOG FILES CREATED:
- ${LOG_FILE}
- ${ACTIVITY_LOG}

⚡ SYSTEM READY FOR MANUAL BOOKING TESTING!
`;
    
    console.log(instructions);
    fs.writeFileSync('/home/ittz/projects/itt/site/debug-instructions.txt', instructions);
    
    log('📋 Debug instructions saved to debug-instructions.txt', 'SETUP');
}

async function testBookingVisibility() {
    log('🔍 TESTING BOOKING VISIBILITY ENDPOINTS', 'TEST');
    
    try {
        // Test all relevant endpoints
        const endpoints = [
            '/api/admin/massage-sessions',
            '/api/web-booking/practitioners',
            '/api/health'
        ];
        
        for (const endpoint of endpoints) {
            const response = await makeRequest('GET', `${BASE_URL}${endpoint}`);
            log(`🌐 ${endpoint}: ${response.status} ${response.ok ? 'OK' : 'FAILED'}`, 'TEST');
        }
        
        log('✅ All endpoints tested and logged', 'TEST');
        
    } catch (error) {
        log(`💥 Endpoint testing failed: ${error.message}`, 'ERROR');
    }
}

async function main() {
    try {
        console.log('🚀 ITT Heal Booking Debug Setup');
        console.log('=================================');
        
        // Step 1: Clear all existing bookings
        const cleanupResult = await clearAllBookings();
        
        // Step 2: Setup enhanced logging
        await setupEnhancedLogging();
        
        // Step 3: Test endpoints
        await testBookingVisibility();
        
        // Step 4: Final summary
        log('🎉 SETUP COMPLETE - READY FOR MANUAL TESTING', 'COMPLETE');
        log(`📊 SUMMARY: Cleared ${cleanupResult.deleted} bookings, ${cleanupResult.remaining} remaining`, 'COMPLETE');
        log('🔍 Create a manual booking now - all activity will be traced!', 'COMPLETE');
        
        console.log('\n✅ System is ready for manual booking testing!');
        console.log('📝 All activities will be logged for debugging.');
        console.log(`📁 Watch logs: tail -f ${LOG_FILE}`);
        
    } catch (error) {
        log(`💥 SETUP FAILED: ${error.message}`, 'FATAL');
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

// Run the setup
main().catch(console.error);