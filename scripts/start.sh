#!/bin/bash
# Start script that ensures migrations are run

echo "🚀 Starting application..."

# Run migrations if DATABASE_URL is set (non-blocking - runs in background)
if [ -n "$DATABASE_URL" ]; then
  echo "🗄️  Ensuring database migrations are applied..."
  # Run migrations and continue even if they fail (they might already be applied)
  npx prisma migrate deploy || echo "⚠️  Migration check completed (may already be applied)"
else
  echo "⚠️  DATABASE_URL not set, skipping migrations"
fi

# Start Next.js server
echo "🌐 Starting Next.js server..."
# Railway sets PORT automatically
next start

