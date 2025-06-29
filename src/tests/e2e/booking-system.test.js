/**
 * End-to-End Testing Suite for Yacht Charter Booking System
 * Uses Puppeteer for browser automation and verification
 */

import puppeteer from 'puppeteer';
import { beforeAll, afterAll, describe, test, expect } from 'vitest';

describe('Yacht Charter Booking System E2E Tests', () => {
  let browser;
  let page;
  const baseURL = 'http://localhost:4173';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      slowMo: 100, // Slow down by 100ms for visibility
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
  });

  afterAll(async () => {
    await browser?.close();
  });

  describe('Basic Application Loading', () => {
    test('should load the dashboard successfully', async () => {
      await page.goto(baseURL);
      await page.waitForSelector('[data-testid="main-dashboard"]', { timeout: 10000 });
      
      const title = await page.title();
      expect(title).toContain('Yacht Charter Dashboard');
      
      // Verify main components are present
      const sidebar = await page.$('[data-testid="sidebar"]');
      const calendar = await page.$('[data-testid="yacht-calendar"]');
      const bookingForm = await page.$('[data-testid="booking-form"]');
      
      expect(sidebar).toBeTruthy();
      expect(calendar).toBeTruthy();
      expect(bookingForm).toBeTruthy();
    });

    test('should display yacht timeline calendar', async () => {
      await page.goto(baseURL);
      await page.waitForSelector('[data-testid="yacht-calendar"]');
      
      // Verify calendar structure
      const calendarHeader = await page.$('[data-testid="calendar-header"]');
      const yachtHeaders = await page.$('[data-testid="yacht-headers"]');
      const bookingCells = await page.$$('[data-testid="booking-cell"]');
      
      expect(calendarHeader).toBeTruthy();
      expect(yachtHeaders).toBeTruthy();
      expect(bookingCells.length).toBeGreaterThan(0);
    });
  });

  describe('Booking Form Functionality', () => {
    test('should validate required booking form fields', async () => {
      await page.goto(baseURL);
      await page.waitForSelector('[data-testid="booking-form"]');
      
      // Try to submit empty form
      const submitButton = await page.$('[data-testid="submit-booking"]');
      await submitButton.click();
      
      // Check for validation errors
      const firstNameError = await page.$('[data-testid="error-firstName"]');
      const surnameError = await page.$('[data-testid="error-surname"]');
      const emailError = await page.$('[data-testid="error-email"]');
      
      expect(firstNameError).toBeTruthy();
      expect(surnameError).toBeTruthy();
      expect(emailError).toBeTruthy();
    });

    test('should accept valid booking form data', async () => {
      await page.goto(baseURL);
      await page.waitForSelector('[data-testid="booking-form"]');
      
      // Fill in valid form data
      await page.type('[data-testid="input-firstName"]', 'John');
      await page.type('[data-testid="input-surname"]', 'Smith');
      await page.type('[data-testid="input-email"]', 'john.smith@email.com');
      await page.type('[data-testid="input-phone"]', '+44 7700 123456');
      
      // Select yacht
      await page.select('[data-testid="select-yacht"]', 'spectre');
      
      // Set dates
      await page.type('[data-testid="input-startDate"]', '2025-07-15');
      await page.type('[data-testid="input-endDate"]', '2025-07-17');
      
      // Submit form
      const submitButton = await page.$('[data-testid="submit-booking"]');
      await submitButton.click();
      
      // Wait for success message or booking creation
      await page.waitForSelector('[data-testid="booking-success"]', { timeout: 5000 });
      
      const successMessage = await page.$('[data-testid="booking-success"]');
      expect(successMessage).toBeTruthy();
    });

    test('should validate email format', async () => {
      await page.goto(baseURL);
      await page.waitForSelector('[data-testid="booking-form"]');
      
      // Fill in invalid email
      await page.type('[data-testid="input-email"]', 'invalid-email');
      await page.click('[data-testid="input-firstName"]'); // Trigger blur
      
      const emailError = await page.$('[data-testid="error-email"]');
      const errorText = await emailError?.evaluate(el => el.textContent);
      
      expect(errorText).toContain('valid email');
    });
  });

  describe('Calendar Interaction', () => {
    test('should open booking modal when clicking empty calendar cell', async () => {
      await page.goto(baseURL);
      await page.waitForSelector('[data-testid="yacht-calendar"]');
      
      // Find and click an empty calendar cell
      const emptyCells = await page.$$('[data-testid="booking-cell"]:not([data-booking-id])');
      if (emptyCells.length > 0) {
        await emptyCells[0].click();
        
        // Wait for modal to appear
        await page.waitForSelector('[data-testid="booking-modal"]', { timeout: 3000 });
        
        const modal = await page.$('[data-testid="booking-modal"]');
        expect(modal).toBeTruthy();
      }
    });

    test('should display booking details when clicking occupied cell', async () => {
      await page.goto(baseURL);
      await page.waitForSelector('[data-testid="yacht-calendar"]');
      
      // Find and click a cell with booking
      const occupiedCells = await page.$$('[data-testid="booking-cell"][data-booking-id]');
      if (occupiedCells.length > 0) {
        await occupiedCells[0].click();
        
        // Should show booking details or edit modal
        const bookingDetails = await page.$('[data-testid="booking-details"]');
        const editModal = await page.$('[data-testid="edit-booking-modal"]');
        
        expect(bookingDetails || editModal).toBeTruthy();
      }
    });
  });

  describe('Navigation and Layout', () => {
    test('should toggle sidebar expand/collapse', async () => {
      await page.goto(baseURL);
      await page.waitForSelector('[data-testid="sidebar"]');
      
      const sidebar = await page.$('[data-testid="sidebar"]');
      const initialWidth = await sidebar.evaluate(el => el.offsetWidth);
      
      // Click toggle button
      const toggleButton = await page.$('[data-testid="sidebar-toggle"]');
      await toggleButton.click();
      
      // Wait for animation
      await page.waitForTimeout(500);
      
      const newWidth = await sidebar.evaluate(el => el.offsetWidth);
      expect(newWidth).not.toBe(initialWidth);
    });

    test('should maintain fixed header during scroll', async () => {
      await page.goto(baseURL);
      await page.waitForSelector('[data-testid="main-header"]');
      
      const header = await page.$('[data-testid="main-header"]');
      const initialPosition = await header.evaluate(el => ({
        top: el.getBoundingClientRect().top,
        position: getComputedStyle(el).position
      }));
      
      // Scroll down
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(100);
      
      const scrolledPosition = await header.evaluate(el => ({
        top: el.getBoundingClientRect().top,
        position: getComputedStyle(el).position
      }));
      
      expect(scrolledPosition.position).toBe('fixed');
      expect(scrolledPosition.top).toBe(initialPosition.top);
    });
  });
});

