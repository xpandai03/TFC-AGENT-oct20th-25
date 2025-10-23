import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { deleteConversation, updateConversation } from '@/lib/db/conversations'

/**
 * PATCH /api/conversations/:id
 * Update a conversation (title, folder, etc.)
 */
export async function PATCH(
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
    const body = await request.json()
    const { title, folder } = body

    console.log('📝 Updating conversation:', conversationId, 'for user:', userEmail)

    // 2. Update conversation (with ownership verification)
    const updated = await updateConversation(userEmail, conversationId, {
      title,
      folder,
    })

    console.log(`✅ Conversation updated successfully: ${conversationId}`)

    // 3. Return success with updated conversation
    return NextResponse.json({
      success: true,
      conversation: updated,
    })

  } catch (error) {
    console.error('❌ Error updating conversation:', error)

    // Handle "not found" errors separately
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to update conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/conversations/:id
 * Soft delete a conversation (marks as deleted, doesn't remove from DB)
 */
export async function DELETE(
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

    console.log('🗑️ Deleting conversation:', conversationId, 'for user:', userEmail)

    // 2. Delete conversation (with ownership verification)
    await deleteConversation(userEmail, conversationId)

    console.log(`✅ Conversation deleted successfully: ${conversationId}`)

    // 3. Return success
    return NextResponse.json({
      success: true,
      message: 'Conversation deleted',
    })

  } catch (error) {
    console.error('❌ Error deleting conversation:', error)

    // Handle "not found" errors separately
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to delete conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
