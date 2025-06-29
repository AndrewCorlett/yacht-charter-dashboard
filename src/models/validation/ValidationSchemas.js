/**
 * Validation Schemas
 * 
 * Comprehensive validation schemas for all model types with
 * field validation rules, custom validators, and error messages.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

// Import from unified model
import { 
  BookingStatus, 
  CharterType,
  PaymentStatus,
  DocumentTypes
} from '../core/BookingModel-unified.js'

// Legacy imports (for migration reference)
import { 
  BookingStatus as LegacyBookingStatus, 
  BookingType as LegacyBookingType 
} from '../core/BookingModel.js'
import { 
  CrewPosition, 
  ExperienceLevel 
} from '../core/CrewDetailsModel.js'
import { 
  DietaryRestriction, 
  CelebrationType 
} from '../core/CharterExperienceModel.js'
import { 
  StatusCategory, 
  StatusPriority, 
  StatusState 
} from '../core/StatusTrackingModel.js'

/**
 * Business validation configuration
 */
export const BusinessRules = {
  // Booking duration limits
  MIN_BOOKING_HOURS: 4,
  MAX_BOOKING_DAYS: 14,
  MIN_ADVANCE_NOTICE_HOURS: 24,
  MAX_ADVANCE_BOOKING_DAYS: 365,
  
  // Financial limits
  MIN_DEPOSIT_PERCENTAGE: 20,
  MAX_DEPOSIT_PERCENTAGE: 100,
  MIN_TOTAL_VALUE: 100,
  
  // Guest limits (default, can be overridden by yacht specs)
  DEFAULT_MAX_GUESTS: 12,
  MIN_GUESTS: 1,
  
  // Blackout periods (example - can be extended)
  BLACKOUT_PERIODS: [
    { start: '2024-12-24', end: '2024-12-26', reason: 'Christmas Holiday' },
    { start: '2024-12-31', end: '2025-01-02', reason: 'New Year Holiday' }
  ],
  
  // Yacht-specific rules
  YACHT_SPECIFIC_RULES: {
    'spectre': { min_booking_hours: 6, max_guests: 10 },
    'zambada': { min_booking_hours: 8, max_guests: 8 }
  }
}

/**
 * Base validation utilities
 */
export class ValidationUtils {
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  static isValidEmail(email) {
    if (!email || typeof email !== 'string') return false
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  /**
   * Validate phone number format
   * @param {string} phone - Phone to validate
   * @returns {boolean} True if valid
   */
  static isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    return phoneRegex.test(cleaned) && cleaned.length >= 10
  }

  /**
   * Validate date string or Date object
   * @param {string|Date} date - Date to validate
   * @returns {boolean} True if valid
   */
  static isValidDate(date) {
    if (!date) return false
    if (date instanceof Date) return !isNaN(date.getTime())
    if (typeof date === 'string') {
      const parsed = new Date(date)
      return !isNaN(parsed.getTime())
    }
    return false
  }

  /**
   * Validate date is not in the past
   * @param {string|Date} date - Date to validate
   * @returns {boolean} True if not in past
   */
  static isNotPast(date) {
    if (!this.isValidDate(date)) return false
    const dateObj = date instanceof Date ? date : new Date(date)
    return dateObj >= new Date()
  }

  /**
   * Validate date is in the past
   * @param {string|Date} date - Date to validate
   * @returns {boolean} True if in past
   */
  static isPast(date) {
    if (!this.isValidDate(date)) return false
    const dateObj = date instanceof Date ? date : new Date(date)
    return dateObj < new Date()
  }

  /**
   * Validate number range
   * @param {number} value - Value to validate
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {boolean} True if in range
   */
  static isInRange(value, min, max) {
    return typeof value === 'number' && value >= min && value <= max
  }

  /**
   * Validate required string field
   * @param {string} value - Value to validate
   * @param {number} [minLength=1] - Minimum length
   * @returns {boolean} True if valid
   */
  static isRequiredString(value, minLength = 1) {
    return typeof value === 'string' && value.trim().length >= minLength
  }