/**
 * Utility Functions for Test Verification
 */
export class BookingTestVerifier {
  constructor(page) {
    this.page = page;
  }

  async verifyBookingFormComplete() {
    const requiredFields = [
      'input-firstName', 'input-surname', 'input-email', 
      'input-phone', 'select-yacht', 'input-startDate', 'input-endDate'
    ];
    
    for (const field of requiredFields) {
      const element = await this.page.$(`[data-testid="${field}"]`);
      const value = await element?.evaluate(el => el.value);
      if (!value || value.trim() === '') {
        throw new Error(`Required field ${field} is empty`);
      }
    }
    return true;
  }

  async verifyCalendarStructure() {
    const expectedElements = [
      'calendar-header', 'yacht-headers', 'date-column', 'booking-cell'
    ];
    
    for (const element of expectedElements) {
      const found = await this.page.$(`[data-testid="${element}"]`);
      if (!found) {
        throw new Error(`Calendar element ${element} not found`);
      }
    }
    return true;
  }

  async verifyNoOverlappingBookings() {
    const bookingCells = await this.page.$$('[data-testid="booking-cell"][data-booking-id]');
    const bookingPositions = [];
    
    for (const cell of bookingCells) {
      const position = await cell.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return {
          yacht: el.dataset.yachtId,
          date: el.dataset.date,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom
        };
      });
      bookingPositions.push(position);
    }
    
    // Check for overlaps in same yacht on same date
    for (let i = 0; i < bookingPositions.length; i++) {
      for (let j = i + 1; j < bookingPositions.length; j++) {
        const a = bookingPositions[i];
        const b = bookingPositions[j];
        
        if (a.yacht === b.yacht && a.date === b.date) {
          const overlap = !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
          if (overlap) {
            throw new Error(`Overlapping bookings detected for ${a.yacht} on ${a.date}`);
          }
        }
      }
    }
    return true;
  }
}