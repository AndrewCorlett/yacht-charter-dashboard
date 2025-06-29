/**
 * Yacht Availability Service
 * 
 * Service for checking yacht availability, managing blackout periods,
 * and providing availability-based validation for bookings.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

import { BusinessRules } from '../models/validation/ValidationSchemas'

/**
 * Yacht availability status enumeration
 */
export const AvailabilityStatus = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  MAINTENANCE: 'maintenance',
  BLACKOUT: 'blackout',
  UNAVAILABLE: 'unavailable'
}

/**
 * Yacht availability service class
 */
export class YachtAvailabilityService {
  constructor() {
    // In a real implementation, this would connect to a database or API
    this.yachts = new Map([
      ['calico-moon', {
        id: 'calico-moon',
        name: 'Calico Moon',
        maxGuests: 10,
        minBookingHours: 6,
        maintenanceSchedule: [
          { start: '2025-01-15', end: '2025-01-17', reason: 'Engine maintenance' },
          { start: '2025-03-01', end: '2025-03-03', reason: 'Hull inspection' }
        ],
        seasonalRates: {
          peak: { start: '2025-06-01', end: '2025-08-31', multiplier: 1.5 },
          shoulder: { start: '2025-04-01', end: '2025-05-31', multiplier: 1.2 }
        }
      }],
      ['spectre', {
        id: 'spectre',
        name: 'Spectre',
        maxGuests: 12,
        minBookingHours: 4,
        maintenanceSchedule: [
          { start: '2025-02-10', end: '2025-02-12', reason: 'Safety inspection' }
        ],
        seasonalRates: {
          peak: { start: '2025-07-01', end: '2025-08-15', multiplier: 1.4 }
        }
      }],
      ['alrisha', {
        id: 'alrisha',
        name: 'Alrisha',
        maxGuests: 8,
        minBookingHours: 4,
        maintenanceSchedule: [],
        seasonalRates: {}
      }],
      ['disk-drive', {
        id: 'disk-drive',
        name: 'Disk Drive',
        maxGuests: 8,
        minBookingHours: 8,
        maintenanceSchedule: [
          { start: '2025-01-20', end: '2025-01-22', reason: 'Electronics upgrade' }
        ],
        seasonalRates: {
          peak: { start: '2025-06-15', end: '2025-09-15', multiplier: 1.6 }
        }
      }],
      ['zavaria', {
        id: 'zavaria',
        name: 'Zavaria',
        maxGuests: 6,
        minBookingHours: 4,
        maintenanceSchedule: [],
        seasonalRates: {}
      }],
      ['mridula-sarwar', {
        id: 'mridula-sarwar',
        name: 'Mridula Sarwar',
        maxGuests: 10,
        minBookingHours: 6,
        maintenanceSchedule: [
          { start: '2025-04-15', end: '2025-04-17', reason: 'Annual service' }
        ],
        seasonalRates: {
          peak: { start: '2025-05-01', end: '2025-09-30', multiplier: 1.3 }
        }
      }]
    ])

    this.bookings = new Map() // Would be populated from database
  }

  /**
   * Get yacht specifications
   * @param {string} yachtId - Yacht ID
   * @returns {Object|null} Yacht specifications
   */
  getYachtSpecs(yachtId) {
    return this.yachts.get(yachtId) || null
  }

  /**
   * Get all available yachts
   * @returns {Array} Array of yacht specifications
   */
  getAllYachts() {
    return Array.from(this.yachts.values())
  }

