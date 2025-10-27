/**
 * Sign In Page
 * Azure AD authentication for The Family Connection staff
 */

import { signIn } from "@/auth"
import { Warp } from "@paper-design/shaders-react"
import Image from "next/image"

export default function SignIn() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background shader - exact copy from reference */}
      <div className="absolute inset-0">
        <Warp
          style={{ height: "100%", width: "100%" }}
          proportion={0.45}
          softness={1}
          distortion={0.25}
          swirl={0.8}
          swirlIterations={10}
          shape="checks"
          shapeScale={0.1}
          scale={1}
          rotation={0}
          speed={1}
          colors={["hsl(210, 100%, 20%)", "hsl(200, 100%, 75%)", "hsl(220, 90%, 30%)", "hsl(190, 100%, 80%)"]}
        />
      </div>

      {/* Content - exact structure from reference */}
      <div className="relative z-10 min-h-screen flex items-start justify-center px-8 pt-16 md:pt-24">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Logo - using GitHub raw URL to bypass Render static file serving issue */}
          <div className="flex justify-center">
            <Image
              src="https://raw.githubusercontent.com/xpandai03/TFC-AGENT-oct20th-25/main/public/images/logo-white.png"
              alt="Logo"
              width={400}
              height={150}
              className="w-auto h-24 md:h-32"
              priority
            />
          </div>

          {/* Glassmorphic Card with signin functionality */}
          <div className="w-full max-w-md mx-auto rounded-2xl backdrop-blur-xl bg-white/10 p-8 shadow-2xl border border-white/20">
            <div className="text-center">
            {/* Organization */}
            <div className="mb-8">
              <p className="text-lg font-semibold text-white">
                Welcome TFC Admin Team
              </p>
              <p className="mt-1 text-sm text-white/80">
                Please login with your credentials
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
    </main>
  )
}
