"use client"

import { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react"
import { Pencil, RefreshCw, Check, X, Square, ChevronDown, ChevronUp } from "lucide-react"
import Message from "./Message"
import Composer from "./Composer"
import WelcomeAnimation from "./WelcomeAnimation"
import DocumentUpload from "./DocumentUpload"
import DocumentList from "./DocumentList"
import Citation from "./Citation"
import { cls, timeAgo } from "./utils"

function ThinkingMessage({ onPause }) {
  return (
    <Message role="assistant">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></div>
        </div>
        <span className="text-sm text-zinc-500">LISA is thinking...</span>
        <button
          onClick={onPause}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <Square className="h-3 w-3" /> Pause
        </button>
      </div>
    </Message>
  )
}

const LisaChatPane = forwardRef(function LisaChatPane(
  { conversation, onSend, onEditMessage, onResendMessage, isThinking, onPauseThinking },
  ref,
) {
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [documents, setDocuments] = useState([])
  const [isDocumentSectionCollapsed, setIsDocumentSectionCollapsed] = useState(false)
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const composerRef = useRef(null)

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent) => {
        composerRef.current?.insertTemplate(templateContent)
      },
    }),
    [],
  )

  // Load documents for this conversation
  useEffect(() => {
    if (conversation?.id) {
      loadDocuments()
    }
  }, [conversation?.id])

  const loadDocuments = async () => {
    if (!conversation?.id) return

    setIsLoadingDocuments(true)
    try {
      console.log('📚 Loading documents for conversation:', conversation.id)

      const response = await fetch(`/api/documents?conversationId=${conversation.id}`)
      if (!response.ok) {
        throw new Error('Failed to load documents')
      }

      const data = await response.json()
      console.log('✅ Loaded documents:', data.documents.length)
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('❌ Failed to load documents:', error)
      setDocuments([])
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  const handleUploadComplete = (newDocument) => {
    console.log('✅ Upload complete, adding to list:', newDocument)
    setDocuments((prev) => [newDocument, ...prev])
  }

  const handleDocumentDelete = (documentId) => {
    console.log('🗑️ Removing document from list:', documentId)
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
  }

  // Show welcome animation when no conversation is selected
  if (!conversation) {
    return <WelcomeAnimation />
  }

  const tags = ["Document Q&A", "Source Citations", "Multi-Document Search", "HIPAA Compliant"]
  const messages = Array.isArray(conversation.messages) ? conversation.messages : []
  const count = messages.length || conversation.messageCount || 0

  function startEdit(m) {
    setEditingId(m.id)
    setDraft(m.content)
  }
  function cancelEdit() {
    setEditingId(null)
    setDraft("")
  }
  function saveEdit() {
    if (!editingId) return
    onEditMessage?.(editingId, draft)
    cancelEdit()
  }
  function saveAndResend() {
    if (!editingId) return
    onEditMessage?.(editingId, draft)
    onResendMessage?.(editingId)
    cancelEdit()
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-8">
        {/* Header */}
        <div className="mb-2 text-3xl font-serif tracking-tight sm:text-4xl md:text-5xl">
          <span className="block leading-[1.05] font-sans text-2xl">{conversation.title}</span>
        </div>
        <div className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Updated {timeAgo(conversation.updatedAt)} · {count} messages · {documents.length} {documents.length === 1 ? 'document' : 'documents'}
        </div>

        {/* Tags */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:text-zinc-200"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Document Section */}
        <div className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
          {/* Document Section Header */}
          <button
            onClick={() => setIsDocumentSectionCollapsed(!isDocumentSectionCollapsed)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                📚 Documents
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                ({documents.length})
              </span>
            </div>
            {isDocumentSectionCollapsed ? (
              <ChevronDown className="h-4 w-4 text-zinc-500" />
            ) : (
              <ChevronUp className="h-4 w-4 text-zinc-500" />
            )}
          </button>

          {/* Document Section Content */}
          {!isDocumentSectionCollapsed && (
            <div className="px-4 pb-4 space-y-4">
              {/* Document Upload */}
              <DocumentUpload
                conversationId={conversation.id}
                onUploadComplete={handleUploadComplete}
              />

              {/* Document List */}
              {isLoadingDocuments ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Loading documents...</p>
                </div>
              ) : (
                <DocumentList
                  documents={documents}
                  onDelete={handleDocumentDelete}
                />
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        {messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <p className="mb-2">👋 Hi! I'm LISA, your document assistant.</p>
            <p className="mb-4">Upload documents above and I'll help you find information within them with accurate source citations.</p>
            <p className="text-xs text-zinc-400">Supported formats: PDF, DOCX, TXT (max 10MB each)</p>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <div key={m.id} className="space-y-2">
                {editingId === m.id ? (
                  <div className={cls("rounded-2xl border p-2", "border-zinc-200 dark:border-zinc-800")}>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="w-full resize-y rounded-xl bg-transparent p-2 text-sm outline-none"
                      rows={3}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={saveEdit}
                        className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-white dark:bg-white dark:text-zinc-900"
                      >
                        <Check className="h-3.5 w-3.5" /> Save
                      </button>
                      <button
                        onClick={saveAndResend}
                        className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Save & Resend
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <Message role={m.role}>
                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {/* Display citations for assistant messages with sources */}
                    {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                      <Citation sources={m.sources} />
                    )}

                    {m.role === "user" && (
                      <div className="mt-1 flex gap-2 text-[11px] text-zinc-500">
                        <button className="inline-flex items-center gap-1 hover:underline" onClick={() => startEdit(m)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          className="inline-flex items-center gap-1 hover:underline"
                          onClick={() => onResendMessage?.(m.id)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Resend
                        </button>
                      </div>
                    )}
                  </Message>
                )}
              </div>
            ))}
            {isThinking && <ThinkingMessage onPause={onPauseThinking} />}
          </>
        )}
      </div>

      <Composer
        ref={composerRef}
        onSend={async (text) => {
          if (!text.trim()) return
          setBusy(true)
          await onSend?.(text)
          setBusy(false)
        }}
        busy={busy}
        placeholder={documents.length > 0 ? "Ask about your documents..." : "Upload documents to get started..."}
      />
    </div>
  )
})

export default LisaChatPane
