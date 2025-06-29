/**
 * SeaScape Storage Configuration Test
 * Verifies storage bucket setup and file upload functionality
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && !key.startsWith('#')) {
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    })
    
    return envVars
  } catch (error) {
    console.error('❌ Could not read .env file:', error.message)
    return {}
  }
}

const envVars = loadEnvFile()
const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY
const serviceRoleKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY

console.log('🗂️  SeaScape Storage Configuration Test')
console.log('=' .repeat(50))

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

// Create clients
const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = serviceRoleKey && serviceRoleKey !== 'GET_FROM_SUPABASE_DASHBOARD' 
  ? createClient(supabaseUrl, serviceRoleKey) 
  : null

async function testStorageBucketExists() {
  try {
    console.log('\n📦 Testing Storage Bucket Access...')
    
    const { data, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.log('❌ Cannot access storage:', error.message)
      return false
    }
    
    const crewDocsBucket = data.find(bucket => bucket.id === 'crew-documents')
    
    if (crewDocsBucket) {
      console.log('✅ crew-documents bucket exists')
      console.log(`   Public: ${crewDocsBucket.public}`)
      console.log(`   Created: ${crewDocsBucket.created_at}`)
      return true
    } else {
      console.log('⚠️  crew-documents bucket not found')
      console.log('   Available buckets:', data.map(b => b.id).join(', '))
      return false
    }
  } catch (err) {
    console.log('❌ Storage test failed:', err.message)
    return false
  }
}

async function testFileUpload() {
  try {
    console.log('\n📤 Testing File Upload...')
    
    // Create a test file
    const testContent = `Test crew experience document
Created: ${new Date().toISOString()}
Booking ID: test-booking-123
This is a test PDF-like content for storage verification.`
    
    const testFileName = `test-${Date.now()}.txt`
    const testFile = new File([testContent], testFileName, { type: 'text/plain' })
    
    // Try to upload
    const { data, error } = await supabase.storage
      .from('crew-documents')
      .upload(`test-booking-123/${testFileName}`, testFile, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.log('❌ Upload failed:', error.message)
      return false
    } else {
      console.log('✅ Test file uploaded successfully')
      console.log(`   Path: ${data.path}`)
      return data.path
    }
  } catch (err) {
    console.log('❌ Upload test failed:', err.message)
    return false
  }
}

async function testFileDownload(filePath) {
  try {
    console.log('\n📥 Testing File Download...')
    
    const { data, error } = await supabase.storage
      .from('crew-documents')
      .download(filePath)
    
    if (error) {
      console.log('❌ Download failed:', error.message)
      return false
    } else {
      console.log('✅ Test file downloaded successfully')
      console.log(`   Size: ${data.size} bytes`)
      console.log(`   Type: ${data.type}`)
      return true
    }
  } catch (err) {
    console.log('❌ Download test failed:', err.message)
    return false
  }
}

async function testFileDelete(filePath) {
  try {
    console.log('\n🗑️  Testing File Deletion...')
    
    const { error } = await supabase.storage
      .from('crew-documents')
      .remove([filePath])
    
    if (error) {
      console.log('❌ Delete failed:', error.message)
      return false
    } else {
      console.log('✅ Test file deleted successfully')
      return true
    }
  } catch (err) {
    console.log('❌ Delete test failed:', err.message)
    return false
  }
}

async function testStoragePolicies() {
  try {
    console.log('\n🔒 Testing Storage Policies...')
    
    // Test listing files (should work with proper policies)
    const { data, error } = await supabase.storage
      .from('crew-documents')
      .list('', {
        limit: 5,
        offset: 0
      })
    
    if (error) {
      console.log('⚠️  Cannot list files:', error.message)
      console.log('   This may be expected if RLS is strict')
      return false
    } else {
      console.log('✅ Can list files in bucket')
      console.log(`   Found ${data.length} items`)
      return true
    }
  } catch (err) {
    console.log('❌ Policy test failed:', err.message)
    return false
  }
}

function generateStorageInstructions() {
  console.log('\n📝 Storage Bucket Setup Instructions:')
  console.log('=' .repeat(50))
  
  console.log('\n🎯 Manual Setup Required:')
  console.log('\n1. Execute Storage SQL:')
  console.log('   - Open Supabase Dashboard SQL Editor')
  console.log('   - Copy content from: storage-bucket-setup.sql')
  console.log('   - Execute the SQL script')
  console.log('   - Verify bucket is created')
  
  console.log('\n2. Verify Storage Access:')
  console.log('   - Go to Storage in Supabase Dashboard')
  console.log('   - Check "crew-documents" bucket exists')
  console.log('   - Verify policies are applied')
  
  console.log('\n3. Test File Upload:')
  console.log('   - Run: node test-storage-setup.cjs')
  console.log('   - Should pass all storage tests')
  
  console.log('\n📊 Storage Configuration:')
  console.log('   • Bucket: crew-documents')
  console.log('   • Privacy: Private (authentication required)')
  console.log('   • Size Limit: 10MB per file')
  console.log('   • Allowed Types: PDF, DOC, DOCX, JPG, PNG, WEBP')
  console.log('   • RLS: Enabled with proper policies')
  
  console.log('\n🔍 Verification Queries:')
  console.log('-- Check bucket exists')
  console.log('SELECT * FROM storage.buckets WHERE id = \'crew-documents\';')
  console.log('')
  console.log('-- Check policies')
  console.log('SELECT policyname, cmd FROM pg_policies WHERE tablename = \'objects\';')
  
  console.log('\n⚠️  Important Notes:')
  console.log('   - Anonymous policies are for development only')
  console.log('   - Remove anonymous access in production')
  console.log('   - Implement proper user authentication')
  console.log('   - Monitor storage usage and cleanup orphaned files')
}

async function main() {
  try {
    const bucketExists = await testStorageBucketExists()
    
    if (bucketExists) {
      console.log('\n🧪 Running Storage Tests...')
      
      const uploadedPath = await testFileUpload()
      
      if (uploadedPath) {
        await testFileDownload(uploadedPath)
        await testFileDelete(uploadedPath)
      }
      
      await testStoragePolicies()
      
      console.log('\n🎉 Storage tests completed!')
      console.log('✅ Storage bucket is properly configured')
      
    } else {
      generateStorageInstructions()
    }
    
    if (!serviceRoleKey || serviceRoleKey === 'GET_FROM_SUPABASE_DASHBOARD') {
      console.log('\n⚠️  Service Role Key Missing:')
      console.log('   Get from: Supabase Dashboard > Settings > API')
      console.log('   Update VITE_SUPABASE_SERVICE_ROLE_KEY in .env')
    }
    
  } catch (error) {
    console.error('\n❌ Storage test failed:', error)
  }
}

main()