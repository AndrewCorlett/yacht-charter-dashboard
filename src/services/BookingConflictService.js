/**
 * Booking Conflict Detection Service
 * 
 * Comprehensive service for detecting booking conflicts, managing availability,
 * and providing conflict resolution suggestions for yacht charter bookings.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

import { 
  isAfter, 
  isBefore, 
  isEqual, 
  startOfDay, 
  endOfDay,
  addDays,
  subDays,
  eachDayOfInterval,
  format,
  differenceInDays
} from 'date-fns'
import { BookingStatus, BookingType } from '../models/core/BookingModel'

/**
 * Main Booking Conflict Service Class
 * 
 * Handles all conflict detection and availability checking logic
 */
export class BookingConflictService {
  /**
   * Check if two date ranges overlap
   * 
   * @param {Date} start1 - Start date of first range
   * @param {Date} end1 - End date of first range
   * @param {Date} start2 - Start date of second range
   * @param {Date} end2 - End date of second range
   * @returns {boolean} True if ranges overlap
   */
  static datesOverlap(start1, end1, start2, end2) {
    // Normalize dates to start of day for consistent comparison
    const s1 = startOfDay(start1)
    const e1 = endOfDay(end1)
    const s2 = startOfDay(start2)
    const e2 = endOfDay(end2)

    // Check for overlap
    return (
      (isEqual(s1, s2) || isAfter(s1, s2)) && (isEqual(s1, e2) || isBefore(s1, e2)) ||
      (isEqual(e1, s2) || isAfter(e1, s2)) && (isEqual(e1, e2) || isBefore(e1, e2)) ||
      (isEqual(s2, s1) || isAfter(s2, s1)) && (isEqual(s2, e1) || isBefore(s2, e1)) ||
      (isEqual(e2, s1) || isAfter(e2, s1)) && (isEqual(e2, e1) || isBefore(e2, e1))
    )
  }

