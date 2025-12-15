#!/bin/bash
# ================================================
# Fix Failed Migrations Script
# Marks failed migrations as rolled-back so Prisma can proceed
# ================================================

echo "🔧 Checking for failed migrations..."

# List of migrations that might have failed
# Mark them as rolled-back so Prisma can retry them
MIGRATIONS=(
  "20251023103000_add_lisa_rag_tables"
  "20251023115000_add_lisa_rag_system"
)

for migration in "${MIGRATIONS[@]}"; do
  echo "  Checking migration: $migration"
  npx prisma migrate resolve --rolled-back "$migration" 2>/dev/null && echo "    ✅ Resolved: $migration" || echo "    ℹ️  $migration: already resolved or doesn't exist"
done

echo "✅ Failed migrations check completed"
echo "📦 Proceeding with normal migrations..."
