"use client"

import React, { useState, useRef } from "react"
import { Upload, FileText, X } from "lucide-react"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt']

export default function DocumentUpload({ conversationId, onUploadComplete }) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const validateFile = (file) => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`
    }

    // Check file type
    const extension = '.' + file.name.split('.').pop().toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return `File type not supported. Allowed types: PDF, DOCX, TXT`
    }

    return null
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleFileSelection = (file) => {
    setError(null)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
  }

  const handleFileInputChange = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !conversationId) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('conversationId', conversationId)

      console.log('📤 Uploading document:', selectedFile.name)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Upload failed')
      }

      const data = await response.json()
      console.log('✅ Document uploaded:', data.document)

      setUploadProgress(100)
      setSelectedFile(null)

      // Call callback to refresh document list
      if (onUploadComplete) {
        onUploadComplete(data.document)
      }

      // Reset after a short delay
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 500)

    } catch (error) {
      console.error('❌ Upload failed:', error)
      setError(error.message || 'Failed to upload document')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center gap-2">
          <Upload className={`h-8 w-8 ${isDragging ? 'text-blue-500' : 'text-zinc-400 dark:text-zinc-600'}`} />

          {!selectedFile && !isUploading && (
            <>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Drag & drop a document or click to browse
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Supported: PDF, DOCX, TXT (max 10MB)
              </p>
            </>
          )}

          {selectedFile && !isUploading && (
            <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-lg">
              <FileText className="h-5 w-5 text-blue-500" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearSelection()
                }}
                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
              >
                <X className="h-4 w-4 text-zinc-500" />
              </button>
            </div>
          )}

          {isUploading && (
            <div className="w-full max-w-xs">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Uploading...
                </p>
                <p className="text-xs text-zinc-500">
                  {uploadProgress}%
                </p>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && !isUploading && (
        <button
          onClick={handleUpload}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Upload Document
        </button>
      )}
    </div>
  )
}
