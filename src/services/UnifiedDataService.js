/**
 * Unified Data Service
 * 
 * Centralized data management service that provides a single source of truth
 * for all charter/booking data across the application (SIT REP, Calendar, Bookings).
 * Handles data transformation between different formats and ensures consistency.
 * 
 * @author AI Agent
 * @created 2025-06-26
 */

import { mockCharters } from '../data/mockData.js'
import { eventEmitter } from '../utils/eventEmitter.js'
import BookingModel, { BookingStatus, CharterType, PaymentStatus } from '../models/core/BookingModel-unified.js'

/**
 * Data transformation utilities
 */
class DataTransformer {
  /**
   * Convert Charter format to Unified BookingModel format
   * @param {Charter} charter - Charter data
   * @returns {Object} Unified booking model data
   */
  static charterToBooking(charter) {
    // Generate customer name for demo
    const yachtClean = charter.yachtName.toLowerCase().replace(/\s+/g, '')
    
    return {
      id: charter.id,
      booking_number: `BK-${charter.id.toUpperCase()}`,
      
      // Embedded customer information
      customer_first_name: `Customer`,
      customer_surname: `for ${charter.yachtName}`,
      customer_email: `customer@${yachtClean}.com`,
      customer_phone: '+44 7700 900000',
      customer_street: '123 Charter Street',
      customer_city: 'Southampton',
      customer_postcode: 'SO14 3XG',
      customer_country: 'United Kingdom',
      
      // Denormalized yacht information
      yacht_id: charter.yachtName, // Using yacht name as ID for now
      yacht_name: charter.yachtName,
      yacht_type: 'Sailboat', // Demo yacht type
      yacht_location: 'Marina Bay',
      
      // Booking details
      charter_type: CharterType.BAREBOAT,
      start_date: new Date(charter.startDate),
      end_date: new Date(charter.endDate),
      port_of_departure: 'Marina Bay',
      port_of_arrival: 'Harbor Point',
      
      // Status tracking
      booking_status: charter.status === 'active' ? BookingStatus.CONFIRMED : BookingStatus.CONFIRMED,
      payment_status: this._mapPaymentStatus(charter.paymentStatus),
      booking_confirmed: charter.paymentStatus !== 'tentative',
      deposit_paid: charter.paymentStatus !== 'tentative',
      contract_sent: charter.paymentStatus !== 'tentative',
      contract_signed: charter.paymentStatus === 'full-paid',
      deposit_invoice_sent: charter.paymentStatus !== 'tentative',
      receipt_issued: charter.paymentStatus === 'full-paid',
      
      // Financial information
      base_rate: 12000.00,
      total_amount: 15000.00,
      deposit_amount: 3000.00,
      balance_due: charter.paymentStatus === 'full-paid' ? 0.00 : 12000.00,
      
      // Additional fields
      special_requirements: '',
      notes: `Charter for ${charter.yachtName}`,
      
      // Audit fields
      created_at: new Date('2025-06-20T00:00:00.000Z'),
      updated_at: new Date()
    }
  }
  
  /**
   * Map charter payment status to unified payment status
   * @param {string} charterPaymentStatus - Charter payment status
   * @returns {string} Unified payment status
   */
  static _mapPaymentStatus(charterPaymentStatus) {
    switch (charterPaymentStatus) {
      case 'tentative': return PaymentStatus.PENDING
      case 'deposit-paid': return PaymentStatus.DEPOSIT_PAID
      case 'full-paid': return PaymentStatus.FULL_PAYMENT
      default: return PaymentStatus.PENDING
    }
  }

  /**
   * Convert Unified BookingModel format to Charter format
   * @param {Object} booking - Unified booking model data
   * @returns {Charter} Charter data
   */
  static bookingToCharter(booking) {
    // Map unified payment status to charter payment status
    let paymentStatus = 'tentative'
    switch (booking.payment_status) {
      case PaymentStatus.FULL_PAYMENT:
        paymentStatus = 'full-paid'
        break
      case PaymentStatus.DEPOSIT_PAID:
        paymentStatus = 'deposit-paid'
        break
      case PaymentStatus.REFUNDED:
        paymentStatus = 'refunded'
        break
      default:
        paymentStatus = 'tentative'
    }

    // Determine status based on dates and booking status
    const now = new Date()
    const startDate = new Date(booking.start_date)
    const endDate = new Date(booking.end_date)
    
    let status = 'upcoming'
    if (booking.booking_status === BookingStatus.CANCELLED) {
      status = 'cancelled'
    } else if (booking.booking_status === BookingStatus.COMPLETED) {
      status = 'completed'
    } else if (startDate <= now && endDate >= now) {
      status = 'active'
    }

    return {
      id: booking.id,
      yachtName: booking.yacht_name || booking.yacht_id,
      startDate: booking.start_date.toISOString(),
      endDate: booking.end_date.toISOString(),
      status: status,
      paymentStatus: paymentStatus,
      hasOverdueTasks: false, // Can be computed based on booking status
      calendarColor: this._getStatusColor(booking.booking_status)
    }
  }
  