  /**
   * Check if a booking conflicts with existing bookings
   * 
   * @param {Object} newBooking - The booking to check
   * @param {Array} existingBookings - Array of existing bookings
   * @param {Object} options - Additional options
   * @param {boolean} options.excludeSameDay - Whether to allow same-day checkout/checkin
   * @param {boolean} options.includeBlocked - Whether to include blocked periods
   * @returns {Object} Conflict detection result
   */
  static checkBookingConflicts(newBooking, existingBookings, options = {}) {
    const {
      excludeSameDay = false,
      includeBlocked = true
    } = options

    const conflicts = []
    const warnings = []

    // Filter bookings for the same yacht
    const yachtBookings = existingBookings.filter(booking => 
      booking.yacht_id === newBooking.yacht_id &&
      booking.id !== newBooking.id // Exclude self when updating
    )

    // Check each existing booking
    for (const existingBooking of yachtBookings) {
      // Skip cancelled or no-show bookings
      if ([BookingStatus.CANCELLED, BookingStatus.NO_SHOW].includes(existingBooking.status)) {
        continue
      }

      // Skip blocked periods if requested
      if (!includeBlocked && existingBooking.type === BookingType.BLOCKED) {
        continue
      }

      // Check for date overlap
      const hasOverlap = this.datesOverlap(
        newBooking.start_datetime,
        newBooking.end_datetime,
        existingBooking.start_datetime,
        existingBooking.end_datetime
      )

      if (hasOverlap) {
        // Check if it's a same-day checkout/checkin scenario
        const isSameDayTransition = 
          format(newBooking.start_datetime, 'yyyy-MM-dd') === format(existingBooking.end_datetime, 'yyyy-MM-dd') ||
          format(newBooking.end_datetime, 'yyyy-MM-dd') === format(existingBooking.start_datetime, 'yyyy-MM-dd')

        if (isSameDayTransition && excludeSameDay) {
          warnings.push({
            type: 'same_day_transition',
            message: 'Same-day checkout/checkin detected',
            booking: existingBooking
          })
        } else {
          conflicts.push({
            type: this._getConflictType(existingBooking),
            severity: this._getConflictSeverity(existingBooking),
            booking: existingBooking,
            overlapDays: this._calculateOverlapDays(
              newBooking.start_datetime,
              newBooking.end_datetime,
              existingBooking.start_datetime,
              existingBooking.end_datetime
            )
          })
        }
      }

      // Check for back-to-back bookings (warnings)
      const isBackToBack = 
        format(addDays(newBooking.end_datetime, 1), 'yyyy-MM-dd') === format(existingBooking.start_datetime, 'yyyy-MM-dd') ||
        format(addDays(existingBooking.end_datetime, 1), 'yyyy-MM-dd') === format(newBooking.start_datetime, 'yyyy-MM-dd')

      if (isBackToBack) {
        warnings.push({
          type: 'back_to_back',
          message: 'Back-to-back booking detected - consider turnaround time',
          booking: existingBooking
        })
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      warnings,
      isAvailable: conflicts.length === 0
    }
  }

  /**
   * Get availability status for a specific date and yacht
   * 
   * @param {Date} date - The date to check
   * @param {string} yachtId - The yacht ID
   * @param {Array} bookings - Array of bookings
   * @returns {Object} Availability status
   */
  static getDateAvailability(date, yachtId, bookings) {
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)

    const yachtBookings = bookings.filter(booking => 
      booking.yacht_id === yachtId &&
      ![BookingStatus.CANCELLED, BookingStatus.NO_SHOW].includes(booking.status)
    )

    let status = 'available'
    let booking = null
    let isTransitionDay = false

    for (const b of yachtBookings) {
      const bookingStart = startOfDay(b.start_datetime)
      const bookingEnd = endOfDay(b.end_datetime)

      // Check if date falls within booking period
      if ((isEqual(dayStart, bookingStart) || isAfter(dayStart, bookingStart)) &&
          (isEqual(dayStart, bookingEnd) || isBefore(dayStart, bookingEnd))) {
        
        // Check if it's a transition day (checkout or checkin)
        if (isEqual(dayStart, bookingStart) || isEqual(dayStart, bookingEnd)) {
          isTransitionDay = true
        }

        // Determine status based on booking type and status
        if (b.type === BookingType.BLOCKED) {
          status = 'blocked'
        } else if (b.type === BookingType.MAINTENANCE) {
          status = 'maintenance'
        } else if (b.type === BookingType.OWNER) {
          status = 'owner'
        } else if (b.status === BookingStatus.CONFIRMED) {
          status = 'confirmed'
        } else if ([BookingStatus.PENDING, BookingStatus.DEPOSIT_PENDING].includes(b.status)) {
          status = 'pending'
        }

        booking = b
        break // Take the first matching booking
      }
    }

    return {
      date,
      yachtId,
      status,
      booking,
      isTransitionDay,
      isAvailable: status === 'available'
    }
  }

  /**
   * Get availability for a date range
   * 
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} yachtId - Yacht ID
   * @param {Array} bookings - Array of bookings
   * @returns {Array} Array of daily availability
   */
  static getRangeAvailability(startDate, endDate, yachtId, bookings) {
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    return days.map(day => this.getDateAvailability(day, yachtId, bookings))
  }

