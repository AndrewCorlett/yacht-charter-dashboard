/**
 * Analysis script to identify the crewExperienceFile field mapping bug
 * This reproduces the exact issue that causes 400 errors in Supabase updates
 */

console.log('🔍 Analyzing the crewExperienceFile field mapping bug...\n');

// Simulate the data that comes from BookingPanel.jsx
const frontendFormData = {
  yacht: 'spectre',
  tripType: 'bareboat',
  startDate: '2025-06-28',
  endDate: '2025-07-02',
  firstName: 'John',
  surname: 'Doe',
  email: 'john@example.com',
  phone: '+44123456789',
  
  // This is the problematic field - it's an object from FileUpload component
  crewExperienceFile: {
    name: 'crew-experience.pdf',
    url: 'https://example.com/files/crew-experience.pdf',
    size: 1024000
  }
};

const frontendStatusData = {
  bookingConfirmed: false,
  depositPaid: true, // This change triggers the save
  finalPaymentPaid: false,
  contractSent: false,
  contractSigned: false,
  depositInvoiceSent: false,
  receiptIssued: false
};

console.log('📝 Frontend form data:');
console.log(JSON.stringify(frontendFormData, null, 2));
console.log('\n📊 Frontend status data:');
console.log(JSON.stringify(frontendStatusData, null, 2));

// Simulate what happens in BookingPanel.jsx handleSave()
const updatedBookingData = {
  ...frontendFormData,
  // Flatten status fields instead of nesting them
  bookingConfirmed: frontendStatusData.bookingConfirmed,
  depositPaid: frontendStatusData.depositPaid,
  finalPaymentPaid: frontendStatusData.finalPaymentPaid,
  contractSent: frontendStatusData.contractSent,
  contractSigned: frontendStatusData.contractSigned,
  depositInvoiceSent: frontendStatusData.depositInvoiceSent,
  receiptIssued: frontendStatusData.receiptIssued,
  // Keep the nested status for frontend compatibility
  status: frontendStatusData
};

console.log('\n🔄 Data after BookingPanel processing:');
console.log(JSON.stringify(updatedBookingData, null, 2));

// Simulate the transformFieldNames function from supabase.js
function transformFieldNames(data) {
  const fieldMappings = {
    // Financial fields
    'balanceDue': 'balance_due',
    'totalAmount': 'total_amount',
    'depositAmount': 'deposit_amount',
    'baseRate': 'base_rate',
    
    // Customer fields
    'firstName': 'customer_first_name',
    'surname': 'customer_surname',
    'email': 'customer_email',
    'phone': 'customer_phone',
    'street': 'customer_street',
    'city': 'customer_city',
    'postcode': 'customer_postcode',
    'country': 'customer_country',
    
    // Booking details
    'charterType': 'charter_type',
    'startDate': 'start_date',
    'endDate': 'end_date',
    'portOfDeparture': 'port_of_departure',
    'portOfArrival': 'port_of_arrival',
    'yachtId': 'yacht_id',
    'customerId': 'customer_id',
    'bookingNumber': 'booking_number',
    
    // Status fields
    'bookingStatus': 'booking_status',
    'paymentStatus': 'payment_status',
    'bookingConfirmed': 'booking_confirmed',
    'depositPaid': 'deposit_paid',
    'finalPaymentPaid': 'final_payment_paid',
    'contractSent': 'contract_sent',
    'contractSigned': 'contract_signed',
    'depositInvoiceSent': 'deposit_invoice_sent',
    'receiptIssued': 'receipt_issued',
    
    // Timestamp fields
    'createdAt': 'created_at',
    'updatedAt': 'updated_at',
    
    // File fields - THIS IS WHERE THE BUG IS
    'crewExperienceFileName': 'crew_experience_file_name',
    'crewExperienceFileUrl': 'crew_experience_file_url',
    'crewExperienceFileSize': 'crew_experience_file_size',
    
    // Notes
    'specialRequirements': 'special_requirements',
    'notes': 'notes'
  };
  
  const transformed = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip nested status object - we use flattened fields instead
    if (key === 'status' && typeof value === 'object') {
      continue;
    }
    
    // Use mapped field name if available, otherwise keep original
    const dbFieldName = fieldMappings[key] || key;
    transformed[dbFieldName] = value;
  }
  
  return transformed;
}

