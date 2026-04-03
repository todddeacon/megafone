'use client'

import { useActionState } from 'react'
import { requestPasswordReset } from './actions'

export default function ForgotPasswordPage() {
  const [state, action, isPending] = useActionState(requestPasswordReset, { error: null, success: false })

  return (
    <main className="flex-1 bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-lg font-bold text-gray-900 mb-1">Reset your password</h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter your email and we'll send you a link to reset your password.
          </p>

          {state.success ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-4 text-sm text-emerald-800">
              <p className="font-semibold mb-1">Check your inbox</p>
              <p>If an account exists for that email, you'll receive a reset link shortly.</p>
            </div>
          ) : (
            <form action={action} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                  placeholder="you@example.com"
                />
              </div>

              {state.error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg bg-[#064E3B] px-4 py-2 text-sm font-semibold text-white hover:opacity-80 disabled:opacity-50 transition-opacity"
              >
                {isPending ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-gray-500">
            <a href="/auth/login" className="font-semibold text-[#064E3B] underline">
              Back to sign in
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
