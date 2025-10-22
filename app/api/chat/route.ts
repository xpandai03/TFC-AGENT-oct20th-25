import { auth } from '@/auth'
import { logChatAccess, logToolCall } from '@/lib/audit/logger'

import { openai, deploymentName } from '@/lib/azure-config'
import { tools } from '@/lib/tools/definitions'
import { handleToolCall } from '@/lib/agent/tool-handler'
import { DAWN_SYSTEM_PROMPT } from '@/lib/agent/prompts'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, history } = body

    // Authentication check - require valid session
    const session = await auth()
    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please sign in' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userEmail = session.user.email
    console.log('👤 Authenticated user:', userEmail)

    // HIPAA Audit: Log chat access
    logChatAccess(userEmail, message)

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('💬 DAWN received message:', message)
    console.log('📚 Conversation history:', history?.length || 0, 'previous messages')

    // Build messages array with system prompt and conversation history
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: DAWN_SYSTEM_PROMPT },
      ...(history || []),
      { role: 'user', content: message }
    ]

    console.log('📝 Total messages being sent to AI:', messages.length)

    // Agentic loop with tool calling support
    let currentMessages = [...messages]
    const maxSteps = 5

    for (let step = 0; step < maxSteps; step++) {
      console.log(`🔄 Step ${step + 1}/${maxSteps}`)

      // Call Azure OpenAI
      const response = await openai.chat.completions.create({
        model: deploymentName, // Azure uses deployment name as model parameter
        messages: currentMessages,
        tools,
        tool_choice: 'auto', // Let the AI decide when to use tools
        temperature: 0.7,
      })

      const assistantMessage = response.choices[0].message
      console.log('🤖 Assistant response:', {
        hasContent: !!assistantMessage.content,
        hasToolCalls: !!assistantMessage.tool_calls,
        toolCallCount: assistantMessage.tool_calls?.length || 0
      })

      // Add assistant message to conversation
      currentMessages.push(assistantMessage)

      // If no tool calls, we have our final response - stream it back
      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        console.log('✅ Final response ready, streaming to client')

        // Create a streaming response
        const stream = new ReadableStream({
          async start(controller) {
            try {
              const textContent = assistantMessage.content || 'I apologize, but I was unable to generate a response.'

              // Stream the response character by character for smooth UX
              const encoder = new TextEncoder()
              for (const char of textContent) {
                controller.enqueue(encoder.encode(char))
                // Small delay for streaming effect
                await new Promise(resolve => setTimeout(resolve, 10))
              }

              controller.close()
            } catch (error) {
              console.error('❌ Streaming error:', error)
              controller.error(error)
            }
          }
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
          }
        })
      }

      // Execute all tool calls
      console.log(`🔧 Executing ${assistantMessage.tool_calls.length} tool call(s)`)

      for (const toolCall of assistantMessage.tool_calls) {
        console.log(`  → Tool: ${toolCall.function.name}`)
        console.log(`  → Arguments: ${toolCall.function.arguments}`)

        try {
          // Parse arguments and execute tool
          const args = JSON.parse(toolCall.function.arguments)
          const result = await handleToolCall(toolCall.function.name, args)

          console.log(`  ✅ Tool result:`, result)

          // HIPAA Audit: Log successful tool call
          logToolCall(userEmail, toolCall.function.name, args, result)

          // Add tool result to messages
          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          })
        } catch (error) {
          console.error(`  ❌ Tool execution error:`, error)

          const errorResult = {
            success: false,
            message: `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`
          }

          // HIPAA Audit: Log failed tool call
          logToolCall(userEmail, toolCall.function.name, {}, errorResult)

          // Add error as tool result
          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(errorResult)
          })
        }
      }
    }

    // If we reached max steps, return a message indicating that
    console.log('⚠️ Maximum steps reached')
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        controller.enqueue(encoder.encode('I apologize, but I reached my maximum reasoning steps. Please try rephrasing your request or breaking it into smaller tasks.'))
        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      }
    })

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
