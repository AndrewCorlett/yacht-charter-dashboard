/**
 * Booking Service
 * Handles all booking-related operations with Supabase
 * Works with the unified bookings table schema
 * 
 * @created 2025-06-26
 */

import { supabase, supabaseConfig, TABLES, queryHelpers, RealtimeSubscription } from './supabaseClient.js'
import BookingModel from '../../models/core/BookingModel-unified.js'
import { BookingNumberGenerator, BookingNumberFormat, YachtCodes } from '../../models/utilities/BookingNumberGenerator.js'

class BookingService {
  constructor() {
    this.subscriptions = new Map()
    this.yachtMappingCache = null
    this.yachtMappingCacheTime = null
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
        // Convert yacht UUID to yacht name for booking number generation
        const yachtIdentifier = booking.yacht_id
        console.log('[BookingService] Using yacht identifier for booking number:', yachtIdentifier)
        const yachtName = await this.getYachtNameFromId(yachtIdentifier)
        booking.booking_number = await this.generateBookingNumber(yachtName, booking.start_date)
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
   * Create an external booking placeholder
   * @param {Object} externalBookingData - External booking data
   * @returns {Promise<Object>} Created external booking
   */
  async createExternalBooking(externalBookingData) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      // Ensure it's marked as external
      const bookingData = {
        ...externalBookingData,
        booking_type: 'external',
        booking_status: 'confirmed', // External bookings are assumed confirmed
        notes: `External booking${externalBookingData.notes ? ': ' + externalBookingData.notes : ''}`
      }

      // Create the booking
      return await this.createBooking(bookingData)
    } catch (error) {
      console.error('Create external booking error:', error)
      throw error
    }
  }

  /**
   * Update booking number with conflict checking
   * @param {string} id - Booking ID
   * @param {string} newBookingNumber - New booking number
   * @returns {Promise<Object>} Updated booking
   */
  async updateBookingNumber(id, newBookingNumber) {
    if (!supabase) throw new Error('Supabase not initialized')
    if (!newBookingNumber || typeof newBookingNumber !== 'string') {
      throw new Error('Valid booking number is required')
    }

    // Validate booking number format (YYWWBCNN)
    const BOOKING_NUMBER_PATTERN = /^\d{2}\d{2}[A-Z]{2}\d{2}$/
    if (!BOOKING_NUMBER_PATTERN.test(newBookingNumber)) {
      throw new Error('Invalid booking number format. Expected: YYWWBCNN (e.g., 2528DD01)')
    }

    // Extract and validate components
    const yy = newBookingNumber.substring(0, 2)
    const ww = newBookingNumber.substring(2, 4)
    const boatCode = newBookingNumber.substring(4, 6)
    const nn = newBookingNumber.substring(6, 8)

    // Validate yacht code
    const validYachtCodes = ['CM', 'SP', 'AL', 'DD', 'ZA']
    if (!validYachtCodes.includes(boatCode)) {
      throw new Error(`Invalid yacht code: ${boatCode}. Must be one of: ${validYachtCodes.join(', ')}`)
    }

    // Validate week number (01-53)
    const weekNum = parseInt(ww, 10)
    if (weekNum < 1 || weekNum > 53) {
      throw new Error(`Invalid week number: ${ww}. Must be between 01 and 53`)
    }

    try {
      // Check if the new booking number already exists
      const { data: existingBookings, error: checkError } = await supabase
        .from(TABLES.BOOKINGS)
        .select('id')
        .eq('booking_number', newBookingNumber)
        .neq('id', id) // Exclude current booking

      if (checkError) {
        queryHelpers.handleError(checkError, 'checkBookingNumberConflict')
      }

      if (existingBookings && existingBookings.length > 0) {
        throw new Error(`Booking number ${newBookingNumber} is already in use`)
      }

      // Update the booking number
      const updates = {
        booking_number: newBookingNumber,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      queryHelpers.handleError(error, 'updateBookingNumber')
      
      return new BookingModel(data)
    } catch (error) {
      console.error('Update booking number error:', error)
      throw error
    }
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
   * Helper: Build and cache yacht UUID to name mapping
   */
  async buildYachtMapping() {
    console.log('[BookingService] Building yacht UUID to name mapping')
    
    try {
      const { data, error } = await supabase
        .from('yachts')
        .select('id, name')
      
      if (error) throw error
      
      const mapping = {}
      if (data) {
        data.forEach(yacht => {
          const normalizedName = yacht.name.toLowerCase().replace(/\s+/g, '-')
          mapping[yacht.id] = normalizedName
          console.log(`[BookingService] Mapped ${yacht.id} -> ${normalizedName}`)
        })
      }
      
      // Cache the mapping for 5 minutes
      this.yachtMappingCache = mapping
      this.yachtMappingCacheTime = Date.now()
      
      console.log(`[BookingService] Built mapping for ${Object.keys(mapping).length} yachts`)
      return mapping
      
    } catch (error) {
      console.error('[BookingService] Failed to build yacht mapping:', error)
      
      // Fallback mapping with known UUIDs (discovered from database)
      const fallbackMapping = {
        'c2c363c7-ca98-43e9-901d-630ea62ccdce': 'alrisha',
        '0693ac17-4197-4039-964a-93b312c39750': 'spectre', 
        '9f9a76fb-21ff-43bd-b2bc-b9ca8efef866': 'mridula-sarwar',
        '234a2f45-1e79-44fb-b5aa-3c058f777255': 'disk-drive',
        '3ffa9ca5-bd8e-4050-8b49-e5230fb23c73': 'zavaria',
        '50dba171-b830-4d88-9cb0-c14a37c4d58a': 'calico-moon'
      }
      
      console.log('[BookingService] Using fallback mapping with', Object.keys(fallbackMapping).length, 'entries')
      this.yachtMappingCache = fallbackMapping
      this.yachtMappingCacheTime = Date.now()
      
      return fallbackMapping
    }
  }

  /**
   * Helper: Convert yacht UUID to yacht name for booking number generation
   */
  async getYachtNameFromId(yachtId) {
    console.log('[BookingService] Converting yacht UUID to name:', yachtId)
    
    try {
      // Check if it's already a yacht name (not a UUID)
      if (!yachtId.includes('-')) {
        console.log('[BookingService] Already a yacht name:', yachtId)
        return yachtId
      }
      
      // Check cache (refresh if older than 5 minutes)
      const cacheAge = Date.now() - (this.yachtMappingCacheTime || 0)
      if (!this.yachtMappingCache || cacheAge > 5 * 60 * 1000) {
        console.log('[BookingService] Cache expired or missing, rebuilding yacht mapping')
        await this.buildYachtMapping()
      }
      
      // Look up UUID in cached mapping
      const yachtName = this.yachtMappingCache[yachtId]
      if (yachtName) {
        console.log('[BookingService] Found yacht name in mapping:', yachtId, '->', yachtName)
        return yachtName
      }
      
      // If not found, try to refresh the mapping once more
      console.log('[BookingService] UUID not found in cache, refreshing mapping')
      await this.buildYachtMapping()
      
      const refreshedName = this.yachtMappingCache[yachtId]
      if (refreshedName) {
        console.log('[BookingService] Found yacht name after refresh:', yachtId, '->', refreshedName)
        return refreshedName
      }
      
      // If still not found, throw error with helpful information
      const availableUUIDs = Object.keys(this.yachtMappingCache)
      throw new Error(`Unknown yacht ID: ${yachtId}. Valid yacht IDs: ${availableUUIDs.join(', ')}`)
      
    } catch (error) {
      console.error('[BookingService] Failed to convert yacht UUID to name:', error)
      throw error
    }
  }

  /**
   * Helper: Generate booking number using new YYWWBCNN format
   */
  async generateBookingNumber(yachtId = null, startDate = null) {
    console.log('[BookingService] Generating booking number for yacht:', yachtId, 'startDate:', startDate)
    
    try {
      if (!yachtId) {
        throw new Error('Yacht ID is required for booking number generation')
      }
      
      if (!startDate) {
        throw new Error('Start date is required for booking number generation')
      }

      // Create generator with new year-week-yacht-sequence format
      const generator = new BookingNumberGenerator({
        format: BookingNumberFormat.YEAR_WEEK_YACHT_SEQ
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

      // Create existing bookings provider for gap-filling logic
      const existingBookingsProvider = async (yy, boatCode) => {
        console.log(`[BookingService] Querying existing bookings for year ${yy} and boat ${boatCode}`)
        
        // Use precise pattern: YYWWBCNN where YY=year, WW=week (2 digits), BC=boat code, NN=sequence
        // The underscore _ in PostgreSQL LIKE matches exactly one character
        const pattern = `${yy}__${boatCode}__`
        
        const { data } = await supabase
          .from(TABLES.BOOKINGS)
          .select('booking_number')
          .like('booking_number', pattern)
        
        const existingCodes = data ? data.map(b => b.booking_number).filter(Boolean) : []
        console.log(`[BookingService] Found existing codes for pattern ${pattern}:`, existingCodes)
        return existingCodes
      }

      // Generate the booking number
      const charterStartDate = new Date(startDate)
      console.log('[BookingService] Charter start date:', charterStartDate)
      
      const bookingCode = await generator.generateBookingNumber({ 
        yachtId, 
        date: charterStartDate,
        existingBookingsProvider
      })
      
      console.log('[BookingService] Generated booking code:', bookingCode)
      return bookingCode
      
    } catch (error) {
      console.error('Booking number generation error:', error)
      throw error // Don't use fallback, we want to see the error
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
      'charterCost': 'total_amount', // Map charterCost to total_amount in database
      'deposit': 'deposit_amount', // Map deposit to deposit_amount in database
      'securityDeposit': 'security_deposit', // Map securityDeposit to security_deposit in database
      
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
      'tripType': 'charter_type', // Legacy field name mapping
      'yacht': 'yacht_id', // Legacy field name mapping
      'startDate': 'start_date',
      'endDate': 'end_date',
      'portOfDeparture': 'port_of_departure',
      'portOfArrival': 'port_of_arrival',
      'yachtId': 'yacht_id',
      'yachtName': 'yacht_name',
      'yachtType': 'yacht_type', 
      'yachtLocation': 'yacht_location', // Fix for yachtLocation field mapping error
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
      
      // Status timestamp fields
      'bookingConfirmedAt': 'booking_confirmed_at',
      'depositPaidAt': 'deposit_paid_at',
      'finalPaymentMadeAt': 'final_payment_paid_at', // Note: frontend uses "Made", database uses "paid"
      'contractSentAt': 'contract_sent_at',
      'contractSignedAt': 'contract_signed_at',
      'depositInvoiceSentAt': 'deposit_invoice_sent_at',
      'receiptIssuedAt': 'receipt_issued_at',
      
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
      
      // Skip documentStates object - we use individual timestamp fields instead
      if (key === 'documentStates' && typeof value === 'object') {
        continue
      }
      
      
      // Handle crewExperienceFile - ALWAYS skip this field, never pass to database
      if (key === 'crewExperienceFile') {
        // If it's an object, decompose it into individual database fields
        if (value && typeof value === 'object') {
          if (value.name) {
            transformed.crew_experience_file_name = value.name
          }
          if (value.url) {
            transformed.crew_experience_file_url = value.url
          }
          if (value.size) {
            transformed.crew_experience_file_size = value.size
          }
        }
        // Always skip the original crewExperienceFile field regardless of value
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