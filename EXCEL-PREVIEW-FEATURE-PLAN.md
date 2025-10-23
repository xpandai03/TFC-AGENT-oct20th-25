# Excel Preview Feature Plan - CONFIRMED ARCHITECTURE

## Feature Overview

**Goal**: After the AI agent successfully updates a patient's status or writes a note in Excel, display a live embedded preview of the Excel workbook in the chat interface as a message.

## User Answers ✅

1. **Excel Storage**: Excel cloud (OneDrive/Microsoft 365) ✓
2. **Preview Scope**: Whole sheet (easiest to start with) ✓
3. **Implementation**: Option C - Full embedded Excel viewer ✓
4. **Trigger**: "verify" function + when user wants to see raw data ✓
5. **Update Method**: n8n automations via webhook ✓
6. **AI Setup**: Azure OpenAI Chat Completions API with function calling (NOT Assistants SDK) ✓

## Current Architecture (Confirmed)

### AI Stack:
- **API**: Azure OpenAI Chat Completions
- **Tools**: Function calling with `tools` array
- **Pattern**: Agentic loop (max 5 steps)
- **Files**:
  - `lib/tools/definitions.ts` - Tool schemas
  - `lib/tools/executors.ts` - Tool execution (n8n webhooks)
  - `lib/agent/tool-handler.ts` - Tool dispatcher
  - `app/api/chat/route.ts` - Main chat endpoint

### Existing Tools:
1. `writeStatusToContact` → `https://n8n-familyconnection.agentglu.agency/webhook/update-contact-status`
2. `addNoteToContact` → `https://n8n-familyconnection.agentglu.agency/webhook-test/update-agent-notes`
3. `searchDatabase` → `https://n8n-familyconnection.agentglu.agency/webhook/query-excel-data`

## User Flow

```
User: "Update John Doe's status to 'Completed'"
  ↓
Agent: Calls writeStatusToContact tool
  ↓
n8n: Updates Excel on OneDrive
  ↓
Agent: Auto-calls showExcelPreview tool (NEW)
  ↓
n8n: Returns OneDrive embed URL (NEW)
  ↓
App: Displays embedded Excel viewer in chat
  ↓
User: Sees live Excel sheet with updates
```

## Reference Screenshots Analysis

Based on the screenshots provided:
- Screenshot 1: Shows an Excel workbook with patient data
- Screenshot 2: Shows embedded preview in chat interface

## Critical Questions to Answer

### 1. Excel File Management
**Questions:**
- [ ] What Excel file(s) are we working with?
  - Single master file for all patients?
  - One file per patient?
  - Multiple sheets in one file?
- [ ] Where is the Excel file stored?
  - Local file system?
  - Cloud storage (OneDrive, Google Drive, S3)?
  - Database (converted to/from Excel)?
  - Render persistent storage?
- [ ] What's the file path/location?
- [ ] Who has permission to read/write this file?

### 2. Preview Type & Scope
**Questions:**
- [ ] What should be displayed in the preview?
  - Entire workbook (all sheets)?
  - Specific sheet only?
  - Specific row/range related to the patient?
  - Just the cells that were updated?
- [ ] Should the preview be:
  - Static image/screenshot?
  - Interactive spreadsheet viewer (can scroll, click)?
  - HTML table representation?
  - Live Excel embed (iframe)?
- [ ] How much data should be shown?
  - Full spreadsheet?
  - Last 10 rows?
  - Filtered view (only relevant patient)?

### 3. Technical Implementation
**Questions:**
- [ ] Are you using OpenAI Assistants API or regular Chat Completions?
- [ ] Is this a:
  - Function call that returns preview data?
  - Widget/component that renders on frontend?
  - Custom message type in the chat?
- [ ] How does the agent update Excel currently?
  - Python script?
  - JavaScript library (exceljs, xlsx)?
  - API call to external service?
- [ ] Where does the preview generation happen?
  - Backend (server-side)?
  - Frontend (client-side)?

### 4. Trigger Conditions
**Questions:**
- [ ] When exactly should the preview be shown?
  - After EVERY Excel update?
  - Only when user asks to verify?
  - Only for specific types of updates (status vs notes)?
  - Agent decides when to show it?
- [ ] Should there be a manual "Show Preview" button?
- [ ] Should it auto-refresh if Excel changes?

### 5. User Experience
**Questions:**
- [ ] Should the preview be:
  - Collapsible/expandable?
  - Full-width in chat?
  - Modal/popup?
  - Inline like an image message?
