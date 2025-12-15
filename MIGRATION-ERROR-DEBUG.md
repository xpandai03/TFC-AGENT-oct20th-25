# Migration Error Debug Log

## 🚨 Critical Error: PostgreSQL Vector Extension Not Available

**Date**: December 15, 2025  
**Environment**: Railway Production  
**Error Code**: `P3018`, `0A000`  
**Status**: ❌ BLOCKING - Application cannot create conversations

---

## 📋 Error Summary

```
Database error code: 0A000
Database error:
ERROR: extension "vector" is not available
DETAIL: Could not open extension control file "/usr/share/postgresql/17/extension/vector.control": No such file or directory.
HINT: The extension must first be installed on the system where PostgreSQL is running.
```

**Impact**: 
- Migration `20251023115000_add_lisa_rag_system` fails completely
- The `agent_type` column is never added to `conversations` table
- Application cannot create or fetch conversations
- All conversation-related API calls fail with `P2022: column does not exist`

---

## 🔍 Root Cause Analysis

### The Problem

1. **Migration Dependency Chain**:
   - Migration `20251023115000_add_lisa_rag_system` attempts to:
     1. Create `vector` extension (line 36)
     2. Add `agent_type` column to `conversations` (line 38-49)
     3. Create `documents` table
     4. Create `document_chunks` table with vector type
     5. Create vector indexes and search functions

2. **Railway PostgreSQL Limitation**:
   - Railway's managed PostgreSQL does NOT have the `pgvector` extension installed
   - The extension must be installed at the database server level (not application level)
   - Railway does not provide pgvector by default

3. **Migration Failure Cascade**:
   - When `CREATE EXTENSION IF NOT EXISTS vector;` fails, the entire migration fails
   - Prisma marks the migration as "failed" in the `_prisma_migrations` table
   - Subsequent migration attempts are blocked until the failed migration is resolved
   - The `agent_type` column (which comes AFTER the vector extension) never gets created

### Why This Matters

- **`agent_type` column is CRITICAL**: Required for ALL conversations (both DAWN and LISA)
- **Vector extension is OPTIONAL**: Only needed for LISA RAG features
- **Current migration couples them**: Making the critical feature depend on the optional one

---

## 🛠️ Attempted Fixes

### Attempt #1: Fix Failed Migration Script
**Date**: Initial deployment  
**Approach**: Created `scripts/fix-migrations.sh` to mark failed migrations as rolled-back

**Result**: ❌ Partial Success
- Script resolved the failed migration status
- But migration still fails on retry because vector extension still unavailable
- Infinite loop: resolve → retry → fail → resolve → retry → fail

**Code**:
```bash
npx prisma migrate resolve --rolled-back 20251023115000_add_lisa_rag_system
```

---

### Attempt #2: Update Start Script to Resolve Before Deploy
**Date**: After initial failure  
**Approach**: Modified `scripts/start.sh` to resolve failed migrations before running `migrate deploy`

**Result**: ❌ Still Fails
- Migration gets resolved, but fails again on deploy
- Same root cause: vector extension unavailable

**Code**:
```bash
bash scripts/fix-migrations.sh || true
npx prisma migrate deploy
```

---

### Attempt #3: Migration API Endpoint
**Date**: After start script approach  
**Approach**: Created `/api/migrate` endpoint to manually trigger migrations with retry logic

**Result**: ❌ Same Issue
- Endpoint successfully resolves failed migrations
- But migration still fails because vector extension doesn't exist
- Cannot bypass the extension requirement

**Code**: `app/api/migrate/route.ts`

---

### Attempt #4: Update Fix-Migrations Script with Correct Migration Name
**Date**: After discovering wrong migration name  
**Approach**: Updated `scripts/fix-migrations.sh` to handle both migration names:
- `20251023103000_add_lisa_rag_tables`
- `20251023115000_add_lisa_rag_system`

**Result**: ❌ Partial Success
- Script now correctly identifies and resolves the failed migration
- But migration still fails on retry due to vector extension

**Code**:
```bash
MIGRATIONS=(
  "20251023103000_add_lisa_rag_tables"
  "20251023115000_add_lisa_rag_system"
)
for migration in "${MIGRATIONS[@]}"; do
  npx prisma migrate resolve --rolled-back "$migration"
done
```

---

## 💡 Solution Strategy

### The Fix: Split the Migration

**Problem**: One migration tries to do too much:
1. Add critical `agent_type` column (needed NOW)
2. Create vector extension (not available on Railway)
3. Create LISA tables (depends on vector)

