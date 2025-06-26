const puppeteer = require('puppeteer');

async function testIOSTheme() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    console.log('Loading application...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle2', timeout: 10000 });

    // Wait for content to load
    await page.waitForSelector('.ios-card', { timeout: 5000 });

    // Check for iOS theme elements
    console.log('Checking for iOS theme elements...');

    // Test 1: Check if iOS colors are applied
    const bodyBgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log('Body background color:', bodyBgColor);

    // Test 2: Check if iOS cards are visible
    const cardElements = await page.$$('.ios-card');
    console.log('Number of iOS cards found:', cardElements.length);

    // Test 3: Check if iOS buttons are styled
    const iosButtons = await page.$$('.ios-button');
    console.log('Number of iOS buttons found:', iosButtons.length);

    // Test 4: Check if form inputs have iOS styling
    const iosInputs = await page.$$('.ios-input');
    console.log('Number of iOS inputs found:', iosInputs.length);

    // Test 5: Check computed styles of key elements
    const sitRepSection = await page.$('h2');
    if (sitRepSection) {
      const styles = await page.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          fontFamily: computed.fontFamily
        };
      }, sitRepSection);
      console.log('SIT REP header styles:', styles);
    }

    // Take screenshots
    console.log('Taking screenshots...');
    await page.screenshot({ 
      path: 'ios-theme-verification-full.png',
      fullPage: true
    });

    await page.screenshot({ 
      path: 'ios-theme-verification-viewport.png'
    });

    // Test iOS-specific styling
    const hasIOSTheme = await page.evaluate(() => {
      // Check if CSS variables are defined
      const style = getComputedStyle(document.documentElement);
      const iosBlue = style.getPropertyValue('--color-ios-blue');
      const iosBgSecondary = style.getPropertyValue('--color-ios-bg-secondary');
      
      return {
        hasIOSBlue: !!iosBlue.trim(),
        hasBgSecondary: !!iosBgSecondary.trim(),
        iosBlueValue: iosBlue.trim(),
        bgSecondaryValue: iosBgSecondary.trim()
      };
    });

    console.log('iOS theme variables check:', hasIOSTheme);

    // Verify visual elements
    const visualCheck = await page.evaluate(() => {
      const cards = document.querySelectorAll('.ios-card');
      const buttons = document.querySelectorAll('.ios-button');
      const inputs = document.querySelectorAll('.ios-input');

      let results = {
        cardsWithWhiteBackground: 0,
        buttonsWithBlueBackground: 0,
        inputsWithBorders: 0
      };

      cards.forEach(card => {
        const bg = window.getComputedStyle(card).backgroundColor;
        if (bg.includes('255, 255, 255') || bg.includes('white')) {
          results.cardsWithWhiteBackground++;
        }
      });

      buttons.forEach(button => {
        const bg = window.getComputedStyle(button).backgroundColor;
        if (bg.includes('0, 122, 255') || bg.includes('blue')) {
          results.buttonsWithBlueBackground++;
        }
      });

      inputs.forEach(input => {
        const border = window.getComputedStyle(input).borderColor;
        if (border && border !== 'rgba(0, 0, 0, 0)') {
          results.inputsWithBorders++;
        }
      });

      return results;
    });

    console.log('Visual verification:', visualCheck);

    // Final assessment
    const themeWorking = 
      hasIOSTheme.hasIOSBlue && 
      hasIOSTheme.hasBgSecondary && 
      cardElements.length > 0 && 
      iosButtons.length > 0 && 
      iosInputs.length > 0;

    console.log('\n=== iOS THEME VERIFICATION REPORT ===');
    console.log(`✅ iOS CSS Variables: ${hasIOSTheme.hasIOSBlue && hasIOSTheme.hasBgSecondary ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ iOS Cards: ${cardElements.length > 0 ? 'FOUND' : 'NOT FOUND'} (${cardElements.length})`);
    console.log(`✅ iOS Buttons: ${iosButtons.length > 0 ? 'FOUND' : 'NOT FOUND'} (${iosButtons.length})`);
    console.log(`✅ iOS Inputs: ${iosInputs.length > 0 ? 'FOUND' : 'NOT FOUND'} (${iosInputs.length})`);
    console.log(`✅ Body Background: ${bodyBgColor}`);
    console.log(`\n🎯 OVERALL RESULT: ${themeWorking ? '✅ THEME IS WORKING' : '❌ THEME FAILED'}`);

    return themeWorking;

  } catch (error) {
    console.error('Error during testing:', error);
    return false;
  } finally {
    await browser.close();
  }
}

testIOSTheme().then(success => {
  console.log('\nTest completed. Success:', success);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});