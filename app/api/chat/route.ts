import { streamText } from 'ai'
import { model } from '@/lib/azure-config'
import { DAWN_SYSTEM_PROMPT } from '@/lib/agent/prompts'
import { tools } from '@/lib/tools/registry'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, history } = body

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('💬 DAWN received message:', message)
    console.log('📚 Conversation history:', history?.length || 0, 'previous messages')

    // Build messages array from history
    const messages = [
      ...(history || []),
      { role: 'user' as const, content: message }
    ]

    console.log('📝 Total messages being sent to AI:', messages.length)

    // Stream response from Azure OpenAI
    // Tools disabled until schema issue is resolved
    const result = await streamText({
      model,
      system: DAWN_SYSTEM_PROMPT,
      messages,
      // tools, // DISABLED - Azure OpenAI schema validation failing
      // maxSteps: 5,
      maxTokens: 1000,
    })

    console.log('🎯 streamText result created successfully')

    // Return streaming response
    return result.toTextStreamResponse()
  } catch (error) {
    console.error('❌ Error in chat API route:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
