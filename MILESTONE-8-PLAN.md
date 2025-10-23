# Milestone 8: Message Persistence - Bulletproof Implementation Plan

## 🎯 Objective
Enable full chat history persistence so each user's messages are saved to the database and loaded when they open a conversation.

## 📊 Current State
- ✅ Users table exists
- ✅ Conversations table exists and working
- ✅ Frontend creates/fetches/deletes conversations via API
- ❌ Messages are only stored in React state (lost on refresh)
- ❌ No database storage for individual messages

## 🎯 End State
- ✅ Messages table in PostgreSQL
- ✅ Messages saved automatically when user/assistant sends
- ✅ Messages loaded when conversation is opened
- ✅ Message history persists across sessions
- ✅ Each message linked to correct conversation and user

---

## 🗄️ Database Schema Design

### Message Model Structure
```prisma
model Message {
  id             String       @id @default(uuid())
  conversationId String       @map("conversation_id")
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           String       // "user" or "assistant"
  content        String       @db.Text // Full message text
  createdAt      DateTime     @default(now()) @map("created_at")

  @@index([conversationId, createdAt(sort: Asc)])
  @@map("messages")
}
```

### Why This Design?
- **Cascade delete**: When conversation deleted, messages auto-delete
- **Text type**: Supports long messages (vs VARCHAR limit)
- **Indexed by conversation + time**: Fast retrieval in chronological order
- **Simple role field**: "user" or "assistant" (matches existing format)

---

## 🛤️ Implementation Steps (Test After Each!)

### **Step 1: Update Prisma Schema** (5 min)
**Action**: Add Message model to `prisma/schema.prisma`

**Add to Conversation model**:
```prisma
model Conversation {
  // ... existing fields ...
  messages     Message[]  // Add this line
}
```

**Add new Message model**:
```prisma
model Message {
  id             String       @id @default(uuid())
  conversationId String       @map("conversation_id")
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           String
  content        String       @db.Text
  createdAt      DateTime     @default(now()) @map("created_at")

  @@index([conversationId, createdAt(sort: Asc)])
  @@map("messages")
}
```

**Test**: Run `npx prisma format` to validate syntax
```bash
npx prisma format
```

---

### **Step 2: Create Migration** (5 min)
**Action**: Generate and inspect migration SQL

```bash
npx prisma migrate dev --name add_messages_table
```

**Expected Output**:
- Migration file created in `prisma/migrations/`
- Should see CREATE TABLE messages SQL
- Should see CREATE INDEX for conversationId + createdAt

**Manual Check**: Open migration file and verify:
- ✅ Correct foreign key to conversations
- ✅ ON DELETE CASCADE present
- ✅ Indexes created
- ✅ Text type for content column

**Rollback Strategy**: If migration fails, run:
```bash
npx prisma migrate resolve --rolled-back <migration-name>
```

---

### **Step 3: Deploy Migration to Production** (5 min)
**Action**: Push code and let Render auto-migrate

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "Add messages table with cascade delete"
git push origin main
```

**Test on Production**:
After Render deployment completes, check logs for:
```
Running: npx prisma migrate deploy
✓ Migration applied successfully
```

**Verification Query** (via Render database console):
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'messages';
```

Should return: `messages`

---

### **Step 4: Create Database Helper Functions** (10 min)
**File**: `lib/db/messages.ts`

**Functions to Create**:
1. `getMessagesForConversation(conversationId, userEmail)` - Fetch all messages for a conversation (with ownership check)
2. `createMessage(conversationId, userEmail, data)` - Save a new message (with ownership check)
3. `updateConversationMetadata(conversationId)` - Update messageCount and preview

**Implementation**:
```typescript
import { prisma } from './prisma'
import { getConversationsForUser } from './conversations'

/**
 * Get all messages for a conversation
 * Verifies user owns the conversation before returning messages
 */
export async function getMessagesForConversation(
  conversationId: string,
  userEmail: string
) {
  // 1. Verify user owns this conversation
  const conversations = await getConversationsForUser(userEmail)
  const ownsConversation = conversations.some(c => c.id === conversationId)

  if (!ownsConversation) {
    throw new Error('Conversation not found or access denied')
  }

  // 2. Fetch messages in chronological order
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      createdAt: 'asc', // Oldest first
    },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  })

  return messages
}

/**
 * Create a new message in a conversation
 * Verifies user owns the conversation before saving
 */
export async function createMessage(
  conversationId: string,
  userEmail: string,
  data: {
    role: 'user' | 'assistant'
    content: string
  }
) {
  // 1. Verify user owns this conversation
  const conversations = await getConversationsForUser(userEmail)
  const conversation = conversations.find(c => c.id === conversationId)

  if (!conversation) {
    throw new Error('Conversation not found or access denied')
  }

  // 2. Create the message
  const message = await prisma.message.create({
    data: {
      conversationId,
      role: data.role,
      content: data.content,
    },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  })

  // 3. Update conversation metadata
  await updateConversationMetadata(conversationId, userEmail)

  return message
}

/**
 * Update conversation's message count and preview
 */
async function updateConversationMetadata(
  conversationId: string,
  userEmail: string
) {
  // Get all messages for this conversation
  const messages = await getMessagesForConversation(conversationId, userEmail)

  // Get the last message for preview
  const lastMessage = messages[messages.length - 1]
  const preview = lastMessage?.content.slice(0, 80) || ''

  // Update conversation
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      messageCount: messages.length,
      preview,
      updatedAt: new Date(),
    },
  })
}
```

