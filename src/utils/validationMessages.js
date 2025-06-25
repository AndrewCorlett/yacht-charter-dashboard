/**
 * Validation Error Messages System
 * 
 * Centralized system for validation error messages with internationalization
 * support, dynamic message generation, and contextual help text.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

/**
 * Default validation messages in English
 */
export const ValidationMessages = {
  // Required field messages
  required: {
    default: 'This field is required',
    email: 'Email address is required',
    phone: 'Phone number is required',
    name: 'Name is required',
    date: 'Date is required',
    yacht: 'Yacht selection is required',
    amount: 'Amount is required'
  },

  // Format validation messages
  format: {
    email: 'Please enter a valid email address',
    emailRFC: 'Email must be RFC 5322 compliant',
    phone: 'Please enter a valid phone number',
    phoneInternational: 'Use international format: +1234567890',
    uuid: 'Invalid ID format',
    date: 'Please enter a valid date',
    datetime: 'Please enter a valid date and time',
    number: 'Please enter a valid number',
    decimal: 'Please enter a valid decimal number',
    currency: 'Please enter a valid currency amount'
  },

  // Range and limit validation messages
  range: {
    min: (field, min) => `${field} must be at least ${min}`,
    max: (field, max) => `${field} cannot exceed ${max}`,
    between: (field, min, max) => `${field} must be between ${min} and ${max}`,
    length: (field, min, max) => `${field} must be between ${min} and ${max} characters`,
    minLength: (field, min) => `${field} must be at least ${min} characters`,
    maxLength: (field, max) => `${field} cannot exceed ${max} characters`
  },

  // Business rule validation messages
  business: {
    // Date and time rules
    pastDate: 'Date cannot be in the past',
    futureDate: 'Date cannot be in the future',
    dateOrder: 'End date must be after start date',
    minBookingDuration: (hours) => `Minimum booking duration is ${hours} hours`,
    maxBookingDuration: (days) => `Maximum booking duration is ${days} days`,
    advanceNotice: (hours) => `Bookings require at least ${hours} hours advance notice`,
    maxAdvanceBooking: (days) => `Bookings cannot be made more than ${days} days in advance`,
    
    // Financial rules
    minTotalValue: (amount) => `Minimum booking value is $${amount}`,
    depositExceedsTotal: 'Deposit cannot exceed total value',
    minDepositPercentage: (percent) => `Minimum deposit is ${percent}% of total value`,
    maxDepositPercentage: (percent) => `Deposit cannot exceed ${percent}% of total value`,
    
    // Capacity rules
    maxGuests: (max) => `Guest count exceeds yacht capacity (max: ${max})`,
    minGuests: (min) => `Minimum guest count is ${min}`,
    
    // Booking conflicts
    dateConflict: 'Booking conflicts with existing reservations',
    blackoutPeriod: (reason) => `Booking conflicts with blackout period: ${reason}`,
    yachtUnavailable: 'Selected yacht is not available for these dates',
    
    // Age and certification rules
    minAge: (age) => `Must be at least ${age} years old`,
    maxAge: (age) => `Cannot be older than ${age} years`,
    crewMinAge: 'Crew members must be at least 18 years old',
    passportExpired: 'Passport has expired',
    certificationRequired: 'Valid certification is required for this position'
  },

  // Warning messages (non-blocking)
  warnings: {
    depositLow: (current, recommended) => `Deposit is ${current}%, recommended minimum is ${recommended}%`,
    advanceBookingLong: (days) => `Booking is ${days} days in advance - plans may change`,
    weatherSeason: 'Selected dates may have challenging weather conditions',
    underageGuests: (count) => `${count} guest(s) are under 21 - alcohol service restrictions may apply`,
    highCapacity: 'Booking is near yacht capacity - consider space requirements',
    peakSeason: 'Selected dates are during peak season - higher rates may apply'
  },

  // Suggestion messages
  suggestions: {
    dateAdjustment: 'Consider adjusting dates to avoid conflicts',
    yachtAlternative: (alternative) => `Consider ${alternative} yacht for these dates`,
    durationOptimal: (hours) => `Consider extending to ${hours} hours for better value`,
    depositOptimal: (amount) => `Recommended deposit: $${amount}`,
    guestOptimization: 'Consider reducing guest count for more comfortable experience',
    seasonalPricing: 'Consider off-peak dates for better pricing'
  },

  // Help text for fields
  help: {
    email: 'We\'ll use this to send booking confirmations and updates',
    phone: 'Include country code for international numbers (+1 for US/Canada)',
    startDateTime: 'When would you like your charter to begin?',
    endDateTime: 'When should your charter end?',
    guestCount: 'Total number of people including yourself',
    totalValue: 'Total cost of the charter before taxes and fees',
    depositAmount: 'Upfront payment to secure your booking',
    specialRequests: 'Any special dietary needs, celebrations, or preferences'
  },

  // Success messages
  success: {
    validation: 'All information looks good!',
    booking: 'Booking created successfully',
    update: 'Information updated successfully',
    payment: 'Payment processed successfully'
  },

  // Generic error messages
  generic: {
    unknown: 'An unexpected error occurred',
    network: 'Network error - please check your connection',
    server: 'Server error - please try again later',
    validation: 'Please check your information and try again'
  }
}

