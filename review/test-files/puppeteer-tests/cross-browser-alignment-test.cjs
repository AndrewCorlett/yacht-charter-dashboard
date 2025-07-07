const puppeteer = require('puppeteer');
const fs = require('fs').promises;

async function crossBrowserAlignmentTest() {
  console.log('🌐 Starting cross-browser alignment verification...');
  
  const browsers = [
    { name: 'Chrome', args: ['--no-sandbox', '--disable-setuid-sandbox'] },
    { name: 'Chrome-Mobile', args: ['--no-sandbox', '--disable-setuid-sandbox', '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'] }
  ];

  const results = [];

  for (const browserConfig of browsers) {
    console.log(`\n🔍 Testing ${browserConfig.name}...`);
    
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: browserConfig.name === 'Chrome-Mobile' ? 
        { width: 375, height: 667 } : 
        { width: 1400, height: 900 },
      args: browserConfig.args
    });

    const page = await browser.newPage();
    
    try {
      await page.goto('http://localhost:5173/', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      await page.waitForSelector('[data-testid="yacht-calendar"]', { timeout: 15000 });
      await page.waitForSelector('[data-testid="yacht-headers"]', { timeout: 10000 });
      await new Promise(resolve => setTimeout(resolve, 2000));

      const alignmentData = await page.evaluate(() => {
        const headerCells = Array.from(document.querySelectorAll('[data-testid="yacht-headers"] .grid > div'));
        const firstRowCells = Array.from(document.querySelectorAll('#calendar-scroll-area .grid > div')).slice(0, headerCells.length);
        
        if (headerCells.length === 0 || firstRowCells.length === 0) {
          return { error: 'Calendar cells not found' };
        }

        let maxError = 0;
        const measurements = [];
        
        for (let i = 0; i < Math.min(headerCells.length, firstRowCells.length); i++) {
          const headerRect = headerCells[i].getBoundingClientRect();
          const contentRect = firstRowCells[i].getBoundingClientRect();
          
          const leftDiff = Math.abs(headerRect.left - contentRect.left);
          const rightDiff = Math.abs(headerRect.right - contentRect.right);
          const widthDiff = Math.abs(headerRect.width - contentRect.width);
          const cellMaxError = Math.max(leftDiff, rightDiff, widthDiff);
          
          maxError = Math.max(maxError, cellMaxError);
          
          measurements.push({
            columnIndex: i,
            leftDiff: Math.round(leftDiff),
            rightDiff: Math.round(rightDiff),
            widthDiff: Math.round(widthDiff),
            maxError: Math.round(cellMaxError)
          });
        }
        
        return {
          maxError: Math.round(maxError),
          measurements,
          totalColumns: headerCells.length
        };
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = `/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/cross-browser-${browserConfig.name}-${timestamp}.png`;
      
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: false
      });

      results.push({
        browser: browserConfig.name,
        viewport: await page.viewport(),
        alignmentData,
        screenshotPath,
        success: alignmentData.maxError <= 2
      });

      console.log(`  📏 Max alignment error: ${alignmentData.maxError}px`);
      console.log(`  📸 Screenshot: ${screenshotPath}`);
      console.log(`  ✅ Pass: ${alignmentData.maxError <= 2 ? 'YES' : 'NO'}`);

    } catch (error) {
      console.error(`  ❌ Error testing ${browserConfig.name}:`, error.message);
      results.push({
        browser: browserConfig.name,
        error: error.message,
        success: false
      });
    } finally {
      await browser.close();
    }
  }

  // Summary
  console.log('\n📊 CROSS-BROWSER TEST RESULTS:');
  const allPassed = results.every(result => result.success);
  
  results.forEach(result => {
    console.log(`  ${result.browser}: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
    if (result.alignmentData) {
      console.log(`    Max error: ${result.alignmentData.maxError}px`);
    }
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });

  console.log(`\n🏁 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  // Save results
  const reportPath = `/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/cross-browser-alignment-report.json`;
  await fs.writeFile(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    summary: {
      totalTests: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      allPassed
    }
  }, null, 2));

  console.log(`📄 Report saved: ${reportPath}`);
  
  return allPassed;
}

crossBrowserAlignmentTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });