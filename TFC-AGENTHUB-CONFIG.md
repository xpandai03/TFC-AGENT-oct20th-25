# TFC Agent Hub - Branding & Customization Plan

## 🎯 Project Overview
Transform the current AI Assistant interface into **TFC Agent Hub** - a branded mental health AI platform for The Family Connection.

---

## 📋 Requirements Summary

### 1. **Logo Branding** ✱ → TFC Logo
Replace generic "AI Assistant" branding with TFC logo that adapts to theme.

### 2. **Agent Selector Dropdown** 🤖
Customize AI model dropdown with TFC-branded agent names.

### 3. **Folder Management** 📁
Add "Move to Folder" option in conversation menu.

---

## 🎨 Part 1: TFC Logo Integration

### Current State
- Location: Sidebar header and mobile top bar
- Text: "AI Assistant"
- Icon: ✱ (asterisk symbol)
- Background: White (light mode) / Dark zinc-900 (dark mode)

### Target State
- Display TFC logo image instead of text
- Remove asterisk icon
- Logo automatically switches based on theme:
  - **Light mode**: `TFC Logo color (1).jpg` (blue logo on white)
  - **Dark mode**: `Logo Whitelarge transparent.png` (white logo on transparent)

### Implementation Steps

#### Step 1.1: Add Logo Assets to Public Folder (5 min)
**Action**: Copy logo files to `/public/images/` directory

```bash
mkdir -p public/images
cp "TFC Logo color (1).jpg" public/images/tfc-logo-light.jpg
cp "Logo Whitelarge transparent.png" public/images/tfc-logo-dark.png
```

**Optimization**: Convert to optimized formats
- Use Next.js Image optimization
- Consider WebP format for better performance
- Target size: ~100-150px width for sidebar

---

#### Step 1.2: Update Sidebar Component (15 min)
**File**: `components/Sidebar.jsx`

**Current Code** (Line ~206-210):
```jsx
<div className="flex items-center gap-2">
  <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-sm dark:from-zinc-200 dark:to-zinc-300 dark:text-zinc-900">
    <Asterisk className="h-4 w-4" />
  </div>
  <div className="text-sm font-semibold tracking-tight">AI Assistant</div>
</div>
```

**New Code**:
```jsx
<div className="flex items-center gap-2">
  {/* TFC Logo - switches based on theme */}
  <img
    src={theme === 'dark' ? '/images/tfc-logo-dark.png' : '/images/tfc-logo-light.jpg'}
    alt="The Family Connection"
    className="h-8 w-auto object-contain"
  />
</div>
```

**Changes**:
- ✅ Remove gradient icon container
- ✅ Remove Asterisk icon
- ✅ Remove "AI Assistant" text
- ✅ Add theme-aware logo image
- ✅ Auto-size to fit 32px height (h-8)

---

#### Step 1.3: Update Mobile Header (10 min)
**File**: `components/AIAssistantUI.jsx`

**Current Code** (Line ~463-464):
```jsx
<div className="ml-1 flex items-center gap-2 text-sm font-semibold tracking-tight">
  <span className="inline-flex h-4 w-4 items-center justify-center">✱</span> AI Assistant
</div>
```

**New Code**:
```jsx
<div className="ml-1 flex items-center">
  <img
    src={theme === 'dark' ? '/images/tfc-logo-dark.png' : '/images/tfc-logo-light.jpg'}
    alt="The Family Connection"
    className="h-6 w-auto object-contain"
  />
</div>
```

**Changes**:
- ✅ Remove asterisk span
- ✅ Remove text
- ✅ Add theme-aware logo (smaller: h-6 for mobile)

---

#### Step 1.4: Update Browser Tab Title (5 min)
**File**: `app/layout.js` or `app/page.js`

**Add/Update**:
```jsx
export const metadata = {
  title: 'TFC Agent Hub',
  description: 'Mental Health AI Assistant Platform - The Family Connection',
}
```

---

## 🤖 Part 2: Agent Selector Dropdown Customization

### Current State
**File**: Likely `components/Header.jsx` or similar

**Current Options**:
- GPT-5 (🤖 icon)
- Claude Sonnet 4 (🤖 icon)
- Gemini (💎 icon)
- Assistant (✱ icon)

### Target State
**New Agent Names**:
1. **D.A.W.N** (🤖 icon) - Default/Primary agent
2. **Lisa** (🤖 icon) - Secondary specialized agent
3. **Secret Agent #1** (💎 icon) - Tertiary agent
4. **Secret Agent #2** (✱ icon) - Additional agent