/**
 * Message formatter with interpolation support
 */
export class MessageFormatter {
  /**
   * Format a message with parameters
   * @param {string|Function} message - Message template or function
   * @param {...any} params - Parameters for interpolation
   * @returns {string} Formatted message
   */
  static format(message, ...params) {
    if (typeof message === 'function') {
      return message(...params)
    }
    
    if (typeof message === 'string') {
      return message.replace(/\{(\d+)\}/g, (match, index) => {
        return params[index] !== undefined ? params[index] : match
      })
    }
    
    return String(message)
  }

  /**
   * Get validation message by path
   * @param {string} path - Dot-notation path to message
   * @param {...any} params - Parameters for message
   * @returns {string} Formatted message
   */
  static getMessage(path, ...params) {
    const keys = path.split('.')
    let message = ValidationMessages
    
    for (const key of keys) {
      if (message && typeof message === 'object' && key in message) {
        message = message[key]
      } else {
        return ValidationMessages.generic.unknown
      }
    }
    
    return this.format(message, ...params)
  }

  /**
   * Get field-specific message
   * @param {string} field - Field name
   * @param {string} type - Message type
   * @param {...any} params - Parameters
   * @returns {string} Formatted message
   */
  static getFieldMessage(field, type, ...params) {
    const fieldMessages = ValidationMessages[type]
    if (fieldMessages && fieldMessages[field]) {
      return this.format(fieldMessages[field], ...params)
    }
    
    if (fieldMessages && fieldMessages.default) {
      return this.format(fieldMessages.default, ...params)
    }
    
    return ValidationMessages.generic.unknown
  }
}

/**
 * Validation message provider with context
 */
export class ValidationMessageProvider {
  constructor(locale = 'en', customMessages = {}) {
    this.locale = locale
    this.messages = { ...ValidationMessages, ...customMessages }
    this.context = {}
  }

  /**
   * Set context for message generation
   * @param {Object} context - Context data
   */
  setContext(context) {
    this.context = { ...this.context, ...context }
  }

