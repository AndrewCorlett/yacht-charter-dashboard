/**
 * Model Operations Utilities
 * 
 * Comprehensive utility functions for model operations including
 * create, update, validate, transform, and data manipulation.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

import BookingModel from '../core/BookingModel.js'
import CrewDetailsModel from '../core/CrewDetailsModel.js'
import CharterExperienceModel from '../core/CharterExperienceModel.js'
import StatusTrackingModel from '../core/StatusTrackingModel.js'
import { ModelValidator } from '../validation/ValidationSchemas.js'

/**
 * Model Factory for creating model instances
 */
export class ModelFactory {
  /**
   * Create a new model instance based on type
   * @param {string} modelType - Type of model to create
   * @param {Object} data - Initial data for the model
   * @returns {Object} Model instance
   */
  static create(modelType, data = {}) {
    switch (modelType.toLowerCase()) {
      case 'booking':
        return new BookingModel(data)
      case 'crew':
      case 'crewdetails':
        return new CrewDetailsModel(data)
      case 'experience':
      case 'charterexperience':
        return new CharterExperienceModel(data)
      case 'status':
      case 'statustracking':
        return new StatusTrackingModel(data)
      default:
        throw new Error(`Unknown model type: ${modelType}`)
    }
  }

  /**
   * Create model from database record
   * @param {string} modelType - Type of model to create
   * @param {Object} dbRecord - Database record
   * @returns {Object} Model instance
   */
  static fromDatabase(modelType, dbRecord) {
    switch (modelType.toLowerCase()) {
      case 'booking':
        return BookingModel.fromDatabase(dbRecord)
      case 'crew':
      case 'crewdetails':
        return CrewDetailsModel.fromDatabase(dbRecord)
      case 'experience':
      case 'charterexperience':
        return CharterExperienceModel.fromDatabase(dbRecord)
      case 'status':
      case 'statustracking':
        return StatusTrackingModel.fromDatabase(dbRecord)
      default:
        throw new Error(`Unknown model type: ${modelType}`)
    }
  }

  /**
   * Create model from frontend data
   * @param {string} modelType - Type of model to create
   * @param {Object} frontendData - Frontend form data
   * @param {string} [bookingId] - Parent booking ID (for child models)
   * @returns {Object} Model instance
   */
  static fromFrontend(modelType, frontendData, bookingId = null) {
    switch (modelType.toLowerCase()) {
      case 'booking':
        return BookingModel.fromFrontend(frontendData)
      case 'crew':
      case 'crewdetails':
        return CrewDetailsModel.fromFrontend(frontendData, bookingId)
      case 'experience':
      case 'charterexperience':
        return CharterExperienceModel.fromFrontend(frontendData, bookingId)
      case 'status':
      case 'statustracking':
        return StatusTrackingModel.fromFrontend(frontendData, bookingId)
      default:
        throw new Error(`Unknown model type: ${modelType}`)
    }
  }
}

/**
 * Model Transformer for data format conversions
 */
export class ModelTransformer {
  /**
   * Transform model to database format
   * @param {Object} model - Model instance
   * @returns {Object} Database-formatted data
   */
  static toDatabase(model) {
    if (!model || typeof model.toDatabase !== 'function') {
      throw new Error('Invalid model or missing toDatabase method')
    }
    return model.toDatabase()
  }

  /**
   * Transform model to frontend format
   * @param {Object} model - Model instance
   * @returns {Object} Frontend-formatted data
   */
  static toFrontend(model) {
    if (!model || typeof model.toFrontend !== 'function') {
      throw new Error('Invalid model or missing toFrontend method')
    }
    return model.toFrontend()
  }

  /**
   * Transform multiple models to database format
   * @param {Array} models - Array of model instances
   * @returns {Array} Array of database-formatted data
   */
  static batchToDatabase(models) {
    return models.map(model => this.toDatabase(model))
  }

  /**
   * Transform multiple models to frontend format
   * @param {Array} models - Array of model instances
   * @returns {Array} Array of frontend-formatted data
   */
  static batchToFrontend(models) {
    return models.map(model => this.toFrontend(model))
  }

