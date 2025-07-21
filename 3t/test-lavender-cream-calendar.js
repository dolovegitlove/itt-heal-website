const { chromium } = require('playwright');

async function testLavenderCreamCalendar() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--window-size=375,812', '--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 812 });
    
    console.log('🔍 Testing lavender & cream calendar theme...');
    await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
    
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(2000);
    
    await page.waitForSelector('#custom-calendar-container', { timeout: 10000 });
    
    // Clear cache to ensure we get the updated lavender styling
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(2000);
    await page.waitForSelector('#custom-calendar-container', { timeout: 10000 });
    
    // Analyze lavender & cream theme colors
    const lavenderAnalysis = await page.evaluate(() => {
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
      const legendStyle = legend ? window.getComputedStyle(legend) : null;
      
      return {
        container: {
          background: containerStyle.backgroundColor,
          borderColor: containerStyle.borderColor,
          color: containerStyle.color,
          isCreamBackground: containerStyle.backgroundColor.includes('253, 252, 247') || 
                           containerStyle.backgroundColor === 'rgb(253, 252, 247)'
        },
        buttons: buttonStyle ? {
          background: buttonStyle.backgroundColor,
          color: buttonStyle.color,
          borderColor: buttonStyle.borderColor,
          isLavenderTheme: buttonStyle.backgroundColor.includes('243, 238, 248')
        } : null,
        headers: headerStyle ? {
          color: headerStyle.color,
          background: headerStyle.backgroundColor,
          isLavenderColor: headerStyle.color.includes('74, 59, 92') || 
                          headerStyle.color.includes('122, 107, 138')
        } : null,
        availableDates: availableStyle ? {
          background: availableStyle.backgroundColor,
          color: availableStyle.color,
          borderColor: availableStyle.borderColor,
          hasLavenderBorder: availableStyle.borderColor.includes('229, 216, 240')
        } : null,
        disabledDates: disabledStyle ? {
          background: disabledStyle.backgroundColor,
          color: disabledStyle.color,
          borderColor: disabledStyle.borderColor,
          isLavenderDisabled: disabledStyle.backgroundColor.includes('248, 244, 252')
        } : null,
        selectedDisplay: displayStyle ? {
          background: displayStyle.backgroundColor,
          borderColor: displayStyle.borderColor,
          color: displayStyle.color,
          isLavenderTheme: displayStyle.backgroundColor.includes('243, 238, 248') &&
                          displayStyle.borderColor.includes('139, 125, 176')
        } : null,
        legend: legendStyle ? {
          color: legendStyle.color,
          isLavenderText: legendStyle.color.includes('74, 59, 92')
        } : null,
        counts: {
          dayHeaders: dayHeaders.length,
          availableDates: availableDates.length,
          disabledDates: disabledDates.length
        }
      };
    });
    
    console.log('\n💜 Lavender & Cream Theme Analysis:');
    
    console.log('\n📅 Calendar Container:');
    console.log('- Background:', lavenderAnalysis.container.background);
    console.log('- Border:', lavenderAnalysis.container.borderColor);
    console.log('- Text color:', lavenderAnalysis.container.color);
    console.log('- Has cream background:', lavenderAnalysis.container.isCreamBackground);
    
    if (lavenderAnalysis.buttons) {
      console.log('\n🔘 Navigation Buttons:');
      console.log('- Background:', lavenderAnalysis.buttons.background);
      console.log('- Color:', lavenderAnalysis.buttons.color);
      console.log('- Border:', lavenderAnalysis.buttons.borderColor);
      console.log('- Uses lavender theme:', lavenderAnalysis.buttons.isLavenderTheme);
    }
    
    if (lavenderAnalysis.headers) {
      console.log('\n📝 Day Headers:');
      console.log('- Color:', lavenderAnalysis.headers.color);
      console.log('- Background:', lavenderAnalysis.headers.background);
      console.log('- Has lavender color:', lavenderAnalysis.headers.isLavenderColor);
    }
    
    if (lavenderAnalysis.availableDates) {
      console.log('\n✅ Available Dates:');
      console.log('- Background:', lavenderAnalysis.availableDates.background);
      console.log('- Color:', lavenderAnalysis.availableDates.color);
      console.log('- Border:', lavenderAnalysis.availableDates.borderColor);
      console.log('- Has lavender border:', lavenderAnalysis.availableDates.hasLavenderBorder);
    }
    
    if (lavenderAnalysis.disabledDates) {
      console.log('\n❌ Disabled/Closed Dates:');
      console.log('- Background:', lavenderAnalysis.disabledDates.background);
      console.log('- Color:', lavenderAnalysis.disabledDates.color);
      console.log('- Border:', lavenderAnalysis.disabledDates.borderColor);
      console.log('- Uses lavender disabled style:', lavenderAnalysis.disabledDates.isLavenderDisabled);
    }
    
    if (lavenderAnalysis.selectedDisplay) {
      console.log('\n🎯 Selected Date Display:');
      console.log('- Background:', lavenderAnalysis.selectedDisplay.background);
      console.log('- Border:', lavenderAnalysis.selectedDisplay.borderColor);
      console.log('- Text color:', lavenderAnalysis.selectedDisplay.color);
      console.log('- Uses lavender theme:', lavenderAnalysis.selectedDisplay.isLavenderTheme);
    }
    
    if (lavenderAnalysis.legend) {
      console.log('\n🏷️ Legend:');
      console.log('- Text color:', lavenderAnalysis.legend.color);
      console.log('- Uses lavender text:', lavenderAnalysis.legend.isLavenderText);
    }
    
    // Test hover effects with lavender colors
    console.log('\n🖱️ Testing lavender hover effects...');
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
          
          // Check if hover colors are lavender-themed
          const hasLavenderHover = hoverStyle.background.includes('243, 238, 248') || // #f3eef8
                                  hoverStyle.border.includes('139, 125, 176'); // #8b7db0
          
          // Remove hover
          availableDate.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
          
          resolve({
            initial: initialStyle,
            hover: hoverStyle,
            hoverChanged: initialStyle.background !== hoverStyle.background,
            hasLavenderHover: hasLavenderHover
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
      console.log('Uses lavender hover colors:', hoverTest.hasSageHover);
    }
    
    // Test date selection with lavender styling
    console.log('\n📅 Testing date selection with lavender theme...');
    const selectionTest = await page.evaluate(() => {
      const availableDate = document.querySelector('.calendar-date:not([disabled]):not([role="columnheader"])');
      if (!availableDate) return { error: 'No available date found' };
      
      // Click the date
      availableDate.click();
      
      // Wait a moment for styles to apply
      return new Promise(resolve => {
        setTimeout(() => {
          // Check selected date styling
          const selectedDateStyle = window.getComputedStyle(availableDate);
          const selectedDisplay = document.getElementById('selected-date-display');
          const isDisplayVisible = selectedDisplay && window.getComputedStyle(selectedDisplay).display !== 'none';
          
          const isLavenderSelected = selectedDateStyle.backgroundColor.includes('139, 125, 176'); // #8b7db0
          
          resolve({
            success: true,
            selectedStyling: {
              background: selectedDateStyle.backgroundColor,
              borderColor: selectedDateStyle.borderColor,
              color: selectedDateStyle.color,
              isLavenderTheme: isLavenderSelected
            },
            displayVisible: isDisplayVisible
          });
        }, 500);
      });
    });
    
    if (selectionTest.success) {
      console.log('✅ Date selection working with lavender theme');
      console.log('Selected date colors:');
      console.log('- Background:', selectionTest.selectedStyling.background);
      console.log('- Border:', selectionTest.selectedStyling.borderColor);
      console.log('- Text color:', selectionTest.selectedStyling.color);
      console.log('- Uses lavender theme:', selectionTest.selectedStyling.isLavenderTheme);
      console.log('- Selected display visible:', selectionTest.displayVisible);
    } else {
      console.log('❌ Date selection failed');
    }
    
    // Overall lavender & cream theme assessment
    const lavenderThemeScore = [
      lavenderAnalysis.container.isCreamBackground,
      lavenderAnalysis.buttons?.isLavenderTheme,
      lavenderAnalysis.headers?.isLavenderColor,
      lavenderAnalysis.availableDates?.hasLavenderBorder,
      lavenderAnalysis.disabledDates?.isLavenderDisabled,
      lavenderAnalysis.selectedDisplay?.isLavenderTheme,
      lavenderAnalysis.legend?.isLavenderText,
      hoverTest.hasLavenderHover,
      selectionTest.selectedStyling?.isLavenderTheme
    ].filter(Boolean).length;
    
    console.log('\n💜 Lavender & Cream Theme Assessment:');
    console.log('- Lavender elements implemented:', lavenderThemeScore + '/9');
    console.log('- Overall lavender compliance:', Math.round((lavenderThemeScore / 9) * 100) + '%');
    
    if (lavenderThemeScore >= 7) {
      console.log('✅ Excellent lavender & cream theme implementation!');
    } else if (lavenderThemeScore >= 5) {
      console.log('⚠️ Good lavender theme, some elements could be improved');
    } else {
      console.log('❌ Lavender theme needs more work');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'lavender-cream-calendar.png', fullPage: false });
    console.log('\n📸 Screenshot saved: lavender-cream-calendar.png');
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testLavenderCreamCalendar().catch(console.error);