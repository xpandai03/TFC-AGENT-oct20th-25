/**
 * File Storage Service
 * Handles saving uploaded files to local disk storage
 *
 * IMPORTANT: Render's filesystem is read-only except for /tmp
 * - Production (Render): Uses /tmp/uploads (ephemeral, cleared on restart)
 * - Development: Uses ./uploads (persistent)
 */

import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// Determine upload directory based on environment
// Render requires /tmp because project directory is read-only
const UPLOAD_DIR = process.env.RENDER
  ? '/tmp/uploads'  // Render: use /tmp (only writable directory)
  : path.join(process.cwd(), 'uploads')  // Local: use ./uploads

/**
 * Initialize uploads directory
 */
export async function initializeStorage(): Promise<void> {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
      console.log('📁 Created uploads directory:', UPLOAD_DIR)
    } else {
      console.log('📁 Uploads directory already exists:', UPLOAD_DIR)
    }
  } catch (error) {
    console.error('❌ Failed to create uploads directory:', error)
    throw new Error(`Cannot create uploads directory at ${UPLOAD_DIR}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Save file to disk storage
 * @param buffer - File buffer
 * @param fileName - Original file name
 * @param documentId - Document ID (used for unique file naming)
 * @returns File path
 */
export async function saveFile(
  buffer: Buffer,
  fileName: string,
  documentId: string
): Promise<string> {
  try {
    // Ensure uploads directory exists
    await initializeStorage()

    // Create unique file name: {documentId}_{originalFileName}
    const extension = path.extname(fileName)
    const baseName = path.basename(fileName, extension)
    const safeFileName = `${documentId}_${baseName}${extension}`

    // Full file path
    const filePath = path.join(UPLOAD_DIR, safeFileName)

    // Save file to disk
    await writeFile(filePath, buffer)

    console.log(`💾 File saved: ${filePath}`)

    // Return relative path (for storage in database)
    return `/uploads/${safeFileName}`
  } catch (error) {
    console.error('❌ File storage error:', error)
    throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get absolute file path from relative path
 * @param relativePath - Relative file path (e.g., /uploads/file.pdf)
 * @returns Absolute file path
 */
export function getAbsolutePath(relativePath: string): string {
  return path.join(process.cwd(), relativePath.replace(/^\//, ''))
}