  /**
   * Get contextual validation message
   * @param {string} field - Field name
   * @param {string} error - Error type
   * @param {Object} options - Additional options
   * @returns {Object} Message object with text, type, and context
   */
  getValidationMessage(field, error, options = {}) {
    const { value, constraint, yachtId, businessRules } = options
    
    let message = ''
    let type = 'error'
    let suggestion = null

    // Determine message based on error type and context
    switch (error) {
      case 'required':
        message = MessageFormatter.getFieldMessage(field, 'required')
        break

      case 'email_format':
        message = ValidationMessages.format.emailRFC
        break

      case 'phone_format':
        message = ValidationMessages.format.phoneInternational
        break

      case 'min_duration':
        message = MessageFormatter.getMessage('business.minBookingDuration', constraint)
        suggestion = `Consider extending your booking to meet the minimum requirement`
        break

      case 'max_duration':
        message = MessageFormatter.getMessage('business.maxBookingDuration', constraint)
        break

      case 'advance_notice':
        message = MessageFormatter.getMessage('business.advanceNotice', constraint)
        break

      case 'deposit_exceeds_total':
        message = ValidationMessages.business.depositExceedsTotal
        break

      case 'guest_capacity':
        message = MessageFormatter.getMessage('business.maxGuests', constraint)
        suggestion = `Consider selecting a larger yacht or reducing guest count`
        break

      case 'date_conflict':
        message = ValidationMessages.business.dateConflict
        suggestion = ValidationMessages.suggestions.dateAdjustment
        break

      case 'blackout_period':
        message = MessageFormatter.getMessage('business.blackoutPeriod', constraint)
        suggestion = ValidationMessages.suggestions.dateAdjustment
        break

      default:
        message = ValidationMessages.generic.validation
    }

    return {
      field,
      message,
      type,
      suggestion,
      context: {
        field,
        error,
        value,
        constraint,
        yachtId,
        ...this.context
      }
    }
  }

  /**
   * Get help text for a field
   * @param {string} field - Field name
   * @returns {string} Help text
   */
  getHelpText(field) {
    return ValidationMessages.help[field] || ''
  }

  /**
   * Get warning message
   * @param {string} warning - Warning type
   * @param {...any} params - Parameters
   * @returns {Object} Warning message object
   */
  getWarningMessage(warning, ...params) {
    const message = MessageFormatter.getMessage(`warnings.${warning}`, ...params)
    
    return {
      type: 'warning',
      message,
      dismissible: true
    }
  }

  /**
   * Get suggestion message
   * @param {string} suggestion - Suggestion type
   * @param {...any} params - Parameters
   * @returns {Object} Suggestion message object
   */
  getSuggestionMessage(suggestion, ...params) {
    const message = MessageFormatter.getMessage(`suggestions.${suggestion}`, ...params)
    
    return {
      type: 'suggestion',
      message,
      actionable: true
    }
  }
}

/**
 * Default message provider instance
 */
export const defaultMessageProvider = new ValidationMessageProvider()

/**
 * Utility functions for common validation scenarios
 */
export const ValidationMessageUtils = {
  /**
   * Generate comprehensive field validation result
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @param {Array} errors - Array of error objects
   * @param {Array} warnings - Array of warning objects
   * @param {Object} context - Validation context
   * @returns {Object} Complete validation message result
   */
  generateFieldResult(field, value, errors = [], warnings = [], context = {}) {
    const provider = new ValidationMessageProvider()
    provider.setContext(context)

    const errorMessages = errors.map(error => 
      provider.getValidationMessage(field, error.type, error)
    )

    const warningMessages = warnings.map(warning =>
      provider.getWarningMessage(warning.type, ...warning.params)
    )

    return {
      field,
      value,
      hasErrors: errorMessages.length > 0,
      hasWarnings: warningMessages.length > 0,
      errors: errorMessages,
      warnings: warningMessages,
      helpText: provider.getHelpText(field)
    }
  },

  /**
   * Format business rule violation message
   * @param {string} rule - Business rule name
   * @param {Object} context - Rule context
   * @returns {string} Formatted message
   */
  formatBusinessRuleViolation(rule, context) {
    const provider = new ValidationMessageProvider()
    return provider.getValidationMessage(context.field, rule, context).message
  }
}

export default {
  ValidationMessages,
  MessageFormatter,
  ValidationMessageProvider,
  ValidationMessageUtils,
  defaultMessageProvider
}