### Implementation Steps

#### Step 2.1: Locate Model Selector Component (5 min)
**Search**:
```bash
grep -r "GPT-5" components/
grep -r "Claude Sonnet" components/
```

**Expected File**: `components/Header.jsx` or `components/ModelSelector.jsx`

---

#### Step 2.2: Update Agent Names (10 min)
**Current Code** (approximate structure):
```jsx
const models = [
  { id: 'gpt-5', name: 'GPT-5', icon: '🤖' },
  { id: 'claude', name: 'Claude Sonnet 4', icon: '🤖' },
  { id: 'gemini', name: 'Gemini', icon: '💎' },
  { id: 'assistant', name: 'Assistant', icon: '✱' },
]
```

**New Code**:
```jsx
const tfcAgents = [
  {
    id: 'dawn',
    name: 'D.A.W.N',
    icon: '🤖',
    description: 'Default AI Wellness Navigator'
  },
  {
    id: 'lisa',
    name: 'Lisa',
    icon: '🤖',
    description: 'Specialized Mental Health Agent'
  },
  {
    id: 'agent-1',
    name: 'Secret Agent #1',
    icon: '💎',
    description: 'Advanced Support Agent'
  },
  {
    id: 'agent-2',
    name: 'Secret Agent #2',
    icon: '✱',
    description: 'Auxiliary Support Agent'
  },
]
```

**Changes**:
- ✅ Keep same icons
- ✅ Update display names
- ✅ Optional: Add descriptions for hover tooltips
- ✅ Update IDs to match TFC naming

---

#### Step 2.3: Update Default Selected Agent (5 min)
**Set D.A.W.N as default**:
```jsx
const [selectedAgent, setSelectedAgent] = useState('dawn')
```

---

#### Step 2.4: Update Backend Agent Routing (Optional - 15 min)
**File**: `app/api/chat/route.ts`

**Current Code** (approximate):
```typescript
// Uses single DAWN deployment
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  // ...
})
```

**Future Enhancement** (if different agents use different models/prompts):
```typescript
const agentConfig = {
  dawn: { model: "gpt-4o", systemPrompt: "You are D.A.W.N..." },
  lisa: { model: "gpt-4o", systemPrompt: "You are Lisa, specialized in..." },
  "agent-1": { model: "gpt-4o", systemPrompt: "You are Secret Agent #1..." },
  "agent-2": { model: "gpt-4o", systemPrompt: "You are Secret Agent #2..." },
}

const config = agentConfig[selectedAgent] || agentConfig.dawn
```

**Note**: This is optional - if all agents use the same DAWN backend, no changes needed.

---

## 📁 Part 3: Folder Management in 3-Dot Menu

### Current State
**Location**: Conversation row 3-dot menu (likely in `components/ConversationRow.jsx` or similar)

**Current Menu Items**:
- Pin/Unpin
- Delete
- (possibly others)

### Target State
**Add New Menu Item**:
- 📁 Move to Folder

### Implementation Steps

#### Step 3.1: Locate Conversation Menu Component (5 min)
**Search**:
```bash
grep -r "MoreHorizontal" components/
grep -r "onTogglePin" components/
```

**Expected Component**: Menu dropdown in conversation list items

---

#### Step 3.2: Add "Move to Folder" UI (20 min)

**Current Menu Structure** (approximate):
```jsx
<DropdownMenu>
  <DropdownMenuItem onClick={onTogglePin}>
    {pinned ? 'Unpin' : 'Pin'}
  </DropdownMenuItem>
  <DropdownMenuItem onClick={onDelete}>
    Delete
  </DropdownMenuItem>
</DropdownMenu>
```

**New Menu Structure**:
```jsx
import { FolderIcon, Star, Trash2 } from 'lucide-react'

<DropdownMenu>
  <DropdownMenuItem onClick={onTogglePin}>
    <Star className="h-4 w-4 mr-2" />
    {pinned ? 'Unpin' : 'Pin'}
  </DropdownMenuItem>

  {/* NEW: Move to Folder */}
  <DropdownMenuItem onClick={handleMoveToFolder}>
    <FolderIcon className="h-4 w-4 mr-2" />
    Move to Folder
  </DropdownMenuItem>

  <DropdownMenuItem onClick={onDelete} className="text-red-600">
    <Trash2 className="h-4 w-4 mr-2" />
    Delete
  </DropdownMenuItem>
</DropdownMenu>
```

