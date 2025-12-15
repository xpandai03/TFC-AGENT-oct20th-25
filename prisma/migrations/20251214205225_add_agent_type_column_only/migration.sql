-- ================================================
-- Migration: Add agent_type column only
-- Date: 2025-12-14
-- Purpose: Add agent_type column to conversations table without vector dependencies
-- ================================================
-- This migration is independent and does not require pgvector extension
-- It can run successfully on Railway PostgreSQL
-- ================================================

-- Add agent_type column to conversations table
-- Allows differentiating between D.A.W.N. and LISA conversations
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
    RAISE NOTICE 'agent_type column already exists, skipping';
  END IF;
END $$;

-- Create index for agent_type lookups (if it doesn't exist)
CREATE INDEX IF NOT EXISTS "conversations_agent_type_idx" ON "conversations"("agent_type");

-- ================================================
-- Migration Complete
-- ================================================
-- ✅ Added agent_type column (default: 'dawn')
-- ✅ Created index for agent_type lookups
-- ✅ No external dependencies required
-- ✅ Works on any PostgreSQL instance

