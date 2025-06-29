/**
 * Charter Service - Type definitions and data fetching for SIT REP widget
 * 
 * Provides type-safe charter data access with mock implementation
 * for development and real async function for production.
 * 
 * @author AI Agent
 * @created 2025-06-26
 */

/**
 * Charter type definition (JSDoc for type safety in JS)
 * @typedef {Object} Charter
 * @property {string} id - Unique charter identifier
 * @property {string} yachtName - Name of the yacht
 * @property {string} startDate - Start date in ISO format
 * @property {string} endDate - End date in ISO format
 * @property {"active" | "upcoming"} status - Charter status
 * @property {string} calendarColor - Hex color or Tailwind color token
 */

import unifiedDataService from '../services/UnifiedDataService.js'
import { eventEmitter } from './eventEmitter.js'

// Re-export eventEmitter for backward compatibility
export { eventEmitter }

/**
 * Simulates network delay for realistic testing
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Fetches charter data from unified data service
 * All components (SIT REP, Calendar, Bookings) now use the same data source
 * 
 * @returns {Promise<Charter[]>} Array of charter objects
 */
export const fetchCharters = async () => {
  // Simulate network delay for realistic UX
  await delay(Math.random() * 1000 + 500) // 500-1500ms delay
  
  try {
    // Get data from unified service
    const charters = unifiedDataService.getAllCharters()
    return [...charters]
  } catch (error) {
    console.error('Error fetching charters:', error)
    throw error
  }
}


/**
 * Navigation helper function
 * Triggers navigation to booking management page
 * 
 * @param {string} charterId - Charter ID to navigate to
 */
export const navigateToBooking = (charterId) => {
  console.log(`Navigating to booking: ${charterId}`)
  
  // Dispatch custom event that MainDashboard is listening for
  const navigationEvent = new CustomEvent('navigateToBooking', {
    detail: {
      booking: { id: charterId }, // Minimal booking object for navigation
      section: 'bookings'
    }
  })
  
  window.dispatchEvent(navigationEvent)
}

/**
 * Utility function to categorize charters by status
 * @param {Charter[]} charters - Array of charters
 * @returns {{active: Charter[], upcoming: Charter[]}}
 */
export const categorizeCharters = (charters) => {
  const now = new Date()
  
  const active = charters.filter(charter => {
    const startDate = new Date(charter.startDate)
    const endDate = new Date(charter.endDate)
    return charter.status === 'active' || (startDate <= now && endDate >= now)
  })
  
  const upcoming = charters
    .filter(charter => {
      const startDate = new Date(charter.startDate)
      return charter.status === 'upcoming' || startDate > now
    })
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 10) // Limit to 10 upcoming charters
  
  return { active, upcoming }
}

/**
 * Format date range for display using Intl.DateTimeFormat
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string
 * @param {string} locale - Locale for formatting (defaults to user locale)
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate, locale = undefined) => {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
  
  const start = formatter.format(new Date(startDate))
  const end = formatter.format(new Date(endDate))
  
  return `${start} – ${end}`
}

export default {
  fetchCharters,
  eventEmitter,
  navigateToBooking,
  categorizeCharters,
  formatDateRange
}