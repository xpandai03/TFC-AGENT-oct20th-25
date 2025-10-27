# Quick Deployment Guide

## 🚀 Current Setup Summary

### Local Development
- **App Running On**: http://localhost:3002
- **Dev Command**: `npm run dev`
- **Build Command**: `npm run build`

### Production Deployment
- **Live URL**: https://tfc-agent-oct20th-25.onrender.com
- **Repository**: https://github.com/xpandai03/TFC-AGENT-oct20th-25.git
- **Branch**: main
- **Auto-Deploy**: ✅ ENABLED

---

## 📝 Deployment Workflow (3 Steps)

### Step 1: Make Your Changes Locally
Edit files, test on http://localhost:3002

### Step 2: Commit Your Changes
```bash
git add .
git commit -m "Your descriptive commit message"
```

### Step 3: Push to Deploy
```bash
git push origin main
```

**That's it!** Render automatically:
1. Detects the push to main branch
2. Runs `npm install --legacy-peer-deps && npm run build`
3. Deploys the new version
4. Runs health checks on `/api/health`

---

## 🔍 Monitoring Deployment

### Watch Build Logs
1. Go to: https://dashboard.render.com
2. Select your service: `dawn-ai-assistant`
3. Click "Logs" tab
4. Watch real-time build progress

### Check Deployment Status
- **Building**: Yellow status in dashboard
- **Live**: Green status
- **Failed**: Red status (check logs for errors)

### Typical Build Time
- **First Build**: 3-5 minutes (installs all dependencies)
- **Subsequent Builds**: 2-3 minutes (uses cache)

---

## 🎯 Quick Commands Reference

### Local Development
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Test Azure OpenAI connection
npm run test:azure

# Generate Prisma client
npx prisma generate

# Push database schema changes
npx prisma db push

# Deploy migrations
npx prisma migrate deploy
```

### Git Commands
```bash
# Check what changed
git status

# See changes in detail
git diff

# Add all changes
git add .

# Commit with message
git commit -m "Description of changes"

# Push to deploy
git push origin main

# Check current branch
git branch

# View recent commits
git log --oneline -10
```

### Quick Deploy Script
```bash
# Add, commit, and push in one go
git add . && git commit -m "Cosmetic changes" && git push origin main
```

---

## 🔧 Environment Variables

All environment variables are already configured in Render:
- ✅ AZURE_OPENAI_API_KEY
- ✅ AZURE_RESOURCE_NAME
- ✅ AZURE_DEPLOYMENT_NAME
- ✅ AZURE_EMBEDDING_DEPLOYMENT
- ✅ AZURE_API_VERSION
- ✅ DATABASE_URL
- ✅ NEXTAUTH_URL
- ✅ NEXTAUTH_SECRET
- ✅ AZURE_AD_CLIENT_ID
- ✅ AZURE_AD_CLIENT_SECRET
- ✅ AZURE_AD_TENANT_ID

**Note**: Local environment uses `.env.local` (already configured)

---

## 🐛 Troubleshooting

### Build Fails on Render
1. Check build logs in Render dashboard
2. Try building locally first: `npm run build`
3. Check for TypeScript errors
4. Verify package-lock.json is committed

### Changes Not Appearing
1. Verify commit was pushed: `git log --oneline -1`
2. Check Render dashboard shows new deployment
3. Wait for build to complete (2-3 minutes)
4. Hard refresh browser (Cmd+Shift+R on Mac)

### Local Dev Server Issues
1. Stop server: Find terminal and Ctrl+C
2. Clear Next.js cache: `rm -rf .next`
3. Restart: `npm run dev`

---

## 📊 App Architecture

### Two AI Agents
1. **D.A.W.N.** (Dependable Agent Working Nicely)
   - Manages client records
   - Updates Excel via n8n webhooks
   - Uses tools: writeStatus, addNote, showContactData

2. **LISA** (document analysis agent)
   - RAG-based document Q&A
   - Uploads PDFs, processes with vector embeddings
   - Returns answers with source citations

### Database
- **Type**: PostgreSQL on Render
- **ORM**: Prisma
- **Tables**: conversations, documents, document_chunks
- **Vector Extension**: pgvector (for LISA embeddings)

### Authentication
- **Provider**: Azure AD (Microsoft accounts)
- **Library**: NextAuth.js
- **Session**: 8 hour timeout
- **Protected Routes**: All pages except /auth/*

---

## 🎨 Making Cosmetic Changes

### Common UI Files to Edit
- `components/AIAssistantUI.jsx` - Main chat interface
- `components/ChatPane.jsx` - D.A.W.N. chat pane
- `components/LisaChatPane.jsx` - LISA chat pane
- `components/Composer.jsx` - Message input box
- `components/Sidebar.jsx` - Left sidebar
- `app/globals.css` - Global styles
- `tailwind.config.ts` - Tailwind configuration

### Workflow for Cosmetic Changes
1. Edit file in your editor
2. Save and check http://localhost:3002 (auto-reloads)
3. Iterate until it looks good
4. Commit and push:
   ```bash
   git add .
   git commit -m "Update UI: <what you changed>"
   git push origin main
   ```
5. Wait 2-3 minutes for deployment
6. Check https://tfc-agent-oct20th-25.onrender.com

---

## 📚 Related Documentation

- `23-oct-BuildLogs.md` - Recent fixes (agent switching, LISA uploads)
- `21-oct-deploymentLogs.md` - Initial Render deployment
- `20OctBUILD.md` - Original D.A.W.N. build plan
- `lisa-rag-agent.md` - LISA implementation details
- `render.yaml` - Render deployment configuration

---

## ✅ Current Status

- ✅ Local development server running on port 3002
- ✅ Git remote configured for deployment
- ✅ Render auto-deploy enabled
- ✅ All environment variables configured
- ✅ Database schema synced
- ✅ Both D.A.W.N. and LISA agents working

**You're ready to make changes and deploy!**

---

Last Updated: October 27, 2025
