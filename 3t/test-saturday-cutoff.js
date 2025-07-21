const { chromium } = require('playwright');

async function testSaturdayCutoff() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--window-size=375,812', '--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 812 });
    
    console.log('🔍 Testing Saturday cutoff issue...');
    await page.goto('https://ittheal.com/3t/', { waitUntil: 'networkidle' });
    
    await page.waitForSelector('.service-option', { timeout: 10000 });
    await page.click('.service-option[data-service="60min"]');
    await page.waitForTimeout(2000);
    
    await page.waitForSelector('#custom-calendar-container', { timeout: 10000 });
    
    // Analyze day headers and grid overflow
    const saturdayAnalysis = await page.evaluate(() => {
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const container = document.getElementById('custom-calendar-container');
      const grid = document.getElementById('calendar-grid');
      
      // Get all day headers
      const dayHeaders = Array.from(document.querySelectorAll('#calendar-grid [role="columnheader"]'));
      
      const containerRect = container.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();
      
      const headerAnalysis = dayHeaders.map((header, index) => {
        const rect = header.getBoundingClientRect();
        const style = window.getComputedStyle(header);
        
        return {
          index,
          text: header.textContent.trim(),
          width: Math.round(rect.width),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          isVisible: rect.right <= containerRect.right,
          overflowsContainer: rect.right > containerRect.right,
          fontSize: style.fontSize,
          padding: style.padding
        };
      });
      
      return {
        viewport,
        container: {
          width: Math.round(containerRect.width),
          right: Math.round(containerRect.right)
        },
        grid: {
          width: Math.round(gridRect.width),
          right: Math.round(gridRect.right),
          overflowsContainer: gridRect.right > containerRect.right
        },
        headers: headerAnalysis
      };
    });
    
    console.log('\n📊 Saturday Cutoff Analysis:');
    console.log('Viewport width:', saturdayAnalysis.viewport.width + 'px');
    console.log('Container width:', saturdayAnalysis.container.width + 'px');
    console.log('Grid width:', saturdayAnalysis.grid.width + 'px');
    console.log('Grid overflows container:', saturdayAnalysis.grid.overflowsContainer);
    
    console.log('\n📅 Day Headers Analysis:');
    saturdayAnalysis.headers.forEach(header => {
      console.log(`${header.index + 1}. ${header.text}:`);
      console.log(`   - Width: ${header.width}px`);
      console.log(`   - Position: ${header.left}-${header.right}px`);
      console.log(`   - Visible: ${header.isVisible}`);
      console.log(`   - Overflows: ${header.overflowsContainer}`);
      console.log(`   - Font size: ${header.fontSize}`);
      console.log(`   - Padding: ${header.padding}`);
      
      if (header.text.toLowerCase().includes('sat') && header.overflowsContainer) {
        console.log(`   ⚠️ SATURDAY IS CUT OFF!`);
      }
    });
    
    // Check individual date cells too
    const dateCellAnalysis = await page.evaluate(() => {
      const dateCells = document.querySelectorAll('.calendar-date:not([role="columnheader"])');
      const container = document.getElementById('custom-calendar-container');
      const containerRect = container.getBoundingClientRect();
      
      const cellsInFirstWeek = Array.from(dateCells).slice(0, 7);
      
      return cellsInFirstWeek.map((cell, index) => {
        const rect = cell.getBoundingClientRect();
        const style = window.getComputedStyle(cell);
        
        return {
          index,
          text: cell.textContent.trim(),
          width: Math.round(rect.width),
          right: Math.round(rect.right),
          overflowsContainer: rect.right > containerRect.right,
          fontSize: style.fontSize
        };
      });
    });
    
    console.log('\n🔢 Date Cells Analysis (First Week):');
    dateCellAnalysis.forEach(cell => {
      console.log(`Cell ${cell.index + 1} (${cell.text}):`);
      console.log(`   - Width: ${cell.width}px, Right: ${cell.right}px`);
      console.log(`   - Overflows: ${cell.overflowsContainer}`);
      console.log(`   - Font size: ${cell.fontSize}`);
      
      if (cell.index === 6 && cell.overflowsContainer) {
        console.log(`   ⚠️ SATURDAY COLUMN IS CUT OFF!`);
      }
    });
    
    // Take screenshot to visualize the issue
    await page.screenshot({ path: 'saturday-cutoff-issue.png', fullPage: false });
    console.log('\n📸 Screenshot saved: saturday-cutoff-issue.png');
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testSaturdayCutoff().catch(console.error);