/**
 * Schema Mapping Utilities
 * 
 * Utilities for transforming data between frontend component formats
 * and the unified database schema. Handles field name mapping, data type
 * conversion, and schema version compatibility.
 * 
 * @author AI Agent
 * @created 2025-06-26
 * @version 1.0.0 - Unified Schema Support
 */

import { BookingStatus, CharterType, PaymentStatus, DocumentTypes } from '../models/core/BookingModel-unified.js'

/**
 * Frontend form field to unified schema field mapping
 */
export const FIELD_MAPPING = {
  // Customer information
  firstName: 'customer_first_name',
  surname: 'customer_surname',
  email: 'customer_email', 
  phone: 'customer_phone',
  street: 'customer_street',
  city: 'customer_city',
  postcode: 'customer_postcode',
  country: 'customer_country',
  
  // Booking details
  yacht: 'yacht_id',
  tripType: 'charter_type',
  startDate: 'start_date',
  endDate: 'end_date',
  portOfDeparture: 'port_of_departure',
  portOfArrival: 'port_of_arrival',
  
  // Status flags (direct mapping)
  bookingConfirmed: 'booking_confirmed',
  depositPaid: 'deposit_paid',
  contractSent: 'contract_sent',
  contractSigned: 'contract_signed',
  depositInvoiceSent: 'deposit_invoice_sent',
  receiptIssued: 'receipt_issued',
  
  // File information
  'crewExperienceFile.name': 'crew_experience_file_name',
  'crewExperienceFile.url': 'crew_experience_file_url',
  'crewExperienceFile.size': 'crew_experience_file_size',
  
  // Additional fields
  specialRequirements: 'special_requirements',
  notes: 'notes'
}

/**
 * Reverse mapping for unified schema to frontend
 */
export const REVERSE_FIELD_MAPPING = Object.fromEntries(
  Object.entries(FIELD_MAPPING).map(([frontend, unified]) => [unified, frontend])
)

/**
 * Document type to timestamp field mapping
 */
export const DOCUMENT_TIMESTAMP_MAPPING = {
  'Contract': {
    generated: 'contract_generated_at',
    downloaded: 'contract_downloaded_at', 
    updated: 'contract_updated_at'
  },
  'Deposit Invoice': {
    generated: 'deposit_invoice_generated_at',
    downloaded: 'deposit_invoice_downloaded_at',
    updated: 'deposit_invoice_updated_at'
  },
  'Deposit Receipt': {
    generated: 'deposit_receipt_generated_at', 
    downloaded: 'deposit_receipt_downloaded_at',
    updated: 'deposit_receipt_updated_at'
  },
  'Remaining Balance Invoice': {
    generated: 'balance_invoice_generated_at',
    downloaded: 'balance_invoice_downloaded_at',
    updated: 'balance_invoice_updated_at'
  },
  'Remaining Balance Receipt': {
    generated: 'balance_receipt_generated_at',
    downloaded: 'balance_receipt_downloaded_at', 
    updated: 'balance_receipt_updated_at'
  },
  'Hand-over Notes': {
    generated: 'handover_notes_generated_at',
    downloaded: 'handover_notes_downloaded_at',
    updated: 'handover_notes_updated_at'
  }
}

/**
 * Transform frontend form data to unified schema format
 * @param {Object} formData - Frontend form data
 * @param {Object} statusData - Frontend status data
 * @param {Object} documentStates - Frontend document states
 * @returns {Object} Unified schema formatted data
 */
