# Microsoft Teams Authentication Implementation Plan
## DAWN AI Assistant - Phase 2: Add Authentication

**Goal:** Enable Microsoft Teams/Azure AD authentication for DAWN with the leanest possible implementation.

**Timeline:** ~1 hour total
**Complexity:** Low (most code already written, just needs to be enabled)

---

## 📊 Current State

### ✅ Already Implemented (Phase 1)
- NextAuth.js v5 installed and configured
- Azure AD provider configured in `auth.ts`
- Route protection middleware written (currently disabled as `middleware.ts.DISABLED`)
- Sign-in page created (`app/auth/signin/page.tsx`)
- Audit logging infrastructure ready (`lib/audit/logger.ts`)
- Environment variables defined in `render.yaml`

### ❌ Not Yet Active
- Route protection (middleware disabled)
- Session checks in API routes (commented out)
- Audit logging (commented out)
- Azure AD app registration (not created yet)

---

## 🎯 The Lean Path to Authentication

This is an **incremental rollout** strategy - enable one piece at a time, test, then move to the next.

### Prerequisites (Before Any Code Changes)
1. Access to Azure Portal with permissions to create App Registrations
2. Access to Render dashboard to set environment variables
3. DAWN already deployed and working on Render (Phase 1 complete)

---

## 📋 Implementation Steps

### Step 1: Azure AD App Registration (15 min)

**What:** Create an Azure AD app registration that represents DAWN and allows Microsoft sign-in.

**Where:** Azure Portal → Azure Active Directory → App Registrations

**Detailed Steps:**

1. **Navigate to Azure Portal**
   - Go to https://portal.azure.com
   - Search for "Azure Active Directory" or "Microsoft Entra ID"
   - Click "App registrations" in left sidebar

2. **Create New Registration**
   - Click "New registration"
   - **Name:** `DAWN AI Assistant` (or your preferred name)
   - **Supported account types:** Choose one:
     - `Accounts in this organizational directory only` (Single tenant - most secure for internal use)
     - `Accounts in any organizational directory` (Multi-tenant - if you want to allow other orgs)
   - **Redirect URI:**
     - Platform: `Web`
     - URI: `https://tfc-agent-oct20th-25.onrender.com/api/auth/callback/azure-ad`
   - Click "Register"

3. **Copy Application (client) ID**
   - On the app's Overview page, copy the "Application (client) ID"
   - Save this - you'll need it for `AZURE_AD_CLIENT_ID`

4. **Copy Directory (tenant) ID**
   - On the same Overview page, copy the "Directory (tenant) ID"
   - Save this - you'll need it for `AZURE_AD_TENANT_ID`