  /**
   * Get color based on booking status
   * @param {string} bookingStatus - Booking status
   * @returns {string} Color hex code
   */
  static _getStatusColor(bookingStatus) {
    switch (bookingStatus) {
      case BookingStatus.CONFIRMED: return '#3B82F6'
      case BookingStatus.TENTATIVE: return '#F59E0B'
      case BookingStatus.COMPLETED: return '#10B981'
      case BookingStatus.CANCELLED: return '#EF4444'
      default: return '#6B7280'
    }
  }
}

/**
 * Unified Data Service Class
 * Manages all charter/booking data and provides consistent interfaces
 */
class UnifiedDataService {
  constructor() {
    this.charters = [...mockCharters]
    this.bookings = []
    this.subscribers = new Set()
    this.lastUpdate = Date.now()
    
    // Initialize bookings from charters
    this.syncBookingsFromCharters()
  }

  /**
   * Subscribe to data changes
   * @param {Function} callback - Callback function to call on data changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.add(callback)
    return () => {
      this.subscribers.delete(callback)
    }
  }

  /**
   * Notify all subscribers of data changes
   * @param {string} type - Type of change
   * @param {Object} data - Changed data
   */
  notifySubscribers(type, data = {}) {
    this.lastUpdate = Date.now()
    
    const event = {
      type,
      timestamp: this.lastUpdate,
      ...data
    }

    // Notify internal subscribers
    this.subscribers.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in subscriber callback:', error)
      }
    })

    // Notify external event emitter (for SIT REP and other components)
    eventEmitter.emit('op:update', event)
  }

  /**
   * Sync bookings from charters data
   */
  syncBookingsFromCharters() {
    this.bookings = this.charters.map(charter => 
      DataTransformer.charterToBooking(charter)
    )
    this.notifySubscribers('BULK_UPDATE', { bookings: this.bookings, charters: this.charters })
  }

  /**
   * Sync charters from bookings data
   */
  syncChartersFromBookings() {
    this.charters = this.bookings.map(booking => 
      DataTransformer.bookingToCharter(booking)
    )
    this.notifySubscribers('BULK_UPDATE', { bookings: this.bookings, charters: this.charters })
  }

  // ====================
  // CHARTER DATA METHODS (for SIT REP)
  // ====================

  /**
   * Get all charters (for SIT REP widget)
   * @returns {Charter[]} Array of charter data
   */
  getAllCharters() {
    return [...this.charters]
  }

  /**
   * Update a charter
   * @param {string} id - Charter ID
   * @param {Partial<Charter>} updates - Charter updates
   * @returns {Charter} Updated charter
   */
  updateCharter(id, updates) {
    const index = this.charters.findIndex(charter => charter.id === id)
    if (index === -1) {
      throw new Error(`Charter with id ${id} not found`)
    }

    this.charters[index] = { ...this.charters[index], ...updates }
    
    // Sync to bookings
    this.syncBookingsFromCharters()
    
    this.notifySubscribers('CHARTER_UPDATED', { 
      charter: this.charters[index],
      booking: this.bookings[index]
    })
    
    return this.charters[index]
  }

  /**
   * Add a new charter
   * @param {Charter} charter - Charter data
   * @returns {Charter} Added charter
   */
  addCharter(charter) {
    this.charters.push(charter)
    
    // Sync to bookings
    const newBooking = DataTransformer.charterToBooking(charter)
    this.bookings.push(newBooking)
    
    this.notifySubscribers('CHARTER_CREATED', { 
      charter,
      booking: newBooking
    })
    
    return charter
  }

  /**
   * Delete a charter
   * @param {string} id - Charter ID
   * @returns {boolean} Success status
   */
  deleteCharter(id) {
    const index = this.charters.findIndex(charter => charter.id === id)
    if (index === -1) {
      return false
    }

    const deletedCharter = this.charters[index]
    this.charters.splice(index, 1)
    this.bookings.splice(index, 1)
    
    this.notifySubscribers('CHARTER_DELETED', { 
      charterId: id,
      bookingId: id,
      deletedCharter
    })
    
    return true
  }

  // ====================
  // BOOKING DATA METHODS (for Calendar and Booking pages)
  // ====================

  /**
   * Get all bookings (for Calendar and Booking pages)
   * @returns {Object[]} Array of booking data
   */
  getAllBookings() {
    return [...this.bookings]
  }

  /**
   * Get booking by ID
   * @param {string} id - Booking ID
   * @returns {Object|null} Booking data
   */
  getBooking(id) {
    return this.bookings.find(booking => booking.id === id) || null
  }

  /**
   * Update a booking
   * @param {string} id - Booking ID
   * @param {Object} updates - Booking updates
   * @returns {Object} Updated booking
   */
  updateBooking(id, updates) {
    const index = this.bookings.findIndex(booking => booking.id === id)
    if (index === -1) {
      throw new Error(`Booking with id ${id} not found`)
    }

    this.bookings[index] = { ...this.bookings[index], ...updates }
    
    // Sync to charters
    this.charters[index] = DataTransformer.bookingToCharter(this.bookings[index])
    
    this.notifySubscribers('BOOKING_UPDATED', { 
      booking: this.bookings[index],
      charter: this.charters[index]
    })
    
    return this.bookings[index]
  }

  /**
   * Add a new booking
   * @param {Object} booking - Booking data
   * @returns {Object} Added booking
   */
  addBooking(booking) {
    this.bookings.push(booking)
    
    // Sync to charters
    const newCharter = DataTransformer.bookingToCharter(booking)
    this.charters.push(newCharter)
    
    this.notifySubscribers('BOOKING_CREATED', { 
      booking,
      charter: newCharter
    })
    
    return booking
  }

  /**
   * Delete a booking
   * @param {string} id - Booking ID
   * @returns {boolean} Success status
   */
  deleteBooking(id) {
    const index = this.bookings.findIndex(booking => booking.id === id)
    if (index === -1) {
      return false
    }

    const deletedBooking = this.bookings[index]
    this.bookings.splice(index, 1)
    this.charters.splice(index, 1)
    
    this.notifySubscribers('BOOKING_DELETED', { 
      bookingId: id,
      charterId: id,
      deletedBooking
    })
    
    return true
  }

  // ====================
  // QUERY METHODS
  // ====================

  /**
   * Get bookings for a specific yacht
   * @param {string} yachtId - Yacht ID
   * @returns {Object[]} Bookings for the yacht
   */
  getBookingsForYacht(yachtId) {
    return this.bookings.filter(booking => 
      booking.yacht_id === yachtId || booking.yacht_name === yachtId
    )
  }

  /**
   * Get charters by status
   * @param {string} status - Charter status ('active' | 'upcoming')
   * @returns {Charter[]} Filtered charters
   */
  getChartersByStatus(status) {
    return this.charters.filter(charter => charter.status === status)
  }

  /**
   * Get bookings in date range (updated for unified schema)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object[]} Bookings in range
   */
  getBookingsInDateRange(startDate, endDate) {
    return this.bookings.filter(booking => {
      const bookingStart = new Date(booking.start_date)
      const bookingEnd = new Date(booking.end_date)
      
      return (bookingStart <= endDate && bookingEnd >= startDate)
    })
  }

  // ====================
  // UTILITY METHODS
  // ====================

  /**
   * Simulate async data loading with delay
   * @param {number} delay - Delay in milliseconds
   * @returns {Promise<void>}
   */
  async simulateLoad(delay = 500) {
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Get last update timestamp
   * @returns {number} Timestamp
   */
  getLastUpdate() {
    return this.lastUpdate
  }

  /**
   * Reset data to initial state
   */
  reset() {
    this.charters = [...mockCharters]
    this.syncBookingsFromCharters()
  }
}

// Create singleton instance
const unifiedDataService = new UnifiedDataService()

export default unifiedDataService
export { DataTransformer, UnifiedDataService }