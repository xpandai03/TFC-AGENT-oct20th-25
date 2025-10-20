# DAWN AI Agent Build Plan - October 20, 2025

## Project Overview
Build **DAWN (Dependable Agent Working Nicely)** - an AI agent using Vercel AI SDK with Azure OpenAI that manages client records for The Family Connection through a chat interface and integrates with n8n workflows.

---

## Technology Stack
- **Framework**: Vercel AI SDK (Core)
- **LLM Provider**: Azure OpenAI (gpt-4o-mini deployment)
- **Runtime**: Next.js 15.2.4 (App Router)
- **Automation**: n8n workflows (via tool calling)
- **Frontend**: Existing React chat interface in AIAssistantUI.jsx

---

## Phase 1: Environment & Dependencies Setup

### 1.1 Install Vercel AI SDK Packages
```bash
npm install ai @ai-sdk/azure
```

### 1.2 Environment Variables Configuration
- Review and validate `.env-azure` credentials
- Fix API_VERSION field (currently shows resource name instead of version)
- Add proper environment variable structure:
  ```
  AZURE_OPENAI_API_KEY=<actual-key>
  AZURE_RESOURCE_NAME=adavi-mf694jmx-eastus2-project
  AZURE_API_VERSION=2025-01-01-preview
  AZURE_DEPLOYMENT_NAME=gpt-4o-mini
  ```

### 1.3 Create Environment Loader
- Create `lib/azure-config.ts` to centralize Azure configuration
- Validate all required env vars are present
- Export configured Azure OpenAI instance

**Deliverable**: Working Azure OpenAI connection ready for use

---

## Phase 2: Azure OpenAI Integration

### 2.1 Create Azure Provider Instance
Using Vercel AI SDK pattern from transcript:
```typescript
import { createAzure } from '@ai-sdk/azure'

const azure = createAzure({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  resourceName: process.env.AZURE_RESOURCE_NAME,
})

const model = azure(process.env.AZURE_DEPLOYMENT_NAME)
```

### 2.2 Test Basic Generation
- Create test script `scripts/test-azure.ts`
- Verify connection with simple `generateText` call
- Confirm streaming works with `streamText`
- Test with DAWN system prompt

**Deliverable**: Validated Azure OpenAI connection with working model instance

---

## Phase 3: Tool Definitions

### 3.1 Define Tool Types
Create `lib/tools/types.ts` with TypeScript interfaces matching system prompt:
```typescript
interface WriteStatusParams {
  patientName: string
  status: string
  editor: string
}

interface AddNoteParams {
  patientName: string
  note: string
  editor: string
}

interface ShowContactDataParams {
  // No params needed per system prompt
}
```

### 3.2 Create Tool Schemas
Create `lib/tools/schemas.ts` using Zod (Vercel AI SDK requirement):
```typescript
import { z } from 'zod'

const writeStatusSchema = z.object({
  patientName: z.string().describe('Full name of the client'),
  status: z.string().describe('New status value (e.g. "Ready for Intake")'),
  editor: z.string().describe('Name of the admin performing the update'),
})

const addNoteSchema = z.object({
  patientName: z.string().describe('Full name of the client'),
  note: z.string().describe('Note content to add to client record'),
  editor: z.string().describe('Name of the admin adding the note'),
})

const showContactDataSchema = z.object({})
```

### 3.3 Implement Tool Executors
Create `lib/tools/executors.ts` - these will call n8n webhooks:

**Tool 1: writeStatusToContact**
- Calls n8n webhook for status updates
- Webhook URL: TBD (will be n8n workflow endpoint)
- Returns confirmation message

**Tool 2: addNoteToContact**
- Calls n8n webhook for note addition
- Webhook URL: TBD
- Returns confirmation message

**Tool 3: agentShowContactData**
- Calls n8n webhook to fetch contact data
- Webhook URL: TBD
- Returns formatted contact data

