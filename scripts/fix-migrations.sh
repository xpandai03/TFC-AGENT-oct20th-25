#!/bin/bash
# ================================================
# Fix Failed Migrations Script
# Marks failed migration as rolled-back so Prisma can proceed
# ================================================

echo "🔧 Checking for failed migrations..."

# Mark the failed migration as rolled back
# This tells Prisma: "this migration was intentionally rolled back, ignore it"
npx prisma migrate resolve --rolled-back 20251023103000_add_lisa_rag_tables 2>/dev/null || echo "Migration already resolved or doesn't exist"

echo "✅ Failed migrations marked as resolved"
echo "📦 Proceeding with normal migrations..."
