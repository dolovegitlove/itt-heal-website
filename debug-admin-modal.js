import { chromium } from 'playwright';

(async () => {
  console.log('🔍 Debug: Checking admin modal structure...');
  
  const browser = await chromium.launch({
    headless: true,
    slowMo: 1000,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to admin
    await page.goto('https://ittheal.com/admin');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of admin page
    await page.screenshot({ path: '/tmp/debug-admin-page.png', fullPage: true });
    
    // Check what navigation elements exist
    const navElements = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [data-nav-item]');
      return Array.from(buttons).map(btn => ({
        tagName: btn.tagName,
        id: btn.id,
        class: btn.className,
        dataNavItem: btn.getAttribute('data-nav-item'),
        text: btn.textContent?.trim()
      }));
    });
    
    console.log('🔍 Navigation elements found:');
    navElements.forEach(el => console.log(`  - ${el.tagName} id="${el.id}" class="${el.class}" data-nav-item="${el.dataNavItem}" text="${el.text}"`));
    
    // We're already on the bookings page, no need to navigate
    console.log('✅ Already on bookings page');
    
    // Check if new-booking-btn exists and is visible
    const newBookingBtnExists = await page.isVisible('#new-booking-btn');
    console.log(`\n🔍 #new-booking-btn visible: ${newBookingBtnExists}`);
    
    if (newBookingBtnExists) {
      // Click add booking button
      await page.click('#new-booking-btn');
      console.log('✅ Clicked new booking button');
      await page.waitForTimeout(3000);
    } else {
      console.log('❌ New booking button not found');
      
      // Check for modal overlays or elements that might be hiding it
      const modals = await page.evaluate(() => {
        const modals = document.querySelectorAll('.modal, [class*="modal"], [style*="display: block"]');
        return Array.from(modals).map(modal => ({
          className: modal.className,
          id: modal.id,
          display: getComputedStyle(modal).display,
          visibility: getComputedStyle(modal).visibility,
          zIndex: getComputedStyle(modal).zIndex
        }));
      });
      
      console.log('🔍 Modal elements found:');
      modals.forEach(modal => console.log(`  - ${modal.className} id="${modal.id}" display="${modal.display}" visibility="${modal.visibility}" z-index="${modal.zIndex}"`));
      
      // Check if the button is just hidden by CSS
      const buttonInfo = await page.evaluate(() => {
        const btn = document.querySelector('#new-booking-btn');
        if (btn) {
          const style = getComputedStyle(btn);
          return {
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            top: btn.getBoundingClientRect().top,
            left: btn.getBoundingClientRect().left,
            width: btn.getBoundingClientRect().width,
            height: btn.getBoundingClientRect().height
          };
        }
        return null;
      });
      
      console.log('🔍 Button info:', buttonInfo);
      
      // Take screenshot to see the current state
      await page.screenshot({ path: '/tmp/debug-no-button.png', fullPage: true });
      return;
    }
    
    // Get modal HTML
    const modalHTML = await page.evaluate(() => {
      const modal = document.querySelector('.modal.booking-modal');
      return modal ? modal.innerHTML : 'Modal not found';
    });
    
    console.log('📄 Modal HTML structure:');
    console.log(modalHTML.substring(0, 2000) + '...');
    
    // List all form elements
    const formElements = await page.evaluate(() => {
      const modal = document.querySelector('.modal.booking-modal');
      if (!modal) return [];
      
      const elements = modal.querySelectorAll('input, select, textarea');
      return Array.from(elements).map(el => ({
        tagName: el.tagName,
        id: el.id,
        name: el.name,
        type: el.type,
        visible: el.offsetParent !== null
      }));
    });
    
    console.log('\n📋 Form elements found:');
    formElements.forEach(el => {
      console.log(`  - ${el.tagName}${el.type ? `[${el.type}]` : ''} id="${el.id}" name="${el.name}" visible=${el.visible}`);
    });
    
    // Check if special_requests exists
    const specialRequestsExists = await page.isVisible('#special_requests');
    console.log(`\n🔍 #special_requests visible: ${specialRequestsExists}`);
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/debug-modal.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
})();