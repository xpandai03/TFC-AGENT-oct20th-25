/**
 * RAG Context Builder
 * Retrieves relevant document chunks and builds context for LISA's responses
 */

import { generateEmbedding } from './embedding'
import { searchDocumentChunks, type SearchResult } from './vector-store'

export interface RAGContext {
  context: string
  sources: SourceReference[]
  hasContext: boolean
}

export interface SourceReference {
  documentId: string
  documentName: string
  chunkIndex: number
  similarity: number
  snippet: string
}

/**
 * Build RAG context for a user query
 * @param query - User's question
 * @param conversationId - Current conversation ID
 * @param topK - Number of similar chunks to retrieve (default: 5)
 * @returns Formatted context and source references
 */
export async function buildRAGContext(
  query: string,
  conversationId: string,
  topK: number = 5
): Promise<RAGContext> {
  try {
    console.log(`🔍 Building RAG context for query: "${query.substring(0, 100)}..."`)
    console.log(`📋 Conversation ID: ${conversationId}`)
    console.log(`🎯 Retrieving top ${topK} similar chunks`)

    // Step 1: Generate embedding for the query
    console.log('⚙️ Generating query embedding...')
    const queryEmbedding = await generateEmbedding(query)
    console.log(`✅ Query embedding generated (${queryEmbedding.length} dimensions)`)

    // Step 2: Search for similar document chunks
    console.log('🔎 Searching vector store for similar chunks...')
    const searchResults = await searchDocumentChunks(
      conversationId,
      queryEmbedding,
      topK
    )

    console.log(`📊 Found ${searchResults.length} relevant chunks`)

    // If no results found, return empty context
    if (searchResults.length === 0) {
      console.log('⚠️ No relevant documents found for this query')
      return {
        context: '',
        sources: [],
        hasContext: false,
      }
    }

    // Step 3: Build formatted context from search results
    const contextParts: string[] = []
    const sources: SourceReference[] = []

    searchResults.forEach((result, index) => {
      // Add to context with source markers
      contextParts.push(
        `[Source ${index + 1}: ${result.document_name}, Page/Section ${result.chunk_index + 1}]\n${result.content}\n`
      )

      // Track source reference
      sources.push({
        documentId: result.document_id,
        documentName: result.document_name,
        chunkIndex: result.chunk_index,
        similarity: result.similarity,
        snippet: result.content.substring(0, 150) + '...',
      })

      console.log(
        `  📄 Source ${index + 1}: ${result.document_name} (similarity: ${(result.similarity * 100).toFixed(1)}%)`
      )
    })

    const formattedContext = contextParts.join('\n---\n\n')

    console.log('✅ RAG context built successfully')
    console.log(`📏 Context length: ${formattedContext.length} characters`)

    return {
      context: formattedContext,
      sources,
      hasContext: true,
    }
  } catch (error) {
    console.error('❌ Error building RAG context:', error)
    throw error
  }
}

/**
 * Format RAG context into system prompt instructions
 */
export function formatRAGSystemPrompt(context: string): string {
  if (!context) {
    return `You do not have access to any uploaded documents for this conversation yet.
Politely inform the user that they need to upload documents first before you can answer questions about them.`
  }

  return `You have access to the following relevant information from the user's uploaded documents:

${context}

IMPORTANT INSTRUCTIONS:
1. Answer the user's question based PRIMARILY on the information provided above
2. If the documents don't contain enough information to answer fully, say so
3. Always cite your sources using the format: [Source X]
4. If multiple sources support your answer, cite all of them: [Sources 1, 2]
5. Be specific and quote relevant passages when appropriate
6. If the user's question is not related to the documents, politely redirect them to ask about the uploaded materials
7. Never make up information that isn't in the provided context

Remember: Your goal is to help users understand their documents through accurate, cited responses.`
}

/**
 * Parse citations from LISA's response
 * Extracts [Source X] or [Sources X, Y] patterns
 */
export function parseCitations(response: string): number[] {
  const citationPattern = /\[Sources?\s+([\d,\s]+)\]/g
  const citations: number[] = []

  let match
  while ((match = citationPattern.exec(response)) !== null) {
    // Parse comma-separated numbers
    const numbers = match[1]
      .split(',')
      .map(n => parseInt(n.trim(), 10))
      .filter(n => !isNaN(n))

    citations.push(...numbers)
  }

  // Return unique citations, sorted
  return Array.from(new Set(citations)).sort((a, b) => a - b)
}
