"use client"

import React from "react"
import { FileText, ExternalLink } from "lucide-react"

/**
 * Citation Component
 * Displays source references for LISA's RAG responses
 */
export default function Citation({ sources }) {
  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sources ({sources.length})
        </span>
      </div>
      <div className="space-y-2">
        {sources.map((source, index) => (
          <SourceCard key={index} source={source} index={index} />
        ))}
      </div>
    </div>
  )
}

/**
 * Individual Source Card
 */
function SourceCard({ source, index }) {
  const { documentName, chunkIndex, similarity, snippet } = source

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm border border-blue-200 dark:border-blue-800">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-200 dark:bg-blue-800 rounded-full">
              {index + 1}
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {documentName}
            </span>
          </div>

          {/* Snippet preview */}
          <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2 ml-7">
            {snippet}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-3 mt-2 ml-7 text-xs text-gray-500 dark:text-gray-400">
            <span>Section {chunkIndex + 1}</span>
            {similarity && (
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                {(similarity * 100).toFixed(0)}% match
              </span>
            )}
          </div>
        </div>

        {/* View button (future: open document viewer modal) */}
        <button
          className="flex-shrink-0 p-1.5 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
          title="View in context"
          onClick={() => {
            // TODO: Phase 6 - Open document viewer modal
            console.log('View document:', source.documentId, 'chunk:', chunkIndex)
          }}
        >
          <ExternalLink className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        </button>
      </div>
    </div>
  )
}
