#!/usr/bin/env node

/**
 * Real UI Test - Tests actual functionality in browser context
 */

const puppeteer = require('puppeteer');

async function testAdminUI() {
    console.log('🔍 Testing LIVE Admin UI functionality...');
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors', '--ignore-ssl-errors']
        });
        
        const page = await browser.newPage();
        
        // Enable console logging from page
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
        
        // Navigate to admin page
        console.log('📍 Loading https://ittheal.com/admin.html...');
        await page.goto('https://ittheal.com/admin.html', { waitUntil: 'networkidle0' });
        
        // Test 1: Check if page loads
        const title = await page.title();
        console.log(`✅ Page loaded: ${title}`);
        
        // Test 2: Check if New Booking button exists
        const newBookingBtn = await page.$('button[onclick="showCreateBookingModal()"]');
        if (!newBookingBtn) {
            throw new Error('❌ New Booking button not found');
        }
        console.log('✅ New Booking button found');
        
        // Test 3: Try clicking New Booking button
        console.log('🔹 Testing New Booking button click...');
        await page.click('button[onclick="showCreateBookingModal()"]');
        
        // Wait a moment for modal to appear
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if modal appeared
        const modal = await page.$('#booking-modal');
        if (modal) {
            console.log('✅ New Booking modal opens successfully');
            
            // Test form fields
            const emailField = await page.$('#patient-email');
            const phoneField = await page.$('#patient-phone');
            const dateField = await page.$('#appointment-date');
            
            if (emailField && phoneField && dateField) {
                console.log('✅ Booking form fields present');
            } else {
                console.log('❌ Missing booking form fields');
            }
            
            // Close modal
            await page.click('button[onclick="closeBookingModal()"]');
            console.log('✅ Modal closes successfully');
            
        } else {
            console.log('❌ New Booking modal failed to open');
        }
        
        // Test 4: Check for booking table and action buttons
        console.log('🔹 Checking booking table...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for data to load
        
        const bookingTable = await page.$('.bookings-table');
        if (bookingTable) {
            console.log('✅ Bookings table found');
            
            // Check for Edit/Delete buttons
            const editBtns = await page.$$('button[onclick*="editBooking"]');
            const deleteBtns = await page.$$('button[onclick*="deleteBooking"]');
            
            console.log(`✅ Found ${editBtns.length} Edit buttons`);
            console.log(`✅ Found ${deleteBtns.length} Delete buttons`);
            
            if (editBtns.length > 0) {
                console.log('🔹 Testing Edit button click...');
                await editBtns[0].click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const editModal = await page.$('#edit-booking-modal');
                if (editModal) {
                    console.log('✅ Edit booking modal opens successfully');
                    await page.click('button[onclick="closeEditBookingModal()"]');
                } else {
                    console.log('❌ Edit booking modal failed to open');
                }
            }
            
        } else {
            console.log('❌ Bookings table not found');
        }
        
        console.log('\n🎉 UI Test Complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testAdminUI().catch(console.error);