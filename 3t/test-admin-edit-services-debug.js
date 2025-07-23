const { chromium } = require('playwright');

async function testAdminEditServicesDebug() {
    console.log('🔧 Testing Admin Edit Services Loading...');
    
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        // Navigate to admin dashboard
        console.log('📋 Navigating to admin dashboard...');
        await page.goto('https://ittheal.com/3t/admin/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Wait for page to load completely
        await page.waitForTimeout(3000);
        
        // Check if shared config loaded
        const configLoaded = await page.evaluate(() => {
            return typeof window.ITTHealConfig !== 'undefined' && window.ITTHealConfig !== null;
        });
        console.log(`✅ Shared config loaded: ${configLoaded}`);
        
        if (configLoaded) {
            const sessionOptions = await page.evaluate(() => {
                try {
                    return window.ITTHealConfig.getSessionOptions();
                } catch (e) {
                    return { error: e.message };
                }
            });
            console.log('📊 Available session options:', sessionOptions);
        }
        
        // Check if there are any bookings to edit
        await page.waitForTimeout(2000);
        const bookingCards = await page.locator('.booking-card').count();
        console.log(`📅 Found ${bookingCards} booking cards`);
        
        if (bookingCards === 0) {
            console.log('⚠️ No bookings found to test edit functionality');
            await browser.close();
            return;
        }
        
        // Find and click the first edit button
        console.log('🖱️ Looking for edit button on first booking card...');
        const editButton = page.locator('.booking-card').first().locator('button:has-text("Edit"), button[onclick*="editBooking"]').first();
        
        const editButtonExists = await editButton.count() > 0;
        console.log(`🔍 Edit button found: ${editButtonExists}`);
        
        if (editButtonExists) {
            console.log('🖱️ Clicking edit button...');
            await editButton.click();
            
            // Wait for modal to appear
            await page.waitForTimeout(2000);
            
            // Check if edit modal opened
            const modalVisible = await page.locator('#editBookingModal').isVisible();
            console.log(`📱 Edit modal visible: ${modalVisible}`);
            
            if (modalVisible) {
                // Check if service type dropdown exists and has options
                await page.waitForTimeout(1000);
                
                const serviceDropdown = page.locator('#editServiceType');
                const dropdownExists = await serviceDropdown.count() > 0;
                console.log(`📋 Service dropdown exists: ${dropdownExists}`);
                
                if (dropdownExists) {
                    const optionCount = await serviceDropdown.locator('option').count();
                    console.log(`📊 Service dropdown option count: ${optionCount}`);
                    
                    const options = await serviceDropdown.locator('option').allTextContents();
                    console.log('📝 Service dropdown options:', options);
                    
                    // Check if populateEditServiceTypes was called
                    const editServiceTypesWasCalled = await page.evaluate(() => {
                        // Check if the function exists
                        return typeof populateEditServiceTypes === 'function';
                    });
                    console.log(`🔧 populateEditServiceTypes function exists: ${editServiceTypesWasCalled}`);
                    
                    // Try to manually call populateEditServiceTypes
                    console.log('🔧 Manually calling populateEditServiceTypes...');
                    const manualResult = await page.evaluate(() => {
                        try {
                            if (typeof populateEditServiceTypes === 'function') {
                                populateEditServiceTypes();
                                return { success: true, message: 'Function called successfully' };
                            } else {
                                return { success: false, message: 'Function not found' };
                            }
                        } catch (e) {
                            return { success: false, message: e.message };
                        }
                    });
                    console.log('🔧 Manual call result:', manualResult);
                    
                    // Wait and check options again
                    await page.waitForTimeout(1000);
                    const newOptionCount = await serviceDropdown.locator('option').count();
                    const newOptions = await serviceDropdown.locator('option').allTextContents();
                    console.log(`📊 After manual call - option count: ${newOptionCount}`);
                    console.log('📝 After manual call - options:', newOptions);
                }
                
                // Take a screenshot of the edit modal
                await page.screenshot({ path: '/home/ittz/projects/itt/site/3t/admin-edit-modal-debug.png' });
                console.log('📸 Screenshot saved: admin-edit-modal-debug.png');
            }
        }
        
        console.log('✅ Admin edit services debug test completed');
        
    } catch (error) {
        console.error('❌ Error during admin edit services debug:', error.message);
        await page.screenshot({ path: '/home/ittz/projects/itt/site/3t/admin-edit-error-debug.png' });
    }
    
    await browser.close();
}

// Run the test
testAdminEditServicesDebug().catch(console.error);