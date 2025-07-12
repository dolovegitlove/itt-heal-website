#!/usr/bin/env node

/**
 * Test Admin API Integration
 * Verify booking appears in admin dashboard
 */

const puppeteer = require('puppeteer');

async function testAdminAPI() {
    console.log('🔧 Testing Admin API Integration');
    console.log('================================');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        // Navigate to admin dashboard
        console.log('📊 Loading admin dashboard...');
        await page.goto('https://ittheal.com/admin.html', { waitUntil: 'networkidle0' });
        
        // Wait for API calls to complete
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if bookings are loaded
        const bookingsData = await page.evaluate(() => {
            // Check if bookings table exists and has data
            const table = document.querySelector('.bookings-table tbody');
            if (!table) return { error: 'Bookings table not found' };
            
            const rows = table.querySelectorAll('tr');
            const bookings = [];
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length > 0) {
                    bookings.push({
                        email: cells[1]?.textContent?.trim() || 'N/A',
                        phone: cells[2]?.textContent?.trim() || 'N/A',
                        date: cells[3]?.textContent?.trim() || 'N/A',
                        service: cells[4]?.textContent?.trim() || 'N/A',
                        status: cells[5]?.textContent?.trim() || 'N/A'
                    });
                }
            });
            
            return { 
                success: true, 
                count: bookings.length, 
                bookings: bookings 
            };
        });
        
        console.log('📋 Admin Dashboard Results:');
        console.log(`   Bookings found: ${bookingsData.count || 0}`);
        
        if (bookingsData.bookings && bookingsData.bookings.length > 0) {
            console.log('✅ Booking details:');
            bookingsData.bookings.forEach((booking, index) => {
                console.log(`   ${index + 1}. ${booking.email} - ${booking.service} - ${booking.status}`);
            });
        } else {
            console.log('❌ No bookings displayed in admin dashboard');
        }
        
        // Check for API errors in console
        const consoleLogs = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleLogs.push(msg.text());
            }
        });
        
        if (consoleLogs.length > 0) {
            console.log('⚠️ Console errors:');
            consoleLogs.forEach(log => console.log(`   ${log}`));
        }
        
        return bookingsData;
        
    } catch (error) {
        console.error('❌ Admin API test failed:', error.message);
        return { error: error.message };
    } finally {
        await browser.close();
    }
}

// Run the test
testAdminAPI().catch(console.error);