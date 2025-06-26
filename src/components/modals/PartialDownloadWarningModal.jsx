function PartialDownloadWarningModal({ isOpen, onClose, missingDocuments, onDownloadAnyway, onCancel }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-white">
            Incomplete Document Set
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center mb-4">
            <svg className="w-8 h-8 text-orange-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.464 0L4.35 16.5C3.58 17.333 4.54 19 6.082 19z" />
            </svg>
            <div>
              <p className="text-white font-medium">
                Only some documents have been generated
              </p>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <p className="text-gray-300 text-sm mb-3">Missing documents:</p>
            <ul className="space-y-1">
              {missingDocuments.map((doc, index) => (
                <li key={index} className="text-red-300 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {doc}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-gray-300 text-sm mb-6">
            You can download the available documents now, or cancel and generate the missing documents first.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onDownloadAnyway}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Download Anyway
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PartialDownloadWarningModal