/**
 * End-to-End Tests for Booking Conflict Detection System
 * 
 * Tests the complete user flow of booking creation with conflict detection
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Import components to test
import BookingFormModal from '../../components/modals/BookingFormModal'
import YachtTimelineCalendar from '../../components/calendar/YachtTimelineCalendar'
import BookingCell from '../../components/calendar/BookingCell'
import { BookingModel, BookingStatus } from '../../models/core/BookingModel'

describe('Booking Conflict Detection System - E2E', () => {
  let user
  let mockYachts
  let mockExistingBookings

  beforeEach(() => {
    user = userEvent.setup()
    
    mockYachts = [
      { id: 'spectre', name: 'Spectre' },
      { id: 'disk-drive', name: 'Disk Drive' },
      { id: 'arriva', name: 'Arriva' }
    ]

    mockExistingBookings = [
      new BookingModel({
        id: '1',
        yacht_id: 'spectre',
        customer_name: 'John Smith',
        start_datetime: new Date(2025, 5, 10),
        end_datetime: new Date(2025, 5, 15),
        status: BookingStatus.CONFIRMED
      }),
      new BookingModel({
        id: '2',
        yacht_id: 'disk-drive',
        customer_name: 'Jane Doe',
        start_datetime: new Date(2025, 5, 12),
        end_datetime: new Date(2025, 5, 18),
        status: BookingStatus.PENDING
      })
    ]
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('BookingFormModal Conflict Detection', () => {
    test('should show conflict when selecting overlapping dates', async () => {
      const mockOnSubmit = jest.fn()
      const mockOnClose = jest.fn()

      render(
        <BookingFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          yachts={mockYachts}
          existingBookings={mockExistingBookings}
        />
      )

      // Fill in customer details
      await user.type(screen.getByLabelText(/first name/i), 'Test')
      await user.type(screen.getByLabelText(/surname/i), 'Customer')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/phone/i), '+44 7123 456789')

      // Go to booking section
      await user.click(screen.getByRole('button', { name: /booking/i }))

      // Select yacht with existing booking
      await user.selectOptions(screen.getByLabelText(/yacht/i), 'spectre')

      // Select conflicting dates
      await user.type(screen.getByLabelText(/start date/i), '2025-06-12')
      await user.type(screen.getByLabelText(/end date/i), '2025-06-16')

      // Wait for conflict detection
      await waitFor(() => {
        expect(screen.getByText(/conflict detected/i)).toBeInTheDocument()
      })

      // Should show details about the conflict
      expect(screen.getByText(/conflicts with.*john smith/i)).toBeInTheDocument()
    })

    test('should show availability when selecting non-conflicting dates', async () => {
      const mockOnSubmit = jest.fn()
      const mockOnClose = jest.fn()

      render(
        <BookingFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          yachts={mockYachts}
          existingBookings={mockExistingBookings}
        />
      )

      // Fill in customer details
      await user.type(screen.getByLabelText(/first name/i), 'Test')
      await user.type(screen.getByLabelText(/surname/i), 'Customer')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/phone/i), '+44 7123 456789')

      // Go to booking section
      await user.click(screen.getByRole('button', { name: /booking/i }))

      // Select yacht without conflicts
      await user.selectOptions(screen.getByLabelText(/yacht/i), 'arriva')

      // Select non-conflicting dates
      await user.type(screen.getByLabelText(/start date/i), '2025-07-01')
      await user.type(screen.getByLabelText(/end date/i), '2025-07-05')

      // Wait for availability check
      await waitFor(() => {
        expect(screen.getByText(/available for booking/i)).toBeInTheDocument()
      })
    })

    test('should show alternative suggestions when conflicts exist', async () => {
      const mockOnSubmit = jest.fn()
      const mockOnClose = jest.fn()

      render(
        <BookingFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          yachts={mockYachts}
          existingBookings={mockExistingBookings}
        />
      )

      // Fill minimal details and trigger conflict
      await user.type(screen.getByLabelText(/first name/i), 'Test')
      await user.type(screen.getByLabelText(/surname/i), 'Customer')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/phone/i), '+44 7123 456789')

      await user.click(screen.getByRole('button', { name: /booking/i }))
      await user.selectOptions(screen.getByLabelText(/yacht/i), 'spectre')
      await user.type(screen.getByLabelText(/start date/i), '2025-06-12')
      await user.type(screen.getByLabelText(/end date/i), '2025-06-14')

      // Wait for conflict and suggestions
      await waitFor(() => {
        expect(screen.getByText(/alternative booking options/i)).toBeInTheDocument()
      })

      // Should show alternative yachts
      expect(screen.getByText(/available yachts/i)).toBeInTheDocument()
      
      // Should be able to click on an alternative
      const alternativeButton = screen.getByRole('button', { name: /arriva/i })
      expect(alternativeButton).toBeInTheDocument()
      
      // Click alternative should update the form
      await user.click(alternativeButton)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('arriva')).toBeInTheDocument()
      })
    })

    test('should prevent submission when conflicts exist', async () => {
      const mockOnSubmit = jest.fn()
      const mockOnClose = jest.fn()

      render(
        <BookingFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          yachts={mockYachts}
          existingBookings={mockExistingBookings}
        />
      )

      // Fill form with conflicting booking
      await user.type(screen.getByLabelText(/first name/i), 'Test')
      await user.type(screen.getByLabelText(/surname/i), 'Customer')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/phone/i), '+44 7123 456789')

      await user.click(screen.getByRole('button', { name: /booking/i }))
      await user.selectOptions(screen.getByLabelText(/yacht/i), 'spectre')
      await user.type(screen.getByLabelText(/start date/i), '2025-06-12')
      await user.type(screen.getByLabelText(/end date/i), '2025-06-14')

      // Wait for conflict detection
      await waitFor(() => {
        expect(screen.getByText(/conflict detected/i)).toBeInTheDocument()
      })

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /create booking/i })
      await user.click(submitButton)

      // Should show error and not call onSubmit
      await waitFor(() => {
        expect(screen.getByText(/cannot create booking due to conflicts/i)).toBeInTheDocument()
      })
      
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    test('should allow submission when no conflicts exist', async () => {
      const mockOnSubmit = jest.fn()
      const mockOnClose = jest.fn()

      render(
        <BookingFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          yachts={mockYachts}
          existingBookings={mockExistingBookings}
        />
      )

      // Fill form with non-conflicting booking
      await user.type(screen.getByLabelText(/first name/i), 'Test')
      await user.type(screen.getByLabelText(/surname/i), 'Customer')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/phone/i), '+44 7123 456789')

      await user.click(screen.getByRole('button', { name: /booking/i }))
      await user.selectOptions(screen.getByLabelText(/yacht/i), 'arriva')
      await user.type(screen.getByLabelText(/start date/i), '2025-07-01')
      await user.type(screen.getByLabelText(/end date/i), '2025-07-05')

      // Wait for availability confirmation
      await waitFor(() => {
        expect(screen.getByText(/available for booking/i)).toBeInTheDocument()
      })

      // Submit should work
      const submitButton = screen.getByRole('button', { name: /create booking/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('BookingCell Availability Display', () => {
    test('should display correct availability status', () => {
      const testDate = new Date(2025, 5, 12) // Within existing booking
      const mockOnClick = jest.fn()

      render(
        <BookingCell
          date={testDate}
          yachtId="spectre"
          booking={null}
          allBookings={mockExistingBookings}
          onClick={mockOnClick}
        />
      )

      // Should show the existing booking
      expect(screen.getByText('John Smith')).toBeInTheDocument()
      
      // Should have confirmed booking styling
      const cell = screen.getByTestId('booking-cell')
      expect(cell).toHaveClass('bg-ios-green/20')
    })

    test('should show available slot for empty date', () => {
      const testDate = new Date(2025, 6, 1) // Available date
      const mockOnClick = jest.fn()

      render(
        <BookingCell
          date={testDate}
          yachtId="arriva"
          booking={null}
          allBookings={mockExistingBookings}
          onClick={mockOnClick}
        />
      )

      const cell = screen.getByTestId('booking-cell')
      expect(cell).toHaveClass('bg-ios-bg-primary')
      expect(cell).toHaveAttribute('aria-label', expect.stringContaining('Available'))
    })

    test('should handle click with availability information', async () => {
      const testDate = new Date(2025, 6, 1)
      const mockOnClick = jest.fn()

      render(
        <BookingCell
          date={testDate}
          yachtId="arriva"
          booking={null}
          allBookings={mockExistingBookings}
          onClick={mockOnClick}
        />
      )

      const cell = screen.getByTestId('booking-cell')
      await user.click(cell)

      expect(mockOnClick).toHaveBeenCalledWith(
        expect.objectContaining({
          date: testDate,
          yachtId: 'arriva',
          availability: expect.objectContaining({
            status: 'available',
            isAvailable: true
          })
        })
      )
    })
  })

  describe('Drag and Drop Conflict Prevention', () => {
    test('should show drag feedback when dragging over available cell', async () => {
      const sourceDate = new Date(2025, 5, 10)
      const targetDate = new Date(2025, 6, 1) // Available
      const mockOnDrop = jest.fn()

      const { rerender } = render(
        <div>
          <BookingCell
            date={sourceDate}
            yachtId="spectre"
            booking={mockExistingBookings[0]}
            allBookings={mockExistingBookings}
            onClick={() => {}}
          />
          <BookingCell
            date={targetDate}
            yachtId="spectre"
            booking={null}
            allBookings={mockExistingBookings}
            onClick={() => {}}
            onDrop={mockOnDrop}
          />
        </div>
      )

      const sourceCell = screen.getAllByTestId('booking-cell')[0]
      const targetCell = screen.getAllByTestId('booking-cell')[1]

      // Start drag
      fireEvent.dragStart(sourceCell, {
        dataTransfer: {
          effectAllowed: 'move',
          setData: jest.fn()
        }
      })

      // Drag over target
      fireEvent.dragOver(targetCell, {
        dataTransfer: {
          dropEffect: 'move'
        }
      })

      // Should show green drag feedback for available cell
      await waitFor(() => {
        expect(targetCell).toHaveClass('ring-green-400')
      })
    })

    test('should show conflict feedback when dragging over unavailable cell', async () => {
      const sourceDate = new Date(2025, 5, 10)
      const conflictDate = new Date(2025, 5, 13) // Within another booking
      
      render(
        <div>
          <BookingCell
            date={sourceDate}
            yachtId="spectre"
            booking={mockExistingBookings[0]}
            allBookings={mockExistingBookings}
            onClick={() => {}}
          />
          <BookingCell
            date={conflictDate}
            yachtId="disk-drive" // Different yacht but has booking
            booking={null}
            allBookings={mockExistingBookings}
            onClick={() => {}}
          />
        </div>
      )

      const sourceCell = screen.getAllByTestId('booking-cell')[0]
      const targetCell = screen.getAllByTestId('booking-cell')[1]

      // Start drag
      fireEvent.dragStart(sourceCell)

      // Drag over target
      fireEvent.dragOver(targetCell)

      // Should show red drag feedback for conflict
      await waitFor(() => {
        expect(targetCell).toHaveClass('ring-red-400')
      })
    })
  })

  describe('Complete Booking Workflow', () => {
    test('should complete full workflow from calendar click to booking creation', async () => {
      const mockCreateBooking = jest.fn()
      const mockOnSubmit = jest.fn()

      // Mock calendar component with cell click
      const TestCalendar = () => {
        const handleCellClick = ({ date, yachtId, availability }) => {
          if (availability?.isAvailable) {
            mockCreateBooking({ date, yachtId })
          }
        }

        return (
          <BookingCell
            date={new Date(2025, 6, 1)}
            yachtId="arriva"
            booking={null}
            allBookings={mockExistingBookings}
            onClick={handleCellClick}
          />
        )
      }

      const { unmount } = render(<TestCalendar />)

      // Click on available cell
      const cell = screen.getByTestId('booking-cell')
      await user.click(cell)

      expect(mockCreateBooking).toHaveBeenCalledWith({
        date: new Date(2025, 6, 1),
        yachtId: 'arriva'
      })

      unmount()

      // Now test the booking form
      render(
        <BookingFormModal
          isOpen={true}
          onClose={() => {}}
          onSubmit={mockOnSubmit}
          bookingData={{ date: new Date(2025, 6, 1), yachtId: 'arriva' }}
          yachts={mockYachts}
          existingBookings={mockExistingBookings}
        />
      )

      // Form should pre-populate with selected data
      expect(screen.getByDisplayValue('arriva')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2025-07-01')).toBeInTheDocument()

      // Complete the form
      await user.type(screen.getByLabelText(/first name/i), 'New')
      await user.type(screen.getByLabelText(/surname/i), 'Customer')
      await user.type(screen.getByLabelText(/email/i), 'new@example.com')
      await user.type(screen.getByLabelText(/phone/i), '+44 7123 456789')

      await user.click(screen.getByRole('button', { name: /booking/i }))
      await user.type(screen.getByLabelText(/end date/i), '2025-07-05')

      // Should show available
      await waitFor(() => {
        expect(screen.getByText(/available for booking/i)).toBeInTheDocument()
      })

      // Submit
      await user.click(screen.getByRole('button', { name: /create booking/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            booking: expect.objectContaining({
              yacht_id: 'arriva',
              customer_name: 'New Customer'
            })
          })
        )
      })
    })

    test('should handle conflict resolution workflow', async () => {
      const mockOnSubmit = jest.fn()

      render(
        <BookingFormModal
          isOpen={true}
          onClose={() => {}}
          onSubmit={mockOnSubmit}
          yachts={mockYachts}
          existingBookings={mockExistingBookings}
        />
      )

      // Fill form with conflicting data
      await user.type(screen.getByLabelText(/first name/i), 'Conflict')
      await user.type(screen.getByLabelText(/surname/i), 'Customer')
      await user.type(screen.getByLabelText(/email/i), 'conflict@example.com')
      await user.type(screen.getByLabelText(/phone/i), '+44 7123 456789')

      await user.click(screen.getByRole('button', { name: /booking/i }))
      await user.selectOptions(screen.getByLabelText(/yacht/i), 'spectre')
      await user.type(screen.getByLabelText(/start date/i), '2025-06-12')
      await user.type(screen.getByLabelText(/end date/i), '2025-06-14')

      // Wait for conflict detection and suggestions
      await waitFor(() => {
        expect(screen.getByText(/conflict detected/i)).toBeInTheDocument()
        expect(screen.getByText(/alternative booking options/i)).toBeInTheDocument()
      })

      // Use alternative yacht suggestion
      const arrivaButton = screen.getByRole('button', { name: /arriva/i })
      await user.click(arrivaButton)

      // Should update yacht selection and clear conflict
      await waitFor(() => {
        expect(screen.getByDisplayValue('arriva')).toBeInTheDocument()
        expect(screen.getByText(/available for booking/i)).toBeInTheDocument()
      })

      // Now submission should work
      await user.click(screen.getByRole('button', { name: /create booking/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })
})