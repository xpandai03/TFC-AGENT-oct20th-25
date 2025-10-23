"use client"

import React from "react"
import { FileText, Loader2, CheckCircle2, XCircle, Trash2 } from "lucide-react"

const STATUS_ICONS = {
  pending: <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />,
  processing: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
}

const STATUS_TEXT = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Ready',
  failed: 'Failed',
}

const STATUS_COLORS = {
  pending: 'text-yellow-600 dark:text-yellow-400',
  processing: 'text-blue-600 dark:text-blue-400',
  completed: 'text-green-600 dark:text-green-400',
  failed: 'text-red-600 dark:text-red-400',
}

export default function DocumentList({ documents, onDelete }) {
  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No documents uploaded yet
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
          Upload documents to start asking questions
        </p>
      </div>
    )
  }

  const handleDelete = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      console.log('🗑️ Deleting document:', documentId)

      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      console.log('✅ Document deleted:', documentId)

      // Call callback to refresh list
      if (onDelete) {
        onDelete(documentId)
      }
    } catch (error) {
      console.error('❌ Delete failed:', error)
      alert('Failed to delete document. Please try again.')
    }
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
        >
          {/* File Icon */}
          <div className="flex-shrink-0">
            <FileText className="h-5 w-5 text-blue-500" />
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {doc.fileName}
            </p>
            <div className="flex items-center gap-3 mt-1">
              {/* Status */}
              <div className="flex items-center gap-1.5">
                {STATUS_ICONS[doc.processingStatus]}
                <span className={`text-xs font-medium ${STATUS_COLORS[doc.processingStatus]}`}>
                  {STATUS_TEXT[doc.processingStatus]}
                </span>
              </div>

              {/* Page Count */}
              {doc.pageCount && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}
                </span>
              )}

              {/* Chunk Count */}
              {doc.chunkCount && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {doc.chunkCount} {doc.chunkCount === 1 ? 'chunk' : 'chunks'}
                </span>
              )}
            </div>
          </div>

          {/* Delete Button */}
          <button
            onClick={() => handleDelete(doc.id)}
            className="flex-shrink-0 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors group"
            title="Delete document"
          >
            <Trash2 className="h-4 w-4 text-zinc-400 dark:text-zinc-600 group-hover:text-red-500 dark:group-hover:text-red-400" />
          </button>
        </div>
      ))}
    </div>
  )
}