- [ ] Can users interact with it?
  - Click to open full Excel?
  - Edit directly in preview?
  - Download button?
  - Read-only?
- [ ] Should it highlight the changed cells/rows?

## Proposed Architecture (Pending Answers)

### Option A: Image Screenshot Approach
**How it works:**
1. Agent updates Excel file
2. Agent calls `generate_excel_preview()` function
3. Backend:
   - Opens Excel file
   - Takes screenshot of relevant area
   - Saves as PNG
   - Returns image URL
4. Frontend: Displays image in chat as message

**Pros:**
- Simple implementation
- Works with any Excel complexity
- No interactive component needed
- Fast to load

**Cons:**
- Not interactive
- Image quality issues with large sheets
- Can't copy/paste data
- Need headless browser or Excel API

### Option B: HTML Table Conversion
**How it works:**
1. Agent updates Excel file
2. Agent calls `generate_excel_preview()` function
3. Backend:
   - Reads Excel file
   - Converts to JSON/HTML table
   - Returns table data
4. Frontend: Renders as HTML table in chat

**Pros:**
- Interactive (can select text)
- Lightweight
- Easy to implement
- Can style/highlight cells

**Cons:**
- Loses Excel formatting
- No formulas visible
- Complex sheets hard to represent

### Option C: Embedded Spreadsheet Viewer
**How it works:**
1. Agent updates Excel file
2. Agent calls `generate_excel_preview()` function
3. Backend:
   - Uploads Excel to cloud service (OneDrive, Google Sheets)
   - Gets embed URL
   - Returns iframe URL
4. Frontend: Shows iframe in chat

**Pros:**
- Fully interactive
- Preserves formatting
- Users can scroll, zoom
- Real Excel experience

**Cons:**
- Requires cloud service
- Privacy concerns
- Slower load time
- Depends on external service

### Option D: React Spreadsheet Component
**How it works:**
1. Agent updates Excel file
2. Agent calls `generate_excel_preview()` function
3. Backend:
   - Reads Excel file
   - Converts to JSON
   - Returns structured data
4. Frontend: Renders with library (like react-spreadsheet, handsontable)

**Pros:**
- Interactive
- Customizable styling
- Can highlight changes
- No external dependencies

**Cons:**
- Complex implementation
- Performance issues with large files
- Need to handle formulas, formatting

## IMPLEMENTATION PLAN - Option C: Embedded Excel Viewer

### Step-by-Step Implementation

#### Phase 1: Add New Tool Definition (15 min)

**File: `lib/tools/definitions.ts`**

Add new tool to the tools array:

```typescript
{
  type: 'function',
  function: {
    name: 'showExcelPreview',
    description: 'Display an embedded preview of the Excel workbook. Use this after updating patient data to verify changes, or when the user asks to see the spreadsheet/raw data.',
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Why the preview is being shown (e.g., "Verifying status update for John Doe", "User requested to see spreadsheet")'
        }
      },
      required: ['reason'],
      additionalProperties: false
    }
  }
}
```

Add TypeScript interface:

```typescript
export interface ShowExcelPreviewParams {
  reason: string
}
```

#### Phase 2: Create Tool Executor (20 min)

**File: `lib/tools/executors.ts`**

Add new n8n webhook URL:

```typescript
const N8N_WEBHOOKS = {
  writeStatus: 'https://n8n-familyconnection.agentglu.agency/webhook/update-contact-status',
  addNote: 'https://n8n-familyconnection.agentglu.agency/webhook-test/update-agent-notes',
  searchDatabase: 'https://n8n-familyconnection.agentglu.agency/webhook/query-excel-data',
  getExcelEmbed: 'https://n8n-familyconnection.agentglu.agency/webhook/get-excel-embed', // NEW
}
```

Add executor function:

```typescript
/**
 * Execute showExcelPreview tool
 * Calls n8n webhook to get OneDrive Excel embed URL
 */
export async function executeShowExcelPreview(params: ShowExcelPreviewParams) {
  console.log('🔧 Tool: showExcelPreview called with:', params)

  try {
    const response = await fetch(N8N_WEBHOOKS.getExcelEmbed, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: params.reason,
      }),
    })

    if (!response.ok) {
      console.error('❌ n8n webhook error:', response.status, response.statusText)
      return {
        success: false,
        message: `Failed to get Excel preview: ${response.statusText}`,
      }
    }

    const data = await response.json()
    console.log('✅ n8n response:', data)

    // Expect data format: { embedUrl: "https://onedrive.live.com/embed?..." }
    return {
      success: true,
      message: `Excel preview ready`,
      data: {
        embedUrl: data.embedUrl,
        type: 'excel_preview' // Special flag for frontend
      },
    }
  } catch (error) {
    console.error('❌ Error calling n8n webhook:', error)
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
```

