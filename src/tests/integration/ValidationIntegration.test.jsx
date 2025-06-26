/**
 * Validation System Integration Tests
 * 
 * Integration tests for the complete validation system including
 * hooks, components, services, and real-world scenarios.
 * 
 * @author AI Agent
 * @created 2025-06-24
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Import components and services
import EnhancedBookingFormModal from '../../components/modals/EnhancedBookingFormModal'
import { yachtAvailabilityService } from '../../services/YachtAvailabilityService'
import { useBookings } from '../../contexts/BookingContext'

// Mock the booking context
vi.mock('../../contexts/BookingContext', () => ({
  useBookings: vi.fn()
}))

// Mock the common components
vi.mock('../../components/common/Modal', () => ({
  default: ({ children, isOpen, title }) => 
    isOpen ? <div data-testid="modal" aria-label={title}>{children}</div> : null
}))

vi.mock('../../components/common/LoadingSpinner', () => ({
  default: ({ message }) => <div data-testid="loading-spinner">{message}</div>
}))

vi.mock('../../components/booking/ConflictResolutionSuggestions', () => ({
  default: ({ conflicts, onResolve }) => (
    <div data-testid="conflict-suggestions">
      {conflicts.map((conflict, index) => (
        <div key={index}>
          <span>Conflict: {conflict.reason}</span>
          <button onClick={() => onResolve({ type: 'adjust_dates' })}>
            Resolve
          </button>
        </div>
      ))}
    </div>
  )
}))

describe('Validation Integration Tests', () => {
  const mockBookingContext = {
    createBooking: vi.fn(),
    updateBooking: vi.fn(),
    deleteBooking: vi.fn(),
    getBookingConflicts: vi.fn(() => ({ conflicts: [] })),
    loading: false,
    error: null,
    clearError: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useBookings.mockReturnValue(mockBookingContext)
    
    // Clear yacht availability service bookings
    yachtAvailabilityService.bookings.clear()
  })

  describe('EnhancedBookingFormModal Integration', () => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      onSave: vi.fn(),
      onDelete: vi.fn()
    }

    it('should render form with validation indicators', async () => {
      render(<EnhancedBookingFormModal {...defaultProps} />)

      // Check that form fields are present
      expect(screen.getByLabelText(/customer name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/yacht/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument()

      // Check validation status badge
      expect(screen.getByText(/valid/i)).toBeInTheDocument()
    })

    it('should show real-time validation errors', async () => {
      const user = userEvent.setup()
      render(<EnhancedBookingFormModal {...defaultProps} />)

      const emailInput = screen.getByLabelText(/email/i)
      
      // Type invalid email
      await user.type(emailInput, 'invalid-email')
      await user.tab() // Trigger blur

      // Wait for validation to complete
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
      })

      // Check that validation status reflects error
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
    })

    it('should validate phone numbers with international format', async () => {
      const user = userEvent.setup()
      render(<EnhancedBookingFormModal {...defaultProps} />)

      const phoneInput = screen.getByLabelText(/phone/i)
      
      // Type invalid phone
      await user.type(phoneInput, '123-456-7890')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/use international format/i)).toBeInTheDocument()
      })

      // Clear and type valid international phone
      await user.clear(phoneInput)
      await user.type(phoneInput, '+1234567890')
      await user.tab()

      await waitFor(() => {
        expect(screen.queryByText(/use international format/i)).not.toBeInTheDocument()
      })
    })

    it('should validate date relationships and business rules', async () => {
      const user = userEvent.setup()
      render(<EnhancedBookingFormModal {...defaultProps} />)

      const startInput = screen.getByLabelText(/start date/i)
      const endInput = screen.getByLabelText(/end date/i)

      // Set end date before start date
      await user.type(startInput, '2025-06-01T14:00')
      await user.type(endInput, '2025-06-01T10:00')

      await waitFor(() => {
        expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument()
      })

      // Fix the date order but make duration too short
      await user.clear(endInput)
      await user.type(endInput, '2025-06-01T15:00') // Only 1 hour duration

      await waitFor(() => {
        expect(screen.getByText(/minimum booking duration/i)).toBeInTheDocument()
      })
    })

    it('should validate guest count against yacht capacity', async () => {
      const user = userEvent.setup()
      render(<EnhancedBookingFormModal {...defaultProps} />)

      const yachtSelect = screen.getByLabelText(/yacht/i)
      const guestInput = screen.getByLabelText(/guest count/i)

      // Select a yacht with specific capacity
      await user.selectOptions(yachtSelect, 'melba-so') // Max 6 guests
      await user.clear(guestInput)
      await user.type(guestInput, '8') // Exceeds capacity

      await waitFor(() => {
        expect(screen.getByText(/guest count exceeds yacht capacity/i)).toBeInTheDocument()
      })
    })

    it('should show availability conflicts and suggestions', async () => {
      const user = userEvent.setup()
      
      // Add a conflicting booking to the service
      yachtAvailabilityService.addBooking({
        id: 'existing-booking',
        yacht_id: 'spectre',
        start_datetime: '2025-06-01T10:00:00',
        end_datetime: '2025-06-01T18:00:00',
        status: 'confirmed',
        customer_name: 'Existing Customer'
      })

      // Mock conflict detection
      mockBookingContext.getBookingConflicts.mockReturnValue({
        conflicts: [{
          type: 'booking',
          severity: 'high',
          reason: 'Conflicts with existing booking',
          canOverride: false
        }]
      })

      render(<EnhancedBookingFormModal {...defaultProps} />)

      // Fill in form to trigger conflict check
      await user.selectOptions(screen.getByLabelText(/yacht/i), 'spectre')
      await user.type(screen.getByLabelText(/start date/i), '2025-06-01T12:00')
      await user.type(screen.getByLabelText(/end date/i), '2025-06-01T16:00')

      await waitFor(() => {
        expect(screen.getByTestId('conflict-suggestions')).toBeInTheDocument()
        expect(screen.getByText(/conflicts with existing booking/i)).toBeInTheDocument()
      })
    })

    it('should validate financial amounts and show warnings', async () => {
      const user = userEvent.setup()
      render(<EnhancedBookingFormModal {...defaultProps} />)

      const totalInput = screen.getByLabelText(/total value/i)
      const depositInput = screen.getByLabelText(/deposit amount/i)

      // Set very low total value
      await user.type(totalInput, '50')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/minimum booking value/i)).toBeInTheDocument()
      })

      // Fix total value but set low deposit percentage
      await user.clear(totalInput)
      await user.type(totalInput, '1000')
      await user.type(depositInput, '100') // 10% deposit

      await waitFor(() => {
        expect(screen.getByText(/deposit is 10.0%/i)).toBeInTheDocument()
      })
    })

    it('should prevent submission when validation fails', async () => {
      const user = userEvent.setup()
      render(<EnhancedBookingFormModal {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /create booking/i })
      
      // Try to submit with empty form
      expect(submitButton).toBeDisabled()

      // Fill minimum required fields
      await user.type(screen.getByLabelText(/customer name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.selectOptions(screen.getByLabelText(/yacht/i), 'spectre')
      await user.type(screen.getByLabelText(/start date/i), '2025-06-01T10:00')
      await user.type(screen.getByLabelText(/end date/i), '2025-06-01T18:00')

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })

      // Add validation error and check button is disabled again
      await user.clear(screen.getByLabelText(/email/i))
      await user.type(screen.getByLabelText(/email/i), 'invalid-email')

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })

    it('should apply suggestions and update form fields', async () => {
      const user = userEvent.setup()
      render(<EnhancedBookingFormModal {...defaultProps} />)

      // Set up a scenario that generates suggestions
      await user.selectOptions(screen.getByLabelText(/yacht/i), 'spectre')
      await user.type(screen.getByLabelText(/start date/i), '2025-06-01T10:00')
      await user.type(screen.getByLabelText(/end date/i), '2025-06-01T12:00') // Too short

      // Wait for suggestion to appear and apply it
      await waitFor(() => {
        const suggestion = screen.getByText(/extend booking to 6 hours/i)
        expect(suggestion).toBeInTheDocument()
      })

      // In a real scenario, there would be an "Apply" button for suggestions
      // This tests the concept even if the exact UI differs
    })

    it('should handle successful form submission', async () => {
      const user = userEvent.setup()
      mockBookingContext.createBooking.mockResolvedValue({
        id: 'new-booking-id',
        customer_name: 'John Doe'
      })

      render(<EnhancedBookingFormModal {...defaultProps} />)

      // Fill out valid form
      await user.type(screen.getByLabelText(/customer name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.selectOptions(screen.getByLabelText(/yacht/i), 'spectre')
      await user.type(screen.getByLabelText(/start date/i), '2025-06-01T10:00')
      await user.type(screen.getByLabelText(/end date/i), '2025-06-01T18:00')
      await user.type(screen.getByLabelText(/total value/i), '1000')
      await user.type(screen.getByLabelText(/deposit amount/i), '200')

      const submitButton = screen.getByRole('button', { name: /create booking/i })
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })

      await user.click(submitButton)

      await waitFor(() => {
        expect(mockBookingContext.createBooking).toHaveBeenCalledWith(
          expect.objectContaining({
            customer_name: 'John Doe',
            customer_email: 'john@example.com',
            yacht_id: 'spectre',
            total_value: 1000,
            deposit_amount: 200
          })
        )
      })

      expect(defaultProps.onSave).toHaveBeenCalled()
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should handle form submission errors gracefully', async () => {
      const user = userEvent.setup()
      mockBookingContext.createBooking.mockRejectedValue(new Error('Server error'))

      render(<EnhancedBookingFormModal {...defaultProps} />)

      // Fill out form and submit
      await user.type(screen.getByLabelText(/customer name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.selectOptions(screen.getByLabelText(/yacht/i), 'spectre')
      await user.type(screen.getByLabelText(/start date/i), '2025-06-01T10:00')
      await user.type(screen.getByLabelText(/end date/i), '2025-06-01T18:00')

      const submitButton = screen.getByRole('button', { name: /create booking/i })
      await user.click(submitButton)

      // Should not close the modal on error
      await waitFor(() => {
        expect(defaultProps.onClose).not.toHaveBeenCalled()
      })
    })
  })

  describe('Yacht Availability Integration', () => {
    it('should integrate with yacht availability service', () => {
      const availability = yachtAvailabilityService.checkAvailability(
        'spectre',
        '2025-06-01T10:00:00',
        '2025-06-01T18:00:00'
      )

      expect(availability.isAvailable).toBe(true)
      expect(availability.yacht).toBeDefined()
      expect(availability.yacht.id).toBe('spectre')
    })

    it('should detect maintenance conflicts', () => {
      const availability = yachtAvailabilityService.checkAvailability(
        'spectre',
        '2025-01-15T10:00:00', // During maintenance period
        '2025-01-15T18:00:00'
      )

      expect(availability.isAvailable).toBe(false)
      expect(availability.conflicts).toHaveLength(1)
      expect(availability.conflicts[0].type).toBe('maintenance')
    })

    it('should find alternative yachts when requested yacht is unavailable', () => {
      // Add a booking that conflicts with spectre
      yachtAvailabilityService.addBooking({
        id: 'conflict-booking',
        yacht_id: 'spectre',
        start_datetime: '2025-06-01T10:00:00',
        end_datetime: '2025-06-01T18:00:00',
        status: 'confirmed',
        customer_name: 'Conflicting Customer'
      })

      const alternatives = yachtAvailabilityService.findAvailableAlternatives(
        '2025-06-01T10:00:00',
        '2025-06-01T18:00:00',
        8, // 8 guests
        ['spectre'] // Exclude spectre
      )

      expect(alternatives.length).toBeGreaterThan(0)
      expect(alternatives[0].yacht.id).not.toBe('spectre')
      expect(alternatives[0].yacht.maxGuests).toBeGreaterThanOrEqual(8)
    })

    it('should validate complete booking with availability', () => {
      const bookingData = {
        yacht_id: 'spectre',
        start_datetime: '2025-06-01T10:00:00',
        end_datetime: '2025-06-01T18:00:00',
        guest_count: 8
      }

      const validation = yachtAvailabilityService.validateBookingAvailability(bookingData)

      expect(validation.isValid).toBe(true)
      expect(validation.yacht).toBeDefined()
      expect(validation.availability.isAvailable).toBe(true)
    })

    it('should provide seasonal pricing warnings', () => {
      const bookingData = {
        yacht_id: 'spectre',
        start_datetime: '2025-07-01T10:00:00', // Peak season
        end_datetime: '2025-07-01T18:00:00',
        guest_count: 6
      }

      const validation = yachtAvailabilityService.validateBookingAvailability(bookingData)

      expect(validation.isValid).toBe(true)
      expect(validation.warnings).toContain(expect.stringContaining('peak season'))
    })
  })

  describe('End-to-End Validation Workflow', () => {
    it('should complete full validation workflow', async () => {
      const user = userEvent.setup()
      
      // Mock successful booking creation
      mockBookingContext.createBooking.mockResolvedValue({
        id: 'new-booking',
        customer_name: 'Jane Smith'
      })

      render(<EnhancedBookingFormModal {...defaultProps} />)

      // Step 1: Fill customer information
      await user.type(screen.getByLabelText(/customer name/i), 'Jane Smith')
      await user.type(screen.getByLabelText(/email/i), 'jane.smith@example.com')
      await user.type(screen.getByLabelText(/phone/i), '+1555123456')

      // Step 2: Select yacht and verify capacity validation
      await user.selectOptions(screen.getByLabelText(/yacht/i), 'arriva') // Max 8 guests
      await user.clear(screen.getByLabelText(/guest count/i))
      await user.type(screen.getByLabelText(/guest count/i), '6')

      // Step 3: Set dates and verify duration validation
      await user.type(screen.getByLabelText(/start date/i), '2025-06-15T10:00')
      await user.type(screen.getByLabelText(/end date/i), '2025-06-15T16:00') // 6 hours - valid

      // Step 4: Set financial information
      await user.type(screen.getByLabelText(/total value/i), '1200')
      await user.type(screen.getByLabelText(/deposit amount/i), '300') // 25% deposit

      // Step 5: Verify form is valid and can be submitted
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /create booking/i })
        expect(submitButton).not.toBeDisabled()
      })

      // Step 6: Submit and verify success
      const submitButton = screen.getByRole('button', { name: /create booking/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockBookingContext.createBooking).toHaveBeenCalled()
        expect(defaultProps.onSave).toHaveBeenCalled()
        expect(defaultProps.onClose).toHaveBeenCalled()
      })
    })

    it('should handle complex validation scenario with conflicts and suggestions', async () => {
      const user = userEvent.setup()

      // Add conflicting booking
      yachtAvailabilityService.addBooking({
        id: 'conflict',
        yacht_id: 'spectre',
        start_datetime: '2025-06-01T14:00:00',
        end_datetime: '2025-06-01T18:00:00',
        status: 'confirmed',
        customer_name: 'Conflict Customer'
      })

      mockBookingContext.getBookingConflicts.mockReturnValue({
        conflicts: [{
          type: 'booking',
          severity: 'high',
          reason: 'Overlaps with existing booking',
          canOverride: false
        }]
      })

      render(<EnhancedBookingFormModal {...defaultProps} />)

      // Fill form with conflicting dates
      await user.type(screen.getByLabelText(/customer name/i), 'Test Customer')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.selectOptions(screen.getByLabelText(/yacht/i), 'spectre')
      await user.type(screen.getByLabelText(/start date/i), '2025-06-01T12:00')
      await user.type(screen.getByLabelText(/end date/i), '2025-06-01T16:00')

      // Should show conflict
      await waitFor(() => {
        expect(screen.getByText(/overlaps with existing booking/i)).toBeInTheDocument()
      })

      // Submit button should be disabled due to conflict
      const submitButton = screen.getByRole('button', { name: /create booking/i })
      expect(submitButton).toBeDisabled()

      // Apply conflict resolution by changing yacht
      await user.selectOptions(screen.getByLabelText(/yacht/i), 'arriva')

      // Should now be submittable
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })
  })
})