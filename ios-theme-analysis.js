import puppeteer from 'puppeteer';

async function analyzeIOSTheme() {
  console.log('Starting detailed iOS Theme Analysis...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  });

  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Detailed iOS theme analysis
    const iosThemeAnalysis = await page.evaluate(() => {
      const analysis = {
        iosCharacteristics: {
          hasIOSBlue: false,
          hasRoundedCorners: false,
          hasCleanBackground: false,
          hasSFProFont: false,
          hasProperSpacing: false,
          hasStickyHeader: false,
          hasIOSShadows: false
        },
        detailedFindings: {}
      };

      // Check for iOS blue (#007AFF)
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.backgroundColor === 'rgb(0, 122, 255)' || 
            styles.color === 'rgb(0, 122, 255)' ||
            styles.borderColor === 'rgb(0, 122, 255)') {
          analysis.iosCharacteristics.hasIOSBlue = true;
        }
      });

      // Check body background
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      analysis.detailedFindings.bodyBackground = bodyBg;
      if (bodyBg === 'rgb(255, 255, 255)' || bodyBg === 'rgba(255, 255, 255, 1)') {
        analysis.iosCharacteristics.hasCleanBackground = true;
      }

      // Check for rounded corners
      const cards = document.querySelectorAll('[class*="card"], [class*="Card"], button, input, select, textarea');
      let hasRounded = false;
      cards.forEach(card => {
        const borderRadius = window.getComputedStyle(card).borderRadius;
        if (borderRadius && borderRadius !== '0px') {
          hasRounded = true;
          analysis.detailedFindings.sampleBorderRadius = borderRadius;
        }
      });
      analysis.iosCharacteristics.hasRoundedCorners = hasRounded;

      // Check fonts
      const bodyFont = window.getComputedStyle(document.body).fontFamily;
      analysis.detailedFindings.bodyFont = bodyFont;
      if (bodyFont.includes('SF Pro') || bodyFont.includes('-apple-system') || bodyFont.includes('BlinkMacSystemFont')) {
        analysis.iosCharacteristics.hasSFProFont = true;
      }

      // Check for sticky elements
      const stickyElements = document.querySelectorAll('[style*="sticky"], [style*="fixed"]');
      const computedSticky = Array.from(allElements).filter(el => {
        const position = window.getComputedStyle(el).position;
        return position === 'sticky' || position === 'fixed';
      });
      analysis.iosCharacteristics.hasStickyHeader = stickyElements.length > 0 || computedSticky.length > 0;
      analysis.detailedFindings.stickyElementCount = computedSticky.length;

      // Check shadows
      let hasShadows = false;
      allElements.forEach(el => {
        const shadow = window.getComputedStyle(el).boxShadow;
        if (shadow && shadow !== 'none') {
          hasShadows = true;
          if (!analysis.detailedFindings.sampleShadow) {
            analysis.detailedFindings.sampleShadow = shadow;
          }
        }
      });
      analysis.iosCharacteristics.hasIOSShadows = hasShadows;

      // Check spacing
      const containers = document.querySelectorAll('div, section, main, header');
      let goodSpacing = false;
      containers.forEach(container => {
        const padding = window.getComputedStyle(container).padding;
        const margin = window.getComputedStyle(container).margin;
        if ((padding && padding !== '0px') || (margin && margin !== '0px')) {
          goodSpacing = true;
        }
      });
      analysis.iosCharacteristics.hasProperSpacing = goodSpacing;

      // Get all unique colors used
      const colors = new Set();
      allElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          colors.add(styles.backgroundColor);
        }
        if (styles.color) {
          colors.add(styles.color);
        }
      });
      analysis.detailedFindings.uniqueColors = Array.from(colors).slice(0, 10);

      // Count total iOS characteristics met
      analysis.iosScore = Object.values(analysis.iosCharacteristics).filter(v => v === true).length;
      analysis.totalCharacteristics = Object.keys(analysis.iosCharacteristics).length;

      return analysis;
    });

    console.log('\n=== iOS Theme Analysis Results ===\n');
    console.log('iOS Characteristics Found:', iosThemeAnalysis.iosScore, '/', iosThemeAnalysis.totalCharacteristics);
    console.log('\nDetailed Findings:');
    console.log(JSON.stringify(iosThemeAnalysis, null, 2));

    // Test calendar functionality
    console.log('\n=== Testing Calendar Functionality ===\n');
    
    // Check if calendar exists
    const calendarExists = await page.evaluate(() => {
      const calendar = document.querySelector('[class*="calendar"], [class*="Calendar"], table');
      return calendar !== null;
    });
    console.log('Calendar found:', calendarExists);

    // Test scrolling behavior
    await page.evaluate(() => window.scrollTo(0, 500));
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const scrollPosition = await page.evaluate(() => window.scrollY);
    console.log('Scroll position after scrolling:', scrollPosition);

    // Final verdict
    const iosScore = iosThemeAnalysis.iosScore;
    const maxScore = iosThemeAnalysis.totalCharacteristics;
    const percentage = (iosScore / maxScore) * 100;

    console.log('\n=== FINAL ASSESSMENT ===\n');
    console.log(`iOS Theme Implementation Score: ${iosScore}/${maxScore} (${percentage.toFixed(1)}%)`);
    
    if (percentage >= 80) {
      console.log('VERDICT: PASS - Excellent iOS theme implementation');
    } else if (percentage >= 60) {
      console.log('VERDICT: PARTIAL PASS - Good iOS theme implementation with room for improvement');
    } else if (percentage >= 40) {
      console.log('VERDICT: NEEDS WORK - Some iOS elements present but significant improvements needed');
    } else {
      console.log('VERDICT: FAIL - iOS theme not properly implemented');
    }

  } catch (error) {
    console.error('Error during analysis:', error);
  } finally {
    await browser.close();
  }
}

// Run the analysis
analyzeIOSTheme().catch(console.error);