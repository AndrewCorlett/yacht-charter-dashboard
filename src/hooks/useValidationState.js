/**
 * Validation State Management Hook
 * 
 * Centralized state management for complex validation scenarios,
 * form state persistence, and validation result caching.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

import { useState, useReducer, useCallback, useEffect, useRef } from 'react'

/**
 * Validation state action types
 */
export const ValidationActions = {
  SET_FIELD_VALUE: 'SET_FIELD_VALUE',
  SET_FIELD_ERROR: 'SET_FIELD_ERROR',
  SET_FIELD_WARNING: 'SET_FIELD_WARNING',
  SET_FIELD_STATE: 'SET_FIELD_STATE',
  CLEAR_FIELD_ERROR: 'CLEAR_FIELD_ERROR',
  CLEAR_ALL_ERRORS: 'CLEAR_ALL_ERRORS',
  SET_FORM_VALID: 'SET_FORM_VALID',
  SET_VALIDATING: 'SET_VALIDATING',
  ADD_VALIDATION_RESULT: 'ADD_VALIDATION_RESULT',
  REMOVE_VALIDATION_RESULT: 'REMOVE_VALIDATION_RESULT',
  RESET_FORM: 'RESET_FORM',
  SET_SUBMISSION_STATE: 'SET_SUBMISSION_STATE',
  ADD_SUGGESTION: 'ADD_SUGGESTION',
  REMOVE_SUGGESTION: 'REMOVE_SUGGESTION'
}

/**
 * Initial validation state structure
 */
const initialValidationState = {
  // Form data
  data: {},
  
  // Field-level validation state
  fields: {},
  
  // Global form state
  isValid: true,
  isValidating: false,
  isDirty: false,
  isSubmitting: false,
  hasBeenSubmitted: false,
  
  // Validation results
  validationResults: new Map(),
  
  // Suggestions for improvement
  suggestions: {},
  
  // Metadata
  lastValidation: null,
  validationCount: 0
}

/**
 * Field state structure
 */
const createFieldState = (value = '', options = {}) => ({
  value,
  error: null,
  warning: null,
  isValid: true,
  isTouched: false,
  isFocused: false,
  isValidating: false,
  validationTimestamp: null,
  ...options
})

/**
 * Validation state reducer
 */
function validationReducer(state, action) {
  switch (action.type) {
    case ValidationActions.SET_FIELD_VALUE: {
      const { field, value, markDirty = true } = action.payload
      return {
        ...state,
        data: {
          ...state.data,
          [field]: value
        },
        fields: {
          ...state.fields,
          [field]: {
            ...createFieldState(value, state.fields[field]),
            value,
            isTouched: true
          }
        },
        isDirty: markDirty || state.isDirty
      }
    }

    case ValidationActions.SET_FIELD_ERROR: {
      const { field, error, isValid = false } = action.payload
      return {
        ...state,
        fields: {
          ...state.fields,
          [field]: {
            ...state.fields[field],
            error,
            isValid,
            validationTimestamp: Date.now()
          }
        },
        isValid: isValid && Object.values(state.fields).every(f => 
          f.field === field ? isValid : f.isValid
        )
      }
    }

    case ValidationActions.SET_FIELD_WARNING: {
      const { field, warning } = action.payload
      return {
        ...state,
        fields: {
          ...state.fields,
          [field]: {
            ...state.fields[field],
            warning
          }
        }
      }
    }

    case ValidationActions.SET_FIELD_STATE: {
      const { field, fieldState } = action.payload
      return {
        ...state,
        fields: {
          ...state.fields,
          [field]: {
            ...state.fields[field],
            ...fieldState
          }
        }
      }
    }

    case ValidationActions.CLEAR_FIELD_ERROR: {
      const { field } = action.payload
      return {
        ...state,
        fields: {
          ...state.fields,
          [field]: {
            ...state.fields[field],
            error: null,
            isValid: true
          }
        }
      }
    }

    case ValidationActions.CLEAR_ALL_ERRORS: {
      const clearedFields = {}
      Object.keys(state.fields).forEach(field => {
        clearedFields[field] = {
          ...state.fields[field],
          error: null,
          warning: null,
          isValid: true
        }
      })
      
      return {
        ...state,
        fields: clearedFields,
        isValid: true
      }
    }

    case ValidationActions.SET_FORM_VALID: {
      const { isValid } = action.payload
      return {
        ...state,
        isValid
      }
    }

    case ValidationActions.SET_VALIDATING: {
      const { isValidating, field } = action.payload
      
      if (field) {
        return {
          ...state,
          fields: {
            ...state.fields,
            [field]: {
              ...state.fields[field],
              isValidating
            }
          }
        }
      }
      
      return {
        ...state,
        isValidating
      }
    }

    case ValidationActions.ADD_VALIDATION_RESULT: {
      const { key, result } = action.payload
      const newResults = new Map(state.validationResults)
      newResults.set(key, {
        ...result,
        timestamp: Date.now()
      })
      
      return {
        ...state,
        validationResults: newResults,
        lastValidation: Date.now(),
        validationCount: state.validationCount + 1
      }
    }

    case ValidationActions.REMOVE_VALIDATION_RESULT: {
      const { key } = action.payload
      const newResults = new Map(state.validationResults)
      newResults.delete(key)
      
      return {
        ...state,
        validationResults: newResults
      }
    }

    case ValidationActions.SET_SUBMISSION_STATE: {
      const { isSubmitting, hasBeenSubmitted } = action.payload
      return {
        ...state,
        isSubmitting: isSubmitting !== undefined ? isSubmitting : state.isSubmitting,
        hasBeenSubmitted: hasBeenSubmitted !== undefined ? hasBeenSubmitted : state.hasBeenSubmitted
      }
    }

    case ValidationActions.ADD_SUGGESTION: {
      const { field, suggestion } = action.payload
      return {
        ...state,
        suggestions: {
          ...state.suggestions,
          [field]: suggestion
        }
      }
    }

    case ValidationActions.REMOVE_SUGGESTION: {
      const { field } = action.payload
      const newSuggestions = { ...state.suggestions }
      delete newSuggestions[field]
      
      return {
        ...state,
        suggestions: newSuggestions
      }
    }

    case ValidationActions.RESET_FORM: {
      const { data = {}, keepValidationResults = false } = action.payload
      return {
        ...initialValidationState,
        data,
        fields: Object.keys(data).reduce((acc, field) => {
          acc[field] = createFieldState(data[field])
          return acc
        }, {}),
        validationResults: keepValidationResults ? state.validationResults : new Map()
      }
    }

    default:
      return state
  }
}

