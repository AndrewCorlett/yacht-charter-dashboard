/**
 * BookingService Tests
 * Comprehensive test suite for booking operations
 * 
 * @created 2025-06-26
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BookingService } from '../BookingService.js'
import { supabase } from '../supabaseClient.js'

// Mock Supabase client
vi.mock('../supabaseClient.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn()
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn()
    })),
    removeChannel: vi.fn()
  },
  TABLES: {
    BOOKINGS: 'bookings'
  },
  queryHelpers: {
    handleError: vi.fn(),
    dateRangeFilter: vi.fn((query) => query),
    paginate: vi.fn((query) => query),
    searchFilter: vi.fn((query) => query)
  }
}))

describe('BookingService', () => {
  let bookingService

  beforeEach(() => {
    bookingService = new BookingService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    bookingService.cleanup()
  })

  describe('createBooking', () => {
    it('should create a new booking successfully', async () => {
      const mockBookingData = {
        customer_first_name: 'John',
        customer_surname: 'Doe',
        customer_email: 'john@example.com',
        yacht_id: 'yacht-1',
        start_date: '2025-07-01',
        end_date: '2025-07-07'
      }

      const mockResponse = {
        id: '123',
        booking_number: 'BK-2025-0001',
        ...mockBookingData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      supabase.from().single.mockResolvedValueOnce({
        data: mockResponse,
        error: null
      })

      const result = await bookingService.createBooking(mockBookingData)

      expect(result).toBeDefined()
      expect(result.booking_number).toBeTruthy()
      expect(supabase.from).toHaveBeenCalledWith('bookings')
      expect(supabase.from().insert).toHaveBeenCalled()
    })

    it('should handle creation errors', async () => {
      const mockError = { message: 'Database error' }
      supabase.from().single.mockResolvedValueOnce({
        data: null,
        error: mockError
      })

      await expect(bookingService.createBooking({})).rejects.toThrow()
    })
  })

  describe('getBooking', () => {
    it('should retrieve a booking by ID', async () => {
      const mockBooking = {
        id: '123',
        customer_first_name: 'John',
        customer_surname: 'Doe'
      }

      supabase.from().single.mockResolvedValueOnce({
        data: mockBooking,
        error: null
      })

      const result = await bookingService.getBooking('123')

      expect(result).toBeDefined()
      expect(result.id).toBe('123')
      expect(supabase.from().eq).toHaveBeenCalledWith('id', '123')
    })

    it('should return null for non-existent booking', async () => {
      supabase.from().single.mockResolvedValueOnce({
        data: null,
        error: null
      })

      const result = await bookingService.getBooking('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getBookings', () => {
    it('should retrieve all bookings with filters', async () => {
      const mockBookings = [
        { id: '1', yacht_id: 'yacht-1' },
        { id: '2', yacht_id: 'yacht-1' }
      ]

      const mockQuery = {
        data: mockBookings,
        error: null,
        count: 2
      }

      supabase.from().order.mockResolvedValueOnce(mockQuery)

      const result = await bookingService.getBookings({
        yacht_id: 'yacht-1',
        page: 1,
        pageSize: 50
      })

      expect(result.bookings).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(supabase.from().eq).toHaveBeenCalledWith('yacht_id', 'yacht-1')
    })

    it('should apply search filters', async () => {
      supabase.from().order.mockResolvedValueOnce({
        data: [],
        error: null
      })

      await bookingService.getBookings({ search: 'John' })

      expect(queryHelpers.searchFilter).toHaveBeenCalled()
    })
  })

  describe('updateBooking', () => {
    it('should update a booking successfully', async () => {
      const mockExisting = {
        id: '123',
        change_history: []
      }

      const mockUpdated = {
        ...mockExisting,
        customer_phone: '+44 7700 900123'
      }

      // Mock getting existing booking
      supabase.from().single.mockResolvedValueOnce({
        data: mockExisting,
        error: null
      })

      // Mock update
      supabase.from().single.mockResolvedValueOnce({
        data: mockUpdated,
        error: null
      })

      const result = await bookingService.updateBooking('123', {
        customer_phone: '+44 7700 900123'
      })

      expect(result.customer_phone).toBe('+44 7700 900123')
      expect(supabase.from().update).toHaveBeenCalled()
    })

    it('should remove read-only fields', async () => {
      supabase.from().single.mockResolvedValue({
        data: { id: '123' },
        error: null
      })

      await bookingService.updateBooking('123', {
        id: 'should-be-removed',
        created_at: 'should-be-removed',
        customer_phone: '+44 7700 900123'
      })

      const updateCall = supabase.from().update.mock.calls[0][0]
      expect(updateCall.id).toBeUndefined()
      expect(updateCall.created_at).toBeUndefined()
      expect(updateCall.customer_phone).toBeDefined()
    })
  })

  describe('deleteBooking', () => {
    it('should delete a booking successfully', async () => {
      const mockQuery = {
        error: null
      }

      supabase.from().eq.mockResolvedValueOnce(mockQuery)

      const result = await bookingService.deleteBooking('123')

      expect(result).toBe(true)
      expect(supabase.from().delete).toHaveBeenCalled()
      expect(supabase.from().eq).toHaveBeenCalledWith('id', '123')
    })
  })

  describe('checkConflicts', () => {
    it('should detect booking conflicts', async () => {
      const mockConflicts = [
        {
          id: '456',
          yacht_id: 'yacht-1',
          start_date: '2025-07-05',
          end_date: '2025-07-10'
        }
      ]

      supabase.from().neq.mockResolvedValueOnce({
        data: mockConflicts,
        error: null
      })

      const conflicts = await bookingService.checkConflicts({
        yacht_id: 'yacht-1',
        start_date: '2025-07-03',
        end_date: '2025-07-08'
      }, '123')

      expect(conflicts).toHaveLength(1)
      expect(supabase.from().eq).toHaveBeenCalledWith('yacht_id', 'yacht-1')
      expect(supabase.from().neq).toHaveBeenCalledWith('id', '123')
    })

    it('should return empty array when no conflicts', async () => {
      supabase.from().neq.mockResolvedValueOnce({
        data: [],
        error: null
      })

      const conflicts = await bookingService.checkConflicts({
        yacht_id: 'yacht-1',
        start_date: '2025-07-01',
        end_date: '2025-07-07'
      })

      expect(conflicts).toHaveLength(0)
    })
  })

  describe('validateBookingData', () => {
    it('should validate required fields', () => {
      const result = bookingService.validateBookingData({})

      expect(result.isValid).toBe(false)
      expect(result.errors.customer_first_name).toBeDefined()
      expect(result.errors.customer_surname).toBeDefined()
      expect(result.errors.customer_email).toBeDefined()
      expect(result.errors.yacht_id).toBeDefined()
      expect(result.errors.start_date).toBeDefined()
      expect(result.errors.end_date).toBeDefined()
    })

    it('should validate email format', () => {
      const result = bookingService.validateBookingData({
        customer_email: 'invalid-email'
      })

      expect(result.isValid).toBe(false)
      expect(result.errors.customer_email).toContain('Invalid email')
    })

    it('should validate date logic', () => {
      const result = bookingService.validateBookingData({
        start_date: '2025-07-07',
        end_date: '2025-07-01'
      })

      expect(result.isValid).toBe(false)
      expect(result.errors.end_date).toContain('must be after start date')
    })

    it('should pass validation for valid data', () => {
      const result = bookingService.validateBookingData({
        customer_first_name: 'John',
        customer_surname: 'Doe',
        customer_email: 'john@example.com',
        yacht_id: 'yacht-1',
        start_date: '2025-07-01',
        end_date: '2025-07-07'
      })

      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })
  })

  describe('subscribeToBookings', () => {
    it('should create a real-time subscription', () => {
      const callback = vi.fn()
      const unsubscribe = bookingService.subscribeToBookings(callback)

      expect(supabase.channel).toHaveBeenCalled()
      expect(typeof unsubscribe).toBe('function')
    })

    it('should handle subscription cleanup', () => {
      const callback = vi.fn()
      const unsubscribe = bookingService.subscribeToBookings(callback)
      
      unsubscribe()

      expect(bookingService.subscriptions.size).toBe(0)
    })
  })

  describe('generateBookingNumber', () => {
    it('should generate unique booking numbers', async () => {
      const number1 = await bookingService.generateBookingNumber()
      const number2 = await bookingService.generateBookingNumber()

      expect(number1).toMatch(/^BK-\d{4}-\d{4}$/)
      expect(number2).toMatch(/^BK-\d{4}-\d{4}$/)
      expect(number1).not.toBe(number2)
    })
  })

  describe('updateChangeHistory', () => {
    it('should track changes in history', () => {
      const existingHistory = []
      const changes = {
        customer_phone: '+44 7700 900123',
        customer_email: 'new@example.com'
      }

      const history = bookingService.updateChangeHistory(existingHistory, changes)

      expect(history).toHaveLength(1)
      expect(history[0].changes).toContain('customer_phone')
      expect(history[0].changes).toContain('customer_email')
      expect(history[0].timestamp).toBeDefined()
    })

    it('should limit history to 50 entries', () => {
      const existingHistory = Array(60).fill({})
      const history = bookingService.updateChangeHistory(existingHistory, {})

      expect(history).toHaveLength(50)
    })
  })
})