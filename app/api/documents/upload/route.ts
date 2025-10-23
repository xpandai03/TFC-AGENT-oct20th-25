import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { processDocument } from '@/lib/services/document-processor'
import { chunkText } from '@/lib/services/text-chunker'
import { generateEmbeddingsBatch } from '@/lib/services/embedding'
import { storeDocumentChunks, updateDocumentStatus } from '@/lib/services/vector-store'
import { saveFile } from '@/lib/services/file-storage'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

export async function POST(request: NextRequest) {
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
    console.log('📤 Document upload request from:', userEmail)

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const conversationId = formData.get('conversationId') as string

    // Validation
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)` },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not supported: ${file.type}` },
        { status: 400 }
      )
    }

    console.log(`📄 File: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)} KB)`)

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create document record in database with temporary fileUrl
    // We'll save the actual file after getting the document ID
    const document = await prisma.document.create({
      data: {
        userId: userEmail,
        conversationId,
        fileName: file.name,
        fileType: file.type.split('/').pop() || 'unknown',
        fileSize: file.size,
        fileUrl: 'pending', // Temporary placeholder, will be updated after file save
        processingStatus: 'processing',
      },
    })

    console.log(`✅ Document record created: ${document.id}`)

    // Save file to disk with document ID in filename
    const fileUrl = await saveFile(buffer, file.name, document.id)

    // Update document with actual file URL
    await prisma.document.update({
      where: { id: document.id },
      data: { fileUrl },
    })

    console.log(`💾 File saved: ${fileUrl}`)

    // Process document asynchronously (don't block response)
    processDocumentAsync(document.id, buffer, file.name, file.type)
      .catch((error) => {
        console.error(`❌ Document processing failed for ${document.id}:`, error)
      })

    // Return immediately with document info
    return NextResponse.json({
      document: {
        id: document.id,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        fileUrl,
        processingStatus: document.processingStatus,
        createdAt: document.createdAt,
      },
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Document upload error:', error)
    return NextResponse.json(
      {
        error: 'Failed to upload document',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Process document asynchronously after upload
 * Extracts text, chunks it, generates embeddings, and stores in vector database
 */
async function processDocumentAsync(
  documentId: string,
  buffer: Buffer,
  fileName: string,
  fileType: string
): Promise<void> {
  try {
    console.log(`🔄 Starting async processing for document ${documentId}`)

    // Update status to processing
    await updateDocumentStatus(documentId, 'processing')

    // Step 1: Extract text from document
    console.log('📖 Step 1: Extracting text...')
    const processed = await processDocument(buffer, fileName, fileType)

    // Update page count if available
    if (processed.pageCount) {
      await prisma.document.update({
        where: { id: documentId },
        data: { pageCount: processed.pageCount },
      })
    }

    // Step 2: Chunk the text
    console.log('✂️ Step 2: Chunking text...')
    const chunks = await chunkText(processed.text, {
      chunkSize: 1000,
      chunkOverlap: 200,
    })

    if (chunks.length === 0) {
      throw new Error('No chunks created - document may be empty')
    }

    // Step 3: Generate embeddings for all chunks
    console.log('🧮 Step 3: Generating embeddings...')
    const chunkTexts = chunks.map(c => c.content)
    const embeddings = await generateEmbeddingsBatch(chunkTexts)

    if (embeddings.length !== chunks.length) {
      throw new Error(`Embedding count mismatch: ${embeddings.length} embeddings for ${chunks.length} chunks`)
    }

    // Step 4: Store chunks with embeddings in vector database
    console.log('💾 Step 4: Storing chunks in vector database...')
    await storeDocumentChunks(documentId, chunks, embeddings)

    // Update document status to completed
    await updateDocumentStatus(documentId, 'completed', chunks.length)

    console.log(`✅ Document ${documentId} processed successfully: ${chunks.length} chunks`)

  } catch (error) {
    console.error(`❌ Processing failed for document ${documentId}:`, error)

    // Update document status to failed
    await updateDocumentStatus(documentId, 'failed')

    throw error
  }
}
