/**
 * Real-time Validation Hooks
 * 
 * Comprehensive React hooks for real-time form validation with debouncing,
 * field dependencies, and validation state management.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { 
  BookingValidationSchema,
  CrewDetailsValidationSchema,
  CharterExperienceValidationSchema,
  StatusTrackingValidationSchema,
  ModelValidator,
  ValidationUtils,
  BusinessRules
} from '../models/validation/ValidationSchemas'

/**
 * Validation configuration options
 */
export const ValidationConfig = {
  // Debounce delays in milliseconds
  DEBOUNCE_DELAY: 300,
  IMMEDIATE_FIELDS: ['email', 'phone'], // Fields that validate immediately
  
  // Validation modes
  MODES: {
    REALTIME: 'realtime',      // Validate on every change
    BLUR: 'blur',              // Validate on field blur
    SUBMIT: 'submit',          // Validate only on submit
    HYBRID: 'hybrid'           // Realtime for some fields, blur for others
  },
  
  // Field priorities for validation order
  FIELD_PRIORITIES: {
    HIGH: ['email', 'phone', 'start_datetime', 'end_datetime'],
    MEDIUM: ['customer_name', 'yacht_id', 'total_value'],
    LOW: ['description', 'notes', 'location']
  }
}

/**
 * Main validation hook for form fields with real-time feedback
 * 
 * @param {Object} initialData - Initial form data
 * @param {Object} options - Validation options
 * @param {string} options.schema - Validation schema to use ('booking', 'crew', etc.)
 * @param {string} options.mode - Validation mode
 * @param {number} options.debounceDelay - Custom debounce delay
 * @param {Function} options.onValidationChange - Callback when validation state changes
 * @param {Object} options.validationOptions - Additional options for validation schemas
 * @returns {Object} Validation state and methods
 */
