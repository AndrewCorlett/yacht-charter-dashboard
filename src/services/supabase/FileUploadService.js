/**
 * File Upload Service
 * Handles crew experience document uploads to Supabase Storage
 * Manages file validation, upload, download, and deletion
 * 
 * @created 2025-06-26
 */

import { supabase, supabaseConfig, TABLES } from './supabaseClient.js'
import bookingService from './BookingService.js'

class FileUploadService {
  constructor() {
    this.bucketName = 'crew-documents'
    this.maxFileSize = 10 * 1024 * 1024 // 10MB
    this.allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
    this.allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp']
  }

  /**
   * Upload crew experience document
   * @param {string} bookingId - Booking ID
   * @param {File} file - File to upload
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadCrewDocument(bookingId, file, options = {}) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      // Validate file
      const validation = this.validateFile(file)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      // Generate secure file path
      const filePath = this.generateFilePath(bookingId, file.name)

      // Upload to storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: options.upsert || false,
          contentType: file.type
        })

      if (error) {
        console.error('Upload error:', error)
        throw new Error(error.message || 'File upload failed')
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath)

      // Update booking with file information
      const fileInfo = {
        crew_experience_file_name: file.name,
        crew_experience_file_url: publicUrl,
        crew_experience_file_size: file.size,
        crew_experience_file_type: file.type,
        crew_experience_uploaded_at: new Date().toISOString()
      }

      if (options.updateBooking !== false) {
        await bookingService.updateBooking(bookingId, fileInfo)
      }

      return {
        success: true,
        filePath: data.path,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        publicUrl: publicUrl,
        ...fileInfo
      }
    } catch (error) {
      console.error('Upload crew document error:', error)
      throw error
    }
  }

  /**
   * Download crew document
   * @param {string} filePath - File path in storage
   * @returns {Promise<Blob>} File blob
   */
  async downloadCrewDocument(filePath) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(filePath)

      if (error) {
        console.error('Download error:', error)
        throw new Error(error.message || 'File download failed')
      }

