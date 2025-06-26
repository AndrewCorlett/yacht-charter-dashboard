/**
 * Booking State Manager
 * 
 * Centralized state management for booking operations with real-time updates,
 * optimistic updates, and conflict resolution.
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import { BookingModel, BookingStatus } from '../models'
import { BookingConflictService } from './BookingConflictService'

export class BookingStateManager {
  constructor() {
    this.bookings = new Map()
    this.subscribers = new Set()
    this.optimisticUpdates = new Map()
    this.pendingOperations = new Map()
    this.operationHistory = []
    this.maxHistorySize = 50
  }

  /**
   * Subscribe to booking state changes
   * @param {Function} callback - Function to call on state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Notify all subscribers of state changes
   * @param {Object} event - Change event details
   */
  notifySubscribers(event) {
    this.subscribers.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Subscriber callback error:', error)
      }
    })
  }

  /**
   * Get all bookings as array
   * @returns {Array<BookingModel>} Array of booking models
   */
  getAllBookings() {
    return Array.from(this.bookings.values())
  }

  /**
   * Get booking by ID
   * @param {string} id - Booking ID
   * @returns {BookingModel|null} Booking model or null
   */
  getBooking(id) {
    return this.bookings.get(id) || null
  }

  /**
   * Get bookings for specific yacht
   * @param {string} yachtId - Yacht ID
   * @returns {Array<BookingModel>} Array of bookings for yacht
   */
  getBookingsForYacht(yachtId) {
    return this.getAllBookings().filter(booking => booking.yacht_id === yachtId)
  }

  /**
   * Get bookings for date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} [yachtId] - Optional yacht filter
   * @returns {Array<BookingModel>} Array of bookings in range
   */
  getBookingsInRange(startDate, endDate, yachtId = null) {
    return this.getAllBookings().filter(booking => {
      if (yachtId && booking.yacht_id !== yachtId) return false
      
      return BookingConflictService.datesOverlap(
        startDate,
        endDate,
        booking.start_datetime,
        booking.end_datetime
      )
    })
  }

  /**
   * Check availability for a specific date and yacht
   * @param {Date} date - Date to check
   * @param {string} yachtId - Yacht ID
   * @returns {Object} Availability information
   */
  getDateAvailability(date, yachtId) {
    return BookingConflictService.getDateAvailability(date, yachtId, this.getAllBookings())
  }

  /**
   * Set initial bookings data
   * @param {Array} bookings - Array of booking data
   */
  setBookings(bookings) {
    this.bookings.clear()
    this.optimisticUpdates.clear()
    
    bookings.forEach(bookingData => {
      const booking = bookingData instanceof BookingModel 
        ? bookingData 
        : new BookingModel(bookingData)
      this.bookings.set(booking.id, booking)
    })

    this.notifySubscribers({
      type: 'BULK_UPDATE',
      bookings: this.getAllBookings()
    })
  }

  /**
   * Create a new booking with optimistic updates
   * @param {Object} bookingData - Booking data
   * @param {Object} options - Operation options
   * @returns {Promise<BookingModel>} Created booking
   */
  async createBooking(bookingData, options = {}) {
    const { optimistic = true, validateConflicts = true } = options
    const booking = new BookingModel(bookingData)
    const operationId = this.generateOperationId()

    // Validate booking data
    if (!booking.validate()) {
      throw new Error(`Validation failed: ${Object.values(booking.getErrors()).join(', ')}`)
    }

    // Check for conflicts if enabled
    if (validateConflicts) {
      const conflictCheck = booking.checkConflicts(this.getAllBookings())
      if (!conflictCheck.isAvailable) {
        throw new Error(`Booking conflicts detected: ${conflictCheck.conflicts.map(c => c.reason).join(', ')}`)
      }
    }

    // Apply optimistic update
    if (optimistic) {
      this.applyOptimisticUpdate(operationId, 'CREATE', booking)
    }

    try {
      // Simulate API call - in real implementation, this would be an actual API call
      const createdBooking = await this.simulateApiCall('CREATE', booking, 1000)
      
      // Apply successful update
      this.bookings.set(createdBooking.id, createdBooking)
      this.clearOptimisticUpdate(operationId)
      this.addToHistory('CREATE', createdBooking)

      this.notifySubscribers({
        type: 'BOOKING_CREATED',
        booking: createdBooking,
        operationId
      })

      return createdBooking
    } catch (error) {
      // Rollback optimistic update
      this.rollbackOptimisticUpdate(operationId)
      throw error
    }
  }

  /**
   * Update an existing booking
   * @param {string} id - Booking ID
   * @param {Object} updates - Updates to apply
   * @param {Object} options - Operation options
   * @returns {Promise<BookingModel>} Updated booking
   */
  async updateBooking(id, updates, options = {}) {
    const { optimistic = true, validateConflicts = true } = options
    const operationId = this.generateOperationId()
    const existingBooking = this.getBooking(id)

    if (!existingBooking) {
      throw new Error(`Booking with ID ${id} not found`)
    }

    // Create updated booking
    const updatedBooking = new BookingModel({
      ...existingBooking.toDatabase(),
      ...updates
    })

    // Validate updated booking
    if (!updatedBooking.validate()) {
      throw new Error(`Validation failed: ${Object.values(updatedBooking.getErrors()).join(', ')}`)
    }

    // Check for conflicts if enabled
    if (validateConflicts) {
      const otherBookings = this.getAllBookings().filter(b => b.id !== id)
      const conflictCheck = updatedBooking.checkConflicts(otherBookings)
      if (!conflictCheck.isAvailable) {
        throw new Error(`Booking conflicts detected: ${conflictCheck.conflicts.map(c => c.reason).join(', ')}`)
      }
    }

    // Apply optimistic update
    if (optimistic) {
      this.applyOptimisticUpdate(operationId, 'UPDATE', updatedBooking, existingBooking)
    }

    try {
      // Simulate API call
      const savedBooking = await this.simulateApiCall('UPDATE', updatedBooking, 800)
      
      // Apply successful update
      this.bookings.set(savedBooking.id, savedBooking)
      this.clearOptimisticUpdate(operationId)
      this.addToHistory('UPDATE', savedBooking, existingBooking)

      this.notifySubscribers({
        type: 'BOOKING_UPDATED',
        booking: savedBooking,
        previousBooking: existingBooking,
        operationId
      })

      return savedBooking
    } catch (error) {
      // Rollback optimistic update
      this.rollbackOptimisticUpdate(operationId)
      throw error
    }
  }

  /**
   * Delete a booking
   * @param {string} id - Booking ID
   * @param {Object} options - Operation options
   * @returns {Promise<boolean>} Success status
   */
  async deleteBooking(id, options = {}) {
    const { optimistic = true } = options
    const operationId = this.generateOperationId()
    const existingBooking = this.getBooking(id)

    if (!existingBooking) {
      throw new Error(`Booking with ID ${id} not found`)
    }

    // Apply optimistic update
    if (optimistic) {
      this.applyOptimisticUpdate(operationId, 'DELETE', null, existingBooking)
    }

    try {
      // Simulate API call
      await this.simulateApiCall('DELETE', { id }, 600)
      
      // Apply successful deletion
      this.bookings.delete(id)
      this.clearOptimisticUpdate(operationId)
      this.addToHistory('DELETE', null, existingBooking)

      this.notifySubscribers({
        type: 'BOOKING_DELETED',
        bookingId: id,
        deletedBooking: existingBooking,
        operationId
      })

      return true
    } catch (error) {
      // Rollback optimistic update
      this.rollbackOptimisticUpdate(operationId)
      throw error
    }
  }

  /**
   * Move a booking to different dates/yacht
   * @param {string} id - Booking ID
   * @param {Object} newLocation - New booking location
   * @param {Object} options - Operation options
   * @returns {Promise<BookingModel>} Updated booking
   */
  async moveBooking(id, newLocation, options = {}) {
    const { yachtId, startDate, endDate } = newLocation
    
    return this.updateBooking(id, {
      yacht_id: yachtId,
      start_datetime: startDate,
      end_datetime: endDate
    }, options)
  }

  /**
   * Batch update multiple bookings
   * @param {Array} operations - Array of operation objects
   * @param {Object} options - Operation options
   * @returns {Promise<Array>} Results array
   */
  async batchUpdate(operations, options = {}) {
    const { optimistic = true } = options
    const operationId = this.generateOperationId()
    const results = []
    const rollbackData = []

    try {
      // Apply optimistic updates
      if (optimistic) {
        operations.forEach(op => {
          const { type, id, data } = op
          if (type === 'CREATE') {
            const booking = new BookingModel(data)
            this.applyOptimisticUpdate(`${operationId}-${op.id}`, 'CREATE', booking)
            rollbackData.push({ type: 'CREATE', id: booking.id })
          } else if (type === 'UPDATE') {
            const existing = this.getBooking(id)
            const updated = new BookingModel({ ...existing.toDatabase(), ...data })
            this.applyOptimisticUpdate(`${operationId}-${op.id}`, 'UPDATE', updated, existing)
            rollbackData.push({ type: 'UPDATE', id, existing })
          } else if (type === 'DELETE') {
            const existing = this.getBooking(id)
            this.applyOptimisticUpdate(`${operationId}-${op.id}`, 'DELETE', null, existing)
            rollbackData.push({ type: 'DELETE', id, existing })
          }
        })
      }

      // Execute operations
      for (const operation of operations) {
        const { type, id, data } = operation
        
        if (type === 'CREATE') {
          const result = await this.createBooking(data, { optimistic: false })
          results.push({ success: true, data: result })
        } else if (type === 'UPDATE') {
          const result = await this.updateBooking(id, data, { optimistic: false })
          results.push({ success: true, data: result })
        } else if (type === 'DELETE') {
          await this.deleteBooking(id, { optimistic: false })
          results.push({ success: true, data: { id } })
        }
      }

      // Clear optimistic updates
      operations.forEach(op => {
        this.clearOptimisticUpdate(`${operationId}-${op.id}`)
      })

      this.notifySubscribers({
        type: 'BATCH_UPDATE_COMPLETE',
        operations,
        results,
        operationId
      })

      return results
    } catch (error) {
      // Rollback all optimistic updates
      rollbackData.forEach((rollback, index) => {
        this.rollbackOptimisticUpdate(`${operationId}-${operations[index].id}`)
      })
      
      throw error
    }
  }

  /**
   * Apply optimistic update
   * @param {string} operationId - Operation ID
   * @param {string} type - Operation type
   * @param {BookingModel|null} newData - New booking data
   * @param {BookingModel|null} oldData - Original booking data
   */
  applyOptimisticUpdate(operationId, type, newData, oldData = null) {
    this.optimisticUpdates.set(operationId, {
      type,
      newData,
      oldData,
      timestamp: Date.now()
    })

    // Apply update to local state
    if (type === 'CREATE' && newData) {
      this.bookings.set(newData.id, newData)
    } else if (type === 'UPDATE' && newData) {
      this.bookings.set(newData.id, newData)
    } else if (type === 'DELETE' && oldData) {
      this.bookings.delete(oldData.id)
    }

    this.notifySubscribers({
      type: 'OPTIMISTIC_UPDATE',
      operationType: type,
      booking: newData,
      operationId
    })
  }

  /**
   * Clear optimistic update after successful operation
   * @param {string} operationId - Operation ID
   */
  clearOptimisticUpdate(operationId) {
    this.optimisticUpdates.delete(operationId)
  }

  /**
   * Rollback optimistic update on failure
   * @param {string} operationId - Operation ID
   */
  rollbackOptimisticUpdate(operationId) {
    const update = this.optimisticUpdates.get(operationId)
    if (!update) return

    const { type, newData, oldData } = update

    // Rollback local state
    if (type === 'CREATE' && newData) {
      this.bookings.delete(newData.id)
    } else if (type === 'UPDATE' && oldData) {
      this.bookings.set(oldData.id, oldData)
    } else if (type === 'DELETE' && oldData) {
      this.bookings.set(oldData.id, oldData)
    }

    this.optimisticUpdates.delete(operationId)

    this.notifySubscribers({
      type: 'OPTIMISTIC_ROLLBACK',
      operationType: type,
      booking: oldData,
      operationId
    })
  }

  /**
   * Add operation to history for undo functionality
   * @param {string} type - Operation type
   * @param {BookingModel|null} newData - New data
   * @param {BookingModel|null} oldData - Old data
   */
  addToHistory(type, newData, oldData = null) {
    this.operationHistory.push({
      id: this.generateOperationId(),
      type,
      newData: newData ? newData.clone() : null,
      oldData: oldData ? oldData.clone() : null,
      timestamp: Date.now()
    })

    // Limit history size
    if (this.operationHistory.length > this.maxHistorySize) {
      this.operationHistory.shift()
    }
  }

  /**
   * Undo last operation
   * @returns {Promise<boolean>} Success status
   */
  async undoLastOperation() {
    const lastOperation = this.operationHistory.pop()
    if (!lastOperation) return false

    const { type, newData, oldData } = lastOperation

    try {
      if (type === 'CREATE' && newData) {
        await this.deleteBooking(newData.id, { optimistic: false })
      } else if (type === 'UPDATE' && oldData) {
        await this.updateBooking(newData.id, oldData.toDatabase(), { optimistic: false })
      } else if (type === 'DELETE' && oldData) {
        await this.createBooking(oldData.toDatabase(), { optimistic: false })
      }

      this.notifySubscribers({
        type: 'OPERATION_UNDONE',
        operation: lastOperation
      })

      return true
    } catch (error) {
      // Restore operation to history if undo failed
      this.operationHistory.push(lastOperation)
      throw error
    }
  }

  /**
   * Get operation history
   * @returns {Array} Array of operation history
   */
  getOperationHistory() {
    return [...this.operationHistory]
  }

  /**
   * Generate unique operation ID
   * @returns {string} Operation ID
   */
  generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Simulate API call with delay
   * @param {string} operation - Operation type
   * @param {Object} data - Data to send
   * @param {number} delay - Delay in milliseconds
   * @returns {Promise} Promise that resolves with data
   */
  async simulateApiCall(operation, data, delay = 500) {
    await new Promise(resolve => setTimeout(resolve, delay))
    
    // Simulate occasional API errors (5% chance)
    if (Math.random() < 0.05) {
      throw new Error(`API Error: ${operation} operation failed`)
    }

    // Return the data (in real implementation, this would be the API response)
    return data instanceof BookingModel ? data : new BookingModel(data)
  }

  /**
   * Get current state statistics
   * @returns {Object} State statistics
   */
  getStateStats() {
    return {
      totalBookings: this.bookings.size,
      optimisticUpdates: this.optimisticUpdates.size,
      pendingOperations: this.pendingOperations.size,
      historySize: this.operationHistory.length,
      subscribers: this.subscribers.size
    }
  }

  /**
   * Clear all data
   */
  clear() {
    this.bookings.clear()
    this.optimisticUpdates.clear()
    this.pendingOperations.clear()
    this.operationHistory.length = 0
    
    this.notifySubscribers({
      type: 'STATE_CLEARED'
    })
  }
}

// Export singleton instance
export default new BookingStateManager()