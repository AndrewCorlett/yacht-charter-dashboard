import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://kbwjtihjyhapaclyytxn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtid2p0aWhqeWhhcGFjbHl5dHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzIxMjksImV4cCI6MjA2NjUwODEyOX0.i6vbPAhTkfwInLnvfmNDblUNdEF4Y-r0jzXMiKUZtqI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

class FormsTemplateService {
  constructor() {
    this.bucketName = 'form-templates'
  }

  async uploadTemplate(templateType, file) {
    console.log(`📤 Uploading ${templateType} template...`)
    
    // Generate file path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filePath = `${templateType}/${timestamp}_test-template.pdf`
    
    // Upload to storage
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: 'application/pdf'
      })
    
    if (error) throw error
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath)
    
    // Save metadata to database
    const templateMetadata = {
      template_type: templateType,
      file_name: `test-template.pdf`,
      file_path: filePath,
      file_url: publicUrl,
      file_size: file.length,
      file_type: 'application/pdf',
      version: 1,
      uploaded_at: new Date().toISOString(),
      is_active: true
    }
    
    const { error: dbError } = await supabase
      .from('form_templates')
      .upsert(templateMetadata, {
        onConflict: 'template_type',
        ignoreDuplicates: false
      })
    
    if (dbError) {
      console.error('Database save error:', dbError)
      throw dbError
    }
    
    console.log(`✅ Upload successful: ${filePath}`)
    return { filePath, templateType, publicUrl }
  }
  
  async deleteTemplate(templateType, filePath) {
    console.log(`🗑️ Deleting ${templateType} template at ${filePath}...`)
    
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(this.bucketName)
      .remove([filePath])
    
    if (storageError) {
      console.error('Storage delete error:', storageError)
      throw storageError
    }
    
    // Delete from database
    const { error: dbError } = await supabase
      .from('form_templates')
      .delete()
      .eq('template_type', templateType)
    
    if (dbError) {
      console.error('Database delete error:', dbError)
      throw dbError
    }
    
    console.log(`✅ Delete successful: ${templateType}`)
    return true
  }
  
  async listTemplates() {
    console.log('📋 Listing templates...')
    
    // Get from database
    const { data: dbTemplates, error: dbError } = await supabase
      .from('form_templates')
      .select('*')
      .eq('is_active', true)
    
    if (dbError) throw dbError
    
    console.log(`Found ${dbTemplates.length} templates in database`)
    
    // Get from storage
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from(this.bucketName)
      .list('', { limit: 100 })
    
    if (storageError) throw storageError
    
    const actualFiles = storageFiles.filter(f => f.name !== '.emptyFolderPlaceholder')
    console.log(`Found ${actualFiles.length} files in storage`)
    
    return { dbTemplates, storageFiles: actualFiles }
  }
}

async function testUploadDeleteCycle() {
  const service = new FormsTemplateService()
  
  try {
    console.log('🧪 Testing upload/delete cycle...\n')
    
    // Create test file
    const testFile = Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj  
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 50 >>
stream
BT /F1 12 Tf 100 700 Td (Test Delete Template) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000199 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
295
%%EOF`)
    
    // Step 1: Upload template
    console.log('STEP 1: Upload template')
    const uploadResult = await service.uploadTemplate('testDelete', testFile)
    
    // Step 2: Verify it exists
    console.log('\nSTEP 2: Verify upload')
    let listing = await service.listTemplates()
    const foundInDb = listing.dbTemplates.find(t => t.template_type === 'testDelete')
    const foundInStorage = listing.storageFiles.find(f => f.name.includes('testDelete'))
    
    console.log(`Database record found: ${!!foundInDb}`)
    console.log(`Storage file found: ${!!foundInStorage}`)
    
    if (!foundInDb || !foundInStorage) {
      throw new Error('Template not properly uploaded')
    }
    
    // Step 3: Delete template
    console.log('\nSTEP 3: Delete template')
    await service.deleteTemplate('testDelete', uploadResult.filePath)
    
    // Step 4: Verify it's gone
    console.log('\nSTEP 4: Verify deletion')
    listing = await service.listTemplates()
    const stillInDb = listing.dbTemplates.find(t => t.template_type === 'testDelete')
    const stillInStorage = listing.storageFiles.find(f => f.name.includes('testDelete'))
    
    console.log(`Database record still exists: ${!!stillInDb}`)
    console.log(`Storage file still exists: ${!!stillInStorage}`)
    
    if (stillInDb || stillInStorage) {
      console.log('❌ DELETE FAILED - template still exists')
      return false
    } else {
      console.log('✅ DELETE SUCCESSFUL - template completely removed')
      return true
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}

testUploadDeleteCycle()