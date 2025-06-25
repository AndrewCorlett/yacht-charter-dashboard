/**
 * Booking Context
 * 
 * React Context for booking state management with real-time updates,
 * optimistic updates, and seamless calendar integration.
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import React, { createContext, useContext, useEffect, useReducer, useCallback, useMemo } from 'react'
import bookingStateManager from '../services/BookingStateManager'
import { BookingModel } from '../models/core/BookingModel'

// Action types for booking state
const BookingActionTypes = {
  SET_BOOKINGS: 'SET_BOOKINGS',
  ADD_BOOKING: 'ADD_BOOKING',
  UPDATE_BOOKING: 'UPDATE_BOOKING',
  DELETE_BOOKING: 'DELETE_BOOKING',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_OPERATION_STATUS: 'SET_OPERATION_STATUS',
  OPTIMISTIC_UPDATE: 'OPTIMISTIC_UPDATE',
  OPTIMISTIC_ROLLBACK: 'OPTIMISTIC_ROLLBACK'
}

// Initial state
const initialState = {
  bookings: [],
  loading: false,
  error: null,
  operationStatus: null,
  optimisticOperations: new Map(),
  lastUpdate: null
}

// Booking reducer
function bookingReducer(state, action) {
  switch (action.type) {
    case BookingActionTypes.SET_BOOKINGS:
      return {
        ...state,
        bookings: action.payload,
        loading: false,
        error: null,
        lastUpdate: Date.now()
      }

    case BookingActionTypes.ADD_BOOKING:
      return {
        ...state,
        bookings: [...state.bookings, action.payload],
        lastUpdate: Date.now()
      }

    case BookingActionTypes.UPDATE_BOOKING:
      return {
        ...state,
        bookings: state.bookings.map(booking => 
          booking.id === action.payload.id ? action.payload : booking
        ),
        lastUpdate: Date.now()
      }

    case BookingActionTypes.DELETE_BOOKING:
      return {
        ...state,
        bookings: state.bookings.filter(booking => booking.id !== action.payload),
        lastUpdate: Date.now()
      }

    case BookingActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      }

    case BookingActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      }

    case BookingActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      }

    case BookingActionTypes.SET_OPERATION_STATUS:
      return {
        ...state,
        operationStatus: action.payload
      }

    case BookingActionTypes.OPTIMISTIC_UPDATE:
      const newOptimisticOps = new Map(state.optimisticOperations)
      newOptimisticOps.set(action.payload.operationId, action.payload)
      return {
        ...state,
        optimisticOperations: newOptimisticOps
      }

    case BookingActionTypes.OPTIMISTIC_ROLLBACK:
      const updatedOptimisticOps = new Map(state.optimisticOperations)
      updatedOptimisticOps.delete(action.payload.operationId)
      return {
        ...state,
        optimisticOperations: updatedOptimisticOps
      }

    default:
      return state
  }
}

// Create contexts
const BookingStateContext = createContext()
const BookingDispatchContext = createContext()

/**
 * BookingProvider component
 * Provides booking state and operations to child components
 */
