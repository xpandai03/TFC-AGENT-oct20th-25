#!/bin/bash
# ================================================
# Fix Failed Migrations Script
# Marks failed migrations as applied so Prisma can skip them
# ================================================

echo "🔧 Checking for failed migrations..."

# List of migrations that might have failed
# Mark them as APPLIED (not rolled-back) so Prisma skips them entirely
# This is necessary when migrations fail due to external dependencies (like pgvector)
MIGRATIONS=(
  "20251023103000_add_lisa_rag_tables"
  "20251023115000_add_lisa_rag_system"
)

for migration in "${MIGRATIONS[@]}"; do
  echo "  Checking migration: $migration"
  # Try to mark as applied first (tells Prisma "this is done, skip it")
  npx prisma migrate resolve --applied "$migration" 2>/dev/null && echo "    ✅ Marked as applied: $migration" || {
    # If that fails, try rolled-back as fallback
    npx prisma migrate resolve --rolled-back "$migration" 2>/dev/null && echo "    ✅ Marked as rolled-back: $migration" || echo "    ℹ️  $migration: already resolved or doesn't exist"
  }
done

echo "✅ Failed migrations check completed"
echo "📦 Proceeding with normal migrations..."
