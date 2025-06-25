import { useState } from 'react'

function BookingPanel({ booking, onSave, onDelete, onBack }) {
  const [formData, setFormData] = useState({
    yacht: booking?.yacht || '',
    tripType: booking?.tripType || 'Charter',
    startDate: booking?.startDate || '',
    endDate: booking?.endDate || '',
    portOfDeparture: booking?.portOfDeparture || '',
    portOfArrival: booking?.portOfArrival || '',
    firstName: booking?.firstName || '',
    surname: booking?.surname || '',
    email: booking?.email || '',
    phone: booking?.phone || '',
    // Address fields
    street: booking?.address?.street || '',
    city: booking?.address?.city || '',
    postcode: booking?.address?.postcode || '',
    country: booking?.address?.country || '',
    // Crew experience
    crewExperience: booking?.crewExperience || '',
    crewDetails: booking?.crewDetails || ''
  })

  const [statusData, setStatusData] = useState({
    bookingConfirmed: booking?.status?.bookingConfirmed || false,
    depositPaid: booking?.status?.depositPaid || false,
    contractSent: booking?.status?.contractSent || false,
    contractSigned: booking?.status?.contractSigned || false,
    depositInvoiceSent: booking?.status?.depositInvoiceSent || false,
    receiptIssued: booking?.status?.receiptIssued || false
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStatusChange = (field) => {
    setStatusData(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleSave = () => {
    const updatedBooking = {
      ...booking,
      ...formData,
      address: {
        street: formData.street,
        city: formData.city,
        postcode: formData.postcode,
        country: formData.country
      },
      status: statusData
    }
    
    if (onSave) {
      onSave(updatedBooking)
    }
  }

  const handleDelete = () => {
    if (onDelete && booking) {
      onDelete(booking.id)
    }
  }

  const generateDocument = (type) => {
    console.log(`Generating ${type} document for booking ${booking?.id}`)
    // Mock implementation
  }

  return (
    <div className="h-full bg-gray-900 text-white overflow-y-auto">
      {/* Header */}
      <div className="bg-blue-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold">Seascape - Booking Panel</h1>
          </div>
          <div className="text-sm">Nav ↓</div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Booking Form */}
          <div className="space-y-6">
            {/* Yacht and Trip Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Yacht *</label>
                <select 
                  value={formData.yacht}
                  onChange={(e) => handleInputChange('yacht', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select a yacht</option>
                  <option value="Serenity">Serenity</option>
                  <option value="Atlantis">Atlantis</option>
                  <option value="Poseidon">Poseidon</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Trip Type</label>
                <select 
                  value={formData.tripType}
                  onChange={(e) => handleInputChange('tripType', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="Charter">Charter</option>
                  <option value="Day Trip">Day Trip</option>
                  <option value="Corporate">Corporate</option>
                </select>
              </div>
            </div>

            {/* Dates and Ports */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                />
                <div className="text-sm text-gray-400 mt-1">Port of Departure</div>
                <input
                  type="text"
                  value={formData.portOfDeparture}
                  onChange={(e) => handleInputChange('portOfDeparture', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500 mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                />
                <div className="text-sm text-gray-400 mt-1">Port of Arrival</div>
                <input
                  type="text"
                  value={formData.portOfArrival}
                  onChange={(e) => handleInputChange('portOfArrival', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500 mt-1"
                />
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="First name"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Surname *</label>
                <input
                  type="text"
                  value={formData.surname}
                  onChange={(e) => handleInputChange('surname', e.target.value)}
                  placeholder="Surname"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="customer@email.com"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+44 7XXX XXXXXX"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Address Entry Fields */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Address Entry</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  placeholder="Street Address"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="City"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={formData.postcode}
                    onChange={(e) => handleInputChange('postcode', e.target.value)}
                    placeholder="Postcode"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Country"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Crew Experience */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Crew Experience</h3>
              <div className="space-y-3">
                <select
                  value={formData.crewExperience}
                  onChange={(e) => handleInputChange('crewExperience', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select experience level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Professional">Professional</option>
                </select>
                <textarea
                  value={formData.crewDetails}
                  onChange={(e) => handleInputChange('crewDetails', e.target.value)}
                  placeholder="Additional crew details and requirements..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Status and Actions */}
          <div className="space-y-6">
            {/* Status Toggles */}
            <div className="space-y-3">
              {[
                { key: 'bookingConfirmed', label: 'Booking Confirmed', icon: '✓' },
                { key: 'depositPaid', label: 'Deposit Paid', icon: '💰' },
                { key: 'contractSent', label: 'Contract Sent', icon: '📄' },
                { key: 'contractSigned', label: 'Contract Signed', icon: '✍️' },
                { key: 'depositInvoiceSent', label: 'Deposit Invoice Sent', icon: '📧' },
                { key: 'receiptIssued', label: 'Receipt Issued', icon: '🧾' }
              ].map(status => (
                <div
                  key={status.key}
                  onClick={() => handleStatusChange(status.key)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                    statusData[status.key]
                      ? 'bg-green-900/30 border-green-600 text-green-300'
                      : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg">{status.icon}</span>
                  <span className="font-medium">{status.label}</span>
                  <div className="ml-auto">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      statusData[status.key] ? 'bg-green-600 border-green-600' : 'border-gray-500'
                    }`}>
                      {statusData[status.key] && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Auto-Create Documents */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Auto-Create Documents</h3>
              <div className="space-y-2">
                {[
                  'Contract',
                  'Deposit Invoice',
                  'Deposit Receipt',
                  'Remaining Balance Invoice',
                  'Remaining Balance Receipt',
                  'Hand-over Notes'
                ].map(docType => (
                  <button
                    key={docType}
                    onClick={() => generateDocument(docType)}
                    className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    <span className="text-sm">- {docType}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Update & Delete Buttons */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Actions</h3>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Update Booking
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Delete Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingPanel