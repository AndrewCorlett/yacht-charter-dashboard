import { useState } from 'react'
import { BookingStatus } from '../../models/core/BookingModel'
import { useBookings } from '../../contexts/BookingContext'

function BookingsList({ onSelectBooking }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Get real bookings data from context
  const { bookings, loading, error } = useBookings()

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'full_payment':
        return 'text-green-400 bg-green-400/10'
      case 'deposit_paid':
        return 'text-blue-400 bg-blue-400/10'
      case 'pending':
        return 'text-orange-400 bg-orange-400/10'
      case 'refunded':
        return 'text-gray-400 bg-gray-400/10'
      default:
        return 'text-orange-400 bg-orange-400/10'
    }
  }

  const getPaymentStatusText = (booking) => {
    // Calculate payment status based on flags
    if (booking.final_payment_paid) {
      return 'Full Payment'
    } else if (booking.deposit_paid) {
      return 'Deposit Paid'
    } else {
      return 'Tentative'
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = activeFilter === 'all' || booking.status === activeFilter
    const matchesSearch = (booking.customer_name || booking.guest_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (booking.yacht_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (booking.booking_number || booking.id || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleRowClick = (booking) => {
    if (onSelectBooking) {
      onSelectBooking(booking)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div>Loading bookings...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-red-400 mb-2">Error loading bookings</div>
          <div className="text-sm text-gray-400">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white pr-6">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-semibold mb-4">Bookings Management ({bookings.length} total)</h1>
        
        {/* Search and Filter */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All Bookings' },
            { key: 'pending', label: 'Pending' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'completed', label: 'Completed' }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === filter.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-0">
          {/* Header Row */}
          <div className="grid grid-cols-8 gap-4 p-4 bg-gray-800 border-b border-gray-700 text-sm font-medium text-gray-400 sticky top-0">
            <div>Booking #</div>
            <div>Customer</div>
            <div>Yacht</div>
            <div>Dates</div>
            <div>Status</div>
            <div>Value</div>
            <div>Progress</div>
            <div>Modified</div>
          </div>

          {/* Data Rows */}
          {filteredBookings.map((booking) => {
            const bookingNumber = booking.booking_number || booking.id || 'N/A'
            const customerName = booking.customer_name || booking.guest_name || 'N/A'
            const customerEmail = booking.customer_email || booking.guest_email || 'N/A'
            const yachtName = booking.yacht_name || 'N/A'
            const startDate = booking.start_date ? new Date(booking.start_date).toLocaleDateString() : 'N/A'
            const endDate = booking.end_date ? new Date(booking.end_date).toLocaleDateString() : 'N/A'
            const paymentStatusText = getPaymentStatusText(booking)
            const paymentStatus = booking.final_payment_paid ? 'full_payment' : 
                                 booking.deposit_paid ? 'deposit_paid' : 'pending'
            const totalValue = booking.total_cost || booking.total_value || 0
            const lastModified = booking.updated_at ? new Date(booking.updated_at).toLocaleDateString() : 'N/A'
            
            return (
              <div
                key={booking.id}
                onClick={() => handleRowClick(booking)}
                className="grid grid-cols-8 gap-4 p-4 border-b border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <div className="font-medium text-blue-400">{bookingNumber}</div>
                <div>
                  <div className="font-medium">{customerName}</div>
                  <div className="text-sm text-gray-400">{customerEmail}</div>
                </div>
                <div className="font-medium">{yachtName}</div>
                <div className="text-sm">
                  <div>{startDate}</div>
                  <div className="text-gray-400">to {endDate}</div>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(paymentStatus)}`}>
                    {paymentStatusText}
                  </span>
                </div>
                <div className="font-medium">£{totalValue.toLocaleString()}</div>
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${booking.deposit_paid ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                    <span className="text-gray-400">Deposit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${booking.final_payment_paid ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                    <span className="text-gray-400">Full Payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${booking.contract_signed ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                    <span className="text-gray-400">Contract</span>
                  </div>
                </div>
                <div className="text-sm text-gray-400">{lastModified}</div>
              </div>
            )
          })}
        </div>

        {filteredBookings.length === 0 && (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <div className="text-lg mb-2">No bookings found</div>
              <div className="text-sm">Try adjusting your search or filter criteria</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingsList