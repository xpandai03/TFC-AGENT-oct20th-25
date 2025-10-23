/**
 * Document Processing Service
 * Extracts text content from various document formats (PDF, DOCX, TXT)
 */

import pdf from 'pdf-parse'
import mammoth from 'mammoth'

export interface ProcessedDocument {
  text: string
  pageCount?: number
  metadata: {
    fileType: string
    fileName: string
    processingDate: string
  }
}

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(buffer: Buffer, fileName: string): Promise<ProcessedDocument> {
  console.log('📄 Extracting text from PDF:', fileName)

  try {
    const data = await pdf(buffer)

    console.log(`✅ PDF processed: ${data.numpages} pages, ${data.text.length} characters`)

    return {
      text: data.text,
      pageCount: data.numpages,
      metadata: {
        fileType: 'pdf',
        fileName,
        processingDate: new Date().toISOString(),
      }
    }
  } catch (error) {
    console.error('❌ PDF extraction failed:', error)
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from DOCX file
 */
async function extractTextFromDOCX(buffer: Buffer, fileName: string): Promise<ProcessedDocument> {
  console.log('📝 Extracting text from DOCX:', fileName)

  try {
    const result = await mammoth.extractRawText({ buffer })

    console.log(`✅ DOCX processed: ${result.value.length} characters`)

    return {
      text: result.value,
      pageCount: undefined, // DOCX doesn't have explicit page count
      metadata: {
        fileType: 'docx',
        fileName,
        processingDate: new Date().toISOString(),
      }
    }
  } catch (error) {
    console.error('❌ DOCX extraction failed:', error)
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from TXT file
 */
async function extractTextFromTXT(buffer: Buffer, fileName: string): Promise<ProcessedDocument> {
  console.log('📋 Extracting text from TXT:', fileName)

  try {
    const text = buffer.toString('utf-8')

    console.log(`✅ TXT processed: ${text.length} characters`)

    return {
      text,
      pageCount: undefined,
      metadata: {
        fileType: 'txt',
        fileName,
        processingDate: new Date().toISOString(),
      }
    }
  } catch (error) {
    console.error('❌ TXT extraction failed:', error)
    throw new Error(`Failed to extract text from TXT: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Main document processing function
 * Routes to appropriate extractor based on file type
 */
export async function processDocument(
  buffer: Buffer,
  fileName: string,
  fileType: string
): Promise<ProcessedDocument> {
  console.log(`🔄 Processing document: ${fileName} (${fileType})`)

  const extension = fileType.toLowerCase()

  switch (extension) {
    case 'pdf':
    case 'application/pdf':
      return extractTextFromPDF(buffer, fileName)

    case 'docx':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractTextFromDOCX(buffer, fileName)

    case 'txt':
    case 'text/plain':
      return extractTextFromTXT(buffer, fileName)

    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
}
