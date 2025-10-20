/**
 * Health Check Endpoint
 * Used by Render to verify service is running
 */

export async function GET() {
  return Response.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'DAWN AI Assistant',
      version: '1.0.0',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  )
}
