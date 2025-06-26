/**
 * Comprehensive Validation System Test Suite
 * 
 * Unit tests for validation schemas, hooks, components, and business rules.
 * Tests edge cases, performance, and integration scenarios.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Import validation system components
import {
  ValidationUtils,
  BusinessRules,
  BookingValidationSchema,
  CrewDetailsValidationSchema,
  CharterExperienceValidationSchema,
  CrossModelValidation
} from '../../models/validation/ValidationSchemas'

import { useValidation, useBookingValidation } from '../../hooks/useValidation'
import { useValidationState } from '../../hooks/useValidationState'
import { 
  ValidationMessage,
  ValidatedField,
  ValidationSummary 
} from '../../components/validation/ValidationFeedback'
import { 
  ValidationMessages, 
  MessageFormatter,
  ValidationMessageProvider 
} from '../../utils/validationMessages'

describe('ValidationUtils', () => {
  describe('Email Validation', () => {
    it('should validate simple email addresses', () => {
      expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true)
      expect(ValidationUtils.isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(ValidationUtils.isValidEmail('invalid.email')).toBe(false)
      expect(ValidationUtils.isValidEmail('')).toBe(false)
      expect(ValidationUtils.isValidEmail(null)).toBe(false)
    })

    it('should validate RFC 5322 compliant emails', () => {
      expect(ValidationUtils.isValidEmailRFC('simple@example.com')).toBe(true)
      expect(ValidationUtils.isValidEmailRFC('very.common@example.com')).toBe(true)
      expect(ValidationUtils.isValidEmailRFC('disposable.style.email.with+symbol@example.com')).toBe(true)
      expect(ValidationUtils.isValidEmailRFC('user@[192.168.1.1]')).toBe(false) // IP addresses not supported in this regex
      expect(ValidationUtils.isValidEmailRFC('plainaddress')).toBe(false)
      expect(ValidationUtils.isValidEmailRFC('@missingusername.com')).toBe(false)
    })
  })

  describe('Phone Validation', () => {
    it('should validate basic phone numbers', () => {
      expect(ValidationUtils.isValidPhone('+1234567890')).toBe(true)
      expect(ValidationUtils.isValidPhone('(555) 123-4567')).toBe(true)
      expect(ValidationUtils.isValidPhone('555.123.4567')).toBe(true)
      expect(ValidationUtils.isValidPhone('123')).toBe(false)
      expect(ValidationUtils.isValidPhone('abc-def-ghij')).toBe(false)
    })

    it('should validate international phone numbers', () => {
      expect(ValidationUtils.isValidInternationalPhone('+1234567890')).toBe(true)
      expect(ValidationUtils.isValidInternationalPhone('+44123456789')).toBe(true)
      expect(ValidationUtils.isValidInternationalPhone('+12345678901234')).toBe(true)
      expect(ValidationUtils.isValidInternationalPhone('1234567890')).toBe(false) // Missing +
      expect(ValidationUtils.isValidInternationalPhone('+123')).toBe(false) // Too short
    })
  })

  describe('Date Validation', () => {
    it('should validate dates correctly', () => {
      expect(ValidationUtils.isValidDate('2025-01-01')).toBe(true)
      expect(ValidationUtils.isValidDate(new Date())).toBe(true)
      expect(ValidationUtils.isValidDate('invalid-date')).toBe(false)
      expect(ValidationUtils.isValidDate(null)).toBe(false)
      expect(ValidationUtils.isValidDate('')).toBe(false)
    })

    it('should check if date is in the past', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      expect(ValidationUtils.isPast(yesterday)).toBe(true)
      expect(ValidationUtils.isPast(tomorrow)).toBe(false)
    })

    it('should check if date is not in the past', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      expect(ValidationUtils.isNotPast(yesterday)).toBe(false)
      expect(ValidationUtils.isNotPast(tomorrow)).toBe(true)
    })
  })

  describe('Business Rule Validation', () => {
    it('should validate booking duration', () => {
      const start = new Date('2025-01-01T10:00:00')
      const validEnd = new Date('2025-01-01T16:00:00') // 6 hours
      const invalidEnd = new Date('2025-01-01T12:00:00') // 2 hours

      const validResult = ValidationUtils.validateBookingDuration(start, validEnd)
      expect(validResult.isValid).toBe(true)

      const invalidResult = ValidationUtils.validateBookingDuration(start, invalidEnd)
      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.error).toContain('Minimum booking duration')
    })

    it('should check blackout periods', () => {
      const start = new Date('2024-12-25T10:00:00') // Christmas
      const end = new Date('2024-12-25T16:00:00')

      const result = ValidationUtils.checkBlackoutPeriods(start, end)
      expect(result.isValid).toBe(false)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].reason).toBe('Christmas Holiday')
    })

    it('should validate advance notice requirements', () => {
      const tooSoon = new Date()
      tooSoon.setHours(tooSoon.getHours() + 12) // 12 hours from now

      const validTime = new Date()
      validTime.setHours(validTime.getHours() + 48) // 48 hours from now

      const tooSoonResult = ValidationUtils.validateAdvanceNotice(tooSoon)
      expect(tooSoonResult.isValid).toBe(false)

      const validResult = ValidationUtils.validateAdvanceNotice(validTime)
      expect(validResult.isValid).toBe(true)
    })

    it('should validate financial amounts', () => {
      const validResult = ValidationUtils.validateFinancials(1000, 200) // 20% deposit
      expect(validResult.isValid).toBe(true)

      const lowDepositResult = ValidationUtils.validateFinancials(1000, 100) // 10% deposit
      expect(lowDepositResult.isValid).toBe(true)
      expect(lowDepositResult.warnings).toHaveLength(1)

      const tooLowTotalResult = ValidationUtils.validateFinancials(50, 10)
      expect(tooLowTotalResult.isValid).toBe(false)
      expect(tooLowTotalResult.errors.totalValue).toContain('Minimum booking value')
    })
  })
})

describe('BookingValidationSchema', () => {
  const validBookingData = {
    summary: 'Test Booking',
    yacht_id: 'spectre',
    customer_name: 'John Doe',
    customer_email: 'john.doe@example.com',
    customer_phone: '+1234567890',
    start_datetime: '2025-06-01T10:00:00',
    end_datetime: '2025-06-01T18:00:00',
    status: 'pending',
    type: 'charter',
    total_value: 1000,
    deposit_amount: 200,
    guest_count: 4
  }

  it('should validate complete booking data', () => {
    const result = BookingValidationSchema.validate(validBookingData)
    expect(result.isValid).toBe(true)
    expect(Object.keys(result.errors)).toHaveLength(0)
  })

  it('should detect required field violations', () => {
    const incompleteData = { ...validBookingData }
    delete incompleteData.customer_name
    delete incompleteData.customer_email

    const result = BookingValidationSchema.validate(incompleteData)
    expect(result.isValid).toBe(false)
    expect(result.errors.customer_name).toBe('Customer name is required')
    expect(result.errors.customer_email).toBe('Customer email is required')
  })

  it('should validate email format', () => {
    const invalidEmailData = { 
      ...validBookingData, 
      customer_email: 'invalid-email' 
    }

    const result = BookingValidationSchema.validate(invalidEmailData)
    expect(result.isValid).toBe(false)
    expect(result.errors.customer_email).toContain('Invalid email format')
  })

  it('should validate date relationships', () => {
    const invalidDatesData = {
      ...validBookingData,
      start_datetime: '2025-06-01T18:00:00',
      end_datetime: '2025-06-01T10:00:00' // End before start
    }

    const result = BookingValidationSchema.validate(invalidDatesData)
    expect(result.isValid).toBe(false)
    expect(result.errors.end_datetime).toBe('End date must be after start date')
  })

  it('should validate financial constraints', () => {
    const invalidFinancialData = {
      ...validBookingData,
      total_value: 100,
      deposit_amount: 200 // Deposit exceeds total
    }

    const result = BookingValidationSchema.validate(invalidFinancialData)
    expect(result.isValid).toBe(false)
    expect(result.errors.deposit_amount).toContain('Deposit cannot exceed total value')
  })

  it('should provide business rule warnings', () => {
    const lowDepositData = {
      ...validBookingData,
      total_value: 1000,
      deposit_amount: 100 // 10% deposit, below recommended 20%
    }

    const result = BookingValidationSchema.validate(lowDepositData)
    expect(result.isValid).toBe(true) // Still valid, but with warnings
    expect(result.warnings).toContain(expect.stringContaining('Deposit is 10.0%'))
  })

  it('should validate with yacht specifications', () => {
    const yachtSpecs = { max_guests: 6 }
    const overCapacityData = {
      ...validBookingData,
      guest_count: 8
    }

    const result = BookingValidationSchema.validate(overCapacityData, { yachtSpecs })
    expect(result.isValid).toBe(false)
    expect(result.errors.guest_count).toContain('Guest count exceeds yacht capacity')
  })
})

describe('useValidation Hook', () => {
  beforeEach(() => {
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('should initialize with provided data', () => {
    const initialData = { customerName: 'John Doe', customerEmail: 'john@example.com' }
    
    const { result } = renderHook(() => 
      useValidation(initialData, { schema: 'booking' })
    )

    expect(result.current.data).toEqual(initialData)
    expect(result.current.isValid).toBe(true)
  })

  it('should update field values and trigger validation', async () => {
    const { result } = renderHook(() => 
      useValidation({}, { schema: 'booking' })
    )

    act(() => {
      result.current.updateField('customerEmail', 'invalid-email')
    })

    act(() => {
      vi.advanceTimersByTime(300) // Advance past debounce delay
    })

    await waitFor(() => {
      expect(result.current.data.customerEmail).toBe('invalid-email')
      expect(result.current.errors.customerEmail).toBeTruthy()
      expect(result.current.isValid).toBe(false)
    })
  })

  it('should provide field state information', () => {
    const { result } = renderHook(() => 
      useValidation({ customerName: 'John' }, { schema: 'booking' })
    )

    const fieldState = result.current.getFieldState('customerName')
    expect(fieldState.value).toBe('John')
    expect(fieldState.hasError).toBe(false)
    expect(fieldState.isTouched).toBe(false)
  })

  it('should handle focus and blur events', () => {
    const { result } = renderHook(() => 
      useValidation({}, { schema: 'booking' })
    )

    act(() => {
      result.current.onFieldFocus('customerName')
    })

    const focusedState = result.current.getFieldState('customerName')
    expect(focusedState.isFocused).toBe(true)

    act(() => {
      result.current.onFieldBlur('customerName')
    })

    const blurredState = result.current.getFieldState('customerName')
    expect(blurredState.isFocused).toBe(false)
    expect(blurredState.isTouched).toBe(true)
  })

  it('should validate all fields at once', async () => {
    const { result } = renderHook(() => 
      useValidation({ customerEmail: 'invalid' }, { schema: 'booking' })
    )

    await act(async () => {
      await result.current.validateAll()
    })

    expect(result.current.errors.customerEmail).toBeTruthy()
    expect(result.current.isValid).toBe(false)
  })
})

describe('ValidationMessage Component', () => {
  it('should render error messages', () => {
    render(
      <ValidationMessage 
        type="error" 
        message="This field is required" 
      />
    )

    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('text-red-600')
  })

  it('should render warning messages', () => {
    render(
      <ValidationMessage 
        type="warning" 
        message="This is a warning" 
      />
    )

    expect(screen.getByText('This is a warning')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('text-amber-600')
  })

  it('should show icons when enabled', () => {
    render(
      <ValidationMessage 
        type="error" 
        message="Error message" 
        showIcon={true}
      />
    )

    const icon = screen.getByRole('img', { hidden: true })
    expect(icon).toBeInTheDocument()
  })

  it('should not render when message is empty', () => {
    const { container } = render(
      <ValidationMessage 
        type="error" 
        message="" 
      />
    )

    expect(container.firstChild).toBeNull()
  })
})

describe('ValidatedField Component', () => {
  const mockFieldState = {
    value: 'test value',
    error: null,
    warning: null,
    isValid: true,
    isTouched: false,
    isFocused: false,
    isValidating: false
  }

  it('should render field with label', () => {
    render(
      <ValidatedField
        fieldState={mockFieldState}
        label="Test Field"
        required
      >
        <input type="text" value="test" readOnly />
      </ValidatedField>
    )

    expect(screen.getByText('Test Field')).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument() // Required indicator
  })

  it('should show error state', () => {
    const errorFieldState = {
      ...mockFieldState,
      error: 'This field has an error',
      isValid: false
    }

    render(
      <ValidatedField
        fieldState={errorFieldState}
        label="Test Field"
        showInlineError
      >
        <input type="text" value="test" readOnly />
      </ValidatedField>
    )

    expect(screen.getByText('This field has an error')).toBeInTheDocument()
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-red-500')
  })

  it('should show validation icon', () => {
    const validatingFieldState = {
      ...mockFieldState,
      isValidating: true
    }

    render(
      <ValidatedField
        fieldState={validatingFieldState}
        showValidationIcon
      >
        <input type="text" value="test" readOnly />
      </ValidatedField>
    )

    expect(screen.getByText('Validating...')).toBeInTheDocument()
  })
})

describe('ValidationSummary Component', () => {
  const mockValidationSummary = {
    hasErrors: true,
    hasWarnings: true,
    hasSuggestions: false,
    errors: {
      customerEmail: 'Invalid email format',
      customerName: 'Name is required'
    },
    warnings: ['Deposit is below recommended amount'],
    suggestions: {}
  }

  it('should display error summary', () => {
    render(
      <ValidationSummary 
        validationSummary={mockValidationSummary}
      />
    )

    expect(screen.getByText('Please fix the following errors:')).toBeInTheDocument()
    expect(screen.getByText(/customerEmail: Invalid email format/)).toBeInTheDocument()
    expect(screen.getByText(/customerName: Name is required/)).toBeInTheDocument()
  })

  it('should display warnings when enabled', () => {
    render(
      <ValidationSummary 
        validationSummary={mockValidationSummary}
        showWarnings
      />
    )

    expect(screen.getByText('Warnings:')).toBeInTheDocument()
    expect(screen.getByText('Deposit is below recommended amount')).toBeInTheDocument()
  })

  it('should not render when no issues exist', () => {
    const cleanSummary = {
      hasErrors: false,
      hasWarnings: false,
      hasSuggestions: false,
      errors: {},
      warnings: [],
      suggestions: {}
    }

    const { container } = render(
      <ValidationSummary validationSummary={cleanSummary} />
    )

    expect(container.firstChild).toBeNull()
  })
})

describe('MessageFormatter', () => {
  it('should format function-based messages', () => {
    const messageFunc = (name, count) => `Hello ${name}, you have ${count} items`
    const result = MessageFormatter.format(messageFunc, 'John', 5)
    expect(result).toBe('Hello John, you have 5 items')
  })

  it('should format template strings', () => {
    const template = 'Hello {0}, you have {1} items'
    const result = MessageFormatter.format(template, 'John', 5)
    expect(result).toBe('Hello John, you have 5 items')
  })

  it('should get messages by path', () => {
    const result = MessageFormatter.getMessage('required.email')
    expect(result).toBe('Email address is required')
  })

  it('should handle invalid paths gracefully', () => {
    const result = MessageFormatter.getMessage('invalid.path.that.does.not.exist')
    expect(result).toBe(ValidationMessages.generic.unknown)
  })
})

describe('ValidationMessageProvider', () => {
  let provider

  beforeEach(() => {
    provider = new ValidationMessageProvider()
  })

  it('should provide contextual validation messages', () => {
    const result = provider.getValidationMessage('customerEmail', 'email_format')
    
    expect(result.field).toBe('customerEmail')
    expect(result.message).toContain('RFC 5322 compliant')
    expect(result.type).toBe('error')
  })

  it('should provide business rule messages with context', () => {
    const result = provider.getValidationMessage('duration', 'min_duration', {
      constraint: 6
    })
    
    expect(result.message).toContain('Minimum booking duration is 6 hours')
    expect(result.suggestion).toBeTruthy()
  })

  it('should provide help text for fields', () => {
    const helpText = provider.getHelpText('email')
    expect(helpText).toContain('booking confirmations')
  })

  it('should generate warning messages', () => {
    const result = provider.getWarningMessage('depositLow', 10, 20)
    
    expect(result.type).toBe('warning')
    expect(result.message).toContain('Deposit is 10%')
    expect(result.dismissible).toBe(true)
  })
})

describe('CrossModelValidation', () => {
  const mockBookings = [
    {
      id: 'booking1',
      yacht_id: 'spectre',
      start_datetime: '2025-06-01T10:00:00',
      end_datetime: '2025-06-01T18:00:00',
      status: 'confirmed'
    },
    {
      id: 'booking2',
      yacht_id: 'spectre',
      start_datetime: '2025-06-02T10:00:00',
      end_datetime: '2025-06-02T18:00:00',
      status: 'pending'
    }
  ]

  it('should detect date conflicts', () => {
    const conflictingStart = '2025-06-01T14:00:00'
    const conflictingEnd = '2025-06-01T20:00:00'
    
    const hasConflicts = CrossModelValidation.hasNoDateConflicts(
      conflictingStart, 
      conflictingEnd, 
      mockBookings, 
      'spectre'
    )
    
    expect(hasConflicts).toBe(false) // Should return false when conflicts exist
  })

  it('should allow non-conflicting dates', () => {
    const nonConflictingStart = '2025-06-03T10:00:00'
    const nonConflictingEnd = '2025-06-03T18:00:00'
    
    const hasConflicts = CrossModelValidation.hasNoDateConflicts(
      nonConflictingStart, 
      nonConflictingEnd, 
      mockBookings, 
      'spectre'
    )
    
    expect(hasConflicts).toBe(true) // Should return true when no conflicts
  })

  it('should exclude specific booking from conflict check', () => {
    const conflictingStart = '2025-06-01T14:00:00'
    const conflictingEnd = '2025-06-01T20:00:00'
    
    const hasConflicts = CrossModelValidation.hasNoDateConflicts(
      conflictingStart, 
      conflictingEnd, 
      mockBookings, 
      'spectre',
      'booking1' // Exclude the conflicting booking
    )
    
    expect(hasConflicts).toBe(true) // Should return true when excluded booking conflicts
  })

  it('should validate yacht capacity', () => {
    const crewMembers = [
      { position: 'guest' },
      { position: 'guest' },
      { position: 'guest' },
      { position: 'captain' }
    ]
    
    const yachtSpecs = { max_guests: 2 }
    
    const withinCapacity = CrossModelValidation.isWithinYachtCapacity(crewMembers, yachtSpecs)
    expect(withinCapacity).toBe(false) // 3 guests exceeds capacity of 2
  })

  it('should validate alcohol service with crew ages', () => {
    const crewMembers = [
      { 
        position: 'guest', 
        date_of_birth: '2010-01-01' // Under 21
      },
      { 
        position: 'guest', 
        date_of_birth: '1990-01-01' // Over 21
      }
    ]
    
    const result = CrossModelValidation.validateAlcoholService(crewMembers, true)
    
    expect(result.isValid).toBe(true)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toContain('1 crew member(s) are under 21')
  })
})

describe('Performance and Edge Cases', () => {
  it('should handle large datasets efficiently', () => {
    const largeBookingList = Array.from({ length: 1000 }, (_, i) => ({
      id: `booking${i}`,
      yacht_id: 'spectre',
      start_datetime: `2025-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-01T10:00:00`,
      end_datetime: `2025-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-01T18:00:00`,
      status: 'confirmed'
    }))

    const start = performance.now()
    
    const hasConflicts = CrossModelValidation.hasNoDateConflicts(
      '2025-06-15T10:00:00',
      '2025-06-15T18:00:00',
      largeBookingList,
      'spectre'
    )
    
    const end = performance.now()
    
    expect(end - start).toBeLessThan(100) // Should complete in under 100ms
    expect(typeof hasConflicts).toBe('boolean')
  })

  it('should handle malformed date inputs gracefully', () => {
    const result = ValidationUtils.validateBookingDuration('invalid-date', '2025-01-01')
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Invalid dates')
  })

  it('should handle null and undefined values', () => {
    expect(() => {
      BookingValidationSchema.validate({
        summary: null,
        yacht_id: undefined,
        customer_name: '',
        customer_email: null
      })
    }).not.toThrow()
  })

  it('should validate extreme booking durations', () => {
    const start = '2025-01-01T10:00:00'
    const veryLongEnd = '2025-12-31T10:00:00' // Nearly a year
    
    const result = ValidationUtils.validateBookingDuration(start, veryLongEnd)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Maximum booking duration')
  })
})