import { NextResponse } from 'next/server'

// Debug endpoint to check environment variable status
// This should be removed or protected in production
export async function GET() {
  const excelEmbedUrl = process.env.EXCEL_EMBED_URL

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    excelEmbedUrl: {
      exists: !!excelEmbedUrl,
      length: excelEmbedUrl?.length || 0,
      prefix: excelEmbedUrl ? `${excelEmbedUrl.substring(0, 50)}...` : 'NOT SET',
      startsWithHttp: excelEmbedUrl?.startsWith('http') || false,
    },
    // List other relevant env vars (existence only, no values)
    otherEnvVars: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      AZURE_OPENAI_API_KEY: !!process.env.AZURE_OPENAI_API_KEY,
    }
  })
}
