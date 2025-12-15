/**
 * Migration Endpoint
 * One-time endpoint to run database migrations
 * Should be protected in production - remove after migrations are complete
 */

import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Simple security check - you can remove this after migrations are done
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.MIGRATION_SECRET || '94b89d0e4dfdc1b70213c971c47004c5'
  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { execSync } = require('child_process')
    
    // Step 1: Resolve any failed migrations first
    console.log('🔧 Resolving failed migrations...')
    try {
      execSync('bash scripts/fix-migrations.sh', {
        encoding: 'utf-8',
        env: process.env,
        stdio: 'pipe',
      })
    } catch (fixError: any) {
      console.log('⚠️  Fix migrations script completed (may have warnings):', fixError.message)
    }
    
    // Step 2: Run migrations
    console.log('🔄 Running database migrations...')
    const output = execSync('npx prisma migrate deploy', {
      encoding: 'utf-8',
      env: process.env,
    })
    
    console.log('✅ Migrations completed:', output)
    
    return NextResponse.json({
      success: true,
      message: 'Migrations completed successfully',
      output: output,
    })
  } catch (error: any) {
    console.error('❌ Migration failed:', error)
    
    // Try to resolve failed migrations and retry once
    try {
      console.log('🔄 Attempting to resolve and retry...')
      execSync('bash scripts/fix-migrations.sh', {
        encoding: 'utf-8',
        env: process.env,
        stdio: 'pipe',
      })
      const retryOutput = execSync('npx prisma migrate deploy', {
        encoding: 'utf-8',
        env: process.env,
      })
      console.log('✅ Retry successful:', retryOutput)
      return NextResponse.json({
        success: true,
        message: 'Migrations completed after retry',
        output: retryOutput,
      })
    } catch (retryError: any) {
      // Last resort: try direct SQL fix
      console.log('🔧 Attempting direct SQL fix for agent_type column...')
      try {
        const { PrismaClient } = require('@prisma/client')
        const prisma = new PrismaClient()
        
        // Run direct SQL to add agent_type column
        await prisma.$executeRawUnsafe(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'conversations' AND column_name = 'agent_type'
            ) THEN
              ALTER TABLE "conversations" ADD COLUMN "agent_type" VARCHAR(50) DEFAULT 'dawn';
            END IF;
          END $$;
        `)
        
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "conversations_agent_type_idx" ON "conversations"("agent_type");
        `)
        
        await prisma.$disconnect()
        
        console.log('✅ Direct SQL fix successful - agent_type column added')
        return NextResponse.json({
          success: true,
          message: 'Migrations failed but direct SQL fix applied successfully',
          note: 'agent_type column has been added directly via SQL',
        })
      } catch (sqlError: any) {
        return NextResponse.json({
          success: false,
          error: error.message,
          retryError: retryError.message,
          sqlError: sqlError.message,
          output: error.stdout?.toString() || error.stderr?.toString(),
          retryOutput: retryError.stdout?.toString() || retryError.stderr?.toString(),
        }, { status: 500 })
      }
    }
  }
}