  /**
   * Transform booking package to database format
   * @param {Object} bookingPackage - Complete booking package
   * @returns {Object} Database-formatted booking package
   */
  static bookingPackageToDatabase(bookingPackage) {
    const result = {}

    if (bookingPackage.booking) {
      result.booking = this.toDatabase(bookingPackage.booking)
    }

    if (bookingPackage.crew && Array.isArray(bookingPackage.crew)) {
      result.crew = this.batchToDatabase(bookingPackage.crew)
    }

    if (bookingPackage.experience) {
      result.experience = this.toDatabase(bookingPackage.experience)
    }

    if (bookingPackage.status) {
      result.status = this.toDatabase(bookingPackage.status)
    }

    return result
  }

  /**
   * Transform booking package to frontend format
   * @param {Object} bookingPackage - Complete booking package
   * @returns {Object} Frontend-formatted booking package
   */
  static bookingPackageToFrontend(bookingPackage) {
    const result = {}

    if (bookingPackage.booking) {
      result.booking = this.toFrontend(bookingPackage.booking)
    }

    if (bookingPackage.crew && Array.isArray(bookingPackage.crew)) {
      result.crew = this.batchToFrontend(bookingPackage.crew)
    }

    if (bookingPackage.experience) {
      result.experience = this.toFrontend(bookingPackage.experience)
    }

    if (bookingPackage.status) {
      result.status = this.toFrontend(bookingPackage.status)
    }

    return result
  }
}

/**
 * Model Validator Wrapper for enhanced validation
 */
export class ModelValidationService {
  /**
   * Validate a single model
   * @param {Object} model - Model instance
   * @returns {Object} Validation result
   */
  static validateModel(model) {
    if (!model || typeof model.validate !== 'function') {
      return {
        isValid: false,
        errors: { model: 'Invalid model or missing validate method' }
      }
    }

    return {
      isValid: model.validate(),
      errors: model.getErrors(),
      hasErrors: model.hasErrors()
    }
  }

  /**
   * Validate model data before creating instance
   * @param {string} modelType - Type of model
   * @param {Object} data - Data to validate
   * @returns {Object} Validation result
   */
  static validateData(modelType, data) {
    return ModelValidator.validate(modelType, data)
  }

  /**
   * Validate multiple models of the same type
   * @param {Array} models - Array of model instances
   * @returns {Object} Batch validation result
   */
  static validateBatch(models) {
    const results = {
      isValid: true,
      errors: {},
      summary: {
        total: models.length,
        valid: 0,
        invalid: 0
      }
    }

    models.forEach((model, index) => {
      const validation = this.validateModel(model)
      
      if (validation.isValid) {
        results.summary.valid++
      } else {
        results.isValid = false
        results.summary.invalid++
        results.errors[index] = validation.errors
      }
    })

    return results
  }

  /**
   * Validate complete booking package
   * @param {Object} bookingPackage - Complete booking package
   * @returns {Object} Comprehensive validation result
   */
  static validateBookingPackage(bookingPackage) {
    return ModelValidator.validateBookingPackage(bookingPackage)
  }
}

/**
 * Model Update Service for handling model updates
 */
