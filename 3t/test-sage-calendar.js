const { chromium } = require('playwright');

async function testSageCalendar() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--window-size=375,812', '--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 812 });
    
    console.log('🔍 Testing light sage calendar theme...');
    await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
    
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(2000);
    
    await page.waitForSelector('#custom-calendar-container', { timeout: 10000 });
    
    // Clear cache to ensure we get the updated sage styling
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(2000);
    await page.waitForSelector('#custom-calendar-container', { timeout: 10000 });
    
    // Analyze sage theme colors
    const sageAnalysis = await page.evaluate(() => {
      const container = document.getElementById('custom-calendar-container');
      const prevButton = document.getElementById('prev-month');
      const nextButton = document.getElementById('next-month');
      const dayHeaders = document.querySelectorAll('[role="columnheader"]');
      const availableDates = document.querySelectorAll('.calendar-date:not([disabled]):not([role="columnheader"])');
      const disabledDates = document.querySelectorAll('.calendar-date[disabled]');
      const selectedDisplay = document.getElementById('selected-date-display');
      const legend = document.querySelector('.calendar-legend');
      
      // Get computed styles
      const containerStyle = window.getComputedStyle(container);
      const buttonStyle = prevButton ? window.getComputedStyle(prevButton) : null;
      const headerStyle = dayHeaders.length > 0 ? window.getComputedStyle(dayHeaders[0]) : null;
      const availableStyle = availableDates.length > 0 ? window.getComputedStyle(availableDates[0]) : null;
      const disabledStyle = disabledDates.length > 0 ? window.getComputedStyle(disabledDates[0]) : null;
      const displayStyle = selectedDisplay ? window.getComputedStyle(selectedDisplay) : null;
      
      return {
        container: {
          background: containerStyle.backgroundColor,
          borderColor: containerStyle.borderColor,
          color: containerStyle.color,
          isSageBackground: containerStyle.backgroundColor.includes('240, 244, 240') || 
                           containerStyle.backgroundColor === 'rgb(240, 244, 240)'
        },
        buttons: buttonStyle ? {
          background: buttonStyle.backgroundColor,
          color: buttonStyle.color,
          borderColor: buttonStyle.borderColor,
          isSageTheme: buttonStyle.backgroundColor.includes('232, 236, 232')
        } : null,
        headers: headerStyle ? {
          color: headerStyle.color,
          background: headerStyle.backgroundColor,
          isSageColor: headerStyle.color.includes('90, 106, 90')
        } : null,
        availableDates: availableStyle ? {
          background: availableStyle.backgroundColor,
          color: availableStyle.color,
          borderColor: availableStyle.borderColor,
          hasSageBorder: availableStyle.borderColor.includes('200, 208, 200')
        } : null,
        disabledDates: disabledStyle ? {
          background: disabledStyle.backgroundColor,
          color: disabledStyle.color,
          borderColor: disabledStyle.borderColor,
          isSageDisabled: disabledStyle.backgroundColor.includes('232, 236, 232')
        } : null,
        selectedDisplay: displayStyle ? {
          background: displayStyle.backgroundColor,
          borderColor: displayStyle.borderColor,
          isSageGreen: displayStyle.backgroundColor.includes('232, 245, 232')
        } : null,
        counts: {
          dayHeaders: dayHeaders.length,
          availableDates: availableDates.length,
          disabledDates: disabledDates.length
        }
      };
    });
    
    console.log('\n🌿 Sage Theme Analysis:');
    
    console.log('\n📅 Calendar Container:');
    console.log('- Background:', sageAnalysis.container.background);
    console.log('- Border:', sageAnalysis.container.borderColor);
    console.log('- Text color:', sageAnalysis.container.color);
    console.log('- Has sage background:', sageAnalysis.container.isSageBackground);
    
    if (sageAnalysis.buttons) {
      console.log('\n🔘 Navigation Buttons:');
      console.log('- Background:', sageAnalysis.buttons.background);
      console.log('- Color:', sageAnalysis.buttons.color);
      console.log('- Border:', sageAnalysis.buttons.borderColor);
      console.log('- Uses sage theme:', sageAnalysis.buttons.isSageTheme);
    }
    
    if (sageAnalysis.headers) {
      console.log('\n📝 Day Headers:');
      console.log('- Color:', sageAnalysis.headers.color);
      console.log('- Background:', sageAnalysis.headers.background);
      console.log('- Has sage color:', sageAnalysis.headers.isSageColor);
    }
    
    if (sageAnalysis.availableDates) {
      console.log('\n✅ Available Dates:');
      console.log('- Background:', sageAnalysis.availableDates.background);
      console.log('- Color:', sageAnalysis.availableDates.color);
      console.log('- Border:', sageAnalysis.availableDates.borderColor);
      console.log('- Has sage border:', sageAnalysis.availableDates.hasSageBorder);
    }
    
    if (sageAnalysis.disabledDates) {
      console.log('\n❌ Disabled/Closed Dates:');
      console.log('- Background:', sageAnalysis.disabledDates.background);
      console.log('- Color:', sageAnalysis.disabledDates.color);
      console.log('- Border:', sageAnalysis.disabledDates.borderColor);
      console.log('- Uses sage disabled style:', sageAnalysis.disabledDates.isSageDisabled);
    }
    
    if (sageAnalysis.selectedDisplay) {
      console.log('\n🎯 Selected Date Display:');
      console.log('- Background:', sageAnalysis.selectedDisplay.background);
      console.log('- Border:', sageAnalysis.selectedDisplay.borderColor);
      console.log('- Uses sage green:', sageAnalysis.selectedDisplay.isSageGreen);
    }
    
    // Test hover effects with sage colors
    console.log('\n🖱️ Testing sage hover effects...');
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
      
      // Wait a moment for styles to apply
      return new Promise(resolve => {
        setTimeout(() => {
          const hoverStyle = {
            background: window.getComputedStyle(availableDate).backgroundColor,
            border: window.getComputedStyle(availableDate).borderColor,
            color: window.getComputedStyle(availableDate).color
          };
          
          // Check if hover colors are sage-themed
          const hasSageHover = hoverStyle.background.includes('232, 245, 232') || // #e8f5e8
                              hoverStyle.border.includes('90, 138, 90'); // #5a8a5a
          
          // Remove hover
          availableDate.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
          
          resolve({
            initial: initialStyle,
            hover: hoverStyle,
            hoverChanged: initialStyle.background !== hoverStyle.background,
            hasSageHover: hasSageHover
          });
        }, 200);
      });
    });
    
    if (hoverTest.error) {
      console.log('Hover test error:', hoverTest.error);
    } else {
      console.log('Initial colors:', hoverTest.initial);
      console.log('Hover colors:', hoverTest.hover);
      console.log('Hover effect working:', hoverTest.hoverChanged);
      console.log('Uses sage hover colors:', hoverTest.hasSageHover);
    }
    
    // Overall sage theme assessment
    const sageThemeScore = [
      sageAnalysis.container.isSageBackground,
      sageAnalysis.buttons?.isSageTheme,
      sageAnalysis.availableDates?.hasSageBorder,
      sageAnalysis.disabledDates?.isSageDisabled,
      sageAnalysis.selectedDisplay?.isSageGreen,
      hoverTest.hasSageHover
    ].filter(Boolean).length;
    
    console.log('\n🌿 Sage Theme Assessment:');
    console.log('- Sage elements implemented:', sageThemeScore + '/6');
    console.log('- Overall sage compliance:', Math.round((sageThemeScore / 6) * 100) + '%');
    
    if (sageThemeScore >= 5) {
      console.log('✅ Excellent sage theme implementation!');
    } else if (sageThemeScore >= 3) {
      console.log('⚠️ Good sage theme, some elements could be improved');
    } else {
      console.log('❌ Sage theme needs more work');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'sage-themed-calendar.png', fullPage: false });
    console.log('\n📸 Screenshot saved: sage-themed-calendar.png');
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testSageCalendar().catch(console.error);