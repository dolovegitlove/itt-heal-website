// Test script for menu scroll fix

const { chromium } = require("playwright");

async function testMenuScrollFix() {
    console.log("🧪 Testing Mac 15-inch menu scroll fix...");
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Set Mac 15-inch screen size (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    
    try {
        // Navigate to the site
        await page.goto("http://localhost:8080", { waitUntil: "networkidle" });
        
        console.log("✅ Page loaded successfully");
        
        // Wait for the page to fully load
        await page.waitForTimeout(2000);
        
        // Test 1: Check if hamburger menu is visible
        const hamburgerBtn = await page.$("#hamburger-btn");
        if (\!hamburgerBtn) {
            throw new Error("Hamburger button not found");
        }
        console.log("✅ Hamburger button found");
        
        // Test 2: Click hamburger to open menu
        await hamburgerBtn.click();
        await page.waitForTimeout(500);
        
        // Check if menu is open
        const menu = await page.$("#mobile-menu");
        const menuDisplay = await menu.evaluate(el => window.getComputedStyle(el).display);
        console.log(`Menu display: ${menuDisplay}`);
        
        if (menuDisplay === "none") {
            throw new Error("Menu did not open");
        }
        console.log("✅ Menu opened successfully");
        
        // Test 3: Check if body overflow is set to hidden
        const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
        console.log(`Body overflow after menu open: "${bodyOverflow}"`);
        
        if (bodyOverflow \!== "hidden") {
            throw new Error("Body overflow not set to hidden when menu opens");
        }
        console.log("✅ Body scroll disabled when menu opens");
        
        // Test 4: Click a menu item
        const menuItem = await page.$("#mobile-menu a[href=\"#services\"]");
        if (\!menuItem) {
            throw new Error("Menu item not found");
        }
        
        await menuItem.click();
        await page.waitForTimeout(1000);
        
        // Test 5: Check if body overflow is restored
        const bodyOverflowAfterClick = await page.evaluate(() => document.body.style.overflow);
        console.log(`Body overflow after menu click: "${bodyOverflowAfterClick}"`);
        
        if (bodyOverflowAfterClick === "hidden") {
            throw new Error("Body overflow still locked after menu click");
        }
        console.log("✅ Body scroll restored after menu click");
        
        // Test 6: Test scrolling functionality
        const scrollBefore = await page.evaluate(() => window.pageYOffset);
        await page.evaluate(() => window.scrollTo(0, 500));
        await page.waitForTimeout(500);
        const scrollAfter = await page.evaluate(() => window.pageYOffset);
        
        console.log(`Scroll before: ${scrollBefore}, after: ${scrollAfter}`);
        
        if (scrollAfter === scrollBefore) {
            throw new Error("Scrolling is still locked");
        }
        console.log("✅ Scrolling works after menu interaction");
        
        console.log("\n🎉 All tests passed\! Menu scroll fix is working correctly.");
        
    } catch (error) {
        console.error("❌ Test failed:", error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
testMenuScrollFix().catch(console.error);
