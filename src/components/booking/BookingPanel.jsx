import { useState, useEffect } from 'react'
import BreadcrumbHeader from '../common/BreadcrumbHeader'
import UnsavedChangesModal from '../common/UnsavedChangesModal'
import FileUpload from '../common/FileUpload'
import DocumentGenerationModal from '../modals/DocumentGenerationModal'
import PartialDownloadWarningModal from '../modals/PartialDownloadWarningModal'
import BookingConflictWarningModal from '../modals/BookingConflictWarningModal'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges'
import { useBookingOperations } from '../../contexts/BookingContext'
import { BookingModel } from '../../models'
import yachtService from '../../services/supabase/YachtService'
import documentAutoGenerator from '../../services/supabase/DocumentAutoGenerator'
import BookingConflictService from '../../services/BookingConflictService'
import CharterCostSection from './CharterCostSection'
import BookingNumberEditor from './BookingNumberEditor'

function BookingPanel({ booking, onSave, onDelete, onBack, onSeascapeClick, onBookingManagementClick }) {
  // Get booking operations from context
  const { updateBooking: updateBookingInContext, deleteBooking: deleteBookingInContext } = useBookingOperations()
  
  // Transform booking data from database format to frontend format
  const initialBookingData = booking?.toFrontend ? booking.toFrontend() : (booking ? BookingModel.fromDatabase(booking).toFrontend() : {})
  
  // Local booking data state that can be updated
  const [bookingData, setBookingData] = useState(initialBookingData)
  
  const [formData, setFormData] = useState({
    yacht: initialBookingData.yacht || '',
    tripType: initialBookingData.tripType || 'bareboat',
    startDate: initialBookingData.startDate || '',
    endDate: initialBookingData.endDate || '',
    portOfDeparture: initialBookingData.portOfDeparture || '',
    portOfArrival: initialBookingData.portOfArrival || '',
    firstName: initialBookingData.firstName || '',
    surname: initialBookingData.surname || '',
    email: initialBookingData.email || '',
    phone: initialBookingData.phone || '',
    // Address fields
    street: initialBookingData.street || '',
    city: initialBookingData.city || '',
    postcode: initialBookingData.postcode || '',
    country: initialBookingData.country || '',
    // Crew experience file
    crewExperienceFile: initialBookingData.crewExperienceFile || null,
    // Charter cost data
    charterCost: initialBookingData.charterCost || 0,
    deposit: initialBookingData.deposit || 0,
    securityDeposit: initialBookingData.securityDeposit || 0
  })

  const [statusData, setStatusData] = useState({
    bookingConfirmed: initialBookingData.status?.bookingConfirmed || false,
    depositPaid: initialBookingData.status?.depositPaid || false,
    finalPaymentPaid: initialBookingData.status?.finalPaymentPaid || false,
    contractSent: initialBookingData.status?.contractSent || false,
    contractSigned: initialBookingData.status?.contractSigned || false,
    depositInvoiceSent: initialBookingData.status?.depositInvoiceSent || false,
    receiptIssued: initialBookingData.status?.receiptIssued || false
  })

  // Status date tracking
  const [statusDates, setStatusDates] = useState({
    bookingConfirmed: initialBookingData.bookingConfirmedAt || null,
    depositPaid: initialBookingData.depositPaidAt || null,
    finalPaymentPaid: initialBookingData.finalPaymentMadeAt || null,
    contractSent: initialBookingData.contractSentAt || null,
    contractSigned: initialBookingData.contractSignedAt || null,
    depositInvoiceSent: initialBookingData.depositInvoiceSentAt || null,
    receiptIssued: initialBookingData.receiptIssuedAt || null
  })
  

  // Date editing state
  const [editingDate, setEditingDate] = useState(null)

  // Update local booking data when prop changes
  useEffect(() => {
    const newBookingData = booking?.toFrontend ? booking.toFrontend() : (booking ? BookingModel.fromDatabase(booking).toFrontend() : {})
    setBookingData(newBookingData)
  }, [booking])

  // Update status dates when booking data changes
  useEffect(() => {
    setStatusDates({
      bookingConfirmed: bookingData.bookingConfirmedAt || null,
      depositPaid: bookingData.depositPaidAt || null,
      finalPaymentPaid: bookingData.finalPaymentMadeAt || null,
      contractSent: bookingData.contractSentAt || null,
      contractSigned: bookingData.contractSignedAt || null,
      depositInvoiceSent: bookingData.depositInvoiceSentAt || null,
      receiptIssued: bookingData.receiptIssuedAt || null
    })
  }, [bookingData.id, bookingData.bookingConfirmedAt, bookingData.depositPaidAt, bookingData.finalPaymentMadeAt, bookingData.contractSentAt, bookingData.contractSignedAt, bookingData.depositInvoiceSentAt, bookingData.receiptIssuedAt])

  // Document generation state - use data from booking if available
  const [documentStates, setDocumentStates] = useState(
    initialBookingData.documentStates || {
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
  const [conflictModal, setConflictModal] = useState({ isOpen: false, conflictDetails: null, pendingBookingData: null })
  const [lastBulkDownload, setLastBulkDownload] = useState(null)
  
  // Document generation state
  const [generatingDocument, setGeneratingDocument] = useState(null)
  const [generationError, setGenerationError] = useState(null)

  // Yacht data state for database-driven dropdown
  const [yachts, setYachts] = useState([])
  const [loadingYachts, setLoadingYachts] = useState(true)

  // Load yachts from database
  useEffect(() => {
    const loadYachts = async () => {
      try {
        setLoadingYachts(true)
        const yachtData = await yachtService.getYachts()
        setYachts(yachtData)
      } catch (error) {
        console.error('Failed to load yachts:', error)
        setYachts([])
      } finally {
        setLoadingYachts(false)
      }
    }

    loadYachts()
  }, [])

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

  const handleCharterCostChange = (costs) => {
    setFormData(prev => ({
      ...prev,
      charterCost: costs.charterCost,
      deposit: costs.deposit,
      securityDeposit: costs.securityDeposit
    }))
  }

  const handleStatusChange = (field) => {
    const newValue = !statusData[field]
    setStatusData(prev => ({
      ...prev,
      [field]: newValue
    }))
    
    // Update the date when toggling on, clear when toggling off
    setStatusDates(prev => ({
      ...prev,
      [field]: newValue ? new Date().toISOString() : null
    }))
  }

  const handleDateChange = (field, dateValue) => {
    setStatusDates(prev => ({
      ...prev,
      [field]: dateValue
    }))
  }

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    }) + ' ' + date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
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
  } = useUnsavedChanges({ ...formData, statusData, statusDates }, statusData, bookingData)

  const handleSave = async (skipConflictCheck = false) => {
    try {
      // Find the selected yacht to get both ID and name
      const selectedYacht = yachts.find(y => y.id === formData.yacht)
      
      // Create updated booking data in frontend format
      // Flatten statusData object into individual fields to match database schema
      const updatedBookingData = {
        ...bookingData,
        ...formData,
        // Include both yacht ID and yacht name for proper database storage
        yacht: formData.yacht, // yacht ID is already in formData.yacht
        yachtName: selectedYacht ? selectedYacht.name : '', // Include yacht name for caching
        // Flatten status fields instead of nesting them
        bookingConfirmed: statusData.bookingConfirmed,
        depositPaid: statusData.depositPaid,
        finalPaymentPaid: statusData.finalPaymentPaid,
        contractSent: statusData.contractSent,
        contractSigned: statusData.contractSigned,
        depositInvoiceSent: statusData.depositInvoiceSent,
        receiptIssued: statusData.receiptIssued,
        // Add status date fields
        bookingConfirmedAt: statusDates.bookingConfirmed,
        depositPaidAt: statusDates.depositPaid,
        finalPaymentMadeAt: statusDates.finalPaymentPaid,
        contractSentAt: statusDates.contractSent,
        contractSignedAt: statusDates.contractSigned,
        depositInvoiceSentAt: statusDates.depositInvoiceSent,
        receiptIssuedAt: statusDates.receiptIssued,
        // Keep the nested status for frontend compatibility
        status: statusData
      }

      // Check for conflicts before saving (unless skipping)
      if (!skipConflictCheck && formData.yacht && formData.startDate && formData.endDate) {
        const conflictResult = await BookingConflictService.checkDatabaseConflicts({
          yacht_id: formData.yacht,
          start_date: formData.startDate,
          end_date: formData.endDate
        }, bookingData.id) // Exclude current booking if updating

        if (conflictResult.hasConflicts) {
          // Show conflict warning modal
          setConflictModal({
            isOpen: true,
            conflictDetails: conflictResult.warningDetails,
            pendingBookingData: updatedBookingData
          })
          return // Don't proceed with save until user confirms
        }
      }
      
      // Proceed with save
      await performSave(updatedBookingData)
      
    } catch (error) {
      console.error('Failed to save booking:', error)
      // Error is handled by the context
    }
  }

  const performSave = async (updatedBookingData) => {
    if (bookingData.id) {
      // Update existing booking through context
      await updateBookingInContext(bookingData.id, updatedBookingData)
      resetDirtyState()
    }
    
    // Also call the parent onSave if provided for UI updates
    if (onSave) {
      onSave(updatedBookingData)
    }
  }

  const handleConflictProceed = (userConfirmed) => {
    if (userConfirmed && conflictModal.pendingBookingData) {
      performSave(conflictModal.pendingBookingData)
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

  const handleBookingNumberUpdate = async (updatedBooking) => {
    try {
      // Note: updateBookingNumber already updates the database directly
      // We don't need to call updateBookingInContext again as it would cause schema issues
      
      // Update local booking data for immediate UI refresh
      const updatedFrontendData = updatedBooking.toFrontend()
      setBookingData(updatedFrontendData)
      
      // Call parent onSave if provided for UI updates
      if (onSave) {
        onSave(updatedFrontendData)
      }
    } catch (error) {
      console.error('Failed to update booking number:', error)
    }
  }

  // Helper functions for document generation
  const getTemplateType = (documentType) => {
    const mapping = {
      'Contract': 'contract',
      'Deposit Invoice': 'depositInvoice',
      'Deposit Receipt': 'depositReceipt',
      'Remaining Balance Invoice': 'balanceInvoice',
      'Remaining Balance Receipt': 'balanceReceipt',
      'Hand-over Notes': 'handoverNotes'
    }
    return mapping[documentType] || 'contract'
  }

  const getPaymentStatus = (statusData) => {
    if (statusData.finalPaymentPaid) return 'full_payment'
    if (statusData.depositPaid) return 'deposit_paid'
    return 'pending'
  }

  // Document generation functions
  const handleGenerateDocument = async (documentType) => {
    if (generatingDocument) {
      console.log('Document generation already in progress')
      return
    }

    try {
      setGeneratingDocument(documentType)
      setGenerationError(null)

      console.log(`[BookingPanel] Starting auto-generation of ${documentType}`)

      // Convert document type to template type
      const templateType = getTemplateType(documentType)
      
      // Find the selected yacht to get details
      const selectedYacht = yachts.find(y => y.id === formData.yacht)
      console.log('[BookingPanel] Selected yacht for generation:', selectedYacht)
      console.log('[BookingPanel] Form data yacht ID:', formData.yacht)
      
      // Prepare booking data (convert from frontend format to database format)
      const bookingForGeneration = {
        id: bookingData.id,
        booking_number: bookingData.bookingNumber,
        customer_first_name: formData.firstName,
        customer_surname: formData.surname,
        customer_email: formData.email,
        customer_phone: formData.phone,
        customer_street: formData.street,
        customer_city: formData.city,
        customer_postcode: formData.postcode,
        customer_country: formData.country,
        yacht_name: bookingData.yachtName || selectedYacht?.name || 'Yacht name not found',
        yacht_type: bookingData.yachtType || selectedYacht?.type || 'Type unknown',
        yacht_location: bookingData.yachtLocation || selectedYacht?.location || 'Location unknown',
        yacht_id: formData.yacht,
        charter_type: formData.tripType,
        start_date: formData.startDate,
        end_date: formData.endDate,
        start_time: formData.startTime || '11:00',
        end_time: formData.endTime || '17:00',
        port_of_departure: formData.portOfDeparture,
        port_of_arrival: formData.portOfArrival,
        total_amount: formData.charterCost || bookingData.totalAmount || 1500.00,
        deposit_amount: formData.deposit || bookingData.depositAmount || 300.00,
        security_deposit: formData.securityDeposit || bookingData.securityDeposit || 500.00,
        deposit_paid: statusData.depositPaid,
        payment_status: getPaymentStatus(statusData),
        booking_confirmed: statusData.bookingConfirmed,
        contract_sent: statusData.contractSent,
        contract_signed: statusData.contractSigned
      }

      // Debug: Log the booking data being sent
      console.log('[BookingPanel] Booking data being sent to generator:', bookingForGeneration)
      console.log('[BookingPanel] Template type:', templateType)
      console.log('[BookingPanel] Selected yacht data:', selectedYacht)

      // Get settings data (yacht owner info, pricing, etc.)
      const settingsData = await documentAutoGenerator.getSettingsData(bookingForGeneration.yacht_id)
      console.log('[BookingPanel] Settings data received:', settingsData)

      // Generate the document
      const generatedBlob = await documentAutoGenerator.generateDocument(templateType, bookingForGeneration, settingsData)

      // Update document state to show it's generated
      setDocumentStates(prev => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          generated: true,
          updated: lastBulkDownload ? new Date() > lastBulkDownload : false
        }
      }))

      // Auto-download the generated document
      console.log('[BookingPanel] Generated blob size:', generatedBlob.size, 'bytes')
      console.log('[BookingPanel] Generated blob type:', generatedBlob.type)
      
      // Determine file extension based on blob type
      let fileExtension = '.txt' // fallback
      if (generatedBlob.type.includes('pdf')) {
        fileExtension = '.pdf'
      } else if (generatedBlob.type.includes('wordprocessingml') || generatedBlob.type.includes('docx')) {
        fileExtension = '.docx'
      } else if (generatedBlob.type.includes('msword')) {
        fileExtension = '.doc'
      }
      
      const filename = `${documentType.replace(/\s+/g, '_')}_${bookingForGeneration.booking_number}_${new Date().toISOString().slice(0, 10)}${fileExtension}`
      console.log('[BookingPanel] Download filename:', filename)
      
      // Validate blob before download
      if (!generatedBlob || generatedBlob.size === 0) {
        throw new Error('Generated document is empty or corrupted')
      }
      
      const url = URL.createObjectURL(generatedBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log(`[BookingPanel] Successfully generated and downloaded ${documentType}`)

    } catch (error) {
      console.error(`[BookingPanel] Error generating ${documentType}:`, error)
      setGenerationError(`Failed to generate ${documentType}: ${error.message}`)
    } finally {
      setGeneratingDocument(null)
    }
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

  const handleGenerateAndEmail = async (documentType) => {
    if (generatingDocument) {
      console.log('Document generation already in progress')
      return
    }

    try {
      setGeneratingDocument(documentType)
      setGenerationError(null)

      console.log(`[BookingPanel] Starting auto-generation and email for ${documentType}`)

      // Convert document type to template type
      const templateType = getTemplateType(documentType)
      
      // Find the selected yacht to get details
      const selectedYacht = yachts.find(y => y.id === formData.yacht)
      
      // Prepare booking data (same as regular generation)
      const bookingForGeneration = {
        id: bookingData.id,
        booking_number: bookingData.bookingNumber,
        customer_first_name: formData.firstName,
        customer_surname: formData.surname,
        customer_email: formData.email,
        customer_phone: formData.phone,
        customer_street: formData.street,
        customer_city: formData.city,
        customer_postcode: formData.postcode,
        customer_country: formData.country,
        yacht_name: bookingData.yachtName || selectedYacht?.name || 'Yacht name not found',
        yacht_type: bookingData.yachtType || selectedYacht?.type || 'Type unknown',
        yacht_location: bookingData.yachtLocation || selectedYacht?.location || 'Location unknown',
        yacht_id: formData.yacht,
        charter_type: formData.tripType,
        start_date: formData.startDate,
        end_date: formData.endDate,
        start_time: formData.startTime || '11:00',
        end_time: formData.endTime || '17:00',
        port_of_departure: formData.portOfDeparture,
        port_of_arrival: formData.portOfArrival,
        total_amount: formData.charterCost || bookingData.totalAmount || 1500.00,
        deposit_amount: formData.deposit || bookingData.depositAmount || 300.00,
        security_deposit: formData.securityDeposit || bookingData.securityDeposit || 500.00,
        deposit_paid: statusData.depositPaid,
        payment_status: getPaymentStatus(statusData),
        booking_confirmed: statusData.bookingConfirmed,
        contract_sent: statusData.contractSent,
        contract_signed: statusData.contractSigned
      }

      // Get settings data
      const settingsData = await documentAutoGenerator.getSettingsData(bookingForGeneration.yacht_id)

      // Generate the document
      const generatedBlob = await documentAutoGenerator.generateDocument(templateType, bookingForGeneration, settingsData)

      // Update document state
      setDocumentStates(prev => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          generated: true,
          updated: lastBulkDownload ? new Date() > lastBulkDownload : false
        }
      }))

      // Create email draft
      const fileName = `${documentType.replace(/\s+/g, '_')}_${bookingForGeneration.booking_number}_${new Date().toISOString().slice(0, 10)}`
      const subject = `Charter ${documentType} - ${bookingForGeneration.yacht_name} - ${bookingForGeneration.start_date}`
      const body = `Dear ${bookingForGeneration.customer_first_name} ${bookingForGeneration.customer_surname},

Please see attached your ${documentType.toLowerCase()} for the charter of "${bookingForGeneration.yacht_name}" scheduled for ${bookingForGeneration.start_date} at ${bookingForGeneration.port_of_departure}.

Charter Details:
- Yacht: ${bookingForGeneration.yacht_name}
- Dates: ${bookingForGeneration.start_date} to ${bookingForGeneration.end_date}
- Time: ${bookingForGeneration.start_time} - ${bookingForGeneration.end_time}
- Port of Departure: ${bookingForGeneration.port_of_departure}

If you have any questions or require any clarification, please don't hesitate to contact us.

Best regards,
SeaScape Yacht Charter Team`

      // Create mailto link and download file for manual attachment
      const mailtoLink = `mailto:${encodeURIComponent(bookingForGeneration.customer_email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      
      // Open email client
      window.location.href = mailtoLink
      
      // Also trigger download so user can manually attach
      const url = URL.createObjectURL(generatedBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName + (generatedBlob.type.includes('pdf') ? '.pdf' : '.docx')
      link.click()
      URL.revokeObjectURL(url)

      console.log(`[BookingPanel] Email draft created for ${documentType}`)

    } catch (error) {
      console.error(`[BookingPanel] Error generating ${documentType} for email:`, error)
      setGenerationError(`Failed to generate ${documentType}: ${error.message}`)
    } finally {
      setGeneratingDocument(null)
    }
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
    <div className="h-full bg-gray-900 text-white overflow-y-auto pr-6">
      {/* Header with Breadcrumb Navigation */}
      <BreadcrumbHeader
        bookingNumber={bookingData?.bookingNumber || bookingData?.id}
        onSeascapeClick={handleSeascapeNavigation}
        onBookingManagementClick={handleBookingManagementNavigation}
        onBack={handleBackNavigation}
      />

      <div className="p-6">
        {/* Booking Number Section */}
        {bookingData?.bookingNumber && (
          <div className="mb-6 bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">Booking Number:</span>
                <BookingNumberEditor
                  bookingId={bookingData.id}
                  currentNumber={bookingData.bookingNumber}
                  onSave={handleBookingNumberUpdate}
                />
              </div>
              {bookingData.bookingType === 'external' && (
                <span className="px-2 py-1 text-xs bg-yellow-600 text-white rounded">
                  External Booking
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Booking Form */}
          <div className="space-y-6">
            {/* Yacht and Trip Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Yacht *</label>
                {loadingYachts ? (
                  <div className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-400">
                    Loading yachts...
                  </div>
                ) : (
                  <select 
                    value={formData.yacht}
                    onChange={(e) => handleInputChange('yacht', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select a yacht</option>
                    {yachts.map(yacht => (
                      <option key={yacht.id} value={yacht.id}>
                        {yacht.name}
                      </option>
                    ))}
                  </select>
                )}
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

            {/* Times */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime || '11:00'}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <input
                  type="time"
                  value={formData.endTime || '17:00'}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
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

            {/* Charter Cost Section */}
            <CharterCostSection
              yacht={bookingData.yachtName || bookingData.yacht}
              startDate={formData.startDate}
              endDate={formData.endDate}
              onCostChange={handleCharterCostChange}
              bookingId={bookingData.id}
              initialCosts={{
                charterCost: formData.charterCost,
                deposit: formData.deposit,
                securityDeposit: formData.securityDeposit
              }}
              onSave={(costs) => {
                // Update local form data when charter costs are saved
                setFormData(prev => ({
                  ...prev,
                  charterCost: costs.charterCost,
                  deposit: costs.deposit,
                  securityDeposit: costs.securityDeposit
                }))
              }}
            />

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
                  className={`p-3 rounded-lg border transition-colors ${
                    statusData[status.key]
                      ? 'bg-green-900/30 border-green-600 text-green-300'
                      : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {/* Main toggle row */}
                  <div 
                    onClick={() => handleStatusChange(status.key)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <span className="text-lg">{status.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{status.label}</span>
                        
                        {/* Date display on the right side of the label */}
                        {statusData[status.key] && statusDates[status.key] && (
                          <div className="ml-4">
                            {editingDate === status.key ? (
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="datetime-local"
                                  value={formatDateForInput(statusDates[status.key])}
                                  onChange={(e) => handleDateChange(status.key, e.target.value ? new Date(e.target.value).toISOString() : null)}
                                  className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-xs"
                                />
                                <button
                                  onClick={() => setEditingDate(null)}
                                  className="text-green-400 hover:text-green-300 text-xs px-1"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingDate(null)}
                                  className="text-gray-400 hover:text-gray-300 text-xs px-1"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div 
                                className="text-gray-400 cursor-pointer hover:text-gray-300 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingDate(status.key)
                                }}
                              >
                                {formatDateForDisplay(statusDates[status.key])} <span className="opacity-60">(click to edit)</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Toggle checkbox on the right */}
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
              
              {/* Error display */}
              {generationError && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-600 rounded text-red-300 text-sm">
                  {generationError}
                </div>
              )}
              
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
                  const isGenerating = generatingDocument === docType
                  
                  return (
                    <div key={docType} className="flex items-center gap-2">
                      <button
                        onClick={() => handleGenerateDocument(docType)}
                        disabled={isGenerating || generatingDocument}
                        className={`flex-1 text-left p-3 rounded transition-colors ${
                          isGenerating || generatingDocument
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        <span className="text-sm">
                          {isGenerating ? '⏳ Generating...' : `- ${docType}`}
                        </span>
                      </button>
                      <button
                        onClick={() => handleGenerateDocument(docType)}
                        disabled={isGenerating || generatingDocument}
                        className={`px-3 py-2 text-white text-sm font-medium rounded transition-colors ${
                          isGenerating || generatingDocument
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isGenerating ? 'Generating...' : 'Auto-Create'}
                      </button>
                      <button
                        onClick={() => handleGenerateAndEmail(docType)}
                        disabled={isGenerating || generatingDocument}
                        className={`px-3 py-2 text-white text-sm font-medium rounded transition-colors ${
                          isGenerating || generatingDocument
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                        title="Generate document and create draft email"
                      >
                        📧 Email
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

      {/* Booking Conflict Warning Modal */}
      <BookingConflictWarningModal
        isOpen={conflictModal.isOpen}
        onClose={() => setConflictModal({ isOpen: false, conflictDetails: null, pendingBookingData: null })}
        onProceed={handleConflictProceed}
        conflictDetails={conflictModal.conflictDetails}
        bookingData={formData}
      />
    </div>
  )
}

export default BookingPanel