const { chromium } = require('playwright');

async function testSaturdayFix() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--window-size=375,812', '--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 812 });
    
    console.log('🔍 Testing Saturday cutoff fix...');
    await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
    
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(2000);
    
    await page.waitForSelector('#custom-calendar-container', { timeout: 10000 });
    
    // Clear browser cache to ensure we get the updated CSS
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(2000);
    await page.waitForSelector('#custom-calendar-container', { timeout: 10000 });
    
    // Analyze the fixed layout
    const fixAnalysis = await page.evaluate(() => {
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const container = document.getElementById('custom-calendar-container');
      const grid = document.getElementById('calendar-grid');
      
      const containerRect = container.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();
      
      // Get all day headers
      const dayHeaders = Array.from(document.querySelectorAll('#calendar-grid [role="columnheader"]'));
      
      const headerAnalysis = dayHeaders.map((header, index) => {
        const rect = header.getBoundingClientRect();
        const style = window.getComputedStyle(header);
        
        return {
          index,
          text: header.textContent.trim(),
          width: Math.round(rect.width),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          fontSize: style.fontSize,
          fitsInContainer: rect.right <= containerRect.right
        };
      });
      
      // Get sample date cells
      const dateCells = Array.from(document.querySelectorAll('.calendar-date:not([role="columnheader"])'));
      const sampleDateCells = dateCells.slice(0, 7).map((cell, index) => {
        const rect = cell.getBoundingClientRect();
        const style = window.getComputedStyle(cell);
        
        return {
          index,
          text: cell.textContent.trim(),
          width: Math.round(rect.width),
          right: Math.round(rect.right),
          fontSize: style.fontSize,
          height: Math.round(rect.height),
          fitsInContainer: rect.right <= containerRect.right
        };
      });
      
      return {
        viewport,
        container: {
          width: Math.round(containerRect.width),
          maxWidth: window.getComputedStyle(container).maxWidth,
          padding: window.getComputedStyle(container).padding,
          right: Math.round(containerRect.right)
        },
        grid: {
          width: Math.round(gridRect.width),
          gap: window.getComputedStyle(grid).gap,
          right: Math.round(gridRect.right),
          fitsInContainer: gridRect.right <= containerRect.right
        },
        headers: headerAnalysis,
        dateCells: sampleDateCells
      };
    });
    
    console.log('\n📊 Saturday Fix Analysis:');
    console.log('Viewport width:', fixAnalysis.viewport.width + 'px');
    console.log('Container width:', fixAnalysis.container.width + 'px');
    console.log('Container max-width:', fixAnalysis.container.maxWidth);
    console.log('Container padding:', fixAnalysis.container.padding);
    console.log('Grid width:', fixAnalysis.grid.width + 'px');
    console.log('Grid gap:', fixAnalysis.grid.gap);
    console.log('Grid fits in container:', fixAnalysis.grid.fitsInContainer);
    
    console.log('\n📅 Day Headers Analysis (Fixed):');
    fixAnalysis.headers.forEach(header => {
      console.log(`${header.index + 1}. ${header.text}:`);
      console.log(`   - Width: ${header.width}px`);
      console.log(`   - Position: ${header.left}-${header.right}px`);
      console.log(`   - Font size: ${header.fontSize}`);
      console.log(`   - Fits in container: ${header.fitsInContainer}`);
      
      if (header.text.toLowerCase().includes('sat')) {
        console.log(`   ${header.fitsInContainer ? '✅' : '❌'} Saturday status: ${header.fitsInContainer ? 'FITS PROPERLY' : 'STILL CUT OFF'}`);
      }
    });
    
    console.log('\n🔢 Date Cells Analysis (Fixed):');
    fixAnalysis.dateCells.forEach(cell => {
      if (cell.text) {
        console.log(`Cell ${cell.index + 1} ("${cell.text}"):`);
        console.log(`   - Size: ${cell.width}x${cell.height}px`);
        console.log(`   - Right edge: ${cell.right}px`);
        console.log(`   - Font size: ${cell.fontSize}`);
        console.log(`   - Fits in container: ${cell.fitsInContainer}`);
        
        if (cell.index === 6) { // Saturday column
          console.log(`   ${cell.fitsInContainer ? '✅' : '❌'} Saturday column: ${cell.fitsInContainer ? 'FIXED' : 'STILL HAS ISSUES'}`);
        }
      }
    });
    
    // Check margins and spacing
    const spacingAnalysis = await page.evaluate(() => {
      const container = document.getElementById('custom-calendar-container');
      const containerRect = container.getBoundingClientRect();
      const leftMargin = containerRect.left;
      const rightMargin = window.innerWidth - containerRect.right;
      
      return {
        leftMargin: Math.round(leftMargin),
        rightMargin: Math.round(rightMargin),
        isCentered: Math.abs(leftMargin - rightMargin) <= 5,
        viewportUsage: Math.round((containerRect.width / window.innerWidth) * 100)
      };
    });
    
    console.log('\n📐 Spacing & Centering:');
    console.log('Left margin:', spacingAnalysis.leftMargin + 'px');
    console.log('Right margin:', spacingAnalysis.rightMargin + 'px');
    console.log('Is centered:', spacingAnalysis.isCentered);
    console.log('Viewport usage:', spacingAnalysis.viewportUsage + '%');
    
    // Overall assessment
    const saturdayFixed = fixAnalysis.headers.find(h => h.text.toLowerCase().includes('sat'))?.fitsInContainer;
    const allHeadersFit = fixAnalysis.headers.every(h => h.fitsInContainer);
    const allDateCellsFit = fixAnalysis.dateCells.every(c => c.fitsInContainer);
    
    console.log('\n🎯 Fix Assessment:');
    console.log('✅ Saturday header fixed:', saturdayFixed);
    console.log('✅ All headers fit:', allHeadersFit);
    console.log('✅ All date cells fit:', allDateCellsFit);
    console.log('✅ Grid fits in container:', fixAnalysis.grid.fitsInContainer);
    
    if (saturdayFixed && allHeadersFit && allDateCellsFit) {
      console.log('\n🎉 SUCCESS: Saturday cutoff issue has been FIXED!');
    } else {
      console.log('\n⚠️ ISSUE: Some elements still don\'t fit properly');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'saturday-fixed.png', fullPage: false });
    console.log('\n📸 Screenshot saved: saturday-fixed.png');
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testSaturdayFix().catch(console.error);