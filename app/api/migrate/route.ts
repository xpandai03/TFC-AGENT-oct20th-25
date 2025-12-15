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
    return NextResponse.json({
      success: false,
      error: error.message,
      output: error.stdout?.toString() || error.stderr?.toString(),
    }, { status: 500 })
  }
}

