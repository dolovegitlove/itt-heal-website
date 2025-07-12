const puppeteer = require('puppeteer');

(async () => {
    console.log('🧪 Testing Admin Dashboard Edit Functionality...');
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Navigate to admin dashboard
        console.log('📍 Navigating to admin dashboard...');
        await page.goto('https://ittheal.com/admin-dashboard.html');
        
        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Click on Bookings tab
        console.log('📋 Clicking on Bookings tab...');
        await page.click('.nav-tab[data-tab="bookings"]');
        
        // Wait for bookings to load
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check if edit buttons exist
        const editButtons = await page.evaluate(() => {
            return document.querySelectorAll('.edit-btn').length;
        });
        
        console.log(`🔘 Edit buttons found: ${editButtons}`);
        
        if (editButtons > 0) {
            console.log('✅ Edit buttons are present');
            
            // Click first edit button
            console.log('🖱️ Clicking first edit button...');
            await page.click('.edit-btn:first-child');
            
            // Wait for modal to open
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if modal is open
            const modalOpen = await page.evaluate(() => {
                const modal = document.getElementById('edit-modal');
                return modal && modal.classList.contains('active');
            });
            
            console.log(`📦 Edit modal open: ${modalOpen}`);
            
            if (modalOpen) {
                console.log('✅ Edit modal opens successfully');
                
                // Test form fields
                const formFields = await page.evaluate(() => {
                    const fields = ['edit-client-name', 'edit-service-type', 'edit-session-status'];
                    return fields.map(id => {
                        const field = document.getElementById(id);
                        return field ? field.value : null;
                    });
                });
                
                console.log('📝 Form fields populated:', formFields);
                
                // Test closing modal
                await page.click('#cancel-edit-btn');
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const modalClosed = await page.evaluate(() => {
                    const modal = document.getElementById('edit-modal');
                    return modal && !modal.classList.contains('active');
                });
                
                console.log(`❌ Modal closed: ${modalClosed}`);
            } else {
                console.log('❌ Edit modal did not open');
            }
        } else {
            console.log('❌ No edit buttons found');
        }
        
        // Test inline editing
        console.log('🔄 Testing inline editing...');
        const inlineEditTest = await page.evaluate(() => {
            const editableCells = document.querySelectorAll('.editable');
            return editableCells.length > 0;
        });
        
        console.log(`📝 Inline editable cells: ${inlineEditTest}`);
        
        if (inlineEditTest) {
            console.log('✅ Inline editing capability present');
        } else {
            console.log('❌ Inline editing not available');
        }
        
        console.log('🎉 Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
})();