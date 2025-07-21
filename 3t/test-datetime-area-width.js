const { chromium } = require('playwright');

async function testDateTimeAreaWidth() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--window-size=375,812', '--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 812 });
    
    console.log('🔍 Testing date & time selection area width...');
    await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
    
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(2000);
    
    console.log('📅 Analyzing step 2 date & time area...');
    await page.waitForSelector('#datetime-selection', { timeout: 10000 });
    
    // Analyze the date & time selection area layout
    const layoutAnalysis = await page.evaluate(() => {
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      
      // Get the main datetime selection container
      const datetimeSection = document.getElementById('datetime-selection');
      if (!datetimeSection) return { error: 'datetime-selection not found' };
      
      const datetimeRect = datetimeSection.getBoundingClientRect();
      const datetimeStyle = window.getComputedStyle(datetimeSection);
      
      // Get calendar container
      const calendar = document.getElementById('custom-calendar-container');
      const calendarRect = calendar ? calendar.getBoundingClientRect() : null;
      
      // Get time selection if it exists
      const timeSelect = document.getElementById('booking-time');
      const timeRect = timeSelect ? timeSelect.getBoundingClientRect() : null;
      const timeStyle = timeSelect ? window.getComputedStyle(timeSelect) : null;
      
      // Walk up parent hierarchy to understand width constraints
      const parents = [];
      let current = datetimeSection.parentElement;
      let level = 0;
      
      while (current && current !== document.body && level < 8) {
        const rect = current.getBoundingClientRect();
        const style = window.getComputedStyle(current);
        
        parents.push({
          level: level,
          tagName: current.tagName,
          className: current.className,
          id: current.id,
          width: Math.round(rect.width),
          left: Math.round(rect.left),
          padding: style.padding,
          margin: style.margin,
          maxWidth: style.maxWidth
        });
        
        current = current.parentElement;
        level++;
      }
      
      return {
        viewport,
        datetimeSection: {
          width: Math.round(datetimeRect.width),
          left: Math.round(datetimeRect.left),
          right: Math.round(datetimeRect.right),
          padding: datetimeStyle.padding,
          margin: datetimeStyle.margin,
          maxWidth: datetimeStyle.maxWidth,
          boxSizing: datetimeStyle.boxSizing
        },
        calendar: calendarRect ? {
          width: Math.round(calendarRect.width),
          left: Math.round(calendarRect.left)
        } : null,
        timeSelect: timeRect ? {
          width: Math.round(timeRect.width),
          left: Math.round(timeRect.left),
          padding: timeStyle.padding,
          margin: timeStyle.margin,
          maxWidth: timeStyle.maxWidth
        } : null,
        parents
      };
    });
    
    console.log('\n📊 Date & Time Area Analysis:');
    console.log('Viewport:', layoutAnalysis.viewport);
    
    console.log('\n📅 DateTime Section:');
    console.log('- Width:', layoutAnalysis.datetimeSection.width + 'px');
    console.log('- Left:', layoutAnalysis.datetimeSection.left + 'px');
    console.log('- Right:', layoutAnalysis.datetimeSection.right + 'px');
    console.log('- Padding:', layoutAnalysis.datetimeSection.padding);
    console.log('- Margin:', layoutAnalysis.datetimeSection.margin);
    console.log('- Max-width:', layoutAnalysis.datetimeSection.maxWidth);
    
    if (layoutAnalysis.calendar) {
      console.log('\n📅 Calendar:');
      console.log('- Width:', layoutAnalysis.calendar.width + 'px');
      console.log('- Left:', layoutAnalysis.calendar.left + 'px');
    }
    
    if (layoutAnalysis.timeSelect) {
      console.log('\n⏰ Time Select:');
      console.log('- Width:', layoutAnalysis.timeSelect.width + 'px');
      console.log('- Left:', layoutAnalysis.timeSelect.left + 'px');
      console.log('- Padding:', layoutAnalysis.timeSelect.padding);
      console.log('- Max-width:', layoutAnalysis.timeSelect.maxWidth);
    }
    
    console.log('\n🏗️ Parent Containers:');
    layoutAnalysis.parents.forEach(parent => {
      console.log(`${' '.repeat(parent.level * 2)}${parent.level}. ${parent.tagName} ${parent.className ? `(${parent.className})` : ''}`);
      console.log(`${' '.repeat(parent.level * 2)}   Width: ${parent.width}px, Left: ${parent.left}px`);
      console.log(`${' '.repeat(parent.level * 2)}   Max-width: ${parent.maxWidth}, Padding: ${parent.padding}`);
    });
    
    // Check if datetime area is too wide
    const isToWide = layoutAnalysis.datetimeSection.width > (layoutAnalysis.viewport.width * 0.9);
    const fillsViewport = layoutAnalysis.datetimeSection.right > (layoutAnalysis.viewport.width * 0.95);
    
    console.log('\n📐 Width Analysis:');
    console.log('- Takes up more than 90% of viewport:', isToWide);
    console.log('- Extends to edge of viewport:', fillsViewport);
    console.log('- Viewport usage:', Math.round((layoutAnalysis.datetimeSection.width / layoutAnalysis.viewport.width) * 100) + '%');
    
    if (isToWide || fillsViewport) {
      console.log('\n⚠️ ISSUE DETECTED: Date & time area is too wide');
      console.log('Recommended max width:', Math.round(layoutAnalysis.viewport.width * 0.85) + 'px');
    }
    
    await page.screenshot({ path: 'datetime-area-width-analysis.png', fullPage: false });
    console.log('\n📸 Screenshot saved: datetime-area-width-analysis.png');
    
    await page.waitForTimeout(4000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testDateTimeAreaWidth().catch(console.error);