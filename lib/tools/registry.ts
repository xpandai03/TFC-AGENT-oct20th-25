import { tool, jsonSchema } from 'ai'
import { executeWriteStatus, executeAddNote } from './executors'

/**
 * DAWN's Tool Registry
 * Using jsonSchema() for better Azure OpenAI compatibility
 */
export const tools = {
  writeStatusToContact: tool({
    description: 'Update a client\'s status in the Excel sheet. Use this when the user wants to change a client\'s status.',
    parameters: jsonSchema<{
      patientName: string
      status: string
      editor: string
    }>({
      type: 'object',
      properties: {
        patientName: {
          type: 'string',
          description: 'Full name of the client',
        },
        status: {
          type: 'string',
          description: 'New status value (e.g. "Ready for Intake", "Waitlist", "Active")',
        },
        editor: {
          type: 'string',
          description: 'Name of the admin performing the update. Always use "D.A.W.N."',
        },
      },
      required: ['patientName', 'status', 'editor'],
      additionalProperties: false,
    }),
    execute: async ({ patientName, status, editor }) => {
      console.log('🔧 writeStatusToContact executing:', { patientName, status, editor })
      const result = await executeWriteStatus({ patientName, status, editor })
      return JSON.stringify(result)
    },
  }),

  addNoteToContact: tool({
    description: 'Add a note to a client\'s record in Excel. Use this when the user wants to add information or updates to a client\'s file.',
    parameters: jsonSchema<{
      patientName: string
      note: string
      editor: string
    }>({
      type: 'object',
      properties: {
        patientName: {
          type: 'string',
          description: 'Full name of the client',
        },
        note: {
          type: 'string',
          description: 'Note content to add to client record',
        },
        editor: {
          type: 'string',
          description: 'Name of the admin adding the note. Always use "D.A.W.N."',
        },
      },
      required: ['patientName', 'note', 'editor'],
      additionalProperties: false,
    }),
    execute: async ({ patientName, note, editor }) => {
      console.log('🔧 addNoteToContact executing:', { patientName, note, editor })
      const result = await executeAddNote({ patientName, note, editor })
      return JSON.stringify(result)
    },
  }),
}

export type ToolName = keyof typeof tools
