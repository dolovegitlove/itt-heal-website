const { chromium } = require('playwright');

async function deleteAllBookings() {
    console.log('🗑️ Deleting all bookings from admin dashboard...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        // Navigate to admin dashboard
        console.log('📋 Navigating to admin dashboard...');
        await page.goto('https://ittheal.com/3t/admin/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Wait for page to load
        await page.waitForTimeout(3000);
        
        let deletedCount = 0;
        let totalAttempts = 0;
        const maxAttempts = 50; // Safety limit
        
        while (totalAttempts < maxAttempts) {
            totalAttempts++;
            
            // Check for booking cards
            const bookingCards = await page.locator('.booking-card').count();
            console.log(`📅 Found ${bookingCards} booking cards (attempt ${totalAttempts})`);
            
            if (bookingCards === 0) {
                console.log('✅ No more bookings to delete');
                break;
            }
            
            // Find delete button on first booking card
            const deleteButton = page.locator('.booking-card').first().locator('button:has-text("Delete"), button[onclick*="deleteBooking"]').first();
            
            const deleteButtonExists = await deleteButton.count() > 0;
            console.log(`🔍 Delete button found: ${deleteButtonExists}`);
            
            if (deleteButtonExists) {
                console.log('🖱️ Clicking delete button...');
                await deleteButton.click();
                
                // Wait for confirmation dialog
                await page.waitForTimeout(1000);
                
                // Look for confirmation dialog and confirm deletion
                const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")').first();
                const confirmExists = await confirmButton.count() > 0;
                
                if (confirmExists) {
                    console.log('✅ Confirming deletion...');
                    await confirmButton.click();
                    deletedCount++;
                } else {
                    // Try to handle browser confirmation dialog
                    page.on('dialog', async dialog => {
                        console.log('✅ Confirming browser dialog...');
                        await dialog.accept();
                        deletedCount++;
                    });
                    
                    // Click delete again to trigger dialog
                    await deleteButton.click();
                }
                
                // Wait for deletion to process and page to update
                await page.waitForTimeout(2000);
                
                console.log(`🗑️ Deleted booking ${deletedCount}`);
                
            } else {
                console.log('⚠️ No delete button found on first booking card');
                break;
            }
        }
        
        console.log(`✅ Deletion complete! Deleted ${deletedCount} bookings in ${totalAttempts} attempts`);
        
        // Take final screenshot
        await page.screenshot({ path: '/home/ittz/projects/itt/site/3t/admin-after-deletion.png' });
        console.log('📸 Final screenshot saved: admin-after-deletion.png');
        
    } catch (error) {
        console.error('❌ Error during booking deletion:', error.message);
        await page.screenshot({ path: '/home/ittz/projects/itt/site/3t/admin-deletion-error.png' });
    }
    
    await browser.close();
}

// Run the deletion
deleteAllBookings().catch(console.error);