'use client'

import { useState } from 'react'
import { FileSpreadsheet, X, Maximize2, Minimize2 } from 'lucide-react'

export default function ExcelPreview({ embedUrl, reason }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="my-4 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Excel Spreadsheet Preview
          </span>
          {reason && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              • {reason}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
            title={isExpanded ? 'Minimize' : 'Maximize'}
            aria-label={isExpanded ? 'Minimize preview' : 'Maximize preview'}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            ) : (
              <Maximize2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            )}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
            title="Close preview"
            aria-label="Close preview"
          >
            <X className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          </button>
        </div>
      </div>

      {/* Embedded Excel iframe */}
      <div
        className={`bg-white transition-all duration-300 ${
          isExpanded ? 'h-[600px]' : 'h-[400px]'
        }`}
      >
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="yes"
          title="Excel Spreadsheet Preview"
          className="w-full h-full"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Live view from SharePoint • Changes update in real-time
        </p>
      </div>
    </div>
  )
}
