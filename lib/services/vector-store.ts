/**
 * Vector Storage Service
 * Stores and retrieves document chunks with embeddings from PostgreSQL + pgvector
 */

import { Client } from 'pg'
import type { TextChunk } from './text-chunker'
import type { EmbeddingResult } from './embedding'

const DATABASE_URL = process.env.DATABASE_URL!

export interface DocumentChunkData {
  id: string
  documentId: string
  content: string
  pageNumber?: number
  chunkIndex: number
  embedding: number[]
  charCount: number
  createdAt: Date
}

export interface SearchResult {
  chunkId: string
  documentId: string
  documentName: string
  content: string
  pageNumber?: number
  similarity: number
}

/**
 * Store document chunks with embeddings in the database
 */
export async function storeDocumentChunks(
  documentId: string,
  chunks: TextChunk[],
  embeddings: EmbeddingResult[]
): Promise<void> {
  console.log(`💾 Storing ${chunks.length} chunks for document ${documentId}`)

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    await client.connect()

    // Insert chunks with embeddings in batches
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const embeddingData = embeddings.find(e => e.index === i)

      if (!embeddingData) {
        console.warn(`⚠️ No embedding found for chunk ${i}`)
        continue
      }

      // Convert embedding array to pgvector format
      const embeddingVector = `[${embeddingData.embedding.join(',')}]`

      const query = `
        INSERT INTO document_chunks (
          document_id,
          content,
          chunk_index,
          embedding,
          metadata
        ) VALUES ($1, $2, $3, $4, $5)
      `

      const values = [
        documentId,
        chunk.content,
        chunk.index,
        embeddingVector,
        JSON.stringify({
          charCount: chunk.metadata.charCount,
          startChar: chunk.metadata.startChar,
          endChar: chunk.metadata.endChar,
        }),
      ]

      await client.query(query, values)
    }

    console.log(`✅ Stored ${chunks.length} chunks successfully`)
  } catch (error) {
    console.error('❌ Failed to store document chunks:', error)
    throw error
  } finally {
    await client.end()
  }
}

/**
 * Search for relevant document chunks using vector similarity
 */
export async function searchDocumentChunks(
  conversationId: string,
  queryEmbedding: number[],
  limit: number = 5
): Promise<SearchResult[]> {
  console.log(`🔍 Searching chunks for conversation ${conversationId} (top ${limit})`)

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    await client.connect()

    // Convert query embedding to pgvector format
    const embeddingVector = `[${queryEmbedding.join(',')}]`

    // Use the search function we created in the migration
    const query = `
      SELECT * FROM search_document_chunks($1::vector, $2, $3)
    `

    const result = await client.query(query, [embeddingVector, conversationId, limit])

    const searchResults: SearchResult[] = result.rows.map((row) => ({
      chunkId: row.chunk_id,
      documentId: row.document_id,
      documentName: row.document_name,
      content: row.content,
      pageNumber: row.page_number,
      similarity: row.similarity,
    }))

    console.log(`✅ Found ${searchResults.length} relevant chunks`)

    // Log top results for debugging
    if (searchResults.length > 0) {
      console.log(`   Top result: ${searchResults[0].documentName} (similarity: ${searchResults[0].similarity.toFixed(3)})`)
    }

    return searchResults
  } catch (error) {
    console.error('❌ Vector search failed:', error)
    throw error
  } finally {
    await client.end()
  }
}

/**
 * Get all chunks for a specific document
 */
export async function getDocumentChunks(documentId: string): Promise<DocumentChunkData[]> {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    await client.connect()

    const query = `
      SELECT
        id,
        document_id,
        content,
        page_number,
        chunk_index,
        embedding,
        metadata,
        created_at
      FROM document_chunks
      WHERE document_id = $1
      ORDER BY chunk_index ASC
    `

    const result = await client.query(query, [documentId])

    return result.rows.map((row) => ({
      id: row.id,
      documentId: row.document_id,
      content: row.content,
      pageNumber: row.page_number,
      chunkIndex: row.chunk_index,
      embedding: row.embedding, // Already an array from pgvector
      charCount: row.metadata?.charCount || row.content.length, // Extract from metadata
      createdAt: row.created_at,
    }))
  } finally {
    await client.end()
  }
}

/**
 * Delete all chunks for a document
 */
export async function deleteDocumentChunks(documentId: string): Promise<void> {
  console.log(`🗑️ Deleting chunks for document ${documentId}`)

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    await client.connect()

    const query = `DELETE FROM document_chunks WHERE document_id = $1`
    const result = await client.query(query, [documentId])

    console.log(`✅ Deleted ${result.rowCount} chunks`)
  } catch (error) {
    console.error('❌ Failed to delete chunks:', error)
    throw error
  } finally {
    await client.end()
  }
}

/**
 * Update document's chunk count and status
 */
export async function updateDocumentStatus(
  documentId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  chunkCount?: number
): Promise<void> {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    await client.connect()

    const query = `
      UPDATE documents
      SET
        processing_status = $1,
        ${chunkCount !== undefined ? 'chunk_count = $2,' : ''}
        updated_at = NOW()
      WHERE id = $${chunkCount !== undefined ? '3' : '2'}
    `

    const values = chunkCount !== undefined
      ? [status, chunkCount, documentId]
      : [status, documentId]

    await client.query(query, values)

    console.log(`✅ Updated document ${documentId} status to ${status}`)
  } catch (error) {
    console.error('❌ Failed to update document status:', error)
    throw error
  } finally {
    await client.end()
  }
}
