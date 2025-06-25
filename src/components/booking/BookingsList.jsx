import { useState } from 'react'
import { BookingStatus } from '../../models/core/BookingModel'

function BookingsList({ onSelectBooking }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Mock bookings data
  const mockBookings = [
    {
      id: 'BOOK001',
      bookingNo: 'BK2025001',
      yacht: 'Serenity',
      customer: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+44 7123 456789',
      startDate: '2025-07-01',
      endDate: '2025-07-08',
      status: 'confirmed',
      totalValue: 15000,
      depositPaid: true,
      contractSigned: true,
      lastModified: '2025-06-20'
    },
    {
      id: 'BOOK002',
      bookingNo: 'BK2025002',
      yacht: 'Atlantis',
      customer: 'Emily Johnson',
      email: 'emily.johnson@example.com',
      phone: '+44 7987 654321',
      startDate: '2025-07-15',
      endDate: '2025-07-22',
      status: 'pending',
      totalValue: 12000,
      depositPaid: false,
      contractSigned: false,
      lastModified: '2025-06-18'
    },
    {
      id: 'BOOK003',
      bookingNo: 'BK2025003',
      yacht: 'Poseidon',
      customer: 'Cardiff Yacht Club',
      email: 'events@cardiffyc.com',
      phone: '+44 29 2048 7000',
      startDate: '2025-08-01',
      endDate: '2025-08-05',
      status: 'completed',
      totalValue: 8000,
      depositPaid: true,
      contractSigned: true,
      lastModified: '2025-06-15'
    },
    {
      id: 'BOOK004',
      bookingNo: 'BK2025004',
      yacht: 'Serenity',
      customer: 'Michael Brown',
      email: 'michael.brown@example.com',
      phone: '+44 7555 123456',
      startDate: '2025-08-10',
      endDate: '2025-08-17',
      status: 'pending',
      totalValue: 18000,
      depositPaid: true,
      contractSigned: false,
      lastModified: '2025-06-22'
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-400 bg-green-400/10'
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10'
      case 'completed':
        return 'text-blue-400 bg-blue-400/10'
      default:
        return 'text-gray-400 bg-gray-400/10'
    }
  }

  const filteredBookings = mockBookings.filter(booking => {
    const matchesFilter = activeFilter === 'all' || booking.status === activeFilter
    const matchesSearch = booking.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.yacht.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.bookingNo.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleRowClick = (booking) => {
    if (onSelectBooking) {
      onSelectBooking(booking)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-semibold mb-4">Bookings Management</h1>
        
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
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              onClick={() => handleRowClick(booking)}
              className="grid grid-cols-8 gap-4 p-4 border-b border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors"
            >
              <div className="font-medium text-blue-400">{booking.bookingNo}</div>
              <div>
                <div className="font-medium">{booking.customer}</div>
                <div className="text-sm text-gray-400">{booking.email}</div>
              </div>
              <div className="font-medium">{booking.yacht}</div>
              <div className="text-sm">
                <div>{booking.startDate}</div>
                <div className="text-gray-400">to {booking.endDate}</div>
              </div>
              <div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
              <div className="font-medium">£{booking.totalValue.toLocaleString()}</div>
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${booking.depositPaid ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                  <span className="text-gray-400">Deposit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${booking.contractSigned ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                  <span className="text-gray-400">Contract</span>
                </div>
              </div>
              <div className="text-sm text-gray-400">{booking.lastModified}</div>
            </div>
          ))}
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