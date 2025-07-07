const puppeteer = require('puppeteer');
const fs = require('fs').promises;

async function verifyCalendarAlignment() {
  console.log('🔍 Starting independent yacht calendar alignment verification...');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for visual inspection
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  try {
    // Navigate to the development server
    console.log('📍 Navigating to http://localhost:5173/');
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Wait for calendar to load
    console.log('⏳ Waiting for calendar component...');
    await page.waitForSelector('[data-testid="yacht-calendar"]', { timeout: 15000 });
    
    // Wait for yacht headers to be visible
    await page.waitForSelector('[data-testid="yacht-headers"]', { timeout: 10000 });
    
    // Wait a bit more for everything to settle
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take initial screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = `/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/alignment-verification-${timestamp}.png`;
    
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: false
    });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);

    // Get grid template styles for both header and content
    const gridStyles = await page.evaluate(() => {
      const headerGrid = document.querySelector('[data-testid="yacht-headers"] .grid');
      const contentGrid = document.querySelector('#calendar-scroll-area .grid');
      
      if (!headerGrid || !contentGrid) {
        return { error: 'Grid elements not found' };
      }

      const headerStyle = window.getComputedStyle(headerGrid);
      const contentStyle = window.getComputedStyle(contentGrid);
      
      return {
        header: {
          gridTemplateColumns: headerStyle.gridTemplateColumns,
          width: headerGrid.offsetWidth
        },
        content: {
          gridTemplateColumns: contentStyle.gridTemplateColumns,
          width: contentGrid.offsetWidth
        }
      };
    });

    console.log('📏 Grid template analysis:');
    console.log('Header grid:', gridStyles.header);
    console.log('Content grid:', gridStyles.content);

    // Measure column positions for precise alignment
    const alignmentData = await page.evaluate(() => {
      const headerCells = Array.from(document.querySelectorAll('[data-testid="yacht-headers"] .grid > div'));
      const firstRowCells = Array.from(document.querySelectorAll('#calendar-scroll-area .grid > div')).slice(0, headerCells.length);
      
      if (headerCells.length === 0 || firstRowCells.length === 0) {
        return { error: 'Calendar cells not found' };
      }

      const measurements = [];
      
      for (let i = 0; i < Math.min(headerCells.length, firstRowCells.length); i++) {
        const headerRect = headerCells[i].getBoundingClientRect();
        const contentRect = firstRowCells[i].getBoundingClientRect();
        
        measurements.push({
          columnIndex: i,
          columnType: i === 0 ? 'date' : 'yacht',
          header: {
            left: Math.round(headerRect.left),
            right: Math.round(headerRect.right),
            width: Math.round(headerRect.width)
          },
          content: {
            left: Math.round(contentRect.left),
            right: Math.round(contentRect.right),
            width: Math.round(contentRect.width)
          },
          alignment: {
            leftDiff: Math.round(Math.abs(headerRect.left - contentRect.left)),
            rightDiff: Math.round(Math.abs(headerRect.right - contentRect.right)),
            widthDiff: Math.round(Math.abs(headerRect.width - contentRect.width))
          }
        });
      }
      
      return {
        totalColumns: headerCells.length,
        measurements,
        yachtNames: headerCells.slice(1).map(cell => cell.textContent.trim())
      };
    });

    console.log('\n📐 Detailed alignment measurements:');
    
    const report = {
      timestamp: new Date().toISOString(),
      gridStyles,
      alignmentData,
      verification: {
        gridTemplatesMatch: gridStyles.header?.gridTemplateColumns === gridStyles.content?.gridTemplateColumns,
        perfectAlignment: true,
        maxAlignmentError: 0,
        issues: []
      }
    };

    if (alignmentData.error) {
      console.log('❌ Error:', alignmentData.error);
      report.verification.issues.push(alignmentData.error);
    } else {
      console.log(`📊 Total columns: ${alignmentData.totalColumns}`);
      console.log(`🏷️  Yacht names: ${alignmentData.yachtNames.join(', ')}`);
      
      // Analyze each column's alignment
      alignmentData.measurements.forEach(measurement => {
        const { columnIndex, columnType, alignment } = measurement;
        const maxError = Math.max(alignment.leftDiff, alignment.rightDiff, alignment.widthDiff);
        
        console.log(`\n Column ${columnIndex} (${columnType}):`);
        console.log(`  Left alignment diff: ${alignment.leftDiff}px`);
        console.log(`  Right alignment diff: ${alignment.rightDiff}px`);
        console.log(`  Width diff: ${alignment.widthDiff}px`);
        console.log(`  Max error: ${maxError}px`);
        
        // Track maximum alignment error
        if (maxError > report.verification.maxAlignmentError) {
          report.verification.maxAlignmentError = maxError;
        }
        
        // Flag issues if alignment is off by more than 2 pixels
        if (maxError > 2) {
          report.verification.perfectAlignment = false;
          report.verification.issues.push(
            `Column ${columnIndex} (${columnType}) has alignment error of ${maxError}px`
          );
        }
      });
    }

    // Test scrolling behavior
    console.log('\n🔄 Testing scroll behavior...');
    await page.evaluate(() => {
      const scrollArea = document.getElementById('calendar-scroll-area');
      if (scrollArea) {
        scrollArea.scrollTop = 200;
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot after scroll
    const scrolledScreenshotPath = `/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/alignment-verification-scrolled-${timestamp}.png`;
    await page.screenshot({ 
      path: scrolledScreenshotPath,
      fullPage: false
    });
    console.log(`📸 Scrolled screenshot saved: ${scrolledScreenshotPath}`);

    // Re-measure alignment after scroll
    const scrolledAlignmentData = await page.evaluate(() => {
      const headerCells = Array.from(document.querySelectorAll('[data-testid="yacht-headers"] .grid > div'));
      const visibleContentCells = Array.from(document.querySelectorAll('#calendar-scroll-area .grid > div'));
      
      // Find the first visible row after scroll
      const scrollArea = document.getElementById('calendar-scroll-area');
      const scrollTop = scrollArea.scrollTop;
      
      // Estimate which row should be visible (assuming 60px row height)
      const rowHeight = 60;
      const visibleRowStart = Math.floor(scrollTop / rowHeight);
      const cellsPerRow = headerCells.length;
      const firstVisibleRowStart = visibleRowStart * cellsPerRow;
      
      const firstVisibleRow = visibleContentCells.slice(firstVisibleRowStart, firstVisibleRowStart + cellsPerRow);
      
      const measurements = [];
      
      for (let i = 0; i < Math.min(headerCells.length, firstVisibleRow.length); i++) {
        const headerRect = headerCells[i].getBoundingClientRect();
        const contentRect = firstVisibleRow[i].getBoundingClientRect();
        
        measurements.push({
          columnIndex: i,
          alignment: {
            leftDiff: Math.round(Math.abs(headerRect.left - contentRect.left)),
            rightDiff: Math.round(Math.abs(headerRect.right - contentRect.right)),
            widthDiff: Math.round(Math.abs(headerRect.width - contentRect.width))
          }
        });
      }
      
      return { measurements, scrollTop };
    });

    console.log('\n📏 Alignment after scroll:');
    scrolledAlignmentData.measurements.forEach(measurement => {
      const { columnIndex, alignment } = measurement;
      const maxError = Math.max(alignment.leftDiff, alignment.rightDiff, alignment.widthDiff);
      console.log(`  Column ${columnIndex}: ${maxError}px max error`);
      
      if (maxError > report.verification.maxAlignmentError) {
        report.verification.maxAlignmentError = maxError;
      }
      
      if (maxError > 2) {
        report.verification.perfectAlignment = false;
        report.verification.issues.push(
          `Column ${columnIndex} has alignment error of ${maxError}px after scroll`
        );
      }
    });

    // Final assessment
    console.log('\n🏁 VERIFICATION RESULTS:');
    console.log(`✅ Grid templates match: ${report.verification.gridTemplatesMatch}`);
    console.log(`📏 Maximum alignment error: ${report.verification.maxAlignmentError}px`);
    console.log(`🎯 Perfect alignment: ${report.verification.perfectAlignment}`);
    
    if (report.verification.issues.length > 0) {
      console.log('⚠️  Issues found:');
      report.verification.issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('✨ No alignment issues detected!');
    }

    // Save detailed report
    const reportPath = `/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/alignment-verification-report-${timestamp}.json`;
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved: ${reportPath}`);

    return {
      success: true,
      report,
      screenshots: [screenshotPath, scrolledScreenshotPath]
    };

  } catch (error) {
    console.error('❌ Verification failed:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

// Run the verification
verifyCalendarAlignment()
  .then(result => {
    if (result.success) {
      console.log('\n🎉 Independent verification completed successfully!');
      process.exit(0);
    } else {
      console.log('\n💥 Verification failed:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });