-- Direct SQL to add agent_type column
-- This bypasses Prisma migrations and directly modifies the database
-- Use this if migrations are blocked by failed migrations

-- Add agent_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'agent_type'
  ) THEN
    ALTER TABLE "conversations" ADD COLUMN "agent_type" VARCHAR(50) DEFAULT 'dawn';
    RAISE NOTICE '✅ Added agent_type column to conversations table';
  ELSE
    RAISE NOTICE 'ℹ️  agent_type column already exists';
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS "conversations_agent_type_idx" ON "conversations"("agent_type");

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'conversations' AND column_name = 'agent_type';

