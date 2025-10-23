/**
 * Text Chunking Service
 * Splits large text documents into smaller chunks for embedding
 */

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

export interface TextChunk {
  content: string
  index: number
  metadata: {
    startChar: number
    endChar: number
    charCount: number
  }
}

/**
 * Split text into chunks using recursive character splitting
 * Preserves semantic meaning by respecting paragraph and sentence boundaries
 */
export async function chunkText(
  text: string,
  options: {
    chunkSize?: number
    chunkOverlap?: number
  } = {}
): Promise<TextChunk[]> {
  const {
    chunkSize = 1000, // ~250 tokens (1 token ≈ 4 chars)
    chunkOverlap = 200, // Overlap to preserve context
  } = options

  console.log(`✂️ Chunking text: ${text.length} characters`)
  console.log(`   Chunk size: ${chunkSize}, Overlap: ${chunkOverlap}`)

  if (!text || text.trim().length === 0) {
    console.warn('⚠️ Empty text provided for chunking')
    return []
  }

  try {
    // Create text splitter with recursive character splitting
    // Tries to split on: \n\n (paragraphs), then \n (lines), then sentences, then words
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' ', ''],
    })

    // Split the text
    const documents = await splitter.createDocuments([text])

    // Convert to our TextChunk format with metadata
    const chunks: TextChunk[] = documents.map((doc, index) => {
      const content = doc.pageContent

      // Calculate position in original text (approximate)
      const startChar = index * (chunkSize - chunkOverlap)
      const endChar = startChar + content.length

      return {
        content,
        index,
        metadata: {
          startChar,
          endChar,
          charCount: content.length,
        }
      }
    })

    console.log(`✅ Created ${chunks.length} chunks`)

    // Log statistics
    const avgChunkSize = chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / chunks.length
    console.log(`   Average chunk size: ${Math.round(avgChunkSize)} characters`)

    return chunks
  } catch (error) {
    console.error('❌ Text chunking failed:', error)
    throw new Error(`Failed to chunk text: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Estimate token count for a text chunk
 * Rough estimate: 1 token ≈ 4 characters
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Validate chunk size is appropriate for embedding model
 * text-embedding-3-large supports up to 8192 tokens
 */
export function validateChunkSize(text: string, maxTokens: number = 8000): boolean {
  const estimatedTokens = estimateTokenCount(text)
  return estimatedTokens <= maxTokens
}
