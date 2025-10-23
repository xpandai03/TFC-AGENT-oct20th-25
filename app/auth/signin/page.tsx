/**
 * Sign In Page
 * Azure AD authentication for The Family Connection staff
 */

import { signIn } from "@/auth"
import WarpBackground from "@/components/WarpBackground"

// Force dynamic rendering to ensure images load correctly
export const dynamic = 'force-dynamic'

export default function SignIn() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <WarpBackground />

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start px-8 pt-16 md:pt-24">
        {/* Logo at top */}
        <div className="mb-12 flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-wide drop-shadow-2xl">
            THE FAMILY
          </h1>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-wide drop-shadow-2xl">
            CONNECTION
          </h1>
        </div>

        {/* Glassmorphic Card */}
        <div className="w-full max-w-md rounded-2xl backdrop-blur-xl bg-white/10 p-8 shadow-2xl border border-white/20">
          <div className="text-center">
            {/* Organization */}
            <div className="mb-8">
              <p className="text-lg font-semibold text-white">
                The Family Connection
              </p>
              <p className="mt-1 text-sm text-white/80">
                Admin Support AI Assistant
              </p>
            </div>

          {/* Sign In Button */}
          <form
            action={async () => {
              "use server"
              await signIn("azure-ad", { redirectTo: "/" })
            }}
          >
            <button
              type="submit"
              className="w-full rounded-xl bg-white/20 backdrop-blur-md px-6 py-3 text-white font-medium hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent transition-all border border-white/30 shadow-lg"
            >
              Sign in with Microsoft
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-8 rounded-xl backdrop-blur-md bg-white/10 p-4 border border-white/20">
            <p className="text-xs text-white font-semibold">
              🔒 HIPAA-Compliant Secure Access
            </p>
            <p className="mt-1 text-xs text-white/90">
              Your session is encrypted and automatically logs out after 8 hours
            </p>
          </div>

          {/* Footer */}
          <p className="mt-6 text-xs text-white/70">
            For authorized staff only
          </p>
          </div>
        </div>
      </div>
    </div>
  )
}
