#!/usr/bin/env node

/**
 * Test Forms Template Service
 * 
 * This script tests the FormsTemplateService functions to identify issues
 * with download, delete, and list operations
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kbwjtihjyhapaclyytxn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJiss3QiOiJzdXBhYmFzZSIsInJlZiI6Imtid2p0aWhqeWhhcGFjbHl5dHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzIxMjksImV4cCI6MjA2NjUwODEyOX0.i6vbPAhTkfwInLnvfmNDblUNdEF4Y-r0jzXMiKUZtqI'
const bucketName = 'form-templates'

console.log('🧪 Testing Forms Template Service Operations')
console.log('============================================')

const supabase = createClient(supabaseUrl, supabaseKey)

// Current files found in storage
const currentFiles = [
  {
    templateType: 'contract',
    filePath: 'contract/2025-06-29T18-37-28-160Z_test-contract-template.pdf',
    fileName: 'test-contract-template.pdf'
  },
  {
    templateType: 'initialTerms', 
    filePath: 'initialTerms/2025-06-29T18-41-43-118Z_test-initial-terms-template.pdf',
    fileName: 'test-initial-terms-template.pdf'
  },
  {
    templateType: 'depositInvoice',
    filePath: 'depositInvoice/2025-06-29T18-50-54-001Z_remaining_balance_invoice_-_template.pdf',
    fileName: 'remaining_balance_invoice_-_template.pdf'
  },
  {
    templateType: 'balanceInvoice',
    filePath: 'balanceInvoice/2025-06-29T18-52-11-168Z_remaining_balance_invoice_-_template.pdf',
    fileName: 'remaining_balance_invoice_-_template.pdf'
  }
]

/**
 * Test the listTemplates function behavior
 */
async function testListTemplates() {
  console.log('\n📋 Testing listTemplates() function:')
  console.log('====================================')
  
  try {
    // First check database
    const { data: dbTemplates, error: dbError } = await supabase
      .from('form_templates')
      .select('*')
      .eq('is_active', true)

    console.log('🗄️  Database query result:')
    if (dbError) {
      console.log(`   ❌ Error: ${dbError.message}`)
    } else {
      console.log(`   ✅ Records found: ${dbTemplates?.length || 0}`)
    }

    // Since database is empty, should fall back to storage listing
    console.log('\n📁 Storage fallback query:')
    
    const { data: storageFiles, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: 100,
        offset: 0
      })

    if (listError) {
      console.log(`   ❌ Storage list error: ${listError.message}`)
    } else {
      console.log(`   ✅ Storage files found: ${storageFiles?.length || 0}`)
      
      storageFiles?.forEach((file, i) => {
        console.log(`      ${i + 1}. ${file.name} (${file.id ? 'file' : 'folder'})`)
      })
    }

    // The issue: the storage list returns folders, not files
    // The service tries to extract template type from folder names
    // But it should list files within folders
    
  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

/**
 * Test download operations with actual file paths
 */
async function testDownloadOperations() {
  console.log('\n📥 Testing Download Operations:')
  console.log('===============================')
  
  for (const file of currentFiles) {
    console.log(`\n📄 Testing: ${file.templateType}`)
    console.log(`   📁 Path: ${file.filePath}`)
    
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(file.filePath)

      if (error) {
        console.log(`   ❌ Download failed: ${error.message}`)
      } else {
        console.log(`   ✅ Download successful: ${data.size} bytes, ${data.type}`)
      }
    } catch (error) {
      console.log(`   💥 Download error: ${error.message}`)
    }
  }
}

/**
 * Test what happens when we try wrong paths
 */
async function testWrongPaths() {
  console.log('\n❌ Testing Download with Wrong Paths:')
  console.log('====================================')
  
  const wrongPaths = [
    'contract',  // folder name instead of file path
    'contract/',  // folder with slash
    'nonexistent.pdf',  // completely wrong
    'contract/nonexistent.pdf'  // wrong file in right folder
  ]
  
  for (const wrongPath of wrongPaths) {
    console.log(`\n📁 Testing wrong path: "${wrongPath}"`)
    
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(wrongPath)

      if (error) {
        console.log(`   ❌ Expected failure: ${error.message}`)
      } else {
        console.log(`   😱 Unexpected success: ${data.size} bytes`)
      }
    } catch (error) {
      console.log(`   ❌ Expected error: ${error.message}`)
    }
  }
}

