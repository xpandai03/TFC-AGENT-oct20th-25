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
     * 3. /_next/static (static files)
     * 4. /_next/image (image optimization files)
     * 5. /favicon.ico, /robots.txt (public files)
     */
    '/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
}