export function BookingProvider({ children, initialBookings = [] }) {
  const [state, dispatch] = useReducer(bookingReducer, {
    ...initialState,
    bookings: initialBookings
  })

  // Subscribe to state manager updates
  useEffect(() => {
    const unsubscribe = bookingStateManager.subscribe((event) => {
      switch (event.type) {
        case 'BULK_UPDATE':
          dispatch({
            type: BookingActionTypes.SET_BOOKINGS,
            payload: event.bookings
          })
          break

        case 'BOOKING_CREATED':
          dispatch({
            type: BookingActionTypes.ADD_BOOKING,
            payload: event.booking
          })
          break

        case 'BOOKING_UPDATED':
          dispatch({
            type: BookingActionTypes.UPDATE_BOOKING,
            payload: event.booking
          })
          break

        case 'BOOKING_DELETED':
          dispatch({
            type: BookingActionTypes.DELETE_BOOKING,
            payload: event.bookingId
          })
          break

        case 'OPTIMISTIC_UPDATE':
          dispatch({
            type: BookingActionTypes.OPTIMISTIC_UPDATE,
            payload: {
              operationId: event.operationId,
              type: event.operationType,
              booking: event.booking
            }
          })
          break

        case 'OPTIMISTIC_ROLLBACK':
          dispatch({
            type: BookingActionTypes.OPTIMISTIC_ROLLBACK,
            payload: {
              operationId: event.operationId
            }
          })
          break
      }
    })

    // Initialize with current bookings from state manager
    if (initialBookings.length === 0) {
      const currentBookings = bookingStateManager.getAllBookings()
      if (currentBookings.length > 0) {
        dispatch({
          type: BookingActionTypes.SET_BOOKINGS,
          payload: currentBookings
        })
      }
    } else {
      // Set initial bookings in state manager
      bookingStateManager.setBookings(initialBookings)
    }

    return unsubscribe
  }, [initialBookings])

  // Memoized context values
  const stateValue = useMemo(() => state, [state])
  const dispatchValue = useMemo(() => dispatch, [])

  return (
    <BookingStateContext.Provider value={stateValue}>
      <BookingDispatchContext.Provider value={dispatchValue}>
        {children}
      </BookingDispatchContext.Provider>
    </BookingStateContext.Provider>
  )
}

/**
 * Hook to access booking state
 */
export function useBookingState() {
  const context = useContext(BookingStateContext)
  if (context === undefined) {
    throw new Error('useBookingState must be used within a BookingProvider')
  }
  return context
}

/**
 * Hook to access booking dispatch
 */
export function useBookingDispatch() {
  const context = useContext(BookingDispatchContext)
  if (context === undefined) {
    throw new Error('useBookingDispatch must be used within a BookingProvider')
  }
  return context
}

/**
 * Hook for booking operations with error handling and loading states
 */
