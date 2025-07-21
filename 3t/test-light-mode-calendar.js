const { chromium } = require('playwright');

async function testLightModeCalendar() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--window-size=375,812', '--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 812 });
    
    console.log('🔍 Testing light mode calendar styling...');
    await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
    
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(2000);
    
    await page.waitForSelector('#custom-calendar-container', { timeout: 10000 });
    
    // Clear cache to ensure we get the updated styles
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(2000);
    await page.waitForSelector('#custom-calendar-container', { timeout: 10000 });
    
    // Analyze light mode colors
    const colorAnalysis = await page.evaluate(() => {
      const container = document.getElementById('custom-calendar-container');
      const prevButton = document.getElementById('prev-month');
      const nextButton = document.getElementById('next-month');
      const dayHeaders = document.querySelectorAll('[role="columnheader"]');
      const availableDates = document.querySelectorAll('.calendar-date:not([disabled]):not([role="columnheader"])');
      const disabledDates = document.querySelectorAll('.calendar-date[disabled]');
      
      // Get computed styles
      const containerStyle = window.getComputedStyle(container);
      const prevButtonStyle = prevButton ? window.getComputedStyle(prevButton) : null;
      const headerStyle = dayHeaders.length > 0 ? window.getComputedStyle(dayHeaders[0]) : null;
      const availableStyle = availableDates.length > 0 ? window.getComputedStyle(availableDates[0]) : null;
      const disabledStyle = disabledDates.length > 0 ? window.getComputedStyle(disabledDates[0]) : null;
      
      return {
        container: {
          background: containerStyle.backgroundColor,
          borderColor: containerStyle.borderColor,
          color: containerStyle.color
        },
        buttons: prevButtonStyle ? {
          background: prevButtonStyle.backgroundColor,
          color: prevButtonStyle.color,
          borderColor: prevButtonStyle.borderColor
        } : null,
        headers: headerStyle ? {
          color: headerStyle.color,
          background: headerStyle.backgroundColor
        } : null,
        availableDates: availableStyle ? {
          background: availableStyle.backgroundColor,
          color: availableStyle.color,
          borderColor: availableStyle.borderColor
        } : null,
        disabledDates: disabledStyle ? {
          background: disabledStyle.backgroundColor,
          color: disabledStyle.color,
          borderColor: disabledStyle.borderColor
        } : null,
        counts: {
          dayHeaders: dayHeaders.length,
          availableDates: availableDates.length,
          disabledDates: disabledDates.length
        }
      };
    });
    
    console.log('\n🎨 Light Mode Color Analysis:');
    
    console.log('\n📅 Calendar Container:');
    console.log('- Background:', colorAnalysis.container.background);
    console.log('- Border:', colorAnalysis.container.borderColor);
    console.log('- Text color:', colorAnalysis.container.color);
    
    if (colorAnalysis.buttons) {
      console.log('\n🔘 Navigation Buttons:');
      console.log('- Background:', colorAnalysis.buttons.background);
      console.log('- Color:', colorAnalysis.buttons.color);
      console.log('- Border:', colorAnalysis.buttons.borderColor);
    }
    
    if (colorAnalysis.headers) {
      console.log('\n📝 Day Headers:');
      console.log('- Color:', colorAnalysis.headers.color);
      console.log('- Background:', colorAnalysis.headers.background);
    }
    
    if (colorAnalysis.availableDates) {
      console.log('\n✅ Available Dates:');
      console.log('- Background:', colorAnalysis.availableDates.background);
      console.log('- Color:', colorAnalysis.availableDates.color);
      console.log('- Border:', colorAnalysis.availableDates.borderColor);
    }
    
    if (colorAnalysis.disabledDates) {
      console.log('\n❌ Disabled/Closed Dates:');
      console.log('- Background:', colorAnalysis.disabledDates.background);
      console.log('- Color:', colorAnalysis.disabledDates.color);
      console.log('- Border:', colorAnalysis.disabledDates.borderColor);
    }
    
    console.log('\n📊 Element Counts:');
    console.log('- Day headers:', colorAnalysis.counts.dayHeaders);
    console.log('- Available dates:', colorAnalysis.counts.availableDates);
    console.log('- Disabled dates:', colorAnalysis.counts.disabledDates);
    
    // Test hover effect
    console.log('\n🖱️ Testing hover effects...');
    const hoverTest = await page.evaluate(() => {
      const availableDate = document.querySelector('.calendar-date:not([disabled]):not([role="columnheader"])');
      if (!availableDate) return { error: 'No available date found' };
      
      // Get initial styles
      const initialStyle = {
        background: window.getComputedStyle(availableDate).backgroundColor,
        border: window.getComputedStyle(availableDate).borderColor,
        color: window.getComputedStyle(availableDate).color
      };
      
      // Simulate hover
      availableDate.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      
      // Get hover styles
      const hoverStyle = {
        background: window.getComputedStyle(availableDate).backgroundColor,
        border: window.getComputedStyle(availableDate).borderColor,
        color: window.getComputedStyle(availableDate).color
      };
      
      // Remove hover
      availableDate.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      
      return {
        initial: initialStyle,
        hover: hoverStyle,
        hoverChanged: initialStyle.background !== hoverStyle.background
      };
    });
    
    if (hoverTest.error) {
      console.log('Hover test error:', hoverTest.error);
    } else {
      console.log('Initial colors:', hoverTest.initial);
      console.log('Hover colors:', hoverTest.hover);
      console.log('Hover effect working:', hoverTest.hoverChanged);
    }
    
    // Test date selection
    console.log('\n📅 Testing date selection...');
    const selectionTest = await page.evaluate(() => {
      const availableDate = document.querySelector('.calendar-date:not([disabled]):not([role="columnheader"])');
      if (!availableDate) return { error: 'No available date found' };
      
      // Click the date
      availableDate.click();
      
      // Wait a moment for styles to apply
      return new Promise(resolve => {
        setTimeout(() => {
          // Check if selected date display is visible
          const selectedDisplay = document.getElementById('selected-date-display');
          const isVisible = selectedDisplay && window.getComputedStyle(selectedDisplay).display !== 'none';
          
          if (isVisible) {
            const displayStyle = window.getComputedStyle(selectedDisplay);
            resolve({
              success: true,
              display: {
                background: displayStyle.backgroundColor,
                borderColor: displayStyle.borderColor,
                visible: isVisible
              }
            });
          } else {
            resolve({ success: false, display: null });
          }
        }, 500);
      });
    });
    
    if (selectionTest.success) {
      console.log('✅ Date selection working');
      console.log('Selected display colors:');
      console.log('- Background:', selectionTest.display.background);
      console.log('- Border:', selectionTest.display.borderColor);
    } else {
      console.log('❌ Date selection failed');
    }
    
    // Check for dark mode overrides
    const darkModeCheck = await page.evaluate(() => {
      // Check if dark mode styles are being applied
      const styles = Array.from(document.styleSheets)
        .flatMap(sheet => {
          try {
            return Array.from(sheet.cssRules || []);
          } catch (e) {
            return [];
          }
        })
        .filter(rule => rule.cssText && rule.cssText.includes('prefers-color-scheme: dark'));
      
      return {
        darkModeRulesFound: styles.length,
        userPrefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches
      };
    });
    
    console.log('\n🌗 Dark Mode Check:');
    console.log('- User prefers dark mode:', darkModeCheck.userPrefersDark);
    console.log('- Dark mode CSS rules found:', darkModeCheck.darkModeRulesFound);
    console.log('- Light mode should override any dark preferences');
    
    // Take screenshot
    await page.screenshot({ path: 'light-mode-calendar.png', fullPage: false });
    console.log('\n📸 Screenshot saved: light-mode-calendar.png');
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testLightModeCalendar().catch(console.error);