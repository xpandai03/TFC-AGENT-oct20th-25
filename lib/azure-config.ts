import OpenAI from 'openai'

// Validate environment variables
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

// Create Azure OpenAI client using OpenAI SDK pointed at Azure endpoint
export const openai = new OpenAI({
  apiKey,
  baseURL: `https://${resourceName}.openai.azure.com/openai/deployments/${deploymentName}`,
  defaultQuery: { 'api-version': apiVersion },
  defaultHeaders: { 'api-key': apiKey },
})

// Export deployment name for use in API calls
export { deploymentName }

// Export configuration for debugging
export const config = {
  resourceName,
  deploymentName,
  apiVersion,
  hasApiKey: !!apiKey,
  endpoint: `https://${resourceName}.openai.azure.com`,
}
