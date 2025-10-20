/**
 * Audit Logging for HIPAA Compliance
 * Tracks all PHI access and tool usage
 */

export interface AuditLogEntry {
  timestamp: string
  userEmail: string
  action: string
  toolName?: string
  parameters?: any
  result?: string
  ipAddress?: string
}

/**
 * Log an audit event
 * For MVP: Logs to console (captured by Render logging system)
 * TODO: Later, store in database for searchable audit trail
 */
export function logAuditEvent(entry: AuditLogEntry) {
  // Format as structured JSON for easy parsing
  const logEntry = {
    type: 'AUDIT',
    level: 'INFO',
    ...entry,
  }

  // Log to console (Render captures and stores these)
  console.log(JSON.stringify(logEntry))

  // TODO: Future enhancement - store in PostgreSQL
  // await db.auditLogs.create({ data: logEntry })
}

/**
 * Log a chat message access
 */
export function logChatAccess(userEmail: string, messagePreview: string) {
  logAuditEvent({
    timestamp: new Date().toISOString(),
    userEmail,
    action: 'CHAT_ACCESS',
    parameters: {
      messagePreview: messagePreview.substring(0, 100), // Truncate for privacy
    },
  })
}

/**
 * Log a tool call
 */
export function logToolCall(
  userEmail: string,
  toolName: string,
  parameters: any,
  result: { success: boolean; message: string }
) {
  logAuditEvent({
    timestamp: new Date().toISOString(),
    userEmail,
    action: 'TOOL_CALL',
    toolName,
    parameters,
    result: result.success ? 'SUCCESS' : 'FAILED',
  })
}

/**
 * Log authentication events
 */
export function logAuthEvent(
  userEmail: string,
  eventType: 'LOGIN' | 'LOGOUT' | 'SESSION_EXPIRED'
) {
  logAuditEvent({
    timestamp: new Date().toISOString(),
    userEmail,
    action: `AUTH_${eventType}`,
  })
}