export function transformToUnifiedSchema(formData, statusData = {}, documentStates = {}) {
  const unifiedData = {}
  
  // Map basic form fields
  Object.keys(formData).forEach(frontendField => {
    const unifiedField = FIELD_MAPPING[frontendField]
    if (unifiedField) {
      unifiedData[unifiedField] = formData[frontendField]
    }
  })
  
  // Map status data
  Object.keys(statusData).forEach(statusField => {
    const unifiedField = FIELD_MAPPING[statusField]
    if (unifiedField) {
      unifiedData[unifiedField] = statusData[statusField]
    }
  })
  
  // Handle file upload object
  if (formData.crewExperienceFile) {
    const file = formData.crewExperienceFile
    unifiedData.crew_experience_file_name = file.name || null
    unifiedData.crew_experience_file_url = file.url || null
    unifiedData.crew_experience_file_size = file.size || null
  }
  
  // Handle address object (if nested)
  if (formData.address) {
    unifiedData.customer_street = formData.address.street || ''
    unifiedData.customer_city = formData.address.city || ''
    unifiedData.customer_postcode = formData.address.postcode || ''
    unifiedData.customer_country = formData.address.country || 'United Kingdom'
  }
  
  // Transform document states to timestamps
  Object.keys(documentStates).forEach(docType => {
    const docState = documentStates[docType]
    const timestampMapping = DOCUMENT_TIMESTAMP_MAPPING[docType]
    
    if (timestampMapping) {
      // Only set timestamps if the state is true and timestamp doesn't exist
      if (docState.generated && !unifiedData[timestampMapping.generated]) {
        unifiedData[timestampMapping.generated] = new Date().toISOString()
      }
      if (docState.downloaded && !unifiedData[timestampMapping.downloaded]) {
        unifiedData[timestampMapping.downloaded] = new Date().toISOString()
      }
      if (docState.updated && !unifiedData[timestampMapping.updated]) {
        unifiedData[timestampMapping.updated] = new Date().toISOString()
      }
    }
  })
  
  // Set high-level status based on individual flags
  unifiedData.booking_status = determineBookingStatus(unifiedData)
  unifiedData.payment_status = determinePaymentStatus(unifiedData)
  
  return unifiedData
}

/**
 * Transform unified schema data to frontend format
 * @param {Object} unifiedData - Unified schema data
 * @returns {Object} Frontend formatted data with formData, statusData, documentStates
 */
export function transformFromUnifiedSchema(unifiedData) {
  if (!unifiedData) return { formData: {}, statusData: {}, documentStates: {} }
  
  const formData = {}
  const statusData = {}
  const documentStates = {}
  
  // Map unified fields back to frontend fields
  Object.keys(unifiedData).forEach(unifiedField => {
    const frontendField = REVERSE_FIELD_MAPPING[unifiedField]
    if (frontendField) {
      // Handle different data types
      if (frontendField.includes('Date') && unifiedData[unifiedField]) {
        // Convert dates to YYYY-MM-DD format for forms
        const date = new Date(unifiedData[unifiedField])
        formData[frontendField] = date.toISOString().split('T')[0]
      } else if (frontendField.startsWith('booking') || frontendField.startsWith('deposit') || 
                 frontendField.startsWith('contract') || frontendField.startsWith('receipt')) {
        // Status fields go to statusData
        statusData[frontendField] = unifiedData[unifiedField]
      } else {
        // Regular form fields
        formData[frontendField] = unifiedData[unifiedField]
      }
    }
  })
  
  // Handle file object reconstruction
  if (unifiedData.crew_experience_file_name) {
    formData.crewExperienceFile = {
      name: unifiedData.crew_experience_file_name,
      url: unifiedData.crew_experience_file_url,
      size: unifiedData.crew_experience_file_size
    }
  }
  
  // Handle address object (if components expect nested structure)
  if (unifiedData.customer_street || unifiedData.customer_city || 
      unifiedData.customer_postcode || unifiedData.customer_country) {
    formData.address = {
      street: unifiedData.customer_street || '',
      city: unifiedData.customer_city || '',
      postcode: unifiedData.customer_postcode || '',
      country: unifiedData.customer_country || 'United Kingdom'
    }
  }
  
  // Transform timestamps back to document states
  Object.keys(DOCUMENT_TIMESTAMP_MAPPING).forEach(docType => {
    const timestampMapping = DOCUMENT_TIMESTAMP_MAPPING[docType]
    
    documentStates[docType] = {
      generated: Boolean(unifiedData[timestampMapping.generated]),
      downloaded: Boolean(unifiedData[timestampMapping.downloaded]),
      updated: Boolean(unifiedData[timestampMapping.updated])
    }
  })
  
  return { formData, statusData, documentStates }
}