export function useValidation(initialData = {}, options = {}) {
  const {
    schema = 'booking',
    mode = ValidationConfig.MODES.HYBRID,
    debounceDelay = ValidationConfig.DEBOUNCE_DELAY,
    onValidationChange,
    validationOptions = {}
  } = options

  // Validation state
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState({})
  const [warnings, setWarnings] = useState([])
  const [suggestions, setSuggestions] = useState({})
  const [fieldStates, setFieldStates] = useState({}) // touched, focused, validating
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState(true)

  // Refs for managing timers and preventing stale closures
  const validationTimers = useRef({})
  const validationInProgress = useRef(false)
  const latestData = useRef(data)

  // Update latest data ref
  useEffect(() => {
    latestData.current = data
  }, [data])

  /**
   * Get validation function for the specified schema
   */
  const getValidationFunction = useCallback(() => {
    switch (schema.toLowerCase()) {
      case 'booking':
        return BookingValidationSchema.validate
      case 'crew':
        return CrewDetailsValidationSchema.validate
      case 'experience':
        return CharterExperienceValidationSchema.validate
      case 'status':
        return StatusTrackingValidationSchema.validate
      default:
        return (data) => ModelValidator.validate(schema, data)
    }
  }, [schema])

  /**
   * Perform validation on current data
   */
  const validateData = useCallback(async (dataToValidate = null, fields = null) => {
    const currentData = dataToValidate || latestData.current
    const validateFn = getValidationFunction()
    
    try {
      const result = validateFn(currentData, validationOptions)
      
      // If specific fields provided, only return errors for those fields
      if (fields) {
        const filteredErrors = {}
        fields.forEach(field => {
          if (result.errors[field]) {
            filteredErrors[field] = result.errors[field]
          }
        })
        return {
          ...result,
          errors: filteredErrors,
          isValid: Object.keys(filteredErrors).length === 0
        }
      }
      
      return result
    } catch (error) {
      console.error('Validation error:', error)
      return {
        isValid: false,
        errors: { general: 'Validation failed' },
        warnings: [],
        suggestions: {}
      }
    }
  }, [getValidationFunction, validationOptions])

  /**
   * Update validation state with debouncing
   */
  const updateValidationState = useCallback((fields = null, immediate = false) => {
    const delay = immediate ? 0 : debounceDelay
    
    // Clear existing timer for these fields
    const timerKey = fields ? fields.join(',') : 'all'
    if (validationTimers.current[timerKey]) {
      clearTimeout(validationTimers.current[timerKey])
    }

    validationTimers.current[timerKey] = setTimeout(async () => {
      if (validationInProgress.current) return
      
      validationInProgress.current = true
      setIsValidating(true)

      try {
        const result = await validateData(null, fields)
        
        setErrors(prev => fields ? { ...prev, ...result.errors } : result.errors)
        setWarnings(result.warnings || [])
        setSuggestions(prev => fields ? { ...prev, ...result.suggestions } : result.suggestions || {})
        setIsValid(result.isValid)

        // Notify parent component
        if (onValidationChange) {
          onValidationChange(result)
        }
      } finally {
        validationInProgress.current = false
        setIsValidating(false)
        delete validationTimers.current[timerKey]
      }
    }, delay)
  }, [debounceDelay, validateData, onValidationChange])

  /**
   * Update a field value with validation
   */
  const updateField = useCallback((field, value, options = {}) => {
    const { immediate = false, skipValidation = false } = options
    
    setData(prev => ({ ...prev, [field]: value }))
    
    // Mark field as touched
    setFieldStates(prev => ({
      ...prev,
      [field]: { ...prev[field], touched: true }
    }))

    if (!skipValidation) {
      // Determine if this field should be validated immediately
      const shouldValidateImmediately = immediate || 
        ValidationConfig.FIELD_PRIORITIES.HIGH.includes(field) ||
        (mode === ValidationConfig.MODES.REALTIME)

      updateValidationState([field], shouldValidateImmediately)
    }
  }, [mode, updateValidationState])

  /**
   * Update multiple fields at once
   */
  const updateFields = useCallback((updates, options = {}) => {
    const { skipValidation = false } = options
    
    const updatedFields = Object.keys(updates)
    
    setData(prev => ({ ...prev, ...updates }))
    
    // Mark all updated fields as touched
    setFieldStates(prev => {
      const newState = { ...prev }
      updatedFields.forEach(field => {
        newState[field] = { ...newState[field], touched: true }
      })
      return newState
    })

    if (!skipValidation) {
      updateValidationState(updatedFields)
    }
  }, [updateValidationState])

  /**
   * Validate specific fields
   */
  const validateFields = useCallback((fields) => {
    return updateValidationState(fields, true)
  }, [updateValidationState])

  /**
   * Validate all fields
   */
  const validateAll = useCallback(() => {
    return updateValidationState(null, true)
  }, [updateValidationState])

  /**
   * Handle field focus events
   */
  const onFieldFocus = useCallback((field) => {
    setFieldStates(prev => ({
      ...prev,
      [field]: { ...prev[field], focused: true }
    }))
  }, [])

  /**
   * Handle field blur events
   */
  const onFieldBlur = useCallback((field) => {
    setFieldStates(prev => ({
      ...prev,
      [field]: { ...prev[field], focused: false, touched: true }
    }))

    // Validate on blur if in blur or hybrid mode
    if (mode === ValidationConfig.MODES.BLUR || 
        (mode === ValidationConfig.MODES.HYBRID && 
         !ValidationConfig.FIELD_PRIORITIES.HIGH.includes(field))) {
      updateValidationState([field], true)
    }
  }, [mode, updateValidationState])

  /**
   * Reset validation state
   */
  const reset = useCallback((newData = {}) => {
    setData(newData)
    setErrors({})
    setWarnings([])
    setSuggestions({})
    setFieldStates({})
    setIsValid(true)
    
    // Clear all timers
    Object.values(validationTimers.current).forEach(clearTimeout)
    validationTimers.current = {}
  }, [])

  /**
   * Get field validation state
   */
  const getFieldState = useCallback((field) => {
    return {
      value: data[field],
      error: errors[field],
      warning: warnings.find(w => w.includes(field)),
      suggestion: suggestions[field],
      hasError: Boolean(errors[field]),
      isTouched: Boolean(fieldStates[field]?.touched),
      isFocused: Boolean(fieldStates[field]?.focused),
      isValidating: isValidating && Boolean(fieldStates[field]?.touched)
    }
  }, [data, errors, warnings, suggestions, fieldStates, isValidating])

  /**
   * Get validation summary
   */
  const validationSummary = useMemo(() => {
    const errorCount = Object.keys(errors).length
    const warningCount = warnings.length
    const suggestionCount = Object.keys(suggestions).length
    
    return {
      isValid,
      hasErrors: errorCount > 0,
      hasWarnings: warningCount > 0,
      hasSuggestions: suggestionCount > 0,
      errorCount,
      warningCount,
      suggestionCount,
      errors,
      warnings,
      suggestions
    }
  }, [isValid, errors, warnings, suggestions])

  // Initial validation
  useEffect(() => {
    if (Object.keys(data).length > 0) {
      updateValidationState(null, false)
    }
  }, []) // Only run on mount

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(validationTimers.current).forEach(clearTimeout)
    }
  }, [])

  return {
    // Data
    data,
    
    // Validation state
    errors,
    warnings,
    suggestions,
    isValid,
    isValidating,
    validationSummary,
    
    // Field methods
    updateField,
    updateFields,
    getFieldState,
    
    // Validation methods
    validateFields,
    validateAll,
    validateData,
    
    // Event handlers
    onFieldFocus,
    onFieldBlur,
    
    // Utility methods
    reset
  }
}

