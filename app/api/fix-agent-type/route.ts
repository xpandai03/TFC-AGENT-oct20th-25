/**
 * Direct Fix Endpoint for agent_type column
 * Bypasses Prisma migrations and directly adds the column via SQL
 */

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  // Simple security check
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.MIGRATION_SECRET || '94b89d0e4dfdc1b70213c971c47004c5'
  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('🔧 Adding agent_type column directly via SQL...')

    // Check if column already exists
    const checkResult = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'conversations' AND column_name = 'agent_type'
      ) as exists;
    `)

    if (checkResult[0]?.exists) {
      console.log('ℹ️  agent_type column already exists')
      await prisma.$disconnect()
      return NextResponse.json({
        success: true,
        message: 'agent_type column already exists',
        alreadyExists: true,
      })
    }

    // Add the column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "conversations" ADD COLUMN "agent_type" VARCHAR(50) DEFAULT 'dawn';
    `)

    // Create index
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "conversations_agent_type_idx" ON "conversations"("agent_type");
    `)

    // Verify it was added
    const verifyResult = await prisma.$queryRawUnsafe<Array<{ column_name: string; data_type: string; column_default: string }>>(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'conversations' AND column_name = 'agent_type';
    `)

    await prisma.$disconnect()

    console.log('✅ agent_type column added successfully:', verifyResult[0])

    return NextResponse.json({
      success: true,
      message: 'agent_type column added successfully',
      column: verifyResult[0],
    })
  } catch (error: any) {
    console.error('❌ Direct SQL fix failed:', error)
    await prisma.$disconnect().catch(() => {})
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}

