"use client"

import { SessionProvider } from "next-auth/react"
import { AgentProvider } from "@/contexts/AgentContext"

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <AgentProvider>
        {children}
      </AgentProvider>
    </SessionProvider>
  )
}