  /**
   * Validate UUID format
   * @param {string} uuid - UUID to validate
   * @returns {boolean} True if valid UUID
   */
  static isValidUUID(uuid) {
    if (!uuid || typeof uuid !== 'string') return false
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  /**
   * Enhanced RFC 5322 compliant email validation
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  static isValidEmailRFC(email) {
    if (!email || typeof email !== 'string') return false
    // More comprehensive RFC 5322 regex
    const rfcEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    return rfcEmailRegex.test(email.trim()) && email.length <= 254
  }

  /**
   * International phone number validation with country codes
   * @param {string} phone - Phone to validate
   * @returns {boolean} True if valid
   */
  static isValidInternationalPhone(phone) {
    if (!phone || typeof phone !== 'string') return false
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '')
    // Must start with + and have 7-15 digits after
    const intlPhoneRegex = /^\+[1-9]\d{6,14}$/
    return intlPhoneRegex.test(cleaned)
  }

  /**
   * Validate booking duration meets minimum requirements
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @param {string} yachtId - Yacht ID for specific rules
   * @returns {Object} Validation result with details
   */
  static validateBookingDuration(startDate, endDate, yachtId = null) {
    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      return { isValid: false, error: 'Invalid dates provided' }
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const durationHours = (end - start) / (1000 * 60 * 60)
    const durationDays = durationHours / 24

    // Check yacht-specific rules first
    const yachtRules = BusinessRules.YACHT_SPECIFIC_RULES[yachtId]
    const minHours = yachtRules?.min_booking_hours || BusinessRules.MIN_BOOKING_HOURS

    if (durationHours < minHours) {
      return {
        isValid: false,
        error: `Minimum booking duration is ${minHours} hours`,
        suggested: {
          endDate: new Date(start.getTime() + minHours * 60 * 60 * 1000)
        }
      }
    }

    if (durationDays > BusinessRules.MAX_BOOKING_DAYS) {
      return {
        isValid: false,
        error: `Maximum booking duration is ${BusinessRules.MAX_BOOKING_DAYS} days`
      }
    }

    return { isValid: true }
  }

  /**
   * Check if date falls within blackout periods
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @returns {Object} Validation result with blackout details
   */
  static checkBlackoutPeriods(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    const conflicts = BusinessRules.BLACKOUT_PERIODS.filter(blackout => {
      const blackoutStart = new Date(blackout.start)
      const blackoutEnd = new Date(blackout.end)
      // Check for any overlap
      return start < blackoutEnd && end > blackoutStart
    })

    if (conflicts.length > 0) {
      return {
        isValid: false,
        conflicts,
        error: `Booking conflicts with blackout periods: ${conflicts.map(c => c.reason).join(', ')}`
      }
    }

    return { isValid: true }
  }

  /**
   * Validate advance booking notice
   * @param {Date|string} startDate - Booking start date
   * @returns {Object} Validation result
   */
  static validateAdvanceNotice(startDate) {
    if (!this.isValidDate(startDate)) {
      return { isValid: false, error: 'Invalid start date' }
    }

    const start = new Date(startDate)
    const now = new Date()
    const hoursUntilBooking = (start - now) / (1000 * 60 * 60)
    const daysUntilBooking = hoursUntilBooking / 24

    if (hoursUntilBooking < BusinessRules.MIN_ADVANCE_NOTICE_HOURS) {
      return {
        isValid: false,
        error: `Bookings require at least ${BusinessRules.MIN_ADVANCE_NOTICE_HOURS} hours advance notice`
      }
    }

    if (daysUntilBooking > BusinessRules.MAX_ADVANCE_BOOKING_DAYS) {
      return {
        isValid: false,
        error: `Bookings cannot be made more than ${BusinessRules.MAX_ADVANCE_BOOKING_DAYS} days in advance`
      }
    }

    return { isValid: true }
  }