  /**
   * Check yacht availability for a specific date range
   * @param {string} yachtId - Yacht ID
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @param {string} [excludeBookingId] - Booking ID to exclude from check
   * @returns {Object} Availability result
   */
  checkAvailability(yachtId, startDate, endDate, excludeBookingId = null) {
    const yacht = this.yachts.get(yachtId)
    if (!yacht) {
      return {
        isAvailable: false,
        status: AvailabilityStatus.UNAVAILABLE,
        reason: 'Yacht not found',
        conflicts: []
      }
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const conflicts = []

    // Check maintenance schedule
    const maintenanceConflicts = this.checkMaintenanceConflicts(yacht, start, end)
    conflicts.push(...maintenanceConflicts)

    // Check blackout periods
    const blackoutConflicts = this.checkBlackoutConflicts(start, end)
    conflicts.push(...blackoutConflicts)

    // Check existing bookings
    const bookingConflicts = this.checkBookingConflicts(yachtId, start, end, excludeBookingId)
    conflicts.push(...bookingConflicts)

    // Determine overall availability
    const isAvailable = conflicts.length === 0
    const status = this.determineAvailabilityStatus(conflicts)

    return {
      isAvailable,
      status,
      conflicts,
      yacht,
      reason: conflicts.length > 0 ? this.generateConflictReason(conflicts) : null
    }
  }

  /**
   * Check maintenance schedule conflicts
   * @param {Object} yacht - Yacht specifications
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Array of maintenance conflicts
   */
  checkMaintenanceConflicts(yacht, startDate, endDate) {
    return yacht.maintenanceSchedule
      .filter(maintenance => {
        const maintenanceStart = new Date(maintenance.start)
        const maintenanceEnd = new Date(maintenance.end)
        return startDate < maintenanceEnd && endDate > maintenanceStart
      })
      .map(maintenance => ({
        type: 'maintenance',
        status: AvailabilityStatus.MAINTENANCE,
        start: maintenance.start,
        end: maintenance.end,
        reason: maintenance.reason,
        severity: 'high',
        canOverride: false
      }))
  }

  /**
   * Check blackout period conflicts
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Array of blackout conflicts
   */
  checkBlackoutConflicts(startDate, endDate) {
    return BusinessRules.BLACKOUT_PERIODS
      .filter(blackout => {
        const blackoutStart = new Date(blackout.start)
        const blackoutEnd = new Date(blackout.end)
        return startDate < blackoutEnd && endDate > blackoutStart
      })
      .map(blackout => ({
        type: 'blackout',
        status: AvailabilityStatus.BLACKOUT,
        start: blackout.start,
        end: blackout.end,
        reason: blackout.reason,
        severity: 'high',
        canOverride: false
      }))
  }

  /**
   * Check existing booking conflicts
   * @param {string} yachtId - Yacht ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} excludeBookingId - Booking ID to exclude
   * @returns {Array} Array of booking conflicts
   */
  checkBookingConflicts(yachtId, startDate, endDate, excludeBookingId) {
    // In a real implementation, this would query the database
    const yachtBookings = Array.from(this.bookings.values())
      .filter(booking => 
        booking.yacht_id === yachtId && 
        booking.id !== excludeBookingId &&
        booking.status !== 'cancelled'
      )

    return yachtBookings
      .filter(booking => {
        const bookingStart = new Date(booking.start_datetime)
        const bookingEnd = new Date(booking.end_datetime)
        return startDate < bookingEnd && endDate > bookingStart
      })
      .map(booking => ({
        type: 'booking',
        status: AvailabilityStatus.BOOKED,
        start: booking.start_datetime,
        end: booking.end_datetime,
        reason: `Existing booking: ${booking.customer_name}`,
        bookingId: booking.id,
        severity: 'high',
        canOverride: false
      }))
  }

  /**
   * Determine overall availability status from conflicts
   * @param {Array} conflicts - Array of conflicts
   * @returns {string} Availability status
   */
  determineAvailabilityStatus(conflicts) {
    if (conflicts.length === 0) {
      return AvailabilityStatus.AVAILABLE
    }

    // Prioritize status based on conflict types
    if (conflicts.some(c => c.type === 'maintenance')) {
      return AvailabilityStatus.MAINTENANCE
    }

    if (conflicts.some(c => c.type === 'blackout')) {
      return AvailabilityStatus.BLACKOUT
    }

    if (conflicts.some(c => c.type === 'booking')) {
      return AvailabilityStatus.BOOKED
    }

    return AvailabilityStatus.UNAVAILABLE
  }

  /**
   * Generate human-readable conflict reason
   * @param {Array} conflicts - Array of conflicts
   * @returns {string} Conflict reason
   */
  generateConflictReason(conflicts) {
    if (conflicts.length === 1) {
      return conflicts[0].reason
    }

    const reasons = conflicts.map(c => c.reason)
    return `Multiple conflicts: ${reasons.join(', ')}`
  }

  /**
   * Find alternative available yachts for given criteria
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @param {number} guestCount - Number of guests
   * @param {Array} [excludeYachts] - Yacht IDs to exclude
   * @returns {Array} Array of available yacht alternatives
   */
  findAvailableAlternatives(startDate, endDate, guestCount, excludeYachts = []) {
    const alternatives = []

    for (const yacht of this.yachts.values()) {
      if (excludeYachts.includes(yacht.id)) {
        continue
      }

      // Check capacity
      if (yacht.maxGuests < guestCount) {
        continue
      }

      // Check availability
      const availability = this.checkAvailability(yacht.id, startDate, endDate)
      if (availability.isAvailable) {
        alternatives.push({
          yacht,
          availability,
          suitabilityScore: this.calculateSuitabilityScore(yacht, guestCount)
        })
      }
    }

    // Sort by suitability score (higher is better)
    return alternatives.sort((a, b) => b.suitabilityScore - a.suitabilityScore)
  }

  /**
   * Calculate yacht suitability score for given criteria
   * @param {Object} yacht - Yacht specifications
   * @param {number} guestCount - Number of guests
   * @returns {number} Suitability score (0-100)
   */
  calculateSuitabilityScore(yacht, guestCount) {
    let score = 50 // Base score

    // Capacity utilization (prefer yachts closer to full capacity)
    const utilizationRatio = guestCount / yacht.maxGuests
    if (utilizationRatio >= 0.7 && utilizationRatio <= 1.0) {
      score += 30 // Optimal utilization
    } else if (utilizationRatio >= 0.5) {
      score += 20 // Good utilization
    } else {
      score += 10 // Under-utilized
    }

    // Yacht size preference (larger yachts score higher for larger groups)
    if (yacht.maxGuests >= 10) {
      score += 10
    } else if (yacht.maxGuests >= 8) {
      score += 5
    }

    // Minimum booking hours (lower requirements score higher)
    if (yacht.minBookingHours <= 4) {
      score += 10
    } else if (yacht.minBookingHours <= 6) {
      score += 5
    }

    return Math.min(100, score)
  }

  /**
   * Get availability calendar for a yacht
   * @param {string} yachtId - Yacht ID
   * @param {Date|string} startDate - Calendar start date
   * @param {Date|string} endDate - Calendar end date
   * @returns {Array} Array of daily availability status
   */
  getAvailabilityCalendar(yachtId, startDate, endDate) {
    const calendar = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayStart = new Date(date)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const availability = this.checkAvailability(yachtId, dayStart, dayEnd)
      
      calendar.push({
        date: new Date(date),
        status: availability.status,
        isAvailable: availability.isAvailable,
        conflicts: availability.conflicts,
        reason: availability.reason
      })
    }

    return calendar
  }

