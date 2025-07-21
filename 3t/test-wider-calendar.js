const { chromium } = require('playwright');

async function testWiderCalendar() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--window-size=375,812', '--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Test on Galaxy Z Fold dimensions
    await page.setViewportSize({ width: 375, height: 812 });
    
    console.log('🔍 Testing wider calendar on Galaxy Z Fold (375px)...');
    await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
    
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(2000);
    
    await page.waitForSelector('#custom-calendar-container', { timeout: 10000 });
    
    // Analyze calendar width improvements
    const calendarAnalysis = await page.evaluate(() => {
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      
      const container = document.getElementById('custom-calendar-container');
      const wrapper = document.querySelector('.calendar-viewport-wrapper');
      const grid = document.getElementById('calendar-grid');
      const dateCell = document.querySelector('.calendar-date:not([role="columnheader"])');
      
      const containerRect = container.getBoundingClientRect();
      const containerStyle = window.getComputedStyle(container);
      const gridStyle = window.getComputedStyle(grid);
      const dateCellStyle = dateCell ? window.getComputedStyle(dateCell) : null;
      
      return {
        viewport,
        container: {
          width: Math.round(containerRect.width),
          maxWidth: containerStyle.maxWidth,
          padding: containerStyle.padding,
          left: Math.round(containerRect.left),
          right: Math.round(containerRect.right)
        },
        grid: {
          gap: gridStyle.gap,
          columns: gridStyle.gridTemplateColumns
        },
        dateCell: dateCellStyle ? {
          width: Math.round(dateCell.getBoundingClientRect().width),
          height: Math.round(dateCell.getBoundingClientRect().height),
          fontSize: dateCellStyle.fontSize,
          padding: dateCellStyle.padding,
          borderRadius: dateCellStyle.borderRadius
        } : null,
        viewportUsage: Math.round((containerRect.width / viewport.width) * 100)
      };
    });
    
    console.log('\n📊 Wider Calendar Analysis:');
    console.log('Viewport:', calendarAnalysis.viewport.width + 'px');
    
    console.log('\n📅 Calendar Container:');
    console.log('- Width:', calendarAnalysis.container.width + 'px');
    console.log('- Max-width:', calendarAnalysis.container.maxWidth);
    console.log('- Padding:', calendarAnalysis.container.padding);
    console.log('- Left edge:', calendarAnalysis.container.left + 'px');
    console.log('- Right edge:', calendarAnalysis.container.right + 'px');
    console.log('- Viewport usage:', calendarAnalysis.viewportUsage + '%');
    
    console.log('\n🔳 Calendar Grid:');
    console.log('- Gap:', calendarAnalysis.grid.gap);
    console.log('- Columns:', calendarAnalysis.grid.columns);
    
    if (calendarAnalysis.dateCell) {
      console.log('\n📆 Date Cells:');
      console.log('- Width:', calendarAnalysis.dateCell.width + 'px');
      console.log('- Height:', calendarAnalysis.dateCell.height + 'px');
      console.log('- Font size:', calendarAnalysis.dateCell.fontSize);
      console.log('- Padding:', calendarAnalysis.dateCell.padding);
      console.log('- Border radius:', calendarAnalysis.dateCell.borderRadius);
    }
    
    // Check improvements compared to previous version
    const improvements = {
      widthImprovement: calendarAnalysis.container.width > 260, // Previous max was 260px
      paddingReduced: calendarAnalysis.container.padding === '4px', // Was 8px before
      goodViewportUsage: calendarAnalysis.viewportUsage >= 85, // Using most of available space
      cellSizeImproved: calendarAnalysis.dateCell && calendarAnalysis.dateCell.height >= 36
    };
    
    console.log('\n✅ Improvements Check:');
    console.log('- Calendar wider than before (>260px):', improvements.widthImprovement);
    console.log('- Padding reduced (4px):', improvements.paddingReduced);
    console.log('- Good viewport usage (≥85%):', improvements.goodViewportUsage);
    console.log('- Larger date cells (≥36px):', improvements.cellSizeImproved);
    
    // Navigate to July 2025 to test with actual dates
    console.log('\n🗓️ Testing with July 2025 dates...');
    let attempts = 0;
    while (attempts < 12) {
      const monthText = await page.textContent('#current-month-year');
      console.log('Current month:', monthText);
      if (monthText.includes('July 2025')) break;
      await page.click('#next-month');
      await page.waitForTimeout(300);
      attempts++;
    }
    
    // Test date interaction with wider calendar
    const interactionTest = await page.evaluate(() => {
      const availableDates = document.querySelectorAll('.calendar-date:not([disabled]):not([role="columnheader"])');
      if (availableDates.length === 0) return { error: 'No available dates found' };
      
      const firstDate = availableDates[0];
      const rect = firstDate.getBoundingClientRect();
      
      return {
        dateCount: availableDates.length,
        firstDateRect: {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          left: Math.round(rect.left),
          top: Math.round(rect.top)
        },
        touchTargetSize: rect.width >= 40 && rect.height >= 36 // WCAG minimum
      };
    });
    
    console.log('\n🎯 Date Interaction Test:');
    if (interactionTest.error) {
      console.log('Error:', interactionTest.error);
    } else {
      console.log('- Available dates:', interactionTest.dateCount);
      console.log('- First date size:', interactionTest.firstDateRect.width + 'x' + interactionTest.firstDateRect.height + 'px');
      console.log('- Meets touch target requirements:', interactionTest.touchTargetSize);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'wider-calendar-test.png', fullPage: false });
    console.log('\n📸 Screenshot saved: wider-calendar-test.png');
    
    // Test on different screen size for comparison
    console.log('\n🔍 Testing on smaller screen (320px)...');
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(1000);
    
    const smallScreenAnalysis = await page.evaluate(() => {
      const container = document.getElementById('custom-calendar-container');
      const rect = container.getBoundingClientRect();
      return {
        width: Math.round(rect.width),
        viewportUsage: Math.round((rect.width / window.innerWidth) * 100)
      };
    });
    
    console.log('Small screen (320px):');
    console.log('- Calendar width:', smallScreenAnalysis.width + 'px');
    console.log('- Viewport usage:', smallScreenAnalysis.viewportUsage + '%');
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testWiderCalendar().catch(console.error);