import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kbwjtihjyhapaclyytxn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtid2p0aWhqeWhhcGFjbHl5dHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzIxMjksImV4cCI6MjA2NjUwODEyOX0.i6vbPAhTkfwInLnvfmNDblUNdEF4Y-r0jzXMiKUZtqI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testStorageDelete() {
  try {
    console.log('🔍 Listing current storage files...')
    
    const { data: files, error: listError } = await supabase.storage
      .from('form-templates')
      .list('', { limit: 100 })
    
    if (listError) {
      console.error('List error:', listError)
      return
    }
    
    console.log('Files in storage:')
    files.forEach(file => {
      if (file.name !== '.emptyFolderPlaceholder') {
        console.log(`- ${file.name} (${file.metadata?.size || 0} bytes)`)
      }
    })
    
    // Find a testDelete file to delete
    const testFile = files.find(f => f.name.includes('testDelete'))
    if (!testFile) {
      console.log('❌ No testDelete file found to test with')
      return
    }
    
    console.log(`\n🗑️ Attempting to delete: ${testFile.name}`)
    
    const { data, error } = await supabase.storage
      .from('form-templates')
      .remove([testFile.name])
    
    if (error) {
      console.error('❌ Delete error:', error)
      return
    }
    
    console.log('✅ Delete response:', data)
    
    // Verify deletion
    console.log('\n🔍 Verifying deletion...')
    const { data: filesAfter, error: listError2 } = await supabase.storage
      .from('form-templates')
      .list('', { limit: 100 })
    
    if (listError2) {
      console.error('List error after delete:', listError2)
      return
    }
    
    const stillExists = filesAfter.find(f => f.name === testFile.name)
    console.log(`File still exists: ${!!stillExists}`)
    
    if (!stillExists) {
      console.log('✅ Storage delete successful!')
    } else {
      console.log('❌ Storage delete failed - file still exists')
    }
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testStorageDelete()