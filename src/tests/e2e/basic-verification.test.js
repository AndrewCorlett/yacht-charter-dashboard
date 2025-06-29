/**
 * Basic E2E Test for Puppeteer Framework Verification
 */

import puppeteer from 'puppeteer';
import { beforeAll, afterAll, describe, test, expect } from 'vitest';

describe('Puppeteer Framework Verification', () => {
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

  test('should connect to application and verify basic elements', async () => {
    try {
      await page.goto(baseURL, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Verify page loads
      const title = await page.title();
      expect(title).toBeTruthy();
      
      // Verify main dashboard is present
      await page.waitForSelector('[data-testid="main-dashboard"]', { timeout: 10000 });
      const dashboard = await page.$('[data-testid="main-dashboard"]');
      expect(dashboard).toBeTruthy();
      
      console.log('✅ Puppeteer framework verification successful');
      console.log(`✅ Page title: ${title}`);
      console.log('✅ Main dashboard element found');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      throw error;
    }
  });

  test('should verify calendar component exists', async () => {
    try {
      await page.goto(baseURL, { waitUntil: 'networkidle0' });
      
      // Look for calendar-related elements
      const calendarExists = await page.evaluate(() => {
        const elements = document.querySelectorAll('[class*="calendar"], [data-testid*="calendar"]');
        return elements.length > 0;
      });
      
      expect(calendarExists).toBe(true);
      console.log('✅ Calendar component verification successful');
      
    } catch (error) {
      console.error('❌ Calendar test failed:', error.message);
      throw error;
    }
  });

  test('should verify booking form exists', async () => {
    try {
      await page.goto(baseURL, { waitUntil: 'networkidle0' });
      
      // Look for form elements
      const formExists = await page.evaluate(() => {
        const forms = document.querySelectorAll('form, [class*="booking"], [data-testid*="booking"]');
        return forms.length > 0;
      });
      
      expect(formExists).toBe(true);
      console.log('✅ Booking form verification successful');
      
    } catch (error) {
      console.error('❌ Booking form test failed:', error.message);
      throw error;
    }
  });
});