  /**
   * Validate booking against yacht availability and business rules
   * @param {Object} bookingData - Booking data to validate
   * @returns {Object} Comprehensive validation result
   */
  validateBookingAvailability(bookingData) {
    const {
      yacht_id,
      start_datetime,
      end_datetime,
      guest_count,
      id: bookingId
    } = bookingData

    const errors = {}
    const warnings = []
    const suggestions = []

    // Check yacht exists
    const yacht = this.getYachtSpecs(yacht_id)
    if (!yacht) {
      errors.yacht_id = 'Selected yacht is not available'
      return { isValid: false, errors, warnings, suggestions }
    }

    // Check availability
    const availability = this.checkAvailability(
      yacht_id, 
      start_datetime, 
      end_datetime, 
      bookingId
    )

    if (!availability.isAvailable) {
      errors.start_datetime = `Yacht is not available: ${availability.reason}`
      
      // Suggest alternatives
      const alternatives = this.findAvailableAlternatives(
        start_datetime, 
        end_datetime, 
        guest_count || 1,
        [yacht_id]
      )

      if (alternatives.length > 0) {
        suggestions.push({
          type: 'yacht_alternative',
          message: `Consider ${alternatives[0].yacht.name} instead`,
          yacht: alternatives[0].yacht,
          action: 'change_yacht'
        })
      }
    }

    // Check capacity
    if (guest_count > yacht.maxGuests) {
      errors.guest_count = `Guest count exceeds yacht capacity (max: ${yacht.maxGuests})`
    }

    // Check minimum booking duration
    const start = new Date(start_datetime)
    const end = new Date(end_datetime)
    const durationHours = (end - start) / (1000 * 60 * 60)

    if (durationHours < yacht.minBookingHours) {
      errors.end_datetime = `Minimum booking duration for ${yacht.name} is ${yacht.minBookingHours} hours`
      
      // Suggest optimal end time
      const suggestedEndTime = new Date(start.getTime() + yacht.minBookingHours * 60 * 60 * 1000)
      suggestions.push({
        type: 'duration_extension',
        message: `Extend booking to ${yacht.minBookingHours} hours`,
        suggestedEndTime,
        action: 'adjust_duration'
      })
    }

    // Check seasonal pricing
    const seasonalInfo = this.getSeasonalPricing(yacht, start, end)
    if (seasonalInfo.isPeakSeason) {
      warnings.push(`Selected dates are during ${seasonalInfo.seasonType} season (${seasonalInfo.multiplier}x rate)`)
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      suggestions,
      availability,
      yacht
    }
  }

  /**
   * Get seasonal pricing information
   * @param {Object} yacht - Yacht specifications
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} Seasonal pricing info
   */
  getSeasonalPricing(yacht, startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)

    let highestMultiplier = 1.0
    let seasonType = 'standard'
    let isPeakSeason = false

    for (const [season, period] of Object.entries(yacht.seasonalRates)) {
      const seasonStart = new Date(period.start)
      const seasonEnd = new Date(period.end)

      // Check if booking overlaps with seasonal period
      if (start < seasonEnd && end > seasonStart) {
        if (period.multiplier > highestMultiplier) {
          highestMultiplier = period.multiplier
          seasonType = season
          isPeakSeason = true
        }
      }
    }

    return {
      multiplier: highestMultiplier,
      seasonType,
      isPeakSeason
    }
  }

  /**
   * Add booking to the service (for testing/simulation)
   * @param {Object} booking - Booking data
   */
  addBooking(booking) {
    this.bookings.set(booking.id, booking)
  }

  /**
   * Remove booking from the service
   * @param {string} bookingId - Booking ID
   */
  removeBooking(bookingId) {
    this.bookings.delete(bookingId)
  }

  /**
   * Update booking in the service
   * @param {string} bookingId - Booking ID
   * @param {Object} updates - Booking updates
   */
  updateBooking(bookingId, updates) {
    const existing = this.bookings.get(bookingId)
    if (existing) {
      this.bookings.set(bookingId, { ...existing, ...updates })
    }
  }
}

// Export singleton instance
export const yachtAvailabilityService = new YachtAvailabilityService()

export default {
  YachtAvailabilityService,
  AvailabilityStatus,
  yachtAvailabilityService
}