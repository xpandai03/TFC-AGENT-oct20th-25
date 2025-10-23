-- ================================================
-- Migration: Fix Vector Index - Use HNSW Instead of IVFFlat
-- Date: 2025-10-23
-- Purpose: Replace IVFFlat index with HNSW for high-dimensional embeddings
-- ================================================

-- IVFFlat has a 2000-dimension limit, but text-embedding-3-large produces 3072 dimensions
-- HNSW (Hierarchical Navigable Small World) supports unlimited dimensions and is also faster

-- Drop the old IVFFlat index if it exists (it may have been partially created)
DROP INDEX IF EXISTS "document_chunks_embedding_idx";

-- Create HNSW index for vector similarity search
-- m = 16: Number of bidirectional links per node (higher = better recall, more memory)
-- ef_construction = 64: Size of dynamic candidate list during construction (higher = better quality)
CREATE INDEX "document_chunks_embedding_idx"
ON "document_chunks"
USING hnsw ("embedding" vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ================================================
-- Migration Complete
-- ================================================
-- HNSW index created successfully
-- Supports 3072-dimension embeddings from text-embedding-3-large
-- Faster and more memory-efficient than IVFFlat for this use case
-- ================================================
