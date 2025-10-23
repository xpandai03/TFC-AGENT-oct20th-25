# LISA RAG Agent - Implementation Plan

## 📋 Overview

**LISA** (Learning & Intelligence Support Assistant) is a RAG-based document Q&A agent that allows users to upload documents, vectorize them, and have intelligent conversations with source citations.

## 🎯 Core Requirements

### What LISA Does
1. **Document Upload**: Users can upload documents (PDF, DOCX, TXT, etc.)
2. **Vectorization**: Documents are chunked and embedded using Azure text-embedding-3-large
3. **RAG Chat**: Users ask questions, LISA retrieves relevant chunks and generates answers
4. **Source Citations**: LISA cites which documents/pages answers come from
5. **Conversation Persistence**: LISA chats are saved in the same database as D.A.W.N. chats

### Key Differences from D.A.W.N.
- **D.A.W.N.**: Excel operations (status updates, notes) - tool-based agent
- **LISA**: Document Q&A - RAG-based agent with vector search

## 🏗️ Architecture Design

### Agent Selection System
```
┌─────────────────────────────────────┐
│   Agent Dropdown (Header)           │
│   [D.A.W.N. ▼] → [LISA ▼]          │
└─────────────────────────────────────┘
              │
              ├── D.A.W.N. Selected
              │   └─> ChatPane (Excel tools)
              │
              └── LISA Selected
                  └─> LisaChatPane (Document upload + RAG)
```

### Data Model

#### Database Tables

**1. Conversations Table (existing)**
```sql
-- Add agent_type column to existing table
ALTER TABLE conversations
ADD COLUMN agent_type VARCHAR(50) DEFAULT 'dawn';

-- Possible values: 'dawn', 'lisa'
```

**2. Documents Table (new)**
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,  -- S3/Cloudflare/local storage path
  upload_date TIMESTAMP DEFAULT NOW(),
  processing_status VARCHAR(50) DEFAULT 'pending',  -- pending, processing, completed, failed
  page_count INTEGER,
  chunk_count INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_conversation ON documents(conversation_id);
```

**3. Document Chunks Table (new)**
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  page_number INTEGER,
  embedding vector(3072),  -- text-embedding-3-large produces 3072 dimensions
  metadata JSONB,  -- stores: char_count, token_count, position, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops);
```

### File Storage Strategy

**Option 1: Cloudflare R2 (Recommended)**
- S3-compatible storage
- No egress fees
- Already integrated with Render

**Option 2: Local Filesystem**
- Store in `/uploads` directory
- Simpler but not scalable
- Risk of data loss on redeploy

**Recommendation**: Start with local filesystem for MVP, migrate to R2 later

### Document Processing Pipeline

```
Upload File
    ↓
Save to Storage (local/R2)
    ↓
Extract Text (pdf-parse, mammoth, etc.)
    ↓
Chunk Text (recursive character splitter, ~500 tokens per chunk)
    ↓
Generate Embeddings (Azure text-embedding-3-large)
    ↓
Store in Postgres (document_chunks with vector embeddings)
    ↓
Mark as Completed
```

### RAG Retrieval Flow

```
User Question
    ↓
Generate Query Embedding (text-embedding-3-large)
    ↓
Vector Search (pgvector cosine similarity, top-k=5)
    ↓
Retrieve Relevant Chunks
    ↓
Build Context Prompt
    ↓
Call Azure OpenAI with Context
    ↓
Generate Answer with Citations
    ↓
Return Response
```

## 🔧 Implementation Plan

### Phase 1: Database & Models (Day 1)
**Duration**: 2-3 hours

1. **Update Database Schema**
   - Add `agent_type` column to conversations table
   - Create `documents` table
   - Create `document_chunks` table with vector support
   - Add pgvector extension

2. **Create Migration Script**
   - File: `lib/db/migrations/002_add_lisa_tables.sql`
   - Run migration on Render Postgres

3. **Create TypeScript Types**
   - File: `lib/types/lisa.ts`
   - Document, DocumentChunk, RAGContext interfaces

