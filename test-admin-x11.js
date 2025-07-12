const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Testing Admin Dashboard with X11...');
    
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 1000,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--display=:0']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Listen for console errors
    page.on('console', msg => {
        const type = msg.type();
        if (type === 'error' || type === 'warning') {
            console.log(`❌ CONSOLE ${type.toUpperCase()}: ${msg.text()}`);
        }
    });
    
    page.on('pageerror', error => {
        console.log(`🚨 PAGE ERROR: ${error.message}`);
    });
    
    try {
        console.log('📖 Loading admin dashboard...');
        await page.goto('https://ittheal.com/admin-dashboard.html', { 
            waitUntil: 'networkidle0',
            timeout: 10000
        });
        
        console.log('✅ Page loaded');
        
        // Wait for initialization
        await page.waitForTimeout(3000);
        
        // Test dashboard stats
        console.log('📊 Testing dashboard stats...');
        const stats = await page.evaluate(() => {
            return {
                todaysAppointments: document.getElementById('todays-appointments')?.textContent,
                weekAppointments: document.getElementById('week-appointments')?.textContent,
                totalClients: document.getElementById('total-clients')?.textContent,
                monthlyRevenue: document.getElementById('monthly-revenue')?.textContent
            };
        });
        
        console.log('Stats:', stats);
        
        if (stats.todaysAppointments === '0' && stats.weekAppointments === '0') {
            console.log('❌ Dashboard stats not loading - still showing default zeros');
        } else {
            console.log('✅ Dashboard stats appear to be loading');
        }
        
        // Test each tab
        const tabs = ['bookings', 'schedule', 'availability', 'clients', 'settings'];
        
        for (const tab of tabs) {
            console.log(`🔄 Testing ${tab} tab...`);
            
            const tabButton = await page.$(`#${tab}-tab-button`);
            if (tabButton) {
                await tabButton.click();
                await page.waitForTimeout(2000);
                
                // Check if tab content is visible
                const isVisible = await page.evaluate((tabName) => {
                    const tabContent = document.getElementById(`${tabName}-tab`);
                    return tabContent && tabContent.classList.contains('active');
                }, tab);
                
                if (isVisible) {
                    console.log(`✅ ${tab} tab switched successfully`);
                } else {
                    console.log(`❌ ${tab} tab did not switch properly`);
                }
            } else {
                console.log(`❌ ${tab} tab button not found`);
            }
            
            await page.waitForTimeout(1000);
        }
        
        // Check for JavaScript errors in network
        const responses = [];
        page.on('response', response => {
            if (response.status() >= 400) {
                console.log(`❌ HTTP ERROR: ${response.status()} ${response.url()}`);
            }
        });
        
        console.log('✅ Admin dashboard test completed');
        
    } catch (error) {
        console.log(`🚨 ERROR: ${error.message}`);
    }
    
    // Keep browser open for 30 seconds for manual inspection
    console.log('🔍 Keeping browser open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    
    await browser.close();
})();