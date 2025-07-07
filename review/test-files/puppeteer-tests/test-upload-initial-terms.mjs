import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://kbwjtihjyhapaclyytxn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtid2p0aWhqeWhhcGFjbHl5dHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzIxMjksImV4cCI6MjA2NjUwODEyOX0.i6vbPAhTkfwInLnvfmNDblUNdEF4Y-r0jzXMiKUZtqI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testInitialTermsUpload() {
  try {
    console.log('Testing Initial Terms template upload...')
    
    // Read the test PDF file
    const filePath = '/home/andrew/projects/active/Seascape-op/test-initial-terms-template.pdf'
    const fileBuffer = fs.readFileSync(filePath)
    const fileName = 'test-initial-terms-template.pdf'
    
    // Generate file path for initial terms
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const uploadPath = `initialTerms/${timestamp}_${fileName}`
    
    console.log('Uploading Initial Terms to path:', uploadPath)
    
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
    console.log('✅ Initial Terms template uploaded successfully')
    
    return {
      success: true,
      filePath: uploadPath,
      publicUrl,
      fileName
    }
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testInitialTermsUpload()