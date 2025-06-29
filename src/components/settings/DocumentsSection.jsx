/**
 * Documents Section Component
 * 
 * Handles uploading and managing blank document templates for yacht charter operations.
 * Documents are stored in Supabase storage and used as templates for generating 
 * customer-specific documents.
 * 
 * Document Types:
 * - Contract templates
 * - Initial terms documents  
 * - Invoice templates (deposit and balance)
 * - Receipt templates (deposit and balance)
 * 
 * @author AI Agent
 * @created 2025-06-28
 */

import { useState, useEffect } from 'react'
import { LABELS } from '../../config/labels'
import FileUpload from '../common/FileUpload'

function DocumentsSection() {
  // [Document State] - Tracks uploaded documents and their metadata
  const [documents, setDocuments] = useState({
    contract: null,
    initialTerms: null,
    depositInvoice: null,
    depositReceipt: null,
    balanceInvoice: null,
    balanceReceipt: null
  })

  // [Upload State] - Tracks upload progress and status
  const [uploadStatus, setUploadStatus] = useState({})
  const [loading, setLoading] = useState(false)

  // [Document Types Configuration] - Defines available document types
  const documentTypes = [
    {
      key: 'contract',
      label: LABELS.DOCUMENT.CONTRACT,
      description: 'Main charter contract template',
      acceptedTypes: '.pdf,.doc,.docx',
      icon: '📄'
    },
    {
      key: 'initialTerms',
      label: LABELS.DOCUMENT.INITIAL_TERMS,
      description: 'Initial terms and conditions document',
      acceptedTypes: '.pdf,.doc,.docx',
      icon: '📋'
    },
    {
      key: 'depositInvoice',
      label: LABELS.DOCUMENT.DEPOSIT_INVOICE,
      description: 'Deposit invoice template',
      acceptedTypes: '.pdf,.doc,.docx',
      icon: '💰'
    },
    {
      key: 'depositReceipt',
      label: LABELS.DOCUMENT.DEPOSIT_RECEIPT,
      description: 'Deposit receipt template',
      acceptedTypes: '.pdf,.doc,.docx',
      icon: '🧾'
    },
    {
      key: 'balanceInvoice',
      label: LABELS.DOCUMENT.BALANCE_INVOICE,
      description: 'Remaining balance invoice template',
      acceptedTypes: '.pdf,.doc,.docx',
      icon: '📊'
    },
    {
      key: 'balanceReceipt',
      label: LABELS.DOCUMENT.BALANCE_RECEIPT,
      description: 'Remaining balance receipt template',
      acceptedTypes: '.pdf,.doc,.docx',
      icon: '✅'
    }
  ]

  // [Load Documents] - Fetch existing documents from Supabase on component mount
  useEffect(() => {
    loadDocuments()
  }, [])

  /**
   * [Load Documents Function] - Fetches document metadata from Supabase
   */
  const loadDocuments = async () => {
    setLoading(true)
    try {
      // TODO: Implement Supabase storage query to fetch document templates
      // This would query the document_templates table or storage bucket
      console.log('Loading document templates from Supabase...')
      
      // Mock data for now - replace with actual Supabase query
      const mockDocuments = {
        contract: null,
        initialTerms: null,
        depositInvoice: null,
        depositReceipt: null,
        balanceInvoice: null,
        balanceReceipt: null
      }
      
      setDocuments(mockDocuments)
    } catch (error) {
      console.error('Error loading documents:', error)
      setUploadStatus(prev => ({
        ...prev,
        error: 'Failed to load documents'
      }))
    } finally {
      setLoading(false)
    }
  }

  /**
   * [Handle File Upload] - Processes file upload to Supabase storage
   * @param {string} documentType - Type of document being uploaded
   * @param {Object} fileInfo - File information from FileUpload component
   */
  const handleFileUpload = async (documentType, fileInfo) => {
    setUploadStatus(prev => ({
      ...prev,
      [documentType]: 'uploading'
    }))

    try {
      // TODO: Implement Supabase storage upload
      // 1. Upload file to Supabase storage bucket 'document-templates'
      // 2. Save metadata to document_templates table
      // 3. Update local state with new document info
      
      console.log(`Uploading ${documentType}:`, fileInfo)
      
      // Mock upload simulation - replace with actual Supabase upload
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update documents state with uploaded file info
      setDocuments(prev => ({
        ...prev,
        [documentType]: {
          ...fileInfo,
          uploadedAt: new Date().toISOString(),
          url: `https://mock-supabase-url.com/storage/document-templates/${documentType}-${Date.now()}.pdf`
        }
      }))

      setUploadStatus(prev => ({
        ...prev,
        [documentType]: 'success'
      }))

      // Clear success status after delay
      setTimeout(() => {
        setUploadStatus(prev => ({
          ...prev,
          [documentType]: null
        }))
      }, 3000)

    } catch (error) {
      console.error(`Error uploading ${documentType}:`, error)
      setUploadStatus(prev => ({
        ...prev,
        [documentType]: 'error'
      }))
    }
  }

  /**
   * [Handle Document Delete] - Removes document from Supabase storage
   * @param {string} documentType - Type of document to delete
   */
  const handleDocumentDelete = async (documentType) => {
    try {
      // TODO: Implement Supabase storage deletion
      // 1. Delete file from storage bucket
      // 2. Remove metadata from document_templates table
      
      console.log(`Deleting ${documentType}`)
      
      // Update local state
      setDocuments(prev => ({
        ...prev,
        [documentType]: null
      }))

      setUploadStatus(prev => ({
        ...prev,
        [documentType]: 'deleted'
      }))

      // Clear status after delay
      setTimeout(() => {
        setUploadStatus(prev => ({
          ...prev,
          [documentType]: null
        }))
      }, 2000)

    } catch (error) {
      console.error(`Error deleting ${documentType}:`, error)
      setUploadStatus(prev => ({
        ...prev,
        [documentType]: 'error'
      }))
    }
  }

  /**
   * [Get Upload Status Icon] - Returns appropriate icon for upload status
   * @param {string} documentType - Document type to check status for
   * @returns {string} Status icon
   */
  const getUploadStatusIcon = (documentType) => {
    const status = uploadStatus[documentType]
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
        return documents[documentType] ? '📁' : '📄'
    }
  }

  /**
   * [Get Status Text] - Returns human-readable status text
   * @param {string} documentType - Document type to check status for
   * @returns {string} Status text
   */
  const getStatusText = (documentType) => {
    const status = uploadStatus[documentType]
    switch (status) {
      case 'uploading':
        return 'Uploading to Supabase...'
      case 'success':
        return 'Upload successful!'
      case 'error':
        return 'Upload failed. Please try again.'
      case 'deleted':
        return 'Document deleted.'
      default:
        return documents[documentType] ? 'Document uploaded' : 'No document uploaded'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-gray-400">Loading documents...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* [Documents Header] - Section title and description */}
      <div>
        <h2 className="text-2xl font-bold mb-2">{LABELS.SETTINGS.DOCUMENTS}</h2>
        <p className="text-gray-400">
          Upload blank document templates that will be used to generate customer-specific documents.
          All files are securely stored in Supabase and can be updated as needed.
        </p>
      </div>

      {/* [Document Upload Grid] - Grid layout for document upload cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documentTypes.map((docType) => (
          <div
            key={docType.key}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            {/* [Document Card Header] - Document type info */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{docType.icon}</span>
              <div>
                <h3 className="text-lg font-medium">{docType.label}</h3>
                <p className="text-sm text-gray-400">{docType.description}</p>
              </div>
            </div>

            {/* [Current Document Status] - Show uploaded document or upload area */}
            {documents[docType.key] ? (
              <div className="mb-4 p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">📁</span>
                    <div>
                      <div className="font-medium">{documents[docType.key].name}</div>
                      <div className="text-sm text-gray-400">
                        {Math.round(documents[docType.key].size / 1024)} KB
                        {documents[docType.key].uploadedAt && (
                          <span className="ml-2">
                            • Uploaded {new Date(documents[docType.key].uploadedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDocumentDelete(docType.key)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Delete document"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ) : (
              // [File Upload Component] - Upload area for new documents
              <div className="mb-4">
                <FileUpload
                  title={`Upload ${docType.label}`}
                  description={`Upload template for ${docType.description.toLowerCase()}`}
                  acceptedTypes={docType.acceptedTypes}
                  maxSize={10 * 1024 * 1024} // 10MB limit
                  onFileUpload={(fileInfo) => handleFileUpload(docType.key, fileInfo)}
                  currentFile={null}
                />
              </div>
            )}

            {/* [Upload Status] - Display current upload/processing status */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">{getUploadStatusIcon(docType.key)}</span>
              <span className={`${
                uploadStatus[docType.key] === 'error' ? 'text-red-400' :
                uploadStatus[docType.key] === 'success' ? 'text-green-400' :
                'text-gray-400'
              }`}>
                {getStatusText(docType.key)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* [Storage Information] - Display storage usage and limits */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-medium mb-3">📊 Storage Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Total Documents</div>
            <div className="text-xl font-bold">
              {Object.values(documents).filter(doc => doc !== null).length}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Storage Used</div>
            <div className="text-xl font-bold">
              {Math.round(
                Object.values(documents)
                  .filter(doc => doc !== null)
                  .reduce((total, doc) => total + (doc.size || 0), 0) / 1024
              )} KB
            </div>
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

export default DocumentsSection