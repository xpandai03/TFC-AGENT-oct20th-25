"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Calendar, LayoutGrid, MoreHorizontal } from "lucide-react"
import Sidebar from "./Sidebar"
import Header from "./Header"
import ChatPane from "./ChatPane"
import LisaChatPane from "./LisaChatPane"
import GhostIconButton from "./GhostIconButton"
import ThemeToggle from "./ThemeToggle"
import MoveFolderModal from "./MoveFolderModal"
import { INITIAL_CONVERSATIONS, INITIAL_TEMPLATES, INITIAL_FOLDERS } from "./mockData"
import { useAgent } from "@/contexts/AgentContext"

export default function AIAssistantUI() {
  const { selectedAgent, setSelectedAgent } = useAgent()
  const [theme, setTheme] = useState(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("theme")
    if (saved) return saved
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
      return "dark"
    return "light"
  })

  useEffect(() => {
    try {
      if (theme === "dark") document.documentElement.classList.add("dark")
      else document.documentElement.classList.remove("dark")
      document.documentElement.setAttribute("data-theme", theme)
      document.documentElement.style.colorScheme = theme
      localStorage.setItem("theme", theme)
    } catch {}
  }, [theme])

  useEffect(() => {
    try {
      const media = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)")
      if (!media) return
      const listener = (e) => {
        const saved = localStorage.getItem("theme")
        if (!saved) setTheme(e.matches ? "dark" : "light")
      }
      media.addEventListener("change", listener)
      return () => media.removeEventListener("change", listener)
    } catch {}
  }, [])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = localStorage.getItem("sidebar-collapsed")
      return raw ? JSON.parse(raw) : { pinned: true, recent: false, folders: true, templates: true, statusCodes: true }
    } catch {
      return { pinned: true, recent: false, folders: true, templates: true, statusCodes: true }
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed))
    } catch {}
  }, [collapsed])

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar-collapsed-state")
      return saved ? JSON.parse(saved) : false
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed-state", JSON.stringify(sidebarCollapsed))
    } catch {}
  }, [sidebarCollapsed])

  const [conversations, setConversations] = useState([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES)
  const [folders, setFolders] = useState(INITIAL_FOLDERS)

  // Fetch conversations from API on mount
  useEffect(() => {
    async function loadConversations() {
      setIsLoadingConversations(true)
      try {
        const response = await fetch('/api/conversations')
        if (!response.ok) throw new Error('Failed to fetch conversations')

        const data = await response.json()
        console.log('📂 Loaded conversations from API:', data.conversations.length)

        // Initialize each conversation with an empty messages array
        // Messages will be loaded on-demand when conversation is selected
        const conversationsWithMessages = data.conversations.map(conv => ({
          ...conv,
          messages: [] // Initialize empty - will be populated when selected
        }))

        setConversations(conversationsWithMessages)
      } catch (error) {
        console.error('❌ Failed to load conversations:', error)
        // Keep empty array on error
      } finally {
        setIsLoadingConversations(false)
      }
    }

    loadConversations()
  }, [])

  const [query, setQuery] = useState("")
  const searchRef = useRef(null)

  const [isThinking, setIsThinking] = useState(false)
  const [thinkingConvId, setThinkingConvId] = useState(null)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault()
        createNewChat()
      }
      if (!e.metaKey && !e.ctrlKey && e.key === "/") {
        const tag = document.activeElement?.tagName?.toLowerCase()
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault()
          searchRef.current?.focus()
        }
      }
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [sidebarOpen, conversations])

  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      createNewChat()
    }
  }, [])

  // Auto-create new conversation when agent switches
  useEffect(() => {
    const currentConversation = conversations.find(c => c.id === selectedId)

    // If we have a selected conversation and the agent doesn't match, create new chat
    if (currentConversation && currentConversation.agentType !== selectedAgent) {
      console.log(`🔄 Agent switched from ${currentConversation.agentType} to ${selectedAgent}, creating new conversation`)
      createNewChat()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgent, selectedId, conversations])

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations
    const q = query.toLowerCase()
    return conversations.filter((c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q))
  }, [conversations, query])

  const pinned = filtered.filter((c) => c.pinned).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

  const recent = filtered
    .filter((c) => !c.pinned)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 10)

  const folderCounts = React.useMemo(() => {
    const map = Object.fromEntries(folders.map((f) => [f.name, 0]))
    for (const c of conversations) if (map[c.folder] != null) map[c.folder] += 1
    return map
  }, [conversations, folders])

  function togglePin(id) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)))
  }

  async function handleDeleteConversation(id) {
    try {
      console.log('🗑️ Deleting conversation:', id)

      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete conversation: ${response.status}`)
      }

      console.log('✅ Conversation deleted:', id)

      // Remove from local state
      setConversations((prev) => prev.filter((c) => c.id !== id))

      // If the deleted conversation was selected, clear selection or select another
      if (selectedId === id) {
        const remaining = conversations.filter((c) => c.id !== id)
        if (remaining.length > 0) {
          setSelectedId(remaining[0].id)
        } else {
          setSelectedId(null)
        }
      }
    } catch (error) {
      console.error('❌ Failed to delete conversation:', error)
      alert('Failed to delete conversation. Please try again.')
    }
  }

  // Move to Folder Modal State
  const [showMoveFolderModal, setShowMoveFolderModal] = useState(false)
  const [conversationToMove, setConversationToMove] = useState(null)

  function handleMoveToFolder(conversationId) {
    setConversationToMove(conversationId)
    setShowMoveFolderModal(true)
  }

  function moveConversationToFolder(folderName) {
    if (!conversationToMove) return

    console.log('📁 Moving conversation', conversationToMove, 'to folder:', folderName)

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationToMove
          ? { ...c, folder: folderName }
          : c
      )
    )

    console.log('✅ Conversation moved to folder:', folderName)

    // Close modal and reset
    setShowMoveFolderModal(false)
    setConversationToMove(null)
  }

  async function loadMessages(conversationId) {
    try {
      console.log('📬 Loading messages for conversation:', conversationId)

      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      if (!response.ok) {
        console.error(`❌ Failed to fetch messages: HTTP ${response.status}`)
        throw new Error(`Failed to fetch messages: ${response.status}`)
      }

      const data = await response.json()
      console.log(`✅ Loaded ${data.messages.length} messages for conversation ${conversationId}:`, data.messages)

      // Parse special message types from metadata
      const parsedMessages = data.messages.map((msg) => {
        // Check if this is an Excel preview message
        if (msg.metadata?.type === 'excel_preview') {
          return {
            ...msg,
            type: 'excel_preview',
            excelPreview: {
              embedUrl: msg.metadata.embedUrl,
              reason: msg.metadata.reason,
            }
          }
        }

        // Check if this message has source citations (LISA responses)
        if (msg.metadata?.sources) {
          return {
            ...msg,
            sources: msg.metadata.sources,
          }
        }

        return msg
      })

      // Update conversation's messages in state
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === conversationId
            ? { ...c, messages: parsedMessages }
            : c
        )
        console.log('📝 Updated conversations state. Conversation now has:',
          updated.find(c => c.id === conversationId)?.messages?.length, 'messages')
        return updated
      })
    } catch (error) {
      console.error('❌ Failed to load messages:', error)
    }
  }

  async function createNewChat() {
    try {
      console.log('➕ Creating new conversation for agent:', selectedAgent)

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Chat',
          agentType: selectedAgent,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.status}`)
      }

      const data = await response.json()
      const newConversation = {
        ...data.conversation,
        messages: [], // Initialize empty messages array
      }

      console.log('✅ Created conversation:', newConversation.id)

      // Add to local state
      setConversations((prev) => [newConversation, ...prev])
      setSelectedId(newConversation.id)
      setSidebarOpen(false)

      // Load messages (will be empty for new conversation, but sets up structure)
      await loadMessages(newConversation.id)
    } catch (error) {
      console.error('❌ Failed to create new chat:', error)
      alert('Failed to create new conversation. Please try again.')
    }
  }

  function createFolder() {
    const name = prompt("Folder name")
    if (!name) return
    if (folders.some((f) => f.name.toLowerCase() === name.toLowerCase())) return alert("Folder already exists.")
    setFolders((prev) => [...prev, { id: Math.random().toString(36).slice(2), name }])
  }

  async function sendMessage(convId, content) {
    if (!content.trim()) return
    const now = new Date().toISOString()
    const userMsg = { id: Math.random().toString(36).slice(2), role: "user", content, createdAt: now }

    // Get the current conversation's history BEFORE adding the new message
    const currentConversation = conversations.find((c) => c.id === convId)
    const conversationHistory = currentConversation?.messages || []

    // Prepare history for API (convert to simple format with just role and content)
    // Filter out Excel preview messages as they're UI-only and don't have regular content
    const historyForAPI = conversationHistory
      .filter((msg) => msg.type !== 'excel_preview')
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

    console.log('📚 Conversation history length:', historyForAPI.length, 'messages')

    // Add the user message to the conversation
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const msgs = [...(c.messages || []), userMsg]
        // If this is the first message, update the title to match the message
        const isFirstMessage = (c.messages || []).length === 0
        return {
          ...c,
          messages: msgs,
          title: isFirstMessage ? content.slice(0, 50) + (content.length > 50 ? '...' : '') : c.title,
          updatedAt: now,
          messageCount: msgs.length,
          preview: content.slice(0, 80),
        }
      }),
    )

    setIsThinking(true)
    setThinkingConvId(convId)

    const currentConvId = convId
    const assistantMsgId = Math.random().toString(36).slice(2)

    try {
      // STEP 1: Save user message to database
      console.log('💾 Saving user message to database...')
      await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: content,
        }),
      })
      console.log('✅ User message saved')

      // STEP 1.5: If this is the first message, update the conversation title in database
      const isFirstMessage = conversationHistory.length === 0
      if (isFirstMessage) {
        console.log('🏷️ Updating conversation title for first message...')
        const newTitle = content.slice(0, 50) + (content.length > 50 ? '...' : '')

        await fetch(`/api/conversations/${convId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTitle
          }),
        })
        console.log('✅ Conversation title updated in database:', newTitle)
      }

      // Get agent type from current conversation
      const agentType = currentConversation?.agentType || 'dawn'
      console.log(`💬 Sending message to ${agentType.toUpperCase()}:`, content)
      console.log('📝 With conversation history:', historyForAPI.length, 'previous messages')

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          history: historyForAPI,
          agentType: agentType, // Pass agent type to API
          conversationId: convId // Pass conversation ID for LISA document lookup
        }),
      })

      console.log('✅ API response status:', response.status)

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`)
      }

      // Check if response is JSON (Excel preview) or streaming text
      const contentType = response.headers.get('content-type')
      const isJSON = contentType?.includes('application/json')

      if (isJSON) {
        // Handle JSON response with Excel preview
        const data = await response.json()
        console.log('📊 Received Excel preview response:', data)

        // Add assistant message with text
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== currentConvId) return c
            const asstMsg = {
              id: assistantMsgId,
              role: "assistant",
              content: data.text,
              createdAt: new Date().toISOString(),
            }
            const msgs = [...(c.messages || []), asstMsg]
            return {
              ...c,
              messages: msgs,
              updatedAt: new Date().toISOString(),
              messageCount: msgs.length,
            }
          }),
        )

        // Add Excel preview as a separate message
        if (data.excelPreview) {
          const previewMsgId = Math.random().toString(36).slice(2)
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== currentConvId) return c
              const previewMsg = {
                id: previewMsgId,
                role: "assistant",
                type: "excel_preview",
                excelPreview: data.excelPreview,
                createdAt: new Date().toISOString(),
              }
              const msgs = [...(c.messages || []), previewMsg]
              return {
                ...c,
                messages: msgs,
                updatedAt: new Date().toISOString(),
                messageCount: msgs.length,
              }
            }),
          )
        }

        setIsThinking(false)
        setThinkingConvId(null)

        // Save assistant message to database
        await fetch(`/api/conversations/${convId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'assistant',
            content: data.text,
          }),
        })

        // Save Excel preview message to database if present
        if (data.excelPreview) {
          console.log('💾 Saving Excel preview message to database...')
          await fetch(`/api/conversations/${convId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: 'assistant',
              content: JSON.stringify({
                type: 'excel_preview',
                excelPreview: data.excelPreview,
              }),
              metadata: {
                type: 'excel_preview',
                embedUrl: data.excelPreview.embedUrl,
                reason: data.excelPreview.reason,
              }
            }),
          })
          console.log('✅ Excel preview message saved to database')
        }

        return
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      // Add initial empty assistant message
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== currentConvId) return c
          const asstMsg = {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            createdAt: new Date().toISOString(),
          }
          const msgs = [...(c.messages || []), asstMsg]
          return {
            ...c,
            messages: msgs,
            updatedAt: new Date().toISOString(),
            messageCount: msgs.length,
          }
        }),
      )

      setIsThinking(false)
      setThinkingConvId(null)

      // Read stream chunks
      let accumulatedText = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log('✅ Stream complete, final text length:', accumulatedText.length)
            break
          }

          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true })
          accumulatedText += chunk

          console.log('📝 Received chunk:', chunk.substring(0, 50) + (chunk.length > 50 ? '...' : ''))

          // Parse out sources metadata if present (LISA responses)
          let displayText = accumulatedText
          if (accumulatedText.includes('__SOURCES__')) {
            const parts = accumulatedText.split('\n\n__SOURCES__\n')
            displayText = parts[0]
          }

          // Update the assistant message with accumulated text immediately
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== currentConvId) return c
              const msgs = c.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, content: displayText } : m
              )
              return {
                ...c,
                messages: msgs,
                updatedAt: new Date().toISOString(),
                preview: displayText.slice(0, 80),
              }
            }),
          )

          // Small delay to allow React to render - helps with visual streaming effect
          await new Promise(resolve => setTimeout(resolve, 0))
        }
      } finally {
        reader.releaseLock()
      }

      console.log(`✅ ${agentType.toUpperCase()} response complete`)

      // Parse sources metadata if present (for LISA responses)
      let finalText = accumulatedText
      let sources = null

      if (accumulatedText.includes('__SOURCES__')) {
        console.log('📎 Parsing source citations from response...')
        const parts = accumulatedText.split('\n\n__SOURCES__\n')
        finalText = parts[0]

        if (parts[1]) {
          try {
            sources = JSON.parse(parts[1])
            console.log(`✅ Parsed ${sources.length} source citations`)
          } catch (e) {
            console.error('❌ Failed to parse sources:', e)
          }
        }
      }

      // Update final message with sources if present
      if (sources && sources.length > 0) {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== currentConvId) return c
            const msgs = c.messages.map((m) =>
              m.id === assistantMsgId ? { ...m, content: finalText, sources } : m
            )
            return { ...c, messages: msgs }
          }),
        )
      }

      // STEP 3: Save assistant message to database
      console.log('💾 Saving assistant message to database...')
      await fetch(`/api/conversations/${currentConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'assistant',
          content: finalText,
          metadata: sources ? { sources } : undefined,
        }),
      })
      console.log('✅ Assistant message saved')
    } catch (error) {
      console.error('❌ Error calling DAWN:', error)
      setIsThinking(false)
      setThinkingConvId(null)

      // Add error message to conversation
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== currentConvId) return c
          const errorMsg = {
            id: Math.random().toString(36).slice(2),
            role: "assistant",
            content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
            createdAt: new Date().toISOString(),
            isError: true,
          }
          const msgs = [...(c.messages || []), errorMsg]
          return {
            ...c,
            messages: msgs,
            updatedAt: new Date().toISOString(),
            messageCount: msgs.length,
            preview: errorMsg.content.slice(0, 80),
          }
        }),
      )
    }
  }

  function editMessage(convId, messageId, newContent) {
    const now = new Date().toISOString()
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const msgs = (c.messages || []).map((m) =>
          m.id === messageId ? { ...m, content: newContent, editedAt: now } : m,
        )
        return {
          ...c,
          messages: msgs,
          preview: msgs[msgs.length - 1]?.content?.slice(0, 80) || c.preview,
        }
      }),
    )
  }

  function resendMessage(convId, messageId) {
    const conv = conversations.find((c) => c.id === convId)
    const msg = conv?.messages?.find((m) => m.id === messageId)
    if (!msg) return
    sendMessage(convId, msg.content)
  }

  function pauseThinking() {
    setIsThinking(false)
    setThinkingConvId(null)
  }

  function handleUseTemplate(template) {
    // This will be passed down to the Composer component
    // The Composer will handle inserting the template content
    if (composerRef.current) {
      composerRef.current.insertTemplate(template.content)
    }
  }

  const composerRef = useRef(null)

  const selected = conversations.find((c) => c.id === selectedId) || null

  return (
    <div className="h-screen w-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="md:hidden sticky top-0 z-40 flex items-center gap-2 border-b border-zinc-200/60 bg-white/80 px-3 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="ml-1 flex items-center">
          <img
            src={theme === 'dark' ? '/images/tfc-logo-dark.png' : '/images/tfc-logo-light.jpg'}
            alt="The Family Connection"
            className="h-6 w-auto object-contain"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GhostIconButton label="Schedule">
            <Calendar className="h-4 w-4" />
          </GhostIconButton>
          <GhostIconButton label="Apps">
            <LayoutGrid className="h-4 w-4" />
          </GhostIconButton>
          <GhostIconButton label="More">
            <MoreHorizontal className="h-4 w-4" />
          </GhostIconButton>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </div>

      <div className="flex h-screen w-full">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          theme={theme}
          setTheme={setTheme}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          conversations={conversations}
          pinned={pinned}
          recent={recent}
          folders={folders}
          folderCounts={folderCounts}
          selectedId={selectedId}
          onSelect={(id) => {
            // Find the conversation being selected
            const conversation = conversations.find(c => c.id === id)

            // Sync agent dropdown to match conversation's agent type
            if (conversation && conversation.agentType !== selectedAgent) {
              console.log(`🔄 Syncing agent dropdown to match conversation: ${conversation.agentType}`)
              setSelectedAgent(conversation.agentType)
            }

            setSelectedId(id)
            setSidebarOpen(false) // Close sidebar on mobile when selecting conversation
            loadMessages(id) // Load messages for selected conversation
          }}
          togglePin={togglePin}
          onDelete={handleDeleteConversation}
          onMoveToFolder={handleMoveToFolder}
          query={query}
          setQuery={setQuery}
          searchRef={searchRef}
          createFolder={createFolder}
          createNewChat={createNewChat}
          templates={templates}
          setTemplates={setTemplates}
          onUseTemplate={handleUseTemplate}
        />

        <main className="relative flex min-w-0 flex-1 flex-col">
          <Header
            createNewChat={createNewChat}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarOpen={setSidebarOpen}
            currentConversationId={selectedId}
            onMoveToFolder={handleMoveToFolder}
          />

          {/* Agent Mismatch Warning Banner */}
          {selected && selected.agentType !== selectedAgent && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                <p className="text-yellow-800 dark:text-yellow-200">
                  This is a <strong>{selected.agentType === 'lisa' ? 'LISA' : 'D.A.W.N.'}</strong> conversation, but you have{' '}
                  <strong>{selectedAgent === 'lisa' ? 'LISA' : 'D.A.W.N.'}</strong> selected.
                </p>
                <button
                  onClick={createNewChat}
                  className="ml-auto px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded-md transition-colors"
                >
                  Create {selectedAgent === 'lisa' ? 'LISA' : 'D.A.W.N.'} Chat
                </button>
              </div>
            </div>
          )}

          {/* Conditionally render LisaChatPane or ChatPane based on agent type */}
          {selected?.agentType === 'lisa' ? (
            <LisaChatPane
              ref={composerRef}
              conversation={selected}
              onSend={(content) => selected && sendMessage(selected.id, content)}
              onEditMessage={(messageId, newContent) => selected && editMessage(selected.id, messageId, newContent)}
              onResendMessage={(messageId) => selected && resendMessage(selected.id, messageId)}
              isThinking={isThinking && thinkingConvId === selected?.id}
              onPauseThinking={pauseThinking}
            />
          ) : (
            <ChatPane
              ref={composerRef}
              conversation={selected}
              onSend={(content) => selected && sendMessage(selected.id, content)}
              onEditMessage={(messageId, newContent) => selected && editMessage(selected.id, messageId, newContent)}
              onResendMessage={(messageId) => selected && resendMessage(selected.id, messageId)}
              isThinking={isThinking && thinkingConvId === selected?.id}
              onPauseThinking={pauseThinking}
            />
          )}
        </main>
      </div>

      {/* Move to Folder Modal */}
      <MoveFolderModal
        isOpen={showMoveFolderModal}
        onClose={() => setShowMoveFolderModal(false)}
        folders={folders}
        currentFolder={conversationToMove ? conversations.find(c => c.id === conversationToMove)?.folder : null}
        onMoveToFolder={moveConversationToFolder}
        conversationTitle={conversationToMove ? conversations.find(c => c.id === conversationToMove)?.title : null}
      />
    </div>
  )
}
