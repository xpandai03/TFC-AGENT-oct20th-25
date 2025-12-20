import { auth } from '@/auth'
import { logChatAccess, logToolCall } from '@/lib/audit/logger'

import { openai, deploymentName } from '@/lib/azure-config'
import { tools } from '@/lib/tools/definitions'
import { handleToolCall } from '@/lib/agent/tool-handler'
import { DAWN_SYSTEM_PROMPT } from '@/lib/agent/prompts'
import { LISA_SYSTEM_PROMPT } from '@/lib/agent/lisa-prompts'
import { buildRAGContext, formatRAGSystemPrompt } from '@/lib/services/rag-context-builder'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, history, agentType = 'dawn', conversationId } = body

    // Authentication check - require valid session
    const session = await auth()
    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please sign in' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userEmail = session.user.email
    const userName = session.user.name || 'User'
    console.log('👤 Authenticated user:', userEmail)
    console.log('🤖 Selected agent:', agentType.toUpperCase())
    console.log('💬 Conversation ID:', conversationId)

    // HIPAA Audit: Log chat access
    logChatAccess(userEmail, message)

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`💬 ${agentType.toUpperCase()} received message:`, message)
    console.log('📚 Conversation history:', history?.length || 0, 'previous messages')

    // Route to appropriate agent handler
    if (agentType === 'lisa') {
      return handleLisaChat(message, history, conversationId, userEmail)
    } else {
      return handleDawnChat(message, history, userEmail, userName)
    }

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

/**
 * Handle LISA (document Q&A) chat requests with RAG retrieval
 */
