/**
 * Simple console error checker for SIT REP widget
 */
const puppeteer = require('puppeteer');

async function checkConsole() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const logs = [];
  const errors = [];
  
  page.on('console', msg => {
    logs.push({ type: msg.type(), text: msg.text() });
  });
  
  page.on('pageerror', error => {
    errors.push({ message: error.message, stack: error.stack });
  });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for any async operations
    
    console.log('=== CONSOLE LOGS ===');
    logs.forEach(log => {
      console.log(`[${log.type.toUpperCase()}] ${log.text}`);
    });
    
    console.log('\n=== PAGE ERRORS ===');
    if (errors.length === 0) {
      console.log('No page errors found!');
    } else {
      errors.forEach(error => {
        console.log(`ERROR: ${error.message}`);
      });
    }
    
  } catch (error) {
    console.error('Failed to check console:', error);
  } finally {
    await browser.close();
  }
}

checkConsole();