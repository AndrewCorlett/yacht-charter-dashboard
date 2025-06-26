const puppeteer = require('puppeteer');

async function takeGridScreenshot() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    console.log('Loading application with enhanced calendar grid...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle2', timeout: 10000 });

    // Wait for content to load
    await page.waitForSelector('.ios-card', { timeout: 5000 });
    
    console.log('Taking enhanced grid screenshot...');
    await page.screenshot({ 
      path: 'enhanced-grid-screenshot.png'
    });

    // Check calendar grid border visibility
    const gridCheck = await page.evaluate(() => {
      const calendarCells = document.querySelectorAll('.calendar-grid-border');
      const headerBorders = document.querySelectorAll('.calendar-header-border');
      
      // Get border styles
      const sampleCell = calendarCells[0];
      const sampleHeader = headerBorders[0];
      
      return {
        gridCellCount: calendarCells.length,
        headerBorderCount: headerBorders.length,
        cellBorderColor: sampleCell ? window.getComputedStyle(sampleCell).borderColor : 'none',
        cellBorderWidth: sampleCell ? window.getComputedStyle(sampleCell).borderWidth : 'none',
        headerBorderColor: sampleHeader ? window.getComputedStyle(sampleHeader).borderColor : 'none',
        headerBorderWidth: sampleHeader ? window.getComputedStyle(sampleHeader).borderWidth : 'none'
      };
    });

    console.log('Calendar grid analysis:');
    console.log(`Grid cells with enhanced borders: ${gridCheck.gridCellCount}`);
    console.log(`Header elements with enhanced borders: ${gridCheck.headerBorderCount}`);
    console.log(`Cell border color: ${gridCheck.cellBorderColor}`);
    console.log(`Cell border width: ${gridCheck.cellBorderWidth}`);
    console.log(`Header border color: ${gridCheck.headerBorderColor}`);
    console.log(`Header border width: ${gridCheck.headerBorderWidth}`);

    // Check if enhanced borders are applied
    const hasEnhancedGrid = gridCheck.cellBorderColor.includes('90, 90, 92') || 
                           gridCheck.cellBorderColor.includes('106, 106, 108');

    console.log(`\n📊 ENHANCED GRID STATUS: ${hasEnhancedGrid ? '✅ APPLIED' : '❌ NOT APPLIED'}`);

    console.log('Screenshot saved as enhanced-grid-screenshot.png');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

takeGridScreenshot();