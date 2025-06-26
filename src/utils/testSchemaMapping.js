/**
 * Schema Mapping Test Utility
 * Quick test to verify the transformation between frontend and unified schema
 */

import { transformToUnifiedSchema, transformFromUnifiedSchema } from './schemaMapping.js'

// Sample frontend data
const sampleFormData = {
  firstName: 'John',
  surname: 'Smith',
  email: 'john.smith@email.com',
  phone: '+44 7700 900123',
  street: '123 Marine Drive',
  city: 'Portsmouth',
  postcode: 'PO1 2AB',
  country: 'United Kingdom',
  yacht: '550e8400-e29b-41d4-a716-446655440011',
  tripType: 'bareboat',
  startDate: '2024-07-15',
  endDate: '2024-07-22',
  portOfDeparture: 'Portsmouth',
  portOfArrival: 'Portsmouth',
  crewExperienceFile: {
    name: 'john_smith_experience.pdf',
    url: 'https://storage.supabase.co/crew-documents/john_smith_experience.pdf',
    size: 245760
  }
}

const sampleStatusData = {
  bookingConfirmed: true,
  depositPaid: true,
  contractSent: true,
  contractSigned: false,
  depositInvoiceSent: false,
  receiptIssued: false
}

const sampleDocumentStates = {
  'Contract': { generated: true, downloaded: true, updated: false },
  'Deposit Invoice': { generated: true, downloaded: false, updated: false },
  'Deposit Receipt': { generated: false, downloaded: false, updated: false },
  'Remaining Balance Invoice': { generated: false, downloaded: false, updated: false },
  'Remaining Balance Receipt': { generated: false, downloaded: false, updated: false },
  'Hand-over Notes': { generated: false, downloaded: false, updated: false }
}

export function testSchemaMapping() {
  console.log('=== Testing Schema Mapping ===')
  
  // Test transformation to unified schema
  console.log('\n1. Frontend → Unified Schema:')
  const unifiedData = transformToUnifiedSchema(sampleFormData, sampleStatusData, sampleDocumentStates)
  console.log('Unified Data:', JSON.stringify(unifiedData, null, 2))
  
  // Test reverse transformation
  console.log('\n2. Unified Schema → Frontend:')
  const { formData, statusData, documentStates } = transformFromUnifiedSchema(unifiedData)
  console.log('Form Data:', JSON.stringify(formData, null, 2))
  console.log('Status Data:', JSON.stringify(statusData, null, 2))
  console.log('Document States:', JSON.stringify(documentStates, null, 2))
  
  // Verify round-trip consistency
  console.log('\n3. Round-trip Verification:')
  const originalKeys = Object.keys(sampleFormData).sort()
  const roundTripKeys = Object.keys(formData).sort()
  
  console.log('Original form keys:', originalKeys)
  console.log('Round-trip form keys:', roundTripKeys)
  console.log('Keys match:', JSON.stringify(originalKeys) === JSON.stringify(roundTripKeys))
  
  // Check specific field mappings
  console.log('\n4. Field Mapping Verification:')
  console.log('firstName → customer_first_name:', unifiedData.customer_first_name === sampleFormData.firstName)
  console.log('email → customer_email:', unifiedData.customer_email === sampleFormData.email)
  console.log('yacht → yacht_id:', unifiedData.yacht_id === sampleFormData.yacht)
  console.log('tripType → charter_type:', unifiedData.charter_type === sampleFormData.tripType)
  
  return {
    unifiedData,
    formData,
    statusData,
    documentStates
  }
}

// Run test if this file is executed directly
if (typeof window === 'undefined') {
  testSchemaMapping()
}