---

#### Step 3.3: Create Folder Selection Modal (30 min)
**New Component**: `components/MoveFolderModal.jsx`

```jsx
export default function MoveFolderModal({
  isOpen,
  onClose,
  folders,
  currentFolder,
  onMoveToFolder
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Move to Folder</h3>

        <div className="space-y-2">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => {
                onMoveToFolder(folder.name)
                onClose()
              }}
              className={`
                w-full text-left px-4 py-3 rounded-lg
                hover:bg-zinc-100 dark:hover:bg-zinc-800
                ${currentFolder === folder.name ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
              `}
            >
              <div className="flex items-center gap-2">
                <FolderIcon className="h-4 w-4" />
                <span>{folder.name}</span>
                {currentFolder === folder.name && (
                  <span className="ml-auto text-xs text-blue-600">Current</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
```

---

#### Step 3.4: Add Move Folder Functionality (15 min)
**File**: Parent component managing conversations

**Add Handler**:
```jsx
const [showMoveFolderModal, setShowMoveFolderModal] = useState(false)
const [conversationToMove, setConversationToMove] = useState(null)

function handleMoveToFolder(conversationId) {
  setConversationToMove(conversationId)
  setShowMoveFolderModal(true)
}

function moveConversationToFolder(folderName) {
  setConversations((prev) =>
    prev.map((c) =>
      c.id === conversationToMove
        ? { ...c, folder: folderName }
        : c
    )
  )

  // Optional: Persist to backend
  fetch(`/api/conversations/${conversationToMove}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: folderName }),
  })
}
```

---

#### Step 3.5: Add Folder Field to Database (Optional - 20 min)
**If you want folder selection to persist:**

**Update Prisma Schema**:
```prisma
model Conversation {
  // ... existing fields ...
  folder        String?   // Add this field
}
```

**Create Migration**:
```bash
npx prisma migrate dev --name add_folder_field
```

**Update API**:
```typescript
// app/api/conversations/[id]/route.ts
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { folder } = await request.json()

  await prisma.conversation.update({
    where: { id: params.id },
    data: { folder },
  })

  return NextResponse.json({ success: true })
}
```

---

## 🗂️ Implementation Order (Recommended)

### Phase 1: Visual Branding (45 min)
1. ✅ Add logo assets to `/public/images/`
2. ✅ Update Sidebar with TFC logo
3. ✅ Update mobile header with TFC logo
4. ✅ Update page title/metadata
5. ✅ Test both light and dark modes

**Deliverable**: TFC-branded interface with logo

---

### Phase 2: Agent Customization (30 min)
1. ✅ Locate model selector component
2. ✅ Update agent names and IDs
3. ✅ Set D.A.W.N as default
4. ✅ Test dropdown functionality
5. ⏸️ (Optional) Add agent-specific routing

**Deliverable**: TFC agent names in dropdown

---

### Phase 3: Folder Management (90 min)
1. ✅ Add "Move to Folder" menu item
2. ✅ Create folder selection modal
3. ✅ Add move folder handlers
4. ✅ Test moving conversations
5. ⏸️ (Optional) Add database persistence

**Deliverable**: Working folder management feature

---

## 🧪 Testing Checklist

### Logo Testing
- [ ] Light mode shows blue TFC logo clearly
- [ ] Dark mode shows white TFC logo clearly
- [ ] Logo scales properly on mobile
- [ ] Logo loads quickly (optimized images)
- [ ] No layout shift when logo loads

### Agent Selector Testing
- [ ] Dropdown shows all 4 TFC agents
- [ ] Icons display correctly
- [ ] D.A.W.N selected by default
- [ ] Selecting different agents works
- [ ] Selected agent persists across sessions

### Folder Management Testing
- [ ] 3-dot menu shows "Move to Folder" option
- [ ] Modal opens with list of folders
- [ ] Current folder is highlighted
- [ ] Moving conversation updates UI immediately
- [ ] Changes persist after page refresh (if backend implemented)

---

## 📁 Files to Modify

### Required Changes
1. `components/Sidebar.jsx` - TFC logo in sidebar
2. `components/AIAssistantUI.jsx` - TFC logo in mobile header
3. `components/Header.jsx` (or similar) - Agent selector dropdown
4. `app/layout.js` - Page title/metadata
5. `public/images/` - Add logo files

### Optional Changes (Folder Management)
6. `components/ConversationRow.jsx` - Add menu item
7. `components/MoveFolderModal.jsx` - New modal component
8. `prisma/schema.prisma` - Add folder field (if persisting)
9. `app/api/conversations/[id]/route.ts` - Add PATCH endpoint (if persisting)

---

## 🎨 Design Specifications

### Logo Sizing
- **Sidebar**: 32px height (h-8 in Tailwind)
- **Mobile Header**: 24px height (h-6 in Tailwind)
- **Width**: Auto-fit to maintain aspect ratio

### Color Palette (TFC Brand)
- **Primary Blue**: `#1e3a8a` (from logo)
- **Secondary Gray**: `#6b7280`
- **Accent**: Existing blue-500 matches TFC blue well

