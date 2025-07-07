const puppeteer = require('puppeteer');

async function analyzeCalendarAlignment() {
  console.log('🔍 Starting Simple Calendar Alignment Analysis...');
  
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
    
    // Look for calendar elements in different ways
    console.log('🔍 Searching for calendar elements...');
    
    // First try to find any calendar-related elements
    const calendarElements = await page.evaluate(() => {
      const selectors = [
        '[data-testid="yacht-calendar"]',
        '.yacht-timeline-calendar',
        '[data-testid="yacht-headers"]',
        '.grid',
        '[data-section="calendar"]'
      ];
      
      const found = {};
      selectors.forEach(selector => {
        const element = document.querySelector(selector);
        found[selector] = {
          exists: !!element,
          className: element?.className || 'N/A',
          tagName: element?.tagName || 'N/A'
        };
      });
      
      return found;
    });
    
    console.log('📊 Calendar Element Search Results:');
    Object.entries(calendarElements).forEach(([selector, info]) => {
      console.log(`${selector}: ${info.exists ? '✅ Found' : '❌ Not found'} - ${info.tagName} ${info.className}`);
    });
    
    // Try to click on calendar navigation if it exists
    const calendarNav = await page.$('[data-section="calendar"]');
    if (calendarNav) {
      console.log('📅 Found calendar navigation, clicking...');
      await calendarNav.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('🔍 Looking for other navigation patterns...');
      const navElements = await page.$$eval('button, [role="button"], a', elements => 
        elements.map(el => ({
          text: el.textContent.trim().toLowerCase(),
          className: el.className
        })).filter(el => el.text.includes('calendar') || el.text.includes('schedule'))
      );
      console.log('Navigation options:', navElements);
    }
    
    // Take screenshot of current state
    console.log('📸 Taking screenshot of current state...');
    await page.screenshot({ 
      path: 'calendar-current-state.png',
      fullPage: true
    });
    
    // Look for any grid elements
    const gridAnalysis = await page.evaluate(() => {
      const grids = Array.from(document.querySelectorAll('.grid, [style*="grid"]'));
      return grids.map((grid, index) => {
        const style = window.getComputedStyle(grid);
        const rect = grid.getBoundingClientRect();
        return {
          index,
          gridTemplateColumns: style.getPropertyValue('grid-template-columns'),
          display: style.getPropertyValue('display'),
          width: rect.width,
          height: rect.height,
          childrenCount: grid.children.length,
          className: grid.className,
          visible: rect.width > 0 && rect.height > 0
        };
      });
    });
    
    console.log('\n🏗️ Grid Elements Found:');
    gridAnalysis.forEach(grid => {
      console.log(`Grid ${grid.index}:`);
      console.log(`  Template: ${grid.gridTemplateColumns}`);
      console.log(`  Children: ${grid.childrenCount}`);
      console.log(`  Size: ${Math.round(grid.width)}x${Math.round(grid.height)}`);
      console.log(`  Visible: ${grid.visible}`);
      console.log(`  Classes: ${grid.className}`);
    });
    
    // Look for the specific calendar component
    const yachtCalendar = await page.$('[data-testid="yacht-calendar"]');
    if (yachtCalendar) {
      console.log('\n✅ Found yacht calendar component!');
      
      // Focus on the calendar area and take a specific screenshot
      await page.screenshot({ 
        path: 'calendar-component-found.png',
        clip: await yachtCalendar.boundingBox()
      });
      
      // Analyze the grid structure within the calendar
      const calendarGrids = await page.evaluate(() => {
        const calendar = document.querySelector('[data-testid="yacht-calendar"]');
        if (!calendar) return null;
        
        const grids = Array.from(calendar.querySelectorAll('.grid'));
        return grids.map((grid, index) => {
          const style = window.getComputedStyle(grid);
          const children = Array.from(grid.children);
          const rect = grid.getBoundingClientRect();
          
          return {
            index,
            gridTemplateColumns: style.getPropertyValue('grid-template-columns'),
            childrenCount: children.length,
            width: rect.width,
            height: rect.height,
            firstChildText: children[0]?.textContent?.trim() || '',
            isHeader: grid.closest('[data-testid="yacht-headers"]') !== null,
            parent: grid.parentElement?.className || ''
          };
        });
      });
      
      console.log('\n📊 Calendar Grid Analysis:');
      calendarGrids?.forEach(grid => {
        console.log(`${grid.isHeader ? '📋 HEADER' : '📅 CONTENT'} Grid ${grid.index}:`);
        console.log(`  Template: ${grid.gridTemplateColumns}`);
        console.log(`  Children: ${grid.childrenCount}`);
        console.log(`  Size: ${Math.round(grid.width)}x${Math.round(grid.height)}`);
        console.log(`  First child: "${grid.firstChildText}"`);
        console.log(`  Parent: ${grid.parent}`);
      });
      
      return { found: true, grids: calendarGrids };
    } else {
      console.log('\n❌ Yacht calendar component not found');
      return { found: false, grids: [] };
    }
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    return null;
  } finally {
    await browser.close();
  }
}

analyzeCalendarAlignment().then(result => {
  if (result?.found) {
    console.log('\n✅ Calendar analysis completed successfully');
  } else {
    console.log('\n❌ Calendar analysis failed or component not found');
  }
});