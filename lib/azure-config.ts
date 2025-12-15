import OpenAI from 'openai'

// Lazy-loaded configuration to avoid build-time errors
// Environment variables are only validated when actually used at runtime
function getAzureConfig() {
  // Support both AZURE_OPENAI_API_KEY and AZURE_OPENAI_KEY for compatibility
  const apiKey = process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_KEY
  const resourceName = process.env.AZURE_RESOURCE_NAME
  const chatDeploymentName = process.env.AZURE_DEPLOYMENT_NAME
  const embeddingDeploymentName = process.env.AZURE_EMBEDDING_DEPLOYMENT || 'text-embedding-3-large'
  const apiVersion = process.env.AZURE_API_VERSION || '2024-10-21'
  
  // Support for new Azure AI Studio endpoint format
  const customEndpoint = process.env.AZURE_OPENAI_ENDPOINT
  const customChatEndpoint = process.env.AZURE_CHAT_ENDPOINT
  const customEmbeddingEndpoint = process.env.AZURE_EMBEDDING_ENDPOINT

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
      console.log('🔗 Using custom Azure endpoint:', config.customChatEndpoint)
      _openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.customChatEndpoint.replace(/\/$/, ''), // Remove trailing slash
        defaultQuery: { 'api-version': config.apiVersion },
        defaultHeaders: { 'api-key': config.apiKey },
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
      console.log('🔗 Using custom Azure embedding endpoint:', config.customEmbeddingEndpoint)
      _openaiEmbedding = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.customEmbeddingEndpoint.replace(/\/$/, ''), // Remove trailing slash
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
