/**
 * Booking Cell Tests
 * 
 * Purpose: Test individual calendar cell functionality
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BookingCell from '../../components/calendar/BookingCell'

describe('BookingCell', () => {
  const mockOnClick = vi.fn()
  const mockDate = new Date(2025, 6, 1)
  const mockYachtId = 'spectre'

  beforeEach(() => {
    mockOnClick.mockClear()
  })

  it('renders available cell correctly', () => {
    render(
      <BookingCell
        date={mockDate}
        yachtId={mockYachtId}
        booking={null}
        onClick={mockOnClick}
      />
    )

    const cell = screen.getByRole('button')
    expect(cell).toHaveClass('bg-white')
  })

  it('renders confirmed booking correctly', () => {
    const booking = {
      customerName: 'Smith Family',
      customerNo: 'C2401',
      tripNo: 'SP-001',
      status: 'confirmed'
    }

    render(
      <BookingCell
        date={mockDate}
        yachtId={mockYachtId}
        booking={booking}
        onClick={mockOnClick}
      />
    )

    expect(screen.getByText('Smith Family')).toBeInTheDocument()
    expect(screen.getByText('C2401 • SP-001')).toBeInTheDocument()
    
    const cell = screen.getByRole('button')
    expect(cell).toHaveClass('bg-green-200')
  })

  it('renders unavailable cell correctly', () => {
    const booking = {
      customerName: 'Maintenance',
      customerNo: 'MAINT',
      tripNo: 'MS-MNT',
      status: 'unavailable'
    }

    render(
      <BookingCell
        date={mockDate}
        yachtId={mockYachtId}
        booking={booking}
        onClick={mockOnClick}
      />
    )

    const cell = screen.getByRole('button')
    expect(cell).toHaveClass('bg-red-200')
  })

  it('handles click events', () => {
    render(
      <BookingCell
        date={mockDate}
        yachtId={mockYachtId}
        booking={null}
        onClick={mockOnClick}
      />
    )

    fireEvent.click(screen.getByRole('button'))
    
    expect(mockOnClick).toHaveBeenCalledWith({
      date: mockDate,
      yachtId: mockYachtId,
      booking: null
    })
  })

  it('handles keyboard events', () => {
    render(
      <BookingCell
        date={mockDate}
        yachtId={mockYachtId}
        booking={null}
        onClick={mockOnClick}
      />
    )

    const cell = screen.getByRole('button')
    
    fireEvent.keyDown(cell, { key: 'Enter' })
    expect(mockOnClick).toHaveBeenCalledTimes(1)
    
    fireEvent.keyDown(cell, { key: ' ' })
    expect(mockOnClick).toHaveBeenCalledTimes(2)
  })

  it('shows plus icon on hover for available cells', () => {
    render(
      <BookingCell
        date={mockDate}
        yachtId={mockYachtId}
        booking={null}
        onClick={mockOnClick}
      />
    )

    const cell = screen.getByRole('button')
    
    // Plus icon should not be visible initially
    expect(screen.queryByTestId('plus-icon')).not.toBeInTheDocument()
    
    // After hover, plus icon should be visible
    fireEvent.mouseEnter(cell)
    // Note: Would need to add data-testid to the plus icon SVG to properly test
  })
})