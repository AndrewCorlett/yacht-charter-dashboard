const puppeteer = require('puppeteer');

async function analyzeCalendarAlignment() {
  console.log('🔍 Starting Calendar Alignment Analysis...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    console.log('📡 Navigating to dashboard...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    
    // Wait for page to load and navigate to calendar
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click on Calendar section
    console.log('📅 Navigating to calendar section...');
    const calendarButton = await page.$('[data-section="calendar"]');
    if (calendarButton) {
      await calendarButton.click();
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Wait for calendar to render
    await page.waitForSelector('.yacht-timeline-calendar', { timeout: 10000 });
    console.log('✅ Calendar found and loaded');
    
    // Take screenshot of current state
    console.log('📸 Capturing current calendar state...');
    await page.screenshot({ 
      path: 'calendar-alignment-before.png',
      fullPage: false
    });
    
    // Analyze header structure
    console.log('🔍 Analyzing header structure...');
    const headerInfo = await page.evaluate(() => {
      const header = document.querySelector('.yacht-timeline-calendar .grid');
      if (!header) return null;
      
      const computedStyle = window.getComputedStyle(header);
      return {
        gridTemplateColumns: computedStyle.getPropertyValue('grid-template-columns'),
        display: computedStyle.getPropertyValue('display'),
        columnGap: computedStyle.getPropertyValue('column-gap'),
        rowGap: computedStyle.getPropertyValue('row-gap')
      };
    });
    
    // Analyze day cells grid structure
    console.log('🔍 Analyzing day cells structure...');
    const dayGridInfo = await page.evaluate(() => {
      const dayGrid = document.querySelector('.yacht-timeline-calendar .grid:not(:first-child)');
      if (!dayGrid) return null;
      
      const computedStyle = window.getComputedStyle(dayGrid);
      return {
        gridTemplateColumns: computedStyle.getPropertyValue('grid-template-columns'),
        display: computedStyle.getPropertyValue('display'),
        columnGap: computedStyle.getPropertyValue('column-gap'),
        rowGap: computedStyle.getPropertyValue('row-gap')
      };
    });
    
    // Get header and day cells positions for alignment analysis
    console.log('📏 Measuring alignment positions...');
    const alignmentData = await page.evaluate(() => {
      const headerCells = Array.from(document.querySelectorAll('.yacht-timeline-calendar .grid:first-child > *'));
      const dayCells = Array.from(document.querySelectorAll('.yacht-timeline-calendar .grid:not(:first-child) > .day-cell'));
      
      const headerPositions = headerCells.map((cell, index) => {
        const rect = cell.getBoundingClientRect();
        return {
          index,
          left: rect.left,
          width: rect.width,
          text: cell.textContent.trim()
        };
      });
      
      const dayPositions = dayCells.slice(0, headerCells.length).map((cell, index) => {
        const rect = cell.getBoundingClientRect();
        return {
          index,
          left: rect.left,
          width: rect.width,
          text: cell.textContent.trim()
        };
      });
      
      return { headerPositions, dayPositions };
    });
    
    // Calculate alignment differences
    const alignmentIssues = [];
    if (alignmentData.headerPositions.length === alignmentData.dayPositions.length) {
      for (let i = 0; i < alignmentData.headerPositions.length; i++) {
        const headerPos = alignmentData.headerPositions[i];
        const dayPos = alignmentData.dayPositions[i];
        const diff = Math.abs(headerPos.left - dayPos.left);
        
        if (diff > 2) { // Allow 2px tolerance
          alignmentIssues.push({
            column: i,
            headerText: headerPos.text,
            dayText: dayPos.text,
            headerLeft: headerPos.left,
            dayLeft: dayPos.left,
            difference: diff
          });
        }
      }
    }
    
    console.log('\n📊 ALIGNMENT ANALYSIS RESULTS:');
    console.log('=====================================');
    
    console.log('\n🏗️ Header Grid Configuration:');
    console.log('Grid Template Columns:', headerInfo?.gridTemplateColumns || 'Not found');
    console.log('Display:', headerInfo?.display || 'Not found');
    console.log('Column Gap:', headerInfo?.columnGap || 'Not found');
    
    console.log('\n📅 Day Cells Grid Configuration:');
    console.log('Grid Template Columns:', dayGridInfo?.gridTemplateColumns || 'Not found');
    console.log('Display:', dayGridInfo?.display || 'Not found');
    console.log('Column Gap:', dayGridInfo?.columnGap || 'Not found');
    
    console.log('\n📏 Position Analysis:');
    console.log('Header Cells Count:', alignmentData.headerPositions.length);
    console.log('Day Cells Count:', alignmentData.dayPositions.length);
    
    if (alignmentIssues.length > 0) {
      console.log('\n❌ ALIGNMENT ISSUES DETECTED:');
      alignmentIssues.forEach(issue => {
        console.log(`Column ${issue.column}: "${issue.headerText}" vs "${issue.dayText}"`);
        console.log(`  Header position: ${issue.headerLeft}px`);
        console.log(`  Day cell position: ${issue.dayLeft}px`);
        console.log(`  Difference: ${issue.difference}px`);
      });
    } else {
      console.log('\n✅ No significant alignment issues detected');
    }
    
    // Additional grid analysis
    console.log('\n🔍 Detailed Grid Analysis:');
    const gridDetails = await page.evaluate(() => {
      const calendar = document.querySelector('.yacht-timeline-calendar');
      if (!calendar) return null;
      
      const grids = Array.from(calendar.querySelectorAll('.grid'));
      return grids.map((grid, index) => {
        const style = window.getComputedStyle(grid);
        const children = Array.from(grid.children);
        return {
          gridIndex: index,
          gridTemplateColumns: style.getPropertyValue('grid-template-columns'),
          childrenCount: children.length,
          firstChildText: children[0]?.textContent?.trim() || '',
          className: grid.className
        };
      });
    });
    
    gridDetails?.forEach((detail, index) => {
      console.log(`Grid ${index}:`);
      console.log(`  Template: ${detail.gridTemplateColumns}`);
      console.log(`  Children: ${detail.childrenCount}`);
      console.log(`  First child: "${detail.firstChildText}"`);
      console.log(`  Classes: ${detail.className}`);
    });
    
    console.log('\n📸 Screenshot saved as: calendar-alignment-before.png');
    console.log('🔍 Analysis complete!');
    
    return {
      headerInfo,
      dayGridInfo,
      alignmentIssues,
      gridDetails
    };
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    return null;
  } finally {
    await browser.close();
  }
}

analyzeCalendarAlignment().then(result => {
  if (result) {
    console.log('\n✅ Analysis completed successfully');
  } else {
    console.log('\n❌ Analysis failed');
  }
});