import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getMessagesForConversation, createMessage } from '@/lib/db/messages'

/**
 * GET /api/conversations/:id/messages
 * Fetch all messages for a conversation
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const conversationId = params.id

    console.log('📬 Fetching messages for conversation:', conversationId, 'user:', userEmail)

    // 2. Fetch messages (includes ownership verification)
    const messages = await getMessagesForConversation(conversationId, userEmail)

    console.log(`✅ Found ${messages.length} messages`)

    // 3. Return messages
    return NextResponse.json({
      messages,
      conversationId,
    })

  } catch (error) {
    console.error('❌ Error fetching messages:', error)

    // Handle "not found" or "access denied" errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/conversations/:id/messages
 * Create a new message in a conversation
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const conversationId = params.id

    // 2. Parse request body
    const body = await request.json()
    const { role, content } = body

    // 3. Validate input
    if (!role || !content) {
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      )
    }

    if (role !== 'user' && role !== 'assistant') {
      return NextResponse.json(
        { error: 'Role must be "user" or "assistant"' },
        { status: 400 }
      )
    }

    console.log('💬 Creating message in conversation:', conversationId, 'role:', role)

    // 4. Create message (includes ownership verification)
    const message = await createMessage(conversationId, userEmail, {
      role,
      content,
    })

    console.log(`✅ Message created: ${message.id}`)

    // 5. Return created message
    return NextResponse.json(
      { message },
      { status: 201 }
    )

  } catch (error) {
    console.error('❌ Error creating message:', error)

    // Handle "not found" or "access denied" errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to create message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
