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
      createdAt: true,
      updatedAt: true,
    },
  })

  return conversations
}
