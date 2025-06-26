/**
 * BookingContext Tests
 * 
 * Tests for the React Context and hooks for booking state management.
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, renderHook, act, waitFor } from '@testing-library/react'
import { 
  BookingProvider, 
  useBookingState, 
  useBookingOperations, 
  useBookingQueries,
  useBookings 
} from '../../contexts/BookingContext'
import { BookingModel, BookingStatus } from '../../models/core/BookingModel'

// Mock the BookingStateManager
vi.mock('../../services/BookingStateManager', () => ({
  default: {
    subscribe: vi.fn(),
    getAllBookings: vi.fn(() => []),
    setBookings: vi.fn(),
    createBooking: vi.fn(),
    updateBooking: vi.fn(),
    deleteBooking: vi.fn(),
    moveBooking: vi.fn(),
    batchUpdate: vi.fn(),
    undoLastOperation: vi.fn(),
    getDateAvailability: vi.fn(),
    getBookingsInRange: vi.fn()
  }
}))

import bookingStateManager from '../../services/BookingStateManager'

describe('BookingContext', () => {
  const mockBooking = new BookingModel({
    id: 'test-1',
    yacht_id: 'spectre',
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    start_datetime: new Date('2025-07-01'),
    end_datetime: new Date('2025-07-03'),
    status: BookingStatus.CONFIRMED
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('BookingProvider', () => {
    it('should provide initial bookings', () => {
      const initialBookings = [mockBooking]
      
      const { result } = renderHook(() => useBookingState(), {
        wrapper: ({ children }) => (
          <BookingProvider initialBookings={initialBookings}>
            {children}
          </BookingProvider>
        )
      })

      expect(bookingStateManager.setBookings).toHaveBeenCalledWith(initialBookings)
      expect(result.current.bookings).toEqual(initialBookings)
    })

    it('should throw error when hooks used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = vi.fn()

      expect(() => {
        renderHook(() => useBookingState())
      }).toThrow('useBookingState must be used within a BookingProvider')

      expect(() => {
        renderHook(() => useBookingOperations())
      }).toThrow('useBookingDispatch must be used within a BookingProvider')

      console.error = originalError
    })

    it('should subscribe to state manager updates on mount', () => {
      renderHook(() => useBookingState(), {
        wrapper: ({ children }) => (
          <BookingProvider>{children}</BookingProvider>
        )
      })

      expect(bookingStateManager.subscribe).toHaveBeenCalled()
    })
  })

  describe('useBookingOperations', () => {
    let result

    beforeEach(() => {
      const wrapper = ({ children }) => (
        <BookingProvider>{children}</BookingProvider>
      )
      
      result = renderHook(() => useBookingOperations(), { wrapper }).result
    })

    it('should create booking successfully', async () => {
      const newBooking = { ...mockBooking.toDatabase(), id: 'new-booking' }
      bookingStateManager.createBooking.mockResolvedValue(new BookingModel(newBooking))

      await act(async () => {
        await result.current.createBooking(newBooking)
      })

      expect(bookingStateManager.createBooking).toHaveBeenCalledWith(newBooking, {})
    })

    it('should handle booking creation errors', async () => {
      const error = new Error('Creation failed')
      bookingStateManager.createBooking.mockRejectedValue(error)

      await act(async () => {
        try {
          await result.current.createBooking({})
        } catch (e) {
          expect(e).toBe(error)
        }
      })

      expect(bookingStateManager.createBooking).toHaveBeenCalled()
    })

    it('should update booking successfully', async () => {
      const updates = { customer_name: 'Updated Customer' }
      const updatedBooking = new BookingModel({ ...mockBooking.toDatabase(), ...updates })
      bookingStateManager.updateBooking.mockResolvedValue(updatedBooking)

      await act(async () => {
        await result.current.updateBooking('test-1', updates)
      })

      expect(bookingStateManager.updateBooking).toHaveBeenCalledWith('test-1', updates, {})
    })

    it('should delete booking successfully', async () => {
      bookingStateManager.deleteBooking.mockResolvedValue(true)

      await act(async () => {
        await result.current.deleteBooking('test-1')
      })

      expect(bookingStateManager.deleteBooking).toHaveBeenCalledWith('test-1', {})
    })

    it('should move booking successfully', async () => {
      const newLocation = {
        yachtId: 'arriva',
        startDate: new Date('2025-07-05'),
        endDate: new Date('2025-07-07')
      }
      const movedBooking = new BookingModel({ ...mockBooking.toDatabase(), yacht_id: 'arriva' })
      bookingStateManager.moveBooking.mockResolvedValue(movedBooking)

      await act(async () => {
        await result.current.moveBooking('test-1', newLocation)
      })

      expect(bookingStateManager.moveBooking).toHaveBeenCalledWith('test-1', newLocation, {})
    })

    it('should perform batch updates', async () => {
      const operations = [
        { type: 'CREATE', data: mockBooking.toDatabase() }
      ]
      const results = [{ success: true, data: mockBooking }]
      bookingStateManager.batchUpdate.mockResolvedValue(results)

      await act(async () => {
        await result.current.batchUpdate(operations)
      })

      expect(bookingStateManager.batchUpdate).toHaveBeenCalledWith(operations, {})
    })

    it('should undo last operation', async () => {
      bookingStateManager.undoLastOperation.mockResolvedValue(true)

      await act(async () => {
        await result.current.undoLastOperation()
      })

      expect(bookingStateManager.undoLastOperation).toHaveBeenCalled()
    })

    it('should manage loading state during operations', async () => {
      bookingStateManager.createBooking.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockBooking), 100))
      )

      const promise = act(async () => {
        result.current.createBooking({})
      })

      // Should be loading initially
      expect(result.current.loading).toBe(true)

      vi.advanceTimersByTime(150)
      await promise

      // Should not be loading after completion
      expect(result.current.loading).toBe(false)
    })
  })

  describe('useBookingQueries', () => {
    let result

    beforeEach(() => {
      const wrapper = ({ children }) => (
        <BookingProvider initialBookings={[mockBooking]}>
          {children}
        </BookingProvider>
      )
      
      result = renderHook(() => useBookingQueries(), { wrapper }).result
    })

    it('should get all bookings', () => {
      const allBookings = result.current.getAllBookings()
      expect(allBookings).toEqual([mockBooking])
    })

    it('should get booking by ID', () => {
      const booking = result.current.getBooking('test-1')
      expect(booking).toEqual(mockBooking)
      
      const nonExistent = result.current.getBooking('non-existent')
      expect(nonExistent).toBeNull()
    })

    it('should get bookings for yacht', () => {
      const spectreBookings = result.current.getBookingsForYacht('spectre')
      expect(spectreBookings).toEqual([mockBooking])
      
      const arrivaBookings = result.current.getBookingsForYacht('arriva')
      expect(arrivaBookings).toEqual([])
    })

    it('should get bookings in range', () => {
      const mockAvailability = { isAvailable: true, status: 'available' }
      bookingStateManager.getBookingsInRange.mockReturnValue([mockBooking])

      const bookings = result.current.getBookingsInRange(
        new Date('2025-07-01'),
        new Date('2025-07-31')
      )

      expect(bookingStateManager.getBookingsInRange).toHaveBeenCalledWith(
        new Date('2025-07-01'),
        new Date('2025-07-31'),
        null
      )
    })

    it('should get date availability', () => {
      const mockAvailability = { isAvailable: true, status: 'available' }
      bookingStateManager.getDateAvailability.mockReturnValue(mockAvailability)

      const availability = result.current.getDateAvailability(
        new Date('2025-07-01'),
        'spectre'
      )

      expect(bookingStateManager.getDateAvailability).toHaveBeenCalledWith(
        new Date('2025-07-01'),
        'spectre'
      )
      expect(availability).toEqual(mockAvailability)
    })

    it('should check if date is available', () => {
      bookingStateManager.getDateAvailability.mockReturnValue({ isAvailable: true })

      const isAvailable = result.current.isDateAvailable(
        new Date('2025-07-01'),
        'spectre'
      )

      expect(isAvailable).toBe(true)
    })
  })

  describe('useBookings combined hook', () => {
    it('should provide both state and operations', () => {
      const wrapper = ({ children }) => (
        <BookingProvider initialBookings={[mockBooking]}>
          {children}
        </BookingProvider>
      )
      
      const { result } = renderHook(() => useBookings(), { wrapper })

      // Should have state
      expect(result.current.bookings).toEqual([mockBooking])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()

      // Should have operations
      expect(typeof result.current.createBooking).toBe('function')
      expect(typeof result.current.updateBooking).toBe('function')
      expect(typeof result.current.deleteBooking).toBe('function')

      // Should have queries
      expect(typeof result.current.getAllBookings).toBe('function')
      expect(typeof result.current.getBooking).toBe('function')
    })
  })

  describe('state updates from BookingStateManager', () => {
    it('should handle BULK_UPDATE events', () => {
      let subscriber
      bookingStateManager.subscribe.mockImplementation((callback) => {
        subscriber = callback
        return () => {}
      })

      const wrapper = ({ children }) => (
        <BookingProvider>{children}</BookingProvider>
      )
      
      const { result } = renderHook(() => useBookingState(), { wrapper })

      // Simulate bulk update event
      act(() => {
        subscriber({
          type: 'BULK_UPDATE',
          bookings: [mockBooking]
        })
      })

      expect(result.current.bookings).toEqual([mockBooking])
    })

    it('should handle BOOKING_CREATED events', () => {
      let subscriber
      bookingStateManager.subscribe.mockImplementation((callback) => {
        subscriber = callback
        return () => {}
      })

      const wrapper = ({ children }) => (
        <BookingProvider>{children}</BookingProvider>
      )
      
      const { result } = renderHook(() => useBookingState(), { wrapper })

      // Simulate booking created event
      act(() => {
        subscriber({
          type: 'BOOKING_CREATED',
          booking: mockBooking
        })
      })

      expect(result.current.bookings).toContain(mockBooking)
    })

    it('should handle BOOKING_UPDATED events', () => {
      let subscriber
      bookingStateManager.subscribe.mockImplementation((callback) => {
        subscriber = callback
        return () => {}
      })

      const wrapper = ({ children }) => (
        <BookingProvider initialBookings={[mockBooking]}>
          {children}
        </BookingProvider>
      )
      
      const { result } = renderHook(() => useBookingState(), { wrapper })

      const updatedBooking = new BookingModel({
        ...mockBooking.toDatabase(),
        customer_name: 'Updated Customer'
      })

      // Simulate booking updated event
      act(() => {
        subscriber({
          type: 'BOOKING_UPDATED',
          booking: updatedBooking
        })
      })

      expect(result.current.bookings[0].customer_name).toBe('Updated Customer')
    })

    it('should handle BOOKING_DELETED events', () => {
      let subscriber
      bookingStateManager.subscribe.mockImplementation((callback) => {
        subscriber = callback
        return () => {}
      })

      const wrapper = ({ children }) => (
        <BookingProvider initialBookings={[mockBooking]}>
          {children}
        </BookingProvider>
      )
      
      const { result } = renderHook(() => useBookingState(), { wrapper })

      // Simulate booking deleted event
      act(() => {
        subscriber({
          type: 'BOOKING_DELETED',
          bookingId: 'test-1'
        })
      })

      expect(result.current.bookings).toHaveLength(0)
    })

    it('should handle OPTIMISTIC_UPDATE events', () => {
      let subscriber
      bookingStateManager.subscribe.mockImplementation((callback) => {
        subscriber = callback
        return () => {}
      })

      const wrapper = ({ children }) => (
        <BookingProvider>{children}</BookingProvider>
      )
      
      const { result } = renderHook(() => useBookingState(), { wrapper })

      // Simulate optimistic update event
      act(() => {
        subscriber({
          type: 'OPTIMISTIC_UPDATE',
          operationType: 'CREATE',
          booking: mockBooking,
          operationId: 'op-1'
        })
      })

      expect(result.current.optimisticOperations.has('op-1')).toBe(true)
    })

    it('should handle OPTIMISTIC_ROLLBACK events', () => {
      let subscriber
      bookingStateManager.subscribe.mockImplementation((callback) => {
        subscriber = callback
        return () => {}
      })

      const wrapper = ({ children }) => (
        <BookingProvider>{children}</BookingProvider>
      )
      
      const { result } = renderHook(() => useBookingState(), { wrapper })

      // First add an optimistic update
      act(() => {
        subscriber({
          type: 'OPTIMISTIC_UPDATE',
          operationType: 'CREATE',
          booking: mockBooking,
          operationId: 'op-1'
        })
      })

      // Then rollback
      act(() => {
        subscriber({
          type: 'OPTIMISTIC_ROLLBACK',
          operationId: 'op-1'
        })
      })

      expect(result.current.optimisticOperations.has('op-1')).toBe(false)
    })
  })
})