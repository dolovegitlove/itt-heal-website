const { chromium } = require('playwright');

(async () => {
    console.log('🔍 Testing Service Type Mapping Fix');
    console.log('===================================');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 300,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        // Navigate to booking page
        await page.goto('https://ittheal.com/3t/');
        await page.waitForTimeout(2000);

        console.log('📍 Testing service type mapping for each service...');

        const services = [
            { service: '60min', expectedServiceType: '60min_massage' },
            { service: '90min', expectedServiceType: '90min_massage' },
            { service: 'fasciaflow', expectedServiceType: 'fasciaflow' }
        ];

        for (const { service, expectedServiceType } of services) {
            console.log(`\n🔍 Testing ${service}:`);
            
            // Select the service
            await page.locator(`[data-service="${service}"]`).click();
            await page.waitForTimeout(1000);

            // Test the service type mapping logic
            const serviceMapping = await page.evaluate(() => {
                const selectedServiceOption = document.querySelector('.service-option.active');
                const dataService = selectedServiceOption?.getAttribute('data-service');
                const dataServiceType = selectedServiceOption?.getAttribute('data-service-type');
                const paymentServiceType = selectedServiceOption?.getAttribute('data-service-type') || dataService;
                
                return {
                    dataService,
                    dataServiceType,
                    paymentServiceType,
                    selectedServiceVar: window.selectedService
                };
            });

            console.log(`  data-service: ${serviceMapping.dataService}`);
            console.log(`  data-service-type: ${serviceMapping.dataServiceType}`);
            console.log(`  paymentServiceType (what we'd send): ${serviceMapping.paymentServiceType}`);
            console.log(`  expectedServiceType: ${expectedServiceType}`);
            
            if (serviceMapping.paymentServiceType === expectedServiceType) {
                console.log(`  ✅ CORRECT: Payment will use ${serviceMapping.paymentServiceType}`);
            } else {
                console.log(`  ❌ INCORRECT: Expected ${expectedServiceType}, got ${serviceMapping.paymentServiceType}`);
            }
        }

        // Test the payment service type logic specifically for fasciaflow
        console.log('\n🎯 Testing FasciaFlow Payment Service Type:');
        await page.locator('[data-service="fasciaflow"]').click();
        await page.waitForTimeout(1000);

        const fasciaflowTest = await page.evaluate(() => {
            // Simulate the payment service type selection logic
            const selectedServiceOption = document.querySelector('.service-option.active');
            const paymentServiceType = selectedServiceOption?.getAttribute('data-service-type') || selectedService;
            
            return {
                activeElementExists: !!selectedServiceOption,
                dataServiceType: selectedServiceOption?.getAttribute('data-service-type'),
                paymentServiceType,
                wouldWorkForPayment: paymentServiceType === 'fasciaflow'
            };
        });

        console.log('📊 FasciaFlow Payment Test Results:');
        console.log(`  Active element found: ${fasciaflowTest.activeElementExists}`);  
        console.log(`  data-service-type: ${fasciaflowTest.dataServiceType}`);
        console.log(`  Payment service type: ${fasciaflowTest.paymentServiceType}`);
        console.log(`  Will work for payment: ${fasciaflowTest.wouldWorkForPayment}`);

        if (fasciaflowTest.wouldWorkForPayment) {
            console.log('\n🎉 SUCCESS: FasciaFlow service type mapping fix is working!');
            console.log('   The payment will now send "fasciaflow" which the backend accepts.');
        } else {
            console.log('\n❌ ISSUE: FasciaFlow service type mapping still needs work.');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
})();