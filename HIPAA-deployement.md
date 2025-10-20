HIPAA-Compliant Render Deployment - Ultra-Lean Edition      │ │
│ │                                                             │ │
│ │ Timeline: Tonight/Tomorrow (3-4 hours total)                │ │
│ │                                                             │ │
│ │ ---                                                         │ │
│ │ Phase 1: Render Deployment Files (30 min)                   │ │
│ │                                                             │ │
│ │ Create render.yaml                                          │ │
│ │                                                             │ │
│ │ services:                                                   │ │
│ │   - type: web                                               │ │
│ │     name: dawn-ai-assistant                                 │ │
│ │     env: node                                               │ │
│ │     region: oregon                                          │ │
│ │     plan: starter # Upgrade to Standard for production      │ │
│ │ ($25/mo)                                                    │ │
│ │     buildCommand: npm install --legacy-peer-deps && npm run │ │
│ │  build                                                      │ │
│ │     startCommand: npm start                                 │ │
│ │     healthCheckPath: /api/health                            │ │
│ │     envVars:                                                │ │
│ │       - key: NEXTAUTH_URL                                   │ │
│ │         sync: false                                         │ │
│ │       - key: NEXTAUTH_SECRET                                │ │
│ │         generateValue: true                                 │ │
│ │       - key: AZURE_AD_CLIENT_ID                             │ │
│ │         sync: false                                         │ │
│ │       - key: AZURE_AD_CLIENT_SECRET                         │ │
│ │         sync: false                                         │ │
│ │       - key: AZURE_AD_TENANT_ID                             │ │
│ │         sync: false                                         │ │
│ │       - key: AZURE_OPENAI_API_KEY                           │ │
│ │         sync: false                                         │ │
│ │       - key: AZURE_RESOURCE_NAME                            │ │
│ │         sync: false                                         │ │
│ │       - key: AZURE_DEPLOYMENT_NAME                          │ │
│ │         sync: false                                         │ │
│ │       - key: AZURE_API_VERSION                              │ │
│ │         sync: false                                         │ │
│ │                                                             │ │
│ │ Create app/api/health/route.ts                              │ │
│ │                                                             │ │
│ │ export async function GET() {                               │ │
│ │   return Response.json({                                    │ │
│ │     status: 'healthy',                                      │ │
│ │     timestamp: new Date().toISOString(),                    │ │
│ │     service: 'DAWN AI Assistant'                            │ │
│ │   })                                                        │ │
│ │ }                                                           │ │
│ │                                                             │ │
│ │ Update next.config.mjs                                      │ │
│ │                                                             │ │
│ │ /** @type {import('next').NextConfig} */                    │ │
│ │ const nextConfig = {                                        │ │
│ │   output: 'standalone', // Required for Render              │ │
│ │   reactStrictMode: true,                                    │ │
│ │   experimental: {                                           │ │
│ │     serverActions: {                                        │ │
│ │       bodySizeLimit: '2mb'                                  │ │
│ │     }                                                       │ │
│ │   }                                                         │ │
│ │ }                                                           │ │
│ │                                                             │ │
│ │ export default nextConfig                                   │ │
│ │                                                             │ │
│ │ ---                                                         │ │
│ │ Phase 2: Azure AD Authentication (1-2 hours)                │ │
│ │                                                             │ │
│ │ Install Dependencies                                        │ │
│ │                                                             │ │
│ │ npm install next-auth@beta                                  │ │
│ │                                                             │ │
│ │ Create auth.ts (App root)                                   │ │
│ │                                                             │ │
│ │ import NextAuth from "next-auth"                            │ │
│ │ import AzureADProvider from "next-auth/providers/azure-ad"  │ │
│ │                                                             │ │
│ │ export const { handlers, signIn, signOut, auth } =          │ │
│ │ NextAuth({                                                  │ │
│ │   providers: [                                              │ │
│ │     AzureADProvider({                                       │ │
│ │       clientId: process.env.AZURE_AD_CLIENT_ID!,            │ │
│ │       clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,    │ │
│ │       tenantId: process.env.AZURE_AD_TENANT_ID!,            │ │
│ │     }),                                                     │ │
│ │   ],                                                        │ │
│ │   session: {                                                │ │
│ │     strategy: "jwt",                                        │ │
│ │     maxAge: 8 * 60 * 60, // 8 hours                         │ │
│ │   },                                                        │ │
│ │   callbacks: {                                              │ │
│ │     authorized({ auth, request: { nextUrl } }) {            │ │
│ │       const isLoggedIn = !!auth?.user                       │ │
│ │       const isOnApp =                                       │ │
│ │ !nextUrl.pathname.startsWith('/api/auth')                   │ │
│ │                                                             │ │
│ │       if (isOnApp && !isLoggedIn) {                         │ │
│ │         return false                                        │ │
│ │       }                                                     │ │
│ │       return true                                           │ │
│ │     },                                                      │ │
│ │   },                                                        │ │
│ │   pages: {                                                  │ │
│ │     signIn: '/auth/signin',                                 │ │
│ │   },                                                        │ │
│ │ })                                                          │ │
│ │                                                             │ │
│ │ Create app/api/auth/[...nextauth]/route.ts                  │ │
│ │                                                             │ │
│ │ import { handlers } from "@/auth"                           │ │
│ │ export const { GET, POST } = handlers                       │ │
│ │                                                             │ │
│ │ Create middleware.ts                                        │ │
│ │                                                             │ │
│ │ export { auth as middleware } from "@/auth"                 │ │
│ │                                                             │ │
│ │ export const config = {                                     │ │
│ │   matcher:                                                  │ │
│ │ ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'], │ │
│ │ }                                                           │ │
│ │                                                             │ │
│ │ Create app/auth/signin/page.tsx                             │ │
│ │                                                             │ │
│ │ import { signIn } from "@/auth"                             │ │
│ │                                                             │ │
│ │ export default function SignIn() {                          │ │
│ │   return (                                                  │ │
│ │     <div className="flex min-h-screen items-center          │ │
│ │ justify-center">                                            │ │
│ │       <div className="text-center">                         │ │
│ │         <h1 className="text-2xl font-bold mb-4">DAWN AI     │ │
│ │ Assistant</h1>                                              │ │
│ │         <p className="mb-8">The Family Connection</p>       │ │
│ │         <form                                               │ │
│ │           action={async () => {                             │ │
│ │             "use server"                                    │ │
│ │             await signIn("azure-ad")                        │ │
│ │           }}                                                │ │
│ │         >                                                   │ │
│ │           <button                                           │ │
│ │             type="submit"                                   │ │
│ │             className="bg-blue-600 text-white px-6 py-3     │ │
│ │ rounded-lg hover:bg-blue-700"                               │ │
│ │           >                                                 │ │
│ │             Sign in with Microsoft                          │ │
│ │           </button>                                         │ │
│ │         </form>                                             │ │
│ │       </div>                                                │ │
│ │     </div>                                                  │ │
│ │   )                                                         │ │
│ │ }                                                           │ │
│ │                                                             │ │
│ │ Update app/api/chat/route.ts                                │ │
│ │                                                             │ │
│ │ Add auth check at the top:                                  │ │
│ │ import { auth } from "@/auth"                               │ │
│ │                                                             │ │
│ │ export async function POST(request: Request) {              │ │
│ │   // Auth check                                             │ │
│ │   const session = await auth()                              │ │
│ │   if (!session?.user) {                                     │ │
│ │     return new Response(                                    │ │
│ │       JSON.stringify({ error: 'Unauthorized' }),            │ │
│ │       { status: 401, headers: { 'Content-Type':             │ │
│ │ 'application/json' } }                                      │ │
│ │     )                                                       │ │
│ │   }                                                         │ │
│ │                                                             │ │
│ │   const userEmail = session.user.email                      │ │
│ │   console.log(`🔐 Authorized request from: ${userEmail}`)   │ │
│ │                                                             │ │
│ │   // ... rest of existing code                              │ │
│ │ }                                                           │ │
│ │                                                             │ │
│ │ ---                                                         │ │
│ │ Phase 3: Basic Audit Logging (30 min)                       │ │
│ │                                                             │ │
│ │ Create lib/audit/logger.ts                                  │ │
│ │                                                             │ │
│ │ export interface AuditLogEntry {                            │ │
│ │   timestamp: string                                         │ │
│ │   userEmail: string                                         │ │
│ │   action: string                                            │ │
│ │   toolName?: string                                         │ │
│ │   parameters?: any                                          │ │
│ │   result?: string                                           │ │
│ │ }                                                           │ │
│ │                                                             │ │
│ │ export function logAuditEvent(entry: AuditLogEntry) {       │ │
│ │   // For MVP: Console logs (Render captures these)          │ │
│ │   console.log('🔍 AUDIT:', JSON.stringify(entry))           │ │
│ │                                                             │ │
│ │   // TODO: Later, store in database                         │ │
│ │ }                                                           │ │
│ │                                                             │ │
│ │ Update app/api/chat/route.ts                                │ │
│ │                                                             │ │
│ │ Add audit logging:                                          │ │
│ │ import { logAuditEvent } from '@/lib/audit/logger'          │ │
│ │                                                             │ │
│ │ export async function POST(request: Request) {              │ │
│ │   const session = await auth()                              │ │
│ │   const userEmail = session.user.email!                     │ │
│ │                                                             │ │
│ │   // Log chat access                                        │ │
│ │   logAuditEvent({                                           │ │
│ │     timestamp: new Date().toISOString(),                    │ │
│ │     userEmail,                                              │ │
│ │     action: 'CHAT_MESSAGE',                                 │ │
│ │     parameters: { message: message.substring(0, 100) }      │ │
│ │   })                                                        │ │
│ │                                                             │ │
│ │   // ... in tool execution loop                             │ │
│ │   for (const toolCall of assistantMessage.tool_calls) {     │ │
│ │     logAuditEvent({                                         │ │
│ │       timestamp: new Date().toISOString(),                  │ │
│ │       userEmail,                                            │ │
│ │       action: 'TOOL_CALL',                                  │ │
│ │       toolName: toolCall.function.name,                     │ │
│ │       parameters: args,                                     │ │
│ │       result: result.success ? 'SUCCESS' : 'FAILED'         │ │
│ │     })                                                      │ │
│ │   }                                                         │ │
│ │ }                                                           │ │
│ │                                                             │ │
│ │ ---                                                         │ │
│ │ Phase 4: Azure AD App Registration (15 min)                 │ │
│ │                                                             │ │
│ │ In Azure Portal:                                            │ │
│ │                                                             │ │
│ │ 1. Go to Azure Active Directory → App registrations → New   │ │
│ │ registration                                                │ │
│ │ 2. Name: "DAWN AI Assistant"                                │ │
│ │ 3. Redirect URI: https://your-app-name.onrender.com/api/aut │ │
│ │ h/callback/azure-ad                                         │ │
│ │ 4. Copy: Client ID, Tenant ID                               │ │
│ │ 5. Create Client Secret → Copy secret value                 │ │
│ │ 6. API permissions → Add Microsoft Graph → User.Read        │ │
│ │                                                             │ │
│ │ ---                                                         │ │
│ │ Phase 5: Deploy to Render (30 min)                          │ │
│ │                                                             │ │
│ │ Steps:                                                      │ │
│ │                                                             │ │
│ │ 1. Push to GitHub                                           │ │
│ │ git add .                                                   │ │
│ │ git commit -m "Add Render deployment + Azure AD auth"       │ │
│ │ git push                                                    │ │
│ │ 2. In Render Dashboard:                                     │ │
│ │   - New → Web Service                                       │ │
│ │   - Connect GitHub repo                                     │ │
│ │   - Render auto-detects render.yaml                         │ │
│ │   - Click "Create Web Service"                              │ │
│ │ 3. Add Environment Variables:                               │ │
│ │   - NEXTAUTH_URL: https://your-app-name.onrender.com        │ │
│ │   - NEXTAUTH_SECRET: (auto-generated)                       │ │
│ │   - AZURE_AD_CLIENT_ID: (from Azure portal)                 │ │
│ │   - AZURE_AD_CLIENT_SECRET: (from Azure portal)             │ │
│ │   - AZURE_AD_TENANT_ID: (from Azure portal)                 │ │
│ │   - AZURE_OPENAI_API_KEY: (existing)                        │ │
│ │   - AZURE_RESOURCE_NAME: (existing)                         │ │
│ │   - AZURE_DEPLOYMENT_NAME: (existing)                       │ │
│ │   - AZURE_API_VERSION: (existing)                           │ │
│ │ 4. Upgrade to Standard Plan:                                │ │
│ │   - Settings → Plan → Standard ($25/mo)                     │ │
│ │   - Required for HIPAA BAA                                  │ │
│ │ 5. Sign BAA with Render:                                    │ │
│ │   - Contact Render support                                  │ │
│ │   - Request HIPAA BAA                                       │ │
│ │   - Usually takes 24-48 hours                               │ │
│ │                                                             │ │
│ │ ---                                                         │ │
│ │ Phase 6: Testing Checklist (30 min)                         │ │
│ │                                                             │ │
│ │ Test Items:                                                 │ │
│ │                                                             │ │
│ │ - Health check: https://your-app.onrender.com/api/health    │ │
│ │ - Redirects to login when not authenticated                 │ │
│ │ - Azure AD login works                                      │ │
│ │ - Can access DAWN after login                               │ │
│ │ - Tool calling works (test all 3 tools)                     │ │
│ │ - Audit logs appear in Render logs                          │ │
│ │ - Session persists across page refreshes                    │ │
│ │ - Auto-logout after 8 hours                                 │ │
│ │                                                             │ │
│ │ ---                                                         │ │
│ │ What's NOT Included (Can Add Later)                         │ │
│ │                                                             │ │
│ │ Database for Conversation History:                          │ │
│ │ - Not needed for MVP (conversations are ephemeral)          │ │
│ │ - Can add Render PostgreSQL later ($7/mo)                   │ │
│ │                                                             │ │
│ │ Advanced Audit Logs:                                        │ │
│ │ - Currently logs to console (captured by Render)            │ │
│ │ - Can add database later for searchable logs                │ │
│ │                                                             │ │
│ │ User Management:                                            │ │
│ │ - Azure AD handles this                                     │ │
│ │ - All M365 users can access                                 │ │
│ │ - Can add role-based access later                           │ │
│ │                                                             │ │
│ │ ---                                                         │ │
│ │ Timeline Summary                                            │ │
│ │                                                             │ │
│ │ | Phase                  | Time      | Status             | │ │
│ │ |------------------------|-----------|--------------------| │ │
│ │ | 1. Render config files | 30 min    | Ready to code      | │ │
│ │ | 2. Azure AD auth       | 1-2 hours | Ready to code      | │ │
│ │ | 3. Audit logging       | 30 min    | Ready to code      | │ │
│ │ | 4. Azure AD setup      | 15 min    | Manual portal work | │ │
│ │ | 5. Deploy to Render    | 30 min    | Push-button        | │ │
│ │ | 6. Testing             | 30 min    | Validation         | │ │
│ │ | TOTAL                  | 3-4 hours | Live tonight!      | │ │
│ │                                                             │ │
│ │ ---                                                         │ │
│ │ Post-Deployment (Can Wait)                                  │ │
│ │                                                             │ │
│ │ Week 2:                                                     │ │
│ │ - Add PostgreSQL for conversation history                   │ │
│ │ - Searchable audit logs                                     │ │
│ │ - User activity dashboard                                   │ │
│ │                                                             │ │
│ │ Week 3:                                                     │ │
│ │ - Role-based access (admin vs user)                         │ │
│ │ - Rate limiting per user                                    │ │
│ │ - Advanced monitoring                                       │ │
│ │                                                             │ │
│ │ ---                                                         │ │
│ │ Cost Breakdown                                              │ │
│ │                                                             │ │
│ │ - Render Standard: $25/month                                │ │
│ │ - Azure AD: Free (you already have M365)                    │ │
│ │ - Azure OpenAI: Pay-as-you-go (existing)                    │ │
│ │ - n8n GCP: Existing                                         │ │
│ │ - Total New Cost: $25/month ✅ Well under $50 budget         │ │
│ │                                                             │ │
│ │ ---                                                         │ │
│ │ Security Checklist                                          │ │
│ │                                                             │ │
│ │ - HTTPS encryption (Render automatic)                       │ │
│ │ - Azure AD authentication                                   │ │
│ │ - Session encryption (JWT)                                  │ │
│ │ - Audit logging                                             │ │
│ │ - No database = no PHI stored long-term                     │ │
│ │ - n8n already HIPAA-compliant (GCP)                         │ │
│ │ - Azure OpenAI HIPAA-compliant                              │ │
│ │ - Render BAA signed (do within 48 hours)                    │ │
│ │                                                             │ │
│ │ ---                                                         │ │
│ │ Ready to Execute?                                           │ │
│ │                                                             │ │
│ │ This plan will get DAWN live in production with HIPAA       │ │
│ │ compliance tonight/tomorrow. The approach is:               │ │
│ │ 1. Secure first - Auth required before ANY access           │ │
│ │ 2. Minimal complexity - No database, no extra services      │ │
│ │ 3. Compliant - All vendors HIPAA-ready                      │ │
│ │ 4. Scalable - Easy to add features later                    │ │
│ │                            