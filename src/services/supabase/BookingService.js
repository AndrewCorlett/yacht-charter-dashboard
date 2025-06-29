/**
 * Booking Service
 * Handles all booking-related operations with Supabase
 * Works with the unified bookings table schema
 * 
 * @created 2025-06-26
 */

import { supabase, supabaseConfig, TABLES, queryHelpers, RealtimeSubscription } from './supabaseClient.js'
import { BookingModel, BookingNumberGenerator, BookingNumberFormat } from '../../models'

class BookingService {
  constructor() {
    this.subscriptions = new Map()
  }

  /**
   * Create a new booking
   * @param {Object} bookingData - Booking data matching unified schema
   * @returns {Promise<Object>} Created booking
   */
  async createBooking(bookingData) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      // Create BookingModel instance for validation
      const booking = new BookingModel(bookingData)
      
      // Generate booking number if not provided
      if (!booking.booking_number) {
        booking.booking_number = await this.generateBookingNumber(booking.yacht_id)
      }

      // Set timestamps
      const now = new Date().toISOString()
      booking.created_at = now
      booking.updated_at = now

      // Insert into database
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .insert([booking.toDatabase()])
        .select()
        .single()

      queryHelpers.handleError(error, 'createBooking')
      
      return new BookingModel(data)
    } catch (error) {
      console.error('Create booking error:', error)
      throw error
    }
  }

  /**
   * Get booking by ID
   * @param {string} id - Booking ID
   * @returns {Promise<Object>} Booking data
   */
  async getBooking(id) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .select('*')
        .eq('id', id)
        .single()

      queryHelpers.handleError(error, 'getBooking')
      
      return data ? new BookingModel(data) : null
    } catch (error) {
      console.error('Get booking error:', error)
      throw error
    }
  }

  /**
   * Get all bookings with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of bookings
   */
  async getBookings(filters = {}) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      let query = supabase.from(TABLES.BOOKINGS).select('*')

      // Apply filters
      if (filters.yacht_id) {
        query = query.eq('yacht_id', filters.yacht_id)
      }

      if (filters.booking_status) {
        query = query.eq('booking_status', filters.booking_status)
      }

      if (filters.payment_status) {
        query = query.eq('payment_status', filters.payment_status)
      }

      if (filters.customer_email) {
        query = query.eq('customer_email', filters.customer_email)
      }

      // Date range filters
      if (filters.startDate || filters.endDate) {
        query = queryHelpers.dateRangeFilter(
          query, 
          'start_date', 
          filters.startDate, 
          filters.endDate
        )
      }

      // Search across multiple fields
      if (filters.search) {
        query = queryHelpers.searchFilter(query, filters.search, [
          'booking_number',
          'customer_first_name',
          'customer_surname',
          'customer_email',
          'yacht_name',
          'customer_company'
        ])
      }

      // Pagination
      if (filters.page && filters.pageSize) {
        query = queryHelpers.paginate(query, filters.page, filters.pageSize)
      }

      // Sorting
      const orderBy = filters.orderBy || 'created_at'
      const orderDirection = filters.orderDirection || 'desc'
      query = query.order(orderBy, { ascending: orderDirection === 'asc' })

      const { data, error, count } = await query

      queryHelpers.handleError(error, 'getBookings')
      
      return {
        bookings: data ? data.map(b => new BookingModel(b)) : [],
        total: count || data?.length || 0
      }
    } catch (error) {
      console.error('Get bookings error:', error)
      throw error
    }
  }

  /**
   * Update a booking
   * @param {string} id - Booking ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated booking
   */
  async updateBooking(id, updates) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      // Remove read-only fields
      delete updates.id
      delete updates.created_at
      
      // Update timestamp
      updates.updated_at = new Date().toISOString()

      // Update change history
      const existingBooking = await this.getBooking(id)
      if (existingBooking) {
        updates.change_history = this.updateChangeHistory(
          existingBooking.change_history,
          updates
        )
      }

      // Transform field names to match database schema
      const transformedUpdates = this.transformFieldNames(updates)

      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .update(transformedUpdates)
        .eq('id', id)
        .select()
        .single()

      queryHelpers.handleError(error, 'updateBooking')
      
      return new BookingModel(data)
    } catch (error) {
      console.error('Update booking error:', error)
      throw error
    }
  }

  /**
   * Delete a booking
   * @param {string} id - Booking ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteBooking(id) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      const { error } = await supabase
        .from(TABLES.BOOKINGS)
        .delete()
        .eq('id', id)

      queryHelpers.handleError(error, 'deleteBooking')
      
      return true
    } catch (error) {
      console.error('Delete booking error:', error)
      throw error
    }
  }

  /**
   * Search bookings
   * @param {string} searchTerm - Search term
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Search results
   */
  async searchBookings(searchTerm, options = {}) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      const filters = {
        search: searchTerm,
        page: options.page || 1,
        pageSize: options.pageSize || 50,
        ...options
      }

      return await this.getBookings(filters)
    } catch (error) {
      console.error('Search bookings error:', error)
      throw error
    }
  }

  /**
   * Get bookings for a specific yacht
   * @param {string} yachtId - Yacht ID
   * @param {Date} startDate - Optional start date
   * @param {Date} endDate - Optional end date
   * @returns {Promise<Array>} Yacht bookings
   */
  async getYachtBookings(yachtId, startDate = null, endDate = null) {
    const filters = {
      yacht_id: yachtId,
      startDate,
      endDate
    }

    const result = await this.getBookings(filters)
    return result.bookings
  }

  /**
   * Check for booking conflicts
   * @param {Object} bookingData - Booking to check
   * @param {string} excludeId - Optional booking ID to exclude
   * @returns {Promise<Array>} Conflicting bookings
   */
  async checkConflicts(bookingData, excludeId = null) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      let query = supabase
        .from(TABLES.BOOKINGS)
        .select('*')
        .eq('yacht_id', bookingData.yacht_id)
        .lte('start_date', bookingData.end_date)
        .gte('end_date', bookingData.start_date)
        .in('booking_status', ['confirmed', 'tentative'])

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query

      queryHelpers.handleError(error, 'checkConflicts')
      
      return data ? data.map(b => new BookingModel(b)) : []
    } catch (error) {
      console.error('Check conflicts error:', error)
      throw error
    }
  }

  /**
   * Update booking status
   * @param {string} id - Booking ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated booking
   */
  async updateBookingStatus(id, status) {
    return await this.updateBooking(id, { booking_status: status })
  }

  /**
   * Update payment status
   * @param {string} id - Booking ID
   * @param {string} paymentStatus - New payment status
   * @returns {Promise<Object>} Updated booking
   */
  async updatePaymentStatus(id, paymentStatus) {
    const updates = { payment_status: paymentStatus }

    // Update related flags based on payment status
    if (paymentStatus === 'deposit_paid') {
      updates.deposit_paid = true
    } else if (paymentStatus === 'fully_paid') {
      updates.deposit_paid = true
      updates.balance_paid = true
    }

    return await this.updateBooking(id, updates)
  }

  /**
   * Toggle booking confirmation status
   * @param {string} id - Booking ID
   * @param {string} field - Field to toggle
   * @returns {Promise<Object>} Updated booking
   */
  async toggleBookingStatus(id, field) {
    const booking = await this.getBooking(id)
    if (!booking) throw new Error('Booking not found')

    const updates = {
      [field]: !booking[field]
    }

    return await this.updateBooking(id, updates)
  }

  /**
   * Subscribe to booking changes
   * @param {Function} callback - Callback for changes
   * @param {Object} filter - Optional filter
   * @returns {Function} Unsubscribe function
   */
  subscribeToBookings(callback, filter = null) {
    const subscription = new RealtimeSubscription(
      TABLES.BOOKINGS,
      filter,
      callback
    )

    subscription.subscribe()
    
    const subscriptionId = Date.now().toString()
    this.subscriptions.set(subscriptionId, subscription)

    return () => {
      subscription.unsubscribe()
      this.subscriptions.delete(subscriptionId)
    }
  }

  /**
   * Subscribe to specific booking changes
   * @param {string} bookingId - Booking ID
   * @param {Function} callback - Callback for changes
   * @returns {Function} Unsubscribe function
   */
  subscribeToBooking(bookingId, callback) {
    return this.subscribeToBookings(callback, `id.eq.${bookingId}`)
  }

  /**
   * Validate booking data
   * @param {Object} bookingData - Data to validate
   * @returns {Object} Validation result
   */
  validateBookingData(bookingData) {
    const errors = {}
    
    // Required fields
    if (!bookingData.customer_first_name) {
      errors.customer_first_name = 'First name is required'
    }
    
    if (!bookingData.customer_surname) {
      errors.customer_surname = 'Surname is required'
    }
    
    if (!bookingData.customer_email) {
      errors.customer_email = 'Email is required'
    } else if (!this.isValidEmail(bookingData.customer_email)) {
      errors.customer_email = 'Invalid email format'
    }
    
    if (!bookingData.yacht_id) {
      errors.yacht_id = 'Yacht selection is required'
    }
    
    if (!bookingData.start_date) {
      errors.start_date = 'Start date is required'
    }
    
    if (!bookingData.end_date) {
      errors.end_date = 'End date is required'
    }
    
    // Date validation
    if (bookingData.start_date && bookingData.end_date) {
      const start = new Date(bookingData.start_date)
      const end = new Date(bookingData.end_date)
      
      if (end <= start) {
        errors.end_date = 'End date must be after start date'
      }
    }

    // Numeric validations
    if (bookingData.total_price && bookingData.total_price < 0) {
      errors.total_price = 'Total price cannot be negative'
    }

    if (bookingData.guest_count && bookingData.guest_count < 1) {
      errors.guest_count = 'Guest count must be at least 1'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  /**
   * Helper: Generate booking number using sophisticated generator
   */
  async generateBookingNumber(yachtId = null) {
    try {
      // Create generator with year-month-sequence format for better organization
      const generator = new BookingNumberGenerator({
        format: BookingNumberFormat.YEAR_MONTH_SEQ,
        prefix: 'BK',
        sequenceLength: 3,
        sequenceProvider: async (key, value = null) => {
          // Use database-backed sequence for collision safety
          if (value !== null) {
            // This would be implemented with a sequences table in production
            return value
          }
          
          // For now, get count from existing bookings to ensure uniqueness
          const { count } = await supabase
            .from(TABLES.BOOKINGS)
            .select('*', { count: 'exact', head: true })
          
          return (count || 0) + 1
        }
      })

      // Load existing booking numbers for collision detection
      const { data: existingBookings } = await supabase
        .from(TABLES.BOOKINGS)
        .select('booking_number')
      
      if (existingBookings) {
        existingBookings.forEach(booking => {
          if (booking.booking_number) {
            generator._existingNumbers.add(booking.booking_number)
          }
        })
      }

      // Generate the booking number
      return await generator.generateBookingNumber({ yachtId })
    } catch (error) {
      console.error('Booking number generation error:', error)
      // Fallback to simple generation
      const prefix = 'BK'
      const year = new Date().getFullYear()
      const month = String(new Date().getMonth() + 1).padStart(2, '0')
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      return `${prefix}${year}${month}${random}`
    }
  }

  /**
   * Helper: Update change history
   */
  updateChangeHistory(existingHistory = [], changes) {
    const historyEntry = {
      timestamp: new Date().toISOString(),
      changes: Object.keys(changes).filter(key => key !== 'updated_at' && key !== 'change_history'),
      user: 'system' // Will be updated when auth is implemented
    }

    const history = Array.isArray(existingHistory) ? existingHistory : []
    history.push(historyEntry)

    // Keep last 50 entries
    return history.slice(-50)
  }

  /**
   * Helper: Validate email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Transform frontend camelCase field names to database snake_case
   * This handles the crewExperienceFile object decomposition issue
   */
  transformFieldNames(data) {
    const fieldMappings = {
      // Financial fields
      'balanceDue': 'balance_due',
      'totalAmount': 'total_amount',
      'depositAmount': 'deposit_amount',
      'baseRate': 'base_rate',
      
      // Customer fields
      'firstName': 'customer_first_name',
      'surname': 'customer_surname',
      'email': 'customer_email',
      'phone': 'customer_phone',
      'street': 'customer_street',
      'city': 'customer_city',
      'postcode': 'customer_postcode',
      'country': 'customer_country',
      
      // Booking details
      'charterType': 'charter_type',
      'startDate': 'start_date',
      'endDate': 'end_date',
      'portOfDeparture': 'port_of_departure',
      'portOfArrival': 'port_of_arrival',
      'yachtId': 'yacht_id',
      'customerId': 'customer_id',
      'bookingNumber': 'booking_number',
      
      // Status fields
      'bookingStatus': 'booking_status',
      'paymentStatus': 'payment_status',
      'bookingConfirmed': 'booking_confirmed',
      'depositPaid': 'deposit_paid',
      'finalPaymentPaid': 'final_payment_paid',
      'contractSent': 'contract_sent',
      'contractSigned': 'contract_signed',
      'depositInvoiceSent': 'deposit_invoice_sent',
      'receiptIssued': 'receipt_issued',
      
      // Timestamp fields
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      
      // File fields
      'crewExperienceFileName': 'crew_experience_file_name',
      'crewExperienceFileUrl': 'crew_experience_file_url',
      'crewExperienceFileSize': 'crew_experience_file_size',
      
      // Notes
      'specialRequirements': 'special_requirements',
      'notes': 'notes'
    }
    
    const transformed = {}
    
    for (const [key, value] of Object.entries(data)) {
      // Skip nested status object - we use flattened fields instead
      if (key === 'status' && typeof value === 'object') {
        continue
      }
      
      // Handle crewExperienceFile object decomposition
      if (key === 'crewExperienceFile' && value && typeof value === 'object') {
        // Decompose the file object into individual database fields
        if (value.name) {
          transformed.crew_experience_file_name = value.name
        }
        if (value.url) {
          transformed.crew_experience_file_url = value.url
        }
        if (value.size) {
          transformed.crew_experience_file_size = value.size
        }
        // Don't include the original object field
        continue
      }
      
      // Use mapped field name if available, otherwise keep original
      const dbFieldName = fieldMappings[key] || key
      transformed[dbFieldName] = value
    }
    
    return transformed
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe()
    })
    this.subscriptions.clear()
  }
}

// Create singleton instance
const bookingService = new BookingService()

// Export both instance and class
export default bookingService
export { BookingService }