/**
 * Validation Feedback Components
 * 
 * Visual feedback components for form validation including field states,
 * error messages, warnings, suggestions, and progress indicators.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

import React from 'react'

/**
 * Icons for different validation states
 */
const ValidationIcons = {
  error: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  success: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
  loading: (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

/**
 * Base validation message component
 */
export function ValidationMessage({ 
  type = 'error', 
  message, 
  className = '',
  showIcon = true,
  size = 'sm' 
}) {
  if (!message) return null

  const baseClasses = {
    error: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-amber-600 bg-amber-50 border-amber-200',
    success: 'text-green-600 bg-green-50 border-green-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200'
  }

  const sizeClasses = {
    xs: 'text-xs px-2 py-1',
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2'
  }

  const iconClasses = {
    error: 'text-red-500',
    warning: 'text-amber-500',
    success: 'text-green-500',
    info: 'text-blue-500'
  }

  return (
    <div className={`
      flex items-start gap-2 rounded-md border
      ${baseClasses[type]} 
      ${sizeClasses[size]}
      ${className}
    `}>
      {showIcon && (
        <div className={`flex-shrink-0 mt-0.5 ${iconClasses[type]}`}>
          {ValidationIcons[type]}
        </div>
      )}
      <span className="flex-1">{message}</span>
    </div>
  )
}

/**
 * Field validation indicator component
 */
export function FieldValidationIndicator({ 
  fieldState, 
  showSuccess = true,
  size = 'sm' 
}) {
  const { error, warning, isValidating, isValid, isTouched } = fieldState

  if (isValidating) {
    return (
      <div className="flex items-center gap-1 text-gray-500">
        {ValidationIcons.loading}
        <span className="text-xs">Validating...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-1 text-red-500">
        {ValidationIcons.error}
      </div>
    )
  }

  if (warning) {
    return (
      <div className="flex items-center gap-1 text-amber-500">
        {ValidationIcons.warning}
      </div>
    )
  }

  if (showSuccess && isValid && isTouched) {
    return (
      <div className="flex items-center gap-1 text-green-500">
        {ValidationIcons.success}
      </div>
    )
  }

  return null
}

/**
 * Enhanced form field wrapper with validation feedback
 */
export function ValidatedField({ 
  children, 
  fieldState, 
  label, 
  required = false,
  showValidationIcon = true,
  showInlineError = true,
  className = ''
}) {
  const { error, warning, isValidating, isValid, isTouched } = fieldState

  const getFieldBorderClass = () => {
    if (isValidating) return 'border-blue-300 ring-1 ring-blue-200'
    if (error) return 'border-red-500 ring-1 ring-red-200'
    if (warning) return 'border-amber-400 ring-1 ring-amber-200'
    if (isValid && isTouched) return 'border-green-400 ring-1 ring-green-200'
    return 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Field container */}
      <div className="relative">
        {/* Enhanced child with validation classes */}
        {React.cloneElement(children, {
          className: `${children.props.className || ''} ${getFieldBorderClass()}`.trim()
        })}
        
        {/* Validation icon */}
        {showValidationIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <FieldValidationIndicator fieldState={fieldState} />
          </div>
        )}
      </div>
      
      {/* Error message */}
      {showInlineError && error && (
        <ValidationMessage type="error" message={error} size="xs" />
      )}
      
      {/* Warning message */}
      {showInlineError && !error && warning && (
        <ValidationMessage type="warning" message={warning} size="xs" />
      )}
    </div>
  )
}

/**
 * Validation summary component
 */