  /**
   * Find available slots for a yacht
   * 
   * @param {string} yachtId - Yacht ID
   * @param {Array} bookings - Array of bookings
   * @param {Object} options - Search options
   * @returns {Array} Array of available slots
   */
  static findAvailableSlots(yachtId, bookings, options = {}) {
    const {
      minDays = 1,
      maxDays = 30,
      startFrom = new Date(),
      endBefore = addDays(new Date(), 90),
      excludeWeekends = false
    } = options

    const availableSlots = []
    const yachtBookings = bookings
      .filter(b => 
        b.yacht_id === yachtId &&
        ![BookingStatus.CANCELLED, BookingStatus.NO_SHOW].includes(b.status)
      )
      .sort((a, b) => a.start_datetime - b.start_datetime)

    let currentDate = startOfDay(startFrom)
    const endDate = endOfDay(endBefore)

    while (isBefore(currentDate, endDate)) {
      // Check if current date is available
      const availability = this.getDateAvailability(currentDate, yachtId, bookings)
      
      if (availability.isAvailable) {
        // Start of a potential slot
        const slotStart = currentDate
        let slotEnd = currentDate
        let consecutiveDays = 1

        // Check consecutive available days
        while (isBefore(slotEnd, endDate) && consecutiveDays <= maxDays) {
          const nextDay = addDays(slotEnd, 1)
          const nextAvailability = this.getDateAvailability(nextDay, yachtId, bookings)
          
          if (nextAvailability.isAvailable) {
            slotEnd = nextDay
            consecutiveDays++
          } else {
            break
          }
        }

        // Add slot if it meets minimum days requirement
        if (consecutiveDays >= minDays) {
          availableSlots.push({
            yachtId,
            startDate: slotStart,
            endDate: slotEnd,
            days: consecutiveDays,
            isWeekend: this._includesWeekend(slotStart, slotEnd)
          })
        }

        // Move to next day after the slot
        currentDate = addDays(slotEnd, 1)
      } else {
        // Move to next day
        currentDate = addDays(currentDate, 1)
      }
    }

    // Filter out weekends if requested
    if (excludeWeekends) {
      return availableSlots.filter(slot => !slot.isWeekend)
    }

    return availableSlots
  }

  /**
   * Suggest alternative bookings when conflicts exist
   * 
   * @param {Object} requestedBooking - The requested booking
   * @param {Array} bookings - Existing bookings
   * @param {Array} yachts - Available yachts
   * @returns {Object} Alternative suggestions
   */
  static suggestAlternatives(requestedBooking, bookings, yachts) {
    const suggestions = {
      alternativeDates: [],
      alternativeYachts: [],
      nearbySlots: []
    }

    const requestedDays = differenceInDays(
      requestedBooking.end_datetime,
      requestedBooking.start_datetime
    ) + 1

    // 1. Find alternative dates for the same yacht
    const availableSlots = this.findAvailableSlots(
      requestedBooking.yacht_id,
      bookings,
      {
        minDays: requestedDays,
        maxDays: requestedDays + 7,
        startFrom: subDays(requestedBooking.start_datetime, 14),
        endBefore: addDays(requestedBooking.end_datetime, 30)
      }
    )

    suggestions.alternativeDates = availableSlots
      .filter(slot => slot.days >= requestedDays)
      .map(slot => ({
        ...slot,
        startDate: slot.startDate,
        endDate: addDays(slot.startDate, requestedDays - 1),
        daysDifference: Math.abs(differenceInDays(slot.startDate, requestedBooking.start_datetime))
      }))
      .sort((a, b) => a.daysDifference - b.daysDifference)
      .slice(0, 5)

    // 2. Find alternative yachts for the same dates
    for (const yacht of yachts) {
      if (yacht.id === requestedBooking.yacht_id) continue

      const conflictCheck = this.checkBookingConflicts(
        { ...requestedBooking, yacht_id: yacht.id },
        bookings
      )

      if (conflictCheck.isAvailable) {
        suggestions.alternativeYachts.push({
          yacht,
          startDate: requestedBooking.start_datetime,
          endDate: requestedBooking.end_datetime,
          days: requestedDays
        })
      }
    }

    // 3. Find nearby available slots (before and after requested dates)
    const nearbyBefore = this.findAvailableSlots(
      requestedBooking.yacht_id,
      bookings,
      {
        minDays: Math.max(1, requestedDays - 2),
        maxDays: requestedDays + 2,
        startFrom: subDays(requestedBooking.start_datetime, 7),
        endBefore: requestedBooking.start_datetime
      }
    )

    const nearbyAfter = this.findAvailableSlots(
      requestedBooking.yacht_id,
      bookings,
      {
        minDays: Math.max(1, requestedDays - 2),
        maxDays: requestedDays + 2,
        startFrom: requestedBooking.end_datetime,
        endBefore: addDays(requestedBooking.end_datetime, 7)
      }
    )

    suggestions.nearbySlots = [...nearbyBefore, ...nearbyAfter]
      .sort((a, b) => a.startDate - b.startDate)
      .slice(0, 4)

    return suggestions
  }

