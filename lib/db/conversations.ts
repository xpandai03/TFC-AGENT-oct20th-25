import { prisma } from './prisma'

/**
 * Get or create a user by email
 * Used to ensure user exists before creating/accessing conversations
 */
export async function getOrCreateUser(email: string, name?: string) {
  return prisma.user.upsert({
    where: { email },
    update: { name }, // Update name if provided
    create: { email, name }, // Create new user if doesn't exist
  })
}

/**
 * Get all conversations for a user
 * Excludes soft-deleted conversations
 * Sorted by most recent first
 */
export async function getConversationsForUser(userEmail: string) {
  // Ensure user exists
  const user = await getOrCreateUser(userEmail)

  // Fetch conversations
  const conversations = await prisma.conversation.findMany({
    where: {
      userId: user.id,
      deletedAt: null, // Exclude soft-deleted conversations
    },
    orderBy: {
      updatedAt: 'desc', // Most recent first
    },
    select: {
      id: true,
      title: true,
      preview: true,
      pinned: true,
      messageCount: true,
      agentType: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return conversations
}

/**
 * Create a new conversation for a user
 */
export async function createConversation(
  userEmail: string,
  data: {
    title: string
    agentType?: string
  }
) {
  // Ensure user exists
  const user = await getOrCreateUser(userEmail)

  // Create conversation
  const conversation = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: data.title,
      agentType: data.agentType || 'dawn',
      preview: '', // Empty initially
      messageCount: 0,
    },
    select: {
      id: true,
      title: true,
      preview: true,
      pinned: true,
      messageCount: true,
      agentType: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  console.log(`✅ Created conversation: ${conversation.id} for agent: ${conversation.agentType} for user: ${userEmail}`)

  return conversation
}

/**
 * Update a conversation (title, folder, etc.)
 * Verifies ownership before updating
 */
export async function updateConversation(
  userEmail: string,
  conversationId: string,
  data: {
    title?: string
    folder?: string
  }
) {
  // 1. Ensure user exists
  const user = await getOrCreateUser(userEmail)

  // 2. Verify ownership
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId: user.id,
      deletedAt: null, // Not deleted
    },
  })

  if (!conversation) {
    throw new Error('Conversation not found or access denied')
  }

  // 3. Update conversation
  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.folder !== undefined && { folder: data.folder }),
      updatedAt: new Date(),
    },
    select: {
      id: true,
      title: true,
      preview: true,
      pinned: true,
      messageCount: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  console.log(`✏️ Updated conversation: ${conversationId} for user: ${userEmail}`)

  return updated
}

/**
 * Delete a conversation (soft delete)
 * Sets deletedAt timestamp instead of removing from database
 */
export async function deleteConversation(
  userEmail: string,
  conversationId: string
) {
  // 1. Ensure user exists
  const user = await getOrCreateUser(userEmail)

  // 2. Verify ownership
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId: user.id,
      deletedAt: null, // Not already deleted
    },
  })

  if (!conversation) {
    throw new Error('Conversation not found or already deleted')
  }

  // 3. Soft delete (set deletedAt timestamp)
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { deletedAt: new Date() },
  })

  console.log(`🗑️ Deleted conversation: ${conversationId} for user: ${userEmail}`)

  return { success: true }
}
