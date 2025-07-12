const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Quick Admin Dashboard Test...');
    
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 200,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--display=:99']
    });
    
    const page = await browser.newPage();
    
    // Capture errors
    page.on('console', msg => {
        const type = msg.type();
        if (type === 'error') {
            console.log(`🚨 JS ERROR: ${msg.text()}`);
        }
    });
    
    page.on('pageerror', error => {
        console.log(`💥 PAGE ERROR: ${error.message}`);
    });
    
    try {
        console.log('📖 Loading admin dashboard...');
        await page.goto('https://ittheal.com/admin-dashboard.html', { 
            waitUntil: 'networkidle0',
            timeout: 15000
        });
        
        console.log('✅ Page loaded');
        
        // Wait for initialization
        await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Test basic functionality
        console.log('🔍 Testing basic functionality...');
        
        const basicTest = await page.evaluate(() => {
            return {
                hasLoadInitialData: typeof window.loadInitialData === 'function',
                hasSetupEventListeners: typeof window.setupEventListeners === 'function',
                hasShowTab: typeof window.showTab === 'function',
                dashboardActive: document.querySelector('#dashboard-tab')?.classList.contains('active'),
                statsVisible: !!document.getElementById('todays-appointments'),
                currentStats: {
                    today: document.getElementById('todays-appointments')?.textContent,
                    week: document.getElementById('week-appointments')?.textContent,
                    clients: document.getElementById('total-clients')?.textContent,
                    revenue: document.getElementById('monthly-revenue')?.textContent
                }
            };
        });
        
        console.log('📊 Basic Test Results:', basicTest);
        
        // Test tab switching
        console.log('\n🔄 Testing tab switching...');
        
        const tabTests = ['bookings', 'schedule', 'availability'];
        for (const tab of tabTests) {
            console.log(`  Testing ${tab} tab...`);
            
            await page.click(`#${tab}-tab-button`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const isActive = await page.evaluate((tabId) => {
                const tabContent = document.getElementById(`${tabId}-tab`);
                return tabContent?.classList.contains('active');
            }, tab);
            
            console.log(`  ${tab}: ${isActive ? '✅ WORKING' : '❌ FAILED'}`);
        }
        
        // Take final screenshot
        await page.screenshot({ 
            path: '/home/ittz/projects/itt/site/admin-test-final.png',
            fullPage: true 
        });
        
        console.log('\n✅ Test completed - screenshot saved');
        
    } catch (error) {
        console.log(`💥 ERROR: ${error.message}`);
    }
    
    console.log('⏳ Keeping browser open for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    await browser.close();
})();