export class ModelUpdateService {
  /**
   * Update a model with new data
   * @param {Object} model - Model instance
   * @param {Object} updates - Data to update
   * @returns {Object} Update result
   */
  static updateModel(model, updates) {
    if (!model || typeof model.update !== 'function') {
      return {
        success: false,
        error: 'Invalid model or missing update method'
      }
    }

    try {
      const success = model.update(updates)
      return {
        success,
        isValid: !model.hasErrors(),
        errors: model.getErrors(),
        model
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Update multiple models with their respective data
   * @param {Array} modelUpdatePairs - Array of {model, updates} objects
   * @returns {Object} Batch update result
   */
  static updateBatch(modelUpdatePairs) {
    const results = {
      success: true,
      errors: {},
      summary: {
        total: modelUpdatePairs.length,
        successful: 0,
        failed: 0
      }
    }

    modelUpdatePairs.forEach(({ model, updates }, index) => {
      const result = this.updateModel(model, updates)
      
      if (result.success && result.isValid) {
        results.summary.successful++
      } else {
        results.success = false
        results.summary.failed++
        results.errors[index] = result.error || result.errors
      }
    })

    return results
  }

  /**
   * Safely update model with validation
   * @param {Object} model - Model instance
   * @param {Object} updates - Data to update
   * @param {boolean} [validateBeforeUpdate=true] - Validate data before updating
   * @returns {Object} Safe update result
   */
  static safeUpdate(model, updates, validateBeforeUpdate = true) {
    if (validateBeforeUpdate) {
      // Create a clone to test the update
      const clone = model.clone()
      const testResult = this.updateModel(clone, updates)
      
      if (!testResult.success || !testResult.isValid) {
        return {
          success: false,
          error: 'Update validation failed',
          validationErrors: testResult.errors,
          originalModel: model
        }
      }
    }

    return this.updateModel(model, updates)
  }
}

/**
 * Model Query Service for searching and filtering models
 */
export class ModelQueryService {
  /**
   * Filter models by predicate function
   * @param {Array} models - Array of model instances
   * @param {Function} predicate - Filter predicate function
   * @returns {Array} Filtered models
   */
  static filter(models, predicate) {
    return models.filter(predicate)
  }

  /**
   * Find model by property value
   * @param {Array} models - Array of model instances
   * @param {string} property - Property name to search
   * @param {*} value - Value to match
   * @returns {Object|null} Found model or null
   */
  static findBy(models, property, value) {
    return models.find(model => model[property] === value) || null
  }

  /**
   * Find models by property values
   * @param {Array} models - Array of model instances
   * @param {string} property - Property name to search
   * @param {Array} values - Values to match
   * @returns {Array} Found models
   */
  static findAllBy(models, property, values) {
    return models.filter(model => values.includes(model[property]))
  }

  /**
   * Group models by property value
   * @param {Array} models - Array of model instances
   * @param {string} property - Property name to group by
   * @returns {Object} Grouped models object
   */
  static groupBy(models, property) {
    return models.reduce((groups, model) => {
      const key = model[property]
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(model)
      return groups
    }, {})
  }

  /**
   * Sort models by property
   * @param {Array} models - Array of model instances
   * @param {string} property - Property name to sort by
   * @param {string} [direction='asc'] - Sort direction (asc/desc)
   * @returns {Array} Sorted models
   */
  static sortBy(models, property, direction = 'asc') {
    return [...models].sort((a, b) => {
      const aVal = a[property]
      const bVal = b[property]
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1
      if (aVal > bVal) return direction === 'asc' ? 1 : -1
      return 0
    })
  }

  /**
   * Search models by multiple criteria
   * @param {Array} models - Array of model instances
   * @param {Object} criteria - Search criteria object
   * @returns {Array} Matching models
   */
  static search(models, criteria) {
    return models.filter(model => {
      return Object.entries(criteria).every(([key, value]) => {
        if (value === null || value === undefined) return true
        
        const modelValue = model[key]
        
        if (typeof value === 'string' && typeof modelValue === 'string') {
          return modelValue.toLowerCase().includes(value.toLowerCase())
        }
        
        if (Array.isArray(value)) {
          return value.includes(modelValue)
        }
        
        return modelValue === value
      })
    })
  }

  /**
   * Get models within date range
   * @param {Array} models - Array of model instances
   * @param {string} dateProperty - Date property name
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Models within date range
   */
  static getInDateRange(models, dateProperty, startDate, endDate) {
    return models.filter(model => {
      const modelDate = model[dateProperty]
      if (!modelDate) return false
      
      const date = modelDate instanceof Date ? modelDate : new Date(modelDate)
      return date >= startDate && date <= endDate
    })
  }

  /**
   * Get paginated results
   * @param {Array} models - Array of model instances
   * @param {number} page - Page number (1-based)
   * @param {number} pageSize - Number of items per page
   * @returns {Object} Paginated result
   */
  static paginate(models, page, pageSize) {
    const totalItems = models.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    
    return {
      data: models.slice(startIndex, endIndex),
      pagination: {
        currentPage: page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    }
  }
}

/**
 * Model Aggregation Service for computing statistics
 */
export class ModelAggregationService {
  /**
   * Count models by property value
   * @param {Array} models - Array of model instances
   * @param {string} property - Property name to count by
   * @returns {Object} Count by property value
   */
  static countBy(models, property) {
    return models.reduce((counts, model) => {
      const key = model[property]
      counts[key] = (counts[key] || 0) + 1
      return counts
    }, {})
  }

  /**
   * Sum numeric property values
   * @param {Array} models - Array of model instances
   * @param {string} property - Numeric property name
   * @returns {number} Sum of property values
   */
  static sum(models, property) {
    return models.reduce((total, model) => {
      const value = model[property]
      return total + (typeof value === 'number' ? value : 0)
    }, 0)
  }

  /**
   * Calculate average of numeric property
   * @param {Array} models - Array of model instances
   * @param {string} property - Numeric property name
   * @returns {number} Average value
   */
  static average(models, property) {
    const validModels = models.filter(model => typeof model[property] === 'number')
    if (validModels.length === 0) return 0
    
    return this.sum(validModels, property) / validModels.length
  }

  /**
   * Find minimum value of property
   * @param {Array} models - Array of model instances
   * @param {string} property - Property name
   * @returns {*} Minimum value
   */
  static min(models, property) {
    const values = models.map(model => model[property]).filter(v => v != null)
    return values.length > 0 ? Math.min(...values) : null
  }

  /**
   * Find maximum value of property
   * @param {Array} models - Array of model instances
   * @param {string} property - Property name
   * @returns {*} Maximum value
   */
  static max(models, property) {
    const values = models.map(model => model[property]).filter(v => v != null)
    return values.length > 0 ? Math.max(...values) : null
  }

  /**
   * Generate comprehensive statistics for numeric property
   * @param {Array} models - Array of model instances
   * @param {string} property - Numeric property name
   * @returns {Object} Statistics object
   */
  static getStatistics(models, property) {
    const validModels = models.filter(model => typeof model[property] === 'number')
    const values = validModels.map(model => model[property])
    
    if (values.length === 0) {
      return {
        count: 0,
        sum: 0,
        average: 0,
        min: null,
        max: null,
        median: null
      }
    }
    
    const sortedValues = [...values].sort((a, b) => a - b)
    const median = sortedValues.length % 2 === 0
      ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
      : sortedValues[Math.floor(sortedValues.length / 2)]
    
    return {
      count: values.length,
      sum: this.sum(validModels, property),
      average: this.average(validModels, property),
      min: Math.min(...values),
      max: Math.max(...values),
      median
    }
  }
}

/**
 * Main Model Operations class that combines all utilities
 */
export class ModelOperations {
  static Factory = ModelFactory
  static Transformer = ModelTransformer
  static Validation = ModelValidationService
  static Update = ModelUpdateService
  static Query = ModelQueryService
  static Aggregation = ModelAggregationService

  /**
   * Create a complete booking package with all related models
   * @param {Object} bookingData - Booking data
   * @param {Array} crewData - Array of crew member data
   * @param {Object} experienceData - Charter experience data
   * @param {Object} statusData - Status tracking data
   * @returns {Object} Complete booking package with validation
   */
  static createBookingPackage(bookingData, crewData = [], experienceData = {}, statusData = {}) {
    try {
      // Create booking model
      const booking = ModelFactory.create('booking', bookingData)
      
      // Create crew models
      const crew = crewData.map(data => 
        ModelFactory.create('crew', { ...data, booking_id: booking.id })
      )
      
      // Create experience model
      const experience = ModelFactory.create('experience', {
        ...experienceData,
        booking_id: booking.id
      })
      
      // Create status tracking model
      const status = ModelFactory.create('status', {
        ...statusData,
        booking_id: booking.id
      })
      
      const bookingPackage = { booking, crew, experience, status }
      
      // Validate the complete package
      const validation = ModelValidationService.validateBookingPackage(bookingPackage)
      
      return {
        package: bookingPackage,
        validation,
        isValid: validation.isValid
      }
    } catch (error) {
      return {
        package: null,
        validation: {
          isValid: false,
          errors: { creation: error.message }
        },
        isValid: false
      }
    }
  }

  /**
   * Clone a booking package with new IDs
   * @param {Object} originalPackage - Original booking package
   * @returns {Object} Cloned booking package
   */
  static cloneBookingPackage(originalPackage) {
    const cloned = {}
    
    if (originalPackage.booking) {
      cloned.booking = originalPackage.booking.clone()
    }
    
    if (originalPackage.crew) {
      cloned.crew = originalPackage.crew.map(crew => {
        const clonedCrew = crew.clone()
        clonedCrew.booking_id = cloned.booking.id
        return clonedCrew
      })
    }
    
    if (originalPackage.experience) {
      cloned.experience = originalPackage.experience.clone()
      cloned.experience.booking_id = cloned.booking.id
    }
    
    if (originalPackage.status) {
      cloned.status = originalPackage.status.clone()
      cloned.status.booking_id = cloned.booking.id
    }
    
    return cloned
  }
}

export default ModelOperations