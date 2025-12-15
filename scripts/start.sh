#!/bin/bash
# Simple start script - migrations run during build phase

echo "🚀 Starting Next.js server..."

# Start Next.js server
# Migrations are handled during build (see scripts/build.sh)
# Railway sets PORT automatically
next start

