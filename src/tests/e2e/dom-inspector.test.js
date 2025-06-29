/**
 * DOM Inspector Test - Debug what elements are actually present
 */

import puppeteer from 'puppeteer';
import { beforeAll, afterAll, describe, test } from 'vitest';

describe('DOM Inspector', () => {
  let browser;
  let page;
  const baseURL = 'http://localhost:4173';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
  });

  afterAll(async () => {
    await browser?.close();
  });

  test('should inspect DOM structure', async () => {
    await page.goto(baseURL, { waitUntil: 'networkidle0' });
    
    // Get page title
    const title = await page.title();
    console.log('📄 Page Title:', title);
    
    // Get all elements with data-testid
    const testIds = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-testid]');
      return Array.from(elements).map(el => ({
        testId: el.getAttribute('data-testid'),
        tagName: el.tagName,
        className: el.className
      }));
    });
    
    console.log('🧪 Found test IDs:', testIds);
    
    // Get all divs with classes that might be the dashboard
    const mainDivs = await page.evaluate(() => {
      const divs = document.querySelectorAll('div[class*="min-h-screen"], div[class*="dashboard"], #root > div');
      return Array.from(divs).map(el => ({
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        testId: el.getAttribute('data-testid'),
        hasChildren: el.children.length > 0
      }));
    });
    
    console.log('📊 Main divs found:', mainDivs);
    
    // Check if React has rendered
    const reactRoot = await page.$('#root');
    const hasReactContent = await reactRoot?.evaluate(el => el.children.length > 0);
    
    console.log('⚛️ React root has content:', hasReactContent);
    
    // Take a screenshot for visual debugging
    await page.screenshot({ 
      path: '/home/andrew/projects/active/Seascape-op/yacht-charter-dashboard/debug-screenshot.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved to debug-screenshot.png');
  });
});