  /**
   * Validate financial amounts and percentages
   * @param {number} totalValue - Total booking value
   * @param {number} depositAmount - Deposit amount
   * @returns {Object} Validation result with suggestions
   */
  static validateFinancials(totalValue, depositAmount) {
    const errors = {}
    const warnings = []

    if (totalValue !== null && totalValue !== undefined) {
      if (totalValue < BusinessRules.MIN_TOTAL_VALUE) {
        errors.totalValue = `Minimum booking value is $${BusinessRules.MIN_TOTAL_VALUE}`
      }
    }

    if (depositAmount !== null && depositAmount !== undefined && totalValue) {
      const depositPercentage = (depositAmount / totalValue) * 100
      
      if (depositPercentage < BusinessRules.MIN_DEPOSIT_PERCENTAGE) {
        warnings.push(`Deposit is ${depositPercentage.toFixed(1)}%, minimum recommended is ${BusinessRules.MIN_DEPOSIT_PERCENTAGE}%`)
      }
      
      if (depositPercentage > BusinessRules.MAX_DEPOSIT_PERCENTAGE) {
        errors.depositAmount = `Deposit cannot exceed 100% of total value`
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate array contains valid values
   * @param {Array} array - Array to validate
   * @param {Array} validValues - Array of valid values
   * @returns {boolean} True if all values are valid
   */
  static isValidArray(array, validValues) {
    if (!Array.isArray(array)) return false
    return array.every(item => validValues.includes(item))
  }
}

/**
 * Booking Model Validation Schema
 */
export class BookingValidationSchema {
  /**
   * Validate booking data with comprehensive business rules
   * @param {Object} data - Booking data to validate
   * @param {Object} [options] - Validation options
   * @param {Array} [options.existingBookings] - Existing bookings for conflict checking
   * @param {Object} [options.yachtSpecs] - Yacht specifications
   * @returns {Object} Comprehensive validation result with errors and warnings
   */
  static validate(data, options = {}) {
    const errors = {}
    const warnings = []
    const suggestions = {}

    // Required fields
    if (!ValidationUtils.isRequiredString(data.summary)) {
      errors.summary = 'Booking summary is required'
    }

    if (!ValidationUtils.isRequiredString(data.yacht_id)) {
      errors.yacht_id = 'Yacht selection is required'
    }

    if (!ValidationUtils.isRequiredString(data.customer_name)) {
      errors.customer_name = 'Customer name is required'
    }

    if (!ValidationUtils.isRequiredString(data.customer_email)) {
      errors.customer_email = 'Customer email is required'
    } else {
      // Enhanced email validation
      if (!ValidationUtils.isValidEmailRFC(data.customer_email)) {
        errors.customer_email = 'Invalid email format (must be RFC 5322 compliant)'
      }
    }

    // Date validation with business rules
    if (!ValidationUtils.isValidDate(data.start_datetime)) {
      errors.start_datetime = 'Valid start date/time is required'
    }

    if (!ValidationUtils.isValidDate(data.end_datetime)) {
      errors.end_datetime = 'Valid end date/time is required'
    }

    if (ValidationUtils.isValidDate(data.start_datetime) && 
        ValidationUtils.isValidDate(data.end_datetime)) {
      const startDate = new Date(data.start_datetime)
      const endDate = new Date(data.end_datetime)
      
      if (startDate >= endDate) {
        errors.end_datetime = 'End date must be after start date'
      } else {
        // Business rule validations for dates
        
        // 1. Check booking duration
        const durationValidation = ValidationUtils.validateBookingDuration(
          startDate, endDate, data.yacht_id
        )
        if (!durationValidation.isValid) {
          errors.end_datetime = durationValidation.error
          if (durationValidation.suggested) {
            suggestions.end_datetime = durationValidation.suggested.endDate
          }
        }

        // 2. Check advance notice requirements
        const advanceValidation = ValidationUtils.validateAdvanceNotice(startDate)
        if (!advanceValidation.isValid) {
          errors.start_datetime = advanceValidation.error
        }

        // 3. Check blackout periods
        const blackoutValidation = ValidationUtils.checkBlackoutPeriods(startDate, endDate)
        if (!blackoutValidation.isValid) {
          errors.start_datetime = blackoutValidation.error
          warnings.push(...blackoutValidation.conflicts.map(c => 
            `Conflicts with ${c.reason} (${c.start} to ${c.end})`
          ))
        }

        // 4. Check for booking conflicts if existing bookings provided
        if (options.existingBookings) {
          const conflicts = CrossModelValidation.hasNoDateConflicts(
            startDate, endDate, options.existingBookings, data.yacht_id, data.id
          )
          if (!conflicts) {
            errors.start_datetime = 'Booking conflicts with existing reservations'
          }
        }
      }
    }

    // Status validation
    if (data.status && !Object.values(BookingStatus).includes(data.status)) {
      errors.status = 'Invalid booking status'
    }

    // Type validation
    if (data.type && !Object.values(BookingType).includes(data.type)) {
      errors.type = 'Invalid booking type'
    }

    // Enhanced financial validation
    const financialValidation = ValidationUtils.validateFinancials(
      data.total_value, data.deposit_amount
    )
    if (!financialValidation.isValid) {
      Object.assign(errors, financialValidation.errors)
    }
    warnings.push(...financialValidation.warnings)

    // Enhanced phone validation (optional)
    if (data.customer_phone) {
      if (!ValidationUtils.isValidInternationalPhone(data.customer_phone)) {
        errors.customer_phone = 'Invalid phone number format (use international format: +1234567890)'
      }
    }

    // Guest count validation with yacht capacity
    if (data.guest_count && options.yachtSpecs) {
      const maxGuests = options.yachtSpecs.max_guests || BusinessRules.DEFAULT_MAX_GUESTS
      if (data.guest_count > maxGuests) {
        errors.guest_count = `Guest count exceeds yacht capacity (max: ${maxGuests})`
      }
    }

    // ID validation (if provided)
    if (data.id && !ValidationUtils.isValidUUID(data.id)) {
      errors.id = 'Invalid booking ID format'
    }

    if (data.ical_uid && typeof data.ical_uid !== 'string') {
      errors.ical_uid = 'Invalid iCal UID format'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      suggestions
    }
  }

  /**
   * Validate partial booking data (for updates)
   * @param {Object} data - Partial booking data
   * @returns {Object} Validation result
   */
  static validatePartial(data) {
    const errors = {}

    // Only validate provided fields
    Object.keys(data).forEach(key => {
      const fullData = { [key]: data[key] }
      const validation = this.validate(fullData)
      
      if (validation.errors[key]) {
        errors[key] = validation.errors[key]
      }
    })

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
}

/**
 * Crew Details Validation Schema
 */
export class CrewDetailsValidationSchema {
  /**
   * Validate crew member data
   * @param {Object} data - Crew member data to validate
   * @returns {Object} Validation result with errors
   */
  static validate(data) {
    const errors = {}

    // Required fields
    if (!ValidationUtils.isValidUUID(data.booking_id)) {
      errors.booking_id = 'Valid booking ID is required'
    }

    if (!ValidationUtils.isRequiredString(data.first_name)) {
      errors.first_name = 'First name is required'
    }

    if (!ValidationUtils.isRequiredString(data.last_name)) {
      errors.last_name = 'Last name is required'
    }

    if (!ValidationUtils.isValidDate(data.date_of_birth)) {
      errors.date_of_birth = 'Valid date of birth is required'
    } else {
      // Age validation
      const birthDate = new Date(data.date_of_birth)
      const age = Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000))
      
      if (data.position !== CrewPosition.GUEST && age < 18) {
        errors.date_of_birth = 'Crew members must be at least 18 years old'
      }
      
      if (!ValidationUtils.isPast(data.date_of_birth)) {
        errors.date_of_birth = 'Date of birth cannot be in the future'
      }
    }

    if (!ValidationUtils.isRequiredString(data.email)) {
      errors.email = 'Email address is required'
    } else if (!ValidationUtils.isValidEmail(data.email)) {
      errors.email = 'Invalid email format'
    }

    // Position validation
    if (!Object.values(CrewPosition).includes(data.position)) {
      errors.position = 'Invalid crew position'
    }

    // Experience level validation
    if (data.experience_level && !Object.values(ExperienceLevel).includes(data.experience_level)) {
      errors.experience_level = 'Invalid experience level'
    }

    // Phone validation (optional)
    if (data.phone && !ValidationUtils.isValidPhone(data.phone)) {
      errors.phone = 'Invalid phone number format'
    }

    // Emergency contact validation
    if (data.emergency_contact_phone && !ValidationUtils.isValidPhone(data.emergency_contact_phone)) {
      errors.emergency_contact_phone = 'Invalid emergency contact phone format'
    }

    // Emergency contact completeness
    const hasEmergencyName = ValidationUtils.isRequiredString(data.emergency_contact_name)
    const hasEmergencyPhone = ValidationUtils.isRequiredString(data.emergency_contact_phone)
    
    if (hasEmergencyName && !hasEmergencyPhone) {
      errors.emergency_contact_phone = 'Emergency contact phone is required when name is provided'
    }
    
    if (hasEmergencyPhone && !hasEmergencyName) {
      errors.emergency_contact_name = 'Emergency contact name is required when phone is provided'
    }

    // Passport validation
    if (data.passport_expiry) {
      if (!ValidationUtils.isValidDate(data.passport_expiry)) {
        errors.passport_expiry = 'Invalid passport expiry date'
      } else if (ValidationUtils.isPast(data.passport_expiry)) {
        errors.passport_expiry = 'Passport has expired'
      }
    }

    // Years experience validation
    if (data.years_experience !== null && data.years_experience !== undefined) {
      if (typeof data.years_experience !== 'number' || data.years_experience < 0) {
        errors.years_experience = 'Years of experience must be a positive number'
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
}

/**
 * Charter Experience Validation Schema
 */
export class CharterExperienceValidationSchema {
  /**
   * Validate charter experience data
   * @param {Object} data - Charter experience data to validate
   * @returns {Object} Validation result with errors
   */
  static validate(data) {
    const errors = {}

    // Required fields
    if (!ValidationUtils.isValidUUID(data.booking_id)) {
      errors.booking_id = 'Valid booking ID is required'
    }

    // Guest count validation
    if (data.guest_count !== null && data.guest_count !== undefined) {
      if (typeof data.guest_count !== 'number' || data.guest_count < 1) {
        errors.guest_count = 'Guest count must be at least 1'
      }
    }

    if (data.child_count !== null && data.child_count !== undefined) {
      if (typeof data.child_count !== 'number' || data.child_count < 0) {
        errors.child_count = 'Child count cannot be negative'
      }
    }

    // Dietary restrictions validation
    if (data.dietary_restrictions && Array.isArray(data.dietary_restrictions)) {
      if (!ValidationUtils.isValidArray(data.dietary_restrictions, Object.values(DietaryRestriction))) {
        errors.dietary_restrictions = 'Invalid dietary restriction'
      }
    }

    // Food allergies validation
    if (data.food_allergies && Array.isArray(data.food_allergies)) {
      for (const [index, allergy] of data.food_allergies.entries()) {
        if (!ValidationUtils.isRequiredString(allergy.allergen)) {
          errors[`food_allergies.${index}.allergen`] = 'Allergen name is required'
        }
        
        if (allergy.severity && !['mild', 'moderate', 'severe'].includes(allergy.severity)) {
          errors[`food_allergies.${index}.severity`] = 'Invalid allergy severity level'
        }
      }
    }

    // Celebration type validation
    if (data.celebration_type && !Object.values(CelebrationType).includes(data.celebration_type)) {
      errors.celebration_type = 'Invalid celebration type'
    }

    // Budget range validation
    if (data.budget_range_min !== null && data.budget_range_min !== undefined) {
      if (typeof data.budget_range_min !== 'number' || data.budget_range_min < 0) {
        errors.budget_range_min = 'Budget minimum must be a positive number'
      }
    }

    if (data.budget_range_max !== null && data.budget_range_max !== undefined) {
      if (typeof data.budget_range_max !== 'number' || data.budget_range_max < 0) {
        errors.budget_range_max = 'Budget maximum must be a positive number'
      }
    }

    if (data.budget_range_min && data.budget_range_max && 
        data.budget_range_min > data.budget_range_max) {
      errors.budget_range_max = 'Maximum budget must be greater than minimum'
    }

    // Previous charters validation
    if (data.previous_charters && Array.isArray(data.previous_charters)) {
      for (const [index, charter] of data.previous_charters.entries()) {
        if (!ValidationUtils.isValidDate(charter.date)) {
          errors[`previous_charters.${index}.date`] = 'Invalid charter date'
        }
        
        if (!ValidationUtils.isRequiredString(charter.yacht)) {
          errors[`previous_charters.${index}.yacht`] = 'Yacht name is required'
        }
        
        if (charter.rating !== null && charter.rating !== undefined) {
          if (!ValidationUtils.isInRange(charter.rating, 1, 5)) {
            errors[`previous_charters.${index}.rating`] = 'Rating must be between 1 and 5'
          }
        }
      }
    }

    // Special requests validation
    if (data.special_requests && Array.isArray(data.special_requests)) {
      for (const [index, request] of data.special_requests.entries()) {
        if (!ValidationUtils.isRequiredString(request.description)) {
          errors[`special_requests.${index}.description`] = 'Request description is required'
        }
        
        if (request.priority && !['low', 'medium', 'high'].includes(request.priority)) {
          errors[`special_requests.${index}.priority`] = 'Invalid request priority'
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
}

/**
 * Status Tracking Validation Schema
 */
export class StatusTrackingValidationSchema {
  /**
   * Validate status tracking data
   * @param {Object} data - Status tracking data to validate
   * @returns {Object} Validation result with errors
   */
  static validate(data) {
    const errors = {}

    // Required fields
    if (!ValidationUtils.isValidUUID(data.booking_id)) {
      errors.booking_id = 'Valid booking ID is required'
    }

    // Status fields validation
    if (data.status_fields && typeof data.status_fields === 'object') {
      Object.entries(data.status_fields).forEach(([field, state]) => {
        if (!Object.values(StatusState).includes(state)) {
          errors[`status_fields.${field}`] = 'Invalid status state'
        }
      })
    }

    // Priorities validation
    if (data.priorities && typeof data.priorities === 'object') {
      Object.entries(data.priorities).forEach(([field, priority]) => {
        if (!Object.values(StatusPriority).includes(priority)) {
          errors[`priorities.${field}`] = 'Invalid priority level'
        }
      })
    }

    // Current phase validation
    if (data.current_phase && !Object.values(StatusCategory).includes(data.current_phase)) {
      errors.current_phase = 'Invalid current phase'
    }

    // Progress validation
    if (data.overall_progress !== null && data.overall_progress !== undefined) {
      if (!ValidationUtils.isInRange(data.overall_progress, 0, 100)) {
        errors.overall_progress = 'Progress must be between 0 and 100'
      }
    }

    // Milestones validation
    if (data.milestones && Array.isArray(data.milestones)) {
      for (const [index, milestone] of data.milestones.entries()) {
        if (!ValidationUtils.isRequiredString(milestone.name)) {
          errors[`milestones.${index}.name`] = 'Milestone name is required'
        }
        
        if (!ValidationUtils.isValidDate(milestone.date)) {
          errors[`milestones.${index}.date`] = 'Valid milestone date is required'
        }
        
        if (milestone.category && !Object.values(StatusCategory).includes(milestone.category)) {
          errors[`milestones.${index}.category`] = 'Invalid milestone category'
        }
      }
    }

    // Alerts validation
    if (data.alerts && Array.isArray(data.alerts)) {
      for (const [index, alert] of data.alerts.entries()) {
        if (!ValidationUtils.isRequiredString(alert.message)) {
          errors[`alerts.${index}.message`] = 'Alert message is required'
        }
        
        if (alert.type && !['info', 'warning', 'error', 'success'].includes(alert.type)) {
          errors[`alerts.${index}.type`] = 'Invalid alert type'
        }
        
        if (alert.dueDate && !ValidationUtils.isValidDate(alert.dueDate)) {
          errors[`alerts.${index}.dueDate`] = 'Invalid alert due date'
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
}

/**
 * Cross-model validation utilities
 */
export class CrossModelValidation {
  /**
   * Validate that end date is after start date
   * @param {string|Date} startDate - Start date
   * @param {string|Date} endDate - End date
   * @returns {boolean} True if valid
   */
  static isValidDateRange(startDate, endDate) {
    if (!ValidationUtils.isValidDate(startDate) || !ValidationUtils.isValidDate(endDate)) {
      return false
    }
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    return start < end
  }

  /**
   * Validate booking dates don't conflict with existing bookings
   * @param {string|Date} startDate - New booking start date
   * @param {string|Date} endDate - New booking end date
   * @param {Array} existingBookings - Array of existing bookings
   * @param {string} yachtId - Yacht ID
   * @param {string} [excludeBookingId] - Booking ID to exclude from conflict check
   * @returns {boolean} True if no conflicts
   */
  static hasNoDateConflicts(startDate, endDate, existingBookings, yachtId, excludeBookingId = null) {
    if (!ValidationUtils.isValidDate(startDate) || !ValidationUtils.isValidDate(endDate)) {
      return false
    }
    
    const newStart = new Date(startDate)
    const newEnd = new Date(endDate)
    
    return !existingBookings.some(booking => {
      // Skip if this is the same booking we're updating
      if (excludeBookingId && booking.id === excludeBookingId) {
        return false
      }
      
      // Only check bookings for the same yacht
      if (booking.yacht_id !== yachtId) {
        return false
      }
      
      // Skip cancelled bookings
      if (booking.status === BookingStatus.CANCELLED) {
        return false
      }
      
      const existingStart = new Date(booking.start_datetime)
      const existingEnd = new Date(booking.end_datetime)
      
      // Check for date overlap
      return (newStart < existingEnd && newEnd > existingStart)
    })
  }

  /**
   * Validate crew count doesn't exceed yacht capacity
   * @param {Array} crewMembers - Array of crew members
   * @param {Object} yachtSpecs - Yacht specifications
   * @returns {boolean} True if within capacity
   */
  static isWithinYachtCapacity(crewMembers, yachtSpecs) {
    if (!Array.isArray(crewMembers) || !yachtSpecs || !yachtSpecs.max_guests) {
      return true // Can't validate, assume valid
    }
    
    const guestCount = crewMembers.filter(crew => crew.position === CrewPosition.GUEST).length
    return guestCount <= yachtSpecs.max_guests
  }

  /**
   * Validate crew ages for alcohol service
   * @param {Array} crewMembers - Array of crew members
   * @param {boolean} alcoholService - Whether alcohol service is requested
   * @returns {Object} Validation result with warnings
   */
  static validateAlcoholService(crewMembers, alcoholService) {
    const warnings = []
    
    if (!alcoholService || !Array.isArray(crewMembers)) {
      return { isValid: true, warnings }
    }
    
    const underageMembers = crewMembers.filter(crew => {
      if (!crew.date_of_birth) return false
      
      const age = Math.floor((new Date() - new Date(crew.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
      return age < 21 // Assuming 21 as legal drinking age
    })
    
    if (underageMembers.length > 0) {
      warnings.push(`${underageMembers.length} crew member(s) are under 21. Alcohol service restrictions may apply.`)
    }
    
    return {
      isValid: true,
      warnings
    }
  }
}

/**
 * Main validation orchestrator
 */
export class ModelValidator {
  /**
   * Validate any model data based on type
   * @param {string} modelType - Type of model (booking, crew, experience, status)
   * @param {Object} data - Data to validate
   * @returns {Object} Validation result
   */
  static validate(modelType, data) {
    switch (modelType.toLowerCase()) {
      case 'booking':
        return BookingValidationSchema.validate(data)
      case 'crew':
      case 'crewdetails':
        return CrewDetailsValidationSchema.validate(data)
      case 'experience':
      case 'charterexperience':
        return CharterExperienceValidationSchema.validate(data)
      case 'status':
      case 'statustracking':
        return StatusTrackingValidationSchema.validate(data)
      default:
        return {
          isValid: false,
          errors: { modelType: 'Unknown model type' }
        }
    }
  }

  /**
   * Validate complete booking package (booking + crew + experience + status)
   * @param {Object} bookingPackage - Complete booking data
   * @returns {Object} Comprehensive validation result
   */
  static validateBookingPackage(bookingPackage) {
    const results = {
      isValid: true,
      errors: {},
      warnings: []
    }

    // Validate booking
    if (bookingPackage.booking) {
      const bookingValidation = BookingValidationSchema.validate(bookingPackage.booking)
      if (!bookingValidation.isValid) {
        results.isValid = false
        results.errors.booking = bookingValidation.errors
      }
    }

    // Validate crew members
    if (bookingPackage.crew && Array.isArray(bookingPackage.crew)) {
      const crewErrors = {}
      bookingPackage.crew.forEach((crew, index) => {
        const crewValidation = CrewDetailsValidationSchema.validate(crew)
        if (!crewValidation.isValid) {
          results.isValid = false
          crewErrors[index] = crewValidation.errors
        }
      })
      
      if (Object.keys(crewErrors).length > 0) {
        results.errors.crew = crewErrors
      }
    }

    // Validate charter experience
    if (bookingPackage.experience) {
      const experienceValidation = CharterExperienceValidationSchema.validate(bookingPackage.experience)
      if (!experienceValidation.isValid) {
        results.isValid = false
        results.errors.experience = experienceValidation.errors
      }
    }

    // Validate status tracking
    if (bookingPackage.status) {
      const statusValidation = StatusTrackingValidationSchema.validate(bookingPackage.status)
      if (!statusValidation.isValid) {
        results.isValid = false
        results.errors.status = statusValidation.errors
      }
    }

    // Cross-model validations
    if (bookingPackage.booking && bookingPackage.crew) {
      // Validate alcohol service with crew ages
      const alcoholValidation = CrossModelValidation.validateAlcoholService(
        bookingPackage.crew,
        bookingPackage.experience?.alcohol_service
      )
      results.warnings.push(...alcoholValidation.warnings)
    }

    return results
  }
}

export default {
  ValidationUtils,
  BookingValidationSchema,
  CrewDetailsValidationSchema,
  CharterExperienceValidationSchema,
  StatusTrackingValidationSchema,
  CrossModelValidation,
  ModelValidator
}