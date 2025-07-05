import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://kbwjtihjyhapaclyytxn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtid2p0aWhqeWhhcGFjbHl5dHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzIxMjksImV4cCI6MjA2NjUwODEyOX0.i6vbPAhTkfwInLnvfmNDblUNdEF4Y-r0jzXMiKUZtqI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testUpload() {
  try {
    console.log('Testing form template upload...')
    
    // Read the test PDF file
    const filePath = '/home/andrew/projects/active/Seascape-op/test-contract-template.pdf'
    const fileBuffer = fs.readFileSync(filePath)
    const fileName = 'test-contract-template.pdf'
    
    // Generate file path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const uploadPath = `contract/${timestamp}_${fileName}`
    
    console.log('Uploading to path:', uploadPath)
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('form-templates')
      .upload(uploadPath, fileBuffer, {
        cacheControl: '3600',
        contentType: 'application/pdf'
      })
    
    if (error) {
      console.error('Upload error:', error)
      return
    }
    
    console.log('Upload successful:', data)
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('form-templates')
      .getPublicUrl(uploadPath)
    
    console.log('Public URL:', publicUrl)
    
    // Test download
    console.log('Testing download...')
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('form-templates')
      .download(uploadPath)
    
    if (downloadError) {
      console.error('Download error:', downloadError)
      return
    }
    
    console.log('Download successful, file size:', downloadData.size)
    
    // Save downloaded file
    const downloadBuffer = Buffer.from(await downloadData.arrayBuffer())
    const downloadPath = '/home/andrew/projects/active/Seascape-op/downloaded-test-template.pdf'
    fs.writeFileSync(downloadPath, downloadBuffer)
    console.log('Downloaded file saved to:', downloadPath)
    
    // Compare files
    const originalBuffer = fs.readFileSync(filePath)
    const downloadedBuffer = fs.readFileSync(downloadPath)
    
    const filesMatch = originalBuffer.equals(downloadedBuffer)
    console.log('Files match:', filesMatch)
    
    if (filesMatch) {
      console.log('✅ Upload/Download test PASSED')
    } else {
      console.log('❌ Upload/Download test FAILED - files do not match')
    }
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testUpload()