/**
 * Specialized hook for booking form validation
 */
export function useBookingValidation(initialData = {}, options = {}) {
  return useValidation(initialData, {
    ...options,
    schema: 'booking'
  })
}

/**
 * Specialized hook for crew details validation
 */
export function useCrewValidation(initialData = {}, options = {}) {
  return useValidation(initialData, {
    ...options,
    schema: 'crew'
  })
}

/**
 * Hook for cross-field validation (e.g., date ranges, financial calculations)
 */
export function useCrossFieldValidation(dependencies = [], validator, debounceDelay = 300) {
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState(null)
  const [isValid, setIsValid] = useState(true)
  const timerRef = useRef(null)

  const validate = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(async () => {
      setIsValidating(true)
      try {
        const result = await validator(...dependencies)
        setError(result.error || null)
        setIsValid(result.isValid)
      } catch (err) {
        setError('Validation failed')
        setIsValid(false)
      } finally {
        setIsValidating(false)
      }
    }, debounceDelay)
  }, [dependencies, validator, debounceDelay])

  useEffect(() => {
    if (dependencies.some(dep => dep !== undefined && dep !== null)) {
      validate()
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, dependencies)

  return { isValidating, error, isValid }
}

/**
 * Hook for field-specific business rule validation
 */
export function useBusinessRuleValidation(field, value, yachtId = null) {
  const [result, setResult] = useState({ isValid: true })

  useEffect(() => {
    if (value === undefined || value === null || value === '') {
      setResult({ isValid: true })
      return
    }

    let validationResult = { isValid: true }

    switch (field) {
      case 'email':
        validationResult = {
          isValid: ValidationUtils.isValidEmailRFC(value),
          error: ValidationUtils.isValidEmailRFC(value) ? null : 'Invalid email format'
        }
        break

      case 'phone':
        validationResult = {
          isValid: ValidationUtils.isValidInternationalPhone(value),
          error: ValidationUtils.isValidInternationalPhone(value) ? null : 'Use international format: +1234567890'
        }
        break

      case 'booking_duration':
        if (value.startDate && value.endDate) {
          validationResult = ValidationUtils.validateBookingDuration(
            value.startDate, value.endDate, yachtId
          )
        }
        break

      case 'advance_notice':
        if (value) {
          validationResult = ValidationUtils.validateAdvanceNotice(value)
        }
        break

      case 'blackout_check':
        if (value.startDate && value.endDate) {
          validationResult = ValidationUtils.checkBlackoutPeriods(
            value.startDate, value.endDate
          )
        }
        break

      case 'financials':
        if (value.totalValue !== undefined || value.depositAmount !== undefined) {
          validationResult = ValidationUtils.validateFinancials(
            value.totalValue, value.depositAmount
          )
        }
        break

      default:
        validationResult = { isValid: true }
    }

    setResult(validationResult)
  }, [field, value, yachtId])

  return result
}

export default {
  useValidation,
  useBookingValidation,
  useCrewValidation,
  useCrossFieldValidation,
  useBusinessRuleValidation,
  ValidationConfig
}