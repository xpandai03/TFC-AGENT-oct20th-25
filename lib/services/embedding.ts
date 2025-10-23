/**
 * Embedding Generation Service
 * Uses Azure OpenAI text-embedding-3-large to generate vector embeddings
 */

import { openaiEmbedding } from '@/lib/azure-config'

// Note: For Azure OpenAI, the model name doesn't matter since it's determined by the deployment
// We still specify it for API compatibility, but the deployment controls which model is actually used
const EMBEDDING_MODEL = 'text-embedding-3-large'
const EMBEDDING_DIMENSIONS = 3072
const MAX_BATCH_SIZE = 100 // Process up to 100 chunks at once

export interface EmbeddingResult {
  embedding: number[]
  index: number
}

/**
 * Generate embedding for a single text chunk
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  console.log(`🧮 Generating embedding for text (${text.length} chars)`)

  try {
    const response = await openaiEmbedding.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    })

    const embedding = response.data[0].embedding

    console.log(`✅ Embedding generated: ${embedding.length} dimensions`)

    return embedding
  } catch (error) {
    console.error('❌ Embedding generation failed:', error)
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate embeddings for multiple text chunks in batch
 * Automatically handles batching to respect rate limits
 */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<EmbeddingResult[]> {
  console.log(`🧮 Generating embeddings for ${texts.length} chunks`)

  if (texts.length === 0) {
    return []
  }

  const results: EmbeddingResult[] = []

  // Process in batches to respect rate limits
  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + MAX_BATCH_SIZE)
    const batchNum = Math.floor(i / MAX_BATCH_SIZE) + 1
    const totalBatches = Math.ceil(texts.length / MAX_BATCH_SIZE)

    console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} chunks)`)

    try {
      const response = await openaiEmbedding.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch,
        dimensions: EMBEDDING_DIMENSIONS,
      })

      // Map embeddings to their original indices
      response.data.forEach((item, batchIndex) => {
        results.push({
          embedding: item.embedding,
          index: i + batchIndex,
        })
      })

      console.log(`✅ Batch ${batchNum} complete`)

      // Small delay between batches to avoid rate limiting
      if (i + MAX_BATCH_SIZE < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error(`❌ Batch ${batchNum} failed:`, error)
      throw new Error(`Failed to generate embeddings for batch ${batchNum}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  console.log(`✅ All embeddings generated: ${results.length} total`)

  return results
}

/**
 * Generate query embedding for vector search
 * Same as generateEmbedding but with clearer intent
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  console.log(`🔍 Generating query embedding: "${query.substring(0, 50)}..."`)
  return generateEmbedding(query)
}