  /**
   * Get conflict type based on booking
   * 
   * @param {Object} booking - The booking
   * @returns {string} Conflict type
   * @private
   */
  static _getConflictType(booking) {
    if (booking.type === BookingType.BLOCKED) return 'blocked_period'
    if (booking.type === BookingType.MAINTENANCE) return 'maintenance'
    if (booking.type === BookingType.OWNER) return 'owner_use'
    if (booking.status === BookingStatus.CONFIRMED) return 'confirmed_booking'
    return 'pending_booking'
  }

  /**
   * Get conflict severity
   * 
   * @param {Object} booking - The booking
   * @returns {string} Severity level
   * @private
   */
  static _getConflictSeverity(booking) {
    if (booking.status === BookingStatus.CONFIRMED) return 'high'
    if (booking.type === BookingType.OWNER) return 'high'
    if (booking.type === BookingType.MAINTENANCE) return 'high'
    if (booking.type === BookingType.BLOCKED) return 'medium'
    return 'low'
  }

  /**
   * Calculate overlap days between two date ranges
   * 
   * @param {Date} start1 - Start of first range
   * @param {Date} end1 - End of first range
   * @param {Date} start2 - Start of second range
   * @param {Date} end2 - End of second range
   * @returns {number} Number of overlapping days
   * @private
   */
  static _calculateOverlapDays(start1, end1, start2, end2) {
    const overlapStart = isAfter(start1, start2) ? start1 : start2
    const overlapEnd = isBefore(end1, end2) ? end1 : end2
    return differenceInDays(overlapEnd, overlapStart) + 1
  }

  /**
   * Check if date range includes weekend
   * 
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {boolean} True if includes weekend
   * @private
   */
  static _includesWeekend(startDate, endDate) {
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    return days.some(day => {
      const dayOfWeek = day.getDay()
      return dayOfWeek === 0 || dayOfWeek === 6
    })
  }

  /**
   * Validate booking dates for business rules
   * 
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  static validateBookingDates(startDate, endDate, options = {}) {
    const {
      minDays = 1,
      maxDays = 30,
      allowPastDates = false,
      minAdvanceBooking = 0,
      maxAdvanceBooking = 365
    } = options

    const errors = []
    const warnings = []
    const today = startOfDay(new Date())

    // Check if dates are valid
    if (!startDate || !endDate) {
      errors.push('Start and end dates are required')
      return { isValid: false, errors, warnings }
    }

    // Check date order
    if (isAfter(startDate, endDate)) {
      errors.push('End date must be after start date')
    }

    // Check past dates
    if (!allowPastDates && isBefore(startDate, today)) {
      errors.push('Cannot book dates in the past')
    }

    // Check booking duration
    const bookingDays = differenceInDays(endDate, startDate) + 1
    if (bookingDays < minDays) {
      errors.push(`Minimum booking duration is ${minDays} days`)
    }
    if (bookingDays > maxDays) {
      errors.push(`Maximum booking duration is ${maxDays} days`)
    }

    // Check advance booking limits
    const daysInAdvance = differenceInDays(startDate, today)
    if (daysInAdvance < minAdvanceBooking) {
      errors.push(`Bookings must be made at least ${minAdvanceBooking} days in advance`)
    }
    if (daysInAdvance > maxAdvanceBooking) {
      errors.push(`Cannot book more than ${maxAdvanceBooking} days in advance`)
    }

    // Add warnings for edge cases
    if (bookingDays === 1) {
      warnings.push('Single-day booking - consider turnaround time')
    }

    if (this._includesWeekend(startDate, endDate)) {
      warnings.push('Booking includes weekend days')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      bookingDays,
      daysInAdvance
    }
  }
}

export default BookingConflictService