**Test**: Build should succeed
```bash
npm run build
```

---

### **Step 5: Create GET Messages API Endpoint** (10 min)
**File**: `app/api/conversations/[id]/messages/route.ts`

**Endpoint**: `GET /api/conversations/:id/messages`

**Implementation**:
```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getMessagesForConversation } from '@/lib/db/messages'

/**
 * GET /api/conversations/:id/messages
 * Fetch all messages for a conversation
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const userEmail = session.user.email
    const conversationId = params.id

    console.log('📬 Fetching messages for conversation:', conversationId, 'user:', userEmail)

    // 2. Fetch messages (includes ownership verification)
    const messages = await getMessagesForConversation(conversationId, userEmail)

    console.log(`✅ Found ${messages.length} messages`)

    // 3. Return messages
    return NextResponse.json({
      messages,
      conversationId,
    })

  } catch (error) {
    console.error('❌ Error fetching messages:', error)

    // Handle "not found" or "access denied" errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
```

**Test on Production** (after deploy):
```javascript
// In browser console on production site
const convId = 'YOUR_CONVERSATION_ID_HERE'
const response = await fetch(`/api/conversations/${convId}/messages`)
const data = await response.json()
console.log('Messages:', data)
// Should return: { messages: [], conversationId: '...' }
```

---

### **Step 6: Create POST Message API Endpoint** (10 min)
**File**: Same file as Step 5 (`app/api/conversations/[id]/messages/route.ts`)

**Endpoint**: `POST /api/conversations/:id/messages`

**Add to same file**:
```typescript
import { createMessage } from '@/lib/db/messages'

/**
 * POST /api/conversations/:id/messages
 * Create a new message in a conversation
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const userEmail = session.user.email
    const conversationId = params.id

    // 2. Parse request body
    const body = await request.json()
    const { role, content } = body

    // 3. Validate input
    if (!role || !content) {
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      )
    }

    if (role !== 'user' && role !== 'assistant') {
      return NextResponse.json(
        { error: 'Role must be "user" or "assistant"' },
        { status: 400 }
      )
    }

    console.log('💬 Creating message in conversation:', conversationId, 'role:', role)

    // 4. Create message (includes ownership verification)
    const message = await createMessage(conversationId, userEmail, {
      role,
      content,
    })

    console.log(`✅ Message created: ${message.id}`)

    // 5. Return created message
    return NextResponse.json(
      { message },
      { status: 201 }
    )

  } catch (error) {
    console.error('❌ Error creating message:', error)

    // Handle "not found" or "access denied" errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to create message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
```

**Test on Production** (after deploy):
```javascript
// In browser console on production site
const convId = 'YOUR_CONVERSATION_ID_HERE'

// Test 1: Create user message
const resp1 = await fetch(`/api/conversations/${convId}/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    role: 'user',
    content: 'Hello, this is a test message!'
  })
})
const msg1 = await resp1.json()
console.log('User message:', msg1)

