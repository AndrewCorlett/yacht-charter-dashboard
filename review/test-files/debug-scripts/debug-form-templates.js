#!/usr/bin/env node

/**
 * Form Templates Debug Script
 * 
 * This script debugs the form template storage issues by:
 * 1. Listing actual files in the storage bucket
 * 2. Comparing storage contents with database records
 * 3. Testing download and delete operations
 * 4. Identifying path mismatches
 */

import { createClient } from '@supabase/supabase-js'

// Supabase configuration (using the .env.local values)
const supabaseUrl = 'https://kbwjtihjyhapaclyytxn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtid2p0aWhqeWhhcGFjbHl5dHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzIxMjksImV4cCI6MjA2NjUwODEyOX0.i6vbPAhTkfwInLnvfmNDblUNdEF4Y-r0jzXMiKUZtqI'
const bucketName = 'form-templates'

console.log('🔍 Form Templates Debug Tool')
console.log('=============================')
console.log(`📍 Bucket: ${bucketName}`)
console.log(`🔗 URL: ${supabaseUrl}`)
console.log()

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * List all files in the storage bucket
 */
async function listStorageFiles() {
  console.log('📁 Listing Storage Bucket Contents:')
  console.log('-----------------------------------')
  
  try {
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error('❌ Storage list error:', error)
      return []
    }

    if (!files || files.length === 0) {
      console.log('📂 Storage bucket is empty')
      return []
    }

    files.forEach((file, index) => {
      console.log(`${index + 1}. 📄 ${file.name}`)
      console.log(`   📏 Size: ${file.metadata?.size || 'unknown'} bytes`)
      console.log(`   📅 Created: ${file.created_at || 'unknown'}`)
      console.log(`   🔗 ID: ${file.id || 'unknown'}`)
      console.log()
    })

    return files
  } catch (error) {
    console.error('💥 Storage listing failed:', error)
    return []
  }
}

/**
 * List all database records
 */
async function listDatabaseRecords() {
  console.log('🗄️  Database Records:')
  console.log('---------------------')
  
  try {
    const { data: records, error } = await supabase
      .from('form_templates')
      .select('*')
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('❌ Database query error:', error)
      return []
    }

    if (!records || records.length === 0) {
      console.log('📦 Database table is empty')
      return []
    }

    records.forEach((record, index) => {
      console.log(`${index + 1}. 📑 Template: ${record.template_type}`)
      console.log(`   📄 File: ${record.file_name}`)
      console.log(`   📁 Path: ${record.file_path}`)
      console.log(`   🔗 URL: ${record.file_url}`)
      console.log(`   📅 Uploaded: ${record.uploaded_at}`)
      console.log(`   🔢 Version: ${record.version}`)
      console.log(`   ✅ Active: ${record.is_active}`)
      console.log()
    })

    return records
  } catch (error) {
    console.error('💥 Database query failed:', error)
    return []
  }
}

/**
 * Test file download by path
 */
async function testDownload(filePath) {
  console.log(`📥 Testing Download: ${filePath}`)
  console.log('------------------------------------')
  
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath)

    if (error) {
      console.error(`❌ Download failed: ${error.message}`)
      return false
    }

    console.log(`✅ Download successful!`)
    console.log(`   📏 Size: ${data.size} bytes`)
    console.log(`   🗂️  Type: ${data.type}`)
    return true
  } catch (error) {
    console.error(`💥 Download error: ${error.message}`)
    return false
  }
}

/**
 * Test file deletion by path
 */
async function testDelete(filePath) {
  console.log(`🗑️  Testing Delete: ${filePath}`)
  console.log('-----------------------------------')
  
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      console.error(`❌ Delete failed: ${error.message}`)
      return false
    }

    console.log(`✅ Delete successful!`)
    return true
  } catch (error) {
    console.error(`💥 Delete error: ${error.message}`)
    return false
  }
}

/**
 * Compare storage and database
 */
