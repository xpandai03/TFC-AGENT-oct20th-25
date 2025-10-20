// Environment variables are loaded via --require flag in package.json
import { generateText, streamText } from 'ai'
import { model, config as azureConfig } from '../lib/azure-config'

async function testAzureConnection() {
  console.log('🧪 Testing Azure OpenAI connection...\n')
  console.log('📋 Configuration:')
  console.log(`   Resource: ${azureConfig.resourceName}`)
  console.log(`   Deployment: ${azureConfig.deploymentName}`)
  console.log(`   API Key: ${azureConfig.hasApiKey ? '✅ Present' : '❌ Missing'}\n`)

  try {
    // Test 1: Basic text generation
    console.log('Test 1: Basic generateText')
    console.log('Calling Azure OpenAI...')
    const { text } = await generateText({
      model,
      prompt: 'Say "Hello from Azure OpenAI!" in one sentence.',
    })
    console.log('✅ Result:', text)
    console.log('')

    // Test 2: Streaming
    console.log('Test 2: Streaming text')
    console.log('Streaming response...')
    const result = await streamText({
      model,
      prompt: 'Count from 1 to 5, one number per line.',
    })

    for await (const chunk of result.textStream) {
      process.stdout.write(chunk)
    }
    console.log('\n✅ Streaming test complete\n')

    // Test 3: With DAWN system prompt
    console.log('Test 3: DAWN system prompt test')
    const dawnTest = await generateText({
      model,
      system: 'You are DAWN (Dependable Agent Working Nicely) - a compassionate admin support specialist for The Family Connection.',
      prompt: 'Introduce yourself briefly in one sentence.',
    })
    console.log('✅ DAWN says:', dawnTest.text)
    console.log('')

    console.log('🎉 All tests passed! Azure OpenAI is configured correctly.')
    console.log('✅ Ready to proceed to Phase 3 (Tool Definitions)')
  } catch (error) {
    console.error('❌ Test failed:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    process.exit(1)
  }
}

testAzureConnection()
