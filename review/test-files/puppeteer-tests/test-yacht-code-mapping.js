/**
 * Test yacht code mapping with various yacht ID formats
 */

import { getYachtCode } from './src/models/utilities/BookingNumberGenerator.js'

// Test various yacht ID formats
const testYachtIds = [
  // Direct mapping
  'zavaria',
  'spectre',
  'alrisha',
  'disk-drive',
  'calico-moon',
  
  // Capital case
  'Zavaria',
  'Spectre', 
  'Alrisha',
  'Disk Drive',
  'Calico Moon',
  
  // Different formats that might come from database
  'ZAVARIA',
  'SPECTRE',
  'Calico-Moon',
  'disk_drive',
  
  // UUID-like formats (if yacht IDs are UUIDs, we'd need yacht name lookup)
  'invalid-yacht-id'
]

console.log('=== Testing Yacht Code Mapping ===\n')

for (const yachtId of testYachtIds) {
  try {
    const code = getYachtCode(yachtId)
    console.log(`✅ "${yachtId}" -> ${code}`)
  } catch (error) {
    console.log(`❌ "${yachtId}" -> ERROR: ${error.message}`)
  }
}

console.log('\n=== Expected Mappings ===')
console.log('Calico Moon -> CM')
console.log('Spectre -> SP')
console.log('Alrisha -> AL') 
console.log('Disk Drive -> DD')
console.log('Zavaria -> ZA')