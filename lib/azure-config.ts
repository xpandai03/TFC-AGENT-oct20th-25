import OpenAI from 'openai'

// Lazy-loaded configuration to avoid build-time errors
// Environment variables are only validated when actually used at runtime
function getAzureConfig() {
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const resourceName = process.env.AZURE_RESOURCE_NAME
  const deploymentName = process.env.AZURE_DEPLOYMENT_NAME
  const apiVersion = process.env.AZURE_API_VERSION || '2024-10-21'

  if (!apiKey) {
    throw new Error('Missing AZURE_OPENAI_API_KEY environment variable')
  }

  if (!resourceName) {
    throw new Error('Missing AZURE_RESOURCE_NAME environment variable')
  }

  if (!deploymentName) {
    throw new Error('Missing AZURE_DEPLOYMENT_NAME environment variable')
  }

  return {
    apiKey,
    resourceName,
    deploymentName,
    apiVersion,
  }
}

// Lazy-loaded OpenAI client
let _openai: OpenAI | null = null
export function getOpenAIClient(): OpenAI {
  if (!_openai) {
    const { apiKey, resourceName, deploymentName, apiVersion } = getAzureConfig()
    _openai = new OpenAI({
      apiKey,
      baseURL: `https://${resourceName}.openai.azure.com/openai/deployments/${deploymentName}`,
      defaultQuery: { 'api-version': apiVersion },
      defaultHeaders: { 'api-key': apiKey },
    })
  }
  return _openai
}

// Export for backward compatibility (lazy-loaded)
export const openai = new Proxy({} as OpenAI, {
  get(target, prop) {
    return getOpenAIClient()[prop as keyof OpenAI]
  }
})

// Export deployment name (lazy-loaded)
export const deploymentName = process.env.AZURE_DEPLOYMENT_NAME || ''

// Export configuration for debugging (lazy-loaded)
export function getConfig() {
  const { resourceName, deploymentName, apiVersion, apiKey } = getAzureConfig()
  return {
    resourceName,
    deploymentName,
    apiVersion,
    hasApiKey: !!apiKey,
    endpoint: `https://${resourceName}.openai.azure.com`,
  }
}