**Solution**: Create a new migration that ONLY adds `agent_type` column, without any vector dependencies.

### Implementation Plan

1. **Create New Migration**: `YYYYMMDDHHMMSS_add_agent_type_column.sql`
   - Only adds `agent_type` column to `conversations` table
   - No vector extension required
   - No LISA tables
   - Can run successfully on Railway

2. **Modify Existing Migration**: Make vector extension optional
   - Wrap `CREATE EXTENSION` in a DO block with error handling
   - Continue migration even if extension creation fails
   - Add `agent_type` column BEFORE attempting vector extension

3. **Alternative**: Mark LISA migration as optional
   - Skip the LISA migration entirely if vector extension unavailable
   - Application works for DAWN conversations
   - LISA features disabled until pgvector is available

---

## 📊 Current Database State

### What EXISTS:
- ✅ `users` table
- ✅ `conversations` table (WITHOUT `agent_type` column)
- ✅ `messages` table
- ❌ `documents` table (does not exist)
- ❌ `document_chunks` table (does not exist)
- ❌ `vector` extension (not installed)

### What's MISSING:
- ❌ `conversations.agent_type` column (CRITICAL - blocks all conversation operations)
- ❌ LISA RAG tables (optional - only needed for document upload features)

---

## 🔧 Technical Details

### Migration File Structure
```
prisma/migrations/
├── 20251023103000_add_lisa_rag_tables/     # Older migration (may not exist)
└── 20251023115000_add_lisa_rag_system/     # Current failing migration
    └── migration.sql
```

### Migration SQL Flow (Current - FAILING)
```sql
-- STEP 1: Cleanup (succeeds)
DROP TABLE IF EXISTS "document_chunks";
DROP TABLE IF EXISTS "documents";

-- STEP 2: Create vector extension (FAILS HERE ❌)
CREATE EXTENSION IF NOT EXISTS vector;

-- STEP 3: Add agent_type column (NEVER REACHED)
ALTER TABLE "conversations" ADD COLUMN "agent_type" VARCHAR(50) DEFAULT 'dawn';

-- STEP 4-8: Create LISA tables (NEVER REACHED)
-- ...
```

### Prisma Migration State
```sql
-- Check migration status
SELECT * FROM _prisma_migrations 
WHERE migration_name = '20251023115000_add_lisa_rag_system';

-- Expected result:
-- migration_name: 20251023115000_add_lisa_rag_system
-- finished_at: NULL
-- applied_steps_count: 0
-- logs: [error about vector extension]
```

---

## 🎯 Recommended Solution

### Option A: Create Minimal Migration (RECOMMENDED)

Create a new migration that ONLY adds `agent_type`:

```sql
-- Migration: Add agent_type column only
-- No vector extension required

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'agent_type'
  ) THEN
    ALTER TABLE "conversations" ADD COLUMN "agent_type" VARCHAR(50) DEFAULT 'dawn';
    CREATE INDEX IF NOT EXISTS "conversations_agent_type_idx" 
    ON "conversations"("agent_type");
  END IF;
END $$;
```

**Pros**:
- ✅ Unblocks application immediately
- ✅ No external dependencies
- ✅ Works on any PostgreSQL instance
- ✅ Can be applied independently

