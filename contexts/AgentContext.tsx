'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { AgentType } from '@/lib/types/lisa'

interface AgentContextType {
  selectedAgent: AgentType
  setSelectedAgent: (agent: AgentType) => void
  agentConfig: {
    dawn: {
      name: string
      description: string
      icon: string
    }
    lisa: {
      name: string
      description: string
      icon: string
    }
  }
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

const STORAGE_KEY = 'tfc-selected-agent'

export function AgentProvider({ children }: { children: ReactNode }) {
  const [selectedAgent, setSelectedAgentState] = useState<AgentType>('dawn')

  // Load saved agent from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && (saved === 'dawn' || saved === 'lisa')) {
        setSelectedAgentState(saved)
      }
    } catch (error) {
      console.error('Failed to load saved agent:', error)
    }
  }, [])

  // Save agent to localStorage when it changes
  const setSelectedAgent = (agent: AgentType) => {
    try {
      localStorage.setItem(STORAGE_KEY, agent)
      setSelectedAgentState(agent)
      console.log('🤖 Agent switched to:', agent)
    } catch (error) {
      console.error('Failed to save agent:', error)
      setSelectedAgentState(agent)
    }
  }

  const agentConfig = {
    dawn: {
      name: 'D.A.W.N.',
      description: 'Dependable Agent Working Nicely - A friendly agent designed to assist the admin team manage tasks.',
      icon: '🌅',
    },
    lisa: {
      name: 'LISA',
      description: 'Learning & Intelligence Support Assistant - Chat with your documents using AI.',
      icon: '📚',
    },
  }

  return (
    <AgentContext.Provider value={{ selectedAgent, setSelectedAgent, agentConfig }}>
      {children}
    </AgentContext.Provider>
  )
}

export function useAgent() {
  const context = useContext(AgentContext)
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider')
  }
  return context
}