### Typography
- Keep existing fonts (they're clean and professional)
- Consider adding "Mental Health AI Assistant" subtitle under logo (optional)

---

## 🚀 Deployment Strategy

### Development Testing
1. Implement changes locally
2. Test in both light/dark modes
3. Test on mobile viewport
4. Verify all functionality works

### Production Deployment
1. Commit Phase 1 (Logo branding)
2. Deploy and verify on production
3. Commit Phase 2 (Agent names)
4. Deploy and verify
5. Commit Phase 3 (Folder management)
6. Final deployment

### Rollback Plan
- Each phase is independent
- Can revert individual commits if issues arise
- Logo files can be swapped without code changes

---

## 📊 Success Metrics

### Visual Branding
✅ TFC logo visible in all contexts
✅ Logo adapts correctly to theme
✅ Professional, cohesive appearance

### Functionality
✅ All 4 TFC agents selectable
✅ Folder management working smoothly
✅ No performance degradation

### User Experience
✅ Branding feels integrated, not "slapped on"
✅ Navigation remains intuitive
✅ No confusion about agent purposes

---

## 🔮 Future Enhancements

### Phase 4 (Future)
- Agent-specific avatars/images
- Agent capability descriptions
- Folder color coding
- Bulk move to folder
- Agent performance analytics
- Custom agent creation

---

## 📝 Notes

### Logo Optimization
The provided logos are:
- `TFC Logo color (1).jpg` - ~500KB JPEG (light mode)
- `Logo Whitelarge transparent.png` - ~50KB PNG (dark mode)

**Recommendation**:
- Optimize JPG to ~50KB for web
- Consider SVG version for perfect scaling
- Use Next.js Image component for automatic optimization

### Agent Routing
Currently, all agents use DAWN backend. Future enhancement could:
- Route different agents to different Azure OpenAI deployments
- Use different system prompts per agent
- Implement agent-specific tool/function calling

### Folder Persistence
The folder feature can work without database persistence initially (client-side only), then add backend persistence in a later phase for better UX.

---

## ✅ Ready to Implement?

The plan is comprehensive and modular. You can tackle:
- **Quick Win**: Phase 1 (Logo branding) - 45 min
- **Medium Effort**: Phase 2 (Agent names) - 30 min
- **Full Feature**: Phase 3 (Folder management) - 90 min

**Total Time**: ~3 hours for complete TFC customization

Let me know which phase you'd like to start with!

---

# 🐛 Phase 4: Critical Bug Fixes & Enhancements

## 🎯 Overview
Post-deployment testing revealed 4 critical issues that need systematic resolution. This phase addresses conversation persistence, authentication integration, UI functionality, and agent descriptions.

---

## 📋 Issues Identified

### Issue 1: ❌ **Conversation Auto-Save Failure**
**Problem**: User sends messages in a conversation, but on page reload, the conversation shows "0 messages" or disappears entirely.

**Root Cause**: 
- Conversation title not updating when first message is sent
- Conversation may not be persisted to database before messages are sent
- Frontend may not be reloading conversation list after message send

**Impact**: HIGH - Users lose their chat history on refresh

---

### Issue 2: ❌ **Settings Menu Not Functional**
**Problem**: Settings popover shows hardcoded user data and logout doesn't work.

**Observed Issues**:
- Email shows "j@gmail.com" (hardcoded)
- User name shows "John Doe" (hardcoded)
- Plan shows "Pro workspace" (hardcoded)
- Logout button does not trigger sign out
- Should show actual NextAuth session data

**Impact**: HIGH - Users cannot log out, see wrong info

---

### Issue 3: ❌ **Header Three-Dot Menu Non-Responsive**
**Problem**: Three dots (⋯) button in top-right header doesn't respond/open menu.

**Expected Behavior**:
- Should open menu with options
- Should include "Move to Folder" functionality
- Currently implemented in conversation rows but missing from header

**Impact**: MEDIUM - Feature exists but not accessible from header

---

### Issue 4: 📝 **Missing Agent Description**
**Problem**: Agent dropdown shows only name, but should display description below selected agent.

**Requested Feature**:
- Show description below "D.A.W.N" dropdown
- Text: "Dependable Agent Working Nicely - A friendly agent designed to assist the admin team manage tasks."
- Display in white/grey space below agent selector
- Each agent should have unique description

**Impact**: LOW - Enhancement for better UX

---

## 🛠️ Systematic Fix Plan

### **Fix 1: Conversation Auto-Save** (30 min)

#### Problem Analysis
Currently, conversation title updates when first message is sent, but this may not be persisting to the database. Need to ensure:
1. Conversation is created in database BEFORE sending first message
2. Title is updated in database when first message is sent
3. After sending message, conversation list is refreshed to show updated data

#### Implementation Steps

**Step 1.1: Verify Conversation Creation Flow** (5 min)
```javascript
// In AIAssistantUI.jsx - createNewChat()
// Currently creates conversation in DB and adds to local state
// ✅ This should be working - verify in logs
```

**Step 1.2: Fix Title Update on First Message** (15 min)

**File**: `components/AIAssistantUI.jsx` - `sendMessage()` function

**Current Issue**: Title updates in local state but may not persist to DB

**Fix**: Add API call to update conversation title after first message

```javascript
// In sendMessage() function, after saving user message to DB:

// Check if this is the first message
const isFirstMessage = (currentConversation?.messages || []).length === 0

if (isFirstMessage) {
  console.log('🏷️ Updating conversation title for first message...')
  
  // Update title in database
  await fetch(`/api/conversations/${convId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: content.slice(0, 50) + (content.length > 50 ? '...' : '')
    }),
  })
  
  console.log('✅ Conversation title updated in database')
}
```

**Step 1.3: Create PATCH Endpoint for Conversation Updates** (10 min)

**File**: `app/api/conversations/[id]/route.ts`

**Add PATCH handler**:
```typescript
import { updateConversation } from '@/lib/db/conversations'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const conversationId = params.id
    const body = await request.json()
    const { title, folder } = body

    console.log('📝 Updating conversation:', conversationId)

    const updated = await updateConversation(
      session.user.email,
      conversationId,
      { title, folder }
    )

    return NextResponse.json({ success: true, conversation: updated })
  } catch (error) {
    console.error('❌ Error updating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    )
  }
}
```

**Step 1.4: Add updateConversation Helper** (5 min)

**File**: `lib/db/conversations.ts`

**Add function**:
```typescript
export async function updateConversation(
  userEmail: string,
  conversationId: string,
  data: {
    title?: string
    folder?: string
  }
) {
  const user = await getOrCreateUser(userEmail)

  // Verify ownership
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId: user.id,
      deletedAt: null,
    },
  })

  if (!conversation) {
    throw new Error('Conversation not found or access denied')
  }

  // Update conversation
  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.folder && { folder: data.folder }),
      updatedAt: new Date(),
    },
  })

  console.log(`✅ Updated conversation: ${conversationId}`)
  return updated
}
```

**Testing**:
1. Create new chat
2. Send first message
3. Check database - title should be updated
4. Refresh page - conversation should show correct title
5. Click conversation - messages should load

---

### **Fix 2: Settings Menu Functionality** (45 min)

#### Problem Analysis
Settings popover uses hardcoded data instead of NextAuth session. Need to:
1. Get session data using `useSession()` hook
2. Display actual user name and email
3. Wire up logout to NextAuth `signOut()`

#### Implementation Steps

**Step 2.1: Locate Settings Component** (5 min)

```bash
grep -r "SettingsPopover\|John Doe\|Pro workspace" components/
```

**Expected file**: `components/SettingsPopover.jsx` or similar

**Step 2.2: Update SettingsPopover to Use Session** (20 min)

**File**: `components/SettingsPopover.jsx` (or wherever settings menu is)

**Current Code** (approximate):
```jsx
// Hardcoded user data
const userName = "John Doe"
const userEmail = "j@gmail.com"
const workspace = "Pro workspace"
```

**New Code**:
```jsx
"use client"
import { useSession, signOut } from 'next-auth/react'

