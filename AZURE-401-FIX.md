# Azure OpenAI 401 Error - Troubleshooting Guide

## Common Causes of 401 Errors

### 1. API Key Has Quotes (MOST COMMON)

**Problem**: Railway environment variables sometimes include quotes in the value.

**Check**: In Railway, your variable might look like:
```
AZURE_OPENAI_KEY="8ya4trHgMejELBEp93Jz9kpG7MM9IgKZyEON-mkdSC2yZy4auRZXrJQQJ99BIACYeBj-FXJ3w3AAAAACOGyFzL"
```

**Fix**: Remove the quotes! It should be:
```
AZURE_OPENAI_KEY=8ya4trHgMejELBEp93Jz9kpG7MM9IgKZyEON-mkdSC2yZy4auRZXrJQQJ99BIACYeBj-FXJ3w3AAAAACOGyFzL
```

**How to check**: After redeploy, look for this in logs:
```
🔐 Authentication Debug: { hasApiKey: true, apiKeyLength: 64, apiKeyPrefix: '8ya4trHgMe...' }
```

If the length is 66 instead of 64, you have quotes!

---

### 2. Wrong API Key

**Problem**: Using the wrong API key for the endpoint.

**Fix**: 
- Go to Azure Portal → Your OpenAI Resource → Keys and Endpoint
- Copy the KEY 1 or KEY 2 (they're the same)
- Make sure you're using the key for the correct resource

---

### 3. API Key Expired or Regenerated

**Problem**: The API key was regenerated in Azure but not updated in Railway.

**Fix**: 
- Check Azure Portal to see if keys were recently regenerated
- Update Railway with the new key
- Redeploy

---

### 4. Wrong Endpoint Format

**Problem**: The endpoint doesn't match your Azure deployment.

**Current endpoint in Railway**:
```
AZURE_CHAT_ENDPOINT=https://adavi-mf694jmx-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-4o-mini/chat/completions
```

**Verify in Azure Portal**:
1. Go to Azure Portal → Your OpenAI Resource → Model deployments
2. Find your deployment (might not be `gpt-4o-mini`)
3. Click on it → Copy the endpoint
4. Update Railway with the exact endpoint

---

### 5. API Version Mismatch

**Problem**: The API version doesn't match what Azure expects.

**Current**: `AZURE_API_VERSION=2024-10-21`

**Try**: Check your Azure endpoint - it might show `api-version=2025-04-01-preview` in the URL.

**Fix**: Update Railway:
```
AZURE_API_VERSION=2025-04-01-preview
```

---

## Debugging Steps

After redeploy, check Railway logs for:

1. **API Key Detection**:
   ```
   🔑 API Key configured: 8ya4trHgMe...
   ```
   - If missing or wrong length, check for quotes

2. **Endpoint Being Used**:
   ```
   🔗 Using custom Azure endpoint: https://...
   📋 Full endpoint will be: https://.../chat/completions
   ```

3. **401 Error Details**:
   ```
   🔐 Authentication Debug: { hasApiKey: true, apiKeyLength: 64, ... }
   ```
   - Check the length matches your key length
   - Check the prefix matches your key

4. **Full Error**:
   ```
   ❌ Azure OpenAI API error: 401 Unauthorized
   Error details: { status: 401, code: '401', ... }
   ```

---

## Quick Fix Checklist

- [ ] Remove quotes from `AZURE_OPENAI_KEY` in Railway
- [ ] Verify API key matches Azure Portal
- [ ] Verify endpoint matches Azure Portal deployment endpoint
- [ ] Verify API version matches Azure endpoint
- [ ] Check deployment name is correct
- [ ] Redeploy after changes
- [ ] Check logs for authentication debug info

---

## Still Not Working?

If you still get 401 after all these checks:

1. **Regenerate API Key in Azure**:
   - Azure Portal → Your Resource → Keys and Endpoint
   - Click "Regenerate Key 1"
   - Copy the new key
   - Update Railway
   - Redeploy

2. **Check Azure Role Assignments**:
   - Make sure your Azure account has "Azure OpenAI User" role
   - Check at the resource level, not subscription level

3. **Check Network Settings**:
   - Azure Portal → Your Resource → Networking
   - Make sure "All networks" is selected (unless using private endpoints)

4. **Try Different Endpoint Format**:
   - Some Azure deployments use different endpoint formats
   - Check Azure Portal for the exact endpoint format
   - Try without `/chat/completions` in the endpoint (we remove it automatically)

