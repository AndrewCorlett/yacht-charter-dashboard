const puppeteer = require('puppeteer');

async function verifyAlignmentFix() {
  console.log('✅ Starting Alignment Fix Verification...');
  
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
    
    // Take screenshot after fix
    console.log('📸 Taking screenshot after fix...');
    await page.screenshot({ 
      path: 'calendar-alignment-after-fix.png',
      fullPage: false
    });
    
    // Analyze the grid structure after fix
    const alignmentAnalysis = await page.evaluate(() => {
      const calendar = document.querySelector('[data-testid="yacht-calendar"]');
      if (!calendar) return null;
      
      const grids = Array.from(calendar.querySelectorAll('.grid'));
      const gridData = grids.map((grid, index) => {
        const style = window.getComputedStyle(grid);
        const rect = grid.getBoundingClientRect();
        const children = Array.from(grid.children);
        
        return {
          index,
          gridTemplateColumns: style.getPropertyValue('grid-template-columns'),
          width: rect.width,
          height: rect.height,
          childrenCount: children.length,
          isHeader: grid.closest('[data-testid="yacht-headers"]') !== null,
          firstChildText: children[0]?.textContent?.trim() || ''
        };
      });
      
      // Find header and content grids
      const headerGrid = gridData.find(g => g.isHeader);
      const contentGrid = gridData.find(g => !g.isHeader && g.childrenCount > 8);
      
      return { headerGrid, contentGrid, allGrids: gridData };
    });
    
    if (!alignmentAnalysis) {
      throw new Error('Could not analyze grid structure');
    }
    
    const { headerGrid, contentGrid } = alignmentAnalysis;
    
    console.log('\n📊 GRID ALIGNMENT VERIFICATION:');
    console.log('=====================================');
    
    if (headerGrid) {
      console.log('📋 HEADER Grid:');
      console.log('  Template:', headerGrid.gridTemplateColumns);
      console.log('  Children:', headerGrid.childrenCount);
      console.log('  First child:', headerGrid.firstChildText);
    }
    
    if (contentGrid) {
      console.log('\n📅 CONTENT Grid:');
      console.log('  Template:', contentGrid.gridTemplateColumns);
      console.log('  Children:', contentGrid.childrenCount);
      console.log('  First child:', contentGrid.firstChildText);
    }
    
    // Check if templates match
    let templatesMatch = false;
    let alignmentFixed = false;
    
    if (headerGrid && contentGrid) {
      templatesMatch = headerGrid.gridTemplateColumns === contentGrid.gridTemplateColumns;
      
      // Check if both templates start with 120px (our fix)
      const headerStartsWith120 = headerGrid.gridTemplateColumns.startsWith('120px');
      const contentStartsWith120 = contentGrid.gridTemplateColumns.startsWith('120px');
      
      alignmentFixed = templatesMatch && headerStartsWith120 && contentStartsWith120;
      
      console.log('\n🔍 ALIGNMENT CHECK:');
      console.log('  Templates match:', templatesMatch ? '✅ YES' : '❌ NO');
      console.log('  Header uses 120px:', headerStartsWith120 ? '✅ YES' : '❌ NO');
      console.log('  Content uses 120px:', contentStartsWith120 ? '✅ YES' : '❌ NO');
      console.log('  Alignment fixed:', alignmentFixed ? '✅ YES' : '❌ NO');
    }
    
    // Detailed column position analysis
    const columnPositions = await page.evaluate(() => {
      const headerCells = Array.from(document.querySelectorAll('[data-testid="yacht-headers"] .grid > *'));
      const contentRows = Array.from(document.querySelectorAll('.overflow-y-auto .grid > *'));
      
      // Get first row of content (first 8 cells after the date)
      const firstRowCells = contentRows.slice(0, headerCells.length);
      
      const headerPositions = headerCells.map((cell, index) => {
        const rect = cell.getBoundingClientRect();
        return {
          index,
          left: rect.left,
          width: rect.width,
          text: cell.textContent.trim()
        };
      });
      
      const contentPositions = firstRowCells.map((cell, index) => {
        const rect = cell.getBoundingClientRect();
        return {
          index,
          left: rect.left,
          width: rect.width,
          text: cell.textContent.trim()
        };
      });
      
      return { headerPositions, contentPositions };
    });
    
    // Calculate alignment differences
    const alignmentIssues = [];
    const tolerance = 2; // 2px tolerance
    
    if (columnPositions.headerPositions.length === columnPositions.contentPositions.length) {
      for (let i = 0; i < columnPositions.headerPositions.length; i++) {
        const headerPos = columnPositions.headerPositions[i];
        const contentPos = columnPositions.contentPositions[i];
        const leftDiff = Math.abs(headerPos.left - contentPos.left);
        const widthDiff = Math.abs(headerPos.width - contentPos.width);
        
        if (leftDiff > tolerance || widthDiff > tolerance) {
          alignmentIssues.push({
            column: i,
            headerText: headerPos.text,
            contentText: contentPos.text,
            leftDiff,
            widthDiff,
            headerPos: { left: headerPos.left, width: headerPos.width },
            contentPos: { left: contentPos.left, width: contentPos.width }
          });
        }
      }
    }
    
    console.log('\n📏 COLUMN POSITION ANALYSIS:');
    if (alignmentIssues.length === 0) {
      console.log('✅ All columns are perfectly aligned!');
      console.log(`📊 Verified ${columnPositions.headerPositions.length} columns`);
    } else {
      console.log(`❌ Found ${alignmentIssues.length} alignment issues:`);
      alignmentIssues.forEach(issue => {
        console.log(`Column ${issue.column}: "${issue.headerText}" vs "${issue.contentText}"`);
        console.log(`  Left diff: ${issue.leftDiff}px`);
        console.log(`  Width diff: ${issue.widthDiff}px`);
      });
    }
    
    console.log('\n📸 Screenshots saved:');
    console.log('  - calendar-alignment-after-fix.png');
    
    const success = templatesMatch && alignmentIssues.length === 0;
    console.log(`\n${success ? '✅ SUCCESS' : '❌ NEEDS MORE WORK'}: Alignment fix ${success ? 'completed' : 'partially completed'}`);
    
    return {
      success,
      templatesMatch,
      alignmentIssues: alignmentIssues.length,
      headerTemplate: headerGrid?.gridTemplateColumns,
      contentTemplate: contentGrid?.gridTemplateColumns
    };
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

verifyAlignmentFix().then(result => {
  if (result.success) {
    console.log('\n🎉 Verification passed! Calendar alignment is fixed.');
  } else {
    console.log('\n⚠️ Verification indicates more work needed.');
  }
});