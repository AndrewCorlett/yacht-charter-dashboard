import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://kbwjtihjyhapaclyytxn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtid2p0aWhqeWhhcGFjbHl5dHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzIxMjksImV4cCI6MjA2NjUwODEyOX0.i6vbPAhTkfwInLnvfmNDblUNdEF4Y-r0jzXMiKUZtqI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDownloadAndVerify() {
  try {
    console.log('Testing download and verification...')
    
    // List all files to see what we have
    const { data: files, error: listError } = await supabase.storage
      .from('form-templates')
      .list('', { limit: 100 })
    
    if (listError) {
      console.error('List error:', listError)
      return
    }
    
    console.log('Available files:')
    files.forEach(file => {
      console.log(`- ${file.name} (${file.metadata?.size || 0} bytes)`)
    })
    
    // Test downloading both files
    const testFiles = [
      'contract/2025-06-29T18-37-28-160Z_test-contract-template.pdf',
      'initialTerms/2025-06-29T18-41-43-118Z_test-initial-terms-template.pdf'
    ]
    
    for (const filePath of testFiles) {
      console.log(`\nTesting download of: ${filePath}`)
      
      try {
        // Download from Supabase
        const { data: downloadData, error: downloadError } = await supabase.storage
          .from('form-templates')
          .download(filePath)
        
        if (downloadError) {
          console.error('Download error:', downloadError)
          continue
        }
        
        console.log(`✅ Downloaded successfully (${downloadData.size} bytes)`)
        
        // Save to local file for verification
        const downloadBuffer = Buffer.from(await downloadData.arrayBuffer())
        const localPath = `/home/andrew/projects/active/Seascape-op/downloaded-${filePath.split('/')[1]}`
        fs.writeFileSync(localPath, downloadBuffer)
        console.log(`💾 Saved to: ${localPath}`)
        
        // Verify file integrity by comparing with original if it exists
        const originalPath = `/home/andrew/projects/active/Seascape-op/${filePath.split('/')[1]}`
        if (fs.existsSync(originalPath)) {
          const originalBuffer = fs.readFileSync(originalPath)
          const matches = originalBuffer.equals(downloadBuffer)
          console.log(`🔍 File integrity check: ${matches ? 'PASSED' : 'FAILED'}`)
        } else {
          console.log('🔍 Original file not found, cannot verify integrity')
        }
        
      } catch (error) {
        console.error(`Error downloading ${filePath}:`, error.message)
      }
    }
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testDownloadAndVerify()