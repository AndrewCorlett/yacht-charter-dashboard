/**
 * Main Dashboard Component
 * 
 * Purpose: Main layout with sidebar and calendar
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

import { useState } from 'react'
import Navigation from '../Layout/Navigation'
import Sidebar from '../Layout/Sidebar'
import SitRepSection from './SitRepSection'
import YachtTimelineCalendar from '../calendar/YachtTimelineCalendar'
import BookingFormModal from '../modals/BookingFormModal'
import { CreateBookingSection } from '../booking'
import AdminConfigPage from '../admin/AdminConfigPage'
import BookingsList from '../booking/BookingsList'
import BookingPanel from '../booking/BookingPanel'
import { BookingModel, BookingStatus } from '../../models'
import { BookingProvider } from '../../contexts/BookingContext'
import UndoManager from '../common/UndoManager'
import KeyboardShortcuts from '../common/KeyboardShortcuts'

function MainDashboard() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedBookingForModal, setSelectedBookingForModal] = useState(null)
  const [prefilledData, setPrefilledData] = useState({})
  const [activeSection, setActiveSection] = useState('dashboard')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [currentView, setCurrentView] = useState('list') // 'list' or 'panel'
  
  // Initial mock bookings data for demonstration
  const initialBookings = [
    {
      id: '1',
      yacht_id: 'spectre',
      customer_name: 'John Smith',
      customer_email: 'john.smith@example.com',
      booking_no: 'BK2024001',
      trip_no: 'TR001',
      start_datetime: new Date(2025, 5, 10, 9, 0),
      end_datetime: new Date(2025, 5, 15, 17, 0),
      status: BookingStatus.CONFIRMED,
      summary: 'John Smith - Spectre',
      total_value: 15000,
      deposit_amount: 3000
    },
    {
      id: '2',
      yacht_id: 'disk-drive',
      customer_name: 'Emily Johnson',
      customer_email: 'emily.johnson@example.com',
      booking_no: 'BK2024002',
      trip_no: 'TR002',
      start_datetime: new Date(2025, 5, 12, 10, 0),
      end_datetime: new Date(2025, 5, 18, 16, 0),
      status: BookingStatus.PENDING,
      summary: 'Emily Johnson - Disk Drive',
      total_value: 12000,
      deposit_amount: 2400
    },
    {
      id: '3',
      yacht_id: 'arriva',
      customer_name: 'Cardiff Yacht Club',
      customer_email: 'events@cardiffyc.com',
      booking_no: 'BK2024003',
      trip_no: 'TR003',
      start_datetime: new Date(2025, 5, 20, 8, 0),
      end_datetime: new Date(2025, 5, 25, 18, 0),
      status: BookingStatus.CONFIRMED,
      type: 'owner',
      summary: 'Cardiff Yacht Club - Arriva',
      total_value: 0
    }
  ].map(b => new BookingModel(b))

  const handleCreateBooking = (data) => {
    setSelectedBookingForModal(null) // null for create mode
    setPrefilledData(data)
    setIsBookingModalOpen(true)
  }

  const handleEditBooking = (booking) => {
    setSelectedBookingForModal(booking) // booking for edit mode
    setPrefilledData({})
    setIsBookingModalOpen(true)
  }

  const handleSelectBooking = (booking) => {
    setSelectedBooking(booking)
    setCurrentView('panel')
  }

  const handleBackToList = () => {
    setSelectedBooking(null)
    setCurrentView('list')
  }

  const handleCloseModal = () => {
    setIsBookingModalOpen(false)
    setSelectedBookingForModal(null)
    setPrefilledData({})
  }

  const handleBookingSaved = (booking) => {
    console.log('Booking saved:', booking)
    // Additional success handling if needed
  }

  const handleBookingDeleted = (bookingId) => {
    console.log('Booking deleted:', bookingId)
    // Additional cleanup if needed
  }

  const handleKeyboardAction = (action) => {
    switch (action) {
      case 'create-booking':
        handleCreateBooking({})
        break
      case 'search':
        // Focus search input if available
        const searchInput = document.querySelector('input[placeholder*="Search"]')
        if (searchInput) {
          searchInput.focus()
        }
        break
      case 'escape':
        if (isBookingModalOpen) {
          handleCloseModal()
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
      case 'admin':
        return <AdminConfigPage />
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
      case 'dashboard':
      default:
        return (
          <div className="flex flex-1 overflow-x-hidden">
            {/* Left Widgets - Constrained to avoid calendar overlap */}
            <aside className="w-[calc(50vw-3rem)] p-4 overflow-y-auto overflow-x-hidden border-r" style={{ 
              backgroundColor: 'var(--color-ios-bg-grouped)', 
              borderColor: 'var(--color-ios-gray-3)' 
            }}>
              <SitRepSection />
              <CreateBookingSection onCreateBooking={handleCreateBooking} />
            </aside>

            {/* Calendar - Fixed to viewport */}
            <main className="calendar-container-fixed p-6 flex flex-col overflow-x-hidden" style={{ 
              backgroundColor: 'var(--color-ios-bg-secondary)' 
            }}>
              <YachtTimelineCalendar 
                onCreateBooking={handleCreateBooking}
                onEditBooking={handleEditBooking}
              />
            </main>
          </div>
        )
    }
  }

  return (
    <BookingProvider initialBookings={initialBookings}>
      <div className="min-h-screen" data-testid="main-dashboard" style={{ backgroundColor: 'var(--color-ios-bg-secondary)' }}>
        {/* Fixed Sidebar */}
        <Sidebar 
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
        
        {/* Main content area - Offset by sidebar width */}
        <div className="ml-12 min-h-screen flex flex-col">
          <Navigation />
          
          {/* Content with top padding for fixed header */}
          <div className="pt-16">
            {renderMainContent()}
          </div>
        </div>

        {/* Booking Form Modal */}
        <BookingFormModal
          isOpen={isBookingModalOpen}
          onClose={handleCloseModal}
          booking={selectedBookingForModal}
          prefilledData={prefilledData}
          onSave={handleBookingSaved}
          onDelete={handleBookingDeleted}
        />

        {/* Undo Manager */}
        <UndoManager />

        {/* Keyboard Shortcuts */}
        <KeyboardShortcuts onAction={handleKeyboardAction} />
      </div>
    </BookingProvider>
  )
}

export default MainDashboard