### 3.4 Create Tool Registry
Create `lib/tools/registry.ts`:
```typescript
import { tool } from 'ai'

export const tools = {
  writeStatusToContact: tool({
    description: 'Update a client\'s status in the Excel sheet',
    parameters: writeStatusSchema,
    execute: async (params) => {
      // Call n8n webhook
      // Return result
    },
  }),
  // ... other tools
}
```

**Deliverable**: Complete tool definitions ready for agent integration

---

## Phase 4: Agent Core Implementation

### 4.1 Create Agent Service
Create `lib/agent/dawn.ts` - the core agent logic:

```typescript
import { streamText } from 'ai'
import { model } from '../azure-config'
import { tools } from '../tools/registry'
import { DAWN_SYSTEM_PROMPT } from './prompts'

export async function chatWithDAWN(
  message: string,
  conversationHistory: Message[] = []
) {
  return streamText({
    model,
    system: DAWN_SYSTEM_PROMPT,
    messages: [
      ...conversationHistory,
      { role: 'user', content: message }
    ],
    tools,
    maxSteps: 5, // Allow multi-step tool calling for complex requests
  })
}
```

### 4.2 Create System Prompt Module
Create `lib/agent/prompts.ts`:
- Export DAWN_SYSTEM_PROMPT (content from agent-system-prompt.md)
- Ensure format matches Vercel AI SDK expectations

### 4.3 Add Conversation History Management
- Leverage existing `messages` array pattern from AIAssistantUI.jsx
- Convert to Vercel AI SDK `CoreMessage[]` format
- Implement message history trimming (prevent token overflow)

**Deliverable**: Functioning DAWN agent that can process messages and call tools

---

## Phase 5: Frontend Integration

### 5.1 Update API Route
Modify `app/api/chat/route.js` → `app/api/chat/route.ts`:

```typescript
import { chatWithDAWN } from '@/lib/agent/dawn'

export async function POST(request: Request) {
  const { message, history } = await request.json()

  const result = await chatWithDAWN(message, history)

  // Stream the response back to client
  return result.toTextStreamResponse()
}
```

### 5.2 Update Frontend Chat Integration
Modify `components/AIAssistantUI.jsx`:

**Changes to sendMessage function**:
- Keep conversation history structure
- Pass full message history to API
- Handle streaming response from Vercel AI SDK
- Display tool calls in UI (optional but recommended for transparency)

**Consider using Vercel AI SDK UI helpers**:
- Could migrate to `useChat` hook from `ai/react` for cleaner integration
- Alternative: stick with current custom implementation, just update API calls

### 5.3 Add Tool Calling UI Indicators
- Show when DAWN is calling tools (e.g., "Updating Reyna's status...")
- Display tool results inline in chat
- Add visual distinction between text responses and tool actions

**Deliverable**: Working chat interface connected to DAWN agent

---

## Phase 6: n8n Connection via Tools

### 6.1 Create n8n Webhook Endpoints
For each tool, create corresponding n8n workflow:

**Workflow 1: Write Status to Contact** ✅ WEBHOOK PROVIDED
- Webhook URL: `https://n8n-familyconnection.agentglu.agency/webhook/write-status-to-contact`
- Webhook trigger receiving: `{ patientName, status, editor }`
- Excel Online (Business) node to update row
- Return success/failure message

**Workflow 2: Add Note to Contact** ✅ WEBHOOK PROVIDED
- Webhook URL: `https://n8n-familyconnection.agentglu.agency/webhook-test/update-agent-notes`
- Webhook trigger receiving: `{ patientName, note, editor }`
- Excel Online node to append note
- Return confirmation

**Workflow 3: Show Contact Data** ⏸️ WEBHOOK TBD
- Webhook URL: TBD (not yet provided)
- Webhook trigger (no params)
- Excel Online node to read rows
- Filter/format data
- Return structured contact data

