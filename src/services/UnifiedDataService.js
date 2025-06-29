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

import { sampleCharters } from '../data/mockData.js'
import { eventEmitter } from '../utils/eventEmitter.js'
import BookingModel, { BookingStatus, CharterType, PaymentStatus } from '../models/index.js'
import { supabase, supabaseConfig } from '../services/supabase/supabaseClient.js'

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
    // Split customer name into first and last
    const nameParts = charter.customerName.split(' ')
    const firstName = nameParts[0] || 'Customer'
    const lastName = nameParts.slice(1).join(' ') || 'Name'
    
    return {
      id: charter.id,
      booking_number: `BK-${charter.id.toUpperCase()}`,
      
      // Embedded customer information from sample data
      customer_first_name: firstName,
      customer_surname: lastName,
      customer_email: charter.customerEmail,
      customer_phone: charter.customerPhone,
      customer_street: '123 Charter Street',
      customer_city: 'Southampton',
      customer_postcode: 'SO14 3XG',
      customer_country: 'United Kingdom',
      
      // Denormalized yacht information
      yacht_id: charter.yachtName.toLowerCase().replace(/\s+/g, '-'), // Convert to kebab-case ID
      yacht_name: charter.yachtName,
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
      base_rate: charter.totalPrice || 12000.00,
      total_amount: charter.totalPrice || 15000.00,
      deposit_amount: (charter.totalPrice || 15000.00) * 0.2, // 20% deposit
      balance_due: charter.paymentStatus === 'full-paid' ? 0.00 : (charter.totalPrice || 15000.00) * 0.8,
      
      // Additional fields
      special_requirements: '',
      notes: charter.notes || `Charter for ${charter.yachtName}`,
      
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
    // Determine payment status from individual toggle states (primary method)
    let paymentStatus = 'tentative'
    if (booking.final_payment_paid || booking.finalPaymentPaid) {
      paymentStatus = 'full-paid'
    } else if (booking.deposit_paid || booking.depositPaid) {
      paymentStatus = 'deposit-paid'
    } else if (booking.booking_confirmed || booking.bookingConfirmed) {
      paymentStatus = 'tentative'
    } else {
      paymentStatus = 'pending'
    }
    
    // Fallback to unified payment status if toggle states not available
    if (!booking.booking_confirmed && !booking.bookingConfirmed && booking.payment_status) {
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
      yachtName: booking.yacht_name,
      bookingCode: booking.booking_number,
      chartererName: `${booking.customer_first_name} ${booking.customer_surname}`.trim(),
      startDate: typeof booking.start_date === 'string' ? booking.start_date : booking.start_date.toISOString(),
      endDate: typeof booking.end_date === 'string' ? booking.end_date : booking.end_date.toISOString(),
      status: status,
      paymentStatus: paymentStatus,
      
      // Include individual toggle states for color utility compatibility
      bookingConfirmed: booking.booking_confirmed || booking.bookingConfirmed || false,
      depositPaid: booking.deposit_paid || booking.depositPaid || false,
      finalPaymentPaid: booking.final_payment_paid || booking.finalPaymentPaid || false,
      contractSent: booking.contract_sent || booking.contractSent || false,
      contractSigned: booking.contract_signed || booking.contractSigned || false,
      depositInvoiceSent: booking.deposit_invoice_sent || booking.depositInvoiceSent || false,
      receiptIssued: booking.receipt_issued || booking.receiptIssued || false,
      
      hasOverdueTasks: booking.hasOverdueTasks || false,
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
    this.charters = []
    this.bookings = []
    this.subscribers = new Set()
    this.lastUpdate = Date.now()
    this.useSupabase = supabaseConfig.enabled && !!supabase
    this.isInitialized = false
    this.subscriptions = []
    
    // Initialize data from appropriate source
    this.initializeData()
  }

  /**
   * Initialize data from Supabase or mock data based on configuration
   */
  async initializeData() {
    console.log('UnifiedDataService: Initializing data...')
    console.log('Configuration:', {
      useSupabase: this.useSupabase,
      hasSupabaseClient: !!supabase,
      configEnabled: supabaseConfig.enabled,
      dbAvailable: !!supabase
    })
    
    if (this.useSupabase) {
      try {
        console.log('UnifiedDataService: Attempting to load from Supabase...')
        // Load data from Supabase
        await this.loadFromSupabase()
        
        // Set up real-time subscriptions
        this.setupRealtimeSubscriptions()
        
        console.log('UnifiedDataService: Successfully initialized with Supabase')
      } catch (error) {
        console.error('UnifiedDataService: Failed to initialize from Supabase:', error)
        console.log('UnifiedDataService: Falling back to mock data')
        this.useSupabase = false // Disable for this session
        this.initializeMockData()
      }
    } else {
      console.log('UnifiedDataService: Using mock data (Supabase disabled or unavailable)')
      this.initializeMockData()
    }
    
    this.isInitialized = true
    this.notifySubscribers('INITIALIZED', { 
      useSupabase: this.useSupabase,
      bookingCount: this.bookings.length,
      charterCount: this.charters.length
    })
  }

  /**
   * Initialize with mock data
   */
  initializeMockData() {
    this.charters = [...sampleCharters]
    this.syncBookingsFromCharters()
  }

  /**
   * Load data from Supabase
   */
  async loadFromSupabase() {
    try {
      console.log('Attempting to load bookings from Supabase...')
      // Load bookings from Supabase
      const { data: supabaseBookings, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      this.bookings = supabaseBookings || []
      
      console.log('Raw Supabase bookings:', this.bookings)
      
      // Convert bookings to charters for backward compatibility
      this.syncChartersFromBookings()
      
      console.log(`Loaded ${this.bookings.length} bookings from Supabase`)
      console.log('Converted charters:', this.charters)
    } catch (error) {
      console.error('Error loading from Supabase:', error)
      throw error
    }
  }

  /**
   * Set up real-time subscriptions to Supabase
   */
  setupRealtimeSubscriptions() {
    if (!supabase) {
      console.log('UnifiedDataService: Skipping real-time subscriptions (Supabase not available)')
      return
    }

    console.log('UnifiedDataService: Setting up real-time subscriptions...')

    // Subscribe to booking changes
    const bookingSubscription = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
      console.log('UnifiedDataService: Real-time booking change:', payload)
      
      switch (payload.eventType) {
        case 'INSERT':
          this.bookings.push(payload.new)
          this.notifySubscribers('BOOKING_CREATED', { booking: payload.new })
          break
        case 'UPDATE':
          const updateIndex = this.bookings.findIndex(b => b.id === payload.new.id)
          if (updateIndex !== -1) {
            this.bookings[updateIndex] = payload.new
            this.notifySubscribers('BOOKING_UPDATED', { booking: payload.new })
          }
          break
        case 'DELETE':
          this.bookings = this.bookings.filter(b => b.id !== payload.old.id)
          this.notifySubscribers('BOOKING_DELETED', { bookingId: payload.old.id })
          break
      }
      
      // Keep charters in sync
      this.syncChartersFromBookings()
    })
      .subscribe()

    // Only add valid subscriptions
    this.subscriptions = []
    if (bookingSubscription) {
      this.subscriptions.push(bookingSubscription)
      console.log('UnifiedDataService: Real-time subscription for bookings created successfully')
    } else {
      console.warn('UnifiedDataService: Failed to create real-time subscription for bookings')
    }
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
  async updateBooking(id, updates) {
    if (this.useSupabase && supabase) {
      try {
        // Update in Supabase
        const { data: updatedBooking, error } = await supabase
          .from('bookings')
          .update(updates)
          .eq('id', id)
          .select()
          .single()
        
        if (error) throw error
        
        // Update local state
        const index = this.bookings.findIndex(booking => booking.id === id)
        if (index !== -1) {
          this.bookings[index] = updatedBooking
          this.syncChartersFromBookings()
        }
        
        this.notifySubscribers('BOOKING_UPDATED', { 
          booking: updatedBooking,
          charter: this.charters[index]
        })
        
        return updatedBooking
      } catch (error) {
        console.error('Failed to update booking in Supabase:', error)
        throw error
      }
    } else {
      // Use local mock data
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
  }

  /**
   * Add a new booking
   * @param {Object} booking - Booking data
   * @returns {Object} Added booking
   */
  async addBooking(booking) {
    if (this.useSupabase && supabase) {
      try {
        // Create in Supabase
        const { data: newBooking, error } = await supabase
          .from('bookings')
          .insert([booking])
          .select()
          .single()
        
        if (error) throw error
        
        // Add to local state
        this.bookings.push(newBooking)
        
        // Sync to charters
        const newCharter = DataTransformer.bookingToCharter(newBooking)
        this.charters.push(newCharter)
        
        this.notifySubscribers('BOOKING_CREATED', { 
          booking: newBooking,
          charter: newCharter
        })
        
        return newBooking
      } catch (error) {
        console.error('Failed to create booking in Supabase:', error)
        throw error
      }
    } else {
      // Use local mock data
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
  }

  /**
   * Delete a booking
   * @param {string} id - Booking ID
   * @returns {boolean} Success status
   */
  async deleteBooking(id) {
    if (this.useSupabase && supabase) {
      try {
        // Delete from Supabase
        const { error } = await supabase
          .from('bookings')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        
        // Remove from local state
        const index = this.bookings.findIndex(booking => booking.id === id)
        if (index !== -1) {
          const deletedBooking = this.bookings[index]
          this.bookings.splice(index, 1)
          this.charters.splice(index, 1)
          
          this.notifySubscribers('BOOKING_DELETED', { 
            bookingId: id,
            charterId: id,
            deletedBooking
          })
        }
        
        return true
      } catch (error) {
        console.error('Failed to delete booking from Supabase:', error)
        throw error
      }
    } else {
      // Use local mock data
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
  }

  // ====================
  // QUERY METHODS
  // ====================

  /**
   * Get bookings for a specific yacht
   * @param {string} yachtId - Yacht ID (kebab-case format like 'calico-moon')
   * @returns {Object[]} Bookings for the yacht
   */
  getBookingsForYacht(yachtId) {
    return this.bookings.filter(booking => 
      booking.yacht_id === yachtId
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
   * Force refresh data from source
   */
  async refresh() {
    console.log('UnifiedDataService: Force refreshing data...')
    
    if (this.useSupabase && supabase) {
      try {
        await this.loadFromSupabase()
        console.log('UnifiedDataService: Successfully refreshed from Supabase')
      } catch (error) {
        console.error('UnifiedDataService: Failed to refresh from Supabase:', error)
        // Don't fall back to mock data on refresh failure
        throw error
      }
    } else {
      // Refresh mock data (reload from original source)
      this.initializeMockData()
      console.log('UnifiedDataService: Refreshed mock data')
    }
    
    this.notifySubscribers('REFRESHED', {
      useSupabase: this.useSupabase,
      bookingCount: this.bookings.length,
      charterCount: this.charters.length
    })
  }

  /**
   * Reset data to initial state
   */
  reset() {
    if (this.useSupabase) {
      this.loadFromSupabase()
    } else {
      this.charters = [...sampleCharters]
      this.syncBookingsFromCharters()
    }
  }

  /**
   * Cleanup subscriptions and resources
   */
  cleanup() {
    if (this.subscriptions) {
      this.subscriptions.forEach(subscription => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe()
        }
      })
      this.subscriptions = []
    }
    
    this.subscribers.clear()
  }
}

// Create singleton instance
const unifiedDataService = new UnifiedDataService()

export default unifiedDataService
export { DataTransformer, UnifiedDataService }