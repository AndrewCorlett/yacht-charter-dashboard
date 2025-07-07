/**
 * Main Dashboard Component
 * 
 * Purpose: Main layout with sidebar and calendar
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

import { useState, useEffect } from 'react'
import Navigation from '../Layout/Navigation'
import Sidebar from '../Layout/Sidebar'
import SitRepSection from './SitRepSection'
import YachtTimelineCalendar from '../calendar/YachtTimelineCalendar'
import { CreateBookingSection } from '../booking'
import Settings from '../settings/Settings'
import BookingsList from '../booking/BookingsList'
import BookingPanel from '../booking/BookingPanel'
import { BookingModel, BookingStatus } from '../../models'
import { BookingProvider, useBookings } from '../../contexts/BookingContext'
import UndoManager from '../common/UndoManager'
import KeyboardShortcuts from '../common/KeyboardShortcuts'

// Inner component that has access to BookingContext
function MainDashboardInner() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [currentView, setCurrentView] = useState('list') // 'list' or 'panel'
  const [quickCreateData, setQuickCreateData] = useState({})
  
  // Get booking operations from context
  const { getBooking, bookings } = useBookings()

  // Listen for custom navigation and auto-populate events from child components
  useEffect(() => {
    const handleNavigateToBooking = async (event) => {
      const { booking, section } = event.detail
      if (booking && section === 'bookings') {
        setActiveSection('bookings')
        
        // If we have a full booking object, use it directly
        if (booking.customer_name || booking.customerName || booking.yacht_name || booking.yacht_id) {
          // Ensure it's a BookingModel instance with toFrontend method
          const bookingModel = booking.toFrontend ? booking : BookingModel.fromDatabase(booking)
          setSelectedBooking(bookingModel)
        } else if (booking.id) {
          // If we only have an ID, find the booking in our context
          const fullBooking = getBooking(booking.id)
          if (fullBooking) {
            // Ensure it's a BookingModel instance with toFrontend method
            const bookingModel = fullBooking.toFrontend ? fullBooking : BookingModel.fromDatabase(fullBooking)
            setSelectedBooking(bookingModel)
          } else {
            console.warn('Booking not found in context:', booking.id)
            setSelectedBooking(booking)
          }
        } else {
          setSelectedBooking(booking)
        }
        
        setCurrentView('panel')
      }
    }

    const handleAutoPopulateBooking = (event) => {
      const { date, yachtId } = event.detail
      console.log('Auto-populating quick create booking with:', { date, yachtId })
      setQuickCreateData({ date, yachtId, trigger: Date.now() }) // trigger forces re-render
    }

    window.addEventListener('navigateToBooking', handleNavigateToBooking)
    window.addEventListener('autoPopulateBooking', handleAutoPopulateBooking)
    
    return () => {
      window.removeEventListener('navigateToBooking', handleNavigateToBooking)
      window.removeEventListener('autoPopulateBooking', handleAutoPopulateBooking)
    }
  }, [bookings, getBooking])

  const handleQuickCreateBooking = (booking) => {
    // When a booking is created via Quick Create and user clicks "Go to booking"
    if (booking) {
      // Navigate to bookings section and select the specific booking
      setActiveSection('bookings')
      setSelectedBooking(booking)
      setCurrentView('panel')
    } else {
      // Default behavior for successful creation without navigation
      console.log('Quick create booking completed')
    }
  }

  const handleSelectBooking = (booking) => {
    setSelectedBooking(booking)
    setCurrentView('panel')
  }

  const handleBackToList = () => {
    setSelectedBooking(null)
    setCurrentView('list')
  }

  const handleKeyboardAction = (action) => {
    switch (action) {
      case 'create-booking':
        // Focus on the quick create booking section instead of opening modal
        const quickCreateInput = document.querySelector('#quick-create-first-name')
        if (quickCreateInput) {
          quickCreateInput.focus()
        }
        break
      case 'search': {
        // Focus search input if available
        const searchInput = document.querySelector('input[placeholder*="Search"]')
        if (searchInput) {
          searchInput.focus()
        }
        break
      }
      case 'escape':
        // No modal to close, maybe clear selection instead
        if (selectedBooking) {
          setSelectedBooking(null)
          setCurrentView('list')
        }
        break
      case 'today':
        // This would trigger calendar to go to today - implemented in calendar component
        break
      case 'previous-period':
      case 'next-period':
      case 'day-view':
      case 'week-view':
      case 'month-view':
        // These would be handled by the calendar component
        break
      default:
        break
    }
  }

  const handleSectionChange = (section) => {
    setActiveSection(section)
    if (section !== 'bookings') {
      setSelectedBooking(null)
      setCurrentView('list')
    }
  }

  const handleBookingPanelSave = (booking) => {
    console.log('Booking panel save:', booking)
    // Here you would update the booking in your state/database
  }

  const handleBookingPanelDelete = (bookingId) => {
    console.log('Booking panel delete:', bookingId)
    // Here you would delete the booking and navigate back to list
    handleBackToList()
  }

  // Navigation handlers for breadcrumb
  const handleSeascapeNavigation = () => {
    // Navigate to main dashboard
    setActiveSection('dashboard')
    setSelectedBooking(null)
    setCurrentView('list')
  }

  const handleBookingManagementNavigation = () => {
    // Navigate back to bookings list
    setActiveSection('bookings')
    setSelectedBooking(null)
    setCurrentView('list')
  }

  const renderMainContent = () => {
    switch (activeSection) {
      case 'bookings':
        if (currentView === 'panel' && selectedBooking) {
          return (
            <BookingPanel 
              booking={selectedBooking}
              onSave={handleBookingPanelSave}
              onDelete={handleBookingPanelDelete}
              onBack={handleBackToList}
              onSeascapeClick={handleSeascapeNavigation}
              onBookingManagementClick={handleBookingManagementNavigation}
            />
          )
        }
        return <BookingsList onSelectBooking={handleSelectBooking} />
      case 'settings':
        return <Settings onSeascapeClick={handleSeascapeNavigation} onBack={() => setActiveSection('dashboard')} />
      case 'dashboard':
      default:
        return (
          <div className="flex flex-1 overflow-hidden h-full w-full">
            {/* Left Widgets - Constrained to avoid calendar overlap */}
            <aside className="w-[40vw] p-4 overflow-y-auto overflow-x-hidden border-r h-full flex-shrink-0" style={{ 
              backgroundColor: 'var(--color-ios-bg-grouped)', 
              borderColor: 'var(--color-ios-gray-3)' 
            }}>
              <SitRepSection />
              <CreateBookingSection 
                onCreateBooking={handleQuickCreateBooking} 
                prefilledData={quickCreateData}
              />
            </aside>

            {/* Calendar - Fixed to viewport */}
            <main className="calendar-container-fixed p-4 flex flex-col overflow-hidden flex-1 h-full min-w-0 -ml-4 -mr-4" style={{ 
              backgroundColor: 'var(--color-ios-bg-secondary)' 
            }}>
              <YachtTimelineCalendar />
            </main>
          </div>
        )
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden" data-testid="main-dashboard" style={{ backgroundColor: 'var(--color-ios-bg-secondary)' }}>
      {/* Fixed Sidebar */}
      <Sidebar 
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />
      
      {/* Main content area - Offset by sidebar width */}
      <div className="ml-12 h-screen w-full flex flex-col">
        <Navigation />
        
        {/* Content with top padding for fixed header - Fill remaining space */}
        <div className="pt-16 flex-1 flex flex-col w-full h-full">
          {renderMainContent()}
        </div>
      </div>

      {/* Undo Manager */}
      <UndoManager />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts onAction={handleKeyboardAction} />
    </div>
  )
}

// Main wrapper component that provides the BookingContext
function MainDashboard() {
  // Initial bookings data - clean start
  const initialBookings = []

  return (
    <BookingProvider initialBookings={initialBookings}>
      <MainDashboardInner />
    </BookingProvider>
  )
}

export default MainDashboard