/**
 * Determine booking status from individual status flags
 * @param {Object} data - Booking data with status flags
 * @returns {string} BookingStatus enum value
 */
function determineBookingStatus(data) {
  if (data.booking_confirmed) {
    return BookingStatus.CONFIRMED
  }
  return BookingStatus.TENTATIVE
}

/**
 * Determine payment status from payment flags
 * @param {Object} data - Booking data with payment flags
 * @returns {string} PaymentStatus enum value  
 */
function determinePaymentStatus(data) {
  if (data.balance_due === 0 || (data.deposit_paid && data.receipt_issued)) {
    return PaymentStatus.FULL_PAYMENT
  } else if (data.deposit_paid) {
    return PaymentStatus.DEPOSIT_PAID
  }
  return PaymentStatus.PENDING
}

/**
 * Validate transformed data against unified schema constraints
 * @param {Object} unifiedData - Data in unified schema format
 * @returns {Object} Validation result with errors array
 */
export function validateUnifiedSchema(unifiedData) {
  const errors = []
  
  // Required fields validation
  if (!unifiedData.customer_first_name?.trim()) {
    errors.push({ field: 'customer_first_name', message: 'First name is required' })
  }
  
  if (!unifiedData.customer_surname?.trim()) {
    errors.push({ field: 'customer_surname', message: 'Surname is required' })
  }
  
  if (!unifiedData.customer_email?.trim()) {
    errors.push({ field: 'customer_email', message: 'Email is required' })
  }
  
  if (!unifiedData.yacht_id?.trim()) {
    errors.push({ field: 'yacht_id', message: 'Yacht selection is required' })
  }
  
  if (!unifiedData.start_date) {
    errors.push({ field: 'start_date', message: 'Start date is required' })
  }
  
  if (!unifiedData.end_date) {
    errors.push({ field: 'end_date', message: 'End date is required' })
  }
  
  // Date validation
  if (unifiedData.start_date && unifiedData.end_date) {
    const startDate = new Date(unifiedData.start_date)
    const endDate = new Date(unifiedData.end_date)
    
    if (startDate >= endDate) {
      errors.push({ field: 'end_date', message: 'End date must be after start date' })
    }
  }
  
  // Enum validation
  if (unifiedData.charter_type && !Object.values(CharterType).includes(unifiedData.charter_type)) {
    errors.push({ field: 'charter_type', message: 'Invalid charter type' })
  }
  
  if (unifiedData.booking_status && !Object.values(BookingStatus).includes(unifiedData.booking_status)) {
    errors.push({ field: 'booking_status', message: 'Invalid booking status' })
  }
  
  if (unifiedData.payment_status && !Object.values(PaymentStatus).includes(unifiedData.payment_status)) {
    errors.push({ field: 'payment_status', message: 'Invalid payment status' })
  }
  
  // Financial validation
  if (unifiedData.total_amount !== null && unifiedData.deposit_amount !== null) {
    if (unifiedData.deposit_amount > unifiedData.total_amount) {
      errors.push({ field: 'deposit_amount', message: 'Deposit cannot exceed total amount' })
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Create a BookingModel instance from form data
 * @param {Object} formData - Frontend form data
 * @param {Object} statusData - Frontend status data
 * @param {Object} documentStates - Frontend document states
 * @returns {BookingModel} BookingModel instance
 */
export function createBookingFromForm(formData, statusData = {}, documentStates = {}) {
  const unifiedData = transformToUnifiedSchema(formData, statusData, documentStates)
  
  // Import BookingModel dynamically to avoid circular dependencies
  return import('../models/core/BookingModel-unified.js').then(({ default: BookingModel }) => {
    return new BookingModel(unifiedData)
  })
}

export default {
  FIELD_MAPPING,
  REVERSE_FIELD_MAPPING,
  DOCUMENT_TIMESTAMP_MAPPING,
  transformToUnifiedSchema,
  transformFromUnifiedSchema,
  validateUnifiedSchema,
  createBookingFromForm
}