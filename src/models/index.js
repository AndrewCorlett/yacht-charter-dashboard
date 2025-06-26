/**
 * Models Index
 * 
 * Main entry point for the yacht charter booking system data models.
 * Exports all core models, utilities, validation schemas, and helper functions.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

// Core Models - Unified Single Table Design
export {
  default as BookingModel,
  BookingStatus,
  CharterType,
  PaymentStatus,
  DocumentTypes
} from './core/BookingModel-unified.js'

// Legacy Multi-Table Model (deprecated, for migration reference only)
export {
  default as LegacyBookingModel,
  BookingStatus as LegacyBookingStatus,
  BookingType as LegacyBookingType
} from './core/BookingModel.js'

export {
  default as CrewDetailsModel,
  CrewPosition,
  ExperienceLevel
} from './core/CrewDetailsModel.js'

export {
  default as CharterExperienceModel,
  DietaryRestriction,
  CelebrationType,
  CharterRating
} from './core/CharterExperienceModel.js'

export {
  default as StatusTrackingModel,
  StatusCategory,
  StatusPriority,
  StatusState,
  DefaultStatusFields
} from './core/StatusTrackingModel.js'

// Validation Schemas
export {
  default as ValidationSchemas,
  ValidationUtils,
  BookingValidationSchema,
  CrewDetailsValidationSchema,
  CharterExperienceValidationSchema,
  StatusTrackingValidationSchema,
  CrossModelValidation,
  ModelValidator
} from './validation/ValidationSchemas.js'

// Model Operations Utilities
export {
  default as ModelOperations,
  ModelFactory,
  ModelTransformer,
  ModelValidationService,
  ModelUpdateService,
  ModelQueryService,
  ModelAggregationService
} from './utilities/ModelOperations.js'

// iCS Calendar Utilities
export {
  default as ICSCalendarUtils,
  ICSStatus,
  ICSClassification,
  ICSFrequency
} from './utilities/ICSCalendarUtils.js'

// Booking Number Generator
export {
  default as BookingNumberGenerator,
  BookingNumberFormat,
  ValidationPatterns,
  YachtCodes,
  PredefinedGenerators
} from './utilities/BookingNumberGenerator.js'

/**
 * Model Collections - Organized exports for easy access
 */
export const Models = {
  BookingModel,
  CrewDetailsModel,
  CharterExperienceModel,
  StatusTrackingModel
}

export const Utilities = {
  ModelOperations,
  ICSCalendarUtils,
  BookingNumberGenerator,
  ValidationSchemas
}

export const Enums = {
  BookingStatus,
  CharterType,
  PaymentStatus,
  DocumentTypes,
  CrewPosition,
  ExperienceLevel,
  DietaryRestriction,
  CelebrationType,
  StatusCategory,
  StatusPriority,
  StatusState,
  ICSStatus,
  ICSClassification,
  BookingNumberFormat
}

/**
 * Quick-access factory functions for common operations
 */
export const QuickActions = {
  /**
   * Create a new booking with default status tracking
   * @param {Object} bookingData - Booking data
   * @returns {Object} Booking with status tracking
   */
  createBooking: (bookingData) => {
    const booking = ModelFactory.create('booking', bookingData)
    const status = StatusTrackingModel.createDefault(booking.id)
    return { booking, status }
  },

  /**
   * Create a complete booking package
   * @param {Object} data - Complete booking data
   * @returns {Object} Complete booking package
   */
  createBookingPackage: (data) => {
    return ModelOperations.createBookingPackage(
      data.booking,
      data.crew || [],
      data.experience || {},
      data.status || {}
    )
  },

  /**
   * Validate any model type
   * @param {string} modelType - Type of model
   * @param {Object} data - Data to validate
   * @returns {Object} Validation result
   */
  validate: (modelType, data) => {
    return ModelValidator.validate(modelType, data)
  },

  /**
   * Generate a booking number
   * @param {string} format - Number format
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Generated booking number
   */
  generateBookingNumber: async (format = 'year_month_seq', options = {}) => {
    const generator = new BookingNumberGenerator({ format })
    return await generator.generateBookingNumber(options)
  },

  /**
   * Convert booking to iCS format
   * @param {Object} booking - Booking model
   * @param {Object} options - iCS options
   * @returns {string} iCS VEVENT string
   */
  toICS: (booking, options = {}) => {
    return ICSCalendarUtils.bookingToVEvent(booking, options)
  },

  /**
   * Export bookings to iCS calendar file
   * @param {Array} bookings - Array of booking models
   * @param {Object} options - Export options
   * @returns {Object} File content and metadata
   */
  exportToICS: (bookings, options = {}) => {
    return ICSCalendarUtils.generateICSFile(bookings, options)
  }
}

