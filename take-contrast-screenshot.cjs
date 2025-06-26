const puppeteer = require('puppeteer');

async function takeContrastScreenshot() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    console.log('Loading application with improved contrast...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle2', timeout: 10000 });

    // Wait for content to load
    await page.waitForSelector('.ios-card', { timeout: 5000 });
    
    console.log('Taking contrast improvement screenshot...');
    await page.screenshot({ 
      path: 'improved-contrast-screenshot.png'
    });

    // Check background colors
    const backgroundCheck = await page.evaluate(() => {
      const body = document.body;
      const cards = document.querySelectorAll('.ios-card');
      const inputs = document.querySelectorAll('.ios-input');
      
      return {
        bodyBg: window.getComputedStyle(body).backgroundColor,
        cardCount: cards.length,
        firstCardBg: cards[0] ? window.getComputedStyle(cards[0]).backgroundColor : 'none',
        inputCount: inputs.length,
        firstInputBg: inputs[0] ? window.getComputedStyle(inputs[0]).backgroundColor : 'none'
      };
    });

    console.log('Background color analysis:');
    console.log(`Body background: ${backgroundCheck.bodyBg}`);
    console.log(`Card background: ${backgroundCheck.firstCardBg}`);
    console.log(`Input background: ${backgroundCheck.firstInputBg}`);
    console.log(`Cards found: ${backgroundCheck.cardCount}`);
    console.log(`Inputs found: ${backgroundCheck.inputCount}`);

    console.log('Screenshot saved as improved-contrast-screenshot.png');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

takeContrastScreenshot();