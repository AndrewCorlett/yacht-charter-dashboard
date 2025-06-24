/**
 * Calendar Header Tests
 * 
 * Purpose: Test calendar navigation and view mode controls
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CalendarHeader from '../../components/calendar/CalendarHeader'

describe('CalendarHeader', () => {
  const mockOnPrevious = vi.fn()
  const mockOnNext = vi.fn()
  const mockOnToday = vi.fn()
  const mockOnViewModeChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all navigation buttons', () => {
    render(
      <CalendarHeader
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
        onToday={mockOnToday}
        viewMode="week"
        onViewModeChange={mockOnViewModeChange}
      />
    )

    expect(screen.getByLabelText('Previous period')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByLabelText('Next period')).toBeInTheDocument()
  })

  it('renders all view mode buttons', () => {
    render(
      <CalendarHeader
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
        onToday={mockOnToday}
        viewMode="week"
        onViewModeChange={mockOnViewModeChange}
      />
    )

    expect(screen.getByText('day')).toBeInTheDocument()
    expect(screen.getByText('week')).toBeInTheDocument()
    expect(screen.getByText('month')).toBeInTheDocument()
  })

  it('highlights active view mode', () => {
    render(
      <CalendarHeader
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
        onToday={mockOnToday}
        viewMode="month"
        onViewModeChange={mockOnViewModeChange}
      />
    )

    const monthButton = screen.getByText('month')
    expect(monthButton).toHaveClass('bg-white')
    expect(monthButton).toHaveClass('text-blue-600')
  })

  it('calls navigation handlers when clicked', () => {
    render(
      <CalendarHeader
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
        onToday={mockOnToday}
        viewMode="week"
        onViewModeChange={mockOnViewModeChange}
      />
    )

    fireEvent.click(screen.getByLabelText('Previous period'))
    expect(mockOnPrevious).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('Today'))
    expect(mockOnToday).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByLabelText('Next period'))
    expect(mockOnNext).toHaveBeenCalledTimes(1)
  })

  it('calls view mode change handler', () => {
    render(
      <CalendarHeader
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
        onToday={mockOnToday}
        viewMode="week"
        onViewModeChange={mockOnViewModeChange}
      />
    )

    fireEvent.click(screen.getByText('month'))
    expect(mockOnViewModeChange).toHaveBeenCalledWith('month')

    fireEvent.click(screen.getByText('day'))
    expect(mockOnViewModeChange).toHaveBeenCalledWith('day')
  })
})