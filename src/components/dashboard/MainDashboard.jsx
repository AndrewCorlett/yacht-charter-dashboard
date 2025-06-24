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
            {/* Sidebar - Takes remaining 60% */}
            <aside className="flex-1 p-4 overflow-y-auto overflow-x-hidden border-r" style={{ 
              backgroundColor: 'var(--color-ios-bg-grouped)', 
              borderColor: 'var(--color-ios-gray-3)' 
            }}>
              <SitRepSection />
              <CreateBookingSection onCreateBooking={handleCreateBooking} />
            </aside>

            {/* Main Content - Fixed 40% of viewport */}
            <main className="w-[40vw] p-6 flex flex-col overflow-x-hidden" style={{ 
              backgroundColor: 'var(--color-ios-bg-secondary)' 
            }}>
              <YachtTimelineCalendar onCreateBooking={handleCreateBooking} />
            </main>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-ios-bg-secondary)' }}>
      {/* Sidebar - Fixed width, no overlay */}
      <Sidebar 
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />
      
      {/* Main content area - Takes remaining space */}
      <div className="flex-1 min-h-screen flex flex-col">
        <Navigation />
        
        {renderMainContent()}
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