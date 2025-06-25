/**
 * Booking Model - Primary Table for Yacht Charter Bookings
 * 
 * Comprehensive data model matching Supabase schema specifications with
 * iCS calendar compatibility and business logic validation.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

import { format, parseISO, isValid, isBefore, isAfter } from 'date-fns'
import { BookingConflictService } from '../../services/BookingConflictService'

/**
 * Booking status enumeration matching database constraints
 */
export const BookingStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
  DEPOSIT_PENDING: 'deposit_pending',
  FINAL_PAYMENT_PENDING: 'final_payment_pending'
}

/**
 * Booking type enumeration for different charter types
 */
export const BookingType = {
  CHARTER: 'charter',
  OWNER: 'owner',
  MAINTENANCE: 'maintenance',
  BLOCKED: 'blocked'
}

/**
 * Main Booking Model Class
 * 
 * Represents a complete yacht booking with all associated data,
 * validation rules, and business logic methods.
 */
export class BookingModel {
  /**
   * Create a new BookingModel instance
   * 
   * @param {Object} data - Initial booking data
   * @param {string} [data.id] - UUID primary key (auto-generated if not provided)
   * @param {string} [data.ical_uid] - RFC 5545 compliant calendar UID
   * @param {string} data.summary - Calendar display text
   * @param {string} [data.description] - Detailed booking information
   * @param {string} [data.location] - Yacht + marina location
   * @param {string|Date} data.start_datetime - Booking start date/time
   * @param {string|Date} data.end_datetime - Booking end date/time
   * @param {string} data.yacht_id - Reference to yacht
   * @param {string} data.customer_name - Primary customer name
   * @param {string} [data.booking_no] - Unique booking reference (auto-generated)
   * @param {string} [data.trip_no] - Trip reference number
   * @param {string} data.customer_email - Customer contact email
   * @param {string} [data.customer_phone] - Customer contact phone
   * @param {number} [data.total_value] - Total charter value
   * @param {number} [data.deposit_amount] - Required deposit amount
   * @param {string} [data.status] - Booking status from enum
   * @param {string|Date} [data.created_at] - Creation timestamp
   * @param {string|Date} [data.modified_at] - Last modification timestamp
   */
  constructor(data = {}) {
    // Generate IDs if not provided
    this.id = data.id || this._generateUUID()
    this.ical_uid = data.ical_uid || this._generateICalUID()
    
    // iCS Calendar Compatibility Fields
    this.summary = data.summary || ''
    this.description = data.description || ''
    this.location = data.location || ''
    this.start_datetime = this._parseDateTime(data.start_datetime)
    this.end_datetime = this._parseDateTime(data.end_datetime)
    
    // Business Information
    this.yacht_id = data.yacht_id || ''
    this.customer_name = data.customer_name || ''
    this.booking_no = data.booking_no || this._generateBookingNumber()
    this.trip_no = data.trip_no || ''
    this.customer_email = data.customer_email || ''
    this.customer_phone = data.customer_phone || ''
    this.total_value = this._parseDecimal(data.total_value)
    this.deposit_amount = this._parseDecimal(data.deposit_amount)
    
    // System Fields
    this.status = data.status || BookingStatus.PENDING
    this.created_at = this._parseDateTime(data.created_at) || new Date()
    this.modified_at = this._parseDateTime(data.modified_at) || new Date()
    
    // Additional business fields for frontend use
    this.type = data.type || BookingType.CHARTER
    this.notes = data.notes || ''
    this.deposit_paid = Boolean(data.deposit_paid)
    this.final_payment_paid = Boolean(data.final_payment_paid)
    
    // Validation errors storage
    this._errors = new Map()
  }

  /**
   * Generate a new UUID for the booking
   * @returns {string} RFC 4122 compliant UUID
   * @private
   */
  _generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  /**
   * Generate RFC 5545 compliant iCal UID
   * @returns {string} iCal UID string
   * @private
   */
  _generateICalUID() {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `booking-${timestamp}-${random}@seascape-yachts.com`
  }

  /**
   * Generate unique booking number with prefix
   * @returns {string} Formatted booking number
   * @private
   */
  _generateBookingNumber() {
    const year = new Date().getFullYear().toString().slice(-2)
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0')
    const random = Math.floor(Math.random() * 999) + 1
    return `BK${year}${month}${random.toString().padStart(3, '0')}`
  }

  /**
   * Parse and validate datetime input
   * @param {string|Date|null} value - Input datetime
   * @returns {Date|null} Parsed date or null
   * @private
   */
  _parseDateTime(value) {
    if (!value) return null
    if (value instanceof Date) return value
    if (typeof value === 'string') {
      const parsed = parseISO(value)
      return isValid(parsed) ? parsed : null
    }
    return null
  }

