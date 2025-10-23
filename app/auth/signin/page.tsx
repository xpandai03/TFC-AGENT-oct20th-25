/**
 * Sign In Page
 * Azure AD authentication for The Family Connection staff
 */

import { signIn } from "@/auth"
import WarpBackground from "@/components/WarpBackground"
import Image from "next/image"

export default function SignIn() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <WarpBackground />

      {/* Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl backdrop-blur-xl bg-white/10 p-8 shadow-2xl border border-white/20">
        <div className="text-center">
          {/* Logo/Branding */}
          <div className="mb-6 flex justify-center">
            <Image
              src="/images/tfc-logo-white.png"
              alt="The Family Connection Logo"
              width={1500}
              height={465}
              className="w-auto h-24 md:h-28 drop-shadow-2xl"
              priority
            />
          </div>

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
  )
}
