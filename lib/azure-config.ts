import OpenAI from 'openai'

// Lazy-loaded configuration to avoid build-time errors
// Environment variables are only validated when actually used at runtime
function getAzureConfig() {
  // Helper to clean env vars (remove quotes that Railway might add)
  const cleanEnv = (value: string | undefined): string | undefined => {
    if (!value) return undefined
    // Remove surrounding quotes if present
    return value.replace(/^["']|["']$/g, '').trim()
  }
  
  // Support both AZURE_OPENAI_API_KEY and AZURE_OPENAI_KEY for compatibility
  const rawApiKey = process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_KEY
  const apiKey = cleanEnv(rawApiKey)
  const resourceName = cleanEnv(process.env.AZURE_RESOURCE_NAME)
  const chatDeploymentName = cleanEnv(process.env.AZURE_DEPLOYMENT_NAME)
  const embeddingDeploymentName = cleanEnv(process.env.AZURE_EMBEDDING_DEPLOYMENT) || 'text-embedding-3-large'
  const apiVersion = cleanEnv(process.env.AZURE_API_VERSION) || '2024-10-21'
  
  // Support for new Azure AI Studio endpoint format
  const customEndpoint = cleanEnv(process.env.AZURE_OPENAI_ENDPOINT)
  const customChatEndpoint = cleanEnv(process.env.AZURE_CHAT_ENDPOINT)
  const customEmbeddingEndpoint = cleanEnv(process.env.AZURE_EMBEDDING_ENDPOINT)

  // Log API key info (first 10 chars only for security)
  console.log('🔑 API Key check:', {
    found: !!apiKey,
    length: apiKey?.length || 0,
    prefix: apiKey ? `${apiKey.substring(0, 10)}...` : 'N/A',
    rawLength: rawApiKey?.length || 0,
    hadQuotes: rawApiKey ? rawApiKey !== apiKey : false,
  })

  if (!apiKey) {
    throw new Error('Missing AZURE_OPENAI_API_KEY or AZURE_OPENAI_KEY environment variable')
  }

  // If custom endpoints are provided, use them (new Azure AI Studio format)
  if (customChatEndpoint || customEndpoint) {
    return {
      apiKey,
      resourceName: resourceName || 'custom',
      chatDeploymentName: chatDeploymentName || 'gpt-4o-mini',
      embeddingDeploymentName,
      apiVersion,
      customChatEndpoint: customChatEndpoint || customEndpoint,
      customEmbeddingEndpoint: customEmbeddingEndpoint || customEndpoint,
    }
  }

  // Otherwise, use traditional format
  if (!resourceName) {
    throw new Error('Missing AZURE_RESOURCE_NAME environment variable (or provide AZURE_OPENAI_ENDPOINT)')
  }

  if (!chatDeploymentName) {
    throw new Error('Missing AZURE_DEPLOYMENT_NAME environment variable')
  }

  return {
    apiKey,
    resourceName,
    chatDeploymentName,
    embeddingDeploymentName,
    apiVersion,
    customChatEndpoint: null,
    customEmbeddingEndpoint: null,
  }
}

// Lazy-loaded OpenAI client for CHAT (D.A.W.N. + LISA responses)
let _openai: OpenAI | null = null
export function getOpenAIClient(): OpenAI {
  if (!_openai) {
    const config = getAzureConfig()
    
    // Use custom endpoint if provided (new Azure AI Studio format)
    if (config.customChatEndpoint) {
      // Remove /chat/completions if present (SDK adds it automatically)
      let baseURL = config.customChatEndpoint.replace(/\/chat\/completions\/?$/, '')
      baseURL = baseURL.replace(/\/$/, '') // Remove trailing slash
      
      console.log('🔗 Using custom Azure endpoint:', baseURL)
      console.log('📋 Full endpoint will be:', `${baseURL}/chat/completions`)
      console.log('🔑 API Key length:', config.apiKey.length)
      console.log('📌 API Version:', config.apiVersion)
      
      _openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL,
        defaultQuery: { 'api-version': config.apiVersion },
        defaultHeaders: { 
          'api-key': config.apiKey,
        },
      })
    } else {
      // Traditional format
      const baseURL = `https://${config.resourceName}.openai.azure.com/openai/deployments/${config.chatDeploymentName}`
      console.log('🔗 Using traditional Azure endpoint:', baseURL)
      _openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL,
        defaultQuery: { 'api-version': config.apiVersion },
        defaultHeaders: { 'api-key': config.apiKey },
      })
    }
  }
  return _openai
}

// Lazy-loaded OpenAI client for EMBEDDINGS (LISA document vectorization)
let _openaiEmbedding: OpenAI | null = null
export function getOpenAIEmbeddingClient(): OpenAI {
  if (!_openaiEmbedding) {
    const config = getAzureConfig()
    
    // Use custom endpoint if provided (new Azure AI Studio format)
    if (config.customEmbeddingEndpoint) {
      // Remove /embeddings if present (SDK adds it automatically)
      let baseURL = config.customEmbeddingEndpoint.replace(/\/embeddings\/?$/, '')
      baseURL = baseURL.replace(/\/$/, '') // Remove trailing slash
      
      console.log('🔗 Using custom Azure embedding endpoint:', baseURL)
      console.log('📋 Full endpoint will be:', `${baseURL}/embeddings`)
      
      _openaiEmbedding = new OpenAI({
        apiKey: config.apiKey,
        baseURL,
        defaultQuery: { 'api-version': config.apiVersion },
        defaultHeaders: { 'api-key': config.apiKey },
      })
    } else {
      // Traditional format
      const baseURL = `https://${config.resourceName}.openai.azure.com/openai/deployments/${config.embeddingDeploymentName}`
      console.log('🔗 Using traditional Azure embedding endpoint:', baseURL)
      _openaiEmbedding = new OpenAI({
        apiKey: config.apiKey,
        baseURL,
        defaultQuery: { 'api-version': config.apiVersion },
        defaultHeaders: { 'api-key': config.apiKey },
      })
    }
  }
  return _openaiEmbedding
}

// Export for backward compatibility (lazy-loaded)
// Used by: chat routes, D.A.W.N., LISA responses
export const openai = new Proxy({} as OpenAI, {
  get(target, prop) {
    return getOpenAIClient()[prop as keyof OpenAI]
  }
})

// Export embedding client for LISA document processing
// Used by: embedding service
export const openaiEmbedding = new Proxy({} as OpenAI, {
  get(target, prop) {
    return getOpenAIEmbeddingClient()[prop as keyof OpenAI]
  }
})

// Export deployment name (lazy-loaded)
export const deploymentName = process.env.AZURE_DEPLOYMENT_NAME || 'gpt-4o-mini'
export const embeddingDeploymentName = process.env.AZURE_EMBEDDING_DEPLOYMENT || 'text-embedding-3-large'

// Export configuration for debugging (lazy-loaded)
export function getConfig() {
  const config = getAzureConfig()
  return {
    resourceName: config.resourceName,
    chatDeploymentName: config.chatDeploymentName,
    embeddingDeploymentName: config.embeddingDeploymentName,
    apiVersion: config.apiVersion,
    hasApiKey: !!config.apiKey,
    customChatEndpoint: config.customChatEndpoint,
    customEmbeddingEndpoint: config.customEmbeddingEndpoint,
    endpoint: config.customChatEndpoint || `https://${config.resourceName}.openai.azure.com`,
  }
}
