/**
 * Forms Template Service
 * Handles form template uploads to Supabase Storage
 * Manages template files, metadata, and versioning
 */

import { supabase, supabaseConfig, TABLES } from './supabaseClient.js'

class FormsTemplateService {
  constructor() {
    this.bucketName = 'form-templates'
    this.maxFileSize = 10 * 1024 * 1024 // 10MB
    this.allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    this.allowedExtensions = ['.pdf', '.doc', '.docx']
  }

  /**
   * Upload form template
   * @param {string} templateType - Type of template (contract, initialTerms, etc.)
   * @param {File} file - File to upload
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadTemplate(templateType, file, options = {}) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      // Validate file
      const validation = this.validateFile(file)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      // Generate secure file path
      const filePath = this.generateFilePath(templateType, file.name)

      // Upload to storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: options.upsert || false,
          contentType: file.type
        })

      if (error) {
        console.error('Template upload error:', error)
        throw new Error(error.message || 'Template upload failed')
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath)

      // Save template metadata to database (if form_templates table exists)
      const templateMetadata = {
        template_type: templateType,
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        version: 1,
        uploaded_at: new Date().toISOString(),
        is_active: true
      }

      // Try to save to database, but don't fail if table doesn't exist
      try {
        const { error: dbError } = await supabase
          .from('form_templates')
          .upsert(templateMetadata, {
            onConflict: 'template_type',
            ignoreDuplicates: false
          })

        if (dbError) {
          console.warn('Database save failed, continuing with storage only:', dbError)
        }
      } catch (dbError) {
        console.warn('form_templates table may not exist, continuing with storage only')
      }

      return {
        success: true,
        templateType,
        filePath: data.path,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        publicUrl: publicUrl,
        uploadedAt: templateMetadata.uploaded_at,
        version: 1
      }
    } catch (error) {
      console.error('Upload template error:', error)
      throw error
    }
  }

  /**
   * Download template
   * @param {string} filePath - File path in storage
   * @returns {Promise<Blob>} File blob
   */
  async downloadTemplate(filePath) {
    if (!supabase) throw new Error('Supabase not initialized')
    if (!filePath) throw new Error('File path is required')

    console.log(`[FormsTemplateService] Attempting to download: "${filePath}"`)

    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(filePath)

      if (error) {
        console.error('Template download error:', {
          filePath,
          error,
          bucketName: this.bucketName
        })
        throw new Error(`Template download failed: ${error.message || 'Unknown error'}`)
      }

      console.log(`[FormsTemplateService] Download successful: ${data.size} bytes, ${data.type}`)
      return data
    } catch (error) {
      console.error('Download template error:', {
        filePath,
        error: error.message,
        bucketName: this.bucketName
      })
      throw error
    }
  }

  /**
   * Delete template
   * @param {string} templateType - Template type
   * @param {string} filePath - File path in storage
   * @returns {Promise<boolean>} Success status
   */
  async deleteTemplate(templateType, filePath) {
    if (!supabase) throw new Error('Supabase not initialized')
    if (!templateType) throw new Error('Template type is required')
    if (!filePath) throw new Error('File path is required')

    console.log(`[FormsTemplateService] Deleting template: ${templateType}, path: "${filePath}"`)

    try {
      // Delete from database first
      const { error: dbError } = await supabase
        .from('form_templates')
        .delete()
        .eq('template_type', templateType)

      if (dbError) {
        console.warn('Database delete failed:', dbError)
        // Continue with storage deletion even if database fails
      } else {
        console.log(`[FormsTemplateService] Database record deleted for ${templateType}`)
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath])

      if (storageError) {
        console.error('Template storage delete error:', {
          templateType,
          filePath,
          error: storageError
        })
        throw new Error(`Storage deletion failed: ${storageError.message || 'Unknown error'}`)
      }

      console.log(`[FormsTemplateService] Storage file deleted: ${filePath}`)
      return true
    } catch (error) {
      console.error('Delete template error:', {
        templateType,
        filePath,
        error: error.message
      })
      throw error
    }
  }

  /**
   * List all templates
   * @returns {Promise<Object>} Templates organized by type
   */
  async listTemplates() {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      // Try to get from database first
      let templatesFromDb = {}
      try {
        const { data: dbTemplates, error: dbError } = await supabase
          .from('form_templates')
          .select('*')
          .eq('is_active', true)

        if (!dbError && dbTemplates) {
          templatesFromDb = dbTemplates.reduce((acc, template) => {
            acc[template.template_type] = {
              name: template.file_name,
              size: template.file_size,
              type: template.file_type,
              url: template.file_url,
              filePath: template.file_path,
              uploadedAt: template.uploaded_at,
              version: template.version
            }
            return acc
          }, {})
        }
      } catch (dbError) {
        console.warn('Database query failed, falling back to storage listing')
      }

      // If we have database data, return it
      if (Object.keys(templatesFromDb).length > 0) {
        return templatesFromDb
      }

      // Fall back to storage listing - explore folders
      console.log('[FormsTemplateService] Database empty, falling back to storage exploration')
      
      const { data: storageItems, error: listError } = await supabase.storage
        .from(this.bucketName)
        .list('', {
          limit: 100,
          offset: 0
        })

      if (listError) {
        console.error('Storage list error:', listError)
        return {}
      }

      // Explore folders to find actual files
      const templates = {}
      const templateFolders = ['contract', 'initialTerms', 'depositInvoice', 'depositReceipt', 'balanceInvoice']
      
      for (const folderName of templateFolders) {
        try {
          const { data: folderFiles, error: folderError } = await supabase.storage
            .from(this.bucketName)
            .list(folderName, { limit: 10 })

          if (!folderError && folderFiles && folderFiles.length > 0) {
            // Get the first file in the folder
            const file = folderFiles[0]
            const fullPath = `${folderName}/${file.name}`
            
            const { data: { publicUrl } } = supabase.storage
              .from(this.bucketName)
              .getPublicUrl(fullPath)

            templates[folderName] = {
              name: this.extractFileNameFromPath(file.name),
              size: file.metadata?.size || 0,
              type: file.metadata?.mimetype || 'application/pdf',
              url: publicUrl,
              filePath: fullPath,
              uploadedAt: file.created_at,
              version: 1
            }
            
            console.log(`[FormsTemplateService] Found ${folderName} template: ${fullPath}`)
          }
        } catch (error) {
          console.warn(`[FormsTemplateService] Could not explore folder ${folderName}:`, error)
        }
      }

      return templates
    } catch (error) {
      console.error('List templates error:', error)
      throw error
    }
  }

  /**
   * Get template URL
   * @param {string} filePath - File path in storage
   * @returns {string} Public URL
   */
  getTemplateUrl(filePath) {
    if (!supabase) throw new Error('Supabase not initialized')

    const { data: { publicUrl } } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath)

    return publicUrl
  }

  /**
   * Create signed URL for template
   * @param {string} filePath - File path in storage
   * @param {number} expiresIn - Expiration in seconds
   * @returns {Promise<string>} Signed URL
   */
  async createSignedUrl(filePath, expiresIn = 3600) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn)

      if (error) {
        console.error('Signed URL error:', error)
        throw new Error(error.message || 'Failed to create signed URL')
      }

      return data.signedUrl
    } catch (error) {
      console.error('Create signed URL error:', error)
      throw error
    }
  }

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  validateFile(file) {
    if (!file) {
      return {
        isValid: false,
        error: 'No file provided'
      }
    }

    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit`
      }
    }

    const fileExtension = this.getFileExtension(file.name).toLowerCase()
    
    if (!this.allowedMimeTypes.includes(file.type) && 
        !this.allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: 'File type not allowed. Allowed types: PDF, DOC, DOCX'
      }
    }

    return {
      isValid: true,
      error: null
    }
  }

  /**
   * Generate secure file path
   * @param {string} templateType - Template type
   * @param {string} originalFileName - Original file name
   * @returns {string} Secure file path
   */
  generateFilePath(templateType, originalFileName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safeFileName = this.sanitizeFileName(originalFileName)
    return `${templateType}/${timestamp}_${safeFileName}`
  }

  /**
   * Sanitize file name
   * @param {string} fileName - Original file name
   * @returns {string} Sanitized file name
   */
  sanitizeFileName(fileName) {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase()
  }

  /**
   * Get file extension
   * @param {string} fileName - File name
   * @returns {string} File extension
   */
  getFileExtension(fileName) {
    const parts = fileName.split('.')
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : ''
  }

  /**
   * Extract template type from file path
   * @param {string} filePath - File path
   * @returns {string|null} Template type
   */
  extractTemplateTypeFromPath(filePath) {
    const parts = filePath.split('/')
    return parts.length > 0 ? parts[0] : null
  }

  /**
   * Extract file name from path
   * @param {string} filePath - File path
   * @returns {string} File name
   */
  extractFileNameFromPath(filePath) {
    const parts = filePath.split('/')
    const fullName = parts[parts.length - 1]
    // Remove timestamp prefix if present
    const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_/
    return fullName.replace(timestampPattern, '')
  }
}

// Create singleton instance
const formsTemplateService = new FormsTemplateService()

// Export both instance and class
export default formsTemplateService
export { FormsTemplateService }