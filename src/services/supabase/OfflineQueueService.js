/**
 * Offline Queue Service
 * Handles offline operations and syncs when connection is restored
 * Stores pending operations in localStorage and processes them when online
 * 
 * @created 2025-06-26
 */

import { supabase, supabaseConfig } from './supabaseClient.js'
import bookingService from './BookingService.js'

class OfflineQueueService {
  constructor() {
    this.queueKey = 'seascape_offline_queue'
    this.queue = this.loadQueue()
    this.isOnline = navigator.onLine
    this.processing = false
    this.maxRetries = 3
    this.retryDelay = 1000 // 1 second

    // Set up event listeners
    this.setupEventListeners()
  }

  /**
   * Set up online/offline event listeners
   */
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      console.log('Connection restored - processing offline queue')
      this.processQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('Connection lost - operations will be queued')
    })

    // Process queue on initialization if online
    if (this.isOnline && this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 2000)
    }
  }

  /**
   * Add operation to queue
   * @param {Object} operation - Operation to queue
   * @returns {string} Operation ID
   */
  addToQueue(operation) {
    const queueItem = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      operation: operation,
      status: 'pending',
      retries: 0,
      error: null
    }

    this.queue.push(queueItem)
    this.saveQueue()

    // Notify UI about queue update
    this.notifyQueueUpdate()

    // Try to process immediately if online
    if (this.isOnline && !this.processing) {
      this.processQueue()
    }

    return queueItem.id
  }

  /**
   * Queue a booking creation
   * @param {Object} bookingData - Booking data
   * @returns {string} Queue item ID
   */
  queueCreateBooking(bookingData) {
    return this.addToQueue({
      type: 'CREATE_BOOKING',
      data: bookingData
    })
  }

  /**
   * Queue a booking update
   * @param {string} bookingId - Booking ID
   * @param {Object} updates - Updates to apply
   * @returns {string} Queue item ID
   */
  queueUpdateBooking(bookingId, updates) {
    return this.addToQueue({
      type: 'UPDATE_BOOKING',
      bookingId: bookingId,
      data: updates
    })
  }

  /**
   * Queue a booking deletion
   * @param {string} bookingId - Booking ID
   * @returns {string} Queue item ID
   */
  queueDeleteBooking(bookingId) {
    return this.addToQueue({
      type: 'DELETE_BOOKING',
      bookingId: bookingId
    })
  }

  /**
   * Queue a status toggle
   * @param {string} bookingId - Booking ID
   * @param {string} field - Field to toggle
   * @returns {string} Queue item ID
   */
  queueToggleStatus(bookingId, field) {
    return this.addToQueue({
      type: 'TOGGLE_STATUS',
      bookingId: bookingId,
      field: field
    })
  }

  /**
   * Process the offline queue
   */
  async processQueue() {
    if (!this.isOnline || this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true
    console.log(`Processing ${this.queue.length} queued operations`)

    const processedItems = []
    const failedItems = []

    for (const item of this.queue) {
      if (item.status === 'completed') continue

      try {
        await this.processQueueItem(item)
        item.status = 'completed'
        item.completedAt = new Date().toISOString()
        processedItems.push(item)
      } catch (error) {
        item.retries++
        item.error = error.message

        if (item.retries >= this.maxRetries) {
          item.status = 'failed'
          failedItems.push(item)
        } else {
          // Keep in queue for retry
          console.log(`Operation ${item.id} failed, will retry (${item.retries}/${this.maxRetries})`)
        }
      }

      // Small delay between operations
      await this.delay(100)
    }

    // Remove completed and permanently failed items
    this.queue = this.queue.filter(item => 
      item.status !== 'completed' && item.status !== 'failed'
    )
    this.saveQueue()

    // Log results
    if (processedItems.length > 0) {
      console.log(`Successfully processed ${processedItems.length} operations`)
    }
    if (failedItems.length > 0) {
      console.error(`Failed to process ${failedItems.length} operations after ${this.maxRetries} retries`)
    }

    this.processing = false
    this.notifyQueueUpdate()

    // If there are still items in queue, retry after delay
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), this.retryDelay * 2)
    }
  }

  /**
   * Process a single queue item
   * @param {Object} item - Queue item
   */
  async processQueueItem(item) {
    const { operation } = item

    switch (operation.type) {
      case 'CREATE_BOOKING':
        await bookingService.createBooking(operation.data)
        break

      case 'UPDATE_BOOKING':
        await bookingService.updateBooking(operation.bookingId, operation.data)
        break

      case 'DELETE_BOOKING':
        await bookingService.deleteBooking(operation.bookingId)
        break

      case 'TOGGLE_STATUS':
        await bookingService.toggleBookingStatus(operation.bookingId, operation.field)
        break

      default:
        throw new Error(`Unknown operation type: ${operation.type}`)
    }
  }

  /**
   * Get queue status
   * @returns {Object} Queue status
   */
  getQueueStatus() {
    const pending = this.queue.filter(item => item.status === 'pending').length
    const retrying = this.queue.filter(item => 
      item.status === 'pending' && item.retries > 0
    ).length

    return {
      isOnline: this.isOnline,
      isProcessing: this.processing,
      totalItems: this.queue.length,
      pendingItems: pending,
      retryingItems: retrying,
      items: this.queue.map(item => ({
        id: item.id,
        type: item.operation.type,
        timestamp: item.timestamp,
        status: item.status,
        retries: item.retries,
        error: item.error
      }))
    }
  }

  /**
   * Clear the queue
   * @param {boolean} completed - Clear only completed items
   */
  clearQueue(completed = false) {
    if (completed) {
      this.queue = this.queue.filter(item => item.status !== 'completed')
    } else {
      this.queue = []
    }
    this.saveQueue()
    this.notifyQueueUpdate()
  }

  /**
   * Remove specific item from queue
   * @param {string} itemId - Item ID
   * @returns {boolean} Success status
   */
  removeFromQueue(itemId) {
    const initialLength = this.queue.length
    this.queue = this.queue.filter(item => item.id !== itemId)
    
    if (this.queue.length < initialLength) {
      this.saveQueue()
      this.notifyQueueUpdate()
      return true
    }
    
    return false
  }

  /**
   * Retry failed items
   */
  retryFailedItems() {
    let retriedCount = 0
    
    this.queue.forEach(item => {
      if (item.status === 'pending' && item.retries > 0) {
        item.retries = 0
        item.error = null
        retriedCount++
      }
    })

    if (retriedCount > 0) {
      this.saveQueue()
      console.log(`Reset ${retriedCount} failed items for retry`)
      this.processQueue()
    }
  }

  /**
   * Subscribe to queue updates
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToQueue(callback) {
    const listener = (event) => {
      callback(event.detail)
    }

    window.addEventListener('offline-queue-update', listener)

    return () => {
      window.removeEventListener('offline-queue-update', listener)
    }
  }

  /**
   * Load queue from localStorage
   * @returns {Array} Queue items
   */
  loadQueue() {
    try {
      const stored = localStorage.getItem(this.queueKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load offline queue:', error)
      return []
    }
  }

  /**
   * Save queue to localStorage
   */
  saveQueue() {
    try {
      localStorage.setItem(this.queueKey, JSON.stringify(this.queue))
    } catch (error) {
      console.error('Failed to save offline queue:', error)
      
      // If storage is full, remove oldest completed items
      if (error.name === 'QuotaExceededError') {
        this.queue = this.queue.filter(item => item.status !== 'completed')
        try {
          localStorage.setItem(this.queueKey, JSON.stringify(this.queue))
        } catch (retryError) {
          console.error('Still failed to save queue after cleanup:', retryError)
        }
      }
    }
  }

  /**
   * Notify about queue updates
   */
  notifyQueueUpdate() {
    const status = this.getQueueStatus()
    const event = new CustomEvent('offline-queue-update', {
      detail: status
    })
    window.dispatchEvent(event)
  }

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Delay helper
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Delay promise
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Check if operation can be queued
   * @param {Object} operation - Operation to check
   * @returns {boolean} Can be queued
   */
  canQueue(operation) {
    // Check if operation type is supported
    const supportedTypes = [
      'CREATE_BOOKING',
      'UPDATE_BOOKING',
      'DELETE_BOOKING',
      'TOGGLE_STATUS'
    ]

    if (!supportedTypes.includes(operation.type)) {
      return false
    }

    // Check queue size limit (prevent excessive storage usage)
    const maxQueueSize = 100
    if (this.queue.length >= maxQueueSize) {
      console.warn('Offline queue is full')
      return false
    }

    return true
  }

  /**
   * Get queue item by ID
   * @param {string} itemId - Item ID
   * @returns {Object|null} Queue item
   */
  getQueueItem(itemId) {
    return this.queue.find(item => item.id === itemId) || null
  }
}

// Create singleton instance
const offlineQueueService = new OfflineQueueService()

// Export both instance and class
export default offlineQueueService
export { OfflineQueueService }