/**
 * Data transformation helpers
 */
export const Transform = {
  /**
   * Convert form data to booking model
   * @param {Object} formData - Frontend form data
   * @returns {BookingModel} Booking model instance
   */
  fromForm: (formData) => {
    return BookingModel.fromFrontend(formData)
  },

  /**
   * Convert database record to model
   * @param {string} modelType - Type of model
   * @param {Object} dbRecord - Database record
   * @returns {Object} Model instance
   */
  fromDatabase: (modelType, dbRecord) => {
    return ModelFactory.fromDatabase(modelType, dbRecord)
  },

  /**
   * Convert model to frontend format
   * @param {Object} model - Model instance
   * @returns {Object} Frontend-formatted data
   */
  toFrontend: (model) => {
    return ModelTransformer.toFrontend(model)
  },

  /**
   * Convert model to database format
   * @param {Object} model - Model instance
   * @returns {Object} Database-formatted data
   */
  toDatabase: (model) => {
    return ModelTransformer.toDatabase(model)
  }
}

/**
 * Search and query helpers
 */
export const Search = {
  /**
   * Search bookings by criteria
   * @param {Array} bookings - Array of booking models
   * @param {Object} criteria - Search criteria
   * @returns {Array} Matching bookings
   */
  bookings: (bookings, criteria) => {
    return ModelQueryService.search(bookings, criteria)
  },

  /**
   * Filter bookings by date range
   * @param {Array} bookings - Array of booking models
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Bookings in date range
   */
  byDateRange: (bookings, startDate, endDate) => {
    return ModelQueryService.getInDateRange(bookings, 'start_datetime', startDate, endDate)
  },

  /**
   * Group bookings by yacht
   * @param {Array} bookings - Array of booking models
   * @returns {Object} Bookings grouped by yacht
   */
  byYacht: (bookings) => {
    return ModelQueryService.groupBy(bookings, 'yacht_id')
  },

  /**
   * Get bookings by status
   * @param {Array} bookings - Array of booking models
   * @param {string|Array} status - Status or array of statuses
   * @returns {Array} Matching bookings
   */
  byStatus: (bookings, status) => {
    const statuses = Array.isArray(status) ? status : [status]
    return ModelQueryService.findAllBy(bookings, 'status', statuses)
  }
}

/**
 * Statistics and aggregation helpers
 */
export const Stats = {
  /**
   * Get booking statistics
   * @param {Array} bookings - Array of booking models
   * @returns {Object} Booking statistics
   */
  bookings: (bookings) => {
    return {
      total: bookings.length,
      byStatus: ModelAggregationService.countBy(bookings, 'status'),
      byYacht: ModelAggregationService.countBy(bookings, 'yacht_id'),
      totalValue: ModelAggregationService.sum(bookings, 'total_value'),
      averageValue: ModelAggregationService.average(bookings, 'total_value'),
      averageDuration: ModelAggregationService.average(
        bookings.map(b => ({ duration: b.getDurationDays() })),
        'duration'
      )
    }
  },

  /**
   * Get revenue statistics
   * @param {Array} bookings - Array of booking models
   * @returns {Object} Revenue statistics
   */
  revenue: (bookings) => {
    const confirmedBookings = bookings.filter(b => b.status === BookingStatus.CONFIRMED)
    return ModelAggregationService.getStatistics(confirmedBookings, 'total_value')
  },

  /**
   * Get crew statistics
   * @param {Array} crewMembers - Array of crew member models
   * @returns {Object} Crew statistics
   */
  crew: (crewMembers) => {
    return {
      total: crewMembers.length,
      byPosition: ModelAggregationService.countBy(crewMembers, 'position'),
      byExperience: ModelAggregationService.countBy(crewMembers, 'experience_level'),
      averageAge: ModelAggregationService.average(
        crewMembers.map(c => ({ age: c.getAge() })),
        'age'
      ),
      professionalCrew: crewMembers.filter(c => c.isProfessionalCrew()).length
    }
  }
}

/**
 * Default export with all utilities combined
 */
export default {
  // Core exports
  Models,
  Utilities,
  Enums,
  
  // Helper functions
  QuickActions,
  Transform,
  Search,
  Stats,
  
  // Individual utilities
  ModelOperations,
  ValidationSchemas,
  ICSCalendarUtils,
  BookingNumberGenerator,
  
  // Factory functions
  createBooking: QuickActions.createBooking,
  createBookingPackage: QuickActions.createBookingPackage,
  validate: QuickActions.validate,
  generateBookingNumber: QuickActions.generateBookingNumber
}