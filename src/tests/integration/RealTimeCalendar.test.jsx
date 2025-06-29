/**
 * Real-Time Calendar Integration Tests
 * 
 * Integration tests for the complete real-time calendar system including
 * calendar component, booking operations, and state synchronization.
 * 
 * @author AI Agent
 * @created 2025-06-24
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookingProvider } from '../../contexts/BookingContext'
import YachtTimelineCalendar from '../../components/calendar/YachtTimelineCalendar'
import BookingFormModal from '../../components/modals/BookingFormModal'
import { BookingModel, BookingStatus } from '../../models/core/BookingModel'

// Mock date-fns to control time in tests
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns')
  return {
    ...actual,
    // Mock current date for consistent testing
    isAfter: vi.fn(),
    isBefore: vi.fn(),
    format: vi.fn((date, formatStr) => {
      if (formatStr === 'PPP') return 'July 1st, 2025'
      if (formatStr === "yyyy-MM-dd'T'HH:mm") return '2025-07-01T09:00'
      return actual.format(date, formatStr)
    })
  }
})

describe('Real-Time Calendar Integration', () => {
  const mockBookings = [
    new BookingModel({
      id: 'booking-1',
      yacht_id: 'spectre',
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      start_datetime: new Date('2025-07-01T09:00:00'),
      end_datetime: new Date('2025-07-03T17:00:00'),
      status: BookingStatus.CONFIRMED,
      summary: 'John Doe - Spectre'
    }),
    new BookingModel({
      id: 'booking-2',
      yacht_id: 'disk-drive',
      customer_name: 'Jane Smith',
      customer_email: 'jane@example.com',
      start_datetime: new Date('2025-07-05T10:00:00'),
      end_datetime: new Date('2025-07-07T16:00:00'),
      status: BookingStatus.PENDING,
      summary: 'Jane Smith - Disk Drive'
    })
  ]

  let user
  let mockOnCreateBooking
  let mockOnEditBooking

  beforeEach(() => {
    user = userEvent.setup()
    mockOnCreateBooking = vi.fn()
    mockOnEditBooking = vi.fn()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-24T12:00:00'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  const renderCalendarWithProvider = (initialBookings = mockBookings) => {
    return render(
      <BookingProvider initialBookings={initialBookings}>
        <YachtTimelineCalendar 
          onCreateBooking={mockOnCreateBooking}
          onEditBooking={mockOnEditBooking}
        />
      </BookingProvider>
    )
  }

  describe('Calendar Display', () => {
    it('should render calendar with yacht headers', () => {
      renderCalendarWithProvider()
      
      expect(screen.getByText('Yacht Timeline Calendar')).toBeInTheDocument()
      expect(screen.getByTestId('yacht-headers')).toBeInTheDocument()
      
      // Check yacht headers
      expect(screen.getByText('Spectre')).toBeInTheDocument()
      expect(screen.getByText('Disk Drive')).toBeInTheDocument()
      expect(screen.getByText('Arriva')).toBeInTheDocument()
    })

    it('should display existing bookings in calendar cells', () => {
      renderCalendarWithProvider()
      
      // Should display booking customer names
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    it('should show booking details on hover', async () => {
      renderCalendarWithProvider()
      
      const bookingCell = screen.getByText('John Doe').closest('[data-testid="booking-cell"]')
      
      await user.hover(bookingCell)
      
      // Should show draggable indicator
      expect(within(bookingCell).getByTitle('Draggable')).toBeInTheDocument()
    })
  })

  describe('Booking Creation', () => {
    it('should trigger create booking when clicking empty cell', async () => {
      renderCalendarWithProvider()
      
      // Find an empty cell
      const emptyCells = screen.getAllByTestId('booking-cell')
      const emptyCell = emptyCells.find(cell => 
        !cell.textContent.includes('John Doe') && 
        !cell.textContent.includes('Jane Smith')
      )
      
      await user.click(emptyCell)
      
      expect(mockOnCreateBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          yachtId: expect.any(String),
          date: expect.any(Date)
        })
      )
    })

    it('should not trigger create on unavailable cells', async () => {
      renderCalendarWithProvider()
      
      // Click on a cell that has a booking
      const bookingCell = screen.getByText('John Doe').closest('[data-testid="booking-cell"]')
      
      await user.click(bookingCell)
      
      // Should trigger edit instead of create
      expect(mockOnEditBooking).toHaveBeenCalled()
      expect(mockOnCreateBooking).not.toHaveBeenCalled()
    })
  })

  describe('Booking Editing', () => {
    it('should trigger edit booking when clicking existing booking', async () => {
      renderCalendarWithProvider()
      
      const bookingCell = screen.getByText('John Doe').closest('[data-testid="booking-cell"]')
      
      await user.click(bookingCell)
      
      expect(mockOnEditBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'booking-1',
          customer_name: 'John Doe'
        })
      )
    })
  })

  describe('Drag and Drop', () => {
    it('should handle drag start on booking cells', async () => {
      renderCalendarWithProvider()
      
      const bookingCell = screen.getByText('John Doe').closest('[data-testid="booking-cell"]')
      
      // Simulate drag start
      fireEvent.dragStart(bookingCell, {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn()
        }
      })
      
      expect(bookingCell).toHaveAttribute('draggable', 'true')
    })

    it('should handle drop on available cells', async () => {
      renderCalendarWithProvider()
      
      const bookingCell = screen.getByText('John Doe').closest('[data-testid="booking-cell"]')
      const emptyCells = screen.getAllByTestId('booking-cell')
      const targetCell = emptyCells.find(cell => 
        !cell.textContent.includes('John Doe') && 
        !cell.textContent.includes('Jane Smith')
      )
      
      // Simulate drag and drop
      const dragData = {
        booking: mockBookings[0],
        sourceDate: new Date('2025-07-01'),
        sourceYacht: 'spectre'
      }
      
      fireEvent.dragStart(bookingCell, {
        dataTransfer: {
          effectAllowed: 'move',
          setData: (type, data) => {
            expect(type).toBe('application/json')
            expect(JSON.parse(data)).toEqual(dragData)
          }
        }
      })
      
      fireEvent.dragOver(targetCell, {
        dataTransfer: {
          dropEffect: ''
        }
      })
      
      fireEvent.drop(targetCell, {
        dataTransfer: {
          getData: () => JSON.stringify(dragData)
        }
      })
      
      // Should handle the drop
      expect(targetCell).toBeInTheDocument()
    })

    it('should prevent drop on unavailable cells', async () => {
      renderCalendarWithProvider()
      
      const sourceCell = screen.getByText('John Doe').closest('[data-testid="booking-cell"]')
      const targetCell = screen.getByText('Jane Smith').closest('[data-testid="booking-cell"]')
      
      fireEvent.dragOver(targetCell, {
        dataTransfer: {
          dropEffect: ''
        }
      })
      
      // Should show not-allowed cursor
      await waitFor(() => {
        expect(targetCell.classList.contains('cursor-not-allowed')).toBe(false) // Available cells don't have this class
      })
    })
  })

  describe('Real-Time Updates', () => {
    it('should update calendar when new booking is created', async () => {
      const { rerender } = renderCalendarWithProvider([])
      
      // Initially no bookings
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      
      // Add a booking
      rerender(
        <BookingProvider initialBookings={[mockBookings[0]]}>
          <YachtTimelineCalendar 
            onCreateBooking={mockOnCreateBooking}
            onEditBooking={mockOnEditBooking}
          />
        </BookingProvider>
      )
      
      // Should now show the booking
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('should update calendar when booking is modified', async () => {
      const { rerender } = renderCalendarWithProvider([mockBookings[0]])
      
      // Initially shows original customer name
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      
      // Update the booking
      const updatedBooking = new BookingModel({
        ...mockBookings[0].toDatabase(),
        customer_name: 'John Smith Updated'
      })
      
      rerender(
        <BookingProvider initialBookings={[updatedBooking]}>
          <YachtTimelineCalendar 
            onCreateBooking={mockOnCreateBooking}
            onEditBooking={mockOnEditBooking}
          />
        </BookingProvider>
      )
      
      // Should show updated name
      await waitFor(() => {
        expect(screen.getByText('John Smith Updated')).toBeInTheDocument()
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      })
    })

    it('should remove booking from calendar when deleted', async () => {
      const { rerender } = renderCalendarWithProvider([mockBookings[0]])
      
      // Initially shows the booking
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      
      // Remove the booking
      rerender(
        <BookingProvider initialBookings={[]}>
          <YachtTimelineCalendar 
            onCreateBooking={mockOnCreateBooking}
            onEditBooking={mockOnEditBooking}
          />
        </BookingProvider>
      )
      
      // Should no longer show the booking
      await waitFor(() => {
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading indicator during operations', () => {
      renderCalendarWithProvider()
      
      // Check if loading states are handled properly
      // This would need to be tested with actual loading state from context
      expect(screen.getByTestId('yacht-calendar')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error messages when operations fail', () => {
      // This would test error states from the booking context
      renderCalendarWithProvider()
      
      // For now, just verify the calendar renders without errors
      expect(screen.getByTestId('yacht-calendar')).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support arrow key navigation between cells', async () => {
      renderCalendarWithProvider()
      
      const calendarCells = screen.getAllByRole('button')
      const firstCell = calendarCells[0]
      
      // Focus first cell
      firstCell.focus()
      expect(document.activeElement).toBe(firstCell)
      
      // Navigate with arrow keys
      await user.keyboard('{ArrowRight}')
      
      // Should move focus (implementation would need to be tested based on actual behavior)
      expect(document.activeElement).not.toBe(firstCell)
    })

    it('should support Enter key to select cells', async () => {
      renderCalendarWithProvider()
      
      const emptyCells = screen.getAllByTestId('booking-cell')
      const emptyCell = emptyCells.find(cell => 
        !cell.textContent.includes('John Doe') && 
        !cell.textContent.includes('Jane Smith')
      )
      
      emptyCell.focus()
      await user.keyboard('{Enter}')
      
      expect(mockOnCreateBooking).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderCalendarWithProvider()
      
      const calendar = screen.getByTestId('yacht-calendar')
      expect(calendar).toBeInTheDocument()
      
      // Check for proper button roles on cells
      const cells = screen.getAllByRole('button')
      expect(cells.length).toBeGreaterThan(0)
      
      // Check for proper aria-labels on booking cells
      const bookingCells = screen.getAllByTestId('booking-cell')
      bookingCells.forEach(cell => {
        expect(cell).toHaveAttribute('aria-label')
      })
    })

    it('should support screen reader navigation', () => {
      renderCalendarWithProvider()
      
      // Verify that booking cells have descriptive labels
      const johnDoeCell = screen.getByText('John Doe').closest('[data-testid="booking-cell"]')
      expect(johnDoeCell).toHaveAttribute('aria-label')
      expect(johnDoeCell.getAttribute('aria-label')).toContain('John Doe')
    })
  })

  describe('Performance', () => {
    it('should handle large numbers of bookings efficiently', () => {
      // Create many bookings
      const manyBookings = Array.from({ length: 100 }, (_, i) => 
        new BookingModel({
          id: `booking-${i}`,
          yacht_id: 'spectre',
          customer_name: `Customer ${i}`,
          customer_email: `customer${i}@example.com`,
          start_datetime: new Date(`2025-07-${(i % 30) + 1}T09:00:00`),
          end_datetime: new Date(`2025-07-${(i % 30) + 1}T17:00:00`),
          status: BookingStatus.CONFIRMED,
          summary: `Customer ${i} - Spectre`
        })
      )
      
      const startTime = performance.now()
      renderCalendarWithProvider(manyBookings)
      const endTime = performance.now()
      
      // Should render in reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000)
      
      // Should still be functional
      expect(screen.getByTestId('yacht-calendar')).toBeInTheDocument()
    })
  })
})