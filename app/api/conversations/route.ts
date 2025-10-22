import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getConversationsForUser } from '@/lib/db/conversations'

/**
 * GET /api/conversations
 * Fetch all conversations for the authenticated user
 */
export async function GET(request: Request) {
  try {
    // 1. Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const userEmail = session.user.email
    console.log('📂 Fetching conversations for:', userEmail)

    // 2. Fetch conversations from database
    const conversations = await getConversationsForUser(userEmail)

    console.log(`✅ Found ${conversations.length} conversations`)

    // 3. Return data
    return NextResponse.json({
      conversations,
      userEmail, // For debugging
    })

  } catch (error) {
    console.error('❌ Error fetching conversations:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch conversations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
