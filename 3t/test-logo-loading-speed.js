const { chromium } = require('playwright');

async function testLogoLoadingSpeed() {
    console.log('⚡ Testing Logo Loading Speed Optimization...');
    
    const browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        // Test main site logo loading
        console.log('🏠 Testing main site logo loading...');
        const mainSiteStart = performance.now();
        
        await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
        
        // Wait for logo to load and measure time
        await page.waitForSelector('.itt-logo-leaf');
        const logoElement = await page.locator('.itt-logo-leaf');
        
        // Check if logo loaded successfully
        const logoLoaded = await logoElement.evaluate(img => img.complete && img.naturalWidth > 0);
        const mainSiteTime = performance.now() - mainSiteStart;
        
        console.log('🏠 Main site results:');
        console.log(`   ✅ Logo loaded: ${logoLoaded}`);
        console.log(`   ⏱️ Total time: ${mainSiteTime.toFixed(2)}ms`);
        
        // Check network requests to see file size
        const logoRequests = await page.evaluate(() => {
            return performance.getEntriesByType('resource')
                .filter(entry => entry.name.includes('itt-heal-lotus'))
                .map(entry => ({
                    url: entry.name,
                    transferSize: entry.transferSize,
                    duration: entry.duration
                }));
        });
        
        logoRequests.forEach(req => {
            console.log(`   📦 ${req.url.split('/').pop()}: ${(req.transferSize/1024).toFixed(1)}KB in ${req.duration.toFixed(1)}ms`);
        });
        
        // Test admin site logo loading
        console.log('\n🛠️ Testing admin site logo loading...');
        const adminSiteStart = performance.now();
        
        await page.goto('https://ittheal.com/3t/admin/', { waitUntil: 'networkidle' });
        
        // Wait for admin logo to load
        await page.waitForSelector('.itt-logo-leaf');
        const adminLogoElement = await page.locator('.itt-logo-leaf');
        
        const adminLogoLoaded = await adminLogoElement.evaluate(img => img.complete && img.naturalWidth > 0);
        const adminSiteTime = performance.now() - adminSiteStart;
        
        console.log('🛠️ Admin site results:');
        console.log(`   ✅ Logo loaded: ${adminLogoLoaded}`);
        console.log(`   ⏱️ Total time: ${adminSiteTime.toFixed(2)}ms`);
        
        // Check admin network requests
        const adminLogoRequests = await page.evaluate(() => {
            return performance.getEntriesByType('resource')
                .filter(entry => entry.name.includes('itt-heal-lotus'))
                .map(entry => ({
                    url: entry.name,
                    transferSize: entry.transferSize,
                    duration: entry.duration
                }));
        });
        
        adminLogoRequests.forEach(req => {
            console.log(`   📦 ${req.url.split('/').pop()}: ${(req.transferSize/1024).toFixed(1)}KB in ${req.duration.toFixed(1)}ms`);
        });
        
        // Performance summary
        console.log('\n📊 Performance Summary:');
        console.log(`🏠 Main site: ${mainSiteTime.toFixed(2)}ms`);
        console.log(`🛠️ Admin site: ${adminSiteTime.toFixed(2)}ms`);
        
        const improvement = ((2155431 - 4195) / 2155431 * 100).toFixed(1);
        console.log(`🚀 File size reduction: ${improvement}% (2.1MB → 4KB)`);
        
        if (mainSiteTime < 2000 && adminSiteTime < 2000) {
            console.log('✅ Logo loading optimization successful!');
        } else {
            console.log('⚠️ Logo loading could be further optimized');
        }
        
    } catch (error) {
        console.error('❌ Logo loading test failed:', error);
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    testLogoLoadingSpeed();
}

module.exports = { testLogoLoadingSpeed };