// Apply the transformation (this is what goes to Supabase)
const transformedData = transformFieldNames(updatedBookingData);

console.log('\n🗄️  Data after field transformation (sent to Supabase):');
console.log(JSON.stringify(transformedData, null, 2));

// Analyze the problem
console.log('\n🔍 ANALYSIS RESULTS:');
console.log('================');

if (transformedData.crewExperienceFile && typeof transformedData.crewExperienceFile === 'object') {
  console.log('❌ BUG CONFIRMED: crewExperienceFile object is being sent to database!');
  console.log(`   Field: crewExperienceFile = ${JSON.stringify(transformedData.crewExperienceFile)}`);
  console.log('   Problem: Database expects individual columns, not objects');
  
  console.log('\n🔧 EXPECTED DATABASE FIELDS:');
  console.log('   - crew_experience_file_name (string)');
  console.log('   - crew_experience_file_url (string)');
  console.log('   - crew_experience_file_size (integer)');
  
  console.log('\n❌ ACTUAL FIELD BEING SENT:');
  console.log('   - crewExperienceFile (object)');
  
  console.log('\n💡 THE FIX:');
  console.log('   The transformFieldNames function needs to decompose the crewExperienceFile object');
  console.log('   into individual database fields before sending to Supabase.');
  
} else {
  console.log('✅ No crewExperienceFile object found in transformed data');
}

// Check for individual file fields
const hasIndividualFields = !!(
  transformedData.crew_experience_file_name ||
  transformedData.crew_experience_file_url ||
  transformedData.crew_experience_file_size
);

if (hasIndividualFields) {
  console.log('✅ Individual crew experience fields found');
} else {
  console.log('❌ No individual crew experience fields found');
}

// Show what the correct transformation should look like
console.log('\n🎯 CORRECT TRANSFORMATION SHOULD BE:');
const correctTransformation = {
  ...transformedData
};

// Remove the problematic object field
delete correctTransformation.crewExperienceFile;

// Add the correct individual fields
if (updatedBookingData.crewExperienceFile) {
  correctTransformation.crew_experience_file_name = updatedBookingData.crewExperienceFile.name;
  correctTransformation.crew_experience_file_url = updatedBookingData.crewExperienceFile.url;
  correctTransformation.crew_experience_file_size = updatedBookingData.crewExperienceFile.size;
}

console.log(JSON.stringify(correctTransformation, null, 2));

console.log('\n🛠️  IMPLEMENTATION FIX:');
console.log('================');
console.log('In src/lib/supabase.js, the transformFieldNames function needs this addition:');
console.log(`
// Handle crewExperienceFile object decomposition
if (data.crewExperienceFile && typeof data.crewExperienceFile === 'object') {
  transformed.crew_experience_file_name = data.crewExperienceFile.name;
  transformed.crew_experience_file_url = data.crewExperienceFile.url;
  transformed.crew_experience_file_size = data.crewExperienceFile.size;
  // Don't include the original object
} else {
  // Use mapped field name if available, otherwise keep original
  const dbFieldName = fieldMappings[key] || key;
  transformed[dbFieldName] = value;
}
`);

console.log('\n📋 SUMMARY:');
console.log('===========');
console.log('• Issue: crewExperienceFile object sent directly to Supabase');
console.log('• Root cause: transformFieldNames() doesn\'t decompose file objects');
console.log('• Effect: 400 Bad Request errors when updating bookings with crew files');
console.log('• Solution: Add object decomposition logic to field transformation');
console.log('• Files to fix: src/lib/supabase.js (transformFieldNames function)');