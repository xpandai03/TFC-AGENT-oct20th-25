import NextAuth from "next-auth"
import AzureADProvider from "next-auth/providers/azure-ad"

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Required for production deployment on Render
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours - auto logout for security
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnApp = !nextUrl.pathname.startsWith('/api/auth')
      const isHealthCheck = nextUrl.pathname === '/api/health'

      // Allow health check without auth
      if (isHealthCheck) {
        return true
      }

      // Require auth for all other pages
      if (isOnApp && !isLoggedIn) {
        return false
      }

      return true
    },
    async jwt({ token, user, account }) {
      // Add user info to token on sign in
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      // Add token data to session
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  debug: process.env.NODE_ENV === 'development',
})
