-- ================================================
-- Migration: Add LISA RAG Tables and Functions
-- Date: 2025-10-23
-- Purpose: Enable LISA document upload, vector storage, and RAG retrieval
-- ================================================

-- Step 1: Add agent_type to conversations table (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'agent_type'
  ) THEN
    ALTER TABLE "conversations" ADD COLUMN "agent_type" VARCHAR(50) DEFAULT 'dawn';
    CREATE INDEX "conversations_agent_type_idx" ON "conversations"("agent_type");
  END IF;
END $$;

-- Step 2: Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 3: Create documents table
CREATE TABLE IF NOT EXISTS "documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(50) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "processing_status" VARCHAR(50) DEFAULT 'pending',
    "page_count" INTEGER,
    "chunk_count" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- Create indexes for documents table
CREATE INDEX IF NOT EXISTS "documents_user_id_idx" ON "documents"("user_id");
CREATE INDEX IF NOT EXISTS "documents_conversation_id_idx" ON "documents"("conversation_id");
CREATE INDEX IF NOT EXISTS "documents_deleted_at_idx" ON "documents"("deleted_at");
CREATE INDEX IF NOT EXISTS "documents_processing_status_idx" ON "documents"("processing_status");

-- Step 4: Create document_chunks table with vector embeddings
CREATE TABLE IF NOT EXISTS "document_chunks" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "page_number" INTEGER,
    "embedding" vector(3072),  -- text-embedding-3-large produces 3072 dimensions
    "metadata" JSONB,  -- Store char_count, startChar, endChar here
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- Create indexes for document_chunks table
CREATE INDEX IF NOT EXISTS "document_chunks_document_id_idx" ON "document_chunks"("document_id");

-- Create vector similarity index using HNSW
-- HNSW (Hierarchical Navigable Small World) supports high-dimensional vectors (3072+)
-- IVFFlat has a 2000-dimension limit, so we use HNSW for text-embedding-3-large
-- m = 16: Number of connections per layer (higher = better recall, more memory)
-- ef_construction = 64: Quality of index construction (higher = better quality, slower build)
CREATE INDEX IF NOT EXISTS "document_chunks_embedding_idx"
ON "document_chunks"
USING hnsw ("embedding" vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Add foreign key constraint
ALTER TABLE "document_chunks"
ADD CONSTRAINT "document_chunks_document_id_fkey"
FOREIGN KEY ("document_id")
REFERENCES "documents"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Step 5: Create search_document_chunks function for RAG retrieval
-- This function performs vector similarity search and returns top-k relevant chunks
CREATE OR REPLACE FUNCTION search_document_chunks(
    query_embedding vector(3072),
    p_conversation_id TEXT,
    result_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    chunk_id TEXT,
    document_id TEXT,
    document_name VARCHAR(255),
    content TEXT,
    page_number INTEGER,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id AS chunk_id,
        dc.document_id,
        d.file_name AS document_name,
        dc.content,
        dc.page_number,
        1 - (dc.embedding <=> query_embedding) AS similarity  -- Cosine similarity
    FROM document_chunks dc
    INNER JOIN documents d ON dc.document_id = d.id
    WHERE
        d.conversation_id = p_conversation_id
        AND d.deleted_at IS NULL
        AND d.processing_status = 'completed'
        AND dc.embedding IS NOT NULL
    ORDER BY dc.embedding <=> query_embedding  -- Cosine distance (lower = more similar)
    LIMIT result_limit;
END;
$$;

-- Step 6: Add helpful comment to the function
COMMENT ON FUNCTION search_document_chunks IS 'Performs vector similarity search to find relevant document chunks for RAG. Uses cosine distance (<=> operator) for similarity ranking.';

-- ================================================
-- Migration Complete
-- ================================================
-- Summary:
-- - Added agent_type to conversations
-- - Enabled pgvector extension
-- - Created documents table (for file metadata)
-- - Created document_chunks table (for vectorized chunks)
-- - Created IVFFlat index for fast vector search
-- - Created search_document_chunks() function for RAG
-- ================================================
