/**
 * Forms Management Section Component
 * 
 * Handles uploading and managing template forms for yacht charter operations.
 * These forms are used as templates for the auto-populate feature and include:
 * - Contract templates
 * - Initial terms documents  
 * - Invoice templates (deposit and balance)
 * - Receipt templates (deposit and balance)
 * 
 * Files are stored in Supabase storage and managed through the form_templates table.
 * Supports PDF, DOC, and DOCX file formats with version control.
 * 
 * @author AI Agent
 * @created 2025-06-28
 */

import { useState, useEffect } from 'react'
import { LABELS } from '../../config/labels'
import FileUpload from '../common/FileUpload'
import formsTemplateService from '../../services/supabase/FormsTemplateService'

function FormsManagementSection() {
  // [Form Templates State] - Tracks uploaded form templates and their metadata
  const [formTemplates, setFormTemplates] = useState({
    contract: null,
    initialTerms: null,
    depositInvoice: null,
    depositReceipt: null,
    balanceInvoice: null
  })

  // [Upload State] - Tracks upload progress and status
  const [uploadStatus, setUploadStatus] = useState({})
  const [loading, setLoading] = useState(false)

  // [Form Template Types Configuration] - Defines available template types
  const templateTypes = [
    {
      key: 'contract',
      label: LABELS.FORMS_MANAGEMENT.CONTRACT_TEMPLATE,
      description: 'Main charter contract template for customer agreements',
      acceptedTypes: '.pdf,.doc,.docx',
      icon: '📄'
    },
    {
      key: 'initialTerms',
      label: LABELS.FORMS_MANAGEMENT.INITIAL_TERMS_TEMPLATE,
      description: 'Initial terms and conditions document template',
      acceptedTypes: '.pdf,.doc,.docx',
      icon: '📋'
    },
    {
      key: 'depositInvoice',
      label: LABELS.FORMS_MANAGEMENT.DEPOSIT_INVOICE_TEMPLATE,
      description: 'Deposit invoice template for initial payments',
      acceptedTypes: '.pdf,.doc,.docx',
      icon: '💰'
    },
    {
      key: 'depositReceipt',
      label: LABELS.FORMS_MANAGEMENT.DEPOSIT_RECEIPT_TEMPLATE,
      description: 'Deposit receipt template for payment confirmation',
      acceptedTypes: '.pdf,.doc,.docx',
      icon: '🧾'
    },
    {
      key: 'balanceInvoice',
      label: LABELS.FORMS_MANAGEMENT.BALANCE_INVOICE_TEMPLATE,
      description: 'Remaining balance invoice template for final payments',
      acceptedTypes: '.pdf,.doc,.docx',
      icon: '📊'
    }
  ]

  // [Load Form Templates] - Fetch existing templates from Supabase on component mount
  useEffect(() => {
    loadFormTemplates()
  }, [])

  /**
   * [Load Form Templates Function] - Fetches template metadata from Supabase
   */
  const loadFormTemplates = async () => {
    setLoading(true)
    try {
      console.log('[FormsManagement] Loading form templates from Supabase...')
      
      const templates = await formsTemplateService.listTemplates()
      
      // Convert to expected format
      const formattedTemplates = {
        contract: templates.contract || null,
        initialTerms: templates.initialTerms || null,
        depositInvoice: templates.depositInvoice || null,
        depositReceipt: templates.depositReceipt || null,
        balanceInvoice: templates.balanceInvoice || null
      }
      
      setFormTemplates(formattedTemplates)
      console.log('[FormsManagement] Form templates loaded:', formattedTemplates)
      
    } catch (error) {
      console.error('[FormsManagement] Error loading form templates:', error)
      setUploadStatus(prev => ({
        ...prev,
        error: 'Failed to load form templates'
      }))
    } finally {
      setLoading(false)
    }
  }

  /**
   * [Handle File Upload] - Processes template file upload to Supabase storage
   * @param {string} templateType - Type of template being uploaded
   * @param {Object} fileInfo - File information from FileUpload component
   */
  const handleFileUpload = async (templateType, fileInfo) => {
    setUploadStatus(prev => ({
      ...prev,
      [templateType]: 'uploading'
    }))

    try {
      console.log(`[FormsManagement] Uploading ${templateType} template:`, fileInfo)
      
      // Upload to Supabase using the real service
      const result = await formsTemplateService.uploadTemplate(templateType, fileInfo.file)
      
      // Update form templates state with uploaded file info
      setFormTemplates(prev => ({
        ...prev,
        [templateType]: {
          name: result.fileName,
          size: result.fileSize,
          type: result.fileType,
          url: result.publicUrl,
          filePath: result.filePath,
          uploadedAt: result.uploadedAt,
          version: result.version
        }
      }))

      setUploadStatus(prev => ({
        ...prev,
        [templateType]: 'success'
      }))

      console.log(`[FormsManagement] ${templateType} template uploaded successfully`)

      // Clear success status after delay
      setTimeout(() => {
        setUploadStatus(prev => ({
          ...prev,
          [templateType]: null
        }))
      }, 3000)

    } catch (error) {
      console.error(`[FormsManagement] Error uploading ${templateType} template:`, error)
      setUploadStatus(prev => ({
        ...prev,
        [templateType]: 'error',
        errorMessage: error.message
      }))
    }
  }

  /**
   * [Handle Template Delete] - Removes template from Supabase storage
   * @param {string} templateType - Type of template to delete
   */
  const handleTemplateDelete = async (templateType) => {
    try {
      console.log(`[FormsManagement] Deleting ${templateType} template`)
      
      const template = formTemplates[templateType]
      if (!template?.filePath) {
        throw new Error('No file path found for template')
      }
      
      // Delete from Supabase
      await formsTemplateService.deleteTemplate(templateType, template.filePath)
      
      // Update local state
      setFormTemplates(prev => ({
        ...prev,
        [templateType]: null
      }))

      setUploadStatus(prev => ({
        ...prev,
        [templateType]: 'deleted'
      }))

      console.log(`[FormsManagement] ${templateType} template deleted successfully`)

      // Clear status after delay
      setTimeout(() => {
        setUploadStatus(prev => ({
          ...prev,
          [templateType]: null
        }))
      }, 2000)

    } catch (error) {
      console.error(`[FormsManagement] Error deleting ${templateType} template:`, error)
      setUploadStatus(prev => ({
        ...prev,
        [templateType]: 'error',
        errorMessage: error.message
      }))
    }
  }

  /**
   * [Handle Template Download] - Downloads template file
   * @param {string} templateType - Type of template to download
   */
  const handleTemplateDownload = async (templateType) => {
    const template = formTemplates[templateType]
    if (!template?.filePath) {
      console.warn(`[FormsManagement] No file path for ${templateType} template`)
      return
    }

    try {
      console.log(`[FormsManagement] Downloading ${templateType} template`)
      
      // Download file blob from Supabase
      const blob = await formsTemplateService.downloadTemplate(template.filePath)
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = template.name || `${templateType}_template.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up object URL
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error(`[FormsManagement] Error downloading ${templateType} template:`, error)
      // Fallback to direct URL download if blob download fails
      if (template.url) {
        const link = document.createElement('a')
        link.href = template.url
        link.download = template.name || `${templateType}_template.pdf`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }
  }

  /**
   * [Get Upload Status Icon] - Returns appropriate icon for upload status
   * @param {string} templateType - Template type to check status for
   * @returns {string} Status icon
   */
  const getUploadStatusIcon = (templateType) => {
    const status = uploadStatus[templateType]
    switch (status) {
      case 'uploading':
        return '⏳'
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'deleted':
        return '🗑️'
      default:
        return formTemplates[templateType] ? '📁' : '📄'
    }
  }

  /**
   * [Get Status Text] - Returns human-readable status text
   * @param {string} templateType - Template type to check status for
   * @returns {string} Status text
   */
  const getStatusText = (templateType) => {
    const status = uploadStatus[templateType]
    switch (status) {
      case 'uploading':
        return 'Uploading to Supabase...'
      case 'success':
        return 'Upload successful!'
      case 'error':
        return 'Upload failed. Please try again.'
      case 'deleted':
        return 'Template deleted.'
      default:
        return formTemplates[templateType] ? 'Template uploaded' : 'No template uploaded'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-gray-400">Loading form templates...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* [Forms Management Header] - Section title and description */}
      <div>
        <h2 className="text-2xl font-bold mb-2">{LABELS.SETTINGS.FORMS_MANAGEMENT}</h2>
        <p className="text-gray-400">
          Upload and manage template forms used for auto-populate functionality.
          These templates will be used to generate customer-specific documents.
          All files are securely stored in Supabase and support PDF, DOC, and DOCX formats.
        </p>
      </div>

      {/* [Template Upload Grid] - Grid layout for template upload cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templateTypes.map((templateType) => (
          <div
            key={templateType.key}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            {/* [Template Card Header] - Template type info */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{templateType.icon}</span>
              <div>
                <h3 className="text-lg font-medium">{templateType.label}</h3>
                <p className="text-sm text-gray-400">{templateType.description}</p>
              </div>
            </div>

            {/* [Current Template Status] - Show uploaded template or upload area */}
            {formTemplates[templateType.key] ? (
              <div className="mb-4 p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">📁</span>
                    <div>
                      <div className="font-medium">{formTemplates[templateType.key].name}</div>
                      <div className="text-sm text-gray-400">
                        Version {formTemplates[templateType.key].version || 1}
                        {formTemplates[templateType.key].uploadedAt && (
                          <span className="ml-2">
                            • Uploaded {new Date(formTemplates[templateType.key].uploadedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTemplateDownload(templateType.key)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Download template"
                    >
                      📥
                    </button>
                    <button
                      onClick={() => handleTemplateDelete(templateType.key)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete template"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // [File Upload Component] - Upload area for new templates
              <div className="mb-4">
                <FileUpload
                  title={`Upload ${templateType.label}`}
                  description={`Upload template for ${templateType.description.toLowerCase()}`}
                  acceptedTypes={templateType.acceptedTypes}
                  maxSize={10 * 1024 * 1024} // 10MB limit
                  onFileUpload={(fileInfo) => handleFileUpload(templateType.key, fileInfo)}
                  currentFile={null}
                />
              </div>
            )}

            {/* [Upload Status] - Display current upload/processing status */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">{getUploadStatusIcon(templateType.key)}</span>
              <span className={`${
                uploadStatus[templateType.key] === 'error' ? 'text-red-400' :
                uploadStatus[templateType.key] === 'success' ? 'text-green-400' :
                'text-gray-400'
              }`}>
                {getStatusText(templateType.key)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* [Storage Information] - Display storage usage and template summary */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-medium mb-3">📊 Template Storage Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Active Templates</div>
            <div className="text-xl font-bold">
              {Object.values(formTemplates).filter(template => template !== null).length} / {templateTypes.length}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Storage Used</div>
            <div className="text-xl font-bold">
              {Math.round(
                Object.values(formTemplates)
                  .filter(template => template !== null)
                  .reduce((total, template) => total + (template.size || 0), 0) / 1024
              )} KB
            </div>
          </div>
          <div>
            <div className="text-gray-400">File Types</div>
            <div className="text-sm">PDF, DOC, DOCX</div>
          </div>
          <div>
            <div className="text-gray-400">Storage Location</div>
            <div className="text-sm">Supabase Storage</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FormsManagementSection