**Success Criteria**:
- ✅ Database tables created
- ✅ TypeScript types defined
- ✅ No breaking changes to existing D.A.W.N. functionality

---

### Phase 2: Agent Selection UI (Day 1-2)
**Duration**: 2-3 hours

1. **Update Header Component**
   - File: `components/Header.jsx`
   - Add agent dropdown selector
   - Store selected agent in state/context

2. **Create Agent Context**
   - File: `contexts/AgentContext.tsx`
   - Global state for selected agent
   - Persist selection in localStorage

3. **Update AIAssistantUI**
   - Conditionally render ChatPane vs LisaChatPane
   - Pass agent type to conversation creation

**Files to Modify**:
- `components/Header.jsx`
- `components/AIAssistantUI.jsx`
- New: `contexts/AgentContext.tsx`

**Success Criteria**:
- ✅ Dropdown shows D.A.W.N. and LISA options
- ✅ Selection persists across page refreshes
- ✅ UI switches between agents correctly

---

### Phase 3: Document Upload UI (Day 2)
**Duration**: 3-4 hours

1. **Create LisaChatPane Component**
   - File: `components/LisaChatPane.jsx`
   - Similar to ChatPane but with document upload area
   - Show uploaded documents list
   - Document processing status indicators

2. **Create DocumentUpload Component**
   - File: `components/DocumentUpload.jsx`
   - Drag & drop zone
   - File type validation (PDF, DOCX, TXT)
   - Size limit validation (e.g., 10MB max)
   - Upload progress indicator

3. **Create DocumentList Component**
   - File: `components/DocumentList.jsx`
   - Shows uploaded documents
   - Processing status (pending, processing, completed, failed)
   - Delete document option
   - Page count, chunk count display

**UI Layout**:
```
┌─────────────────────────────────────────────┐
│  LISA - Document Assistant                  │
├─────────────────────────────────────────────┤
│  Documents (3)                    [Upload]  │
│  ┌─────────────────────────────────────┐   │
│  │ 📄 TFC_Guidelines.pdf  ✓ 12 pages   │   │
│  │ 📄 Client_Intake.docx  ✓ 5 pages    │   │
│  │ 📄 Policies.txt        ⏳ Processing │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  Chat Messages...                           │
│                                             │
│  [User]: What are the intake requirements? │
│  [LISA]: According to TFC_Guidelines.pdf...│
│         Source: TFC_Guidelines.pdf, p. 3    │
├─────────────────────────────────────────────┤
│  Ask about your documents...          [↑]  │
└─────────────────────────────────────────────┘
```

**Success Criteria**:
- ✅ Users can upload documents
- ✅ Upload progress shown
- ✅ Documents list displays correctly
- ✅ Processing status updates in real-time

---

### Phase 4: Document Processing Backend (Day 2-3)
**Duration**: 4-5 hours

1. **Create Upload API Endpoint**
   - File: `app/api/documents/upload/route.ts`
   - Handle multipart file upload
   - Save file to storage
   - Create document record in DB
   - Trigger processing job

2. **Create Document Processing Service**
   - File: `lib/services/document-processor.ts`
   - Extract text from PDF (using `pdf-parse`)
   - Extract text from DOCX (using `mammoth`)
   - Extract text from TXT (direct read)

3. **Create Chunking Service**
   - File: `lib/services/text-chunker.ts`
   - Split text into chunks (~500 tokens)
   - Use recursive character text splitter
   - Preserve context boundaries (paragraphs, sections)

4. **Create Embedding Service**
   - File: `lib/services/embedding.ts`
   - Call Azure OpenAI text-embedding-3-large
   - Batch process chunks for efficiency
   - Handle rate limits

5. **Create Storage Service**
   - File: `lib/services/vector-store.ts`
   - Store chunks with embeddings in Postgres
   - Update document status

**API Endpoints**:
```
POST /api/documents/upload
  - Upload file
  - Returns: document_id, processing status

GET /api/documents
  - List user's documents
  - Filter by conversation_id

DELETE /api/documents/:id
  - Delete document and all chunks
  - Cascade delete from vector store

GET /api/documents/:id/status
  - Check processing status
```

