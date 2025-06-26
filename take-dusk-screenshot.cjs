const puppeteer = require('puppeteer');

async function takeDuskScreenshot() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    console.log('Loading application with dusk theme...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle2', timeout: 10000 });

    // Wait for content to load
    await page.waitForSelector('.ios-card', { timeout: 5000 });
    
    console.log('Taking dusk theme screenshot...');
    await page.screenshot({ 
      path: 'dusk-theme-screenshot.png'
    });

    // Check dusk theme colors
    const duskThemeCheck = await page.evaluate(() => {
      const body = document.body;
      const cards = document.querySelectorAll('.ios-card');
      const nav = document.querySelector('nav');
      
      return {
        bodyBg: window.getComputedStyle(body).backgroundColor,
        bodyBgImage: window.getComputedStyle(body).backgroundImage,
        cardCount: cards.length,
        firstCardBg: cards[0] ? window.getComputedStyle(cards[0]).backgroundColor : 'none',
        firstCardBgImage: cards[0] ? window.getComputedStyle(cards[0]).backgroundImage : 'none',
        navBg: nav ? window.getComputedStyle(nav).background : 'none',
        textColor: cards[0] ? window.getComputedStyle(cards[0]).color : 'none'
      };
    });

    console.log('Dusk theme analysis:');
    console.log(`Body background: ${duskThemeCheck.bodyBg}`);
    console.log(`Body background image: ${duskThemeCheck.bodyBgImage}`);
    console.log(`Card background: ${duskThemeCheck.firstCardBg}`);
    console.log(`Card background image: ${duskThemeCheck.firstCardBgImage}`);
    console.log(`Navigation background: ${duskThemeCheck.navBg}`);
    console.log(`Text color: ${duskThemeCheck.textColor}`);
    console.log(`Cards found: ${duskThemeCheck.cardCount}`);

    // Check if it's actually dark/dusk theme
    const isDuskTheme = duskThemeCheck.bodyBg.includes('28, 28, 30') || 
                       duskThemeCheck.bodyBg.includes('44, 44, 46') ||
                       duskThemeCheck.bodyBgImage.includes('gradient');

    console.log(`\n🌆 DUSK THEME STATUS: ${isDuskTheme ? '✅ APPLIED' : '❌ NOT APPLIED'}`);

    console.log('Screenshot saved as dusk-theme-screenshot.png');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

takeDuskScreenshot();