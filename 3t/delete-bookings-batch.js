const { chromium } = require('playwright');

async function deleteBookingsBatch() {
    console.log('🗑️ Starting batch deletion (continuing from previous)...');
    
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
        
        let deletedInThisBatch = 0;
        const targetDeletions = 30; // Delete 30 at a time to avoid timeout
        
        while (deletedInThisBatch < targetDeletions) {
            // Check for bookings
            const bookingCount = await page.locator('.booking-card').count();
            
            if (bookingCount === 0) {
                console.log('✅ No more bookings found!');
                break;
            }
            
            console.log(`📅 ${bookingCount} bookings visible, deleting...`);
            
            // Delete first booking
            const deleteButton = page.locator('.booking-card').first()
                .locator('button').filter({ hasText: /Delete|🗑️/ }).first();
            
            if (await deleteButton.count() === 0) {
                console.log('⚠️ No delete button found, refreshing...');
                await page.reload({ waitUntil: 'networkidle' });
                await page.waitForTimeout(2000);
                continue;
            }
            
            await deleteButton.click();
            await page.waitForTimeout(800);
            
            // Click confirm if needed
            const confirmButton = page.locator('button').filter({ hasText: /Delete|Confirm|Yes/ });
            if (await confirmButton.count() > 0) {
                await confirmButton.first().click();
            }
            
            deletedInThisBatch++;
            console.log(`✅ Deleted #${deletedInThisBatch}`);
            
            await page.waitForTimeout(1000);
            
            // Refresh every 10 deletions
            if (deletedInThisBatch % 10 === 0) {
                console.log('🔄 Refreshing page...');
                await page.reload({ waitUntil: 'networkidle' });
                await page.waitForTimeout(2000);
            }
        }
        
        console.log(`\n✅ Batch complete! Deleted ${deletedInThisBatch} bookings`);
        
        // Check remaining
        const finalCount = await page.locator('.booking-card').count();
        console.log(`📊 ${finalCount} bookings visible on current page`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    await browser.close();
}

// Run the batch deletion
deleteBookingsBatch().catch(console.error);