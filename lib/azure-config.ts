import { createAzure } from '@ai-sdk/azure'

// Validate environment variables
const apiKey = process.env.AZURE_OPENAI_API_KEY
const resourceName = process.env.AZURE_RESOURCE_NAME
const deploymentName = process.env.AZURE_DEPLOYMENT_NAME

if (!apiKey) {
  throw new Error('Missing AZURE_OPENAI_API_KEY environment variable')
}

if (!resourceName) {
  throw new Error('Missing AZURE_RESOURCE_NAME environment variable')
}

if (!deploymentName) {
  throw new Error('Missing AZURE_DEPLOYMENT_NAME environment variable')
}

// Create Azure provider
export const azure = createAzure({
  apiKey,
  resourceName,
})

// Export configured model
export const model = azure(deploymentName)

// Export for debugging
export const config = {
  resourceName,
  deploymentName,
  hasApiKey: !!apiKey,
}
