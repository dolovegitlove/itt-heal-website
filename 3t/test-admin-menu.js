const { chromium } = require('playwright');

async function testAdminMenu() {
    console.log('🎯 Testing Admin Menu Functionality...');
    
    const browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        // Navigate to admin dashboard
        console.log('📱 Loading admin dashboard...');
        await page.goto('https://ittheal.com/3t/admin/', { waitUntil: 'networkidle' });
        
        // Wait for page to fully load
        await page.waitForTimeout(2000);
        
        // Check if hamburger button exists
        const hamburgerBtn = await page.locator('#hamburger-btn');
        const hamburgerExists = await hamburgerBtn.count() > 0;
        console.log('🍔 Hamburger button exists:', hamburgerExists);
        
        if (hamburgerExists) {
            // Check initial state - sidebar should be hidden on mobile
            const sidebar = await page.locator('#sidebar');
            const initiallyHidden = await sidebar.evaluate(el => !el.classList.contains('active'));
            console.log('👁️ Sidebar initially hidden:', initiallyHidden);
            
            // Click hamburger button
            console.log('🖱️ Clicking hamburger button...');
            await hamburgerBtn.click();
            await page.waitForTimeout(500);
            
            // Check if sidebar is now visible
            const sidebarAfterClick = await sidebar.evaluate(el => el.classList.contains('active'));
            console.log('✅ Sidebar visible after click:', sidebarAfterClick);
            
            // Check if overlay is active
            const overlay = await page.locator('#mobileMenuOverlay');
            const overlayActive = await overlay.evaluate(el => el.classList.contains('active'));
            console.log('📄 Overlay active:', overlayActive);
            
            // Test clicking overlay to close menu
            if (overlayActive) {
                console.log('🖱️ Clicking overlay to close menu...');
                await overlay.click();
                await page.waitForTimeout(500);
                
                const sidebarAfterOverlay = await sidebar.evaluate(el => el.classList.contains('active'));
                console.log('❌ Sidebar hidden after overlay click:', !sidebarAfterOverlay);
            }
            
            // Test navigation items
            console.log('🔗 Testing navigation items...');
            await hamburgerBtn.click(); // Open menu again
            await page.waitForTimeout(500);
            
            const navItems = await page.locator('.admin-nav-link').count();
            console.log('📋 Navigation items found:', navItems);
            
            if (navItems > 0) {
                // Click first nav item
                await page.locator('.admin-nav-link').first().click();
                await page.waitForTimeout(500);
                
                const sidebarAfterNav = await sidebar.evaluate(el => el.classList.contains('active'));
                console.log('🚪 Menu closes after navigation:', !sidebarAfterNav);
            }
            
            console.log('✅ Admin menu functionality test completed successfully!');
            
        } else {
            console.log('❌ Hamburger button not found');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    testAdminMenu();
}

module.exports = { testAdminMenu };