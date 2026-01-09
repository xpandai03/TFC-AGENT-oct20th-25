import type { WriteStatusParams, AddNoteParams, SearchDatabaseParams, ShowExcelPreviewParams, GetContactSnapshotParams, GetWaitlistSummaryParams } from './definitions'

/**
 * n8n Webhook URLs for tool execution
 */
const N8N_WEBHOOKS = {
  writeStatus: 'https://n8n-familyconnection.agentglu.agency/webhook/update-contact-status',
  addNote: 'https://n8n-familyconnection.agentglu.agency/webhook/update-agent-notes',
  searchDatabase: 'https://n8n-familyconnection.agentglu.agency/webhook/query-excel-data',
  getContactSnapshot: 'https://n8n-familyconnection.agentglu.agency/webhook/get-contact-snapshot',
  getWaitlistSummary: 'https://n8n-familyconnection.agentglu.agency/webhook/get-waitlist-summary',
}

/**
 * Execute writeStatusToContact tool
 * Calls n8n webhook to update a client's status in Excel using numeric status_code
 */
export async function executeWriteStatus(params: WriteStatusParams) {
  console.log('🔧 Tool: writeStatusToContact called with:', params)

  try {
    const response = await fetch(N8N_WEBHOOKS.writeStatus, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        patientName: params.patientName,
        status_code: params.status_code,
        editor: params.editor,

      }),
    })

    if (!response.ok) {
      console.error('❌ n8n webhook error:', response.status, response.statusText)
      return {
        success: false,
        message: `Failed to update status: ${response.statusText}`,
      }
    }

    const data = await response.json()
    console.log('✅ n8n response:', data)

    return {
      success: true,
      message: `Successfully updated ${params.patientName}'s status to code ${params.status_code}`,
      data,
    }
  } catch (error) {
    console.error('❌ Error calling n8n webhook:', error)
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Execute addNoteToContact tool
 * Calls n8n webhook to add a note to a client's record
 */
export async function executeAddNote(params: AddNoteParams) {
  console.log('🔧 Tool: addNoteToContact called with:', params)

  try {
    const response = await fetch(N8N_WEBHOOKS.addNote, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        patientName: params.patientName,
        note: params.note,
        editor: params.editor,
      }),
    })

    if (!response.ok) {
      console.error('❌ n8n webhook error:', response.status, response.statusText)
      return {
        success: false,
        message: `Failed to add note: ${response.statusText}`,
      }
    }

    const data = await response.json()
    console.log('✅ n8n response:', data)

    return {
      success: true,
      message: `Successfully added note to ${params.patientName}'s record`,
      data,
    }
  } catch (error) {
    console.error('❌ Error calling n8n webhook:', error)
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Execute searchDatabase tool
 * Calls n8n webhook to search the client database
 */
export async function executeSearchDatabase(params: SearchDatabaseParams) {
  console.log('🔧 Tool: searchDatabase called with:', params)

  try {
    const response = await fetch(N8N_WEBHOOKS.searchDatabase, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: params.query,
      }),
    })

    if (!response.ok) {
      console.error('❌ n8n webhook error:', response.status, response.statusText)
      return {
        success: false,
        message: `Failed to search database: ${response.statusText}`,
      }
    }

    const data = await response.json()
    console.log('✅ n8n response:', data)

    return {
      success: true,
      message: `Search completed for query: "${params.query}"`,
      data,
    }
  } catch (error) {
    console.error('❌ Error calling n8n webhook:', error)
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Execute showExcelPreview tool
 * Returns the SharePoint Excel embed URL for display in chat
 */
export async function executeShowExcelPreview(params: ShowExcelPreviewParams) {
  console.log('🔧 Tool: showExcelPreview called with:', params)

  try {
    // Get embed URL from environment variable (check both possible names)
    const embedUrl = process.env.EXCEL_EMBED_URL || process.env.EXCEL_EMBED_URL?.trim()

    // Debug: Log environment variable status
    console.log('📋 Excel Embed URL check:', {
      hasEnvVar: !!process.env.EXCEL_EMBED_URL,
      envVarLength: process.env.EXCEL_EMBED_URL?.length || 0,
      envVarPrefix: process.env.EXCEL_EMBED_URL ? `${process.env.EXCEL_EMBED_URL.substring(0, 30)}...` : 'N/A',
      hasEmbedUrl: !!embedUrl,
      embedUrlLength: embedUrl?.length || 0,
    })

    if (!embedUrl) {
      console.error('❌ EXCEL_EMBED_URL not configured')
      console.error('💡 To fix: Add EXCEL_EMBED_URL environment variable in Railway')
      console.error('💡 Get embed URL from SharePoint/OneDrive: File → Share → Embed')
      return {
        success: false,
        message: 'Excel preview is not configured. Please add EXCEL_EMBED_URL environment variable in Railway settings.',
      }
    }

    console.log('✅ Returning Excel embed URL')

    return {
      success: true,
      message: `Excel spreadsheet preview is being displayed.`,
      data: {
        embedUrl,
        reason: params.reason,
        type: 'excel_preview', // Special flag for frontend - captured separately in route.ts
      },
    }
  } catch (error) {
    console.error('❌ Error in showExcelPreview:', error)
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Execute getContactSnapshot tool
 * Calls n8n webhook to retrieve a contact's current state (read-only)
 */
export async function executeGetContactSnapshot(params: GetContactSnapshotParams) {
  console.log('🔧 Tool: getContactSnapshot called with:', params)

  try {
    const response = await fetch(N8N_WEBHOOKS.getContactSnapshot, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contactName: params.contactName,
      }),
    })

    if (!response.ok) {
      console.error('❌ n8n webhook error:', response.status, response.statusText)
      return {
        success: false,
        message: `Failed to retrieve contact snapshot: ${response.statusText}`,
      }
    }

    const data = await response.json()
    console.log('✅ n8n response:', data)

    // Handle different response scenarios
    if (data.found === true && data.contact) {
      return {
        success: true,
        message: `Retrieved snapshot for ${data.contact.name}`,
        data: data.contact,
      }
    } else if (data.found === false && data.reason === 'NO_MATCH') {
      return {
        success: true,
        message: `No contact found matching "${params.contactName}". Please verify the name and try again.`,
        data: { found: false, reason: 'NO_MATCH' },
      }
    } else if (data.found === false && data.reason === 'MULTIPLE_MATCHES') {
      return {
        success: true,
        message: `Multiple contacts found matching "${params.contactName}". Please be more specific.`,
        data: { found: false, reason: 'MULTIPLE_MATCHES', candidates: data.candidates },
      }
    } else {
      // Unexpected response format
      return {
        success: true,
        message: `Received response for "${params.contactName}"`,
        data,
      }
    }
  } catch (error) {
    console.error('❌ Error calling n8n webhook:', error)
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Execute getWaitlistSummary tool
 * Calls n8n webhook to retrieve aggregate waitlist metrics (read-only)
 */
export async function executeGetWaitlistSummary(params: GetWaitlistSummaryParams) {
  console.log('🔧 Tool: getWaitlistSummary called with:', params)

  try {
    // Build request body - only include includeInactive if explicitly provided
    const requestBody: { includeInactive?: boolean } = {}
    if (params.includeInactive !== undefined) {
      requestBody.includeInactive = params.includeInactive
    }

    const response = await fetch(N8N_WEBHOOKS.getWaitlistSummary, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      console.error('❌ n8n webhook error:', response.status, response.statusText)
      return {
        success: false,
        message: `Failed to retrieve waitlist summary: ${response.statusText}`,
      }
    }

    const data = await response.json()
    console.log('✅ n8n response:', data)

    // Return the summary metrics for agent reasoning
    return {
      success: true,
      message: `Retrieved waitlist summary: ${data.totalActive} active contacts, average wait ${data.averageWaitDays} days`,
      data,
    }
  } catch (error) {
    console.error('❌ Error calling n8n webhook:', error)
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
