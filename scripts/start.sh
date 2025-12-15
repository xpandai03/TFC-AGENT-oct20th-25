#!/bin/bash
# Start script that runs migrations in background and starts server

echo "🚀 Starting application..."

# Run migrations in background if DATABASE_URL is set (non-blocking)
if [ -n "$DATABASE_URL" ]; then
  echo "🗄️  Running database migrations in background..."
  (npx prisma migrate deploy || echo "⚠️  Migration failed") &
else
  echo "⚠️  DATABASE_URL not set, skipping migrations"
fi

# Start the Next.js server immediately (don't wait for migrations)
echo "🌐 Starting Next.js server..."
if [ -f ".next/standalone/server.js" ]; then
  # Use standalone server if available
  node .next/standalone/server.js
else
  # Fallback to next start
  next start
fi

