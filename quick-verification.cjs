#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function quickVerification() {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    console.log('🔍 Testing application access...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });
    
    console.log('✅ Application loaded successfully');
    
    // Check for critical errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));
    
    // Look for main components
    const form = await page.$('[data-testid="booking-form"]') || await page.$('form');
    const calendar = await page.$('.calendar') || await page.$('[data-testid="calendar"]');
    
    console.log(`📝 Booking form found: ${!!form}`);
    console.log(`📅 Calendar found: ${!!calendar}`);
    console.log(`❌ Console errors: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('🔍 Recent errors:');
      consoleErrors.slice(0, 3).forEach(error => console.log(`  - ${error}`));
    }
    
    // Check for UnifiedDataService error specifically
    const hasUnifiedServiceError = consoleErrors.some(error => 
      error.includes('UnifiedDataService') || error.includes('getInstance')
    );
    
    console.log(`🔧 UnifiedDataService error: ${hasUnifiedServiceError ? 'PRESENT' : 'NOT FOUND'}`);
    
    await page.screenshot({ path: 'quick-verification-screenshot.png' });
    console.log('📸 Screenshot saved as quick-verification-screenshot.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) await browser.close();
  }
}

quickVerification();