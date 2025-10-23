/**
 * TypeScript Types for LISA RAG Agent
 * Defines interfaces for documents, chunks, and RAG operations
 */

// ============================================================================
// Agent Types
// ============================================================================

export type AgentType = 'dawn' | 'lisa'

export interface AgentConfig {
  type: AgentType
  name: string
  description: string
  icon?: string
}

// ============================================================================
// Document Types
// ============================================================================

export type DocumentProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type SupportedFileType = 'pdf' | 'docx' | 'txt'

export interface Document {
  id: string
  userId: string
  conversationId: string

  // File metadata
  fileName: string
  fileType: SupportedFileType
  fileSize: number // bytes
  filePath: string

  // Processing status
  processingStatus: DocumentProcessingStatus
  processingError?: string

  // Document info (available after processing)
  pageCount?: number
  chunkCount?: number
  totalTokens?: number

  // Metadata
  metadata?: Record<string, any>

  // Timestamps
  createdAt: string
  updatedAt: string
  processedAt?: string
}

export interface CreateDocumentParams {
  userId: string
  conversationId: string
  fileName: string
  fileType: SupportedFileType
  fileSize: number
  filePath: string
}

export interface UpdateDocumentParams {
  id: string
  processingStatus?: DocumentProcessingStatus
  processingError?: string
  pageCount?: number
  chunkCount?: number
  totalTokens?: number
  processedAt?: string
}

// ============================================================================
// Document Chunk Types
// ============================================================================

export interface DocumentChunk {
  id: string
  documentId: string
  chunkIndex: number

  // Content
  content: string

  // Source location (for citations)
  pageNumber?: number
  sectionTitle?: string

  // Vector embedding
  embedding?: number[] // 3072-dimensional vector from text-embedding-3-large

  // Chunk metadata
  charCount?: number
  tokenCount?: number
  metadata?: Record<string, any>

  // Timestamp
  createdAt: string
}

export interface CreateChunkParams {
  documentId: string
  chunkIndex: number
  content: string
  pageNumber?: number
  sectionTitle?: string
  embedding?: number[]
  charCount?: number
  tokenCount?: number
  metadata?: Record<string, any>
}

// ============================================================================
// Vector Search Types
// ============================================================================

export interface SearchResult {
  chunkId: string
  documentId: string
  documentName: string
  content: string
  pageNumber?: number
  similarity: number // 0-1, higher is more similar
}

export interface VectorSearchParams {
  queryEmbedding: number[]
  conversationId: string
  limit?: number // default 5
  minSimilarity?: number // filter results below this threshold
}

// ============================================================================
// RAG Context Types
// ============================================================================

export interface RAGContext {
  query: string
  retrievedChunks: SearchResult[]
  contextText: string // formatted context for LLM prompt
  sources: DocumentSource[]
}

export interface DocumentSource {
  documentId: string
  documentName: string
  pageNumbers: number[]
  relevanceScore: number
}

// ============================================================================
// File Upload Types
// ============================================================================

export interface FileUploadResult {
  success: boolean
  documentId?: string
  fileName?: string
  fileSize?: number
  error?: string
}

export interface FileValidationResult {
  valid: boolean
  error?: string
  fileType?: SupportedFileType
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_FILE_TYPES: SupportedFileType[] = ['pdf', 'docx', 'txt']

// ============================================================================
// Document Processing Types
// ============================================================================

export interface ExtractedText {
  content: string
  pageCount?: number
  metadata?: {
    title?: string
    author?: string
    createdDate?: string
    [key: string]: any
  }
}

export interface TextChunk {
  content: string
  pageNumber?: number
  sectionTitle?: string
  startIndex: number
  endIndex: number
}

export interface ChunkingOptions {
  chunkSize?: number // target characters per chunk (default: 1000)
  chunkOverlap?: number // overlap between chunks (default: 200)
  preserveParagraphs?: boolean // try to split at paragraph boundaries
}

export interface EmbeddingBatch {
  texts: string[]
  embeddings: number[][]
  model: string
  dimensions: number
}

// ============================================================================
// Citation Types
// ============================================================================

export interface Citation {
  documentName: string
  pageNumber?: number
  sectionTitle?: string
  chunkContent: string
}

export interface MessageWithCitations {
  content: string
  citations: Citation[]
}

// ============================================================================
// API Response Types
// ============================================================================

export interface DocumentListResponse {
  documents: Document[]
  total: number
}

export interface DocumentStatusResponse {
  documentId: string
  status: DocumentProcessingStatus
  progress?: number // 0-100
  error?: string
  pageCount?: number
  chunkCount?: number
}

export interface RAGChatResponse {
  text: string
  sources: DocumentSource[]
  retrievedChunks?: number // how many chunks were used
}

// ============================================================================
// Error Types
// ============================================================================

export class DocumentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'DocumentError'
  }
}

export class VectorSearchError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'VectorSearchError'
  }
}

export class ProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public documentId?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ProcessingError'
  }
}

// ============================================================================
// Utility Type Guards
// ============================================================================

export function isValidFileType(fileType: string): fileType is SupportedFileType {
  return ALLOWED_FILE_TYPES.includes(fileType as SupportedFileType)
}

export function isProcessingComplete(status: DocumentProcessingStatus): boolean {
  return status === 'completed'
}

export function isProcessingFailed(status: DocumentProcessingStatus): boolean {
  return status === 'failed'
}

export function isProcessingInProgress(status: DocumentProcessingStatus): boolean {
  return status === 'processing' || status === 'pending'
}
