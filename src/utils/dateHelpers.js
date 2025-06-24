/**
 * Date Helper Functions
 * 
 * Purpose: Utility functions for date manipulation in yacht charter calendar
 * 
 * Design Decisions:
 * - Uses date-fns for consistent date operations
 * - All functions handle edge cases like month boundaries
 * - Week starts on Monday (European convention for yacht charters)
 * 
 * Dependencies:
 * - date-fns (addDays, format, isSameDay, startOfWeek)
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

import { addDays, format, isSameDay, startOfWeek } from 'date-fns'

/**
 * Generate an array of consecutive dates starting from a given date
 * 
 * @param {Date} startDate - The starting date
 * @param {number} numberOfDays - Number of days to generate
 * @returns {Date[]} Array of Date objects
 * 
 * @example
 * // Generate 7 days starting from today
 * const dates = generateDateRange(new Date(), 7);
 * 
 * Implementation Notes:
 * - Handles month/year boundaries correctly
 * - Returns new Date objects, doesn't modify input
 */
export function generateDateRange(startDate, numberOfDays) {
  const dates = []
  
  for (let i = 0; i < numberOfDays; i++) {
    dates.push(addDays(startDate, i))
  }
  
  return dates
}

/**
 * Format a date for display in the calendar
 * 
 * @param {Date} date - Date to format
 * @param {string} formatString - Format string (defaults to 'EEE dd/MM/yy')
 * @returns {string} Formatted date string
 * 
 * @example
 * // Format for calendar header
 * const display = formatDate(new Date(), 'EEE dd/MM/yy'); // "Mon 22/06/25"
 * 
 * Implementation Notes:
 * - Uses date-fns format function for consistency
 * - Default format matches yacht charter industry standards
 */
export function formatDate(date, formatString = 'EEE dd/MM/yy') {
  return format(date, formatString)
}

/**
 * Check if two dates represent the same day
 * 
 * @param {Date} date1 - First date to compare
 * @param {Date} date2 - Second date to compare
 * @returns {boolean} True if dates are the same day
 * 
 * @example
 * // Check if booking date matches calendar cell
 * const isMatch = isSameDay(bookingDate, cellDate);
 * 
 * Implementation Notes:
 * - Ignores time component, only compares date
 * - Handles timezone differences correctly
 */
export function isSameDayHelper(date1, date2) {
  return isSameDay(date1, date2)
}

/**
 * Get the start of the week (Monday) for a given date
 * 
 * @param {Date} date - Input date
 * @returns {Date} Date representing Monday of that week
 * 
 * @example
 * // Get Monday of current week for calendar navigation
 * const weekStart = getWeekStart(new Date());
 * 
 * Implementation Notes:
 * - Uses Monday as week start (weekStartsOn: 1)
 * - Returns new Date object
 */
export function getWeekStart(date) {
  return startOfWeek(date, { weekStartsOn: 1 })
}