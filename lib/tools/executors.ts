import type { WriteStatusParams, AddNoteParams, SearchDatabaseParams, ShowExcelPreviewParams } from './definitions'

/**
 * n8n Webhook URLs for tool execution
 */
const N8N_WEBHOOKS = {
  writeStatus: 'https://n8n-familyconnection.agentglu.agency/webhook/update-contact-status',
  addNote: 'https://n8n-familyconnection.agentglu.agency/webhook/update-agent-notes',
  searchDatabase: 'https://n8n-familyconnection.agentglu.agency/webhook/query-excel-data',
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
