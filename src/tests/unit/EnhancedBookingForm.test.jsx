/**
 * Enhanced Booking Form Tests
 * 
 * Basic tests for the enhanced booking form components.
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CreateBookingSection from '../../components/booking/CreateBookingSection'
import { BookingModel } from '../../models/core/BookingModel'
import { StatusTrackingModel } from '../../models/core/StatusTrackingModel'

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') {
      return '2024-06-24'
    }
    return date.toISOString()
  }),
  parseISO: vi.fn((dateString) => new Date(dateString)),
  isValid: vi.fn((date) => date instanceof Date && !isNaN(date.getTime())),
  isBefore: vi.fn((date1, date2) => new Date(date1) < new Date(date2)),
  isAfter: vi.fn((date1, date2) => new Date(date1) > new Date(date2))
}))

describe('Enhanced Booking Form Components', () => {
  const mockOnCreateBooking = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CreateBookingSection', () => {
    it('renders all form sections', () => {
      render(<CreateBookingSection onCreateBooking={mockOnCreateBooking} />)
      
      // Check section navigation buttons
      expect(screen.getByText(/Customer Details/)).toBeInTheDocument()
      expect(screen.getByText(/Booking Details/)).toBeInTheDocument()
      expect(screen.getByText(/Financial Info/)).toBeInTheDocument()
      expect(screen.getByText(/Status Tracking/)).toBeInTheDocument()
    })

    it('starts with customer section active', () => {
      render(<CreateBookingSection onCreateBooking={mockOnCreateBooking} />)
      
      // Customer section should be visible
      expect(screen.getByText('👤 Customer Information')).toBeInTheDocument()
      expect(screen.getByLabelText(/Customer Number/)).toBeInTheDocument()
      expect(screen.getByLabelText(/First Name/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Surname/)).toBeInTheDocument()
    })

    it('navigates between sections correctly', () => {
      render(<CreateBookingSection onCreateBooking={mockOnCreateBooking} />)
      
      // Click on booking details section
      fireEvent.click(screen.getByText(/Booking Details/))
      
      // Booking section should be visible
      expect(screen.getByText('🛥️ Booking Details')).toBeInTheDocument()
      expect(screen.getByLabelText(/Yacht/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Start Date/)).toBeInTheDocument()
    })

    it('has all required form fields', () => {
      render(<CreateBookingSection onCreateBooking={mockOnCreateBooking} />)
      
      // Customer section fields
      expect(screen.getByLabelText(/Customer Number/)).toBeInTheDocument()
      expect(screen.getByLabelText(/First Name/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Surname/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Phone/)).toBeInTheDocument()
      
      // Check booking number is auto-generated and disabled
      const bookingNoField = screen.getByPlaceholderText(/Auto-generated/)
      expect(bookingNoField).toBeInTheDocument()
      expect(bookingNoField).toBeDisabled()
    })

    it('shows financial section with calculation fields', () => {
      render(<CreateBookingSection onCreateBooking={mockOnCreateBooking} />)
      
      // Navigate to financial section
      fireEvent.click(screen.getByText(/Financial Info/))
      
      // Financial fields should be visible
      expect(screen.getByText('💰 Financial Information')).toBeInTheDocument()
      expect(screen.getByLabelText(/Total Value/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Deposit Amount/)).toBeInTheDocument()
    })

    it('shows status tracking section with toggles', () => {
      render(<CreateBookingSection onCreateBooking={mockOnCreateBooking} />)
      
      // Navigate to status section
      fireEvent.click(screen.getByText(/Status Tracking/))
      
      // Status fields should be visible
      expect(screen.getByText('📋 Status Tracking')).toBeInTheDocument()
      expect(screen.getByLabelText(/Booking Confirmed/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Deposit Paid/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Contract Sent/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Contract Signed/)).toBeInTheDocument()
    })

    it('has action buttons for draft and submission', () => {
      render(<CreateBookingSection onCreateBooking={mockOnCreateBooking} />)
      
      expect(screen.getByText(/Save Draft/)).toBeInTheDocument()
      expect(screen.getByText(/Load Draft/)).toBeInTheDocument()
      expect(screen.getByText(/Reset/)).toBeInTheDocument()
      expect(screen.getByText(/Create Booking/)).toBeInTheDocument()
    })
  })

  describe('BookingModel Integration', () => {
    it('creates valid booking model from form data', () => {
      const bookingData = {
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '+44 7123 456789',
        yacht_id: 'spectre',
        start_datetime: '2024-07-01',
        end_datetime: '2024-07-07',
        type: 'charter',
        summary: 'John Doe - Spectre'
      }

      const booking = new BookingModel(bookingData)
      
      expect(booking.customer_name).toBe('John Doe')
      expect(booking.customer_email).toBe('john@example.com')
      expect(booking.yacht_id).toBe('spectre')
      expect(booking.summary).toBe('John Doe - Spectre')
      expect(booking.validate()).toBe(true)
    })

    it('creates valid status tracking model', () => {
      const bookingId = 'test-booking-id'
      const statusTracking = StatusTrackingModel.createDefault(bookingId)
      
      expect(statusTracking.booking_id).toBe(bookingId)
      expect(statusTracking.validate()).toBe(true)
      expect(statusTracking.overall_progress).toBe(0) // No completed statuses yet
    })

    it('auto-generates booking numbers and IDs', () => {
      const booking = new BookingModel()
      
      expect(booking.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i) // UUID format
      expect(booking.booking_no).toMatch(/^BK\d{7}$/) // BK + 7 digits (2-digit year + 2-digit month + 3-digit random)
      expect(booking.ical_uid).toContain('@seascape-yachts.com')
    })

    it('validates required fields correctly', () => {
      const booking = new BookingModel()
      
      // Should fail validation with empty required fields
      expect(booking.validate()).toBe(false)
      
      const errors = booking.getErrors()
      expect(errors.customer_name).toBeDefined()
      expect(errors.customer_email).toBeDefined()
      expect(errors.yacht_id).toBeDefined()
    })

    it('validates email format', () => {
      const booking = new BookingModel({
        customer_email: 'invalid-email'
      })
      
      expect(booking.validate()).toBe(false)
      expect(booking.getError('customer_email')).toContain('Invalid email format')
    })

    it('validates date ranges', () => {
      const booking = new BookingModel({
        start_datetime: '2024-07-07',
        end_datetime: '2024-07-01' // End before start
      })
      
      expect(booking.validate()).toBe(false)
      expect(booking.getError('end_datetime')).toContain('End date must be after start date')
    })

    it('validates financial amounts', () => {
      const booking = new BookingModel({
        total_value: 1000,
        deposit_amount: 1500 // Deposit greater than total
      })
      
      expect(booking.validate()).toBe(false)
      expect(booking.getError('deposit_amount')).toContain('Deposit cannot exceed total value')
    })
  })

  describe('Status Tracking Model', () => {
    it('updates status with timestamps', () => {
      const statusTracking = StatusTrackingModel.createDefault('test-booking')
      
      // Update a status
      const success = statusTracking.updateStatus('booking_confirmed', 'completed', 'Test note')
      
      expect(success).toBe(true)
      expect(statusTracking.status_fields.booking_confirmed).toBe('completed')
      expect(statusTracking.notes.booking_confirmed).toBe('Test note')
      expect(statusTracking.timestamps.booking_confirmed).toBeInstanceOf(Date)
      expect(statusTracking.overall_progress).toBeGreaterThan(0)
    })

    it('calculates progress correctly', () => {
      const statusTracking = StatusTrackingModel.createDefault('test-booking')
      
      // Mark some statuses as completed
      statusTracking.updateStatus('booking_confirmed', 'completed')
      statusTracking.updateStatus('deposit_received', 'completed')
      
      // Progress should be calculated as percentage of completed fields
      const totalFields = Object.keys(statusTracking.status_fields).length
      const completedFields = 2
      const expectedProgress = Math.round((completedFields / totalFields) * 100)
      
      expect(statusTracking.overall_progress).toBe(expectedProgress)
    })

    it('tracks milestones for completed items', () => {
      const statusTracking = StatusTrackingModel.createDefault('test-booking')
      
      // Update status should create milestone
      statusTracking.updateStatus('booking_confirmed', 'completed')
      
      expect(statusTracking.milestones).toHaveLength(1)
      expect(statusTracking.milestones[0].name).toContain('BOOKING CONFIRMED completed')
    })
  })
})