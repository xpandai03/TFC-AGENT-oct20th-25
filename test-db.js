// Test database connection using Prisma Client
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...')

    // Try to query users table
    const users = await prisma.user.findMany()
    console.log('✅ Database connection successful!')
    console.log(`📊 Found ${users.length} users in database`)

    // Try to query conversations table
    const conversations = await prisma.conversation.findMany()
    console.log(`📊 Found ${conversations.length} conversations in database`)

    console.log('\n✅ All tests passed! Prisma is ready to use.')

  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
