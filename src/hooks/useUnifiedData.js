/**
 * Unified Data Hook
 * 
 * Custom React hook that provides access to the unified data service
 * for components that need direct access to charter/booking data.
 * 
 * @author AI Agent
 * @created 2025-06-26
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import unifiedDataService from '../services/UnifiedDataService'

/**
 * Hook for accessing unified charter/booking data
 * Provides real-time updates and consistent data access
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoRefresh - Whether to automatically refresh data
 * @param {number} options.refreshInterval - Refresh interval in milliseconds
 * @returns {Object} Data and operations
 */
export function useUnifiedData(options = {}) {
  const {
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000 // 5 minutes
  } = options

  // State
  const [charters, setCharters] = useState([])
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  // Refs
  const isMountedRef = useRef(true)
  const refreshIntervalRef = useRef(null)

  /**
   * Load data from unified service
   */
  const loadData = useCallback(async () => {
    try {
      if (!isMountedRef.current) return

      setError(null)
      
      // Get data from unified service (no async needed since it's in-memory)
      const charterData = unifiedDataService.getAllCharters()
      const bookingData = unifiedDataService.getAllBookings()
      
      if (isMountedRef.current) {
        setCharters(charterData)
        setBookings(bookingData)
        setLastUpdate(unifiedDataService.getLastUpdate())
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Error loading unified data:', err)
      if (isMountedRef.current) {
        setError(err.message)
        setIsLoading(false)
      }
    }
  }, [])

  /**
   * Subscribe to data changes
   */
  useEffect(() => {
    isMountedRef.current = true

    // Initial load
    loadData()

    // Subscribe to changes
    const unsubscribe = unifiedDataService.subscribe((event) => {
      if (!isMountedRef.current) return

      switch (event.type) {
        case 'BULK_UPDATE':
          setCharters(event.charters || unifiedDataService.getAllCharters())
          setBookings(event.bookings || unifiedDataService.getAllBookings())
          setLastUpdate(event.timestamp)
          break

        case 'CHARTER_CREATED':
        case 'CHARTER_UPDATED':
        case 'CHARTER_DELETED':
          setCharters(unifiedDataService.getAllCharters())
          setLastUpdate(event.timestamp)
          break

        case 'BOOKING_CREATED':
        case 'BOOKING_UPDATED':
        case 'BOOKING_DELETED':
          setBookings(unifiedDataService.getAllBookings())
          setLastUpdate(event.timestamp)
          break
      }
    })

    // Set up auto-refresh if enabled
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        loadData()
      }, refreshInterval)
    }

    // Cleanup
    return () => {
      isMountedRef.current = false
      unsubscribe()
      
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [loadData, autoRefresh, refreshInterval])

  // Data operations
  const operations = {
    // Charter operations
    updateCharter: useCallback((id, updates) => {
      try {
        return unifiedDataService.updateCharter(id, updates)
      } catch (error) {
        setError(error.message)
        throw error
      }
    }, []),

    addCharter: useCallback((charter) => {
      try {
        return unifiedDataService.addCharter(charter)
      } catch (error) {
        setError(error.message)
        throw error
      }
    }, []),

    deleteCharter: useCallback((id) => {
      try {
        return unifiedDataService.deleteCharter(id)
      } catch (error) {
        setError(error.message)
        throw error
      }
    }, []),

    // Booking operations
    updateBooking: useCallback((id, updates) => {
      try {
        return unifiedDataService.updateBooking(id, updates)
      } catch (error) {
        setError(error.message)
        throw error
      }
    }, []),

    addBooking: useCallback((booking) => {
      try {
        return unifiedDataService.addBooking(booking)
      } catch (error) {
        setError(error.message)
        throw error
      }
    }, []),

    deleteBooking: useCallback((id) => {
      try {
        return unifiedDataService.deleteBooking(id)
      } catch (error) {
        setError(error.message)
        throw error
      }
    }, []),

    // Utility operations
    refresh: loadData,
    clearError: useCallback(() => setError(null), []),
    reset: useCallback(() => {
      unifiedDataService.reset()
      loadData()
    }, [loadData])
  }

  // Query helpers
  const queries = {
    getChartersByStatus: useCallback((status) => {
      return charters.filter(charter => charter.status === status)
    }, [charters]),

    getBookingsForYacht: useCallback((yachtId) => {
      return bookings.filter(booking => 
        booking.yacht_id === yachtId || booking.yacht_name === yachtId
      )
    }, [bookings]),

    getBookingsInDateRange: useCallback((startDate, endDate) => {
      return bookings.filter(booking => {
        const bookingStart = new Date(booking.start_datetime)
        const bookingEnd = new Date(booking.end_datetime)
        
        return (bookingStart <= endDate && bookingEnd >= startDate)
      })
    }, [bookings]),

    getActiveCharters: useCallback(() => {
      return charters.filter(charter => charter.status === 'active')
    }, [charters]),

    getUpcomingCharters: useCallback((limit = 10) => {
      return charters
        .filter(charter => charter.status === 'upcoming')
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, limit)
    }, [charters])
  }

  return {
    // Data
    charters,
    bookings,
    
    // Status
    isLoading,
    error,
    lastUpdate,
    
    // Operations
    ...operations,
    
    // Queries
    ...queries,
    
    // Raw service access (for advanced use cases)
    service: unifiedDataService
  }
}

export default useUnifiedData