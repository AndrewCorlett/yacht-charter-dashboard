const puppeteer = require('puppeteer');

async function verifyDayCellsAlignment() {
  console.log('🎯 Starting Day Cells Alignment Verification...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    
    console.log('📡 Navigating to dashboard...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Find the calendar component
    const yachtCalendar = await page.$('[data-testid="yacht-calendar"]');
    if (!yachtCalendar) {
      throw new Error('Calendar component not found');
    }
    
    console.log('✅ Found yacht calendar component');
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'calendar-day-cells-verification.png',
      fullPage: false
    });
    
    // Analyze the specific alignment between header and day cells
    const specificAlignment = await page.evaluate(() => {
      // Get header cells specifically
      const headerContainer = document.querySelector('[data-testid="yacht-headers"] .grid');
      const headerCells = headerContainer ? Array.from(headerContainer.children) : [];
      
      // Get day cells from the scrollable content area - focusing on first row
      const scrollArea = document.querySelector('#calendar-scroll-area .grid');
      const allCells = scrollArea ? Array.from(scrollArea.children) : [];
      
      // The first row should contain: 1 date cell + N yacht cells
      const firstRowCells = allCells.slice(0, headerCells.length);
      
      console.log('Found header cells:', headerCells.length);
      console.log('Found first row cells:', firstRowCells.length);
      
      if (headerCells.length === 0 || firstRowCells.length === 0) {
        return { error: 'Could not find header or day cells' };
      }
      
      // Get positions for header cells
      const headerPositions = headerCells.map((cell, index) => {
        const rect = cell.getBoundingClientRect();
        return {
          index,
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          text: cell.textContent.trim().substring(0, 20), // Truncate for readability
          className: cell.className
        };
      });
      
      // Get positions for first row day cells
      const dayPositions = firstRowCells.map((cell, index) => {
        const rect = cell.getBoundingClientRect();
        return {
          index,
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          text: cell.textContent.trim().substring(0, 20), // Truncate for readability
          className: cell.className
        };
      });
      
      return {
        headerPositions,
        dayPositions,
        headerCount: headerCells.length,
        dayCount: firstRowCells.length
      };
    });
    
    if (specificAlignment.error) {
      throw new Error(specificAlignment.error);
    }
    
    const { headerPositions, dayPositions } = specificAlignment;
    
    console.log('\n📊 SPECIFIC DAY CELLS ALIGNMENT ANALYSIS:');
    console.log('================================================');
    
    console.log(`\n📋 Header Cells (${headerPositions.length}):`);
    headerPositions.forEach((pos, i) => {
      console.log(`  ${i}: "${pos.text}" @ ${pos.left}px (${pos.width}px wide)`);
    });
    
    console.log(`\n📅 Day Cells (${dayPositions.length}):`);
    dayPositions.forEach((pos, i) => {
      console.log(`  ${i}: "${pos.text}" @ ${pos.left}px (${pos.width}px wide)`);
    });
    
    // Calculate alignment precision
    const alignmentResults = [];
    const tolerance = 2; // 2px tolerance
    
    for (let i = 0; i < Math.min(headerPositions.length, dayPositions.length); i++) {
      const header = headerPositions[i];
      const day = dayPositions[i];
      const leftDiff = Math.abs(header.left - day.left);
      const widthDiff = Math.abs(header.width - day.width);
      
      const isAligned = leftDiff <= tolerance && widthDiff <= tolerance;
      
      alignmentResults.push({
        column: i,
        headerText: header.text,
        dayText: day.text,
        leftDiff,
        widthDiff,
        isAligned,
        headerPos: { left: header.left, width: header.width },
        dayPos: { left: day.left, width: day.width }
      });
    }
    
    console.log('\n📏 ALIGNMENT PRECISION CHECK:');
    console.log('=================================');
    
    let perfectlyAligned = 0;
    alignmentResults.forEach(result => {
      console.log(`Column ${result.column}: ${result.isAligned ? '✅' : '❌'} "${result.headerText}" vs "${result.dayText}"`);
      if (!result.isAligned) {
        console.log(`  Left diff: ${result.leftDiff}px, Width diff: ${result.widthDiff}px`);
      }
      if (result.isAligned) perfectlyAligned++;
    });
    
    const allAligned = perfectlyAligned === alignmentResults.length;
    const alignmentPercentage = Math.round((perfectlyAligned / alignmentResults.length) * 100);
    
    console.log(`\n📊 ALIGNMENT SUMMARY:`);
    console.log(`  Perfect columns: ${perfectlyAligned}/${alignmentResults.length}`);
    console.log(`  Alignment rate: ${alignmentPercentage}%`);
    console.log(`  Status: ${allAligned ? '✅ PERFECT ALIGNMENT' : '⚠️ NEEDS ADJUSTMENT'}`);
    
    // Grid template verification
    const gridTemplates = await page.evaluate(() => {
      const headerGrid = document.querySelector('[data-testid="yacht-headers"] .grid');
      const contentGrid = document.querySelector('#calendar-scroll-area .grid');
      
      if (!headerGrid || !contentGrid) {
        return { error: 'Could not find grids' };
      }
      
      const headerStyle = window.getComputedStyle(headerGrid);
      const contentStyle = window.getComputedStyle(contentGrid);
      
      return {
        headerTemplate: headerStyle.getPropertyValue('grid-template-columns'),
        contentTemplate: contentStyle.getPropertyValue('grid-template-columns'),
        templatesMatch: headerStyle.getPropertyValue('grid-template-columns') === contentStyle.getPropertyValue('grid-template-columns')
      };
    });
    
    console.log(`\n🏗️ GRID TEMPLATE VERIFICATION:`);
    console.log(`  Templates match: ${gridTemplates.templatesMatch ? '✅ YES' : '❌ NO'}`);
    console.log(`  Header: ${gridTemplates.headerTemplate}`);
    console.log(`  Content: ${gridTemplates.contentTemplate}`);
    
    console.log('\n📸 Screenshot saved: calendar-day-cells-verification.png');
    
    return {
      success: allAligned,
      alignmentPercentage,
      perfectColumns: perfectlyAligned,
      totalColumns: alignmentResults.length,
      templatesMatch: gridTemplates.templatesMatch
    };
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

verifyDayCellsAlignment().then(result => {
  if (result.success) {
    console.log('\n🎉 SUCCESS! Calendar day cells are perfectly aligned with headers.');
  } else {
    console.log(`\n⚠️ Alignment at ${result.alignmentPercentage}% - needs fine-tuning.`);
  }
});