const { chromium } = require('playwright');

async function debugGridCSS() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--window-size=375,812', '--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 812 });
    
    console.log('🔍 Debugging grid CSS application...');
    await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
    
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(2000);
    await page.waitForSelector('#datetime-selection', { timeout: 10000 });
    
    // Debug CSS application
    const cssDebug = await page.evaluate(() => {
      const grid = document.querySelector('.datetime-grid');
      if (!grid) return { error: 'datetime-grid not found' };
      
      const computedStyle = window.getComputedStyle(grid);
      const inlineStyle = grid.getAttribute('style');
      
      // Get all CSS rules that might be affecting this element
      const matchingRules = [];
      for (let sheet of document.styleSheets) {
        try {
          for (let rule of sheet.cssRules || sheet.rules) {
            if (rule.selectorText && grid.matches(rule.selectorText)) {
              matchingRules.push({
                selector: rule.selectorText,
                cssText: rule.style.cssText,
                gridColumns: rule.style.gridTemplateColumns
              });
            }
          }
        } catch (e) {
          // Skip external stylesheets that can't be accessed
        }
      }
      
      return {
        className: grid.className,
        id: grid.id,
        inlineStyle: inlineStyle,
        computedStyle: {
          display: computedStyle.display,
          gridTemplateColumns: computedStyle.gridTemplateColumns,
          gap: computedStyle.gap,
          width: computedStyle.width
        },
        matchingRules: matchingRules,
        parentStyles: {
          width: window.getComputedStyle(grid.parentElement).width,
          maxWidth: window.getComputedStyle(grid.parentElement).maxWidth,
          display: window.getComputedStyle(grid.parentElement).display
        }
      };
    });
    
    console.log('\n📊 CSS Debug Info:');
    console.log('Element class:', cssDebug.className);
    console.log('Element ID:', cssDebug.id);
    console.log('Inline style:', cssDebug.inlineStyle);
    
    console.log('\n💻 Computed Styles:');
    console.log('- Display:', cssDebug.computedStyle.display);
    console.log('- Grid columns:', cssDebug.computedStyle.gridTemplateColumns);
    console.log('- Gap:', cssDebug.computedStyle.gap);
    console.log('- Width:', cssDebug.computedStyle.width);
    
    console.log('\n👨‍👩‍👧‍👦 Parent Styles:');
    console.log('- Width:', cssDebug.parentStyles.width);
    console.log('- Max-width:', cssDebug.parentStyles.maxWidth);
    console.log('- Display:', cssDebug.parentStyles.display);
    
    console.log('\n🎯 Matching CSS Rules:');
    cssDebug.matchingRules.forEach((rule, index) => {
      console.log(`${index + 1}. Selector: ${rule.selector}`);
      console.log(`   Grid columns: ${rule.gridColumns || 'not set'}`);
      console.log(`   CSS: ${rule.cssText}`);
    });
    
    // Try to manually apply the style and see what happens
    const manualTest = await page.evaluate(() => {
      const grid = document.querySelector('.datetime-grid');
      
      // Store original values
      const original = {
        display: grid.style.display,
        gridTemplateColumns: grid.style.gridTemplateColumns,
        gap: grid.style.gap
      };
      
      // Apply our desired styles directly
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = '1fr';
      grid.style.gap = '1.5rem';
      
      // Check what actually got applied
      const applied = window.getComputedStyle(grid);
      
      return {
        original: original,
        applied: {
          display: applied.display,
          gridTemplateColumns: applied.gridTemplateColumns,
          gap: applied.gap
        }
      };
    });
    
    console.log('\n🧪 Manual Style Test:');
    console.log('Original values:', manualTest.original);
    console.log('Applied values:', manualTest.applied);
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await browser.close();
  }
}

debugGridCSS().catch(console.error);