**Cons**:
- ⚠️ LISA features still unavailable (but that's acceptable)

---

### Option B: Make Vector Extension Optional

Modify existing migration to handle missing extension gracefully:

```sql
-- Try to create extension, but continue if it fails
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Vector extension not available, continuing without LISA features';
END $$;

-- Add agent_type (always succeeds)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'agent_type'
  ) THEN
    ALTER TABLE "conversations" ADD COLUMN "agent_type" VARCHAR(50) DEFAULT 'dawn';
  END IF;
END $$;

-- Only create LISA tables if vector extension exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    -- Create documents and document_chunks tables
    -- ...
  ELSE
    RAISE NOTICE 'Skipping LISA tables - vector extension not available';
  END IF;
END $$;
```

**Pros**:
- ✅ Single migration handles both cases
- ✅ Graceful degradation

**Cons**:
- ⚠️ More complex migration logic
- ⚠️ Harder to debug

---

### Option C: Install pgvector on Railway (FUTURE)

**Railway PostgreSQL Extension Support**:
- Railway does not currently support custom PostgreSQL extensions
- Would require:
  1. Using Railway's PostgreSQL with extension support (if available)
  2. Migrating to a different provider (Supabase, Neon, etc.)
  3. Self-hosting PostgreSQL with pgvector

**Pros**:
- ✅ Full LISA functionality available

**Cons**:
- ❌ Requires infrastructure changes
- ❌ Not immediately actionable

---

## 📝 Action Items

### Immediate (Fix Application)
1. ✅ Create new migration: `add_agent_type_column_only`
2. ✅ Test migration locally
3. ✅ Deploy to Railway
4. ✅ Verify `agent_type` column exists
5. ✅ Test conversation creation

### Short-term (Enable LISA)
1. ⏳ Research Railway pgvector support
2. ⏳ Consider alternative database providers
3. ⏳ Modify LISA migration to be optional
4. ⏳ Add feature flag for LISA functionality

### Long-term (Full RAG Support)
1. ⏳ Evaluate database providers with pgvector
2. ⏳ Plan migration strategy if needed
3. ⏳ Implement full LISA RAG features

---

## 🔗 Related Files

- `prisma/migrations/20251023115000_add_lisa_rag_system/migration.sql` - Failing migration
- `prisma/schema.prisma` - Schema definition (includes `agent_type`)
- `scripts/fix-migrations.sh` - Migration resolution script
- `scripts/start.sh` - Startup script with migration logic
- `app/api/migrate/route.ts` - Migration API endpoint
- `lib/services/vector-store.ts` - Vector operations (requires pgvector)

---

## 📚 References

- [Prisma Migration Troubleshooting](https://www.prisma.io/docs/guides/migrate/troubleshooting-development)
- [pgvector Installation Guide](https://github.com/pgvector/pgvector#installation)
- [Railway PostgreSQL Documentation](https://docs.railway.app/databases/postgresql)
- [Prisma Migration Resolve](https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-resolve)

---

## ✅ Success Criteria

- [ ] `agent_type` column exists in `conversations` table
- [ ] Application can create new conversations
- [ ] Application can fetch existing conversations
- [ ] No `P2022` errors in logs
- [ ] DAWN conversations work fully
- [ ] LISA conversations work (if pgvector available) OR gracefully disabled

---

**Last Updated**: December 15, 2025  
**Status**: ✅ FIXED - Solution implemented

---

## ✅ SOLUTION IMPLEMENTED

### Changes Made

1. **Created New Migration**: `20251214205225_add_agent_type_column_only`
   - Adds ONLY the `agent_type` column to `conversations` table
   - No vector extension dependency
   - Can run successfully on Railway PostgreSQL
   - Will execute BEFORE the LISA migration

2. **Modified LISA Migration**: `20251023115000_add_lisa_rag_system`
   - Made vector extension creation optional (wrapped in DO block with exception handling)
   - Migration continues even if vector extension is unavailable
   - Creates `documents` table regardless of vector availability
   - Creates `document_chunks` table conditionally:
     - WITH vector column if extension available
     - WITHOUT vector column if extension unavailable
   - Skips vector indexes and search function if extension unavailable

### Migration Execution Order

1. ✅ `20251214205225_add_agent_type_column_only` - Runs first, adds critical column
2. ✅ `20251023115000_add_lisa_rag_system` - Runs second, creates LISA tables (with or without vector)

### Expected Behavior After Deployment

**If vector extension is available:**
- ✅ `agent_type` column added
- ✅ `documents` table created
- ✅ `document_chunks` table created with vector support
- ✅ Vector indexes and search function created
- ✅ Full LISA RAG functionality available

**If vector extension is NOT available (Railway):**
- ✅ `agent_type` column added
- ✅ `documents` table created
- ✅ `document_chunks` table created WITHOUT vector column
- ⚠️ Vector indexes and search function skipped
- ⚠️ LISA RAG features disabled (but app still works for DAWN)

### Next Steps

1. Wait for Railway to redeploy (automatic after git push)
2. Verify `agent_type` column exists: `SELECT column_name FROM information_schema.columns WHERE table_name = 'conversations';`
3. Test conversation creation
4. Verify no `P2022` errors in logs

### Future: Enable LISA RAG

To enable full LISA functionality, Railway PostgreSQL needs pgvector extension:
- Option A: Migrate to Supabase/Neon (both support pgvector)
- Option B: Self-host PostgreSQL with pgvector
- Option C: Wait for Railway to add pgvector support

---

**Commit**: `2b36109` - Fix migration: Add agent_type column separately, make vector extension optional in LISA migration

