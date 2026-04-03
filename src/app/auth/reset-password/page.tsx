'use client'

import { useActionState } from 'react'
import { resetPassword } from './actions'

export default function ResetPasswordPage() {
  const [state, action, isPending] = useActionState(resetPassword, { error: null })

  return (
    <main className="flex-1 bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-lg font-bold text-gray-900 mb-1">Choose a new password</h1>
          <p className="text-sm text-gray-500 mb-6">Make it something you'll remember.</p>

          <form action={action} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                required
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                placeholder="••••••••"
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
              {isPending ? 'Saving…' : 'Set new password'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