### 6.2 Configure Webhook URLs
Update `lib/tools/executors.ts` with actual n8n webhook URLs:
```typescript
const N8N_WEBHOOKS = {
  writeStatus: 'https://n8n-familyconnection.agentglu.agency/webhook/write-status-to-contact',
  addNote: 'https://n8n-familyconnection.agentglu.agency/webhook-test/update-agent-notes',
  showContacts: null, // TBD - will implement when webhook is provided
}
```

### 6.3 Implement Error Handling
- Handle n8n webhook failures gracefully
- Return user-friendly error messages
- Log errors for debugging
- Implement retry logic for transient failures

### 6.4 Add Request Validation
- Validate tool parameters before calling n8n
- Sanitize inputs to prevent injection issues
- Add request/response logging for audit trail

**Deliverable**: Full integration between DAWN agent and n8n workflows

---

## Phase 7: Testing & Refinement

### 7.1 Unit Testing
- Test each tool executor independently
- Mock n8n webhook responses
- Verify schema validation works correctly

### 7.2 Integration Testing
Test complete user flows:
1. "Update Reyna Vargas's status to Ready for Intake"
   - Should call `writeStatusToContact` tool
   - Should trigger n8n workflow
   - Should update Excel
   - Should return confirmation

2. "Add a note saying client confirmed appointment for Reyna"
   - Should call `addNoteToContact` tool
   - Should properly parse patient name and note
   - Should update Excel

3. "Show me all inactive clients"
   - Should call `agentShowContactData` tool
   - Should return formatted contact list
   - Should display in chat UI

### 7.3 Edge Case Testing
- Ambiguous requests (DAWN should ask clarifying questions)
- Multiple tool calls in sequence
- Invalid patient names (should handle gracefully)
- n8n webhook timeouts/failures

### 7.4 Performance Optimization
- Monitor Azure OpenAI token usage
- Optimize system prompt if needed
- Implement response caching where appropriate
- Add streaming optimizations

### 7.5 Monitoring & Logging
- Set up structured logging for:
  - All tool calls and results
  - Agent decisions (which tools to call)
  - n8n webhook requests/responses
  - Errors and failures
- Consider adding analytics/telemetry

**Deliverable**: Production-ready DAWN agent with comprehensive test coverage

---

## File Structure (Proposed)

```
TFC-AGENT-OCT25/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts (updated)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AIAssistantUI.jsx (updated)
│   └── ... (other existing components)
├── lib/
│   ├── agent/
│   │   ├── dawn.ts (new - core agent logic)
│   │   └── prompts.ts (new - system prompts)
│   ├── tools/
│   │   ├── types.ts (new - TypeScript interfaces)
│   │   ├── schemas.ts (new - Zod schemas)
│   │   ├── executors.ts (new - tool implementations)
│   │   └── registry.ts (new - tool registry)
│   └── azure-config.ts (new - Azure setup)
├── scripts/
│   └── test-azure.ts (new - testing script)
├── .env-azure (update)
├── 20OctBUILD.md (this file)
└── package.json (update dependencies)
```

---

## Success Criteria

✅ DAWN can understand natural language requests
✅ DAWN correctly identifies which tool to call
✅ DAWN calls tools with correct parameters
✅ n8n workflows successfully execute
✅ Excel data is updated correctly
✅ Chat UI displays responses and tool actions clearly
✅ Error handling is robust and user-friendly
✅ System maintains conversation context
✅ Response times are acceptable (<5s for most requests)
✅ All tool calls are logged for audit purposes

---

## Risk Mitigation

| Risk | Mitigation Strategy |
|------|-------------------|
| Azure OpenAI quota limits | Monitor usage, implement rate limiting, add graceful degradation |
| n8n webhook failures | Implement retry logic, add timeout handling, provide fallback messages |
| Ambiguous user requests | Improve system prompt, add clarification flows, provide examples |
| Excel API rate limits | Add request queuing, implement caching, batch operations where possible |
| Token context overflow | Implement message history trimming, summarize old conversations |
| CORS issues (if any) | Use Next.js API routes as proxy (already in place) |

