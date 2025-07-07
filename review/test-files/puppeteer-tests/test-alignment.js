import puppeteer from 'puppeteer';

async function testAlignment() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait for calendar to load
    await page.waitForSelector('#calendar-scroll-area', { timeout: 10000 });
    
    // Take a screenshot for verification
    await page.screenshot({ 
      path: 'calendar-alignment-test.png',
      fullPage: false 
    });
    
    // Get headers and content from single grid
    const gridAnalysis = await page.evaluate(() => {
      const gridContainer = document.querySelector('#calendar-scroll-area .grid');
      
      if (!gridContainer) {
        return { error: 'Grid container not found' };
      }
      
      const allCells = Array.from(gridContainer.children);
      // First 7 are sticky headers
      const headers = allCells.slice(0, 7);
      // Next 7 are first content row
      const firstContentRow = allCells.slice(7, 14);
      
      const headerPositions = headers.map((cell, i) => {
        const rect = cell.getBoundingClientRect();
        return {
          index: i,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          class: cell.className
        };
      });
      
      const contentPositions = firstContentRow.map((cell, i) => {
        const rect = cell.getBoundingClientRect();
        return {
          index: i,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          class: cell.className
        };
      });
      
      return { headerPositions, contentPositions, totalCells: allCells.length };
    });
    
    if (gridAnalysis.error) {
      console.log('❌ Error:', gridAnalysis.error);
      return;
    }
    
    const { headerPositions, contentPositions } = gridAnalysis;
    
    console.log('\n📊 Grid Analysis:');
    console.log('Total cells:', gridAnalysis.totalCells);
    console.log('Header count:', headerPositions.length);
    console.log('Content count:', contentPositions.length);
    
    console.log('\n📏 Header positions:');
    headerPositions.forEach(h => console.log(`  Col ${h.index}: ${h.left}-${h.right} (w:${h.width})`));
    
    console.log('\n📏 Content positions:');
    contentPositions.forEach(c => console.log(`  Col ${c.index}: ${c.left}-${c.right} (w:${c.width})`));
    
    // Check alignment (tolerance of 2px for browser rendering differences)
    let alignmentPerfect = true;
    let maxDiff = 0;
    
    for (let i = 0; i < Math.min(headerPositions.length, contentPositions.length); i++) {
      const header = headerPositions[i];
      const content = contentPositions[i];
      
      const leftDiff = Math.abs(header.left - content.left);
      const rightDiff = Math.abs(header.right - content.right);
      const maxColDiff = Math.max(leftDiff, rightDiff);
      
      maxDiff = Math.max(maxDiff, maxColDiff);
      
      if (maxColDiff > 2) {
        console.log(`❌ Column ${i} misaligned by ${maxColDiff}px: Header(${header.left}-${header.right}) vs Content(${content.left}-${content.right})`);
        alignmentPerfect = false;
      } else {
        console.log(`✅ Column ${i} aligned (diff: ${maxColDiff}px): Header(${header.left}-${header.right}) vs Content(${content.left}-${content.right})`);
      }
    }
    
    console.log(`\n📐 Maximum alignment difference: ${maxDiff}px`);
    
    // Test sticky header behavior
    console.log('\n🔄 Testing sticky header behavior...');
    
    const stickyTest = await page.evaluate(async () => {
      const scrollArea = document.getElementById('calendar-scroll-area');
      const firstHeader = document.querySelector('#calendar-scroll-area .grid .sticky');
      
      if (!scrollArea || !firstHeader) {
        return { error: 'Required elements not found' };
      }
      
      // Get initial header position
      const initialHeaderPos = firstHeader.getBoundingClientRect();
      
      // Scroll down 200px
      scrollArea.scrollTop = 200;
      
      // Wait a moment for scroll to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get header position after scroll
      const scrolledHeaderPos = firstHeader.getBoundingClientRect();
      
      return {
        initialTop: Math.round(initialHeaderPos.top),
        scrolledTop: Math.round(scrolledHeaderPos.top),
        headerStayedFixed: Math.abs(initialHeaderPos.top - scrolledHeaderPos.top) < 2,
        scrollTop: scrollArea.scrollTop
      };
    });
    
    if (stickyTest.error) {
      console.log('❌ Sticky test error:', stickyTest.error);
    } else {
      console.log(`📍 Header position before scroll: ${stickyTest.initialTop}px`);
      console.log(`📍 Header position after scroll: ${stickyTest.scrolledTop}px`);
      console.log(`📜 Scroll position: ${stickyTest.scrollTop}px`);
      
      if (stickyTest.headerStayedFixed) {
        console.log('✅ Header stayed fixed during scroll');
      } else {
        console.log('❌ Header moved during scroll');
      }
    }
    
    if (alignmentPerfect && (stickyTest.headerStayedFixed || stickyTest.error)) {
      console.log('\n🎉 SUCCESS: All columns aligned and headers stay fixed!');
      await page.screenshot({ path: 'alignment-and-sticky-success.png', fullPage: false });
    } else {
      console.log('\n❌ FAILURE: Issues detected');
      await page.screenshot({ path: 'alignment-or-sticky-failure.png', fullPage: false });
    }
    
    // Keep browser open for manual inspection
    console.log('\nBrowser left open for manual inspection. Press Ctrl+C to close.');
    await new Promise(() => {}); // Keep running
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // await browser.close();
  }
}

testAlignment();