async function handleLisaChat(
  message: string,
  history: any[],
  conversationId: string,
  userEmail: string
) {
  console.log('📚 LISA chat handler called')
  console.log(`💬 User query: "${message.substring(0, 100)}..."`)

  // Step 1: Build RAG context from uploaded documents
  let ragContext
  try {
    ragContext = await buildRAGContext(message, conversationId, 5)

    if (ragContext.hasContext) {
      console.log(`✅ Retrieved ${ragContext.sources.length} relevant document chunks`)
      ragContext.sources.forEach((source, i) => {
        console.log(`  📄 ${i + 1}. ${source.documentName} (${(source.similarity * 100).toFixed(1)}% match)`)
      })
    } else {
      console.log('⚠️ No documents found - will prompt user to upload')
    }
  } catch (error) {
    console.error('❌ Error building RAG context:', error)
    // Continue without context - LISA will inform user
    ragContext = { context: '', sources: [], hasContext: false }
  }

  // Step 2: Build enhanced system prompt with RAG context
  const ragInstructions = formatRAGSystemPrompt(ragContext.context)
  const enhancedSystemPrompt = `${LISA_SYSTEM_PROMPT}

---

RETRIEVED CONTEXT:
${ragInstructions}`

  console.log(`📏 System prompt length: ${enhancedSystemPrompt.length} characters`)

  // Step 3: Build messages array with enhanced prompt
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: enhancedSystemPrompt },
    ...(history || []),
    { role: 'user', content: message }
  ]

  console.log('📝 Total messages being sent to AI:', messages.length)

  // Step 4: Generate response using Azure OpenAI
  console.log('🤖 Calling Azure OpenAI for LISA response...')
  console.log('📋 Config:', {
    deployment: deploymentName,
    messageCount: messages.length,
    hasRAGContext: ragContext.hasContext,
  })

  let response
  try {
    response = await openai.chat.completions.create({
      model: deploymentName,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500,
      // LISA doesn't use tools - it's purely conversational with RAG context
      // Note: api-key header is set in client config (lib/azure-config.ts)
    })
    console.log('✅ Azure OpenAI response received')
  } catch (error: any) {
    console.error('❌ Azure OpenAI API error:', error)
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
    })

    // Log authentication-related details for 401 errors
    if (error.status === 401) {
      const apiKey = process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_KEY
      console.error('🔐 Authentication Debug:', {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
        apiKeyPrefix: apiKey ? `${apiKey.substring(0, 10)}...` : 'N/A',
      })
    }

    throw new Error(`Azure OpenAI API error: ${error.message || 'Unknown error'}`)
  }

  const assistantMessage = response.choices[0].message
  const textContent = assistantMessage.content || 'I apologize, but I was unable to generate a response.'

  console.log('✅ LISA response generated')
  console.log(`📏 Response length: ${textContent.length} characters`)

  // Step 5: Stream the response with source metadata
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const encoder = new TextEncoder()

        // Stream the text response
        for (const char of textContent) {
          controller.enqueue(encoder.encode(char))
          await new Promise(resolve => setTimeout(resolve, 10))
        }

        // If we have sources, append them as metadata (client will parse)
        if (ragContext.hasContext && ragContext.sources.length > 0) {
          console.log('📎 Appending source metadata to response')
          const sourcesMetadata = '\n\n__SOURCES__\n' + JSON.stringify(ragContext.sources)
          controller.enqueue(encoder.encode(sourcesMetadata))
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

/**
 * Handle D.A.W.N. (Excel operations) chat requests
 */
async function handleDawnChat(
  message: string,
  history: any[],
  userEmail: string,
  userName: string
) {
  console.log('🌅 D.A.W.N. chat handler called')

  // Build messages array with D.A.W.N. system prompt
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: DAWN_SYSTEM_PROMPT },
    ...(history || []),
    { role: 'user', content: message }
  ]

  console.log('📝 Total messages being sent to AI:', messages.length)

  // Agentic loop with tool calling support
  let currentMessages = [...messages]
  const maxSteps = 5
  let excelPreviewData = null // Track Excel preview if showExcelPreview is called

  for (let step = 0; step < maxSteps; step++) {
    console.log(`🔄 Step ${step + 1}/${maxSteps}`)

    // Call Azure OpenAI
    console.log(`🤖 Calling Azure OpenAI for DAWN response (step ${step + 1})...`)
    console.log('📋 Config:', {
      deployment: deploymentName,
      messageCount: currentMessages.length,
      toolCount: tools.length,
      toolNames: tools.map(t => t.function.name),
    })
    console.log('🔧 Tools being sent:', JSON.stringify(tools, null, 2))

    let response
    try {
      response = await openai.chat.completions.create({
        model: deploymentName, // Azure uses deployment name as model parameter
        messages: currentMessages,
        tools,
        tool_choice: 'auto', // Let the AI decide when to use tools
        temperature: 0.7,
        // Note: api-key header is set in client config (lib/azure-config.ts)
      })
      console.log('✅ Azure OpenAI response received')
      console.log('📦 Response structure:', {
        hasChoices: !!response.choices,
        choiceCount: response.choices?.length || 0,
        hasMessage: !!response.choices?.[0]?.message,
        hasToolCalls: !!response.choices?.[0]?.message?.tool_calls,
        toolCallCount: response.choices?.[0]?.message?.tool_calls?.length || 0,
      })
    } catch (error: any) {
      console.error('❌ Azure OpenAI API error:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.type,
      })

      // Log authentication-related details for 401 errors
      if (error.status === 401) {
        const apiKey = process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_KEY
        console.error('🔐 Authentication Debug:', {
          hasApiKey: !!apiKey,
          apiKeyLength: apiKey?.length || 0,
          apiKeyPrefix: apiKey ? `${apiKey.substring(0, 10)}...` : 'N/A',
        })
      }

      throw new Error(`Azure OpenAI API error: ${error.message || 'Unknown error'}`)
    }

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

      const textContent = assistantMessage.content || 'I apologize, but I was unable to generate a response.'

      // If Excel preview data exists, return JSON response instead of streaming
      if (excelPreviewData) {
        console.log('📊 Returning response with Excel preview data')
        return new Response(
          JSON.stringify({
            text: textContent,
            excelPreview: excelPreviewData
          }),
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        )
      }

      // Normal streaming response without Excel preview
      const stream = new ReadableStream({
        async start(controller) {
          try {
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
        const result = await handleToolCall(toolCall.function.name, { ...args, userName })

        console.log(`  ✅ Tool result:`, result)

        // Check if this is an Excel preview tool call
        if (toolCall.function.name === 'showExcelPreview' && result.success && result.data) {
          excelPreviewData = result.data
          console.log('📊 Excel preview data captured:', excelPreviewData)
        }

        // HIPAA Audit: Log successful tool call
        logToolCall(userEmail, toolCall.function.name, args, result)

        // Add tool result to messages
        // For showExcelPreview, exclude data to prevent AI from echoing back JSON
        const toolResult = toolCall.function.name === 'showExcelPreview'
          ? { success: result.success, message: result.message }
          : result

        currentMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult)
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
}
