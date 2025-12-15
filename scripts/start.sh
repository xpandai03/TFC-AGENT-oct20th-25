#!/bin/bash
# Start script that runs migrations before starting the server

echo "🚀 Starting application..."

# Run migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "🗄️  Running database migrations..."
  npx prisma migrate deploy || {
    echo "⚠️  Migration failed, but continuing..."
  }
else
  echo "⚠️  DATABASE_URL not set, skipping migrations"
fi

# Start the Next.js server
echo "🌐 Starting Next.js server..."
if [ -f ".next/standalone/server.js" ]; then
  # Use standalone server if available
  node .next/standalone/server.js
else
  # Fallback to next start
  next start
fi

