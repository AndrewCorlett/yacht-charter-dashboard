import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kbwjtihjyhapaclyytxn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtid2p0aWhqeWhhcGFjbHl5dHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzIxMjksImV4cCI6MjA2NjUwODEyOX0.i6vbPAhTkfwInLnvfmNDblUNdEF4Y-r0jzXMiKUZtqI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSpecificDelete() {
  try {
    const fileToDelete = 'testDelete/2025-06-29T18-57-31-374Z_test-template.pdf'
    
    console.log(`🗑️ Attempting to delete: ${fileToDelete}`)
    
    const { data, error } = await supabase.storage
      .from('form-templates')
      .remove([fileToDelete])
    
    if (error) {
      console.error('❌ Delete error:', error)
      return
    }
    
    console.log('✅ Delete response:', data)
    
    // Verify by checking if file still exists in database
    const { data: checkData, error: checkError } = await supabase
      .from('storage.objects')
      .select('name')
      .eq('bucket_id', 'form-templates')
      .eq('name', fileToDelete)
    
    console.log('File check result:', checkData)
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testSpecificDelete()