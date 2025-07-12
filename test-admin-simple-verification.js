const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Navigate to admin dashboard
    await page.goto('https://ittheal.com/admin-dashboard.html');
    
    // Wait for the dashboard to fully load
    await page.waitForSelector('.nav-tab[data-tab="bookings"]');
    
    // Click on Bookings tab
    await page.click('.nav-tab[data-tab="bookings"]');
    
    // Wait for the API data to load (longer wait)
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Check what's in the table
    const tableHTML = await page.evaluate(() => {
        const tbody = document.querySelector('#bookings-table tbody');
        return tbody ? tbody.innerHTML : 'No tbody found';
    });
    
    console.log('Table HTML (first 500 chars):', tableHTML.substring(0, 500));
    
    // Check for edit buttons specifically
    const editButtonCount = await page.evaluate(() => {
        const buttons = document.querySelectorAll('.edit-btn');
        console.log('Found buttons:', buttons.length);
        return buttons.length;
    });
    
    console.log('Edit buttons found:', editButtonCount);
    
    // Check if updateBookingsTable function exists
    const functionExists = await page.evaluate(() => {
        return typeof window.dashboard !== 'undefined' && typeof window.dashboard.updateBookingsTable === 'function';
    });
    
    console.log('updateBookingsTable function exists:', functionExists);
    
    await browser.close();
})();