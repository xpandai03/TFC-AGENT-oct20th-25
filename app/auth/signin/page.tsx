/**
 * Sign In Page
 * Azure AD authentication for The Family Connection staff
 */

import { signIn } from "@/auth"

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        <div className="text-center">
          {/* Logo/Branding */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">D.A.W.N.</h1>
            <p className="mt-2 text-sm text-gray-600">
              Dependable Agent Working Nicely
            </p>
          </div>

          {/* Organization */}
          <div className="mb-8">
            <p className="text-lg font-semibold text-gray-800">
              The Family Connection
            </p>
            <p className="mt-1 text-sm text-gray-500">
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
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Sign in with Microsoft
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-8 rounded-md bg-blue-50 p-4">
            <p className="text-xs text-blue-900">
              🔒 HIPAA-Compliant Secure Access
            </p>
            <p className="mt-1 text-xs text-blue-700">
              Your session is encrypted and automatically logs out after 8 hours
            </p>
          </div>

          {/* Footer */}
          <p className="mt-6 text-xs text-gray-400">
            For authorized staff only
          </p>
        </div>
      </div>
    </div>
  )
}
