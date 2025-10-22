"use client"
import { motion, AnimatePresence } from "framer-motion"
import { X, FolderIcon, Check } from "lucide-react"

export default function MoveFolderModal({
  isOpen,
  onClose,
  folders,
  currentFolder,
  onMoveToFolder,
  conversationTitle
}) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Move to Folder</h3>
                {conversationTitle && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    "{conversationTitle}"
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Folder List */}
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {folders.length === 0 ? (
                <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No folders available. Create a folder first!
                </div>
              ) : (
                folders.map((folder) => {
                  const isCurrent = currentFolder === folder.name
                  return (
                    <button
                      key={folder.id}
                      onClick={() => {
                        if (!isCurrent) {
                          onMoveToFolder(folder.name)
                          onClose()
                        }
                      }}
                      disabled={isCurrent}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition
                        ${isCurrent
                          ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100 cursor-default'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer'
                        }
                      `}
                    >
                      <FolderIcon className={`h-4 w-4 shrink-0 ${isCurrent ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                      <span className="flex-1 font-medium">{folder.name}</span>
                      {isCurrent && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                          <Check className="h-4 w-4" />
                          Current
                        </div>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