---

## Timeline Estimate

- **Phase 1**: 30 minutes (setup)
- **Phase 2**: 45 minutes (Azure integration)
- **Phase 3**: 1.5 hours (tool definitions)
- **Phase 4**: 2 hours (agent core)
- **Phase 5**: 2 hours (frontend integration)
- **Phase 6**: 3 hours (n8n connection)
- **Phase 7**: 2 hours (testing)

**Total**: ~11.5 hours of focused development

---

## Next Steps (Immediate)

1. ✅ Review and approve this plan
2. Begin Phase 1: Install dependencies and configure environment
3. Validate Azure OpenAI credentials and fix .env-azure if needed
4. Create initial file structure
5. Start with test-driven development approach

---

## Notes & Considerations

- **Security**: Never expose Azure API keys in frontend code (already using API routes ✅)
- **Scalability**: Current architecture supports scaling to more tools easily
- **Extensibility**: Tool registry pattern allows adding new capabilities without changing core agent
- **User Experience**: Streaming responses maintain feeling of interactivity
- **Compliance**: All client data updates go through n8n → Excel, maintaining audit trail

---

*This document serves as the single source of truth for the DAWN agent build. Update as needed during development.*

## 🚧 BUILD PROGRESS LOG

### Session: October 19, 2025 - 9:40 PM PST

---

#### ✅ COMPLETED

**Phase 1 & 2: Azure OpenAI Setup** (100% Complete)
- ✅ Installed Vercel AI SDK dependencies (`ai`, `@ai-sdk/azure`)
- ✅ Created `.env.local` with Azure OpenAI credentials
- ✅ Built `lib/azure-config.ts` configuration module
- ✅ Created test suite (`scripts/test-azure.ts`)
- ✅ All 3 test cases passing:
  - Basic text generation
  - Streaming text
  - DAWN system prompt test

**Core Chat Functionality** (100% Complete)
- ✅ DAWN connected to chat interface
- ✅ Streaming responses working (character-by-character)
- ✅ Conversation memory implemented
- ✅ Thread management working (separate conversations maintained)
- ✅ Conversation titles auto-generated from first message
- ✅ Full message history passed to API with each request

**Frontend Integration** (100% Complete)
- ✅ Updated `components/AIAssistantUI.jsx` with streaming support
- ✅ Added conversation history tracking
- ✅ Fixed layout to full-width interface
- ✅ Changed send button icon from paper plane to arrow up
- ✅ Messages streaming in real-time with visual feedback

**API Route** (95% Complete)
- ✅ Created `app/api/chat/route.ts` with Azure OpenAI integration
- ✅ Streaming text responses via `toTextStreamResponse()`
- ✅ Conversation history management
- ✅ Error handling and logging
- ⏸️ Tools disabled (pending schema fix)

---

#### ⚠️ IN PROGRESS / BLOCKED

**Phase 3: Tool Definitions** (80% Complete - BLOCKED)
- ✅ Created Zod schemas (`lib/tools/schemas.ts`)
- ✅ Created tool executors (`lib/tools/executors.ts`) with n8n webhook calls:
  - `writeStatusToContact` → `https://n8n-familyconnection.agentglu.agency/webhook/update-contact-status`
  - `addNoteToContact` → `https://n8n-familyconnection.agentglu.agency/webhook-test/update-agent-notes`
- ✅ Created tool registry (`lib/tools/registry.ts`)
- ✅ Updated DAWN system prompt with tool instructions
- ❌ **BLOCKED**: Azure OpenAI rejecting tool schemas
  - Error: `Invalid schema for function 'writeStatusToContact': schema must be a JSON Schema of 'type: "object"', got 'type: "None"'`
  - Tried: Zod schemas, jsonSchema() helper
  - Issue: Schema conversion to JSON Schema failing validation

---

#### 🐛 CRITICAL ISSUE IDENTIFIED

