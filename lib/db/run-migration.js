#!/usr/bin/env node

/**
 * Database Migration Runner
 * Executes SQL migration files against the Render PostgreSQL database
 *
 * Usage: node lib/db/run-migration.js [migration-file]
 * Example: node lib/db/run-migration.js lib/db/migrations/002_add_lisa_tables.sql
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function runMigration(migrationFile) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('🔌 Connecting to database...')
    await client.connect()
    console.log('✅ Connected to database')

    console.log(`📄 Reading migration file: ${migrationFile}`)
    const migrationPath = path.resolve(process.cwd(), migrationFile)

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`)
    }

    const sql = fs.readFileSync(migrationPath, 'utf8')
    console.log(`✅ Migration file loaded (${sql.length} characters)`)

    console.log('🚀 Executing migration...')
    console.log('─'.repeat(60))

    const result = await client.query(sql)

    console.log('─'.repeat(60))
    console.log('✅ Migration executed successfully!')

    if (result.length > 0) {
      console.log(`📊 ${result.length} statements executed`)
    }

    // Verify tables were created
    console.log('\n📋 Verifying tables...')
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('documents', 'document_chunks')
      ORDER BY table_name
    `)

    if (tables.rows.length > 0) {
      console.log('✅ Tables verified:')
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`)
      })
    }

    // Verify pgvector extension
    const extensions = await client.query(`
      SELECT extname, extversion
      FROM pg_extension
      WHERE extname = 'vector'
    `)

    if (extensions.rows.length > 0) {
      console.log(`✅ pgvector extension: v${extensions.rows[0].extversion}`)
    }

    // Check conversations table for agent_type column
    const columns = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'conversations'
      AND column_name = 'agent_type'
    `)

    if (columns.rows.length > 0) {
      console.log('✅ conversations.agent_type column added')
    }

    console.log('\n🎉 Migration completed successfully!')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    if (error.detail) {
      console.error('📝 Details:', error.detail)
    }
    if (error.hint) {
      console.error('💡 Hint:', error.hint)
    }
    process.exit(1)
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2]

if (!migrationFile) {
  console.error('❌ Usage: node lib/db/run-migration.js <migration-file>')
  console.error('Example: node lib/db/run-migration.js lib/db/migrations/002_add_lisa_tables.sql')
  process.exit(1)
}

runMigration(migrationFile)
