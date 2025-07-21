const { chromium } = require('playwright');

async function testDateTimeWidthFix() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--window-size=375,812', '--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Test both mobile and larger viewport sizes
    const viewports = [
      { width: 375, height: 812, name: 'Galaxy Z Fold / iPhone' },
      { width: 600, height: 800, name: 'Small Tablet' },
      { width: 768, height: 1024, name: 'Tablet' }
    ];
    
    for (const viewport of viewports) {
      console.log(`\n🔍 Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
      
      await page.waitForSelector('.service-option', { timeout: 10000 });
      await page.click('.service-option[data-service="60min"]');
      await page.waitForTimeout(2000);
      
      await page.waitForSelector('#datetime-selection', { timeout: 10000 });
      
      // Analyze the responsive layout
      const layoutInfo = await page.evaluate(() => {
        const viewport = { width: window.innerWidth, height: window.innerHeight };
        
        const datetimeGrid = document.querySelector('.datetime-grid');
        const datetimeSection = document.getElementById('datetime-selection');
        const calendar = document.getElementById('custom-calendar-container');
        const timeSelect = document.getElementById('booking-time');
        
        const gridStyle = window.getComputedStyle(datetimeGrid);
        const datetimeRect = datetimeSection.getBoundingClientRect();
        const calendarRect = calendar ? calendar.getBoundingClientRect() : null;
        const timeRect = timeSelect ? timeSelect.getBoundingClientRect() : null;
        
        return {
          viewport,
          grid: {
            columns: gridStyle.gridTemplateColumns,
            gap: gridStyle.gap,
            width: Math.round(datetimeGrid.getBoundingClientRect().width),
            left: Math.round(datetimeGrid.getBoundingClientRect().left)
          },
          datetimeSection: {
            width: Math.round(datetimeRect.width),
            left: Math.round(datetimeRect.left),
            right: Math.round(datetimeRect.right)
          },
          calendar: calendarRect ? {
            width: Math.round(calendarRect.width),
            left: Math.round(calendarRect.left),
            right: Math.round(calendarRect.right)
          } : null,
          timeSelect: timeRect ? {
            width: Math.round(timeRect.width),
            left: Math.round(timeRect.left),
            right: Math.round(timeRect.right),
            overflowsViewport: timeRect.right > viewport.width
          } : null
        };
      });
      
      console.log('  📐 Layout Analysis:');
      console.log('  - Grid columns:', layoutInfo.grid.columns);
      console.log('  - Grid gap:', layoutInfo.grid.gap);
      console.log('  - Grid width:', layoutInfo.grid.width + 'px');
      
      if (layoutInfo.calendar) {
        console.log('  📅 Calendar:', layoutInfo.calendar.width + 'px wide, left:', layoutInfo.calendar.left + 'px');
      }
      
      if (layoutInfo.timeSelect) {
        console.log('  ⏰ Time Select:', layoutInfo.timeSelect.width + 'px wide, left:', layoutInfo.timeSelect.left + 'px');
        console.log('  - Right edge:', layoutInfo.timeSelect.right + 'px');
        console.log('  - Overflows viewport:', layoutInfo.timeSelect.overflowsViewport);
      }
      
      // Check if layout is appropriate for viewport size
      const isSingleColumn = layoutInfo.grid.columns === '1fr';
      const isTwoColumn = layoutInfo.grid.columns.includes('1fr 1fr');
      const shouldBeSingleColumn = viewport.width < 600;
      
      console.log('  ✅ Layout Check:');
      console.log('  - Is single column:', isSingleColumn);
      console.log('  - Is two column:', isTwoColumn);
      console.log('  - Should be single column:', shouldBeSingleColumn);
      console.log('  - Layout is correct:', shouldBeSingleColumn ? isSingleColumn : isTwoColumn);
      
      if (layoutInfo.timeSelect && layoutInfo.timeSelect.overflowsViewport) {
        console.log('  ⚠️ Time select overflows viewport!');
      }
      
      // Take screenshot
      await page.screenshot({ 
        path: `datetime-width-fix-${viewport.width}w.png`, 
        fullPage: false 
      });
      console.log(`  📸 Screenshot: datetime-width-fix-${viewport.width}w.png`);
    }
    
    console.log('\n🎯 Summary:');
    console.log('- Mobile (375px): Should use single-column layout');
    console.log('- Tablet (600px+): Should use two-column layout');
    console.log('- Time select should never overflow viewport');
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testDateTimeWidthFix().catch(console.error);