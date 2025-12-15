#!/bin/bash
# Start script - migrations should run during build phase

set -e

echo "🚀 Starting Next.js server..."
echo "📍 PORT: ${PORT:-3000}"
echo "📍 NODE_ENV: ${NODE_ENV:-production}"

# Check if standalone server exists
if [ -f ".next/standalone/server.js" ]; then
  echo "✅ Using standalone server"
  # Use standalone server (for production)
  # PORT is automatically used by Next.js standalone
  exec node .next/standalone/server.js
else
  echo "⚠️  Standalone server not found, using next start"
  # Fallback to next start (for development)
  # PORT environment variable is automatically used
  exec next start
fi

