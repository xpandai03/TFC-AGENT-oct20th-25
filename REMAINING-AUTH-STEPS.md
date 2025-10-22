# Remaining Authentication Steps - STREAMLINED
## Microsoft Teams Auth for DAWN - Minimal Steps to Go Live

**Current Status:** ✅ Azure AD app already configured, credentials in Render
**Time to Complete:** 30-40 minutes
**Risk Level:** Low (most code already written)

---

## ✅ What You Already Have

Based on your Render environment variables screenshot:

1. ✅ Azure AD app registration created
2. ✅ `AZURE_AD_CLIENT_ID` = f096923f-8dac-4790-8f40-febc2d9e972f
3. ✅ `AZURE_AD_CLIENT_SECRET` = 1q180~1zxMP+PND883TPz-1Mr1WnnR9z5Jb3dc15
4. ✅ `AZURE_AD_TENANT_ID` = 78bfcc3f-4c06-4c5b-9df9-f33095ced7ef
5. ✅ `AZURE_DEPLOYMENT_NAME` = gpt-4o-mini (ADDED!)
6. ✅ Azure OpenAI fully configured
7. ✅ Auth code written (just commented out)
8. ✅ Middleware written (just disabled)
9. ✅ Sign-in page created
10. ✅ Audit logging infrastructure ready

---

## ❌ What's Missing (Only 3 Things!)

1. ❌ `NEXTAUTH_URL` environment variable (not in Render)
2. ❌ `NEXTAUTH_SECRET` environment variable (not in Render)
3. ❌ Azure AD redirect URI verification (need to check/update)

---

## 🎯 THE LEAN 4-STEP PLAN

### Step 1: Verify Azure AD Redirect URI (5 min)

**What:** Ensure Azure AD knows where to redirect after login.

**Steps:**

1. Go to Azure Portal: https://portal.azure.com
2. Navigate to: Azure Active Directory → App registrations
3. Find your app: "TFC AGENT" or similar (with Client ID: f096923f-8dac-4790-8f40-febc2d9e972f)
4. Click on it
5. Go to: **Authentication** (left sidebar)
6. Under "Platform configurations" → "Web" → "Redirect URIs"
7. **Verify this exact URI exists:**
   ```
   https://tfc-agent-oct20th-25.onrender.com/api/auth/callback/azure-ad
   ```
8. **If it doesn't exist or is wrong:**
   - Click "Add URI"
   - Enter: `https://tfc-agent-oct20th-25.onrender.com/api/auth/callback/azure-ad`
   - Click "Save" at the bottom

**Why this matters:** If the redirect URI doesn't match exactly, Azure will reject the login with "redirect_uri_mismatch" error.

✅ **Checkpoint:** Redirect URI is configured correctly.

---

### Step 2: Add Missing Environment Variables to Render (5 min)

**What:** Add NEXTAUTH_URL and NEXTAUTH_SECRET to Render.

**Steps:**

1. **Generate NEXTAUTH_SECRET**

   Run this command locally:
   ```bash
   openssl rand -base64 32
   ```

   Copy the output (will look like: `kX9j2L8mP5vQ3wR7nT1cY4bZ6hA0sD9fE8gH5iJ2kL3m`)

2. **Go to Render Dashboard**
   - URL: https://dashboard.render.com/web/srv-d3b0duuk2ga73bvc77g
   - Click "Environment" in left sidebar
   - Click "Edit" button

3. **Add these TWO new variables:**

   Add to the bottom of the list:
   ```
   NEXTAUTH_URL = https://tfc-agent-oct20th-25.onrender.com
   NEXTAUTH_SECRET = <paste the value from openssl command>
   ```

