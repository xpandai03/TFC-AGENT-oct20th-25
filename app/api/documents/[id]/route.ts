import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { deleteDocumentChunks } from '@/lib/services/vector-store'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const documentId = params.id

    console.log(`🗑️ Delete request for document ${documentId} from user ${userEmail}`)

    // Verify ownership
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: userEmail,
        deletedAt: null,
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Delete document chunks from vector store
    try {
      await deleteDocumentChunks(documentId)
    } catch (error) {
      console.error('⚠️ Failed to delete chunks (continuing anyway):', error)
    }

    // Soft delete the document record
    await prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    })

    console.log(`✅ Document ${documentId} deleted successfully`)

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    })

  } catch (error) {
    console.error('❌ Failed to delete document:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete document',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