export function ValidationSummary({ 
  validationSummary, 
  showWarnings = true,
  showSuggestions = true,
  className = '' 
}) {
  const { 
    hasErrors, 
    hasWarnings, 
    hasSuggestions,
    errors, 
    warnings, 
    suggestions 
  } = validationSummary

  if (!hasErrors && !hasWarnings && !hasSuggestions) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Errors */}
      {hasErrors && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-red-800">
            Please fix the following errors:
          </h4>
          <div className="space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <ValidationMessage 
                key={field}
                type="error" 
                message={`${field.replace(/_/g, ' ')}: ${error}`}
                size="xs"
              />
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {showWarnings && hasWarnings && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-amber-800">
            Warnings:
          </h4>
          <div className="space-y-1">
            {warnings.map((warning, index) => (
              <ValidationMessage 
                key={index}
                type="warning" 
                message={warning}
                size="xs"
              />
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && hasSuggestions && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-blue-800">
            Suggestions:
          </h4>
          <div className="space-y-1">
            {Object.entries(suggestions).map(([field, suggestion]) => (
              <ValidationMessage 
                key={field}
                type="info" 
                message={`${field.replace(/_/g, ' ')}: ${suggestion}`}
                size="xs"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Validation progress indicator
 */
export function ValidationProgress({ 
  validationSummary,
  showDetails = false,
  className = '' 
}) {
  const { 
    isValid, 
    errorCount, 
    warningCount,
    suggestionCount 
  } = validationSummary

  const totalIssues = errorCount + warningCount
  const progressColor = isValid ? 'bg-green-500' : errorCount > 0 ? 'bg-red-500' : 'bg-amber-500'
  const progressWidth = isValid ? '100%' : totalIssues === 0 ? '0%' : `${Math.max(20, 100 - (totalIssues * 20))}%`

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
          style={{ width: progressWidth }}
        />
      </div>
      
      {/* Status text */}
      <div className="flex justify-between items-center text-xs text-gray-600">
        <span>
          {isValid ? 'Form is valid' : `${totalIssues} issue${totalIssues !== 1 ? 's' : ''} found`}
        </span>
        
        {showDetails && (
          <div className="flex gap-3">
            {errorCount > 0 && (
              <span className="text-red-600">
                {errorCount} error{errorCount !== 1 ? 's' : ''}
              </span>
            )}
            {warningCount > 0 && (
              <span className="text-amber-600">
                {warningCount} warning{warningCount !== 1 ? 's' : ''}
              </span>
            )}
            {suggestionCount > 0 && (
              <span className="text-blue-600">
                {suggestionCount} suggestion{suggestionCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Real-time validation status badge
 */
export function ValidationStatusBadge({ 
  validationSummary,
  size = 'sm' 
}) {
  const { isValid, isValidating, errorCount, warningCount } = validationSummary

  if (isValidating) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
        {ValidationIcons.loading}
        Validating
      </span>
    )
  }

  if (isValid) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
        {ValidationIcons.success}
        Valid
      </span>
    )
  }

  if (errorCount > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
        {ValidationIcons.error}
        {errorCount} Error{errorCount !== 1 ? 's' : ''}
      </span>
    )
  }

  if (warningCount > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
        {ValidationIcons.warning}
        {warningCount} Warning{warningCount !== 1 ? 's' : ''}
      </span>
    )
  }

  return null
}

/**
 * Suggestion action component
 */
export function ValidationSuggestion({ 
  suggestion, 
  onApply,
  onDismiss,
  className = '' 
}) {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-md p-3 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-blue-500">
          {ValidationIcons.info}
        </div>
        
        <div className="flex-1 space-y-2">
          <p className="text-sm text-blue-800">{suggestion.message}</p>
          
          {(onApply || onDismiss) && (
            <div className="flex gap-2">
              {onApply && (
                <button
                  onClick={() => onApply(suggestion)}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Apply Suggestion
                </button>
              )}
              
              {onDismiss && (
                <button
                  onClick={() => onDismiss(suggestion)}
                  className="text-xs px-2 py-1 border border-blue-300 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default {
  ValidationMessage,
  FieldValidationIndicator,
  ValidatedField,
  ValidationSummary,
  ValidationProgress,
  ValidationStatusBadge,
  ValidationSuggestion,
  ValidationIcons
}