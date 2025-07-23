const { chromium } = require('playwright');

async function findBookings() {
    console.log('🔍 Finding available bookings in admin...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        // Navigate to admin page
        console.log('📱 Navigating to admin page...');
        await page.goto('https://ittheal.com/3t/admin/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(5000);
        
        // Check what booking sections exist
        console.log('📋 Checking for booking sections...');
        
        const recentBookingsSection = page.locator('#recentBookingsTable');
        const hasRecentBookings = await recentBookingsSection.isVisible();
        console.log(`Recent bookings section visible: ${hasRecentBookings}`);
        
        if (hasRecentBookings) {
            // Count booking cards
            const bookingCards = page.locator('.booking-card');
            const cardCount = await bookingCards.count();
            console.log(`Found ${cardCount} booking cards`);
            
            if (cardCount > 0) {
                // Get details of first booking card
                const firstCard = bookingCards.first();
                const cardHtml = await firstCard.innerHTML();
                console.log('First booking card HTML preview:', cardHtml.substring(0, 500));
                
                // Look for edit buttons
                const editButtons = page.locator('.booking-card .booking-actions button');
                const editButtonCount = await editButtons.count();
                console.log(`Found ${editButtonCount} action buttons in booking cards`);
                
                if (editButtonCount > 0) {
                    const firstEditButton = editButtons.first();
                    const buttonText = await firstEditButton.textContent();
                    console.log(`First action button text: "${buttonText}"`);
                    
                    console.log('✅ Found bookings with action buttons - ready for payment test');
                } else {
                    console.log('⚠️ No action buttons found in booking cards');
                }
            } else {
                console.log('⚠️ No booking cards found');
            }
        } else {
            console.log('⚠️ Recent bookings section not visible');
            
            // Check for other booking sections
            const allBookings = page.locator('h2, h3, .section-header');
            const sectionCount = await allBookings.count();
            console.log(`Found ${sectionCount} potential section headers`);
            
            for (let i = 0; i < Math.min(sectionCount, 5); i++) {
                const sectionText = await allBookings.nth(i).textContent();
                console.log(`Section ${i + 1}: "${sectionText}"`);
            }
        }
        
        console.log('🔍 Booking discovery completed');
        
    } catch (error) {
        console.error('❌ Discovery failed:', error.message);
    } finally {
        console.log('🏁 Keeping browser open for 15 seconds for review...');
        await page.waitForTimeout(15000);
        await browser.close();
    }
}

findBookings().catch(console.error);