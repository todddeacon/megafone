'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supportDemand } from './actions'

function SignInModal({ onClose }: { onClose: () => void }) {
  const pathname = usePathname()
  const loginHref = `/auth/login?returnTo=${encodeURIComponent(pathname)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-[#064E3B] mb-2">Sign in required</h2>
        <p className="text-sm text-gray-500 mb-6">To support a campaign you must sign in.</p>
        <a
          href={loginHref}
          className="block w-full text-center rounded-lg bg-[#F59E0B] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#D97706] transition-colors"
        >
          Sign in
        </a>
      </div>
    </div>
  )
}

function ShareButton({ demandId, supportCount }: { demandId: string; supportCount: number }) {
  const [copied, setCopied] = useState(false)

  function handleShare() {
    const url = `${window.location.origin}/demands/${demandId}`
    const text = `${supportCount} ${supportCount === 1 ? 'fan has' : 'fans have'} added their support. Add yours: ${url}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleShare}
      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </>
      )}
    </button>
  )
}

interface Props {
  demandId: string
  isAuthenticated: boolean
  isEmailVerified: boolean
  isSupported: boolean
  supportCount: number
  questionCount: number
  notificationThreshold: number | null
  headline?: string
}

export default function SupportButton({
  demandId,
  isAuthenticated,
  isEmailVerified,
  isSupported,
  supportCount,
  questionCount,
  notificationThreshold,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [optimisticCount, setOptimisticCount] = useState(supportCount)
  const [optimisticSupported, setOptimisticSupported] = useState(isSupported)
  const [showSignInModal, setShowSignInModal] = useState(false)

  function handleSupport() {
    setError(null)
    setOptimisticCount((n) => n + 1)
    setOptimisticSupported(true)

    startTransition(async () => {
      const result = await supportDemand(demandId)
      if (result.error) {
        setError(result.error)
        setOptimisticCount((n) => n - 1)
        setOptimisticSupported(false)
      } else {
        router.refresh()
      }
    })
  }

  const pct = notificationThreshold
    ? Math.min(100, (optimisticCount / notificationThreshold) * 100)
    : 0

  const thresholdReached = notificationThreshold ? optimisticCount >= notificationThreshold : false

  return (
    <div>
      {showSignInModal && <SignInModal onClose={() => setShowSignInModal(false)} />}

      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">

        {/* Green header: count + progress */}
        <div className="bg-[#064E3B] px-5 pt-5 pb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1.5">
            Supporters
          </p>
          <span className="text-5xl font-black text-white tabular-nums leading-none">
            {optimisticCount.toLocaleString('en-GB')}
          </span>
          {questionCount > 0 && (
            <p className="mt-1 text-xs text-emerald-400">
              {questionCount} {questionCount === 1 ? 'question' : 'questions'}
            </p>
          )}
          {notificationThreshold && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-emerald-400">Notification target</span>
                <span className="text-xs text-white font-bold tabular-nums">
                  {optimisticCount.toLocaleString('en-GB')} / {notificationThreshold.toLocaleString('en-GB')}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#F59E0B] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-emerald-400">
                {thresholdReached
                  ? 'Target reached — the organisation has been notified'
                  : `${(notificationThreshold - optimisticCount).toLocaleString('en-GB')} more to notify the organisation`}
              </p>
            </div>
          )}
        </div>

        {/* White body: action */}
        <div className="bg-white px-5 py-4 space-y-2">

          {!isAuthenticated && (
            <>
              <button
                onClick={() => setShowSignInModal(true)}
                className="w-full rounded-lg bg-[#F59E0B] py-2.5 text-sm font-bold text-white hover:bg-[#D97706] transition-colors"
              >
                Add your support
              </button>
              <ShareButton demandId={demandId} supportCount={optimisticCount} />
            </>
          )}

          {isAuthenticated && !isEmailVerified && (
            <>
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3">
                <p className="text-sm font-semibold text-yellow-800">Verify your email to add your voice</p>
                <p className="text-xs text-yellow-700 mt-0.5">Check your inbox for a verification link.</p>
              </div>
              <ShareButton demandId={demandId} supportCount={optimisticCount} />
            </>
          )}

          {isAuthenticated && isEmailVerified && optimisticSupported && (
            <>
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5">
                <svg className="w-4 h-4 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-green-800">You've added your support</span>
              </div>
              <ShareButton demandId={demandId} supportCount={optimisticCount} />
            </>
          )}

          {isAuthenticated && isEmailVerified && !optimisticSupported && (
            <>
              <button
                onClick={handleSupport}
                disabled={isPending}
                className="w-full rounded-lg bg-[#F59E0B] py-2.5 text-sm font-bold text-white hover:bg-[#D97706] disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Adding your support…' : 'Add your support'}
              </button>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <ShareButton demandId={demandId} supportCount={optimisticCount} />
            </>
          )}

        </div>
      </div>
    </div>
  )
}
