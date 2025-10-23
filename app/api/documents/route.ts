import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const userEmail = session.user.email

    // Get conversation ID from query params
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    console.log(`📚 Fetching documents for conversation ${conversationId}`)

    // Fetch documents for this conversation and user
    const documents = await prisma.document.findMany({
      where: {
        userId: userEmail,
        conversationId,
        deletedAt: null, // Exclude soft-deleted documents
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        processingStatus: true,
        pageCount: true,
        chunkCount: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    console.log(`✅ Found ${documents.length} documents`)

    return NextResponse.json({
      documents,
    })

  } catch (error) {
    console.error('❌ Failed to fetch documents:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch documents',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
