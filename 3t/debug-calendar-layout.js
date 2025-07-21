const { chromium } = require('playwright');

async function debugCalendarLayout() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--window-size=375,812', '--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 812 });
    
    console.log('🔍 Debugging calendar layout hierarchy...');
    await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
    
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(2000);
    await page.waitForSelector('#custom-calendar-container', { timeout: 10000 });
    
    // Get detailed layout hierarchy
    const layoutDebug = await page.evaluate(() => {
      const container = document.getElementById('custom-calendar-container');
      const wrapper = document.querySelector('.calendar-viewport-wrapper');
      
      // Walk up the DOM tree to find all parent containers
      const parents = [];
      let current = wrapper.parentElement;
      let level = 0;
      
      while (current && current !== document.body && level < 10) {
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
          display: style.display,
          position: style.position,
          boxSizing: style.boxSizing
        });
        
        current = current.parentElement;
        level++;
      }
      
      // Also check the wrapper and container details
      const wrapperRect = wrapper.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const wrapperStyle = window.getComputedStyle(wrapper);
      const containerStyle = window.getComputedStyle(container);
      
      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        parents: parents,
        wrapper: {
          width: Math.round(wrapperRect.width),
          left: Math.round(wrapperRect.left),
          right: Math.round(wrapperRect.right),
          styles: {
            display: wrapperStyle.display,
            justifyContent: wrapperStyle.justifyContent,
            alignItems: wrapperStyle.alignItems,
            padding: wrapperStyle.padding,
            margin: wrapperStyle.margin,
            width: wrapperStyle.width,
            maxWidth: wrapperStyle.maxWidth
          }
        },
        container: {
          width: Math.round(containerRect.width),
          left: Math.round(containerRect.left),
          right: Math.round(containerRect.right),
          styles: {
            margin: containerStyle.margin,
            padding: containerStyle.padding,
            width: containerStyle.width,
            maxWidth: containerStyle.maxWidth
          }
        }
      };
    });
    
    console.log('\n📊 Layout Hierarchy Debug:');
    console.log('Viewport:', layoutDebug.viewport);
    
    console.log('\n🏗️ Parent containers (from wrapper up to body):');
    layoutDebug.parents.forEach((parent, index) => {
      console.log(`${' '.repeat(parent.level * 2)}${parent.level}. ${parent.tagName} ${parent.className ? `(${parent.className})` : ''} ${parent.id ? `#${parent.id}` : ''}`);
      console.log(`${' '.repeat(parent.level * 2)}   Width: ${parent.width}px, Left: ${parent.left}px`);
      console.log(`${' '.repeat(parent.level * 2)}   Padding: ${parent.padding}, Margin: ${parent.margin}`);
      console.log(`${' '.repeat(parent.level * 2)}   Display: ${parent.display}, Position: ${parent.position}`);
      console.log('');
    });
    
    console.log('📦 Wrapper details:');
    console.log('Width:', layoutDebug.wrapper.width, 'Left:', layoutDebug.wrapper.left);
    console.log('Styles:', layoutDebug.wrapper.styles);
    
    console.log('\n📅 Container details:');
    console.log('Width:', layoutDebug.container.width, 'Left:', layoutDebug.container.left);
    console.log('Styles:', layoutDebug.container.styles);
    
    // Calculate expected vs actual position
    const expectedLeft = (layoutDebug.viewport.width - layoutDebug.container.width) / 2;
    const actualLeft = layoutDebug.container.left;
    const offset = actualLeft - expectedLeft;
    
    console.log('\n📐 Position Analysis:');
    console.log('Expected left position:', Math.round(expectedLeft) + 'px');
    console.log('Actual left position:', actualLeft + 'px');
    console.log('Offset from center:', Math.round(offset) + 'px');
    
    // Check if any parent has constraining styles
    const constrainingParent = layoutDebug.parents.find(p => 
      p.left > 0 || 
      p.width < layoutDebug.viewport.width || 
      p.padding !== '0px' || 
      p.margin !== '0px'
    );
    
    if (constrainingParent) {
      console.log('\n⚠️ Found constraining parent:', constrainingParent.tagName, constrainingParent.className);
      console.log('This parent may be affecting calendar positioning');
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await browser.close();
  }
}

debugCalendarLayout().catch(console.error);