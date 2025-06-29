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
// Removed BookingStateManager - using UnifiedDataService for Supabase integration
import unifiedDataService from '../services/UnifiedDataService'
import { BookingModel } from '../models/index'

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

  // Subscribe to unified data service updates
  useEffect(() => {
    // Subscribe to unified data service
    const unsubscribeUnified = unifiedDataService.subscribe((event) => {
      console.log('BookingContext: Received UnifiedDataService event:', event.type, event)
      
      switch (event.type) {
        case 'INITIALIZED':
        case 'REFRESHED':
        case 'BULK_UPDATE':
          dispatch({
            type: BookingActionTypes.SET_BOOKINGS,
            payload: event.bookings || unifiedDataService.getAllBookings()
          })
          // Note: Using UnifiedDataService as single source of truth
          break

        case 'BOOKING_CREATED':
        case 'CHARTER_CREATED':
          if (event.booking) {
            dispatch({
              type: BookingActionTypes.ADD_BOOKING,
              payload: event.booking
            })
          }
          break

        case 'BOOKING_UPDATED':
        case 'CHARTER_UPDATED':
          if (event.booking) {
            dispatch({
              type: BookingActionTypes.UPDATE_BOOKING,
              payload: event.booking
            })
          }
          break

        case 'BOOKING_DELETED':
        case 'CHARTER_DELETED':
          dispatch({
            type: BookingActionTypes.DELETE_BOOKING,
            payload: event.bookingId
          })
          break
      }
    })

    // Note: Removed BookingStateManager subscription - using UnifiedDataService only

    // Initialize with current bookings from unified service
    if (initialBookings.length === 0) {
      const currentBookings = unifiedDataService.getAllBookings()
      if (currentBookings.length > 0) {
        dispatch({
          type: BookingActionTypes.SET_BOOKINGS,
          payload: currentBookings
        })
        // Note: Using UnifiedDataService as primary data source
      }
    } else {
      // Note: Using UnifiedDataService as primary data source
    }

    return () => {
      unsubscribeUnified()
    }
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

      const booking = await unifiedDataService.addBooking(bookingData)
      
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

      const booking = await unifiedDataService.updateBooking(id, updates)
      
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

      const result = await unifiedDataService.deleteBooking(id)
      
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

      // TODO: Implement moveBooking in UnifiedDataService
      throw new Error('Move booking feature not yet implemented with Supabase backend')
      
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

      // TODO: Implement batchUpdate in UnifiedDataService
      throw new Error('Batch update feature not yet implemented with Supabase backend')
      
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

      // TODO: Implement undoLastOperation in UnifiedDataService
      throw new Error('Undo operation feature not yet implemented with Supabase backend')
      
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
    return unifiedDataService.getBookingsInDateRange(startDate, endDate).filter(booking => 
      !yachtId || booking.yacht_id === yachtId
    )
  }, [bookings])

  // Get date availability
  const getDateAvailability = useCallback((date, yachtId) => {
    // Check if date has any bookings for the specified yacht
    const dateBookings = bookings.filter(booking => {
      if (yachtId && booking.yacht_id !== yachtId) return false
      const bookingStart = new Date(booking.start_date)
      const bookingEnd = new Date(booking.end_date)
      const checkDate = new Date(date)
      return checkDate >= bookingStart && checkDate <= bookingEnd
    })
    
    return {
      isAvailable: dateBookings.length === 0,
      bookings: dateBookings,
      conflictCount: dateBookings.length
    }
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