import OpenAI from 'openai'

// Lazy-loaded configuration to avoid build-time errors
// Environment variables are only validated when actually used at runtime
function getAzureConfig() {
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const resourceName = process.env.AZURE_RESOURCE_NAME
  const chatDeploymentName = process.env.AZURE_DEPLOYMENT_NAME
  const embeddingDeploymentName = process.env.AZURE_EMBEDDING_DEPLOYMENT || 'text-embedding-3-large'
  const apiVersion = process.env.AZURE_API_VERSION || '2024-10-21'

  if (!apiKey) {
    throw new Error('Missing AZURE_OPENAI_API_KEY environment variable')
  }

  if (!resourceName) {
    throw new Error('Missing AZURE_RESOURCE_NAME environment variable')
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
  }
}

// Lazy-loaded OpenAI client for CHAT (D.A.W.N. + LISA responses)
let _openai: OpenAI | null = null
export function getOpenAIClient(): OpenAI {
  if (!_openai) {
    const { apiKey, resourceName, chatDeploymentName, apiVersion } = getAzureConfig()
    _openai = new OpenAI({
      apiKey,
      baseURL: `https://${resourceName}.openai.azure.com/openai/deployments/${chatDeploymentName}`,
      defaultQuery: { 'api-version': apiVersion },
      defaultHeaders: { 'api-key': apiKey },
    })
  }
  return _openai
}

// Lazy-loaded OpenAI client for EMBEDDINGS (LISA document vectorization)
let _openaiEmbedding: OpenAI | null = null
export function getOpenAIEmbeddingClient(): OpenAI {
  if (!_openaiEmbedding) {
    const { apiKey, resourceName, embeddingDeploymentName, apiVersion } = getAzureConfig()
    _openaiEmbedding = new OpenAI({
      apiKey,
      baseURL: `https://${resourceName}.openai.azure.com/openai/deployments/${embeddingDeploymentName}`,
      defaultQuery: { 'api-version': apiVersion },
      defaultHeaders: { 'api-key': apiKey },
    })
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
export const deploymentName = process.env.AZURE_DEPLOYMENT_NAME || ''
export const embeddingDeploymentName = process.env.AZURE_EMBEDDING_DEPLOYMENT || 'text-embedding-3-large'

// Export configuration for debugging (lazy-loaded)
export function getConfig() {
  const { resourceName, chatDeploymentName, embeddingDeploymentName, apiVersion, apiKey } = getAzureConfig()
  return {
    resourceName,
    chatDeploymentName,
    embeddingDeploymentName,
    apiVersion,
    hasApiKey: !!apiKey,
    endpoint: `https://${resourceName}.openai.azure.com`,
  }
}
