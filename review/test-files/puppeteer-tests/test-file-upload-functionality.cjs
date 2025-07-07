const path = require('path')
const fs = require('fs')

async function testFileUploadImplementation() {
  console.log('🧪 Testing File Upload Implementation')
  console.log('=' .repeat(50))

  const testResults = {
    component: { status: 'PASS', details: [] },
    integration: { status: 'PASS', details: [] },
    validation: { status: 'PASS', details: [] },
    userExperience: { status: 'PASS', details: [] }
  }

  // Test 1: Component Implementation
  console.log('\n📦 Testing Component Implementation...')
  try {
    const fileUploadPath = path.join(__dirname, 'src/components/common/FileUpload.jsx')
    const bookingPanelPath = path.join(__dirname, 'src/components/booking/BookingPanel.jsx')
    
    // Check if FileUpload component exists
    if (!fs.existsSync(fileUploadPath)) {
      testResults.component.status = 'FAIL'
      testResults.component.details.push('❌ FileUpload component not found')
    } else {
      testResults.component.details.push('✅ FileUpload component exists')
      
      // Read FileUpload component content
      const fileUploadContent = fs.readFileSync(fileUploadPath, 'utf8')
      
      // Check for required features
      const requiredFeatures = [
        { name: 'File validation', pattern: /validateFile/ },
        { name: 'Drag and drop', pattern: /onDragOver|onDrop/ },
        { name: 'PDF/Word support', pattern: /\.pdf|\.doc|\.docx/ },
        { name: 'File size validation', pattern: /maxSize/ },
        { name: 'File preview/management', pattern: /getFileIcon|formatFileSize/ }
      ]
      
      requiredFeatures.forEach(feature => {
        if (feature.pattern.test(fileUploadContent)) {
          testResults.component.details.push(`✅ ${feature.name} implemented`)
        } else {
          testResults.component.status = 'FAIL'
          testResults.component.details.push(`❌ ${feature.name} missing`)
        }
      })
    }
    
    // Check BookingPanel integration
    if (!fs.existsSync(bookingPanelPath)) {
      testResults.integration.status = 'FAIL'
      testResults.integration.details.push('❌ BookingPanel component not found')
    } else {
      const bookingPanelContent = fs.readFileSync(bookingPanelPath, 'utf8')
      
      // Check for FileUpload import and usage
      if (bookingPanelContent.includes("import FileUpload from '../common/FileUpload'")) {
        testResults.integration.details.push('✅ FileUpload properly imported')
      } else {
        testResults.integration.status = 'FAIL'
        testResults.integration.details.push('❌ FileUpload import missing')
      }
      
      if (bookingPanelContent.includes('<FileUpload')) {
        testResults.integration.details.push('✅ FileUpload component used in BookingPanel')
      } else {
        testResults.integration.status = 'FAIL'
        testResults.integration.details.push('❌ FileUpload component not used')
      }
      
      // Check for crew experience file state
      if (bookingPanelContent.includes('crewExperienceFile')) {
        testResults.integration.details.push('✅ Crew experience file state managed')
      } else {
        testResults.integration.status = 'FAIL'
        testResults.integration.details.push('❌ Crew experience file state missing')
      }
      
      // Check for old crew experience dropdown/textarea removal
      if (!bookingPanelContent.includes('crewExperience') || 
          !bookingPanelContent.match(/crewExperience.*select|crewExperience.*textarea/)) {
        testResults.integration.details.push('✅ Old crew experience form fields removed')
      } else {
        testResults.integration.status = 'FAIL'
        testResults.integration.details.push('❌ Old crew experience form fields still present')
      }
    }
    
  } catch (error) {
    testResults.component.status = 'FAIL'
    testResults.component.details.push(`❌ Error testing component: ${error.message}`)
  }

  // Test 2: Validation Logic
  console.log('\n🔍 Testing Validation Logic...')
  try {
    const fileUploadPath = path.join(__dirname, 'src/components/common/FileUpload.jsx')
    const content = fs.readFileSync(fileUploadPath, 'utf8')
    
    // Check file type validation
    const fileTypeCheck = content.includes('application/pdf') && 
                         content.includes('application/msword') && 
                         content.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    
    if (fileTypeCheck) {
      testResults.validation.details.push('✅ File type validation (PDF, DOC, DOCX) implemented')
    } else {
      testResults.validation.status = 'FAIL'
      testResults.validation.details.push('❌ File type validation incomplete')
    }
    
    // Check file size validation
    if (content.includes('file.size > maxSize')) {
      testResults.validation.details.push('✅ File size validation implemented')
    } else {
      testResults.validation.status = 'FAIL'
      testResults.validation.details.push('❌ File size validation missing')
    }
    
    // Check error handling
    if (content.includes('setErrorMessage') && content.includes('uploadStatus')) {
      testResults.validation.details.push('✅ Error handling and status tracking implemented')
    } else {
      testResults.validation.status = 'FAIL'
      testResults.validation.details.push('❌ Error handling incomplete')
    }
    
  } catch (error) {
    testResults.validation.status = 'FAIL'
    testResults.validation.details.push(`❌ Error testing validation: ${error.message}`)
  }

  // Test 3: User Experience Features
  console.log('\n👤 Testing User Experience Features...')
  try {
    const fileUploadPath = path.join(__dirname, 'src/components/common/FileUpload.jsx')
    const content = fs.readFileSync(fileUploadPath, 'utf8')
    
    // Check for drag and drop
    if (content.includes('onDragOver') && content.includes('onDrop')) {
      testResults.userExperience.details.push('✅ Drag and drop functionality implemented')
    } else {
      testResults.userExperience.status = 'FAIL'
      testResults.userExperience.details.push('❌ Drag and drop missing')
    }
    
    // Check for file preview/management
    if (content.includes('getFileIcon') && content.includes('formatFileSize')) {
      testResults.userExperience.details.push('✅ File preview and management implemented')
    } else {
      testResults.userExperience.status = 'FAIL'
      testResults.userExperience.details.push('❌ File preview/management incomplete')
    }
    
    // Check for loading states
    if (content.includes('uploading') && content.includes('animate-spin')) {
      testResults.userExperience.details.push('✅ Loading states implemented')
    } else {
      testResults.userExperience.status = 'FAIL'
      testResults.userExperience.details.push('❌ Loading states missing')
    }
    
    // Check for dark theme styling
    if (content.includes('bg-gray-800') && content.includes('text-white')) {
      testResults.userExperience.details.push('✅ Dark theme styling implemented')
    } else {
      testResults.userExperience.status = 'FAIL'
      testResults.userExperience.details.push('❌ Dark theme styling incomplete')
    }
    
  } catch (error) {
    testResults.userExperience.status = 'FAIL'
    testResults.userExperience.details.push(`❌ Error testing user experience: ${error.message}`)
  }

  // Generate Report
  console.log('\n📊 TEST RESULTS SUMMARY')
  console.log('=' .repeat(50))
  
  const categories = [
    { name: 'Component Implementation', key: 'component' },
    { name: 'BookingPanel Integration', key: 'integration' },
    { name: 'Validation Logic', key: 'validation' },
    { name: 'User Experience', key: 'userExperience' }
  ]
  
  let overallStatus = 'PASS'
  
  categories.forEach(category => {
    const result = testResults[category.key]
    console.log(`\n${category.name}: ${result.status}`)
    result.details.forEach(detail => console.log(`  ${detail}`))
    
    if (result.status === 'FAIL') {
      overallStatus = 'FAIL'
    }
  })
  
  console.log('\n' + '=' .repeat(50))
  console.log(`OVERALL VERIFICATION: ${overallStatus}`)
  console.log('=' .repeat(50))
  
  return {
    overallStatus,
    testResults,
    summary: {
      totalTests: categories.length,
      passed: categories.filter(cat => testResults[cat.key].status === 'PASS').length,
      failed: categories.filter(cat => testResults[cat.key].status === 'FAIL').length
    }
  }
}

async function runTests() {
  try {
    const results = await testFileUploadImplementation()
    
    // Write results to file
    const reportPath = path.join(__dirname, 'file-upload-verification-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))
    
    console.log(`\n📝 Detailed report saved to: ${reportPath}`)
    
    // Exit with appropriate code
    process.exit(results.overallStatus === 'PASS' ? 0 : 1)
    
  } catch (error) {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  runTests()
}

module.exports = { testFileUploadImplementation }