#### Phase 3: Update Tool Handler (5 min)

**File: `lib/agent/tool-handler.ts`**

Add import:

```typescript
import { executeWriteStatus, executeAddNote, executeSearchDatabase, executeShowExcelPreview } from '../tools/executors'
import type { WriteStatusParams, AddNoteParams, SearchDatabaseParams, ShowExcelPreviewParams } from '../tools/definitions'
```

Add case to switch statement:

```typescript
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

      case 'showExcelPreview': // NEW
        return await executeShowExcelPreview(args as ShowExcelPreviewParams)

      default:
        console.error(`❌ Unknown tool: ${toolName}`)
        return {
          success: false,
          message: `Unknown tool: ${toolName}`
        }
    }
  } catch (error) {
    console.error(`❌ Error executing tool ${toolName}:`, error)
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
```

#### Phase 4: Create Excel Preview Component (30 min)

**File: `components/ExcelPreview.jsx`** (NEW)

```jsx
'use client'

import { useState } from 'react'
import { FileSpreadsheet, X, Maximize2, Minimize2 } from 'lucide-react'

export default function ExcelPreview({ embedUrl, reason }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="my-4 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Excel Spreadsheet Preview
          </span>
          {reason && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              • {reason}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
            title={isExpanded ? 'Minimize' : 'Maximize'}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Embedded Excel iframe */}
      <div className={`${isExpanded ? 'h-[600px]' : 'h-[400px]'} transition-all`}>
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          title="Excel Spreadsheet Preview"
          className="bg-white"
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Live view from OneDrive • Changes update in real-time
        </p>
      </div>
    </div>
  )
}
```

#### Phase 5: Handle Excel Preview Messages in Chat (30 min)

**File: `app/api/chat/route.ts`**

Modify the tool result handling section (around line 120-140):

```typescript
// After tool execution in the agentic loop
const toolResults = await Promise.all(
  (assistantMessage.tool_calls || []).map(async (toolCall) => {
    const result = await handleToolCall(
      toolCall.function.name,
      JSON.parse(toolCall.function.arguments)
    )

    // Check if this is an Excel preview result
    if (result.data?.type === 'excel_preview') {
      // Return special format that includes embed URL
      return {
        tool_call_id: toolCall.id,
        role: 'tool' as const,
        content: JSON.stringify({
          ...result,
          __isExcelPreview: true, // Flag for frontend
          embedUrl: result.data.embedUrl
        })
      }
    }

    // Regular tool result
    return {
      tool_call_id: toolCall.id,
      role: 'tool' as const,
      content: JSON.stringify(result)
    }
  })
)

currentMessages.push(...toolResults)
```

**File: `components/ChatPane.jsx`**

Add Excel preview rendering logic:

```javascript
// Import the component
import ExcelPreview from './ExcelPreview'

// In the message rendering section, add:
```

## Implementation Checklist (After Questions Answered)

### Phase 1: Backend
- [ ] Create Excel reading utility
- [ ] Implement `/api/excel-preview` endpoint
- [ ] Add function definition to agent tools
- [ ] Test Excel data parsing

### Phase 2: Frontend
- [ ] Create `ExcelPreview` component
- [ ] Add custom message type handling
- [ ] Style preview to match chat aesthetic
- [ ] Add cell highlighting for changes

### Phase 3: Integration
- [ ] Connect agent function call to API
- [ ] Handle preview data in chat state
- [ ] Add loading states
- [ ] Error handling for missing files

### Phase 4: Polish
- [ ] Add expand/collapse functionality
- [ ] Download button
- [ ] Refresh preview button
- [ ] Mobile responsive design

## Files to Create/Modify

### New Files:
- `app/api/excel-preview/route.ts` - Backend endpoint
- `components/ExcelPreview.jsx` - Preview component
- `lib/excel-utils.ts` - Excel reading utilities
- `tools/excelPreview.ts` - Agent tool definition

### Modified Files:
- `components/ChatPane.jsx` - Handle excel_preview message type
- `components/AIAssistantUI.jsx` - Process excel preview tool calls
- `lib/ai/tools.ts` - Add excel preview to available tools

## Open Questions for User

