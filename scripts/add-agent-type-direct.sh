#!/bin/bash
# Direct SQL script to add agent_type column
# This bypasses Prisma migrations entirely

set -e

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set"
  exit 1
fi

echo "🔧 Adding agent_type column directly via SQL..."

# Use psql to run the SQL directly
psql "$DATABASE_URL" -f scripts/add-agent-type-direct.sql

echo "✅ Done! agent_type column should now exist."