      return data
    } catch (error) {
      console.error('Download crew document error:', error)
      throw error
    }
  }

  /**
   * Delete crew document
   * @param {string} bookingId - Booking ID
   * @param {string} filePath - File path in storage
   * @returns {Promise<boolean>} Success status
   */
  async deleteCrewDocument(bookingId, filePath) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath])

      if (error) {
        console.error('Delete error:', error)
        throw new Error(error.message || 'File deletion failed')
      }

      // Clear file information from booking
      await bookingService.updateBooking(bookingId, {
        crew_experience_file_name: null,
        crew_experience_file_url: null,
        crew_experience_file_size: null,
        crew_experience_file_type: null,
        crew_experience_uploaded_at: null
      })

      return true
    } catch (error) {
      console.error('Delete crew document error:', error)
      throw error
    }
  }

  /**
   * List crew documents for a booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Array>} List of files
   */
  async listCrewDocuments(bookingId) {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(bookingId, {
          limit: 100,
          offset: 0
        })

      if (error) {
        console.error('List error:', error)
        throw new Error(error.message || 'Failed to list files')
      }

      // Add public URLs to each file
      const filesWithUrls = (data || []).map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(`${bookingId}/${file.name}`)

        return {
          ...file,
          publicUrl
        }
      })

      return filesWithUrls
    } catch (error) {
      console.error('List crew documents error:', error)
      throw error
    }
  }

  /**
   * Get file URL
   * @param {string} filePath - File path in storage
   * @returns {string} Public URL
   */
  getFileUrl(filePath) {
    if (!supabase) throw new Error('Supabase not initialized')

    const { data: { publicUrl } } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath)

    return publicUrl
  }

  /**
   * Create signed URL for temporary access
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
   * Upload multiple files
   * @param {string} bookingId - Booking ID
   * @param {FileList|Array} files - Files to upload
   * @returns {Promise<Array>} Upload results
   */
  async uploadMultipleFiles(bookingId, files) {
    const results = []
    const fileArray = Array.from(files)

    for (const file of fileArray) {
      try {
        const result = await this.uploadCrewDocument(bookingId, file, {
          updateBooking: false // We'll update once at the end
        })
        results.push(result)
      } catch (error) {
        results.push({
          success: false,
          fileName: file.name,
          error: error.message
        })
      }
    }

    // Update booking with the first successful upload
    const successfulUpload = results.find(r => r.success)
    if (successfulUpload) {
      await bookingService.updateBooking(bookingId, {
        crew_experience_file_name: successfulUpload.fileName,
        crew_experience_file_url: successfulUpload.publicUrl,
        crew_experience_file_size: successfulUpload.fileSize,
        crew_experience_file_type: successfulUpload.fileType,
        crew_experience_uploaded_at: successfulUpload.crew_experience_uploaded_at
      })
    }

    return results
  }

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  validateFile(file) {
    // Check if file exists
    if (!file) {
      return {
        isValid: false,
        error: 'No file provided'
      }
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit`
      }
    }

    // Check file type
    const fileExtension = this.getFileExtension(file.name).toLowerCase()
    
    if (!this.allowedMimeTypes.includes(file.type) && 
        !this.allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: 'File type not allowed. Allowed types: PDF, DOC, DOCX, JPG, PNG, WEBP'
      }
    }

    return {
      isValid: true,
      error: null
    }
  }

  /**
   * Generate secure file path
   * @param {string} bookingId - Booking ID
   * @param {string} originalFileName - Original file name
   * @returns {string} Secure file path
   */
  generateFilePath(bookingId, originalFileName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safeFileName = this.sanitizeFileName(originalFileName)
    return `${bookingId}/${timestamp}_${safeFileName}`
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
   * Calculate storage usage for a booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Storage usage info
   */
  async getStorageUsage(bookingId) {
    const files = await this.listCrewDocuments(bookingId)
    
    const totalSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0)
    
    return {
      fileCount: files.length,
      totalSize: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      files: files.map(f => ({
        name: f.name,
        size: f.metadata?.size || 0,
        sizeMB: ((f.metadata?.size || 0) / 1024 / 1024).toFixed(2),
        created: f.created_at
      }))
    }
  }

  /**
   * Clean up orphaned files (files not referenced in bookings)
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOrphanedFiles() {
    if (!supabase) throw new Error('Supabase not initialized')

    try {
      // Get all files in storage
      const { data: storageFiles, error: listError } = await supabase.storage
        .from(this.bucketName)
        .list('', {
          limit: 1000,
          offset: 0
        })

      if (listError) throw listError

      // Get all bookings with files
      const { data: bookings, error: bookingsError } = await supabase
        .from(TABLES.BOOKINGS)
        .select('id, crew_experience_file_name')
        .not('crew_experience_file_name', 'is', null)

      if (bookingsError) throw bookingsError

      // Create set of valid file paths
      const validPaths = new Set()
      bookings.forEach(booking => {
        if (booking.crew_experience_file_name) {
          // Add various possible path formats
          validPaths.add(booking.crew_experience_file_name)
          validPaths.add(`${booking.id}/${booking.crew_experience_file_name}`)
        }
      })

      // Find orphaned files
      const orphanedFiles = []
      const deletedFiles = []

      for (const file of storageFiles) {
        const filePath = file.name
        
        // Check if file is referenced
        let isOrphaned = true
        for (const validPath of validPaths) {
          if (filePath.includes(validPath) || validPath.includes(filePath)) {
            isOrphaned = false
            break
          }
        }

        if (isOrphaned) {
          orphanedFiles.push(filePath)
          
          // Delete orphaned file
          try {
            await supabase.storage
              .from(this.bucketName)
              .remove([filePath])
            deletedFiles.push(filePath)
          } catch (deleteError) {
            console.error(`Failed to delete orphaned file ${filePath}:`, deleteError)
          }
        }
      }

      return {
        orphanedFiles: orphanedFiles,
        deletedFiles: deletedFiles,
        deletedCount: deletedFiles.length,
        errors: orphanedFiles.length - deletedFiles.length
      }
    } catch (error) {
      console.error('Cleanup orphaned files error:', error)
      throw error
    }
  }
}

// Create singleton instance
const fileUploadService = new FileUploadService()

// Export both instance and class
export default fileUploadService
export { FileUploadService }