**Dependencies to Install**:
```bash
npm install pdf-parse mammoth
npm install @langchain/textsplitters
npm install @azure/openai
npm install pg  # for pgvector queries
```

**Success Criteria**:
- ✅ PDF files processed correctly
- ✅ DOCX files processed correctly
- ✅ Text chunked appropriately
- ✅ Embeddings generated and stored
- ✅ Document status updates correctly

---

### Phase 5: RAG Retrieval System (Day 3-4)
**Duration**: 4-5 hours

1. **Create Vector Search Service**
   - File: `lib/services/vector-search.ts`
   - Implement cosine similarity search
   - Return top-k relevant chunks
   - Include metadata (document name, page number)

2. **Update Chat API for LISA**
   - File: `app/api/chat/route.ts`
   - Check if agent_type is 'lisa'
   - If LISA:
     - Get user's uploaded documents for conversation
     - Generate query embedding
     - Perform vector search
     - Build RAG context
     - Add context to system prompt
   - If D.A.W.N.: Use existing tool-based flow

3. **Create RAG Context Builder**
   - File: `lib/services/rag-context.ts`
   - Format retrieved chunks into context
   - Add source metadata
   - Handle token limits

4. **Update LISA System Prompt**
   - File: `lib/agent/lisa-prompts.ts`
   - Instructions to use provided context
   - Instructions to cite sources
   - Format for citations

**Vector Search Query Example**:
```sql
SELECT
  dc.content,
  dc.page_number,
  d.file_name,
  1 - (dc.embedding <=> $1) as similarity
FROM document_chunks dc
JOIN documents d ON dc.document_id = d.id
WHERE d.conversation_id = $2
ORDER BY dc.embedding <=> $1
LIMIT 5;
```

**RAG Context Format**:
```
You are LISA, a document assistant. Answer questions based on the provided context.

Context from uploaded documents:
---
[Document: TFC_Guidelines.pdf, Page 3]
All new clients must complete an intake form including contact information, emergency contacts, and medical history...

[Document: TFC_Guidelines.pdf, Page 5]
Clients must be referred by a licensed healthcare provider...
---

IMPORTANT:
- Only use information from the provided context
- Always cite your sources using format: [Source: filename, p. X]
- If the context doesn't contain relevant information, say so
```

**Success Criteria**:
- ✅ Vector search returns relevant chunks
- ✅ RAG context properly formatted
- ✅ LISA provides accurate answers
- ✅ Citations included in responses

---

### Phase 6: Source Citations UI (Day 4)
**Duration**: 2-3 hours

1. **Create Citation Component**
   - File: `components/Citation.jsx`
   - Display inline citations
   - Link to source document
   - Show page number

2. **Parse Citations from Response**
   - Update Message component
   - Detect citation format `[Source: filename, p. X]`
   - Render as clickable citation

3. **Add Document Viewer Modal**
   - File: `components/DocumentViewer.jsx`
   - Show document preview when citation clicked
   - Highlight relevant page/section

**Citation Display Example**:
```
According to the guidelines, all clients must complete an
intake form [Source: TFC_Guidelines.pdf, p. 3].
```

**Success Criteria**:
- ✅ Citations displayed correctly
- ✅ Citations are clickable
- ✅ Document viewer opens on click

---

### Phase 7: Testing & Refinement (Day 4-5)
**Duration**: 3-4 hours

1. **End-to-End Testing**
   - Upload various document types
   - Ask questions requiring multi-document answers
   - Test edge cases (large files, no documents, etc.)

2. **Performance Optimization**
   - Optimize vector search query
   - Add caching where appropriate
   - Batch embedding generation

3. **Error Handling**
   - File upload errors
   - Processing failures
   - Vector search failures
   - Missing documents

4. **UI/UX Polish**
   - Loading states
   - Error messages
   - Empty states
   - Mobile responsiveness

**Success Criteria**:
- ✅ All user flows work end-to-end
- ✅ Performance is acceptable (<2s response time)
- ✅ Errors handled gracefully
- ✅ UI is polished and intuitive

