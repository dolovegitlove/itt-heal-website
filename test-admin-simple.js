const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Testing Admin Dashboard (Headless)...');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Capture all console messages
    page.on('console', msg => {
        console.log(`[CONSOLE ${msg.type()}]: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
        console.log(`🚨 PAGE ERROR: ${error.message}`);
    });
    
    try {
        console.log('📖 Loading admin dashboard...');
        const response = await page.goto('https://ittheal.com/admin-dashboard.html', { 
            waitUntil: 'networkidle0',
            timeout: 15000
        });
        
        console.log(`✅ Page loaded with status: ${response.status()}`);
        
        // Wait for potential initialization
        await page.waitForTimeout(5000);
        
        // Check if essential elements exist
        const elementsCheck = await page.evaluate(() => {
            const checks = {
                hasStatsElements: !!(
                    document.getElementById('todays-appointments') &&
                    document.getElementById('week-appointments') &&
                    document.getElementById('total-clients') &&
                    document.getElementById('monthly-revenue')
                ),
                hasTabButtons: !!(
                    document.getElementById('dashboard-tab-button') &&
                    document.getElementById('bookings-tab-button') &&
                    document.getElementById('schedule-tab-button')
                ),
                hasTabContents: !!(
                    document.getElementById('dashboard-tab') &&
                    document.getElementById('bookings-tab') &&
                    document.getElementById('schedule-tab')
                ),
                currentStats: {
                    todaysAppointments: document.getElementById('todays-appointments')?.textContent,
                    weekAppointments: document.getElementById('week-appointments')?.textContent,
                    totalClients: document.getElementById('total-clients')?.textContent,
                    monthlyRevenue: document.getElementById('monthly-revenue')?.textContent
                },
                hasJavaScript: !!(window.loadInitialData && window.setupEventListeners),
                activeTab: document.querySelector('.tab-content.active')?.id,
                visibleContent: document.querySelector('.tab-content.active')?.innerHTML?.length > 100
            };
            
            return checks;
        });
        
        console.log('📊 Element Check Results:');
        console.log(JSON.stringify(elementsCheck, null, 2));
        
        // Test tab switching
        console.log('🔄 Testing tab switching...');
        
        const tabs = ['bookings', 'schedule', 'availability', 'clients', 'settings'];
        const tabResults = {};
        
        for (const tab of tabs) {
            try {
                const tabButton = await page.$(`#${tab}-tab-button`);
                if (tabButton) {
                    await tabButton.click();
                    await page.waitForTimeout(2000);
                    
                    const isActive = await page.evaluate((tabName) => {
                        const tabContent = document.getElementById(`${tabName}-tab`);
                        return tabContent && tabContent.classList.contains('active');
                    }, tab);
                    
                    tabResults[tab] = isActive ? 'WORKING' : 'FAILED';
                    console.log(`  ${tab}: ${tabResults[tab]}`);
                } else {
                    tabResults[tab] = 'BUTTON_NOT_FOUND';
                    console.log(`  ${tab}: BUTTON_NOT_FOUND`);
                }
            } catch (error) {
                tabResults[tab] = `ERROR: ${error.message}`;
                console.log(`  ${tab}: ERROR - ${error.message}`);
            }
        }
        
        // Final diagnosis
        console.log('\n🩺 DIAGNOSIS:');
        if (!elementsCheck.hasStatsElements) {
            console.log('❌ CRITICAL: Dashboard stat elements missing');
        }
        if (!elementsCheck.hasJavaScript) {
            console.log('❌ CRITICAL: JavaScript functions not loaded');
        }
        if (elementsCheck.currentStats.todaysAppointments === '0') {
            console.log('⚠️  WARNING: Dashboard stats not updating (still showing defaults)');
        }
        if (!elementsCheck.visibleContent) {
            console.log('❌ CRITICAL: No content visible in active tab');
        }
        
        const workingTabs = Object.values(tabResults).filter(r => r === 'WORKING').length;
        console.log(`📋 Tab Summary: ${workingTabs}/${tabs.length} tabs working`);
        
        if (workingTabs === 0) {
            console.log('🚨 CRITICAL: NO TABS ARE WORKING');
        }
        
    } catch (error) {
        console.log(`🚨 ERROR: ${error.message}`);
    }
    
    await browser.close();
})();