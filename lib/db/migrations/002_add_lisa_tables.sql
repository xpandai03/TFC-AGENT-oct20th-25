-- Migration 002: Add LISA RAG Agent Tables
-- This migration adds support for document upload, vectorization, and RAG functionality
-- Compatible with existing D.A.W.N. agent - no breaking changes

-- ============================================================================
-- STEP 1: Enable pgvector extension for vector embeddings
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- STEP 2: Update conversations table to support multiple agents
-- ============================================================================
-- Add agent_type column to distinguish between D.A.W.N. and LISA conversations
-- Default to 'dawn' to maintain backward compatibility with existing conversations
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS agent_type VARCHAR(50) DEFAULT 'dawn' NOT NULL;

-- Set all existing conversations to 'dawn' agent type
UPDATE conversations
SET agent_type = 'dawn'
WHERE agent_type IS NULL;

-- Add index for faster filtering by agent type
CREATE INDEX IF NOT EXISTS idx_conversations_agent_type ON conversations(agent_type);

-- Add comment for documentation
COMMENT ON COLUMN conversations.agent_type IS 'Type of agent: dawn (Excel operations) or lisa (RAG document Q&A)';

-- ============================================================================
-- STEP 3: Create documents table for uploaded files
-- ============================================================================
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(255) NOT NULL,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- File metadata
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,  -- pdf, docx, txt
  file_size INTEGER NOT NULL,  -- bytes
  file_path TEXT NOT NULL,  -- local storage path or URL

  -- Processing status
  processing_status VARCHAR(50) DEFAULT 'pending' NOT NULL,  -- pending, processing, completed, failed
  processing_error TEXT,  -- store error message if processing fails

  -- Document info (populated after processing)
  page_count INTEGER,
  chunk_count INTEGER,
  total_tokens INTEGER,

  -- Additional metadata (JSON for flexibility)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_conversation ON documents(conversation_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE documents IS 'Stores metadata for uploaded documents in LISA RAG agent';
COMMENT ON COLUMN documents.processing_status IS 'Processing stages: pending -> processing -> completed (or failed)';
COMMENT ON COLUMN documents.metadata IS 'Flexible JSON field for additional document properties';

-- ============================================================================
-- STEP 4: Create document_chunks table for RAG retrieval
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Chunk position
  chunk_index INTEGER NOT NULL,  -- sequential index within document

  -- Content
  content TEXT NOT NULL,

  -- Source location (for citations)
  page_number INTEGER,  -- which page this chunk came from
  section_title TEXT,  -- section/heading if available

  -- Vector embedding for semantic search
  -- text-embedding-3-large produces 3072-dimensional vectors
  embedding vector(3072),

  -- Chunk metadata
  char_count INTEGER,
  token_count INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chunks_document ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_index ON document_chunks(document_id, chunk_index);

-- Vector similarity search index (HNSW for cosine similarity)
-- NOTE: pgvector versions < 0.5.0 have a 2000 dimension limit for indexes
-- text-embedding-3-large uses 3072 dimensions, so we skip the index for now
-- Vector search will still work but may be slower on large datasets
-- To add index later (requires pgvector >= 0.5.0):
-- CREATE INDEX idx_chunks_embedding ON document_chunks USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
-- For now, we rely on the document filtering (conversation_id) to keep search spaces small

-- Comments for documentation
COMMENT ON TABLE document_chunks IS 'Stores text chunks with vector embeddings for semantic search';
COMMENT ON COLUMN document_chunks.embedding IS 'Vector embedding from Azure text-embedding-3-large (3072 dimensions)';
COMMENT ON COLUMN document_chunks.chunk_index IS 'Sequential position of chunk within document (0-based)';

-- ============================================================================
-- STEP 5: Create helper function for vector similarity search
-- ============================================================================
-- This function makes it easier to search for relevant chunks
CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding vector(3072),
  target_conversation_id TEXT,
  result_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  chunk_id TEXT,
  document_id TEXT,
  document_name VARCHAR(255),
  content TEXT,
  page_number INTEGER,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id AS chunk_id,
    dc.document_id,
    d.file_name AS document_name,
    dc.content,
    dc.page_number,
    (1 - (dc.embedding <=> query_embedding)) AS similarity
  FROM document_chunks dc
  JOIN documents d ON dc.document_id = d.id
  WHERE d.conversation_id = target_conversation_id
    AND d.processing_status = 'completed'
    AND dc.embedding IS NOT NULL
  ORDER BY dc.embedding <=> query_embedding
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_document_chunks IS 'Search for relevant document chunks using vector similarity (cosine distance)';

-- ============================================================================
-- STEP 6: Create updated_at trigger for documents table
-- ============================================================================
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- ============================================================================
-- Migration complete!
-- ============================================================================

-- Verify installation
DO $$
BEGIN
  RAISE NOTICE 'LISA RAG Agent Migration 002 completed successfully!';
  RAISE NOTICE 'Tables created: documents, document_chunks';
  RAISE NOTICE 'Extension enabled: pgvector';
  RAISE NOTICE 'Helper function created: search_document_chunks()';
END $$;