async function compareStorageAndDatabase(storageFiles, dbRecords) {
  console.log('🔍 Storage vs Database Comparison:')
  console.log('----------------------------------')
  
  const storageFilePaths = storageFiles.map(f => f.name)
  const dbFilePaths = dbRecords.map(r => r.file_path)
  
  console.log(`📁 Storage files (${storageFiles.length}):`)
  storageFilePaths.forEach((path, i) => {
    console.log(`   ${i + 1}. ${path}`)
  })
  
  console.log(`\n🗄️  Database paths (${dbRecords.length}):`)
  dbFilePaths.forEach((path, i) => {
    console.log(`   ${i + 1}. ${path}`)
  })
  
  // Find mismatches
  const orphanedStorage = storageFilePaths.filter(path => !dbFilePaths.includes(path))
  const orphanedDatabase = dbFilePaths.filter(path => !storageFilePaths.includes(path))
  
  if (orphanedStorage.length > 0) {
    console.log(`\n⚠️  Files in storage but NOT in database (${orphanedStorage.length}):`)
    orphanedStorage.forEach((path, i) => {
      console.log(`   ${i + 1}. ${path}`)
    })
  }
  
  if (orphanedDatabase.length > 0) {
    console.log(`\n⚠️  Files in database but NOT in storage (${orphanedDatabase.length}):`)
    orphanedDatabase.forEach((path, i) => {
      console.log(`   ${i + 1}. ${path}`)
    })
  }
  
  if (orphanedStorage.length === 0 && orphanedDatabase.length === 0) {
    console.log(`\n✅ Storage and database are in sync!`)
  }
}

/**
 * Test bucket permissions
 */
async function testBucketPermissions() {
  console.log('🔐 Testing Bucket Permissions:')
  console.log('------------------------------')
  
  try {
    // Test list permission
    const { data: listData, error: listError } = await supabase.storage
      .from(bucketName)
      .list('')
    
    if (listError) {
      console.error(`❌ List permission denied: ${listError.message}`)
    } else {
      console.log(`✅ List permission: OK`)
    }
    
    // Test upload permission with a small test file
    const testFile = new Blob(['test content'], { type: 'text/plain' })
    const testPath = `test/permissions-test-${Date.now()}.txt`
    
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testPath, testFile)
    
    if (uploadError) {
      console.error(`❌ Upload permission denied: ${uploadError.message}`)
    } else {
      console.log(`✅ Upload permission: OK`)
      
      // Clean up test file
      await supabase.storage
        .from(bucketName)
        .remove([testPath])
    }
    
  } catch (error) {
    console.error('💥 Permission test failed:', error)
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Test bucket permissions first
    await testBucketPermissions()
    console.log()
    
    // Get current state
    const storageFiles = await listStorageFiles()
    const dbRecords = await listDatabaseRecords()
    
    // Compare them
    await compareStorageAndDatabase(storageFiles, dbRecords)
    console.log()
    
    // Test operations on existing files
    if (storageFiles.length > 0) {
      console.log('🧪 Testing Operations on Existing Files:')
      console.log('========================================')
      
      for (const file of storageFiles.slice(0, 2)) { // Test first 2 files
        console.log()
        await testDownload(file.name)
        
        // Only test delete if user confirms (commented out for safety)
        // console.log()
        // await testDelete(file.name)
      }
    }
    
    // Test operations on database paths
    if (dbRecords.length > 0) {
      console.log('\n🧪 Testing Operations on Database Paths:')
      console.log('=========================================')
      
      for (const record of dbRecords.slice(0, 2)) { // Test first 2 records
        console.log()
        await testDownload(record.file_path)
      }
    }
    
    console.log('\n✨ Debugging complete!')
    console.log('\n💡 Analysis Summary:')
    console.log('===================')
    console.log(`📁 Storage files: ${storageFiles.length}`)
    console.log(`🗄️  Database records: ${dbRecords.length}`)
    
    if (storageFiles.length === 0 && dbRecords.length === 0) {
      console.log('📝 Recommendation: Both storage and database are empty. Upload a test file to begin troubleshooting.')
    } else if (storageFiles.length > 0 && dbRecords.length === 0) {
      console.log('📝 Recommendation: Files exist in storage but not in database. Database sync may have failed during upload.')
    } else if (storageFiles.length === 0 && dbRecords.length > 0) {
      console.log('📝 Recommendation: Database has records but storage is empty. Files may have been deleted externally.')
    } else {
      console.log('📝 Recommendation: Check file path mismatches between storage and database.')
    }
    
  } catch (error) {
    console.error('💥 Main execution failed:', error)
  }
}

// Run the debug script
main()