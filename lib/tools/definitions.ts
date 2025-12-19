/**
 * Tool Definitions for DAWN
 * Using pure JSON Schema format compatible with Azure OpenAI
 */

import type { ChatCompletionTool } from 'openai/resources/chat/completions'

export const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'writeStatusToContact',
      description: 'Update a client\'s status in the Excel sheet using a numeric status code. Use this when the user wants to change a client\'s status.',
      parameters: {
        type: 'object',
        properties: {
          patientName: {
            type: 'string',
            description: 'Full name of the client as it appears in the system'
          },
          status_code: {
            type: 'number',
            enum: [100, 101, 102, 103, 104, 200, 201, 202, 203, 204, 300, 400],
            description: 'Numeric status code. Waitlist: 100=New, 101=Left voicemail, 102=Response received, 103=Declined, 104=Inactive. Pending Scheduling: 200=Ready to schedule, 201=Left voicemail, 202=Scheduled, 203=No response, 204=Declined. PMR: 300=Submitted for review. Insurance: 400=Not accepted.'
          },
          editor: {
            type: 'string',
            description: 'Name of the admin performing the update. Always use "D.A.W.N." for automated updates.'
          }
        },
        required: ['patientName', 'status_code', 'editor'],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'addNoteToContact',
      description: 'Add a note to a client\'s record in Excel. Use this when the user wants to add information, comments, or updates to a client\'s file.',
      parameters: {
        type: 'object',
        properties: {
          patientName: {
            type: 'string',
            description: 'Full name of the client to add the note to'
          },
          note: {
            type: 'string',
            description: 'The note content to add to the client\'s record. Should be clear and descriptive.'
          },
          editor: {
            type: 'string',
            description: 'Name of the admin adding the note. Always use "D.A.W.N." for automated notes.'
          }
        },
        required: ['patientName', 'note', 'editor'],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'searchDatabase',
      description: 'Search the client database for specific information. Use this when the user wants to find clients, filter by status, or retrieve contact information.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query. Can be a client name, status filter, or other search criteria. Examples: "Active clients", "Reyna Vargas", "clients on waitlist"'
          }
        },
        required: ['query'],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'showExcelPreview',
      description: 'Display an embedded preview of the Excel client spreadsheet. Use this when the user asks to verify updates, see the spreadsheet, view raw data, or check the Excel file.',
      parameters: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: 'Brief explanation of why the preview is being shown. Examples: "Verifying status update for John Doe", "User requested to see spreadsheet", "Showing updated client data"'
          }
        },
        required: ['reason'],
        additionalProperties: false
      }
    }
  }
]

// Type definitions for tool parameters
export interface WriteStatusParams {
  patientName: string
  status_code: number
  editor: string
}

export interface AddNoteParams {
  patientName: string
  note: string
  editor: string
}

export interface SearchDatabaseParams {
  query: string
}

export interface ShowExcelPreviewParams {
  reason: string
}
