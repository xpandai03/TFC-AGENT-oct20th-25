"use client"
import { Asterisk, MoreHorizontal, Menu, ChevronDown, FolderIcon } from "lucide-react"
import { useState } from "react"
import GhostIconButton from "./GhostIconButton"

export default function Header({
  createNewChat,
  sidebarCollapsed,
  setSidebarOpen,
  currentConversationId,
  onMoveToFolder
}) {
  const [selectedBot, setSelectedBot] = useState("D.A.W.N")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)

  const chatbots = [
    {
      name: "D.A.W.N",
      icon: "🤖",
      description: "Dependable Agent Working Nicely - A friendly agent designed to assist the admin team manage tasks."
    },
    {
      name: "Lisa",
      icon: "🎭",
      description: "Specialized mental health support agent with empathetic conversation capabilities."
    },
    {
      name: "Secret Agent #1",
      icon: "💎",
      description: "Advanced AI assistant for complex administrative and support tasks."
    },
    {
      name: "Secret Agent #2",
      icon: <Asterisk className="h-4 w-4" />,
      description: "Auxiliary support agent for specialized queries and assistance."
    },
  ]

  return (
    <div className="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
      <div className="flex items-center gap-2 px-4 py-3">
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="hidden md:flex relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold tracking-tight hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800"
          >
            {typeof chatbots.find((bot) => bot.name === selectedBot)?.icon === "string" ? (
              <span className="text-sm">{chatbots.find((bot) => bot.name === selectedBot)?.icon}</span>
            ) : (
              chatbots.find((bot) => bot.name === selectedBot)?.icon
            )}
            {selectedBot}
            <ChevronDown className="h-4 w-4" />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950 z-50">
              {chatbots.map((bot) => (
                <button
                  key={bot.name}
                  onClick={() => {
                    setSelectedBot(bot.name)
                    setIsDropdownOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 first:rounded-t-lg last:rounded-b-lg"
                >
                  {typeof bot.icon === "string" ? <span className="text-sm">{bot.icon}</span> : bot.icon}
                  {bot.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showActionsMenu && (
              <>
                {/* Backdrop to close menu when clicking outside */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowActionsMenu(false)}
                />

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950 z-50">
                  <button
                    onClick={() => {
                      if (currentConversationId && onMoveToFolder) {
                        onMoveToFolder(currentConversationId)
                      }
                      setShowActionsMenu(false)
                    }}
                    disabled={!currentConversationId}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg
                      ${currentConversationId
                        ? 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        : 'opacity-50 cursor-not-allowed'
                      }
                    `}
                  >
                    <FolderIcon className="h-4 w-4" />
                    Move to Folder
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Agent Description - Below Agent Selector */}
      <div className="hidden md:block px-4 pb-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {chatbots.find((bot) => bot.name === selectedBot)?.description}
        </p>
      </div>
    </div>
  )
}