  /**
   * Parse and validate decimal input
   * @param {string|number|null} value - Input decimal
   * @returns {number|null} Parsed decimal or null
   * @private
   */
  _parseDecimal(value) {
    if (value === null || value === undefined || value === '') return null
    const parsed = parseFloat(value)
    return isNaN(parsed) ? null : parsed
  }

  /**
   * Validate all booking data according to business rules
   * @returns {boolean} True if valid, false otherwise
   */
  validate() {
    this._errors.clear()

    // Required field validation
    if (!this.summary?.trim()) {
      this._errors.set('summary', 'Booking summary is required')
    }

    if (!this.yacht_id?.trim()) {
      this._errors.set('yacht_id', 'Yacht selection is required')
    }

    if (!this.customer_name?.trim()) {
      this._errors.set('customer_name', 'Customer name is required')
    }

    if (!this.customer_email?.trim()) {
      this._errors.set('customer_email', 'Customer email is required')
    } else if (!this._isValidEmail(this.customer_email)) {
      this._errors.set('customer_email', 'Invalid email format')
    }

    // Date validation
    if (!this.start_datetime) {
      this._errors.set('start_datetime', 'Start date/time is required')
    }

    if (!this.end_datetime) {
      this._errors.set('end_datetime', 'End date/time is required')
    }

    if (this.start_datetime && this.end_datetime) {
      if (!isBefore(this.start_datetime, this.end_datetime)) {
        this._errors.set('end_datetime', 'End date must be after start date')
      }
    }

    // Status validation
    if (!Object.values(BookingStatus).includes(this.status)) {
      this._errors.set('status', 'Invalid booking status')
    }

    // Type validation
    if (!Object.values(BookingType).includes(this.type)) {
      this._errors.set('type', 'Invalid booking type')
    }

    // Financial validation
    if (this.total_value !== null && this.total_value < 0) {
      this._errors.set('total_value', 'Total value cannot be negative')
    }

    if (this.deposit_amount !== null && this.deposit_amount < 0) {
      this._errors.set('deposit_amount', 'Deposit amount cannot be negative')
    }

    if (this.total_value !== null && this.deposit_amount !== null && 
        this.deposit_amount > this.total_value) {
      this._errors.set('deposit_amount', 'Deposit cannot exceed total value')
    }

    // Phone validation (if provided)
    if (this.customer_phone && !this._isValidPhone(this.customer_phone)) {
      this._errors.set('customer_phone', 'Invalid phone number format')
    }

    return this._errors.size === 0
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   * @private
   */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate phone number format (basic validation)
   * @param {string} phone - Phone to validate
   * @returns {boolean} True if valid
   * @private
   */
  _isValidPhone(phone) {
    // Basic international phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    return phoneRegex.test(cleaned) && cleaned.length >= 10
  }

  /**
   * Get all validation errors
   * @returns {Object} Object with field names as keys and error messages as values
   */
  getErrors() {
    return Object.fromEntries(this._errors)
  }

  /**
   * Get specific field error
   * @param {string} field - Field name
   * @returns {string|null} Error message or null
   */
  getError(field) {
    return this._errors.get(field) || null
  }

  /**
   * Check if booking has any validation errors
   * @returns {boolean} True if there are errors
   */
  hasErrors() {
    return this._errors.size > 0
  }

  /**
   * Update booking data and trigger validation
   * @param {Object} updates - Fields to update
   * @returns {boolean} True if update was successful and valid
   */
  update(updates) {
    Object.keys(updates).forEach(key => {
      if (key in this) {
        if (key.includes('datetime') || key.includes('_at')) {
          this[key] = this._parseDateTime(updates[key])
        } else if (key.includes('amount') || key.includes('value')) {
          this[key] = this._parseDecimal(updates[key])
        } else {
          this[key] = updates[key]
        }
      }
    })

    this.modified_at = new Date()
    return this.validate()
  }

  /**
   * Convert booking to database-ready format
   * @returns {Object} Database-formatted booking data
   */
  toDatabase() {
    return {
      id: this.id,
      ical_uid: this.ical_uid,
      summary: this.summary,
      description: this.description,
      location: this.location,
      start_datetime: this.start_datetime?.toISOString(),
      end_datetime: this.end_datetime?.toISOString(),
      yacht_id: this.yacht_id,
      customer_name: this.customer_name,
      booking_no: this.booking_no,
      trip_no: this.trip_no,
      customer_email: this.customer_email,
      customer_phone: this.customer_phone,
      total_value: this.total_value,
      deposit_amount: this.deposit_amount,
      status: this.status,
      created_at: this.created_at?.toISOString(),
      modified_at: this.modified_at?.toISOString()
    }
  }

  /**
   * Convert booking to frontend-friendly format
   * @returns {Object} Frontend-formatted booking data
   */
  toFrontend() {
    return {
      id: this.id,
      icalUid: this.ical_uid,
      summary: this.summary,
      description: this.description,
      location: this.location,
      startDate: this.start_datetime ? format(this.start_datetime, 'yyyy-MM-dd') : '',
      endDate: this.end_datetime ? format(this.end_datetime, 'yyyy-MM-dd') : '',
      startDateTime: this.start_datetime,
      endDateTime: this.end_datetime,
      yachtId: this.yacht_id,
      customerName: this.customer_name,
      bookingNo: this.booking_no,
      tripNo: this.trip_no,
      customerEmail: this.customer_email,
      customerPhone: this.customer_phone,
      totalValue: this.total_value,
      depositAmount: this.deposit_amount,
      status: this.status,
      type: this.type,
      notes: this.notes,
      depositPaid: this.deposit_paid,
      finalPaymentPaid: this.final_payment_paid,
      createdAt: this.created_at,
      modifiedAt: this.modified_at
    }
  }

  /**
   * Convert booking to iCS calendar format
   * @returns {Object} iCS-compatible booking data
   */
  toICS() {
    return {
      uid: this.ical_uid,
      summary: this.summary,
      description: this.description,
      location: this.location,
      dtstart: this.start_datetime,
      dtend: this.end_datetime,
      created: this.created_at,
      lastModified: this.modified_at,
      status: this._mapStatusToICS(this.status)
    }
  }

  /**
   * Map internal booking status to iCS status
   * @param {string} status - Internal status
   * @returns {string} iCS status
   * @private
   */
  _mapStatusToICS(status) {
    const statusMap = {
      [BookingStatus.PENDING]: 'TENTATIVE',
      [BookingStatus.CONFIRMED]: 'CONFIRMED',
      [BookingStatus.CANCELLED]: 'CANCELLED',
      [BookingStatus.COMPLETED]: 'CONFIRMED',
      [BookingStatus.NO_SHOW]: 'CANCELLED',
      [BookingStatus.DEPOSIT_PENDING]: 'TENTATIVE',
      [BookingStatus.FINAL_PAYMENT_PENDING]: 'TENTATIVE'
    }
    return statusMap[status] || 'TENTATIVE'
  }

  /**
   * Get booking duration in days
   * @returns {number} Duration in days
   */
  getDurationDays() {
    if (!this.start_datetime || !this.end_datetime) return 0
    const diffTime = Math.abs(this.end_datetime - this.start_datetime)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Check if booking is active (not cancelled or completed)
   * @returns {boolean} True if active
   */
  isActive() {
    return ![BookingStatus.CANCELLED, BookingStatus.COMPLETED, BookingStatus.NO_SHOW]
      .includes(this.status)
  }

  /**
   * Check if booking is in the past
   * @returns {boolean} True if past booking
   */
  isPast() {
    if (!this.end_datetime) return false
    return isBefore(this.end_datetime, new Date())
  }

  /**
   * Check if booking is current (ongoing)
   * @returns {boolean} True if currently active
   */
  isCurrent() {
    if (!this.start_datetime || !this.end_datetime) return false
    const now = new Date()
    return !isBefore(now, this.start_datetime) && isBefore(now, this.end_datetime)
  }

  /**
   * Check if booking is future
   * @returns {boolean} True if future booking
   */
  isFuture() {
    if (!this.start_datetime) return false
    return isAfter(this.start_datetime, new Date())
  }

  /**
   * Get booking display color based on status and type
   * @returns {string} CSS color class or hex color
   */
  getDisplayColor() {
    const colorMap = {
      [BookingType.CHARTER]: {
        [BookingStatus.CONFIRMED]: '#007AFF',
        [BookingStatus.PENDING]: '#FF9500',
        [BookingStatus.CANCELLED]: '#FF3B30',
        [BookingStatus.COMPLETED]: '#34C759'
      },
      [BookingType.OWNER]: '#5856D6',
      [BookingType.MAINTENANCE]: '#FF2D92',
      [BookingType.BLOCKED]: '#8E8E93'
    }

    if (this.type === BookingType.CHARTER) {
      return colorMap[this.type][this.status] || '#8E8E93'
    }
    
    return colorMap[this.type] || '#8E8E93'
  }

  /**
   * Create a copy of the booking with new ID
   * @returns {BookingModel} New booking instance
   */
  clone() {
    const data = this.toDatabase()
    delete data.id
    delete data.ical_uid
    delete data.booking_no
    return new BookingModel(data)
  }

  /**
   * Create BookingModel from database record
   * @param {Object} dbRecord - Database record
   * @returns {BookingModel} New booking instance
   */
  static fromDatabase(dbRecord) {
    return new BookingModel(dbRecord)
  }

  /**
   * Create BookingModel from frontend form data
   * @param {Object} formData - Form data
   * @returns {BookingModel} New booking instance
   */
  static fromFrontend(formData) {
    const mappedData = {
      summary: formData.summary || `${formData.customerName || 'Charter'} - ${formData.yachtId}`,
      yacht_id: formData.yachtId,
      customer_name: formData.customerName,
      customer_email: formData.customerEmail,
      customer_phone: formData.customerPhone,
      start_datetime: formData.startDate,
      end_datetime: formData.endDate,
      type: formData.tripType || formData.type,
      notes: formData.notes,
      deposit_paid: formData.depositPaid,
      total_value: formData.totalValue,
      deposit_amount: formData.depositAmount
    }

    return new BookingModel(mappedData)
  }

  /**
   * Check if this booking conflicts with other bookings
   * @param {Array} existingBookings - Array of existing bookings
   * @param {Object} options - Conflict check options
   * @returns {Object} Conflict check result
   */
  checkConflicts(existingBookings, options = {}) {
    return BookingConflictService.checkBookingConflicts(this, existingBookings, options)
  }

  /**
   * Check if booking overlaps with another booking
   * @param {BookingModel} otherBooking - Another booking to check against
   * @returns {boolean} True if bookings overlap
   */
  overlapsWith(otherBooking) {
    if (this.yacht_id !== otherBooking.yacht_id) return false
    
    return BookingConflictService.datesOverlap(
      this.start_datetime,
      this.end_datetime,
      otherBooking.start_datetime,
      otherBooking.end_datetime
    )
  }

  /**
   * Get availability status for this booking's dates
   * @param {Array} allBookings - All bookings to check against
   * @returns {Array} Array of daily availability
   */
  getAvailabilityStatus(allBookings) {
    return BookingConflictService.getRangeAvailability(
      this.start_datetime,
      this.end_datetime,
      this.yacht_id,
      allBookings
    )
  }

  /**
   * Check if booking can be created/updated without conflicts
   * @param {Array} existingBookings - Existing bookings
   * @returns {boolean} True if booking is valid
   */
  canBeBooked(existingBookings) {
    // First validate the booking data
    if (!this.validate()) {
      return false
    }

    // Then check for conflicts
    const conflictCheck = this.checkConflicts(existingBookings)
    return conflictCheck.isAvailable
  }

  /**
   * Get suggested alternatives if booking has conflicts
   * @param {Array} existingBookings - Existing bookings
   * @param {Array} yachts - Available yachts
   * @returns {Object} Alternative suggestions
   */
  getSuggestedAlternatives(existingBookings, yachts) {
    return BookingConflictService.suggestAlternatives(this, existingBookings, yachts)
  }

  /**
   * Check if this is a back-to-back booking with another
   * @param {BookingModel} otherBooking - Another booking
   * @returns {boolean} True if back-to-back
   */
  isBackToBack(otherBooking) {
    if (this.yacht_id !== otherBooking.yacht_id) return false

    const thisEnd = format(this.end_datetime, 'yyyy-MM-dd')
    const otherStart = format(otherBooking.start_datetime, 'yyyy-MM-dd')
    const thisStart = format(this.start_datetime, 'yyyy-MM-dd')
    const otherEnd = format(otherBooking.end_datetime, 'yyyy-MM-dd')

    // Check if one booking ends the day before the other starts
    const nextDay = new Date(this.end_datetime)
    nextDay.setDate(nextDay.getDate() + 1)
    const nextDayStr = format(nextDay, 'yyyy-MM-dd')

    const prevDay = new Date(otherBooking.end_datetime)
    prevDay.setDate(prevDay.getDate() + 1)
    const prevDayStr = format(prevDay, 'yyyy-MM-dd')

    return nextDayStr === otherStart || prevDayStr === thisStart
  }

  /**
   * Validate booking dates according to business rules
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateDates(options = {}) {
    return BookingConflictService.validateBookingDates(
      this.start_datetime,
      this.end_datetime,
      options
    )
  }
}

export default BookingModel