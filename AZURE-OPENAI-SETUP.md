# Azure OpenAI Configuration Guide

## Required Environment Variables

Based on your Azure setup, you need to configure the following environment variables in Railway:

### Option 1: New Azure AI Studio Format (Recommended)

If you're using Azure AI Studio with custom endpoints:

```bash
# API Key (use the key from your Azure portal)
AZURE_OPENAI_API_KEY=8ya4trHgMejELBEp93Jz9kpG7MM9IgKZyEON-mkdSC2yZy4auRZXrJQQJ99BIACYeBj-FXJ3w3AAAAACOGyFzL

# Chat Endpoint (for DAWN and LISA responses)
# Format: https://{resource}.cognitiveservices.azure.com/openai/deployments/{deployment}/chat/completions
# OR: https://{resource}.services.ai.azure.com/api/projects/{project}/deployments/{deployment}/chat/completions
AZURE_CHAT_ENDPOINT=https://adavi-mf694jmx-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-4o-mini/chat/completions

# Embedding Endpoint (for LISA document processing)
AZURE_EMBEDDING_ENDPOINT=https://rag-project-tfc.cognitiveservices.azure.com/openai/deployments/text-embedding-3-large/embeddings

# API Version
AZURE_API_VERSION=2024-10-21
# OR for newer endpoints: 2025-04-01-preview
```

### Option 2: Traditional Format

If you're using the traditional Azure OpenAI format:

```bash
AZURE_OPENAI_API_KEY=your-api-key
AZURE_RESOURCE_NAME=your-resource-name
AZURE_DEPLOYMENT_NAME=gpt-4o-mini
AZURE_EMBEDDING_DEPLOYMENT=text-embedding-3-large
AZURE_API_VERSION=2024-10-21
```

## Endpoint Formats

### Chat Endpoint Examples

**Traditional:**
```
https://{resource-name}.openai.azure.com/openai/deployments/{deployment-name}/chat/completions
```

**Azure AI Studio:**
```
https://{resource}.cognitiveservices.azure.com/openai/deployments/{deployment}/chat/completions
```

**Azure AI Studio (Project-based):**
```
https://{resource}.services.ai.azure.com/api/projects/{project}/deployments/{deployment}/chat/completions
```

### Embedding Endpoint Examples

**Traditional:**
```
https://{resource-name}.openai.azure.com/openai/deployments/{deployment-name}/embeddings
```

**Azure AI Studio:**
```
https://{resource}.cognitiveservices.azure.com/openai/deployments/{deployment}/embeddings
```

## From Your Screenshots

Based on the images you shared:

### Chat Configuration
- **API Key**: `8ya4trHgMejELBEp93Jz9kpG7MM9IgKZyEON-mkdSC2yZy4auRZXrJQQJ99BIACYeBj-FXJ3w3AAAAACOGyFzL`
- **Endpoint**: `https://adavi-mf694jmx-eastus2.cognitiveservices.azure.com/openai/responses?api-version=2025-04-01-preview`
  - **Note**: This endpoint format might need adjustment. Try:
    - `https://adavi-mf694jmx-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-4o-mini/chat/completions`
    - Or check your Azure portal for the exact deployment endpoint

### Embedding Configuration
- **API Key**: `8ya4trHgMejELBEp93Jz9kpG7MM9IgKZyEON-mkdSC2yZy4auRZXrJQQJ99BIACYeBj-FXJ3w3AAAAACOGyFzL`
- **Endpoint**: `https://rag-project-tfc.cognitiveservices.azure.com/openai/deployments/text-embedding-3-large/embeddings?api-version=2023-05-15`
  - **Note**: The API version in the URL (2023-05-15) might need to match `AZURE_API_VERSION`

## Setting in Railway

1. Go to Railway Dashboard → Your Service → Variables
2. Add each environment variable
3. Make sure there are no extra quotes or spaces
4. Redeploy the service

## Testing

After setting the variables, check Railway logs for:
- `🔗 Using custom Azure endpoint:` - confirms endpoint is being used
- `✅ Azure OpenAI response received` - confirms API calls are working
- Any error messages with details about what's wrong

## Troubleshooting

### Error: "Missing AZURE_OPENAI_API_KEY"
- Make sure the variable is set in Railway
- Check for typos in the variable name
- Ensure no extra quotes around the value

### Error: "401 Unauthorized"
- API key is incorrect or expired
- Check the key in Azure portal
- Make sure you're using the right key for the right endpoint

### Error: "404 Not Found"
- Endpoint URL is incorrect
- Deployment name doesn't exist
- Check the exact endpoint format in Azure portal

### Error: "Invalid model"
- Deployment name doesn't match what's in Azure
- Check deployment names in Azure portal
- Make sure the deployment is active and accessible

## Quick Test

You can test the configuration by calling the chat API:

```bash
curl -X POST https://your-railway-app.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "message": "Hello, can you hear me?",
    "agentType": "dawn",
    "history": []
  }'
```

Check Railway logs to see if the Azure OpenAI API is being called successfully.