5. **Create Client Secret**
   - Click "Certificates & secrets" in left sidebar
   - Click "New client secret"
   - **Description:** `DAWN Production Secret`
   - **Expires:** Choose based on your security policy (recommended: 6 months or 1 year)
   - Click "Add"
   - **IMMEDIATELY copy the secret Value** (you won't be able to see it again!)
   - Save this - you'll need it for `AZURE_AD_CLIENT_SECRET`

6. **Configure API Permissions (Optional but Recommended)**
   - Click "API permissions" in left sidebar
   - Should already have `User.Read` under Microsoft Graph
   - This allows reading basic profile info (name, email)
   - Click "Grant admin consent" if you have permissions (makes onboarding smoother for users)

7. **Configure Token Configuration (Optional)**
   - Click "Token configuration" in left sidebar
   - Click "Add optional claim"
   - Token type: `ID`
   - Select: `email`, `preferred_username`
   - This ensures email is included in the token

**Outputs from Step 1:**
```
AZURE_AD_CLIENT_ID=f096923f-8dac-4790-8f40-febc2d9e972f
AZURE_AD_CLIENT_SECRET=1q180~1zxMP+PND883TPz-1Mr1WnnR9z5Jb3dc15
AZURE_AD_TENANT_ID=78bfcc3f-4c06-4c5b-9df9-f33095ced7ef
```

---

### Step 2: Add Environment Variables to Render (5 min)

**What:** Configure Render with Azure AD credentials and NextAuth secret.

**Where:** Render Dashboard → Environment tab

**Steps:**

1. **Go to Render Dashboard**
   - Navigate to: https://dashboard.render.com/web/srv-d3b0duuk2ga73bvc77g
   - Click "Environment" in left sidebar

2. **Add/Update Variables** (Click "Edit")

   Add these NEW variables:
   ```
   NEXTAUTH_URL=https://tfc-agent-oct20th-25.onrender.com
   NEXTAUTH_SECRET=<generate a random 32-character string>
   ```

   Your Azure AD variables should already be there from Phase 1, but verify/update:
   ```
   AZURE_AD_CLIENT_ID=<from Step 1>
   AZURE_AD_CLIENT_SECRET=<from Step 1>
   AZURE_AD_TENANT_ID=<from Step 1>
   ```

3. **Generate NEXTAUTH_SECRET**

   Run this locally to generate a secure secret:
   ```bash
   openssl rand -base64 32
   ```

   Or use an online generator: https://generate-secret.vercel.app/32

4. **Save Changes**
   - Click "Save Changes"
   - Render will NOT auto-redeploy yet (we haven't pushed code changes)

**✅ Checkpoint:** Environment variables are configured in Render.

---

### Step 3: Re-enable Route Protection Middleware (5 min)

**What:** Activate the middleware that redirects unauthenticated users to sign-in page.

**Steps:**

1. **Rename middleware file**
   ```bash
   mv middleware.ts.DISABLED middleware.ts
   ```

2. **Test locally** (optional but recommended)
   ```bash
   # Add NEXTAUTH_SECRET to your .env.local
   echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.local

   # Add NEXTAUTH_URL to your .env.local
   echo "NEXTAUTH_URL=http://localhost:3002" >> .env.local

   # Restart dev server and test
   npm run dev
   ```

   Expected behavior:
   - Visiting http://localhost:3002 should redirect to `/auth/signin`
   - Health check http://localhost:3002/api/health should still work without auth

3. **Commit and push**
   ```bash
   git add middleware.ts
   git commit -m "Phase 2 Step 1: Re-enable authentication middleware"
   git push origin main
   ```

4. **Monitor Render deployment**
   - Watch the build in Render dashboard
   - Should complete successfully (build already passed with middleware enabled before)

5. **Test deployed app**
   - Visit: https://tfc-agent-oct20th-25.onrender.com
   - Should redirect to `/auth/signin`
   - Should see "Sign in with Microsoft" button
   - **Don't click it yet** - auth flow won't work until we uncomment auth checks

**✅ Checkpoint:** Unauthenticated users are redirected to sign-in page.

---

### Step 4: Re-enable Authentication in Chat API (10 min)

**What:** Uncomment the session check in the chat API so only authenticated users can send messages.

**File:** `app/api/chat/route.ts`

**Changes:**

1. **Uncomment auth import** (line 2)
   ```typescript
   // FROM:
   // import { auth } from '@/auth'

   // TO:
   import { auth } from '@/auth'
   ```

2. **Uncomment session check** (add after line 16)
   ```typescript
   // Add this after: const { message, history } = body

   const session = await auth()
   if (!session?.user?.email) {
     return new Response(
       JSON.stringify({ error: 'Unauthorized - Please sign in' }),
       { status: 401, headers: { 'Content-Type': 'application/json' } }
     )
   }

   const userEmail = session.user.email
   ```

3. **Test locally**
   ```bash
   npm run dev
   ```

   Expected behavior:
   - Chat API should return 401 Unauthorized if called without session
   - After clicking "Sign in with Microsoft" you should get an error (Azure AD not configured locally)
   - This is expected - we'll test on Render where Azure AD is configured

4. **Commit and push**
   ```bash
   git add app/api/chat/route.ts
   git commit -m "Phase 2 Step 2: Re-enable session check in chat API"
   git push origin main
   ```

**✅ Checkpoint:** Chat API requires authentication.

---

### Step 5: Re-enable Audit Logging (10 min)

**What:** Uncomment audit logging calls to track who accesses PHI and calls tools.

**File:** `app/api/chat/route.ts`

**Changes:**

1. **Uncomment audit logging import** (line 3)
   ```typescript
   // FROM:
   // import { logChatAccess, logToolCall } from '@/lib/audit/logger'

   // TO:
   import { logChatAccess, logToolCall } from '@/lib/audit/logger'
   ```

2. **Uncomment logChatAccess call** (around line 30, after userEmail is defined)
   ```typescript
   // Add after: const userEmail = session.user.email

   logChatAccess(userEmail, message)
   ```

3. **Uncomment logToolCall calls** (2 places in tool execution loop)

   **Success case** (around line 113):
   ```typescript
   // FROM:
   // TEMPORARY: Audit logging disabled for Phase 1
   // logToolCall(userEmail, toolCall.function.name, args, result)

   // TO:
   logToolCall(userEmail, toolCall.function.name, args, result)
   ```

   **Error case** (around line 130):
   ```typescript
   // FROM:
   // TEMPORARY: Audit logging disabled for Phase 1
   // logToolCall(userEmail, toolCall.function.name, {}, errorResult)

   // TO:
   logToolCall(userEmail, toolCall.function.name, {}, errorResult)
   ```

4. **Commit and push**
   ```bash
   git add app/api/chat/route.ts
   git commit -m "Phase 2 Step 3: Re-enable HIPAA audit logging"
   git push origin main
   ```

**✅ Checkpoint:** All PHI access is logged with user email.

---

### Step 6: Test Full Authentication Flow (20 min)

**What:** Verify end-to-end authentication with Azure AD.

**Testing Checklist:**

1. **Test Redirect to Sign-In**
   - Visit: https://tfc-agent-oct20th-25.onrender.com
   - ✅ Should redirect to `/auth/signin`
   - ✅ Should see "Sign in with Microsoft" button

2. **Test Microsoft Sign-In**
   - Click "Sign in with Microsoft"
   - ✅ Should redirect to Microsoft login page
   - ✅ Enter your Microsoft/Teams credentials
   - ✅ Should redirect back to DAWN after successful login

3. **Test Authenticated Access**
   - ✅ Should land on DAWN chat interface
   - ✅ Should NOT see sign-in page
   - ✅ Send a test message: "Hello DAWN"
   - ✅ Should get a response (Azure OpenAI working)

4. **Test Tool Calling**
   - ✅ Send: "Update Reyna Vargas status to Waitlist"
   - ✅ Should call the tool (check Render logs)
   - ✅ Should see tool execution in logs

5. **Test Audit Logging**
   - Go to Render Dashboard → Logs
   - ✅ Should see `"type": "AUDIT"` entries
   - ✅ Should include your email: `"userEmail": "your-email@domain.com"`
   - ✅ Should log `"action": "CHAT_ACCESS"` for messages
   - ✅ Should log `"action": "TOOL_CALL"` for tool executions

6. **Test Session Persistence**
   - Refresh the page
   - ✅ Should remain logged in (not redirected to sign-in)
   - ✅ Can send messages without re-authenticating

7. **Test Logout (Optional - requires adding logout button)**
   - Currently no logout button in UI
   - Can test by clearing cookies or waiting 8 hours
   - ✅ After 8 hours, should auto-logout and redirect to sign-in

8. **Test Health Check (Unauthenticated)**
   - Visit in incognito/private window: https://tfc-agent-oct20th-25.onrender.com/api/health
   - ✅ Should return health status WITHOUT requiring authentication
   - ✅ This is important for Render monitoring

**✅ Checkpoint:** Full authentication flow working end-to-end.

---

## 🎉 Success Criteria

Phase 2 is complete when ALL of these are true:

- [ ] Unauthenticated users redirected to `/auth/signin`
- [ ] "Sign in with Microsoft" button works
- [ ] Users can authenticate with Microsoft Teams credentials
- [ ] Authenticated users can use DAWN chat interface
- [ ] Tool calling works for authenticated users
- [ ] Audit logs capture user email for all PHI access
- [ ] Session persists across page refreshes
- [ ] Auto-logout after 8 hours
- [ ] Health check works without authentication
- [ ] No errors in Render logs

---

## 🔧 Troubleshooting

### Issue: "Redirect URI mismatch" error from Azure AD

**Cause:** The redirect URI in Azure AD app registration doesn't match what NextAuth is sending.

**Fix:**
1. Check the error message for the actual redirect URI being used
2. Go to Azure AD app registration → Authentication
3. Ensure redirect URI is EXACTLY: `https://tfc-agent-oct20th-25.onrender.com/api/auth/callback/azure-ad`
4. Note: Must be HTTPS, exact domain, exact path

### Issue: "Invalid client secret" error

**Cause:** Client secret expired or incorrect.

**Fix:**
1. Go to Azure AD app registration → Certificates & secrets
2. Check if secret has expired
3. Create a new secret if needed
4. Update `AZURE_AD_CLIENT_SECRET` in Render environment variables
5. Redeploy (or wait for auto-deploy)

### Issue: Users from other domains can't sign in

**Cause:** App registration is configured for single tenant only.

**Fix:**
1. Go to Azure AD app registration → Authentication
2. Under "Supported account types":
   - For single org only: `Accounts in this organizational directory only`
   - For any Microsoft account: `Accounts in any organizational directory`
3. Note: Changing this may require re-consent from users

### Issue: Email not included in session

**Cause:** Email claim not requested in token configuration.

**Fix:**
1. Go to Azure AD app registration → Token configuration
2. Add optional claim: `email`
3. May need to add Microsoft Graph API permission: `User.Read`
4. Grant admin consent if required

### Issue: Session not persisting across refreshes

**Cause:** `NEXTAUTH_SECRET` not set or cookies not working.

**Fix:**
1. Verify `NEXTAUTH_SECRET` is set in Render environment variables
2. Verify `NEXTAUTH_URL` matches your actual domain
3. Check browser console for cookie errors
4. Ensure site is HTTPS (required for secure cookies)

### Issue: Audit logs not appearing in Render

**Cause:** Logs using `console.log` which may be buffered.

**Fix:**
1. Wait a few minutes for logs to flush
2. Check Render Logs dashboard, not just live tail
3. Use log filters: search for `"type": "AUDIT"`
4. Verify audit logging code is uncommented

---

## 📝 Environment Variables Summary

After Phase 2, you should have these environment variables in Render:

**Azure OpenAI** (from Phase 1):
```
AZURE_OPENAI_API_KEY=<your-key>
AZURE_RESOURCE_NAME=adavi-mf694jmx-eastus2
AZURE_DEPLOYMENT_NAME=gpt-4o-mini
AZURE_API_VERSION=2025-01-01-preview
```

**Azure AD Authentication** (new in Phase 2):
```
AZURE_AD_CLIENT_ID=f096923f-8dac-4790-8f40-febc2d9e972f
AZURE_AD_CLIENT_SECRET=1q180~1zxMP+PND883TPz-1Mr1WnnR9z5Jb3dc15
AZURE_AD_TENANT_ID=78bfcc3f-4c06-4c5b-9df9-f33095ced7ef
```

**NextAuth Configuration** (new in Phase 2):
```
NEXTAUTH_URL=https://tfc-agent-oct20th-25.onrender.com
NEXTAUTH_SECRET=<32-character-random-string>
```

---

## 🚀 Post-Implementation (Optional Enhancements)

After Phase 2 is complete and working, consider these enhancements:

### 1. Add Logout Button (15 min)
- Add logout button to Header or Settings
- Call `signOut()` from NextAuth
- Redirect to sign-in page

### 2. Display User Info (10 min)
- Show logged-in user's name/email in sidebar
- Replace "John Doe" placeholder with actual user data from session
- Add user avatar from Microsoft profile

### 3. Role-Based Access Control (30 min)
- Add Azure AD group membership check
- Restrict certain tools to admin users
- Example: Only admins can update patient status

### 4. Enhanced Audit Logging (20 min)
- Add IP address to audit logs
- Add request ID for tracing
- Export logs to external system (e.g., Azure Monitor, Datadog)

### 5. Sign BAA with Render (HIPAA Compliance)
- Contact Render support
- Upgrade to Standard plan ($25/mo minimum for HIPAA)
- Sign Business Associate Agreement
- Enable HIPAA-compliant logging and backups

---

## 📊 Timeline Breakdown

| Step | Task | Time | Cumulative |
|------|------|------|------------|
| 1 | Azure AD App Registration | 15 min | 15 min |
| 2 | Add Environment Variables | 5 min | 20 min |
| 3 | Re-enable Middleware | 5 min | 25 min |
| 4 | Re-enable Auth in Chat API | 10 min | 35 min |
| 5 | Re-enable Audit Logging | 10 min | 45 min |
| 6 | Test Full Flow | 20 min | **65 min** |

**Total: ~1 hour**

---

## ✅ Final Checklist

Before marking Phase 2 complete:

- [ ] Azure AD app registration created
- [ ] Client ID, Client Secret, and Tenant ID saved
- [ ] All environment variables added to Render
- [ ] Middleware re-enabled (middleware.ts exists, not .DISABLED)
- [ ] Auth check uncommented in chat API
- [ ] Audit logging uncommented in chat API
- [ ] Code committed and pushed to GitHub
- [ ] Render deployment successful
- [ ] Can sign in with Microsoft credentials
- [ ] Can send messages after authentication
- [ ] Tool calling works
- [ ] Audit logs visible in Render
- [ ] Session persists across refreshes
- [ ] Health check works without auth

---

**Last Updated:** October 21, 2025
**Status:** Ready for implementation
**Next Step:** Create Azure AD app registration (Step 1)
