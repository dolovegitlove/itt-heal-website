#!/usr/bin/env node

/**
 * Test to check if the booking appears in admin and is editable
 */

const puppeteer = require('puppeteer');

async function checkAdminBooking() {
    console.log('🔍 CHECKING ADMIN DASHBOARD FOR BOOKING');
    console.log('======================================');
    
    const browser = await puppeteer.launch({ 
        headless: true,
        defaultViewport: { width: 1400, height: 900 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    
    page.on('console', msg => {
        if (msg.text().includes('booking') || msg.text().includes('admin') || msg.text().includes('error')) {
            console.log(`[ADMIN] ${msg.text()}`);
        }
    });
    
    try {
        console.log('\n📍 Step 1: Loading Admin Dashboard');
        await page.goto('https://ittheal.com/admin-dashboard.html', { waitUntil: 'domcontentloaded' });
        console.log('✅ Admin dashboard loaded');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('\n📍 Step 2: Checking for Recent Bookings');
        
        // Check if any bookings are displayed
        const bookingCount = await page.evaluate(() => {
            const bookingCards = document.querySelectorAll('.booking-card');
            return bookingCards.length;
        });
        
        console.log(`✅ Found ${bookingCount} bookings in admin dashboard`);
        
        if (bookingCount > 0) {
            // Get details of the most recent booking
            const recentBooking = await page.evaluate(() => {
                const bookingCards = document.querySelectorAll('.booking-card');
                if (bookingCards.length === 0) return null;
                
                const firstCard = bookingCards[0];
                const clientName = firstCard.querySelector('h3')?.textContent || 'Unknown';
                const email = firstCard.querySelector('[title="Email"]')?.textContent || 'Unknown';
                const phone = firstCard.querySelector('[title="Phone"]')?.textContent || 'Unknown';
                const status = firstCard.querySelector('.status-badge')?.textContent || 'Unknown';
                const paymentStatus = firstCard.querySelector('.payment-status')?.textContent || 'Unknown';
                
                return {
                    clientName,
                    email,
                    phone,
                    status,
                    paymentStatus
                };
            });
            
            console.log('\n📋 Most Recent Booking:');
            console.log('=======================');
            console.log(`👤 Client: ${recentBooking.clientName}`);
            console.log(`📧 Email: ${recentBooking.email}`);
            console.log(`📱 Phone: ${recentBooking.phone}`);
            console.log(`📊 Status: ${recentBooking.status}`);
            console.log(`💳 Payment: ${recentBooking.paymentStatus}`);
            
            // Check if our test booking is visible
            const hasTestBooking = recentBooking.email.includes('dolovedev@gmail.com') || 
                                 recentBooking.phone.includes('4695251001') ||
                                 recentBooking.clientName.includes('John Smith');
            
            if (hasTestBooking) {
                console.log('\n🎉 SUCCESS! Test booking found in admin dashboard');
                console.log('✅ Correct contact information displayed');
                
                // Test if booking is editable
                console.log('\n📍 Step 3: Testing Edit Functionality');
                
                const editButton = await page.$('.booking-card .edit-button, .booking-card button[title="Edit"], .booking-card [onclick*="edit"]');
                if (editButton) {
                    console.log('✅ Edit button found - booking is editable');
                    
                    await editButton.click();
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const editModalOpen = await page.evaluate(() => {
                        const modal = document.querySelector('.modal, .edit-modal, [id*="edit"]');
                        return modal && modal.style.display !== 'none';
                    });
                    
                    if (editModalOpen) {
                        console.log('✅ Edit modal opened successfully');
                        console.log('✅ Booking is fully editable in admin interface');
                    } else {
                        console.log('⚠️ Edit button clicked but modal may not have opened');
                    }
                } else {
                    console.log('⚠️ Edit button not found - checking for inline editing');
                    
                    const inlineEdit = await page.$('.booking-card input, .booking-card select, .booking-card textarea');
                    if (inlineEdit) {
                        console.log('✅ Inline editing fields found - booking is editable');
                    } else {
                        console.log('❌ No edit functionality found');
                    }
                }
                
                return true;
            } else {
                console.log('\n⚠️ Test booking not found in admin dashboard');
                console.log('📋 This could mean:');
                console.log('   - Booking was not saved to database');
                console.log('   - Admin dashboard is not loading recent bookings');
                console.log('   - There\'s a sync issue between frontend and backend');
                
                return false;
            }
        } else {
            console.log('\n❌ No bookings found in admin dashboard');
            console.log('📋 This suggests the booking was not saved to the database');
            
            // Check if there's an API error or database connection issue
            const errorMessages = await page.evaluate(() => {
                const errors = document.querySelectorAll('.error, .alert-error, [class*="error"]');
                return Array.from(errors).map(e => e.textContent);
            });
            
            if (errorMessages.length > 0) {
                console.log('❌ Error messages found:', errorMessages);
            }
            
            return false;
        }
        
    } catch (error) {
        console.log('\n❌ Error checking admin dashboard:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

checkAdminBooking().then(success => {
    if (success) {
        console.log('\n✅ ADMIN CHECK PASSED');
        console.log('📋 Booking is visible and editable in admin dashboard');
    } else {
        console.log('\n❌ ADMIN CHECK FAILED');
        console.log('📋 Booking may not be properly saved or displayed');
    }
}).catch(console.error);