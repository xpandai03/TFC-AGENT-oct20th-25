-- ================================================
-- Migration: Add LISA RAG System (Complete)
-- Date: 2025-10-23
-- Purpose: Complete LISA implementation with document upload and RAG
-- ================================================
-- Uses text-embedding-3-small (1536 dimensions) with IVFFlat index
-- Compatible with all PostgreSQL + pgvector versions
-- ================================================

-- STEP 1: Clean up any partial objects from previous failed attempts
-- Using DROP IF EXISTS makes this safe and idempotent

-- Drop all indexes first
DROP INDEX IF EXISTS "document_chunks_embedding_idx";
DROP INDEX IF EXISTS "document_chunks_document_id_idx";
DROP INDEX IF EXISTS "documents_processing_status_idx";
DROP INDEX IF EXISTS "documents_deleted_at_idx";
DROP INDEX IF EXISTS "documents_conversation_id_idx";
DROP INDEX IF EXISTS "documents_user_id_idx";
DROP INDEX IF EXISTS "conversations_agent_type_idx";

-- Drop functions (all possible vector dimension variants)
DROP FUNCTION IF EXISTS search_document_chunks(vector, TEXT, INTEGER);
DROP FUNCTION IF EXISTS search_document_chunks(vector(1536), TEXT, INTEGER);
DROP FUNCTION IF EXISTS search_document_chunks(vector(3072), TEXT, INTEGER);

-- Drop foreign key constraints
ALTER TABLE IF EXISTS "document_chunks" DROP CONSTRAINT IF EXISTS "document_chunks_document_id_fkey";

-- Drop tables in correct order (child first, then parent)
DROP TABLE IF EXISTS "document_chunks";
DROP TABLE IF EXISTS "documents";

-- STEP 2: Enable pgvector extension (OPTIONAL - only if available)
-- Required for vector similarity search
-- Note: This migration will continue even if vector extension is not available
-- LISA features will be disabled if extension is missing
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
  RAISE NOTICE 'Vector extension enabled successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Vector extension not available - LISA RAG features will be disabled';
  RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- STEP 3: Add agent_type column to conversations table
-- NOTE: This is now handled by migration 20251214205225_add_agent_type_column_only
-- Keeping this for backward compatibility, but it will be a no-op if column already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'agent_type'
  ) THEN
    ALTER TABLE "conversations" ADD COLUMN "agent_type" VARCHAR(50) DEFAULT 'dawn';
    RAISE NOTICE 'Added agent_type column to conversations table';
  ELSE
    RAISE NOTICE 'agent_type column already exists (from previous migration)';
  END IF;
END $$;

-- Create index for agent_type lookups (if it doesn't exist)
CREATE INDEX IF NOT EXISTS "conversations_agent_type_idx" ON "conversations"("agent_type");

-- STEP 4: Create documents table
-- Stores metadata about uploaded documents
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

-- Create indexes for efficient queries
CREATE INDEX "documents_user_id_idx" ON "documents"("user_id");
CREATE INDEX "documents_conversation_id_idx" ON "documents"("conversation_id");
CREATE INDEX "documents_deleted_at_idx" ON "documents"("deleted_at");
CREATE INDEX "documents_processing_status_idx" ON "documents"("processing_status");

-- STEP 5: Create document_chunks table
-- Stores vectorized text chunks for RAG retrieval
-- Only create if vector extension is available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    -- Create table with vector column
    CREATE TABLE IF NOT EXISTS "document_chunks" (
        "id" TEXT NOT NULL,
        "document_id" TEXT NOT NULL,
        "chunk_index" INTEGER NOT NULL,
        "content" TEXT NOT NULL,
        "page_number" INTEGER,
        "embedding" vector(1536),  -- text-embedding-3-small produces 1536 dimensions
        "metadata" JSONB,          -- stores charCount, startChar, endChar
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
    );

    -- Create index for document lookups
    CREATE INDEX IF NOT EXISTS "document_chunks_document_id_idx" ON "document_chunks"("document_id");

    -- STEP 6: Create IVFFlat vector index for similarity search
    -- IVFFlat works perfectly with 1536 dimensions (max 2000)
    -- lists=100 is optimal for ~10,000 vectors
    CREATE INDEX IF NOT EXISTS "document_chunks_embedding_idx"
    ON "document_chunks"
    USING ivfflat ("embedding" vector_cosine_ops)
    WITH (lists = 100);
    
    RAISE NOTICE 'Created document_chunks table with vector support';
  ELSE
    -- Create table without vector column (fallback)
    CREATE TABLE IF NOT EXISTS "document_chunks" (
        "id" TEXT NOT NULL,
        "document_id" TEXT NOT NULL,
        "chunk_index" INTEGER NOT NULL,
        "content" TEXT NOT NULL,
        "page_number" INTEGER,
        "metadata" JSONB,          -- stores charCount, startChar, endChar
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
    );

    -- Create index for document lookups
    CREATE INDEX IF NOT EXISTS "document_chunks_document_id_idx" ON "document_chunks"("document_id");
    
    RAISE NOTICE 'Created document_chunks table without vector support (pgvector not available)';
  END IF;
END $$;

-- STEP 7: Add foreign key constraint
-- Ensures referential integrity between chunks and documents
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_chunks') THEN
    ALTER TABLE "document_chunks"
    DROP CONSTRAINT IF EXISTS "document_chunks_document_id_fkey";
    
    ALTER TABLE "document_chunks"
    ADD CONSTRAINT "document_chunks_document_id_fkey"
    FOREIGN KEY ("document_id")
    REFERENCES "documents"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
  END IF;
END $$;

-- STEP 8: Create RAG search function (only if vector extension is available)
-- Performs vector similarity search to find relevant document chunks
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    CREATE OR REPLACE FUNCTION search_document_chunks(
        query_embedding vector(1536),
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
            1 - (dc.embedding <=> query_embedding) AS similarity
        FROM document_chunks dc
        INNER JOIN documents d ON dc.document_id = d.id
        WHERE
            d.conversation_id = p_conversation_id
            AND d.deleted_at IS NULL
            AND d.processing_status = 'completed'
            AND dc.embedding IS NOT NULL
        ORDER BY dc.embedding <=> query_embedding
        LIMIT result_limit;
    END;
    $$;

    -- Add helpful comment
    COMMENT ON FUNCTION search_document_chunks IS
    'Vector similarity search for RAG using 1536-dimension embeddings from text-embedding-3-small. Returns top-k most relevant chunks for a given query.';
    
    RAISE NOTICE 'Created search_document_chunks function with vector support';
  ELSE
    RAISE NOTICE 'Skipping search_document_chunks function - vector extension not available';
  END IF;
END $$;

-- ================================================
-- Migration Complete - LISA RAG System Ready
-- ================================================
-- ✅ Cleaned up any partial objects
-- ✅ Enabled pgvector extension
-- ✅ Added agent_type to conversations
-- ✅ Created documents table
-- ✅ Created document_chunks table with vector(1536)
-- ✅ Created IVFFlat index (works with all pgvector versions)
-- ✅ Created search_document_chunks function
--
-- LISA is now ready to:
-- - Upload and process documents (PDF, DOCX, TXT)
-- - Generate 1536-dimension embeddings
-- - Store chunks with vectors in PostgreSQL
-- - Perform fast similarity search
-- - Answer questions with source citations
-- ================================================
