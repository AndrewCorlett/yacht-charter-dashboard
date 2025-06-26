import { useState, useRef } from 'react'

function FileUpload({ 
  onFileUpload, 
  acceptedTypes = '.pdf,.doc,.docx', 
  maxSize = 10 * 1024 * 1024, // 10MB default
  title = "File Upload",
  description = "Upload PDF or Word documents",
  currentFile = null
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null) // 'uploading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef(null)

  // Validate file type and size
  const validateFile = (file) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    const allowedExtensions = ['.pdf', '.doc', '.docx']
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return { valid: false, error: 'Only PDF and Word documents (.pdf, .doc, .docx) are allowed.' }
    }

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      return { valid: false, error: `File size must be less than ${maxSizeMB}MB.` }
    }

    return { valid: true }
  }

  const handleFileSelect = async (file) => {
    setErrorMessage('')
    
    const validation = validateFile(file)
    if (!validation.valid) {
      setErrorMessage(validation.error)
      setUploadStatus('error')
      return
    }

    setUploadStatus('uploading')
    
    try {
      // Simulate file upload delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Create file info object
      const fileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        url: URL.createObjectURL(file), // For preview/download
        file: file // Keep original file for actual upload
      }
      
      if (onFileUpload) {
        onFileUpload(fileInfo)
      }
      
      setUploadStatus('success')
    } catch (uploadError) {
      console.error('File upload error:', uploadError)
      setErrorMessage('Failed to upload file. Please try again.')
      setUploadStatus('error')
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0]) // Only handle first file
    }
  }

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    if (onFileUpload) {
      onFileUpload(null)
    }
    setUploadStatus(null)
    setErrorMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase()
    switch (extension) {
      case 'pdf':
        return (
          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        )
      case 'doc':
      case 'docx':
        return (
          <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      
      {currentFile ? (
        // Display uploaded file
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
            {getFileIcon(currentFile.name)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentFile.name}</p>
              <p className="text-xs text-gray-400">{formatFileSize(currentFile.size)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(currentFile.url, '_blank')}
                className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                title="View file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button
                onClick={handleRemoveFile}
                className="p-2 text-red-400 hover:text-red-300 transition-colors"
                title="Remove file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          <button
            onClick={handleClick}
            className="w-full px-4 py-2 text-sm text-blue-400 hover:text-blue-300 border border-blue-400 hover:border-blue-300 rounded transition-colors"
          >
            Replace File
          </button>
        </div>
      ) : (
        // File upload area
        <div className="space-y-3">
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragOver 
                ? 'border-blue-400 bg-blue-400/10' 
                : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'
              }
              ${uploadStatus === 'uploading' ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            {uploadStatus === 'uploading' ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-sm text-gray-400">Uploading file...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-white">{description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Drag and drop or click to browse
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Max size: {Math.round(maxSize / (1024 * 1024))}MB
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-600 rounded-lg">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-300">{errorMessage}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInputChange}
        accept={acceptedTypes}
        className="hidden"
        data-testid="file-input"
      />
    </div>
  )
}

export default FileUpload