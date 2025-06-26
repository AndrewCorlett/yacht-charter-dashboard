import puppeteer from 'puppeteer';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testYachtCharterApp() {
  console.log('Starting iOS Theme QA Test...');
  
  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'qa-screenshots');
  try {
    await fs.mkdir(screenshotsDir, { recursive: true });
  } catch (error) {
    console.log('Screenshots directory already exists or error creating it');
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  });

  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for the app to fully load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 1. Take screenshot of the main interface
    console.log('Capturing main interface...');
    await page.screenshot({
      path: path.join(screenshotsDir, '01-main-interface.png'),
      fullPage: false
    });

    // 2. Take full page screenshot
    console.log('Capturing full page...');
    await page.screenshot({
      path: path.join(screenshotsDir, '02-full-page.png'),
      fullPage: true
    });

    // 3. Test sticky header - scroll down and capture
    console.log('Testing sticky header functionality...');
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.screenshot({
      path: path.join(screenshotsDir, '03-sticky-header-scrolled.png'),
      fullPage: false
    });

    // 4. Scroll to middle of calendar
    console.log('Testing calendar mid-scroll...');
    await page.evaluate(() => {
      window.scrollTo(0, 1000);
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.screenshot({
      path: path.join(screenshotsDir, '04-calendar-mid-scroll.png'),
      fullPage: false
    });

    // 5. Check for iOS-style elements
    console.log('Analyzing iOS design elements...');
    
    // Get computed styles of key elements
    const designAnalysis = await page.evaluate(() => {
      const results = {
        colors: {},
        fonts: {},
        borders: {},
        shadows: {},
        spacing: {}
      };

      // Check background colors
      const body = document.body;
      results.colors.bodyBackground = window.getComputedStyle(body).backgroundColor;

      // Check for primary buttons
      const buttons = document.querySelectorAll('button');
      if (buttons.length > 0) {
        const buttonStyle = window.getComputedStyle(buttons[0]);
        results.colors.buttonBackground = buttonStyle.backgroundColor;
        results.colors.buttonText = buttonStyle.color;
        results.borders.buttonRadius = buttonStyle.borderRadius;
      }

      // Check fonts
      results.fonts.bodyFont = window.getComputedStyle(body).fontFamily;

      // Check for cards/containers
      const cards = document.querySelectorAll('[class*="card"], [class*="Card"]');
      if (cards.length > 0) {
        const cardStyle = window.getComputedStyle(cards[0]);
        results.borders.cardRadius = cardStyle.borderRadius;
        results.shadows.cardShadow = cardStyle.boxShadow;
        results.spacing.cardPadding = cardStyle.padding;
      }

      // Check for sticky header
      const headers = document.querySelectorAll('[class*="sticky"], [class*="fixed"], thead');
      results.stickyHeaderFound = headers.length > 0;

      return results;
    });

    console.log('Design Analysis:', JSON.stringify(designAnalysis, null, 2));

    // 6. Test navigation - try to find and click navigation elements
    console.log('Testing navigation elements...');
    
    // Look for navigation buttons or links
    const navElements = await page.$$('[class*="nav"], [class*="Nav"], nav a, nav button');
    if (navElements.length > 0) {
      console.log(`Found ${navElements.length} navigation elements`);
      
      // Click first navigation element if exists
      await navElements[0].click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.screenshot({
        path: path.join(screenshotsDir, '05-after-navigation.png'),
        fullPage: false
      });
    }

    // 7. Test responsive behavior
    console.log('Testing responsive design...');
    await page.setViewport({ width: 768, height: 1024 }); // iPad size
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.screenshot({
      path: path.join(screenshotsDir, '06-ipad-view.png'),
      fullPage: false
    });

    // 8. Test mobile view
    await page.setViewport({ width: 375, height: 812 }); // iPhone X size
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.screenshot({
      path: path.join(screenshotsDir, '07-iphone-view.png'),
      fullPage: false
    });

    // 9. Performance metrics
    console.log('Collecting performance metrics...');
    const metrics = await page.metrics();
    console.log('Performance Metrics:', {
      timestamp: metrics.Timestamp,
      documents: metrics.Documents,
      frames: metrics.Frames,
      jsEventListeners: metrics.JSEventListeners,
      nodes: metrics.Nodes,
      layoutCount: metrics.LayoutCount,
      recalcStyleCount: metrics.RecalcStyleCount,
      layoutDuration: metrics.LayoutDuration,
      recalcStyleDuration: metrics.RecalcStyleDuration,
      scriptDuration: metrics.ScriptDuration,
      taskDuration: metrics.TaskDuration,
      jsHeapUsedSize: (metrics.JSHeapUsedSize / 1048576).toFixed(2) + ' MB',
      jsHeapTotalSize: (metrics.JSHeapTotalSize / 1048576).toFixed(2) + ' MB'
    });

    // 10. Check for accessibility
    console.log('Running accessibility checks...');
    const accessibilityTree = await page.accessibility.snapshot();
    
    console.log('\nTest completed successfully!');
    console.log(`Screenshots saved to: ${screenshotsDir}`);

  } catch (error) {
    console.error('Error during testing:', error);
    await page.screenshot({
      path: path.join(screenshotsDir, 'error-screenshot.png'),
      fullPage: false
    });
  } finally {
    await browser.close();
  }
}

// Run the test
testYachtCharterApp().catch(console.error);