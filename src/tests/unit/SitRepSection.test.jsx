/**
 * SitRepSection Component Unit Tests
 * 
 * Tests for the rebuilt SIT REP widget with horizontal scrolling cards,
 * real-time updates, and accessibility features.
 * 
 * @author AI Agent
 * @created 2025-06-26
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import SitRepSection from '../../components/dashboard/SitRepSection'

// Mock the fetchCharters function
const mockFetchCharters = vi.fn()

// Mock event emitter for real-time updates
const mockEventEmitter = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn()
}

// Mock navigate function
const mockNavigateToBooking = vi.fn()

// Mock data for testing
const mockCharters = [
  {
    id: 'charter-1',
    yachtName: 'Serenity',
    startDate: '2025-06-26T10:00:00Z',
    endDate: '2025-06-28T18:00:00Z',
    status: 'active',
    calendarColor: '#34C759'
  },
  {
    id: 'charter-2',
    yachtName: 'Ocean Dream',
    startDate: '2025-06-25T09:00:00Z',
    endDate: '2025-06-27T17:00:00Z',
    status: 'active',
    calendarColor: '#007AFF'
  },
  {
    id: 'charter-3',
    yachtName: 'Wind Dancer',
    startDate: '2025-06-30T11:00:00Z',
    endDate: '2025-07-02T16:00:00Z',
    status: 'upcoming',
    calendarColor: '#FF9500'
  },
  {
    id: 'charter-4',
    yachtName: 'Blue Wave',
    startDate: '2025-07-05T12:00:00Z',
    endDate: '2025-07-07T15:00:00Z',
    status: 'upcoming',
    calendarColor: '#5856D6'
  }
]

// Mock global functions
global.fetchCharters = mockFetchCharters
global.eventEmitter = mockEventEmitter
global.navigateToBooking = mockNavigateToBooking

describe('SitRepSection Component', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    mockFetchCharters.mockResolvedValue(mockCharters)
    
    // Mock setInterval and clearInterval
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllTimers()
  })

  describe('Component Structure', () => {
    it('should render the main title "SIT REP"', async () => {
      render(<SitRepSection />)
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: /sit rep/i })).toBeInTheDocument()
      })
    })

    it('should render both "BOATS OUT" and "UPCOMING CHARTERS" subsections', async () => {
      render(<SitRepSection />)
      
      await waitFor(() => {
        expect(screen.getByRole('region', { name: /boats out/i })).toBeInTheDocument()
        expect(screen.getByRole('region', { name: /upcoming charters/i })).toBeInTheDocument()
      })
    })

    it('should have horizontal scrollable containers', async () => {
      render(<SitRepSection />)
      
      await waitFor(() => {
        const boatsOutContainer = screen.getByRole('region', { name: /boats out/i })
          .querySelector('[data-testid="boats-out-scroll-container"]')
        const upcomingContainer = screen.getByRole('region', { name: /upcoming charters/i })
          .querySelector('[data-testid="upcoming-charters-scroll-container"]')
        
        expect(boatsOutContainer).toHaveClass('overflow-x-auto', 'flex', 'gap-3')
        expect(upcomingContainer).toHaveClass('overflow-x-auto', 'flex', 'gap-3')
      })
    })
  })

  describe('Data Fetching and Loading', () => {
    it('should call fetchCharters on mount', async () => {
      render(<SitRepSection />)
      
      await waitFor(() => {
        expect(mockFetchCharters).toHaveBeenCalledTimes(1)
      })
    })

    it('should display loading skeleton while fetching data', () => {
      mockFetchCharters.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
      
      render(<SitRepSection />)
      
      expect(screen.getByTestId('sitrep-loading-skeleton')).toBeInTheDocument()
    })

    it('should hide loading skeleton after data loads', async () => {
      render(<SitRepSection />)
      
      await waitFor(() => {
        expect(screen.queryByTestId('sitrep-loading-skeleton')).not.toBeInTheDocument()
      })
    })
  })

  describe('Data Categorization', () => {
    it('should correctly categorize active charters as "BOATS OUT"', async () => {
      render(<SitRepSection />)
      
      await waitFor(() => {
        const boatsOutSection = screen.getByRole('region', { name: /boats out/i })
        expect(boatsOutSection).toHaveTextContent('Serenity')
        expect(boatsOutSection).toHaveTextContent('Ocean Dream')
      })
    })

    it('should correctly categorize upcoming charters', async () => {
      render(<SitRepSection />)
      
      await waitFor(() => {
        const upcomingSection = screen.getByRole('region', { name: /upcoming charters/i })
        expect(upcomingSection).toHaveTextContent('Wind Dancer')
        expect(upcomingSection).toHaveTextContent('Blue Wave')
      })
    })

    it('should limit upcoming charters to 10 items', async () => {
      // Create mock data with more than 10 upcoming charters
      const manyUpcomingCharters = Array.from({ length: 15 }, (_, i) => ({
        id: `charter-${i}`,
        yachtName: `Yacht ${i}`,
        startDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + (i + 2) * 24 * 60 * 60 * 1000).toISOString(),
        status: 'upcoming',
        calendarColor: '#FF9500'
      }))
      
      mockFetchCharters.mockResolvedValue(manyUpcomingCharters)
      
      render(<SitRepSection />)
      
      await waitFor(() => {
        const upcomingCards = screen.getAllByTestId(/upcoming-charter-card/)
        expect(upcomingCards).toHaveLength(10)
      })
    })
  })

  describe('Card Rendering', () => {
    it('should render cards with correct background colors', async () => {
      render(<SitRepSection />)
      
      await waitFor(() => {
        const serenityCard = screen.getByTestId('boats-out-card-charter-1')
        expect(serenityCard).toHaveStyle({ backgroundColor: '#34C759' })
      })
    })

    it('should display yacht names in bold', async () => {
      render(<SitRepSection />)
      
      await waitFor(() => {
        const yachtNames = screen.getAllByTestId(/yacht-name/)
        yachtNames.forEach(name => {
          expect(name).toHaveClass('font-bold')
        })
      })
    })

    it('should format dates correctly using Intl.DateTimeFormat', async () => {
      render(<SitRepSection />)
      
      await waitFor(() => {
        const dateElements = screen.getAllByTestId(/date-range/)
        expect(dateElements[0]).toHaveTextContent(/26 Jun 2025.+28 Jun 2025/)
      })
    })

    it('should render cards as clickable buttons', async () => {
      render(<SitRepSection />)
      
      await waitFor(() => {
        const cards = screen.getAllByRole('button')
        expect(cards.length).toBeGreaterThan(0)
        cards.forEach(card => {
          expect(card).toHaveClass('focus-visible:ring')
        })
      })
    })
  })

  describe('Card Interactions', () => {
    it('should call navigateToBooking when card is clicked', async () => {
      render(<SitRepSection />)
      
      await waitFor(() => {
        const firstCard = screen.getByTestId('boats-out-card-charter-1')
        fireEvent.click(firstCard)
        expect(mockNavigateToBooking).toHaveBeenCalledWith('charter-1')
      })
    })

    it('should handle keyboard navigation', async () => {
      render(<SitRepSection />)
      
      await waitFor(() => {
        const firstCard = screen.getByTestId('boats-out-card-charter-1')
        firstCard.focus()
        fireEvent.keyDown(firstCard, { key: 'Enter' })
        expect(mockNavigateToBooking).toHaveBeenCalledWith('charter-1')
      })
    })
  })

  describe('Empty States', () => {
    it('should display "None at the moment 🚤" when no boats are out', async () => {
      const emptyMockCharters = mockCharters.map(charter => ({
        ...charter,
        status: 'upcoming'
      }))
      mockFetchCharters.mockResolvedValue(emptyMockCharters)
      
      render(<SitRepSection />)
      
      await waitFor(() => {
        const boatsOutSection = screen.getByRole('region', { name: /boats out/i })
        expect(boatsOutSection).toHaveTextContent('None at the moment 🚤')
      })
    })

    it('should display "None at the moment 🚤" when no upcoming charters', async () => {
      const emptyUpcomingCharters = mockCharters.map(charter => ({
        ...charter,
        status: 'active'
      }))
      mockFetchCharters.mockResolvedValue(emptyUpcomingCharters)
      
      render(<SitRepSection />)
      
      await waitFor(() => {
        const upcomingSection = screen.getByRole('region', { name: /upcoming charters/i })
        expect(upcomingSection).toHaveTextContent('None at the moment 🚤')
      })
    })
  })

  describe('Real-time Updates', () => {
    it('should subscribe to op:update event on mount', async () => {
      render(<SitRepSection />)
      
      await waitFor(() => {
        expect(mockEventEmitter.on).toHaveBeenCalledWith('op:update', expect.any(Function))
      })
    })

    it('should unsubscribe from op:update event on unmount', async () => {
      const { unmount } = render(<SitRepSection />)
      
      await waitFor(() => {
        expect(mockEventEmitter.on).toHaveBeenCalled()
      })
      
      unmount()
      
      expect(mockEventEmitter.off).toHaveBeenCalledWith('op:update', expect.any(Function))
    })

    it('should refetch data when op:update event is emitted', async () => {
      render(<SitRepSection />)
      
      await waitFor(() => {
        expect(mockFetchCharters).toHaveBeenCalledTimes(1)
      })
      
      // Simulate op:update event
      const updateHandler = mockEventEmitter.on.mock.calls.find(call => call[0] === 'op:update')[1]
      act(() => {
        updateHandler()
      })
      
      await waitFor(() => {
        expect(mockFetchCharters).toHaveBeenCalledTimes(2)
      })
    })

    it('should set up 5-minute polling interval', async () => {
      render(<SitRepSection />)
      
      await waitFor(() => {
        expect(mockFetchCharters).toHaveBeenCalledTimes(1)
      })
      
      // Fast-forward 5 minutes
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000)
      })
      
      await waitFor(() => {
        expect(mockFetchCharters).toHaveBeenCalledTimes(2)
      })
    })

    it('should clear polling interval on unmount', async () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      const { unmount } = render(<SitRepSection />)
      
      unmount()
      
      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels on subsections', async () => {
      render(<SitRepSection />)
      
      await waitFor(() => {
        expect(screen.getByRole('region', { name: /boats out/i })).toBeInTheDocument()
        expect(screen.getByRole('region', { name: /upcoming charters/i })).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation with focus-visible styling', async () => {
      render(<SitRepSection />)
      
      await waitFor(() => {
        const cards = screen.getAllByRole('button')
        cards.forEach(card => {
          expect(card).toHaveClass('focus-visible:ring')
        })
      })
    })

    it('should have proper button semantics for cards', async () => {
      render(<SitRepSection />)
      
      await waitFor(() => {
        const cards = screen.getAllByRole('button')
        expect(cards.length).toBeGreaterThan(0)
        cards.forEach(card => {
          expect(card.tagName).toBe('BUTTON')
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle fetchCharters errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockFetchCharters.mockRejectedValue(new Error('Network error'))
      
      render(<SitRepSection />)
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching charters:', expect.any(Error))
      })
      
      consoleErrorSpy.mockRestore()
    })

    it('should display empty state when fetch fails', async () => {
      mockFetchCharters.mockRejectedValue(new Error('Network error'))
      
      render(<SitRepSection />)
      
      await waitFor(() => {
        const boatsOutSection = screen.getByRole('region', { name: /boats out/i })
        const upcomingSection = screen.getByRole('region', { name: /upcoming charters/i })
        
        expect(boatsOutSection).toHaveTextContent('None at the moment 🚤')
        expect(upcomingSection).toHaveTextContent('None at the moment 🚤')
      })
    })
  })

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', async () => {
      const renderSpy = vi.fn()
      const TestComponent = () => {
        renderSpy()
        return <SitRepSection />
      }
      
      render(<TestComponent />)
      
      await waitFor(() => {
        expect(mockFetchCharters).toHaveBeenCalled()
      })
      
      // Should only render twice: initial render + data load
      expect(renderSpy).toHaveBeenCalledTimes(2)
    })
  })
})