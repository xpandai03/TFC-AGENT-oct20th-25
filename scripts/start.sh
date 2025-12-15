#!/bin/bash
# Start script that ensures migrations are run

echo "🚀 Starting application..."

# Run migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "🔧 Checking for failed migrations first..."
  # Fix any failed migrations before attempting to deploy
  bash scripts/fix-migrations.sh || true
  
  echo "🗄️  Ensuring database migrations are applied..."
  # Run migrations - this will skip any that were marked as applied
  npx prisma migrate deploy || {
    echo "⚠️  Migration deploy failed, attempting to resolve and retry..."
    # If deploy fails, try to resolve failed migrations again
    bash scripts/fix-migrations.sh || true
    # Retry once more
    npx prisma migrate deploy || {
      echo "⚠️  Migration retry failed"
      echo "🔧 Attempting direct SQL fix for agent_type column..."
      # Last resort: add agent_type column directly via SQL
      if command -v psql &> /dev/null; then
        psql "$DATABASE_URL" -f scripts/add-agent-type-direct.sql || echo "⚠️  Direct SQL also failed"
      else
        echo "⚠️  psql not available, cannot run direct SQL"
      fi
    }
  }
else
  echo "⚠️  DATABASE_URL not set, skipping migrations"
fi

# Start Next.js server
echo "🌐 Starting Next.js server..."
# Railway sets PORT automatically
next start