---

### Phase 8: Deployment (Day 5)
**Duration**: 1-2 hours

1. **Environment Variables**
   - Add to Render:
     - `AZURE_EMBEDDING_DEPLOYMENT` (text-embedding-3-large)
     - `MAX_FILE_SIZE` (default 10MB)
     - `ALLOWED_FILE_TYPES` (pdf,docx,txt)

2. **Database Migration**
   - Run migration on Render Postgres
   - Verify pgvector extension

3. **Storage Setup**
   - Create `/uploads` directory or
   - Configure Cloudflare R2 bucket

4. **Deploy & Monitor**
   - Deploy to Render
   - Monitor logs for errors
   - Test on production

**Success Criteria**:
- ✅ LISA works on production
- ✅ No breaking changes to D.A.W.N.
- ✅ Documents persist correctly

---

## 📁 File Structure

```
TFC-AGENT-OCT25/
├── app/
│   └── api/
│       ├── chat/
│       │   └── route.ts (updated for LISA)
│       └── documents/
│           ├── upload/
│           │   └── route.ts
│           ├── [id]/
│           │   ├── route.ts
│           │   └── status/
│           │       └── route.ts
│           └── route.ts
├── components/
│   ├── LisaChatPane.jsx (new)
│   ├── DocumentUpload.jsx (new)
│   ├── DocumentList.jsx (new)
│   ├── DocumentViewer.jsx (new)
│   ├── Citation.jsx (new)
│   ├── Header.jsx (updated)
│   └── AIAssistantUI.jsx (updated)
├── contexts/
│   └── AgentContext.tsx (new)
├── lib/
│   ├── agent/
│   │   └── lisa-prompts.ts (new)
│   ├── services/
│   │   ├── document-processor.ts (new)
│   │   ├── text-chunker.ts (new)
│   │   ├── embedding.ts (new)
│   │   ├── vector-store.ts (new)
│   │   ├── vector-search.ts (new)
│   │   └── rag-context.ts (new)
│   ├── types/
│   │   └── lisa.ts (new)
│   └── db/
│       └── migrations/
│           └── 002_add_lisa_tables.sql (new)
└── uploads/ (new, for file storage)
```

## 🔐 Security Considerations

1. **File Upload Validation**
   - Whitelist allowed file types
   - Limit file size (10MB default)
   - Scan for malware (if budget allows)

2. **Access Control**
   - Users can only see their own documents
   - Users can only delete their own documents
   - Documents tied to user_id and conversation_id

3. **Vector Search Isolation**
   - Search only within user's conversation documents
   - No cross-user document leakage

4. **Storage Security**
   - Files stored with UUID names (not original names)
   - No direct public access to files
   - Serve files through authenticated API

## 📊 Performance Considerations

1. **Embedding Generation**
   - Batch process chunks (max 100 per batch)
   - Handle Azure rate limits (3000 RPM)
   - Show progress to user

2. **Vector Search**
   - Use IVFFlat index for faster search
   - Limit search to conversation documents (smaller search space)
   - Cache embeddings