export default function SettingsPopover({ children }) {
  const { data: session } = useSession()
  
  const userName = session?.user?.name || 'User'
  const userEmail = session?.user?.email || 'Not signed in'
  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  const handleLogout = async () => {
    console.log('🚪 Logging out...')
    await signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent>
        {/* User Info */}
        <div className="mb-4">
          <div className="text-sm text-zinc-500">{userEmail}</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-8 w-8 rounded-full bg-zinc-900 text-white grid place-items-center text-sm font-bold">
              {userInitials}
            </div>
            <div>
              <div className="font-medium">{userName}</div>
              <div className="text-xs text-zinc-500">TFC Agent Hub</div>
            </div>
          </div>
        </div>

        {/* Settings Menu */}
        <div className="space-y-1">
          <button className="w-full text-left px-3 py-2 rounded hover:bg-zinc-100">
            Language
          </button>
          <button className="w-full text-left px-3 py-2 rounded hover:bg-zinc-100">
            Get help
          </button>
          <button className="w-full text-left px-3 py-2 rounded hover:bg-zinc-100">
            Learn more
          </button>
          
          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded hover:bg-zinc-100 text-red-600"
          >
            Log out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

**Step 2.3: Update Sidebar User Info** (10 min)

**File**: `components/Sidebar.jsx`

**Find section** (around line 386-393):
```jsx
<div className="grid h-8 w-8 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-zinc-900">
  JD
</div>
<div className="min-w-0">
  <div className="truncate text-sm font-medium">John Doe</div>
  <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">Pro workspace</div>
</div>
```

**Replace with**:
```jsx
"use client"
import { useSession } from 'next-auth/react'

// Inside Sidebar component:
const { data: session } = useSession()
const userName = session?.user?.name || 'User'
const userEmail = session?.user?.email || ''
const userInitials = userName
  .split(' ')
  .map(n => n[0])
  .join('')
  .toUpperCase()
  .slice(0, 2) || 'U'

// In JSX:
<div className="grid h-8 w-8 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-zinc-900">
  {userInitials}
</div>
<div className="min-w-0">
  <div className="truncate text-sm font-medium">{userName}</div>
  <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">{userEmail}</div>
</div>
```

**Step 2.4: Verify NextAuth Provider Wraps App** (5 min)

**File**: `app/layout.tsx`

**Ensure SessionProvider wraps children**:
```tsx
import { SessionProvider } from 'next-auth/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
```

**Step 2.5: Test Logout Flow** (5 min)

**Testing**:
1. Sign in with Microsoft
2. Open settings menu
3. Verify name and email are correct
4. Click "Log out"
5. Should redirect to `/auth/signin`
6. Sign in again - should work

---

### **Fix 3: Header Three-Dot Menu** (30 min)

#### Problem Analysis
The three-dot button exists but doesn't have functionality. Need to add dropdown menu with actions like "Move to Folder".

#### Implementation Steps

**Step 3.1: Locate Header Component** (5 min)

**File**: `components/Header.jsx` (already know this exists)

**Current three-dot button**:
```jsx
<GhostIconButton label="More">
  <MoreHorizontal className="h-4 w-4" />
</GhostIconButton>
```

**Step 3.2: Add Dropdown Menu to Three-Dot Button** (20 min)

**File**: `components/Header.jsx`

**Replace GhostIconButton with functional dropdown**:
```jsx
"use client"
import { useState } from 'react'
import { MoreHorizontal, FolderIcon } from 'lucide-react'

// Inside Header component:
const [showActionsMenu, setShowActionsMenu] = useState(false)

// Replace the GhostIconButton with:
<div className="relative">
  <button
    onClick={() => setShowActionsMenu(!showActionsMenu)}
    className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
    aria-label="More options"
  >
    <MoreHorizontal className="h-4 w-4" />
  </button>

  {showActionsMenu && (
    <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950 z-50">
      <button
        onClick={() => {
          // Trigger move to folder for current conversation
          if (currentConversationId && onMoveToFolder) {
            onMoveToFolder(currentConversationId)
          }
          setShowActionsMenu(false)
        }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-t-lg"
      >
        <FolderIcon className="h-4 w-4" />
        Move to Folder
      </button>
      {/* Add more menu items as needed */}
    </div>
  )}
</div>
```

**Step 3.3: Pass Props from Parent** (5 min)

**File**: `components/AIAssistantUI.jsx`

**Update Header component call**:
```jsx
<Header
  createNewChat={createNewChat}
  sidebarCollapsed={sidebarCollapsed}
  setSidebarOpen={setSidebarOpen}
  currentConversationId={selectedId}
  onMoveToFolder={handleMoveToFolder}
/>
```

**Update Header props**:
```jsx
export default function Header({
  createNewChat,
  sidebarCollapsed,
  setSidebarOpen,
  currentConversationId,
  onMoveToFolder
}) {
```

**Testing**:
1. Open conversation
2. Click three-dot menu in header
3. Menu should open
4. Click "Move to Folder"
5. Folder modal should open
6. Select folder - conversation should move

---

### **Fix 4: Agent Descriptions** (25 min)

#### Problem Analysis
Agent selector shows only name. Need to add description text below selected agent that appears in the header.

#### Implementation Steps

**Step 4.1: Add Agent Descriptions Data** (5 min)

**File**: `components/Header.jsx`

**Update chatbots array**:
```javascript
const chatbots = [
  {
    name: "D.A.W.N",
    icon: "🤖",
    description: "Dependable Agent Working Nicely - A friendly agent designed to assist the admin team manage tasks."
  },
  {
    name: "Lisa",
    icon: "🎭",
    description: "Specialized mental health support agent with empathetic conversation capabilities."
  },
  {
    name: "Secret Agent #1",
    icon: "💎",
    description: "Advanced AI assistant for complex administrative and support tasks."
  },
  {
    name: "Secret Agent #2",
    icon: <Asterisk className="h-4 w-4" />,
    description: "Auxiliary support agent for specialized queries and assistance."
  },
]
```

**Step 4.2: Display Description Below Agent Selector** (15 min)

**File**: `components/Header.jsx`

**After the agent selector button, add description div**:
```jsx
<div className="hidden md:flex relative">
  {/* Agent Selector Button */}
  <button
    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold tracking-tight hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800"
  >
    {/* ... existing button content ... */}
  </button>

  {/* Dropdown Menu */}
  {isDropdownOpen && (
    // ... existing dropdown ...
  )}
</div>

{/* Agent Description - Below Dropdown */}
<div className="hidden md:block ml-4 max-w-md">
  <p className="text-xs text-zinc-500 dark:text-zinc-400">
    {chatbots.find((bot) => bot.name === selectedBot)?.description}
  </p>
</div>
```

**Alternative Layout** (if space is limited):
```jsx
{/* Put description below the entire header */}
<div className="hidden md:block px-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
  <p className="text-xs text-zinc-500 dark:text-zinc-400">
    {chatbots.find((bot) => bot.name === selectedBot)?.description}
  </p>
</div>
```

**Step 4.3: Style Improvements** (5 min)

Ensure description:
- Uses muted text color (zinc-500/zinc-400)
- Small font size (text-xs)
- Truncates if too long
- Responsive (hidden on mobile)

**Testing**:
1. Load page with D.A.W.N selected
2. See description: "Dependable Agent Working Nicely - A friendly agent designed to assist the admin team manage tasks."
3. Switch to Lisa
4. Description should update to Lisa's description
5. Verify on mobile - description hidden on small screens

---

## 🗂️ Implementation Order (Recommended)

### **Phase 4A: Critical Fixes** (75 min)
Priority: HIGH - Affects core functionality

1. ✅ Fix 1: Conversation Auto-Save (30 min)
   - Most critical - users losing data
   - Test thoroughly before moving on

2. ✅ Fix 2: Settings Menu (45 min)
   - Users need to logout
   - Professional appearance with real data

**Test Checkpoint**: Verify conversations persist and logout works

---

### **Phase 4B: Enhancement Fixes** (55 min)
Priority: MEDIUM - Improves UX

3. ✅ Fix 3: Header Three-Dot Menu (30 min)
   - Adds missing folder functionality
   - Consistent with sidebar interaction

4. ✅ Fix 4: Agent Descriptions (25 min)
   - Better user understanding of agents
   - Polished appearance

**Final Test Checkpoint**: Full regression test of all features

---

## 🧪 Testing Checklist

### Fix 1: Conversation Auto-Save
- [ ] Create new conversation
- [ ] Send first message
- [ ] Verify title updates in database
- [ ] Refresh page
- [ ] Conversation still shows with messages
- [ ] Send more messages
- [ ] Refresh again - all messages persist

### Fix 2: Settings Menu
- [ ] Open settings menu
- [ ] Verify user name matches Microsoft account
- [ ] Verify email matches Microsoft account
- [ ] User initials generated correctly
- [ ] Click logout
- [ ] Redirected to sign-in page
- [ ] Sign in again - works correctly

### Fix 3: Header Menu
- [ ] Open conversation
- [ ] Click three-dot button in header
- [ ] Menu opens
- [ ] Click "Move to Folder"
- [ ] Folder modal opens
- [ ] Select folder
- [ ] Conversation moves correctly
- [ ] Click outside menu - closes

### Fix 4: Agent Descriptions
- [ ] D.A.W.N selected by default
- [ ] Description shows: "Dependable Agent Working Nicely..."
- [ ] Click dropdown, select Lisa
- [ ] Description updates to Lisa's description
- [ ] Try each agent - all show descriptions
- [ ] Check mobile - description hidden

---

## 📋 Files to Modify

### Fix 1: Auto-Save
1. `app/api/conversations/[id]/route.ts` - Add PATCH handler
2. `lib/db/conversations.ts` - Add updateConversation()
3. `components/AIAssistantUI.jsx` - Update sendMessage()

### Fix 2: Settings
4. `components/SettingsPopover.jsx` - Use session, wire logout
5. `components/Sidebar.jsx` - Display real user info
6. `app/layout.tsx` - Verify SessionProvider

### Fix 3: Header Menu
7. `components/Header.jsx` - Add dropdown menu functionality
8. `components/AIAssistantUI.jsx` - Pass props to Header

### Fix 4: Descriptions
9. `components/Header.jsx` - Add descriptions to agents, display text

**Total Files**: 6-7 files

---

## 🚀 Deployment Strategy

### Phase 4A Deployment
1. Implement Fix 1 (Auto-save)
2. Test locally
3. Implement Fix 2 (Settings)
4. Test locally
5. Commit Phase 4A
6. Deploy to production
7. **Critical Testing** on production
8. Verify users can logout and conversations persist

### Phase 4B Deployment
1. Implement Fix 3 (Header menu)
2. Test locally
3. Implement Fix 4 (Descriptions)
4. Test locally
5. Commit Phase 4B
6. Deploy to production
7. Final regression testing

### Rollback Plan
- Each fix is independent
- Can revert individual commits if needed
- Settings changes don't affect data persistence
- Safe to test incrementally

---

## ✅ Success Criteria

### Fix 1 Success
✅ Conversations persist across page refreshes
✅ Message count updates correctly
✅ Titles update in database
✅ No data loss

### Fix 2 Success
✅ Real user name displayed
✅ Real email displayed
✅ Logout button works
✅ Redirects to sign-in page
✅ Can sign back in

### Fix 3 Success
✅ Three-dot menu opens/closes
✅ "Move to Folder" accessible
✅ Modal opens correctly
✅ Folder change works

### Fix 4 Success
✅ Agent descriptions visible
✅ Descriptions update with selection
✅ Text is readable and well-styled
✅ Responsive on desktop only

---

## 📝 Implementation Notes

### Database Considerations
- PATCH endpoint needs same security as DELETE (ownership verification)
- Title updates should be atomic
- Folder field might not exist in Conversation model yet (add if needed)

### Session Management
- useSession() requires SessionProvider in app tree
- signOut() can specify callback URL
- Session data automatically refreshes

### UI/UX Polish
- Agent descriptions improve user understanding
- Three-dot menu provides consistent interaction pattern
- Settings menu should match theme (light/dark)

---

## 🎯 Expected Outcomes

**After Phase 4A**:
- Users can have persistent conversations
- Users can properly logout
- Professional user experience

**After Phase 4B**:
- Complete folder management from header
- Clear agent purpose communication
- Polished, production-ready interface

**Total Time**: ~2 hours for all fixes

---

## Ready to Begin?

The plan is systematic and testable. Recommended approach:
1. Start with **Fix 1** (Auto-save) - Most critical
2. Move to **Fix 2** (Settings) - High impact
3. Deploy Phase 4A and test
4. Continue with **Fix 3** and **Fix 4**
5. Final deployment and testing

Let me know which fix you'd like to start with!
