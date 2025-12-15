#!/bin/bash
# Start script - migrations should run during build phase

echo "🚀 Starting Next.js server..."

# Start the Next.js server
# Note: Migrations run during build phase (see scripts/build.sh)
if [ -f ".next/standalone/server.js" ]; then
  # Use standalone server if available (for production)
  node .next/standalone/server.js
else
  # Fallback to next start (for development)
  next start
fi

