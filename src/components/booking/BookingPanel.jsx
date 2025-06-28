import { useState } from 'react'
import BreadcrumbHeader from '../common/BreadcrumbHeader'
import UnsavedChangesModal from '../common/UnsavedChangesModal'
import FileUpload from '../common/FileUpload'
import DocumentGenerationModal from '../modals/DocumentGenerationModal'
import PartialDownloadWarningModal from '../modals/PartialDownloadWarningModal'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges'
import { useBookingOperations } from '../../contexts/BookingContext'
import { BookingModel } from '../../models'

function BookingPanel({ booking, onSave, onDelete, onBack, onSeascapeClick, onBookingManagementClick }) {
  // Get booking operations from context
  const { updateBooking: updateBookingInContext, deleteBooking: deleteBookingInContext } = useBookingOperations()
  
  // Transform booking data from database format to frontend format
  const bookingData = booking?.toFrontend ? booking.toFrontend() : (booking ? BookingModel.fromDatabase(booking).toFrontend() : {})
  
  const [formData, setFormData] = useState({
    yacht: bookingData.yacht || '',
    tripType: bookingData.tripType || 'bareboat',
    startDate: bookingData.startDate || '',
    endDate: bookingData.endDate || '',
    portOfDeparture: bookingData.portOfDeparture || '',
    portOfArrival: bookingData.portOfArrival || '',
    firstName: bookingData.firstName || '',
    surname: bookingData.surname || '',
    email: bookingData.email || '',
    phone: bookingData.phone || '',
    // Address fields
    street: bookingData.street || '',
    city: bookingData.city || '',
    postcode: bookingData.postcode || '',
    country: bookingData.country || '',
    // Crew experience file
    crewExperienceFile: bookingData.crewExperienceFile || null
  })

  const [statusData, setStatusData] = useState({
    bookingConfirmed: bookingData.status?.bookingConfirmed || false,
    depositPaid: bookingData.status?.depositPaid || false,
    finalPaymentPaid: bookingData.status?.finalPaymentPaid || false,
    contractSent: bookingData.status?.contractSent || false,
    contractSigned: bookingData.status?.contractSigned || false,
    depositInvoiceSent: bookingData.status?.depositInvoiceSent || false,
    receiptIssued: bookingData.status?.receiptIssued || false
  })

  // Document generation state - use data from booking if available
  const [documentStates, setDocumentStates] = useState(
    bookingData.documentStates || {
      'Contract': { generated: false, downloaded: false, updated: false },
      'Deposit Invoice': { generated: false, downloaded: false, updated: false },
      'Deposit Receipt': { generated: false, downloaded: false, updated: false },
      'Remaining Balance Invoice': { generated: false, downloaded: false, updated: false },
      'Remaining Balance Receipt': { generated: false, downloaded: false, updated: false },
      'Hand-over Notes': { generated: false, downloaded: false, updated: false }
    }
  )

  // Modal states
  const [documentModal, setDocumentModal] = useState({ isOpen: false, documentType: null })
  const [partialDownloadModal, setPartialDownloadModal] = useState({ isOpen: false, missingDocuments: [] })
  const [lastBulkDownload, setLastBulkDownload] = useState(null)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (fileInfo) => {
    setFormData(prev => ({
      ...prev,
      crewExperienceFile: fileInfo
    }))
  }

  const handleStatusChange = (field) => {
    setStatusData(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  // Unsaved changes tracking
  const {
    isDirty,
    showUnsavedModal,
    handleNavigation,
    handleSaveAndGo,
    handleDiscardAndGo,
    handleCancel,
    resetDirtyState
  } = useUnsavedChanges(formData, statusData, bookingData)

  const handleSave = async () => {
    try {
      // Create updated booking data in frontend format
      const updatedBookingData = {
        ...bookingData,
        ...formData,
        status: statusData
      }
      
      if (bookingData.id) {
        // Update existing booking through context
        await updateBookingInContext(bookingData.id, updatedBookingData)
        resetDirtyState()
      }
      
      // Also call the parent onSave if provided for UI updates
      if (onSave) {
        onSave(updatedBookingData)
      }
    } catch (error) {
      console.error('Failed to save booking:', error)
      // Error is handled by the context
    }
  }

  const handleDelete = async () => {
    if (bookingData.id) {
      try {
        // Delete through context
        await deleteBookingInContext(bookingData.id)
        
        // Call parent onDelete for UI updates (e.g., navigate away)
        if (onDelete) {
          onDelete(bookingData.id)
        }
      } catch (error) {
        console.error('Failed to delete booking:', error)
        // Error is handled by the context
      }
    }
  }

  // Navigation handlers that check for unsaved changes
  const handleBackNavigation = () => {
    handleNavigation(() => onBack())
  }

  const handleSeascapeNavigation = () => {
    handleNavigation(() => onSeascapeClick && onSeascapeClick())
  }

  const handleBookingManagementNavigation = () => {
    handleNavigation(() => onBookingManagementClick && onBookingManagementClick())
  }

  // Document generation functions
  const handleGenerateDocument = (documentType) => {
    setDocumentModal({ isOpen: true, documentType })
  }

  const handleDocumentGenerated = (documentType) => {
    setDocumentStates(prev => ({
      ...prev,
      [documentType]: {
        ...prev[documentType],
        generated: true,
        updated: lastBulkDownload ? new Date() > lastBulkDownload : false
      }
    }))
  }

  const handleDownloadDocument = (documentType) => {
    // Mock download implementation
    console.log(`Downloading ${documentType} for booking ${bookingData?.id}`)
    
    setDocumentStates(prev => ({
      ...prev,
      [documentType]: {
        ...prev[documentType],
        downloaded: true,
        updated: false
      }
    }))
    
    // Mock file download
    const element = document.createElement('a')
    element.href = `data:text/plain;charset=utf-8,Mock ${documentType} content for booking ${bookingData?.id}`
    element.download = `${documentType.replace(/\s+/g, '_')}_Booking_${bookingData?.id}.pdf`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleDownloadAll = () => {
    const allDocumentTypes = Object.keys(documentStates)
    const generatedDocuments = allDocumentTypes.filter(type => documentStates[type].generated)
    const missingDocuments = allDocumentTypes.filter(type => !documentStates[type].generated)
    
    if (missingDocuments.length > 0) {
      setPartialDownloadModal({ isOpen: true, missingDocuments })
    } else {
      performBulkDownload(generatedDocuments)
    }
  }

  const performBulkDownload = (documentsToDownload) => {
    console.log(`Bulk downloading documents:`, documentsToDownload)
    
    // Update all documents as downloaded
    const updatedStates = { ...documentStates }
    documentsToDownload.forEach(docType => {
      updatedStates[docType] = {
        ...updatedStates[docType],
        downloaded: true,
        updated: false
      }
    })
    setDocumentStates(updatedStates)
    setLastBulkDownload(new Date())
    
    // Mock zip file download
    const element = document.createElement('a')
    const zipContent = documentsToDownload.map(doc => `${doc} content`).join('\n\n')
    element.href = `data:application/zip;charset=utf-8,${encodeURIComponent(zipContent)}`
    element.download = `Booking_${bookingData?.id}_Documents.zip`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handlePartialDownloadAnyway = () => {
    const generatedDocuments = Object.keys(documentStates).filter(type => documentStates[type].generated)
    performBulkDownload(generatedDocuments)
    setPartialDownloadModal({ isOpen: false, missingDocuments: [] })
  }

  const handlePartialDownloadCancel = () => {
    setPartialDownloadModal({ isOpen: false, missingDocuments: [] })
  }

  const getDocumentStatusIcon = (documentType) => {
    const state = documentStates[documentType]
    if (!state.generated) return null
    if (state.updated) return '!'
    return '✓'
  }


  return (
    <div className="h-full bg-gray-900 text-white overflow-y-auto">
      {/* Header with Breadcrumb Navigation */}
      <BreadcrumbHeader
        bookingNumber={bookingData?.bookingNumber || bookingData?.id}
        onSeascapeClick={handleSeascapeNavigation}
        onBookingManagementClick={handleBookingManagementNavigation}
        onBack={handleBackNavigation}
      />

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
                  <option value="bareboat">bareboat</option>
                  <option value="skippered charter">skippered charter</option>
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
              <h3 className="text-lg font-medium mb-4">Address Entry - Charterer</h3>
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

            {/* Crew Experience File Upload */}
            <FileUpload
              title="Crew Experience"
              description="Upload crew experience document (PDF or Word)"
              acceptedTypes=".pdf,.doc,.docx"
              maxSize={10 * 1024 * 1024} // 10MB
              onFileUpload={handleFileUpload}
              currentFile={formData.crewExperienceFile}
            />
          </div>

          {/* Right Column - Status and Actions */}
          <div className="space-y-6">
            {/* Status Toggles */}
            <div className="space-y-3">
              {[
                { key: 'bookingConfirmed', label: 'Booking Confirmed', icon: '✓' },
                { key: 'depositPaid', label: 'Deposit Paid', icon: '💰' },
                { key: 'finalPaymentPaid', label: 'Full Payment Made', icon: '✅' },
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
                ].map(docType => {
                  const statusIcon = getDocumentStatusIcon(docType)
                  
                  return (
                    <div key={docType} className="flex items-center gap-2">
                      <button
                        onClick={() => handleGenerateDocument(docType)}
                        className="flex-1 text-left p-3 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                      >
                        <span className="text-sm">- {docType}</span>
                      </button>
                      <button
                        onClick={() => handleGenerateDocument(docType)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                      >
                        Generate
                      </button>
                      {statusIcon && (
                        <button
                          onClick={() => handleDownloadDocument(docType)}
                          className={`w-8 h-8 rounded border-2 flex items-center justify-center font-bold text-sm transition-colors ${
                            statusIcon === '!' 
                              ? 'border-orange-400 bg-orange-400/20 text-orange-400 hover:bg-orange-400/30' 
                              : 'border-green-400 bg-green-400/20 text-green-400 hover:bg-green-400/30'
                          }`}
                          title={statusIcon === '!' ? 'Document updated - click to download' : 'Document generated - click to download'}
                        >
                          {statusIcon}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {/* Download All Button */}
              <div className="mt-4 pt-4 border-t border-gray-600">
                <button
                  onClick={handleDownloadAll}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download All Files
                </button>
              </div>
            </div>

            {/* Update & Delete Buttons */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Actions</h3>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className={`flex-1 font-medium py-2 px-4 rounded transition-colors ${
                    isDirty 
                      ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isDirty ? 'Save Changes' : 'Update Booking'}
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

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onSaveAndGo={() => handleSaveAndGo(handleSave)}
        onDiscardAndGo={handleDiscardAndGo}
        onCancel={handleCancel}
      />

      {/* Document Generation Modal */}
      <DocumentGenerationModal
        isOpen={documentModal.isOpen}
        onClose={() => setDocumentModal({ isOpen: false, documentType: null })}
        documentType={documentModal.documentType}
        onDownload={(docType) => {
          handleDocumentGenerated(docType)
          handleDownloadDocument(docType)
        }}
        onNotNow={(docType) => {
          handleDocumentGenerated(docType)
          console.log(`Document ${docType} generated but not downloaded`)
        }}
      />

      {/* Partial Download Warning Modal */}
      <PartialDownloadWarningModal
        isOpen={partialDownloadModal.isOpen}
        onClose={() => setPartialDownloadModal({ isOpen: false, missingDocuments: [] })}
        missingDocuments={partialDownloadModal.missingDocuments}
        onDownloadAnyway={handlePartialDownloadAnyway}
        onCancel={handlePartialDownloadCancel}
      />
    </div>
  )
}

export default BookingPanel