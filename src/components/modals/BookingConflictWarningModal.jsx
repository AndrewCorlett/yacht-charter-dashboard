/**
 * Booking Conflict Warning Modal
 * 
 * Displays warnings when booking conflicts are detected, allowing operators
 * to see the conflicts and choose whether to proceed with the double booking.
 * 
 * @author AI Agent
 * @created 2025-07-06
 */

import { useState } from 'react'
import Modal from '../common/Modal'

function BookingConflictWarningModal({ 
  isOpen, 
  onClose, 
  onProceed, 
  conflictDetails,
  bookingData 
}) {
  const [userConfirmed, setUserConfirmed] = useState(false)

  if (!isOpen || !conflictDetails) return null

  const handleProceed = () => {
    onProceed(userConfirmed)
    onClose()
  }

  const handleCancel = () => {
    setUserConfirmed(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} size="large">
      <div className="booking-conflict-warning">
        {/* Header */}
        <div className="modal-header border-b border-red-200 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-lg">⚠️</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-red-800">
                {conflictDetails.title}
              </h2>
              <p className="text-sm text-red-600 mt-1">
                Double booking detected for this yacht
              </p>
            </div>
          </div>
        </div>

        {/* Conflict Details */}
        <div className="modal-body py-6 space-y-6">
          {/* Main warning message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">
              {conflictDetails.message}
            </p>
          </div>

          {/* New booking summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-3">New Booking Details:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Customer:</span>
                <span className="ml-2 text-blue-900">
                  {bookingData?.firstName} {bookingData?.surname}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-700">Dates:</span>
                <span className="ml-2 text-blue-900">
                  {bookingData?.startDate} to {bookingData?.endDate}
                </span>
              </div>
            </div>
          </div>

          {/* Conflicting bookings */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              Conflicting Booking{conflictDetails.conflictCount > 1 ? 's' : ''}:
            </h3>
            <div className="space-y-3">
              {conflictDetails.conflictingBookings.map((conflict, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded p-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Booking:</span>
                      <span className="ml-2 text-gray-900">{conflict.bookingNumber}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Customer:</span>
                      <span className="ml-2 text-gray-900">{conflict.customerName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Dates:</span>
                      <span className="ml-2 text-gray-900">{conflict.dateRange}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      conflict.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {conflict.status.charAt(0).toUpperCase() + conflict.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overlapping dates */}
          {conflictDetails.overlappingDates.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-3">Overlapping Dates:</h3>
              <div className="space-y-2">
                {conflictDetails.overlappingDates.map((overlap, index) => (
                  <div key={index} className="text-sm text-orange-900">
                    <span className="font-medium">{overlap.startDate} to {overlap.endDate}</span>
                    <span className="ml-2 text-orange-700">
                      (conflicts with {overlap.conflictWith})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirmation checkbox */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="conflict-confirmation"
                checked={userConfirmed}
                onChange={(e) => setUserConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500"
              />
              <label htmlFor="conflict-confirmation" className="text-sm text-yellow-800">
                <span className="font-medium">I understand this will create a double booking.</span>
                <br />
                {conflictDetails.actionMessage}
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer border-t border-gray-200 pt-4 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            disabled={!userConfirmed}
            className={`px-4 py-2 text-sm font-medium rounded-md focus:ring-2 focus:ring-red-500 ${
              userConfirmed
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-red-300 text-red-100 cursor-not-allowed'
            }`}
          >
            Proceed with Double Booking
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default BookingConflictWarningModal