export function useBookingOperations() {
  const dispatch = useBookingDispatch()

  const setLoading = useCallback((loading) => {
    dispatch({ type: BookingActionTypes.SET_LOADING, payload: loading })
  }, [dispatch])

  const setError = useCallback((error) => {
    dispatch({ type: BookingActionTypes.SET_ERROR, payload: error })
  }, [dispatch])

  const clearError = useCallback(() => {
    dispatch({ type: BookingActionTypes.CLEAR_ERROR })
  }, [dispatch])

  const setOperationStatus = useCallback((status) => {
    dispatch({ type: BookingActionTypes.SET_OPERATION_STATUS, payload: status })
  }, [dispatch])

  // Create booking operation
  const createBooking = useCallback(async (bookingData, options = {}) => {
    try {
      setLoading(true)
      clearError()
      setOperationStatus({ type: 'creating', message: 'Creating booking...' })

      const booking = await bookingStateManager.createBooking(bookingData, options)
      
      setOperationStatus({ type: 'success', message: 'Booking created successfully' })
      setTimeout(() => setOperationStatus(null), 3000)
      
      return booking
    } catch (error) {
      setError(error.message)
      setOperationStatus({ type: 'error', message: error.message })
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, clearError, setOperationStatus])

  // Update booking operation
  const updateBooking = useCallback(async (id, updates, options = {}) => {
    try {
      setLoading(true)
      clearError()
      setOperationStatus({ type: 'updating', message: 'Updating booking...' })

      const booking = await bookingStateManager.updateBooking(id, updates, options)
      
      setOperationStatus({ type: 'success', message: 'Booking updated successfully' })
      setTimeout(() => setOperationStatus(null), 3000)
      
      return booking
    } catch (error) {
      setError(error.message)
      setOperationStatus({ type: 'error', message: error.message })
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, clearError, setOperationStatus])

  // Delete booking operation
  const deleteBooking = useCallback(async (id, options = {}) => {
    try {
      setLoading(true)
      clearError()
      setOperationStatus({ type: 'deleting', message: 'Deleting booking...' })

      const result = await bookingStateManager.deleteBooking(id, options)
      
      setOperationStatus({ type: 'success', message: 'Booking deleted successfully' })
      setTimeout(() => setOperationStatus(null), 3000)
      
      return result
    } catch (error) {
      setError(error.message)
      setOperationStatus({ type: 'error', message: error.message })
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, clearError, setOperationStatus])

  // Move booking operation
  const moveBooking = useCallback(async (id, newLocation, options = {}) => {
    try {
      setLoading(true)
      clearError()
      setOperationStatus({ type: 'moving', message: 'Moving booking...' })

      const booking = await bookingStateManager.moveBooking(id, newLocation, options)
      
      setOperationStatus({ type: 'success', message: 'Booking moved successfully' })
      setTimeout(() => setOperationStatus(null), 3000)
      
      return booking
    } catch (error) {
      setError(error.message)
      setOperationStatus({ type: 'error', message: error.message })
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, clearError, setOperationStatus])

  // Batch operations
  const batchUpdate = useCallback(async (operations, options = {}) => {
    try {
      setLoading(true)
      clearError()
      setOperationStatus({ type: 'batch', message: 'Processing batch update...' })

      const results = await bookingStateManager.batchUpdate(operations, options)
      
      setOperationStatus({ type: 'success', message: 'Batch update completed successfully' })
      setTimeout(() => setOperationStatus(null), 3000)
      
      return results
    } catch (error) {
      setError(error.message)
      setOperationStatus({ type: 'error', message: error.message })
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, clearError, setOperationStatus])

  // Undo last operation
  const undoLastOperation = useCallback(async () => {
    try {
      setLoading(true)
      clearError()
      setOperationStatus({ type: 'undo', message: 'Undoing last operation...' })

      const result = await bookingStateManager.undoLastOperation()
      
      if (result) {
        setOperationStatus({ type: 'success', message: 'Operation undone successfully' })
      } else {
        setOperationStatus({ type: 'info', message: 'No operations to undo' })
      }
      setTimeout(() => setOperationStatus(null), 3000)
      
      return result
    } catch (error) {
      setError(error.message)
      setOperationStatus({ type: 'error', message: error.message })
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, clearError, setOperationStatus])

  return {
    createBooking,
    updateBooking,
    deleteBooking,
    moveBooking,
    batchUpdate,
    undoLastOperation,
    setLoading,
    setError,
    clearError,
    setOperationStatus
  }
}

/**
 * Hook for booking queries and data access
 */
export function useBookingQueries() {
  const { bookings } = useBookingState()

  // Get all bookings
  const getAllBookings = useCallback(() => {
    return bookings
  }, [bookings])

  // Get booking by ID
  const getBooking = useCallback((id) => {
    return bookings.find(booking => booking.id === id) || null
  }, [bookings])

  // Get bookings for yacht
  const getBookingsForYacht = useCallback((yachtId) => {
    return bookings.filter(booking => booking.yacht_id === yachtId)
  }, [bookings])

  // Get bookings in date range
  const getBookingsInRange = useCallback((startDate, endDate, yachtId = null) => {
    return bookingStateManager.getBookingsInRange(startDate, endDate, yachtId)
  }, [bookings])

  // Get date availability
  const getDateAvailability = useCallback((date, yachtId) => {
    return bookingStateManager.getDateAvailability(date, yachtId)
  }, [bookings])

  // Check if date is available
  const isDateAvailable = useCallback((date, yachtId) => {
    const availability = getDateAvailability(date, yachtId)
    return availability.isAvailable
  }, [getDateAvailability])

  // Get booking conflicts
  const getBookingConflicts = useCallback((booking, excludeId = null) => {
    const otherBookings = bookings.filter(b => b.id !== excludeId)
    return booking.checkConflicts(otherBookings)
  }, [bookings])

  return {
    getAllBookings,
    getBooking,
    getBookingsForYacht,
    getBookingsInRange,
    getDateAvailability,
    isDateAvailable,
    getBookingConflicts,
    // Expose raw bookings array for direct access
    bookings
  }
}

/**
 * Combined hook that provides both state and operations
 */
export function useBookings() {
  const state = useBookingState()
  const operations = useBookingOperations()
  const queries = useBookingQueries()

  return {
    ...state,
    ...operations,
    ...queries
  }
}