3. **File Processing**
   - Process asynchronously (don't block upload response)
   - Use background job queue (or simple setTimeout for MVP)
   - Show real-time status updates via polling or WebSocket

## 🎨 UI/UX Enhancements

1. **Welcome Message for LISA**
   ```
   Hi! I'm LISA, your document assistant. Upload documents
   to get started, and I'll help you find answers within them.
   ```

2. **Empty State**
   - Show upload prompt when no documents
   - Provide example use cases

3. **Loading States**
   - Document uploading progress
   - Processing status spinner
   - Generating answer loading state

4. **Error States**
   - File too large
   - Unsupported file type
   - Processing failed
   - No relevant information found

## 🚀 MVP vs Full Feature Set

### MVP (Launch First)
- ✅ PDF upload only
- ✅ Simple chunking (fixed size)
- ✅ Basic vector search (top-5)
- ✅ Text citations (no viewer)
- ✅ Local file storage

### Future Enhancements
- 📄 Support DOCX, TXT, CSV, JSON
- 🔄 Advanced chunking (semantic, hierarchical)
- 🎯 Hybrid search (vector + keyword)
- 👁️ Document viewer with highlighting
- ☁️ Cloud storage (Cloudflare R2)
- 📊 Usage analytics
- 🔍 Advanced filters (by document, date)
- 📱 Mobile-optimized upload

## 🧪 Testing Checklist

### Functional Tests
- [ ] Upload PDF, DOCX, TXT files
- [ ] Processing completes successfully
- [ ] Embeddings generated correctly
- [ ] Vector search returns relevant results
- [ ] Chat provides accurate answers
- [ ] Citations are correct
- [ ] Delete document works
- [ ] Conversations persist correctly

### Edge Cases
- [ ] Upload very large file (>10MB)
- [ ] Upload unsupported file type
- [ ] Upload empty file
- [ ] Ask question with no documents uploaded
- [ ] Ask question not covered by documents
- [ ] Delete document while processing
- [ ] Switch between D.A.W.N. and LISA mid-conversation

### Performance Tests
- [ ] Upload 10MB PDF processes in <30s
- [ ] Vector search completes in <500ms
- [ ] Chat response time <3s with RAG
- [ ] UI remains responsive during processing

## 📝 Implementation Timeline

| Phase | Task | Duration | Complexity |
|-------|------|----------|------------|
| 1 | Database & Models | 2-3h | Low |
| 2 | Agent Selection UI | 2-3h | Low |
| 3 | Document Upload UI | 3-4h | Medium |
| 4 | Document Processing | 4-5h | High |
| 5 | RAG Retrieval | 4-5h | High |
| 6 | Source Citations | 2-3h | Medium |
| 7 | Testing & Polish | 3-4h | Medium |
| 8 | Deployment | 1-2h | Low |
| **Total** | | **21-29h** | **~3-4 days** |

## 🎯 Success Metrics

1. **Functionality**
   - Users can upload documents successfully (>95% success rate)
   - Processing completes within 30 seconds for 10MB files
   - RAG retrieval is accurate (manual evaluation)
   - Citations are correct and clickable

2. **User Experience**
   - Clear upload flow
   - Real-time status updates
   - Fast response times (<3s)
   - Intuitive UI

3. **Technical**
   - No breaking changes to D.A.W.N.
   - No data leakage between users
   - Scalable architecture
   - Clean code with proper error handling

## 🔄 Integration Points with Existing System

### Shared Components
- Same sidebar for saved chats
- Same authentication (NextAuth)
- Same database (Postgres)
- Same styling (Tailwind)

### Differences from D.A.W.N.
- No tool calling for LISA
- RAG-based responses instead
- Document upload interface
- Different system prompt
- Vector search instead of n8n webhooks

### Database Schema Updates
```sql
-- Backward compatible changes only
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS agent_type VARCHAR(50) DEFAULT 'dawn';
UPDATE conversations SET agent_type = 'dawn' WHERE agent_type IS NULL;

-- New tables (no impact on existing data)
CREATE TABLE documents (...);
CREATE TABLE document_chunks (...);
```

## 📚 Dependencies to Add

```json
{
  "dependencies": {
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.6.0",
    "@langchain/textsplitters": "^0.0.1",
    "pg": "^8.11.3",
    "pgvector": "^0.1.8"
  }
}
```

## 🎓 Learning Resources

- [Azure OpenAI Embeddings](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/embeddings)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [LangChain Text Splitters](https://js.langchain.com/docs/modules/data_connection/document_transformers/)
- [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)

## ✅ Ready to Implement?

This plan provides a systematic, step-by-step approach to implementing LISA without breaking D.A.W.N. functionality. We'll:

1. Start with database schema (non-breaking changes)
2. Build UI components incrementally
3. Implement backend services one at a time
4. Test thoroughly at each phase
5. Deploy with confidence

**Estimated Total Time**: 3-4 days for full implementation
**Risk Level**: Low (backward compatible design)
**Complexity**: Medium-High (RAG + Vector search)

Ready to start? Let's begin with Phase 1! 🚀
