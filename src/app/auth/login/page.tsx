'use client'

import { useActionState, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn, signUp, signInWithProvider, signInWithMagicLink } from './actions'

function LoginForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [signInState, signInAction, signInPending] = useActionState(signIn, { error: null })
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, { error: null })
  const [magicLinkState, magicLinkAction, magicLinkPending] = useActionState(signInWithMagicLink, { error: null })
  const [showMagicLink, setShowMagicLink] = useState(false)
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') ?? '/'

  const action = mode === 'signin' ? signInAction : signUpAction
  const pending = mode === 'signin' ? signInPending : signUpPending
  const error = mode === 'signin' ? signInState.error : signUpState.error
  const success = mode === 'signup' ? signUpState.success : null

  // Show verification message after signup
  if (success) {
    return (
      <main className="flex-1 bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#064E3B] mb-2">Check your email</h2>
            <p className="text-sm text-gray-500 mb-4">{success}</p>
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 mb-6 text-left">
              <p className="text-xs text-amber-800 leading-relaxed">
                Can&apos;t find it? Check your <strong>spam or junk folder</strong>. To make sure you receive future emails from Megafone, add <strong>notifications@megafone.app</strong> to your contacts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <p className="text-sm text-gray-500 mb-6">
            {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
          </p>

          {/* ── OAuth buttons ── */}
          <div className="space-y-3 mb-6">
            <form action={signInWithProvider}>
              <input type="hidden" name="provider" value="google" />
              <input type="hidden" name="returnTo" value={returnTo} />
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </form>

          </div>

          {/* ── Divider ── */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">or continue with email</span>
            </div>
          </div>

          {/* ── Magic link form ── */}
          {mode === 'signin' && showMagicLink ? (
            <div className="space-y-4">
              {magicLinkState.success ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
                  <p className="text-sm font-semibold text-emerald-800">Check your email</p>
                  <p className="text-xs text-emerald-600 mt-1">We sent a sign-in link to your email. Click the link to sign in — no password needed.</p>
                </div>
              ) : (
                <form action={magicLinkAction} className="space-y-4">
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <div>
                    <label htmlFor="magic-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      id="magic-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                      placeholder="you@example.com"
                    />
                  </div>

                  {magicLinkState.error && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{magicLinkState.error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={magicLinkPending}
                    className="w-full rounded-lg bg-[#064E3B] px-4 py-2 text-sm font-semibold text-white hover:opacity-80 disabled:opacity-50 transition-opacity"
                  >
                    {magicLinkPending ? 'Sending link…' : 'Send magic link'}
                  </button>
                </form>
              )}

              <p className="text-center">
                <button
                  type="button"
                  onClick={() => setShowMagicLink(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Use password instead
                </button>
              </p>
            </div>
          ) : (
            <>
              {/* ── Email / password form ── */}
              <form action={action} className="space-y-4">
                <input type="hidden" name="returnTo" value={returnTo} />

                {mode === 'signup' && (
                  <>
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full name <span className="text-[#F59E0B]">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                        Nickname <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        id="nickname"
                        name="nickname"
                        type="text"
                        autoComplete="off"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                        placeholder="How you'll appear in comments"
                      />
                      <p className="mt-1 text-xs text-gray-400">You can always set this later.</p>
                    </div>
                  </>
                )}

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

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-lg bg-[#064E3B] px-4 py-2 text-sm font-semibold text-white hover:opacity-80 disabled:opacity-50 transition-opacity"
                >
                  {pending ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              </form>

              {mode === 'signin' && (
                <div className="mt-3 flex items-center justify-center gap-3 text-sm">
                  <a href="/auth/forgot-password" className="text-gray-400 hover:text-gray-600 underline">
                    Forgot password?
                  </a>
                  <span className="text-gray-200">|</span>
                  <button
                    type="button"
                    onClick={() => setShowMagicLink(true)}
                    className="text-gray-400 hover:text-gray-600 underline"
                  >
                    Sign in with magic link
                  </button>
                </div>
              )}
            </>
          )}

          <p className="mt-4 text-center text-sm text-gray-500">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="font-semibold text-[#064E3B] underline"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
