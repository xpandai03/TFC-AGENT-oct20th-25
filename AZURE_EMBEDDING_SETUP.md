# Azure OpenAI Embedding Deployment Setup

## Overview

LISA requires a **separate** Azure OpenAI deployment for generating vector embeddings. Currently, the app only has a chat deployment (`gpt-4o-mini`). You need to add an embedding deployment (`text-embedding-3-small`).

## Why This is Required

- **D.A.W.N.** uses: `gpt-4o-mini` (chat completion model)
- **LISA** uses:
  - `gpt-4o-mini` (for chat responses)
  - **`text-embedding-3-small`** (for vectorizing documents)

Azure OpenAI requires separate deployments for each model type.

## Why text-embedding-3-small (Not 3-large)

We use **text-embedding-3-small** because:
- ✅ **1536 dimensions** (works with IVFFlat index on any PostgreSQL version)
- ✅ **Faster processing** (~2x faster than 3-large)
- ✅ **Lower costs** (~5x cheaper than 3-large)
- ✅ **99% accuracy** of 3-large for business documents
- ✅ **Better compatibility** with older pgvector versions

text-embedding-3-large (3072 dimensions) requires HNSW index which may not be available on all PostgreSQL versions.

---

## Step-by-Step Setup

### Step 1: Access Azure OpenAI Studio

1. Go to: https://oai.azure.com/
2. Sign in with your Azure account
3. Select your resource: `adavi-mf694jmx-eastus2`

### Step 2: Create Embedding Deployment

1. Click **"Deployments"** in the left sidebar
2. Click **"+ Create new deployment"**
3. Configure the deployment:
   - **Model**: Select `text-embedding-3-small`
   - **Deployment name**: `text-embedding-3-small` (keep it simple)
   - **Model version**: Latest (auto-update enabled)
   - **Deployment type**: Standard
   - **Tokens per Minute Rate Limit**: 120K (or higher if available)
   - **Content filter**: Default
4. Click **"Create"**
5. Wait for deployment to complete (~1-2 minutes)

### Step 3: Verify Deployment

After creation, you should see TWO deployments in your Azure OpenAI resource:

| Deployment Name | Model | Purpose |
|----------------|-------|---------|
| `gpt-4o-mini` | gpt-4o-mini | Chat completions (D.A.W.N. + LISA) |
| `text-embedding-3-small` | text-embedding-3-small | Document embeddings (LISA only) |

### Step 4: Add Environment Variable to Render

1. Go to Render Dashboard: https://dashboard.render.com
2. Select your web service: `tfc-agent-oct20th-25`
3. Go to **"Environment"** tab
4. Click **"Add Environment Variable"** (or edit if it already exists)
5. Set:
   ```
   Key: AZURE_EMBEDDING_DEPLOYMENT
   Value: text-embedding-3-small
   ```
6. Click **"Save Changes"**
7. Render will automatically redeploy with the new env variable

### Step 5: Update Local .env.local (for development)

Add this line to your `.env.local`:

```bash
AZURE_EMBEDDING_DEPLOYMENT=text-embedding-3-small
```

---

## Cost Considerations

### Embedding Model Pricing

text-embedding-3-small pricing (as of October 2025):
- **Cost**: ~$0.00002 per 1,000 tokens (5x cheaper than 3-large!)
- **Dimensions**: 1536

### Example Costs

| Document Size | Tokens | Cost |
|---------------|--------|------|
| 1 page PDF (~500 words) | ~650 | $0.00001 |
| 10 page PDF (~5,000 words) | ~6,500 | $0.00013 |
| 50 page PDF (~25,000 words) | ~32,500 | $0.00065 |
| 100 page PDF (~50,000 words) | ~65,000 | $0.0013 |

**Chunking Strategy**:
- Documents are split into ~1,000 character chunks
- Each chunk generates one embedding
- A 50-page document = ~40-50 chunks
- Total embedding cost: ~$0.0006-0.0008 (very affordable!)

---

## Verification

After deploying, test the embedding generation:

1. Upload a small PDF (1-2 pages) to LISA
2. Check Render logs for:
   ```
   🧮 Generating embeddings for X chunks
   📦 Processing batch 1/1 (X chunks)
   ✅ Batch 1 complete
   ✅ All embeddings generated: X total
   ```
3. If successful, document status should change to "completed"
4. If failed, check logs for error messages related to Azure OpenAI API

---

## Troubleshooting

### Error: "The model `text-embedding-3-small` does not exist"

**Cause**: Deployment not created or wrong deployment name

**Fix**:
1. Verify deployment exists in Azure portal
2. Check deployment name matches exactly: `text-embedding-3-small`
3. Ensure `AZURE_EMBEDDING_DEPLOYMENT` env var is set correctly

### Error: "Rate limit exceeded"

**Cause**: Too many embedding requests in short time

**Fix**:
1. Increase "Tokens per Minute Rate Limit" in Azure deployment settings
2. Reduce batch size in embedding service (currently 100)
3. Add longer delay between batches

### Error: "Unauthorized" or "Invalid API key"

**Cause**: API key or resource name incorrect

**Fix**:
1. Verify `AZURE_OPENAI_API_KEY` is correct
2. Verify `AZURE_RESOURCE_NAME` is correct
3. Ensure API key has access to both deployments

---

## Architecture Overview

```
User Uploads PDF
    ↓
Document Processing Service (document-processor.ts)
    ↓
Extract Text (pdf-parse)
    ↓
Text Chunking Service (text-chunker.ts)
    → Split into ~1000 char chunks
    ↓
Embedding Service (embedding.ts)
    → Call Azure OpenAI API
    → Deployment: text-embedding-3-small
    → Generate 1536-dimension vectors
    ↓
Vector Storage (vector-store.ts)
    → Store chunks + embeddings in PostgreSQL
    → Use pgvector extension
    ↓
Document Status: "completed"
```

---

## Next Steps After Setup

1. Deploy latest code to Render (includes migration)
2. Add `AZURE_EMBEDDING_DEPLOYMENT` env variable
3. Wait for deployment to complete
4. Test upload with small PDF
5. Monitor logs for success
6. Test RAG query

---

## Additional Resources

- [Azure OpenAI Embeddings Docs](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/embeddings)
- [text-embedding-3-large Model Card](https://platform.openai.com/docs/models/embeddings)
- [pgvector Extension](https://github.com/pgvector/pgvector)
