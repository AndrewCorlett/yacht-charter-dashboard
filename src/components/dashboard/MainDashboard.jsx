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

function MainDashboard() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedBookingData, setSelectedBookingData] = useState(null)
  const [activeSection, setActiveSection] = useState('dashboard')

  const handleCreateBooking = (data) => {
    setSelectedBookingData(data)
    setIsBookingModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsBookingModalOpen(false)
    setSelectedBookingData(null)
  }

  const handleSectionChange = (section) => {
    setActiveSection(section)
  }

  const renderMainContent = () => {
    switch (activeSection) {
      case 'admin':
        return <AdminConfigPage />
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
              <YachtTimelineCalendar onCreateBooking={handleCreateBooking} />
            </main>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-ios-bg-secondary)' }}>
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
        bookingData={selectedBookingData}
      />
    </div>
  )
}

export default MainDashboard