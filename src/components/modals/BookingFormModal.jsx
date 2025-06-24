/**
 * Booking Form Modal Component
 * 
 * Purpose: Modal for creating new bookings
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

import { useState } from 'react'
import Modal from '../common/Modal'
import { format } from 'date-fns'

function BookingFormModal({ isOpen, onClose, bookingData }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    surname: '',
    secondLine: '',
    email: '',
    phone: '',
    startDate: bookingData?.date ? format(bookingData.date, 'yyyy-MM-dd') : '',
    endDate: '',
    portOfDeparture: '',
    portOfArrival: '',
    bookingNo: '',
    customerNo: '',
    yacht: bookingData?.yachtId || 'TARGET CSV'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Booking submitted:', formData)
    onClose()
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Booking">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Yacht Selection */}
        <div className="bg-gray-900 text-white p-3 rounded-md text-center">
          {formData.yacht}
        </div>

        {/* Contact Details */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Flint details</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-blue-100 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="lastName"
              placeholder="First name"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-blue-100 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="surname"
              placeholder="Surname"
              value={formData.surname}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-blue-100 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="secondLine"
              placeholder="Second line"
              value={formData.secondLine}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-blue-100 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-blue-100 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-blue-100 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Address</h3>
          <textarea
            name="address"
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>

        {/* Booking Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start date
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-blue-100 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End date
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-blue-100 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Port of departure
            </label>
            <input
              type="text"
              name="portOfDeparture"
              value={formData.portOfDeparture}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-blue-100 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Port of arrival
            </label>
            <input
              type="text"
              name="portOfArrival"
              value={formData.portOfArrival}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-blue-100 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Booking Numbers */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Booking NO.
            </label>
            <input
              type="text"
              name="bookingNo"
              value={formData.bookingNo}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer NO.
            </label>
            <input
              type="text"
              name="customerNo"
              value={formData.customerNo}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 transition-colors"
        >
          Create Booking
        </button>
      </form>
    </Modal>
  )
}

export default BookingFormModal