/**
 * Tool Call Handler for DAWN
 * Dispatches tool calls to the appropriate executor functions
 */

import { executeWriteStatus, executeAddNote, executeSearchDatabase, executeShowExcelPreview, executeGetContactSnapshot } from '../tools/executors'
import type { WriteStatusParams, AddNoteParams, SearchDatabaseParams, ShowExcelPreviewParams, GetContactSnapshotParams } from '../tools/definitions'

interface ToolResult {
  success: boolean
  message: string
  data?: any
}

/**
 * Handle a tool call from the LLM
 * @param toolName - Name of the tool to execute
 * @param args - Arguments for the tool (as parsed JSON object)
 * @returns Tool execution result
 */
export async function handleToolCall(toolName: string, args: any): Promise<ToolResult> {
  console.log(`🔧 Handling tool call: ${toolName}`)

  try {
    switch (toolName) {
      case 'writeStatusToContact':
        return await executeWriteStatus(args as WriteStatusParams)

      case 'addNoteToContact':
        return await executeAddNote(args as AddNoteParams)

      case 'searchDatabase':
        return await executeSearchDatabase(args as SearchDatabaseParams)

      case 'showExcelPreview':
        return await executeShowExcelPreview(args as ShowExcelPreviewParams)

      case 'getContactSnapshot':
        return await executeGetContactSnapshot(args as GetContactSnapshotParams)

      default:
        console.error(`❌ Unknown tool: ${toolName}`)
        return {
          success: false,
          message: `Unknown tool: ${toolName}. Available tools: writeStatusToContact, addNoteToContact, searchDatabase, showExcelPreview, getContactSnapshot`
        }
    }
  } catch (error) {
    console.error(`❌ Error executing tool ${toolName}:`, error)
    return {
      success: false,
      message: `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
