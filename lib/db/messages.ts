import { prisma } from './prisma'
import { getOrCreateUser } from './conversations'

/**
 * Get all messages for a conversation
 * Verifies user owns the conversation before returning messages
 */
export async function getMessagesForConversation(
  conversationId: string,
  userEmail: string
) {
  // 1. Verify user owns this conversation
  const user = await getOrCreateUser(userEmail)

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId: user.id,
      deletedAt: null, // Not soft-deleted
    },
  })

  if (!conversation) {
    throw new Error('Conversation not found or access denied')
  }

  // 2. Fetch messages in chronological order
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      createdAt: 'asc', // Oldest first
    },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  })

  return messages
}

/**
 * Create a new message in a conversation
 * Verifies user owns the conversation before saving
 * Automatically updates conversation metadata
 */
export async function createMessage(
  conversationId: string,
  userEmail: string,
  data: {
    role: 'user' | 'assistant'
    content: string
  }
) {
  // 1. Verify user owns this conversation
  const user = await getOrCreateUser(userEmail)

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId: user.id,
      deletedAt: null,
    },
  })

  if (!conversation) {
    throw new Error('Conversation not found or access denied')
  }

  // 2. Create the message
  const message = await prisma.message.create({
    data: {
      conversationId,
      role: data.role,
      content: data.content,
    },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  })

  // 3. Update conversation metadata (message count and preview)
  await updateConversationMetadata(conversationId, userEmail)

  return message
}

/**
 * Update conversation's message count and preview
 * Internal helper function
 */
async function updateConversationMetadata(
  conversationId: string,
  userEmail: string
) {
  // Get all messages for this conversation
  const messages = await getMessagesForConversation(conversationId, userEmail)

  // Get the last message for preview
  const lastMessage = messages[messages.length - 1]
  const preview = lastMessage?.content.slice(0, 80) || ''

  // Update conversation
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      messageCount: messages.length,
      preview,
      updatedAt: new Date(),
    },
  })
}