// Test 2: Create assistant message
const resp2 = await fetch(`/api/conversations/${convId}/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    role: 'assistant',
    content: 'Hi! I received your test message.'
  })
})
const msg2 = await resp2.json()
console.log('Assistant message:', msg2)

// Test 3: Fetch all messages
const resp3 = await fetch(`/api/conversations/${convId}/messages`)
const allMsgs = await resp3.json()
console.log('All messages:', allMsgs)
// Should show both messages in chronological order
```

---

### **Step 7: Update Frontend - Load Messages** (15 min)
**File**: `components/AIAssistantUI.jsx`

**Change 1**: Fetch messages when conversation is selected

Add new function to load messages:
```javascript
async function loadMessages(conversationId) {
  try {
    console.log('📬 Loading messages for conversation:', conversationId)

    const response = await fetch(`/api/conversations/${conversationId}/messages`)
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.status}`)
    }

    const data = await response.json()
    console.log(`✅ Loaded ${data.messages.length} messages`)

    // Update conversation's messages in state
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: data.messages }
          : c
      )
    )
  } catch (error) {
    console.error('❌ Failed to load messages:', error)
  }
}
```

**Change 2**: Load messages when conversation is selected

Update `onSelect` handler:
```javascript
// In Sidebar component prop
onSelect={(id) => {
  setSelectedId(id)
  setSidebarOpen(false)
  loadMessages(id) // Add this line
}}
```

**Test**: After clicking a conversation, console should show:
```
📬 Loading messages for conversation: abc123
✅ Loaded 0 messages
```

---

### **Step 8: Update Frontend - Save Messages** (15 min)
**File**: `components/AIAssistantUI.jsx`

**Change**: Update `sendMessage()` function to save to database

Find the `sendMessage()` function and add database saves:

```javascript
async function sendMessage(convId, content) {
  if (!content.trim()) return
  const now = new Date().toISOString()

  // ... existing code to add user message to state ...

  try {
    // STEP 1: Save user message to database
    console.log('💾 Saving user message to database...')
    await fetch(`/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'user',
        content: content,
      }),
    })
    console.log('✅ User message saved')

    // STEP 2: Call DAWN API (existing code)
    console.log('💬 Sending message to DAWN:', content)
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: content,
        history: historyForAPI
      }),
    })

    // ... existing streaming code ...

    // STEP 3: After stream completes, save assistant message to database
    console.log('💾 Saving assistant message to database...')
    await fetch(`/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'assistant',
        content: accumulatedText,
      }),
    })
    console.log('✅ Assistant message saved')

  } catch (error) {
    console.error('❌ Error in sendMessage:', error)
    // ... existing error handling ...
  }
}
```

**Test on Production**:
1. Sign in to production site
2. Open a conversation
3. Send a message: "Test message persistence"
4. Refresh the page
5. Open the same conversation
6. ✅ Message should still be there!

---

### **Step 9: Update Frontend - Load on Conversation Open** (10 min)
**File**: `components/AIAssistantUI.jsx`

**Change**: Load messages when a new conversation is created

Update `createNewChat()`:
```javascript
async function createNewChat() {
  try {
    // ... existing code to create conversation ...

    // Add to local state
    setConversations((prev) => [newConversation, ...prev])
    setSelectedId(newConversation.id)
    setSidebarOpen(false)

    // Load messages (will be empty for new conversation, but sets up structure)
    await loadMessages(newConversation.id)  // Add this line

  } catch (error) {
    console.error('❌ Failed to create new chat:', error)
  }
}
```

---

## 🧪 Final End-to-End Test

### Test Checklist:
1. ✅ **Create New Conversation**
   - Click "New Chat"
   - Should create conversation in DB

2. ✅ **Send Message**
   - Type "Hello, testing persistence!"
   - Should save to messages table
   - DAWN should respond
   - Assistant response should save to messages table

3. ✅ **Verify Persistence**
   - Refresh page
   - Open same conversation
   - Both messages should still be there

4. ✅ **Multi-Message History**
   - Send 3-4 more messages
   - Each should persist
   - Conversation should maintain context

5. ✅ **Delete Conversation**
   - Delete the test conversation
   - Verify messages are also deleted (cascade)
   - Check in database:
     ```sql
     SELECT * FROM messages WHERE conversation_id = 'DELETED_ID';
     -- Should return 0 rows
     ```

6. ✅ **Multi-User Isolation**
   - Sign in as different user
   - Should not see other user's messages
   - Create new conversation
   - Send messages
   - Sign back as original user
   - Should only see original user's messages

---

## 🚨 Rollback Strategy

### If Migration Fails:
```bash
npx prisma migrate resolve --rolled-back <migration-name>
npx prisma migrate dev
```

### If Production Breaks:
1. Revert git commit:
   ```bash
   git revert HEAD
   git push origin main
   ```
2. Render will auto-deploy previous version
3. Messages table will remain (safe to keep)

### If Database Corruption:
- Messages table can be dropped without affecting users/conversations
- Soft delete protects conversation data
- Users can recreate conversations

---

## 📝 Success Criteria

✅ Messages persist across page refreshes
✅ Full conversation history maintained
✅ Each user sees only their own messages
✅ Message count updates automatically
✅ Preview updates with latest message
✅ Cascade delete removes orphaned messages
✅ Production deployment successful
✅ No performance degradation

---

## 🎯 Next Steps (Milestone 9)

After Milestone 8 completes:
- Full integration testing
- Performance optimization (if needed)
- Edge case handling
- Production monitoring