4. **Click "Save Changes"**
   - Render will NOT auto-deploy yet (we haven't pushed code changes)
   - This just prepares the environment

**Example:**
```
NEXTAUTH_URL=https://tfc-agent-oct20th-25.onrender.com
NEXTAUTH_SECRET=kX9j2L8mP5vQ3wR7nT1cY4bZ6hA0sD9fE8gH5iJ2kL3m
```

✅ **Checkpoint:** All environment variables configured.

---

### Step 3: Enable Authentication in Code (15 min)

**What:** Uncomment all the auth code we temporarily disabled in Phase 1.

**File Changes:**

#### 3A. Re-enable Middleware (2 min)

```bash
# Rename the file to activate route protection
mv middleware.ts.DISABLED middleware.ts

# Verify it exists
ls -la middleware.ts
```

#### 3B. Uncomment Auth in Chat API (5 min)

**File:** `app/api/chat/route.ts`

**Change 1** - Uncomment imports (lines 2-3):
```typescript
// FROM:
// import { auth } from '@/auth'
// import { logChatAccess, logToolCall } from '@/lib/audit/logger'

// TO:
import { auth } from '@/auth'
import { logChatAccess, logToolCall } from '@/lib/audit/logger'
```

**Change 2** - Add session check (after line 17, after `const { message, history } = body`):
```typescript
// Add this right after: const { message, history } = body

const session = await auth()
if (!session?.user?.email) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized - Please sign in' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  )
}

const userEmail = session.user.email
console.log('👤 Authenticated user:', userEmail)
```

**Change 3** - Add chat access logging (after userEmail is defined):
```typescript
// Add right after: const userEmail = session.user.email

logChatAccess(userEmail, message)
```

**Change 4** - Uncomment tool call logging (line 113):
```typescript
// FROM:
// TEMPORARY: Audit logging disabled for Phase 1
// logToolCall(userEmail, toolCall.function.name, args, result)

// TO:
logToolCall(userEmail, toolCall.function.name, args, result)
```

**Change 5** - Uncomment error logging (line 130):
```typescript
// FROM:
// TEMPORARY: Audit logging disabled for Phase 1
// logToolCall(userEmail, toolCall.function.name, {}, errorResult)

// TO:
logToolCall(userEmail, toolCall.function.name, {}, errorResult)
```

#### 3C. Test Build Locally (5 min)

First, add the NextAuth variables to your local .env.local:

```bash
# Add to .env.local
echo "NEXTAUTH_URL=http://localhost:3002" >> .env.local
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.local

# Also add Azure AD variables (copy from Render screenshot)
echo "AZURE_AD_CLIENT_ID=f096923f-8dac-4790-8f40-febc2d9e972f" >> .env.local
echo "AZURE_AD_CLIENT_SECRET=1q180~1zxMP+PND883TPz-1Mr1WnnR9z5Jb3dc15" >> .env.local
echo "AZURE_AD_TENANT_ID=78bfcc3f-4c06-4c5b-9df9-f33095ced7ef" >> .env.local
```

Then test the build:

```bash
# Clean build
rm -rf .next

# Build without errors
npm run build
```

Expected output: ✓ Compiled successfully

**Note:** You'll see NextAuth warnings about missing secrets during dev, but build should succeed.

#### 3D. Commit and Push (3 min)

```bash
git add -A

git commit -m "Phase 2: Enable Microsoft Teams authentication

Re-enabled authentication system for production:
- Activated route protection middleware
- Uncommented session checks in chat API
- Restored HIPAA audit logging with user emails
- All env vars configured in Render

Users will now need to sign in with Microsoft Teams credentials to access DAWN."

git push origin main
```

✅ **Checkpoint:** Code changes deployed to Render.

---

### Step 4: Test Full Authentication Flow (10 min)

**What:** Verify end-to-end Microsoft login works.

**Testing Steps:**

1. **Wait for Render Deploy** (2-3 min)
   - Go to Render Dashboard → Events
   - Wait for build to complete
   - Should see "Deploy succeeded" message

2. **Test Unauthenticated Redirect**
   - Open incognito/private browser window
   - Visit: https://tfc-agent-oct20th-25.onrender.com
   - ✅ Should redirect to `/auth/signin` page
   - ✅ Should see "Sign in with Microsoft" button

3. **Test Microsoft Login**
   - Click "Sign in with Microsoft"
   - ✅ Should redirect to Microsoft login page
   - Enter your Microsoft Teams email and password
   - ✅ Should complete authentication
   - ✅ Should redirect back to DAWN chat interface

4. **Test Authenticated Session**
   - ✅ Should see DAWN interface (not redirected to sign-in)
   - ✅ Send test message: "Hello DAWN"
   - ✅ Should get AI response

5. **Test Tool Calling**
   - ✅ Send: "Update Reyna Vargas status to Waitlist"
   - ✅ Should attempt tool execution (check Render logs)

6. **Test Audit Logging**
   - Go to Render Dashboard → Logs
   - ✅ Search for: `"type": "AUDIT"`
   - ✅ Should see entries with your email: `"userEmail": "your-email@..."`
   - ✅ Should log `"action": "CHAT_ACCESS"` when you send messages
   - ✅ Should log `"action": "TOOL_CALL"` when tools are executed

7. **Test Session Persistence**
   - Refresh the page (F5 or Cmd+R)
   - ✅ Should remain logged in (not redirected to sign-in)
   - ✅ Can send messages without re-authenticating

8. **Test Health Check (No Auth Required)**
   - Open new incognito window
   - Visit: https://tfc-agent-oct20th-25.onrender.com/api/health
   - ✅ Should return JSON health status WITHOUT requiring login
   - ✅ Status should be "healthy"

✅ **Checkpoint:** Authentication fully working!

---

## 🚨 Common Issues & Quick Fixes

### Issue: "Redirect URI mismatch" error

**Error message:** `AADSTS50011: The redirect URI 'https://...' does not match...`

**Fix:**
1. Go to Azure AD app → Authentication
2. Verify redirect URI is EXACTLY: `https://tfc-agent-oct20th-25.onrender.com/api/auth/callback/azure-ad`
3. Must be HTTPS, exact domain, exact path (case-sensitive!)
4. Click "Save"
5. Try again immediately (no need to redeploy)

---

### Issue: "Missing NEXTAUTH_SECRET" error in Render logs

**Error message:** `[auth][error] MissingSecret: Please define a 'secret'`

**Fix:**
1. Verify NEXTAUTH_SECRET is in Render environment variables
2. Go to Render Dashboard → Environment → Edit
3. Make sure NEXTAUTH_SECRET exists and has a value (32+ characters)
4. Save and wait for auto-redeploy

---

### Issue: "401 Unauthorized" when sending messages

**Symptom:** Can access DAWN interface but get "unauthorized" error when trying to chat

**Fix:**
1. Check Render logs for auth errors
2. Verify session is being created (look for `👤 Authenticated user:` in logs)
3. Try signing out and back in
4. Clear browser cookies and try again

---

### Issue: No audit logs appearing in Render

**Symptom:** Authentication works but no `"type": "AUDIT"` entries in logs

**Fix:**
1. Wait 2-3 minutes for logs to flush (Render buffers logs)
2. Use log filter in Render: search for `AUDIT`
3. Verify code was uncommented correctly (check lines 113 and 130 in route.ts)
4. Try sending a message to trigger logging

---

### Issue: Session expires immediately / keeps redirecting to sign-in

**Symptom:** Login works but immediately redirects back to sign-in page

**Fix:**
1. Check browser console for cookie errors
2. Verify NEXTAUTH_URL matches your actual domain (no trailing slash)
3. Ensure you're using HTTPS (not HTTP)
4. Clear all cookies for the domain and try again
5. Check that middleware.ts exists (not middleware.ts.DISABLED)

---

## ✅ Success Checklist

Authentication is fully implemented when ALL of these are true:

- [ ] Azure AD redirect URI configured with correct URL
- [ ] NEXTAUTH_URL added to Render env vars
- [ ] NEXTAUTH_SECRET added to Render env vars
- [ ] middleware.ts exists (not .DISABLED)
- [ ] Auth imports uncommented in route.ts
- [ ] Session check uncommented in route.ts
- [ ] logChatAccess uncommented in route.ts
- [ ] Both logToolCall calls uncommented in route.ts
- [ ] Code committed and pushed to GitHub
- [ ] Render build succeeded
- [ ] Unauthenticated users redirected to sign-in
- [ ] Can sign in with Microsoft credentials
- [ ] Redirects to DAWN after successful login
- [ ] Can send messages after authentication
- [ ] Tool calling works
- [ ] Audit logs visible in Render with user email
- [ ] Session persists across page refreshes
- [ ] Health check works without authentication

---

## 📊 Quick Reference: Files Modified

| File | Change | Why |
|------|--------|-----|
| `middleware.ts.DISABLED` → `middleware.ts` | Rename | Enable route protection |
| `app/api/chat/route.ts` | Uncomment lines 2-3 | Import auth functions |
| `app/api/chat/route.ts` | Add session check after line 17 | Require authentication |
| `app/api/chat/route.ts` | Uncomment line 113 | Log successful tool calls |
| `app/api/chat/route.ts` | Uncomment line 130 | Log failed tool calls |
| `.env.local` | Add NextAuth variables | Test locally |
| Render Dashboard | Add NEXTAUTH_URL | Production config |
| Render Dashboard | Add NEXTAUTH_SECRET | Production config |
| Azure AD Portal | Verify redirect URI | Enable OAuth flow |

---

## 🎯 Timeline

| Step | Task | Time | Cumulative |
|------|------|------|------------|
| 1 | Verify Azure AD redirect URI | 5 min | 5 min |
| 2 | Add env vars to Render | 5 min | 10 min |
| 3 | Enable auth in code | 15 min | 25 min |
| 4 | Test full flow | 10 min | **35 min** |

**Total: ~35 minutes** (much faster than original plan since Azure AD is already set up!)

---

## 🚀 After Authentication Works

Optional enhancements to do later:

1. **Add Logout Button**
   - Import and call `signOut()` from NextAuth
   - Add button to Header or Settings

2. **Display Real User Info**
   - Replace "John Doe" placeholder in sidebar
   - Show actual user name/email from session

3. **Sign HIPAA BAA with Render**
   - Contact Render support
   - Upgrade to Standard plan if needed
   - Sign Business Associate Agreement

4. **Production Monitoring**
   - Set up log alerts for auth failures
   - Monitor session duration and timeouts
   - Track audit log completeness

---

**Ready to implement?** Start with Step 1: Verify Azure AD redirect URI

**Questions?** Check the troubleshooting section above.

**Last Updated:** October 22, 2025
**Status:** Ready for implementation
**Estimated Time:** 35 minutes
