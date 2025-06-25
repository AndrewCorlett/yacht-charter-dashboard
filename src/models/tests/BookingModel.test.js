/**
 * BookingModel Unit Tests
 * 
 * Comprehensive tests for BookingModel class covering validation,
 * data transformation, and business logic methods.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach } from 'vitest'
import BookingModel, { BookingStatus, BookingType } from '../core/BookingModel.js'

describe('BookingModel', () => {
  let validBookingData

  beforeEach(() => {
    validBookingData = {
      summary: 'Smith Family Charter',
      yacht_id: 'spectre',
      customer_name: 'John Smith',
      customer_email: 'john.smith@email.com',
      customer_phone: '+44 7123 456789',
      start_datetime: '2024-07-15T10:00:00Z',
      end_datetime: '2024-07-18T16:00:00Z',
      total_value: 5000,
      deposit_amount: 1500,
      type: BookingType.CHARTER
    }
  })

  describe('Constructor', () => {
    it('should create a booking with valid data', () => {
      const booking = new BookingModel(validBookingData)
      
      expect(booking.summary).toBe('Smith Family Charter')
      expect(booking.yacht_id).toBe('spectre')
      expect(booking.customer_name).toBe('John Smith')
      expect(booking.customer_email).toBe('john.smith@email.com')
      expect(booking.total_value).toBe(5000)
      expect(booking.deposit_amount).toBe(1500)
    })

    it('should generate ID and booking number automatically', () => {
      const booking = new BookingModel(validBookingData)
      
      expect(booking.id).toBeTruthy()
      expect(booking.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      expect(booking.booking_no).toBeTruthy()
      expect(booking.booking_no).toMatch(/^BK\d{5}\d{3}$/)
    })

    it('should generate iCal UID automatically', () => {
      const booking = new BookingModel(validBookingData)
      
      expect(booking.ical_uid).toBeTruthy()
      expect(booking.ical_uid).toContain('@seascape-yachts.com')
    })

    it('should set default values for optional fields', () => {
      const booking = new BookingModel(validBookingData)
      
      expect(booking.status).toBe(BookingStatus.PENDING)
      expect(booking.type).toBe(BookingType.CHARTER)
      expect(booking.deposit_paid).toBe(false)
      expect(booking.created_at).toBeInstanceOf(Date)
      expect(booking.modified_at).toBeInstanceOf(Date)
    })
  })

  describe('Validation', () => {
    it('should validate successfully with complete data', () => {
      const booking = new BookingModel(validBookingData)
      const isValid = booking.validate()
      
      expect(isValid).toBe(true)
      expect(booking.hasErrors()).toBe(false)
    })

    it('should require summary', () => {
      delete validBookingData.summary
      const booking = new BookingModel(validBookingData)
      const isValid = booking.validate()
      
      expect(isValid).toBe(false)
      expect(booking.getError('summary')).toBe('Booking summary is required')
    })

    it('should require yacht_id', () => {
      delete validBookingData.yacht_id
      const booking = new BookingModel(validBookingData)
      const isValid = booking.validate()
      
      expect(isValid).toBe(false)
      expect(booking.getError('yacht_id')).toBe('Yacht selection is required')
    })

    it('should require customer_name', () => {
      delete validBookingData.customer_name
      const booking = new BookingModel(validBookingData)
      const isValid = booking.validate()
      
      expect(isValid).toBe(false)
      expect(booking.getError('customer_name')).toBe('Customer name is required')
    })

    it('should validate email format', () => {
      validBookingData.customer_email = 'invalid-email'
      const booking = new BookingModel(validBookingData)
      const isValid = booking.validate()
      
      expect(isValid).toBe(false)
      expect(booking.getError('customer_email')).toBe('Invalid email format')
    })

    it('should validate date range', () => {
      validBookingData.end_datetime = '2024-07-14T16:00:00Z' // Before start date
      const booking = new BookingModel(validBookingData)
      const isValid = booking.validate()
      
      expect(isValid).toBe(false)
      expect(booking.getError('end_datetime')).toBe('End date must be after start date')
    })

    it('should validate financial amounts', () => {
      validBookingData.total_value = -100
      const booking = new BookingModel(validBookingData)
      const isValid = booking.validate()
      
      expect(isValid).toBe(false)
      expect(booking.getError('total_value')).toBe('Total value cannot be negative')
    })

    it('should validate deposit does not exceed total', () => {
      validBookingData.deposit_amount = 6000 // More than total_value
      const booking = new BookingModel(validBookingData)
      const isValid = booking.validate()
      
      expect(isValid).toBe(false)
      expect(booking.getError('deposit_amount')).toBe('Deposit cannot exceed total value')
    })

    it('should validate phone number format', () => {
      validBookingData.customer_phone = '123' // Too short
      const booking = new BookingModel(validBookingData)
      const isValid = booking.validate()
      
      expect(isValid).toBe(false)
      expect(booking.getError('customer_phone')).toBe('Invalid phone number format')
    })

    it('should validate booking status', () => {
      validBookingData.status = 'invalid_status'
      const booking = new BookingModel(validBookingData)
      const isValid = booking.validate()
      
      expect(isValid).toBe(false)
      expect(booking.getError('status')).toBe('Invalid booking status')
    })
  })

  describe('Update Method', () => {
    it('should update fields and trigger validation', () => {
      const booking = new BookingModel(validBookingData)
      const originalModified = booking.modified_at
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        const success = booking.update({
          customer_name: 'Jane Smith',
          total_value: 5500
        })
        
        expect(success).toBe(true)
        expect(booking.customer_name).toBe('Jane Smith')
        expect(booking.total_value).toBe(5500)
        expect(booking.modified_at).not.toEqual(originalModified)
      }, 10)
    })

    it('should fail update with invalid data', () => {
      const booking = new BookingModel(validBookingData)
      
      const success = booking.update({
        customer_email: 'invalid-email'
      })
      
      expect(success).toBe(false)
      expect(booking.hasErrors()).toBe(true)
    })
  })

  describe('Data Transformation', () => {
    let booking

    beforeEach(() => {
      booking = new BookingModel(validBookingData)
    })

    it('should convert to database format', () => {
      const dbFormat = booking.toDatabase()
      
      expect(dbFormat.id).toBe(booking.id)
      expect(dbFormat.summary).toBe(booking.summary)
      expect(dbFormat.start_datetime).toContain('2024-07-15T10:00:00')
      expect(dbFormat.end_datetime).toContain('2024-07-18T16:00:00')
      expect(dbFormat.total_value).toBe(5000)
    })

    it('should convert to frontend format', () => {
      const frontendFormat = booking.toFrontend()
      
      expect(frontendFormat.id).toBe(booking.id)
      expect(frontendFormat.customerName).toBe(booking.customer_name)
      expect(frontendFormat.startDate).toBe('2024-07-15')
      expect(frontendFormat.endDate).toBe('2024-07-18')
      expect(frontendFormat.totalValue).toBe(5000)
      expect(frontendFormat.depositPaid).toBe(false)
    })

    it('should convert to iCS format', () => {
      const icsFormat = booking.toICS()
      
      expect(icsFormat.uid).toBe(booking.ical_uid)
      expect(icsFormat.summary).toBe(booking.summary)
      expect(icsFormat.dtstart).toEqual(booking.start_datetime)
      expect(icsFormat.dtend).toEqual(booking.end_datetime)
      expect(icsFormat.status).toBe('TENTATIVE') // Pending status maps to TENTATIVE
    })
  })

  describe('Business Logic Methods', () => {
    let booking

    beforeEach(() => {
      booking = new BookingModel(validBookingData)
    })

    it('should calculate duration in days', () => {
      const duration = booking.getDurationDays()
      expect(duration).toBe(4) // 3.25 days rounded up to 4
    })

    it('should determine if booking is active', () => {
      expect(booking.isActive()).toBe(true)
      
      booking.status = BookingStatus.CANCELLED
      expect(booking.isActive()).toBe(false)
    })

    it('should determine if booking is in the past', () => {
      expect(booking.isPast()).toBe(false)
      
      booking.end_datetime = new Date('2020-01-01')
      expect(booking.isPast()).toBe(true)
    })

    it('should determine if booking is current', () => {
      expect(booking.isCurrent()).toBe(false)
      
      const now = new Date()
      booking.start_datetime = new Date(now.getTime() - 24 * 60 * 60 * 1000) // Yesterday
      booking.end_datetime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Tomorrow
      expect(booking.isCurrent()).toBe(true)
    })

    it('should determine if booking is future', () => {
      expect(booking.isFuture()).toBe(true)
      
      booking.start_datetime = new Date('2020-01-01')
      expect(booking.isFuture()).toBe(false)
    })

    it('should return appropriate display color', () => {
      expect(booking.getDisplayColor()).toBe('#FF9500') // Pending status
      
      booking.status = BookingStatus.CONFIRMED
      expect(booking.getDisplayColor()).toBe('#007AFF') // Confirmed status
      
      booking.type = BookingType.MAINTENANCE
      expect(booking.getDisplayColor()).toBe('#FF2D92') // Maintenance type
    })
  })

  describe('Static Factory Methods', () => {
    it('should create from database record', () => {
      const dbRecord = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        summary: 'Database Booking',
        yacht_id: 'test-yacht',
        customer_name: 'Database Customer',
        customer_email: 'db@test.com',
        start_datetime: '2024-07-15T10:00:00Z',
        end_datetime: '2024-07-18T16:00:00Z'
      }
      
      const booking = BookingModel.fromDatabase(dbRecord)
      
      expect(booking).toBeInstanceOf(BookingModel)
      expect(booking.id).toBe(dbRecord.id)
      expect(booking.summary).toBe(dbRecord.summary)
    })

    it('should create from frontend data', () => {
      const formData = {
        customerName: 'Form Customer',
        customerEmail: 'form@test.com',
        yachtId: 'form-yacht',
        startDate: '2024-07-15',
        endDate: '2024-07-18',
        tripType: 'charter',
        totalValue: 3000
      }
      
      const booking = BookingModel.fromFrontend(formData)
      
      expect(booking).toBeInstanceOf(BookingModel)
      expect(booking.customer_name).toBe(formData.customerName)
      expect(booking.yacht_id).toBe(formData.yachtId)
      expect(booking.type).toBe(formData.tripType)
    })
  })

  describe('Clone Method', () => {
    it('should create a copy with new ID', () => {
      const original = new BookingModel(validBookingData)
      const clone = original.clone()
      
      expect(clone).toBeInstanceOf(BookingModel)
      expect(clone.id).not.toBe(original.id)
      expect(clone.ical_uid).not.toBe(original.ical_uid)
      expect(clone.booking_no).not.toBe(original.booking_no)
      expect(clone.customer_name).toBe(original.customer_name)
      expect(clone.yacht_id).toBe(original.yacht_id)
    })
  })

  describe('Error Handling', () => {
    it('should collect multiple validation errors', () => {
      const invalidData = {
        summary: '', // Required
        customer_email: 'invalid', // Invalid format
        total_value: -100, // Negative
        start_datetime: '2024-07-18T10:00:00Z',
        end_datetime: '2024-07-15T16:00:00Z' // Before start
      }
      
      const booking = new BookingModel(invalidData)
      const isValid = booking.validate()
      const errors = booking.getErrors()
      
      expect(isValid).toBe(false)
      expect(Object.keys(errors)).toHaveLength(4)
      expect(errors.summary).toBeTruthy()
      expect(errors.customer_email).toBeTruthy()
      expect(errors.total_value).toBeTruthy()
      expect(errors.end_datetime).toBeTruthy()
    })

    it('should clear errors after successful validation', () => {
      const booking = new BookingModel({ summary: '' }) // Invalid
      booking.validate()
      expect(booking.hasErrors()).toBe(true)
      
      booking.summary = 'Valid Summary'
      booking.yacht_id = 'valid-yacht'
      booking.customer_name = 'Valid Name'
      booking.customer_email = 'valid@email.com'
      booking.start_datetime = new Date('2024-07-15')
      booking.end_datetime = new Date('2024-07-18')
      
      booking.validate()
      expect(booking.hasErrors()).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle null/undefined dates gracefully', () => {
      const booking = new BookingModel({
        ...validBookingData,
        start_datetime: null,
        end_datetime: undefined
      })
      
      expect(booking.start_datetime).toBeNull()
      expect(booking.end_datetime).toBeNull()
      expect(booking.getDurationDays()).toBe(0)
    })

    it('should handle null/undefined financial values', () => {
      const booking = new BookingModel({
        ...validBookingData,
        total_value: null,
        deposit_amount: undefined
      })
      
      expect(booking.total_value).toBeNull()
      expect(booking.deposit_amount).toBeNull()
      expect(booking.validate()).toBe(true) // Should still be valid
    })

    it('should handle empty strings for optional fields', () => {
      const booking = new BookingModel({
        ...validBookingData,
        customer_phone: '',
        trip_no: '',
        description: ''
      })
      
      expect(booking.customer_phone).toBe('')
      expect(booking.trip_no).toBe('')
      expect(booking.description).toBe('')
      expect(booking.validate()).toBe(true)
    })
  })
})