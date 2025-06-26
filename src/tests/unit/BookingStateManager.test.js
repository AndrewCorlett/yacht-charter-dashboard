/**
 * BookingStateManager Tests
 * 
 * Comprehensive tests for the centralized booking state management system.
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { BookingStateManager } from '../../services/BookingStateManager'
import { BookingModel, BookingStatus } from '../../models/core/BookingModel'

describe('BookingStateManager', () => {
  let stateManager
  let mockSubscriber

  beforeEach(() => {
    stateManager = new BookingStateManager()
    mockSubscriber = vi.fn()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('subscription management', () => {
    it('should allow subscribing to state changes', () => {
      const unsubscribe = stateManager.subscribe(mockSubscriber)
      
      // Trigger a change
      stateManager.setBookings([])
      
      expect(mockSubscriber).toHaveBeenCalledWith({
        type: 'BULK_UPDATE',
        bookings: []
      })
      
      // Test unsubscribe
      unsubscribe()
      stateManager.setBookings([])
      
      // Should not be called again
      expect(mockSubscriber).toHaveBeenCalledTimes(1)
    })

    it('should handle subscriber errors gracefully', () => {
      const errorSubscriber = vi.fn(() => {
        throw new Error('Subscriber error')
      })
      
      stateManager.subscribe(errorSubscriber)
      
      // Should not throw
      expect(() => {
        stateManager.setBookings([])
      }).not.toThrow()
      
      expect(errorSubscriber).toHaveBeenCalled()
    })
  })

  describe('booking management', () => {
    const mockBookingData = {
      id: 'test-1',
      yacht_id: 'spectre',
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      start_datetime: new Date('2025-07-01'),
      end_datetime: new Date('2025-07-03'),
      status: BookingStatus.CONFIRMED
    }

    it('should set initial bookings', () => {
      const bookings = [new BookingModel(mockBookingData)]
      stateManager.subscribe(mockSubscriber)
      
      stateManager.setBookings(bookings)
      
      expect(stateManager.getAllBookings()).toHaveLength(1)
      expect(stateManager.getBooking('test-1')).toBeInstanceOf(BookingModel)
      expect(mockSubscriber).toHaveBeenCalledWith({
        type: 'BULK_UPDATE',
        bookings
      })
    })

    it('should get bookings for specific yacht', () => {
      const bookings = [
        new BookingModel({ ...mockBookingData, id: 'test-1', yacht_id: 'spectre' }),
        new BookingModel({ ...mockBookingData, id: 'test-2', yacht_id: 'arriva' })
      ]
      stateManager.setBookings(bookings)
      
      const spectreBookings = stateManager.getBookingsForYacht('spectre')
      expect(spectreBookings).toHaveLength(1)
      expect(spectreBookings[0].yacht_id).toBe('spectre')
    })

    it('should get bookings in date range', () => {
      const bookings = [
        new BookingModel({ 
          ...mockBookingData, 
          id: 'test-1', 
          start_datetime: new Date('2025-07-01'),
          end_datetime: new Date('2025-07-03')
        }),
        new BookingModel({ 
          ...mockBookingData, 
          id: 'test-2', 
          start_datetime: new Date('2025-08-01'),
          end_datetime: new Date('2025-08-03')
        })
      ]
      stateManager.setBookings(bookings)
      
      const julyBookings = stateManager.getBookingsInRange(
        new Date('2025-07-01'),
        new Date('2025-07-31')
      )
      
      expect(julyBookings).toHaveLength(1)
      expect(julyBookings[0].id).toBe('test-1')
    })
  })

  describe('CRUD operations', () => {
    beforeEach(() => {
      stateManager.subscribe(mockSubscriber)
    })

    it('should create a new booking with optimistic updates', async () => {
      const bookingData = {
        yacht_id: 'spectre',
        customer_name: 'New Customer',
        customer_email: 'new@example.com',
        start_datetime: new Date('2025-07-01'),
        end_datetime: new Date('2025-07-03'),
        status: BookingStatus.PENDING
      }

      const promise = stateManager.createBooking(bookingData)
      
      // Should apply optimistic update immediately
      expect(stateManager.getAllBookings()).toHaveLength(1)
      
      // Fast-forward past API simulation
      vi.advanceTimersByTime(1100)
      const result = await promise
      
      expect(result).toBeInstanceOf(BookingModel)
      expect(result.customer_name).toBe('New Customer')
      expect(mockSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'OPTIMISTIC_UPDATE'
        })
      )
      expect(mockSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'BOOKING_CREATED'
        })
      )
    })

    it('should update existing booking', async () => {
      const booking = new BookingModel({
        id: 'test-1',
        yacht_id: 'spectre',
        customer_name: 'Original Customer',
        customer_email: 'original@example.com',
        start_datetime: new Date('2025-07-01'),
        end_datetime: new Date('2025-07-03'),
        status: BookingStatus.PENDING
      })
      
      stateManager.setBookings([booking])
      mockSubscriber.mockClear()
      
      const promise = stateManager.updateBooking('test-1', {
        customer_name: 'Updated Customer'
      })
      
      vi.advanceTimersByTime(900)
      const result = await promise
      
      expect(result.customer_name).toBe('Updated Customer')
      expect(mockSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'BOOKING_UPDATED'
        })
      )
    })

    it('should delete booking', async () => {
      const booking = new BookingModel({
        id: 'test-1',
        yacht_id: 'spectre',
        customer_name: 'To Delete',
        customer_email: 'delete@example.com',
        start_datetime: new Date('2025-07-01'),
        end_datetime: new Date('2025-07-03'),
        status: BookingStatus.PENDING
      })
      
      stateManager.setBookings([booking])
      mockSubscriber.mockClear()
      
      const promise = stateManager.deleteBooking('test-1')
      
      vi.advanceTimersByTime(700)
      const result = await promise
      
      expect(result).toBe(true)
      expect(stateManager.getBooking('test-1')).toBeNull()
      expect(mockSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'BOOKING_DELETED',
          bookingId: 'test-1'
        })
      )
    })

    it('should handle API errors and rollback optimistic updates', async () => {
      // Mock API failure
      vi.spyOn(Math, 'random').mockReturnValue(0.01) // Force API error
      
      const bookingData = {
        yacht_id: 'spectre',
        customer_name: 'Error Customer',
        customer_email: 'error@example.com',
        start_datetime: new Date('2025-07-01'),
        end_datetime: new Date('2025-07-03'),
        status: BookingStatus.PENDING
      }

      const promise = stateManager.createBooking(bookingData)
      
      // Should apply optimistic update first
      expect(stateManager.getAllBookings()).toHaveLength(1)
      
      vi.advanceTimersByTime(1100)
      
      await expect(promise).rejects.toThrow('API Error: CREATE operation failed')
      
      // Should rollback optimistic update
      expect(stateManager.getAllBookings()).toHaveLength(0)
      expect(mockSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'OPTIMISTIC_ROLLBACK'
        })
      )
    })
  })

  describe('optimistic updates', () => {
    it('should apply and clear optimistic updates', () => {
      const booking = new BookingModel({
        id: 'test-1',
        yacht_id: 'spectre',
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        start_datetime: new Date('2025-07-01'),
        end_datetime: new Date('2025-07-03'),
        status: BookingStatus.PENDING
      })

      stateManager.applyOptimisticUpdate('op-1', 'CREATE', booking)
      
      expect(stateManager.getBooking('test-1')).toBe(booking)
      expect(stateManager.optimisticUpdates.has('op-1')).toBe(true)
      
      stateManager.clearOptimisticUpdate('op-1')
      expect(stateManager.optimisticUpdates.has('op-1')).toBe(false)
    })

    it('should rollback optimistic updates', () => {
      const originalBooking = new BookingModel({
        id: 'test-1',
        yacht_id: 'spectre',
        customer_name: 'Original Customer',
        customer_email: 'original@example.com',
        start_datetime: new Date('2025-07-01'),
        end_datetime: new Date('2025-07-03'),
        status: BookingStatus.PENDING
      })

      const updatedBooking = new BookingModel({
        ...originalBooking.toDatabase(),
        customer_name: 'Updated Customer'
      })

      stateManager.setBookings([originalBooking])
      stateManager.applyOptimisticUpdate('op-1', 'UPDATE', updatedBooking, originalBooking)
      
      expect(stateManager.getBooking('test-1').customer_name).toBe('Updated Customer')
      
      stateManager.rollbackOptimisticUpdate('op-1')
      expect(stateManager.getBooking('test-1').customer_name).toBe('Original Customer')
    })
  })

  describe('undo functionality', () => {
    it('should add operations to history', () => {
      const booking = new BookingModel({
        id: 'test-1',
        yacht_id: 'spectre',
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        start_datetime: new Date('2025-07-01'),
        end_datetime: new Date('2025-07-03'),
        status: BookingStatus.PENDING
      })

      stateManager.addToHistory('CREATE', booking)
      
      const history = stateManager.getOperationHistory()
      expect(history).toHaveLength(1)
      expect(history[0].type).toBe('CREATE')
      expect(history[0].newData.id).toBe('test-1')
    })

    it('should limit history size', () => {
      const booking = new BookingModel({
        yacht_id: 'spectre',
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        start_datetime: new Date('2025-07-01'),
        end_datetime: new Date('2025-07-03'),
        status: BookingStatus.PENDING
      })

      // Add more than max history size
      for (let i = 0; i < 55; i++) {
        stateManager.addToHistory('CREATE', new BookingModel({
          ...booking.toDatabase(),
          id: `test-${i}`
        }))
      }
      
      const history = stateManager.getOperationHistory()
      expect(history).toHaveLength(50) // maxHistorySize
    })
  })

  describe('batch operations', () => {
    it('should perform batch updates', async () => {
      const operations = [
        {
          id: 'op-1',
          type: 'CREATE',
          data: {
            yacht_id: 'spectre',
            customer_name: 'Customer 1',
            customer_email: 'customer1@example.com',
            start_datetime: new Date('2025-07-01'),
            end_datetime: new Date('2025-07-03'),
            status: BookingStatus.PENDING
          }
        },
        {
          id: 'op-2',
          type: 'CREATE',
          data: {
            yacht_id: 'arriva',
            customer_name: 'Customer 2',
            customer_email: 'customer2@example.com',
            start_datetime: new Date('2025-07-05'),
            end_datetime: new Date('2025-07-07'),
            status: BookingStatus.PENDING
          }
        }
      ]

      stateManager.subscribe(mockSubscriber)
      
      const promise = stateManager.batchUpdate(operations)
      
      vi.advanceTimersByTime(1100)
      const results = await promise
      
      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
      expect(stateManager.getAllBookings()).toHaveLength(2)
      
      expect(mockSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'BATCH_UPDATE_COMPLETE'
        })
      )
    })
  })

  describe('state statistics', () => {
    it('should provide state statistics', () => {
      const booking = new BookingModel({
        id: 'test-1',
        yacht_id: 'spectre',
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        start_datetime: new Date('2025-07-01'),
        end_datetime: new Date('2025-07-03'),
        status: BookingStatus.PENDING
      })

      stateManager.setBookings([booking])
      stateManager.subscribe(mockSubscriber)
      stateManager.applyOptimisticUpdate('op-1', 'UPDATE', booking)
      stateManager.addToHistory('CREATE', booking)
      
      const stats = stateManager.getStateStats()
      
      expect(stats.totalBookings).toBe(1)
      expect(stats.optimisticUpdates).toBe(1)
      expect(stats.historySize).toBe(1)
      expect(stats.subscribers).toBe(1)
    })
  })

  describe('clear state', () => {
    it('should clear all state', () => {
      const booking = new BookingModel({
        id: 'test-1',
        yacht_id: 'spectre',
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        start_datetime: new Date('2025-07-01'),
        end_datetime: new Date('2025-07-03'),
        status: BookingStatus.PENDING
      })

      stateManager.setBookings([booking])
      stateManager.subscribe(mockSubscriber)
      stateManager.applyOptimisticUpdate('op-1', 'UPDATE', booking)
      stateManager.addToHistory('CREATE', booking)
      
      stateManager.clear()
      
      const stats = stateManager.getStateStats()
      expect(stats.totalBookings).toBe(0)
      expect(stats.optimisticUpdates).toBe(0)
      expect(stats.historySize).toBe(0)
      
      expect(mockSubscriber).toHaveBeenCalledWith({
        type: 'STATE_CLEARED'
      })
    })
  })
})