/**
 * Middleware - Route Protection
 * Ensures all routes except auth and public assets require authentication
 */

export { auth as middleware } from "@/auth"

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/* (auth routes)
     * 2. /api/health (health check)
     * 3. /api/migrate (migration endpoint - has its own auth)
     * 4. /api/fix-agent-type (migration fix endpoint - has its own auth)
     * 5. /_next/static (static files)
     * 6. /_next/image (image optimization files)
     * 7. /favicon.ico, /robots.txt (public files)
     */
    '/((?!api/auth|api/health|api/migrate|api/fix-agent-type|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
}
