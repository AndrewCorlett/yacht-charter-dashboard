/**
 * Unit Tests for BookingConflictService
 * 
 * Comprehensive tests for conflict detection and availability checking
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import { describe, test, expect, beforeEach } from '@jest/globals'
import { BookingConflictService } from '../../services/BookingConflictService'
import { BookingModel, BookingStatus, BookingType } from '../../models/core/BookingModel'

describe('BookingConflictService', () => {
  let testBookings
  let testYachts

  beforeEach(() => {
    testYachts = [
      { id: 'spectre', name: 'Spectre' },
      { id: 'disk-drive', name: 'Disk Drive' },
      { id: 'arriva', name: 'Arriva' }
    ]

    testBookings = [
      new BookingModel({
        id: '1',
        yacht_id: 'spectre',
        customer_name: 'John Smith',
        start_datetime: new Date(2025, 5, 10), // June 10, 2025
        end_datetime: new Date(2025, 5, 15),   // June 15, 2025
        status: BookingStatus.CONFIRMED
      }),
      new BookingModel({
        id: '2',
        yacht_id: 'spectre',
        customer_name: 'Jane Doe',
        start_datetime: new Date(2025, 5, 20), // June 20, 2025
        end_datetime: new Date(2025, 5, 25),   // June 25, 2025
        status: BookingStatus.PENDING
      }),
      new BookingModel({
        id: '3',
        yacht_id: 'disk-drive',
        customer_name: 'Bob Wilson',
        start_datetime: new Date(2025, 5, 12), // June 12, 2025
        end_datetime: new Date(2025, 5, 18),   // June 18, 2025
        status: BookingStatus.CONFIRMED
      }),
      new BookingModel({
        id: '4',
        yacht_id: 'spectre',
        customer_name: 'System Block',
        start_datetime: new Date(2025, 5, 30), // June 30, 2025
        end_datetime: new Date(2025, 6, 2),    // July 2, 2025
        status: BookingStatus.CONFIRMED,
        type: BookingType.BLOCKED
      })
    ]
  })

  describe('datesOverlap', () => {
    test('should detect overlapping date ranges', () => {
      const start1 = new Date(2025, 5, 10)
      const end1 = new Date(2025, 5, 15)
      const start2 = new Date(2025, 5, 12)
      const end2 = new Date(2025, 5, 18)

      expect(BookingConflictService.datesOverlap(start1, end1, start2, end2)).toBe(true)
    })

    test('should detect non-overlapping date ranges', () => {
      const start1 = new Date(2025, 5, 10)
      const end1 = new Date(2025, 5, 15)
      const start2 = new Date(2025, 5, 16)
      const end2 = new Date(2025, 5, 20)

      expect(BookingConflictService.datesOverlap(start1, end1, start2, end2)).toBe(false)
    })

    test('should handle adjacent date ranges (same day checkout/checkin)', () => {
      const start1 = new Date(2025, 5, 10)
      const end1 = new Date(2025, 5, 15)
      const start2 = new Date(2025, 5, 15) // Same day as end1
      const end2 = new Date(2025, 5, 20)

      // Should overlap because end of day 15 overlaps with start of day 15
      expect(BookingConflictService.datesOverlap(start1, end1, start2, end2)).toBe(true)
    })

    test('should handle exact same date ranges', () => {
      const start1 = new Date(2025, 5, 10)
      const end1 = new Date(2025, 5, 15)
      const start2 = new Date(2025, 5, 10)
      const end2 = new Date(2025, 5, 15)

      expect(BookingConflictService.datesOverlap(start1, end1, start2, end2)).toBe(true)
    })
  })

  describe('checkBookingConflicts', () => {
    test('should detect no conflicts for different yacht', () => {
      const newBooking = new BookingModel({
        yacht_id: 'arriva',
        start_datetime: new Date(2025, 5, 12),
        end_datetime: new Date(2025, 5, 16),
        status: BookingStatus.PENDING
      })

      const result = BookingConflictService.checkBookingConflicts(newBooking, testBookings)

      expect(result.hasConflicts).toBe(false)
      expect(result.isAvailable).toBe(true)
      expect(result.conflicts).toHaveLength(0)
    })

    test('should detect conflicts with confirmed booking', () => {
      const newBooking = new BookingModel({
        yacht_id: 'spectre',
        start_datetime: new Date(2025, 5, 12), // Overlaps with existing booking
        end_datetime: new Date(2025, 5, 16),
        status: BookingStatus.PENDING
      })

      const result = BookingConflictService.checkBookingConflicts(newBooking, testBookings)

      expect(result.hasConflicts).toBe(true)
      expect(result.isAvailable).toBe(false)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].type).toBe('confirmed_booking')
      expect(result.conflicts[0].severity).toBe('high')
    })

    test('should detect conflicts with pending booking', () => {
      const newBooking = new BookingModel({
        yacht_id: 'spectre',
        start_datetime: new Date(2025, 5, 22), // Overlaps with pending booking
        end_datetime: new Date(2025, 5, 26),
        status: BookingStatus.PENDING
      })

      const result = BookingConflictService.checkBookingConflicts(newBooking, testBookings)

      expect(result.hasConflicts).toBe(true)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].type).toBe('pending_booking')
      expect(result.conflicts[0].severity).toBe('low')
    })

    test('should detect conflicts with blocked period', () => {
      const newBooking = new BookingModel({
        yacht_id: 'spectre',
        start_datetime: new Date(2025, 6, 1), // Overlaps with blocked period
        end_datetime: new Date(2025, 6, 3),
        status: BookingStatus.PENDING
      })

      const result = BookingConflictService.checkBookingConflicts(newBooking, testBookings)

      expect(result.hasConflicts).toBe(true)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].type).toBe('blocked_period')
      expect(result.conflicts[0].severity).toBe('medium')
    })

    test('should ignore cancelled bookings', () => {
      const cancelledBooking = new BookingModel({
        yacht_id: 'spectre',
        start_datetime: new Date(2025, 5, 5),
        end_datetime: new Date(2025, 5, 8),
        status: BookingStatus.CANCELLED
      })

      const bookingsWithCancelled = [...testBookings, cancelledBooking]

      const newBooking = new BookingModel({
        yacht_id: 'spectre',
        start_datetime: new Date(2025, 5, 6), // Would overlap with cancelled
        end_datetime: new Date(2025, 5, 9),
        status: BookingStatus.PENDING
      })

      const result = BookingConflictService.checkBookingConflicts(newBooking, bookingsWithCancelled)

      expect(result.hasConflicts).toBe(false)
      expect(result.isAvailable).toBe(true)
    })

    test('should detect back-to-back bookings as warnings', () => {
      const newBooking = new BookingModel({
        yacht_id: 'spectre',
        start_datetime: new Date(2025, 5, 16), // Day after existing booking ends
        end_datetime: new Date(2025, 5, 19),
        status: BookingStatus.PENDING
      })

      const result = BookingConflictService.checkBookingConflicts(newBooking, testBookings)

      expect(result.hasConflicts).toBe(false)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].type).toBe('back_to_back')
    })

    test('should exclude self when checking conflicts (for updates)', () => {
      const existingBooking = testBookings[0] // First booking
      const updatedBooking = new BookingModel({
        id: existingBooking.id, // Same ID
        yacht_id: existingBooking.yacht_id,
        start_datetime: new Date(2025, 5, 11), // Slightly different dates
        end_datetime: new Date(2025, 5, 16),
        status: BookingStatus.CONFIRMED
      })

      const result = BookingConflictService.checkBookingConflicts(updatedBooking, testBookings)

      expect(result.hasConflicts).toBe(false) // Should not conflict with itself
    })
  })

  describe('getDateAvailability', () => {
    test('should return available for unbooked date', () => {
      const date = new Date(2025, 5, 5) // Before any bookings
      const result = BookingConflictService.getDateAvailability(date, 'spectre', testBookings)

      expect(result.status).toBe('available')
      expect(result.isAvailable).toBe(true)
      expect(result.booking).toBe(null)
    })

    test('should return confirmed for date within confirmed booking', () => {
      const date = new Date(2025, 5, 12) // Within first booking
      const result = BookingConflictService.getDateAvailability(date, 'spectre', testBookings)

      expect(result.status).toBe('confirmed')
      expect(result.isAvailable).toBe(false)
      expect(result.booking).toBeTruthy()
      expect(result.booking.customer_name).toBe('John Smith')
    })

    test('should return pending for date within pending booking', () => {
      const date = new Date(2025, 5, 22) // Within pending booking
      const result = BookingConflictService.getDateAvailability(date, 'spectre', testBookings)

      expect(result.status).toBe('pending')
      expect(result.isAvailable).toBe(false)
      expect(result.booking.customer_name).toBe('Jane Doe')
    })

    test('should return blocked for date within blocked period', () => {
      const date = new Date(2025, 6, 1) // Within blocked period
      const result = BookingConflictService.getDateAvailability(date, 'spectre', testBookings)

      expect(result.status).toBe('blocked')
      expect(result.isAvailable).toBe(false)
    })

    test('should detect transition days', () => {
      const startDate = new Date(2025, 5, 10) // Start of booking
      const endDate = new Date(2025, 5, 15)   // End of booking

      const startResult = BookingConflictService.getDateAvailability(startDate, 'spectre', testBookings)
      const endResult = BookingConflictService.getDateAvailability(endDate, 'spectre', testBookings)

      expect(startResult.isTransitionDay).toBe(true)
      expect(endResult.isTransitionDay).toBe(true)
    })
  })

  describe('getRangeAvailability', () => {
    test('should return availability for date range', () => {
      const startDate = new Date(2025, 5, 8)
      const endDate = new Date(2025, 5, 12)

      const result = BookingConflictService.getRangeAvailability(startDate, endDate, 'spectre', testBookings)

      expect(result).toHaveLength(5) // 5 days
      expect(result[0].status).toBe('available') // June 8
      expect(result[1].status).toBe('available') // June 9
      expect(result[2].status).toBe('confirmed') // June 10 (start of booking)
      expect(result[3].status).toBe('confirmed') // June 11
      expect(result[4].status).toBe('confirmed') // June 12
    })
  })

  describe('findAvailableSlots', () => {
    test('should find available slots between bookings', () => {
      const result = BookingConflictService.findAvailableSlots(
        'spectre',
        testBookings,
        {
          minDays: 2,
          startFrom: new Date(2025, 5, 1),
          endBefore: new Date(2025, 5, 28)
        }
      )

      expect(result.length).toBeGreaterThan(0)
      
      // Should find slot between June 16-19 (after first booking, before second)
      const middleSlot = result.find(slot => 
        slot.startDate.getDate() === 16 && 
        slot.startDate.getMonth() === 5
      )
      expect(middleSlot).toBeTruthy()
      expect(middleSlot.days).toBe(4) // June 16-19
    })

    test('should respect minimum days requirement', () => {
      const result = BookingConflictService.findAvailableSlots(
        'spectre',
        testBookings,
        {
          minDays: 10, // Large minimum
          startFrom: new Date(2025, 5, 1),
          endBefore: new Date(2025, 5, 28)
        }
      )

      // Should find fewer slots due to high minimum requirement
      result.forEach(slot => {
        expect(slot.days).toBeGreaterThanOrEqual(10)
      })
    })
  })

  describe('suggestAlternatives', () => {
    test('should suggest alternative dates for same yacht', () => {
      const requestedBooking = new BookingModel({
        yacht_id: 'spectre',
        start_datetime: new Date(2025, 5, 12), // Conflicts with existing
        end_datetime: new Date(2025, 5, 14),
        status: BookingStatus.PENDING
      })

      const result = BookingConflictService.suggestAlternatives(requestedBooking, testBookings, testYachts)

      expect(result.alternativeDates).toBeDefined()
      expect(result.alternativeDates.length).toBeGreaterThan(0)
      
      // Should find alternatives like June 16-18
      const earlyAlternative = result.alternativeDates.find(alt => 
        alt.startDate.getDate() === 16
      )
      expect(earlyAlternative).toBeTruthy()
    })

    test('should suggest alternative yachts for same dates', () => {
      const requestedBooking = new BookingModel({
        yacht_id: 'spectre',
        start_datetime: new Date(2025, 5, 12), // Conflicts on Spectre
        end_datetime: new Date(2025, 5, 14),
        status: BookingStatus.PENDING
      })

      const result = BookingConflictService.suggestAlternatives(requestedBooking, testBookings, testYachts)

      expect(result.alternativeYachts).toBeDefined()
      expect(result.alternativeYachts.length).toBeGreaterThan(0)
      
      // Should suggest Arriva (no conflicts on those dates)
      const arrivaAlternative = result.alternativeYachts.find(alt => 
        alt.yacht.id === 'arriva'
      )
      expect(arrivaAlternative).toBeTruthy()
    })

    test('should find nearby available slots', () => {
      const requestedBooking = new BookingModel({
        yacht_id: 'spectre',
        start_datetime: new Date(2025, 5, 12),
        end_datetime: new Date(2025, 5, 14),
        status: BookingStatus.PENDING
      })

      const result = BookingConflictService.suggestAlternatives(requestedBooking, testBookings, testYachts)

      expect(result.nearbySlots).toBeDefined()
      expect(result.nearbySlots.length).toBeGreaterThan(0)
    })
  })

  describe('validateBookingDates', () => {
    test('should validate correct date range', () => {
      const startDate = new Date(2025, 6, 1) // Future date
      const endDate = new Date(2025, 6, 5)

      const result = BookingConflictService.validateBookingDates(startDate, endDate, {
        minDays: 1,
        maxDays: 30,
        allowPastDates: false
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.bookingDays).toBe(5)
    })

    test('should reject past dates', () => {
      const startDate = new Date(2023, 5, 1) // Past date
      const endDate = new Date(2023, 5, 5)

      const result = BookingConflictService.validateBookingDates(startDate, endDate, {
        allowPastDates: false
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Cannot book dates in the past')
    })

    test('should reject end date before start date', () => {
      const startDate = new Date(2025, 6, 5)
      const endDate = new Date(2025, 6, 1) // Before start

      const result = BookingConflictService.validateBookingDates(startDate, endDate)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('End date must be after start date')
    })

    test('should enforce minimum booking duration', () => {
      const startDate = new Date(2025, 6, 1)
      const endDate = new Date(2025, 6, 1) // Same day = 1 day

      const result = BookingConflictService.validateBookingDates(startDate, endDate, {
        minDays: 3
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Minimum booking duration is 3 days')
    })

    test('should enforce maximum booking duration', () => {
      const startDate = new Date(2025, 6, 1)
      const endDate = new Date(2025, 8, 1) // ~60 days

      const result = BookingConflictService.validateBookingDates(startDate, endDate, {
        maxDays: 30
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Maximum booking duration is 30 days')
    })

    test('should add warnings for edge cases', () => {
      const startDate = new Date(2025, 6, 1)
      const endDate = new Date(2025, 6, 1) // Single day

      const result = BookingConflictService.validateBookingDates(startDate, endDate)

      expect(result.warnings).toContain('Single-day booking - consider turnaround time')
    })

    test('should warn about weekend bookings', () => {
      const startDate = new Date(2025, 5, 7) // Saturday
      const endDate = new Date(2025, 5, 8)   // Sunday

      const result = BookingConflictService.validateBookingDates(startDate, endDate)

      expect(result.warnings).toContain('Booking includes weekend days')
    })
  })
})