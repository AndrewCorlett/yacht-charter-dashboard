/**
 * Unit Tests for BookingModel Conflict Methods
 * 
 * Tests for the conflict detection methods added to BookingModel
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import { describe, test, expect, beforeEach } from '@jest/globals'
import { BookingModel, BookingStatus, BookingType } from '../../models/core/BookingModel'

describe('BookingModel - Conflict Detection', () => {
  let booking1, booking2, booking3, existingBookings, testYachts

  beforeEach(() => {
    booking1 = new BookingModel({
      id: '1',
      yacht_id: 'spectre',
      customer_name: 'John Smith',
      customer_email: 'john@example.com',
      start_datetime: new Date(2025, 5, 10),
      end_datetime: new Date(2025, 5, 15),
      status: BookingStatus.CONFIRMED
    })

    booking2 = new BookingModel({
      id: '2',
      yacht_id: 'spectre',
      customer_name: 'Jane Doe',
      customer_email: 'jane@example.com',
      start_datetime: new Date(2025, 5, 20),
      end_datetime: new Date(2025, 5, 25),
      status: BookingStatus.PENDING
    })

    booking3 = new BookingModel({
      id: '3',
      yacht_id: 'disk-drive',
      customer_name: 'Bob Wilson',
      customer_email: 'bob@example.com',
      start_datetime: new Date(2025, 5, 12),
      end_datetime: new Date(2025, 5, 18),
      status: BookingStatus.CONFIRMED
    })

    existingBookings = [booking1, booking2, booking3]

    testYachts = [
      { id: 'spectre', name: 'Spectre' },
      { id: 'disk-drive', name: 'Disk Drive' },
      { id: 'arriva', name: 'Arriva' }
    ]
  })

  describe('checkConflicts', () => {
    test('should detect no conflicts for different yacht', () => {
      const newBooking = new BookingModel({
        yacht_id: 'arriva',
        customer_name: 'New Customer',
        customer_email: 'new@example.com',
        start_datetime: new Date(2025, 5, 12),
        end_datetime: new Date(2025, 5, 16),
        status: BookingStatus.PENDING
      })

      const result = newBooking.checkConflicts(existingBookings)

      expect(result.hasConflicts).toBe(false)
      expect(result.isAvailable).toBe(true)
    })

    test('should detect conflicts with same yacht', () => {
      const conflictingBooking = new BookingModel({
        yacht_id: 'spectre',
        customer_name: 'Conflicting Customer',
        customer_email: 'conflict@example.com',
        start_datetime: new Date(2025, 5, 12), // Overlaps with booking1
        end_datetime: new Date(2025, 5, 16),
        status: BookingStatus.PENDING
      })

      const result = conflictingBooking.checkConflicts(existingBookings)

      expect(result.hasConflicts).toBe(true)
      expect(result.isAvailable).toBe(false)
      expect(result.conflicts).toHaveLength(1)
    })

    test('should pass options to conflict service', () => {
      const conflictingBooking = new BookingModel({
        yacht_id: 'spectre',
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        start_datetime: new Date(2025, 5, 12),
        end_datetime: new Date(2025, 5, 16),
        status: BookingStatus.PENDING
      })

      const result = conflictingBooking.checkConflicts(existingBookings, {
        excludeSameDay: true
      })

      // Should still detect conflict since it's more than same-day
      expect(result.hasConflicts).toBe(true)
    })
  })

  describe('overlapsWith', () => {
    test('should detect overlap between bookings on same yacht', () => {
      const overlappingBooking = new BookingModel({
        yacht_id: 'spectre',
        start_datetime: new Date(2025, 5, 12),
        end_datetime: new Date(2025, 5, 16)
      })

      expect(booking1.overlapsWith(overlappingBooking)).toBe(true)
    })

    test('should not detect overlap between bookings on different yachts', () => {
      const differentYachtBooking = new BookingModel({
        yacht_id: 'arriva',
        start_datetime: new Date(2025, 5, 12),
        end_datetime: new Date(2025, 5, 16)
      })

      expect(booking1.overlapsWith(differentYachtBooking)).toBe(false)
    })

    test('should not detect overlap for non-overlapping dates', () => {
      const nonOverlappingBooking = new BookingModel({
        yacht_id: 'spectre',
        start_datetime: new Date(2025, 5, 16),
        end_datetime: new Date(2025, 5, 20)
      })

      expect(booking1.overlapsWith(nonOverlappingBooking)).toBe(false)
    })
  })

  describe('getAvailabilityStatus', () => {
    test('should return availability status for booking dates', () => {
      const result = booking1.getAvailabilityStatus(existingBookings)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(6) // June 10-15 = 6 days
      
      // All days should show as confirmed (since this is the booking itself)
      result.forEach(day => {
        expect(day.yachtId).toBe('spectre')
        expect(day.status).toBe('confirmed')
      })
    })
  })

  describe('canBeBooked', () => {
    test('should return true for valid booking without conflicts', () => {
      const validBooking = new BookingModel({
        yacht_id: 'arriva',
        customer_name: 'Valid Customer',
        customer_email: 'valid@example.com',
        start_datetime: new Date(2025, 6, 1),
        end_datetime: new Date(2025, 6, 5),
        status: BookingStatus.PENDING
      })

      expect(validBooking.canBeBooked(existingBookings)).toBe(true)
    })

    test('should return false for booking with conflicts', () => {
      const conflictingBooking = new BookingModel({
        yacht_id: 'spectre',
        customer_name: 'Conflicting Customer',
        customer_email: 'conflict@example.com',
        start_datetime: new Date(2025, 5, 12),
        end_datetime: new Date(2025, 5, 16),
        status: BookingStatus.PENDING
      })

      expect(conflictingBooking.canBeBooked(existingBookings)).toBe(false)
    })

    test('should return false for booking with validation errors', () => {
      const invalidBooking = new BookingModel({
        yacht_id: 'arriva',
        customer_name: '', // Invalid - empty name
        customer_email: 'invalid@example.com',
        start_datetime: new Date(2025, 6, 1),
        end_datetime: new Date(2025, 6, 5),
        status: BookingStatus.PENDING
      })

      expect(invalidBooking.canBeBooked(existingBookings)).toBe(false)
    })
  })

  describe('getSuggestedAlternatives', () => {
    test('should return alternative suggestions', () => {
      const conflictingBooking = new BookingModel({
        yacht_id: 'spectre',
        customer_name: 'Conflicting Customer',
        customer_email: 'conflict@example.com',
        start_datetime: new Date(2025, 5, 12),
        end_datetime: new Date(2025, 5, 14),
        status: BookingStatus.PENDING
      })

      const suggestions = conflictingBooking.getSuggestedAlternatives(existingBookings, testYachts)

      expect(suggestions).toHaveProperty('alternativeDates')
      expect(suggestions).toHaveProperty('alternativeYachts')
      expect(suggestions).toHaveProperty('nearbySlots')
      
      expect(Array.isArray(suggestions.alternativeDates)).toBe(true)
      expect(Array.isArray(suggestions.alternativeYachts)).toBe(true)
      expect(Array.isArray(suggestions.nearbySlots)).toBe(true)
    })
  })

  describe('isBackToBack', () => {
    test('should detect back-to-back bookings', () => {
      const backToBackBooking = new BookingModel({
        yacht_id: 'spectre',
        start_datetime: new Date(2025, 5, 16), // Day after booking1 ends
        end_datetime: new Date(2025, 5, 19)
      })

      expect(booking1.isBackToBack(backToBackBooking)).toBe(true)
    })

    test('should not detect back-to-back for different yachts', () => {
      const differentYachtBooking = new BookingModel({
        yacht_id: 'disk-drive',
        start_datetime: new Date(2025, 5, 16),
        end_datetime: new Date(2025, 5, 19)
      })

      expect(booking1.isBackToBack(differentYachtBooking)).toBe(false)
    })

    test('should not detect back-to-back for non-adjacent dates', () => {
      const nonAdjacentBooking = new BookingModel({
        yacht_id: 'spectre',
        start_datetime: new Date(2025, 5, 18), // Gap between bookings
        end_datetime: new Date(2025, 5, 21)
      })

      expect(booking1.isBackToBack(nonAdjacentBooking)).toBe(false)
    })

    test('should detect reverse back-to-back', () => {
      const beforeBooking = new BookingModel({
        yacht_id: 'spectre',
        start_datetime: new Date(2025, 5, 7),
        end_datetime: new Date(2025, 5, 9) // Day before booking1 starts
      })

      expect(booking1.isBackToBack(beforeBooking)).toBe(true)
    })
  })

  describe('validateDates', () => {
    test('should validate booking dates', () => {
      const futureBooking = new BookingModel({
        start_datetime: new Date(2025, 7, 1),
        end_datetime: new Date(2025, 7, 5)
      })

      const result = futureBooking.validateDates({
        minDays: 1,
        maxDays: 30,
        allowPastDates: false
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.bookingDays).toBe(5)
    })

    test('should return validation errors for invalid dates', () => {
      const invalidBooking = new BookingModel({
        start_datetime: new Date(2025, 7, 5),
        end_datetime: new Date(2025, 7, 1) // End before start
      })

      const result = invalidBooking.validateDates()

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    test('should pass options to validation service', () => {
      const shortBooking = new BookingModel({
        start_datetime: new Date(2025, 7, 1),
        end_datetime: new Date(2025, 7, 1) // 1 day
      })

      const result = shortBooking.validateDates({
        minDays: 3
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Minimum booking duration is 3 days')
    })
  })

  describe('Integration with validation', () => {
    test('should validate and check conflicts together', () => {
      const newBooking = new BookingModel({
        yacht_id: 'arriva',
        customer_name: 'Integration Test',
        customer_email: 'integration@example.com',
        start_datetime: new Date(2025, 7, 1),
        end_datetime: new Date(2025, 7, 5),
        status: BookingStatus.PENDING
      })

      // Should pass validation
      expect(newBooking.validate()).toBe(true)
      
      // Should have no conflicts
      const conflicts = newBooking.checkConflicts(existingBookings)
      expect(conflicts.isAvailable).toBe(true)
      
      // Should be bookable
      expect(newBooking.canBeBooked(existingBookings)).toBe(true)
    })

    test('should handle booking with both validation errors and conflicts', () => {
      const problematicBooking = new BookingModel({
        yacht_id: 'spectre',
        customer_name: '', // Validation error
        customer_email: 'invalid',
        start_datetime: new Date(2025, 5, 12), // Conflict
        end_datetime: new Date(2025, 5, 16),
        status: BookingStatus.PENDING
      })

      // Should fail validation
      expect(problematicBooking.validate()).toBe(false)
      
      // Should have conflicts
      const conflicts = problematicBooking.checkConflicts(existingBookings)
      expect(conflicts.isAvailable).toBe(false)
      
      // Should not be bookable
      expect(problematicBooking.canBeBooked(existingBookings)).toBe(false)
    })
  })
})