1. **Where is your patient Excel file currently stored?**
   - Local path?
   - Cloud URL?
   - In database?

2. **What does the Excel structure look like?**
   - Column names?
   - How many rows typically?
   - Multiple sheets?

3. **When should the preview show?**
   - Every time agent updates Excel?
   - Only when agent mentions "verification"?
   - User can manually request?

4. **What level of interactivity do you want?**
   - Just view (image/table)?
   - Can scroll/search?
   - Can edit inline?

5. **Should it show the entire sheet or filtered data?**
   - Just the patient row that was updated?
   - Last N rows?
   - Entire sheet?

6. **Are you using OpenAI Assistants API or Chat Completions?**
   - Function calling setup?
   - Streaming responses?

7. **Privacy concerns?**
   - Is patient data sensitive?
   - Should previews be cached?
   - Any HIPAA compliance needed?

## Next Steps

1. **Answer the open questions above**
2. **Choose preferred architecture option** (A, B, C, or D)
3. **Review and approve this plan**
4. **I'll create detailed implementation steps**
5. **Build in phases with testing**

## Estimated Complexity

- **Option A (Screenshot)**: Medium (3-4 hours)
- **Option B (HTML Table)**: Low (2-3 hours)  ⭐ RECOMMENDED FOR MVP
- **Option C (Cloud Embed)**: High (5-6 hours)
- **Option D (React Component)**: Medium-High (4-5 hours)

## Success Criteria

- [ ] Agent can trigger preview after Excel update
- [ ] Preview displays correctly in chat
- [ ] Updated cells are highlighted
- [ ] Performance is acceptable (< 2s load)
- [ ] Mobile friendly
- [ ] Error handling works
- [ ] User can distinguish preview from regular messages

## n8n Webhook Requirements

**New Webhook Needed**: `https://n8n-familyconnection.agentglu.agency/webhook/get-excel-embed`

**Expected Request**:
```json
{
  "reason": "Verifying status update for John Doe"
}
```

**Expected Response**:
```json
{
  "embedUrl": "https://onedrive.live.com/embed?resid=XXXXX&authkey=XXXXX&em=2&wdAllowInteractivity=False&wdHideGridlines=True"
}
```

**How to get OneDrive embed URL**:
1. Open Excel file in OneDrive/SharePoint
2. Click "File" → "Share" → "Embed"
3. Copy the iframe src URL
4. Or use Microsoft Graph API to generate embed URL programmatically

## Complete Implementation Summary

### New Files to Create:
1. `components/ExcelPreview.jsx` - React component for iframe embed

### Files to Modify:
1. `lib/tools/definitions.ts` - Add showExcelPreview tool
2. `lib/tools/executors.ts` - Add executeShowExcelPreview function
3. `lib/agent/tool-handler.ts` - Add case for showExcelPreview
4. `app/api/chat/route.ts` - Handle Excel preview in tool results (OPTIONAL - may work without changes)
5. `components/ChatPane.jsx` - Render ExcelPreview component (OPTIONAL - may work without changes)

### External Dependencies:
1. n8n workflow to return OneDrive embed URL
2. OneDrive/Microsoft 365 Excel file with sharing enabled

### Testing Plan:
1. **Unit Test**: Call showExcelPreview tool directly, verify n8n response
2. **Integration Test**: Ask agent "verify the update" after status change
3. **E2E Test**: Full flow - update status → verify → see Excel embed
4. **UX Test**: Check iframe loads, is scrollable, shows correct data

### Estimated Time:
- **Backend (Phases 1-3)**: 40 minutes
- **Frontend (Phases 4-5)**: 60 minutes
- **n8n Workflow**: 30 minutes
- **Testing**: 30 minutes
- **Total**: ~2.5 hours

### Success Criteria:
- [ ] Agent can call showExcelPreview tool
- [ ] n8n returns valid OneDrive embed URL
- [ ] Iframe displays in chat correctly
- [ ] Excel sheet is interactive (scroll, zoom)
- [ ] Works on desktop and mobile
- [ ] No console errors
- [ ] HIPAA compliant (OneDrive audit log enabled)

## Next Steps

1. **Review this plan** - Approve or request changes
2. **Set up n8n webhook** - Create workflow to return embed URL
3. **Test embed URL manually** - Verify iframe works in browser
4. **Implement backend** - Phases 1-3
5. **Implement frontend** - Phases 4-5
6. **Test end-to-end** - Full user flow
7. **Deploy to production** - Render deployment

