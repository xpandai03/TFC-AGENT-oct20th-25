import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getConversationsForUser, createConversation } from '@/lib/db/conversations'

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

/**
 * POST /api/conversations
 * Create a new conversation for the authenticated user
 */
export async function POST(request: Request) {
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

    // 2. Parse request body
    const body = await request.json()
    const { title } = body

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    console.log('📝 Creating conversation:', title, 'for user:', userEmail)

    // 3. Create conversation in database
    const conversation = await createConversation(userEmail, { title })

    console.log(`✅ Conversation created successfully: ${conversation.id}`)

    // 4. Return new conversation
    return NextResponse.json(
      { conversation },
      { status: 201 }
    )

  } catch (error) {
    console.error('❌ Error creating conversation:', error)
    return NextResponse.json(
      {
        error: 'Failed to create conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
