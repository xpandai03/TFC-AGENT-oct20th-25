#!/bin/bash
set -e

echo "🔨 Starting build process..."

# Step 1: Generate Prisma Client (doesn't need DATABASE_URL)
echo "📦 Generating Prisma Client..."
npx prisma generate

# Step 2: Fix failed migrations (if any)
echo "🔧 Checking for failed migrations..."
bash scripts/fix-migrations.sh || true

# Step 3: Run migrations only if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "🗄️  Running database migrations..."
  npx prisma migrate deploy || {
    echo "⚠️  Migration failed, but continuing build..."
    echo "   You may need to run migrations manually after deployment"
  }
else
  echo "⚠️  Skipping migrations - DATABASE_URL not set"
  echo "   Migrations should be run separately after deployment"
fi

# Step 4: Build Next.js app
echo "🏗️  Building Next.js application..."
next build

# Step 5: Copy static files for standalone output
echo "📋 Copying static files..."
cp -r public .next/standalone/ 2>/dev/null || true
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true

echo "✅ Build completed successfully!"