/**
 * Main validation state management hook
 */
export function useValidationState(initialData = {}, options = {}) {
  const {
    persistKey,
    autoSave = true,
    validationCacheSize = 100,
    onStateChange
  } = options

  const [state, dispatch] = useReducer(validationReducer, {
    ...initialValidationState,
    data: initialData,
    fields: Object.keys(initialData).reduce((acc, field) => {
      acc[field] = createFieldState(initialData[field])
      return acc
    }, {})
  })

  const persistedState = useRef(null)
  const stateChangeCallbacks = useRef(new Set())

  // Persist state to localStorage if persistKey provided
  useEffect(() => {
    if (persistKey && autoSave) {
      const stateToSave = {
        data: state.data,
        isDirty: state.isDirty,
        timestamp: Date.now()
      }
      localStorage.setItem(`validation_state_${persistKey}`, JSON.stringify(stateToSave))
    }
  }, [state.data, state.isDirty, persistKey, autoSave])

  // Load persisted state on mount
  useEffect(() => {
    if (persistKey) {
      const saved = localStorage.getItem(`validation_state_${persistKey}`)
      if (saved) {
        try {
          persistedState.current = JSON.parse(saved)
        } catch (error) {
          console.warn('Failed to parse persisted validation state:', error)
        }
      }
    }
  }, [persistKey])

  // Cleanup old validation results
  useEffect(() => {
    if (state.validationResults.size > validationCacheSize) {
      const entries = Array.from(state.validationResults.entries())
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
      
      const toKeep = entries.slice(0, validationCacheSize)
      const newResults = new Map(toKeep)
      
      dispatch({
        type: ValidationActions.ADD_VALIDATION_RESULT,
        payload: { key: '__cleanup__', result: {} }
      })
      
      // Replace with cleaned results
      state.validationResults.clear()
      toKeep.forEach(([key, value]) => {
        state.validationResults.set(key, value)
      })
    }
  }, [state.validationResults.size, validationCacheSize])

  // Notify state change callbacks
  useEffect(() => {
    if (onStateChange) {
      onStateChange(state)
    }
    
    stateChangeCallbacks.current.forEach(callback => {
      try {
        callback(state)
      } catch (error) {
        console.error('State change callback error:', error)
      }
    })
  }, [state, onStateChange])

  /**
   * Action creators
   */
  const actions = {
    setFieldValue: useCallback((field, value, markDirty = true) => {
      dispatch({
        type: ValidationActions.SET_FIELD_VALUE,
        payload: { field, value, markDirty }
      })
    }, []),

    setFieldError: useCallback((field, error, isValid = false) => {
      dispatch({
        type: ValidationActions.SET_FIELD_ERROR,
        payload: { field, error, isValid }
      })
    }, []),

    setFieldWarning: useCallback((field, warning) => {
      dispatch({
        type: ValidationActions.SET_FIELD_WARNING,
        payload: { field, warning }
      })
    }, []),

    setFieldState: useCallback((field, fieldState) => {
      dispatch({
        type: ValidationActions.SET_FIELD_STATE,
        payload: { field, fieldState }
      })
    }, []),

    clearFieldError: useCallback((field) => {
      dispatch({
        type: ValidationActions.CLEAR_FIELD_ERROR,
        payload: { field }
      })
    }, []),

    clearAllErrors: useCallback(() => {
      dispatch({ type: ValidationActions.CLEAR_ALL_ERRORS })
    }, []),

    setFormValid: useCallback((isValid) => {
      dispatch({
        type: ValidationActions.SET_FORM_VALID,
        payload: { isValid }
      })
    }, []),

    setValidating: useCallback((isValidating, field = null) => {
      dispatch({
        type: ValidationActions.SET_VALIDATING,
        payload: { isValidating, field }
      })
    }, []),

    addValidationResult: useCallback((key, result) => {
      dispatch({
        type: ValidationActions.ADD_VALIDATION_RESULT,
        payload: { key, result }
      })
    }, []),

    removeValidationResult: useCallback((key) => {
      dispatch({
        type: ValidationActions.REMOVE_VALIDATION_RESULT,
        payload: { key }
      })
    }, []),

    setSubmissionState: useCallback((isSubmitting, hasBeenSubmitted) => {
      dispatch({
        type: ValidationActions.SET_SUBMISSION_STATE,
        payload: { isSubmitting, hasBeenSubmitted }
      })
    }, []),

    addSuggestion: useCallback((field, suggestion) => {
      dispatch({
        type: ValidationActions.ADD_SUGGESTION,
        payload: { field, suggestion }
      })
    }, []),

    removeSuggestion: useCallback((field) => {
      dispatch({
        type: ValidationActions.REMOVE_SUGGESTION,
        payload: { field }
      })
    }, []),

    resetForm: useCallback((data = {}, keepValidationResults = false) => {
      dispatch({
        type: ValidationActions.RESET_FORM,
        payload: { data, keepValidationResults }
      })
    }, [])
  }

  /**
   * Utility methods
   */
  const utils = {
    getFieldState: useCallback((field) => {
      return state.fields[field] || createFieldState()
    }, [state.fields]),

    getFieldValue: useCallback((field) => {
      return state.data[field]
    }, [state.data]),

    hasFieldError: useCallback((field) => {
      return Boolean(state.fields[field]?.error)
    }, [state.fields]),

    getValidationResult: useCallback((key) => {
      return state.validationResults.get(key)
    }, [state.validationResults]),

    getAllErrors: useCallback(() => {
      return Object.keys(state.fields).reduce((acc, field) => {
        if (state.fields[field].error) {
          acc[field] = state.fields[field].error
        }
        return acc
      }, {})
    }, [state.fields]),

    getAllWarnings: useCallback(() => {
      return Object.keys(state.fields).reduce((acc, field) => {
        if (state.fields[field].warning) {
          acc[field] = state.fields[field].warning
        }
        return acc
      }, {})
    }, [state.fields]),

    getFormSummary: useCallback(() => {
      const errors = utils.getAllErrors()
      const warnings = utils.getAllWarnings()
      
      return {
        isValid: state.isValid,
        isDirty: state.isDirty,
        isValidating: state.isValidating,
        isSubmitting: state.isSubmitting,
        hasBeenSubmitted: state.hasBeenSubmitted,
        errorCount: Object.keys(errors).length,
        warningCount: Object.keys(warnings).length,
        suggestionCount: Object.keys(state.suggestions).length,
        errors,
        warnings,
        suggestions: state.suggestions
      }
    }, [state, utils]),

    restorePersistedState: useCallback(() => {
      if (persistedState.current) {
        actions.resetForm(persistedState.current.data)
        return true
      }
      return false
    }, [actions]),

    clearPersistedState: useCallback(() => {
      if (persistKey) {
        localStorage.removeItem(`validation_state_${persistKey}`)
        persistedState.current = null
      }
    }, [persistKey]),

    subscribeToStateChanges: useCallback((callback) => {
      stateChangeCallbacks.current.add(callback)
      return () => stateChangeCallbacks.current.delete(callback)
    }, [])
  }

  return {
    state,
    actions,
    utils
  }
}

export default useValidationState