**Pattern Discovered:**
1. Enable tools with broken schema → Azure OpenAI returns 400 error → Streaming breaks → No responses in UI
2. Disable tools → Responses work fine
3. This pattern repeated twice during session

**Root Cause:**
- Azure OpenAI has stricter schema validation than OpenAI
- Vercel AI SDK's schema conversion not compatible with Azure's requirements
- When tool schema fails validation, entire request fails (no fallback)
- Frontend waits for stream that never arrives

**Impact:**
- Tool calling NOT working
- Basic chat working (without tools)
- n8n webhooks NOT being triggered

---

#### 📋 FILES CREATED/MODIFIED

**New Files:**
- `lib/azure-config.ts` - Azure OpenAI configuration
- `lib/agent/prompts.ts` - DAWN system prompt
- `lib/tools/schemas.ts` - Tool parameter schemas
- `lib/tools/executors.ts` - Tool execution logic (n8n webhook calls)
- `lib/tools/registry.ts` - Tool registry for Vercel AI SDK
- `scripts/test-azure.ts` - Azure connection test suite
- `scripts/load-env.js` - Environment variable loader
- `.env.local` - Azure credentials (working)
- `TESTING-CHECKLIST.md` - 32 comprehensive test cases

**Modified Files:**
- `app/api/chat/route.ts` - Converted to TypeScript, added Azure OpenAI + tools (tools disabled)
- `components/AIAssistantUI.jsx` - Added streaming, conversation memory, history tracking
- `components/Composer.jsx` - Changed send icon
- `package.json` - Added test:azure script, AI SDK dependencies

---

#### 🎯 NEXT STEPS (Priority Order)

1. **FIX TOOL SCHEMA ISSUE** (CRITICAL)
   - Research Azure OpenAI specific schema requirements
   - Test schema separately before integrating
   - Consider alternative: Call n8n webhooks directly (no tool calling)
   - OR: Switch to OpenAI (non-Azure) for tool calling compatibility

2. **Test n8n Integration**
   - Once tools work, verify webhooks trigger
   - Check Excel updates happen
   - Test both writeStatus and addNote tools

3. **Complete Testing Checklist**
   - Run all 32 test cases in TESTING-CHECKLIST.md
   - Document results
   - Fix any bugs found

4. **Production Prep**
   - Add proper error handling for tool failures
   - Implement UI indicators for tool calls
   - Add monitoring/logging
   - Security review

---

#### 💡 ALTERNATIVE APPROACHES TO CONSIDER

**Option A: Direct n8n Calls (No Tool Calling)**
- Parse user intent in system prompt
- Call n8n webhooks directly from executefunction instead of using Vercel AI SDK tools
- Simpler, more reliable
- Lose multi-step reasoning capability

**Option B: Switch to OpenAI (Non-Azure)**
- OpenAI has better tool calling compatibility
- May have better Vercel AI SDK support
- Would need to change Azure config
- Cost implications

**Option C: Custom Tool Call Parser**
- Don't use Vercel AI SDK tool calling
- Have DAWN return structured JSON
- Parse JSON and call webhooks manually
- More control, more code

---

#### 📊 CURRENT STATE SUMMARY

**What's Working:**
- ✅ Azure OpenAI connection
- ✅ Basic chat conversations
- ✅ Streaming responses
- ✅ Conversation memory
- ✅ Thread management
- ✅ Full UI/UX experience

**What's Not Working:**
- ❌ Tool calling (schema validation failing)
- ❌ n8n webhook integration (can't trigger tools)
- ❌ Status updates to Excel
- ❌ Note additions to Excel

**Estimated Completion:**
- Without tools (current state): 85% complete
- With tools working: 95% complete
- Full production ready: Depends on testing results

---

**Last Updated: October 19, 2025 @ 9:40 PM PST**
**Session Duration: ~4 hours**
**Developer Notes: Tool schema issue requires deeper investigation. Consider alternative approaches if Azure OpenAI compatibility cannot be resolved quickly.**

