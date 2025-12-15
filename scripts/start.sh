#!/bin/bash
# Start script - migrations should run during build phase

echo "🚀 Starting Next.js server..."
echo "📍 PORT: ${PORT:-3000}"

# Start the Next.js server
# Note: Migrations run during build phase (see scripts/build.sh)
# Railway sets PORT automatically, Next.js standalone will use it
if [ -f ".next/standalone/server.js" ]; then
  # Use standalone server if available (for production)
  # PORT is automatically used by Next.js standalone
  node .next/standalone/server.js
else
  # Fallback to next start (for development)
  # PORT environment variable is automatically used
  next start
fi