/**
 * Create database records for existing files
 */
async function createMissingDatabaseRecords() {
  console.log('\n💾 Creating Missing Database Records:')
  console.log('====================================')
  
  for (const file of currentFiles) {
    console.log(`\n📝 Creating record for: ${file.templateType}`)
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(file.filePath)
    
    const templateMetadata = {
      template_type: file.templateType,
      file_name: file.fileName,
      file_path: file.filePath,
      file_url: publicUrl,
      file_size: 0, // We'd need to download to get actual size
      file_type: 'application/pdf',
      version: 1,
      uploaded_at: new Date().toISOString(),
      is_active: true
    }
    
    try {
      const { error } = await supabase
        .from('form_templates')
        .upsert(templateMetadata, {
          onConflict: 'template_type',
          ignoreDuplicates: false
        })

      if (error) {
        console.log(`   ❌ Database insert failed: ${error.message}`)
      } else {
        console.log(`   ✅ Database record created`)
      }
    } catch (error) {
      console.log(`   💥 Database error: ${error.message}`)
    }
  }
}

/**
 * Test delete operations
 */
async function testDeleteOperations() {
  console.log('\n🗑️  Testing Delete Operations:')
  console.log('==============================')
  
  // Let's test delete on one file (the test contract which is small)
  const testFile = currentFiles.find(f => f.templateType === 'contract')
  
  if (testFile) {
    console.log(`\n🎯 Testing delete on: ${testFile.filePath}`)
    
    // First verify file exists
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(testFile.filePath)

      if (error) {
        console.log(`   ⚠️  File doesn't exist for deletion test: ${error.message}`)
        return
      }
      
      console.log(`   ✅ File confirmed to exist (${data.size} bytes)`)
      
      // Now test delete
      console.log(`   🗑️  Attempting delete...`)
      
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([testFile.filePath])

      if (deleteError) {
        console.log(`   ❌ Delete failed: ${deleteError.message}`)
      } else {
        console.log(`   ✅ Delete successful`)
        
        // Verify deletion
        const { data: verifyData, error: verifyError } = await supabase.storage
          .from(bucketName)
          .download(testFile.filePath)

        if (verifyError) {
          console.log(`   ✅ Deletion verified: file no longer exists`)
        } else {
          console.log(`   ⚠️  File still exists after deletion!`)
        }
      }
      
    } catch (error) {
      console.log(`   💥 Delete test error: ${error.message}`)
    }
  }
}

/**
 * Main test function
 */
async function main() {
  try {
    await testListTemplates()
    await testDownloadOperations()
    await testWrongPaths()
    
    console.log('\n' + '='.repeat(50))
    console.log('📊 ANALYSIS SUMMARY')
    console.log('='.repeat(50))
    console.log()
    console.log('🔍 ISSUES IDENTIFIED:')
    console.log('1. Database table is empty - no records for existing files')
    console.log('2. listTemplates() returns folder names, not actual file paths')
    console.log('3. Download/delete operations need full file paths, not just folder names')
    console.log('4. Service expects database records but falls back to storage incorrectly')
    console.log()
    console.log('💡 SOLUTIONS NEEDED:')
    console.log('1. Fix listTemplates() to properly explore folder structure')
    console.log('2. Create database records for existing files')
    console.log('3. Fix path handling in download/delete operations')
    console.log('4. Ensure upload process properly saves to database')
    console.log()
    
    // Ask user if they want to create database records
    console.log('🤔 Would you like to create database records for existing files?')
    console.log('   This will help sync the database with storage.')
    console.log('   (Uncomment the next line to proceed)')
    // await createMissingDatabaseRecords()
    
    console.log('\n🧪 Test complete!')
    
  } catch (error) {
    console.error('💥 Test suite failed:', error)
  }
}

main()