const { chromium } = require('playwright');

async function checkFinalBookings() {
    console.log('🔍 Checking final booking status...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 300,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Auto-accept all dialogs
    page.on('dialog', async dialog => {
        await dialog.accept();
    });
    
    try {
        // Navigate to admin dashboard
        console.log('📋 Loading admin dashboard...');
        await page.goto('https://ittheal.com/3t/admin/', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        
        // Check for bookings
        const bookingCount = await page.locator('.booking-card').count();
        console.log(`📅 Found ${bookingCount} bookings visible`);
        
        if (bookingCount === 0) {
            console.log('✅ ALL BOOKINGS CLEARED! The admin dashboard is now empty.');
            await page.screenshot({ path: '/home/ittz/projects/itt/site/3t/admin-empty-success.png' });
            console.log('📸 Screenshot saved: admin-empty-success.png');
        } else {
            console.log(`⏳ Still ${bookingCount} bookings remaining. Deleting them now...`);
            
            // Delete remaining bookings
            let deleted = 0;
            while (await page.locator('.booking-card').count() > 0 && deleted < 10) {
                const deleteButton = page.locator('.booking-card').first()
                    .locator('button').filter({ hasText: /Delete|🗑️/ }).first();
                
                if (await deleteButton.count() > 0) {
                    await deleteButton.click();
                    await page.waitForTimeout(800);
                    
                    const confirmButton = page.locator('button').filter({ hasText: /Delete|Confirm|Yes/ });
                    if (await confirmButton.count() > 0) {
                        await confirmButton.first().click();
                    }
                    
                    deleted++;
                    console.log(`✅ Deleted booking #${deleted}`);
                    await page.waitForTimeout(1000);
                } else {
                    break;
                }
            }
            
            // Final check
            await page.reload({ waitUntil: 'networkidle' });
            await page.waitForTimeout(2000);
            const finalCount = await page.locator('.booking-card').count();
            
            if (finalCount === 0) {
                console.log('✅ SUCCESS! All bookings have been deleted.');
            } else {
                console.log(`📊 ${finalCount} bookings still visible.`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    await browser.close();
}

// Run the final check
checkFinalBookings().catch(console.error);