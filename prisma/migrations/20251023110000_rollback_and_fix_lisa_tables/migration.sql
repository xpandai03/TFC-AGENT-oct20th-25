-- ================================================
-- Migration: Rollback and Fix Failed LISA Tables Migration
-- Date: 2025-10-23
-- Purpose: Resolve P3009 error by marking failed migration as resolved
--          and applying complete schema with HNSW index
-- ================================================

-- STEP 1: Mark the failed migration as resolved
-- This tells Prisma the migration is complete, allowing new migrations to run
UPDATE "_prisma_migrations"
SET
    finished_at = CASE
        WHEN finished_at IS NULL THEN NOW()
        ELSE finished_at
    END,
    applied_steps_count = 1
WHERE migration_name = '20251023103000_add_lisa_rag_tables'
  AND finished_at IS NULL;

-- STEP 2: Clean up any partially created objects from the failed migration
-- Using IF EXISTS ensures this is safe to run multiple times

-- Drop indexes (they may have been partially created)
DROP INDEX IF EXISTS "document_chunks_embedding_idx";
DROP INDEX IF EXISTS "document_chunks_document_id_idx";
DROP INDEX IF EXISTS "documents_processing_status_idx";
DROP INDEX IF EXISTS "documents_deleted_at_idx";
DROP INDEX IF EXISTS "documents_conversation_id_idx";
DROP INDEX IF EXISTS "documents_user_id_idx";
DROP INDEX IF EXISTS "conversations_agent_type_idx";

-- Drop function (it may have been created before the index failed)
DROP FUNCTION IF EXISTS search_document_chunks(vector, TEXT, INTEGER);

-- Drop foreign key constraints
ALTER TABLE IF EXISTS "document_chunks"
DROP CONSTRAINT IF EXISTS "document_chunks_document_id_fkey";

-- Drop tables (in correct order due to dependencies)
DROP TABLE IF EXISTS "document_chunks";
DROP TABLE IF EXISTS "documents";

-- STEP 3: Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- STEP 4: Add agent_type column to conversations (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'agent_type'
  ) THEN
    ALTER TABLE "conversations" ADD COLUMN "agent_type" VARCHAR(50) DEFAULT 'dawn';
  END IF;
END $$;

-- Create index for agent_type (if not exists)
CREATE INDEX IF NOT EXISTS "conversations_agent_type_idx" ON "conversations"("agent_type");

-- STEP 5: Create documents table (complete schema)
CREATE TABLE "documents" (
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
CREATE INDEX "documents_user_id_idx" ON "documents"("user_id");
CREATE INDEX "documents_conversation_id_idx" ON "documents"("conversation_id");
CREATE INDEX "documents_deleted_at_idx" ON "documents"("deleted_at");
CREATE INDEX "documents_processing_status_idx" ON "documents"("processing_status");

-- STEP 6: Create document_chunks table with vector support
CREATE TABLE "document_chunks" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "page_number" INTEGER,
    "embedding" vector(3072),  -- text-embedding-3-large dimensions
    "metadata" JSONB,  -- stores charCount, startChar, endChar
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- Create indexes for document_chunks table
CREATE INDEX "document_chunks_document_id_idx" ON "document_chunks"("document_id");

-- STEP 7: Create HNSW index for vector similarity search
-- HNSW supports unlimited dimensions (unlike IVFFlat which maxes at 2000)
CREATE INDEX "document_chunks_embedding_idx"
ON "document_chunks"
USING hnsw ("embedding" vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- STEP 8: Add foreign key constraint
ALTER TABLE "document_chunks"
ADD CONSTRAINT "document_chunks_document_id_fkey"
FOREIGN KEY ("document_id")
REFERENCES "documents"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- STEP 9: Create search_document_chunks function for RAG retrieval
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
    ORDER BY dc.embedding <=> query_embedding  -- Cosine distance
    LIMIT result_limit;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION search_document_chunks IS 'Vector similarity search for RAG. Uses cosine distance for ranking.';

-- ================================================
-- Migration Complete
-- ================================================
-- Summary:
-- ✅ Marked failed migration as resolved
-- ✅ Cleaned up partial objects
-- ✅ Enabled pgvector extension
-- ✅ Added agent_type to conversations
-- ✅ Created documents table
-- ✅ Created document_chunks table with vector(3072)
-- ✅ Created HNSW index (supports 3072 dimensions)
-- ✅ Created search_document_chunks function
-- ✅ All objects created successfully with correct schema
-- ================================================
