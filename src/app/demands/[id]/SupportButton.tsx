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

// ── Share panel shown after supporting or for existing supporters ────────────

function SharePanel({
  demandId,
  supportCount,
  headline,
  orgName,
}: {
  demandId: string
  supportCount: number
  headline: string
  orgName: string
}) {
  const [copied, setCopied] = useState(false)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (typeof window !== 'undefined' ? window.location.origin : '')
  const url = `${siteUrl}/demands/${demandId}`

  const shareText = `I just supported a campaign asking ${orgName} to answer fans' questions on Megafone. Join ${supportCount.toLocaleString()} supporters: ${url}`
  const shareTextEncoded = encodeURIComponent(shareText)
  const urlEncoded = encodeURIComponent(url)
  const headlineEncoded = encodeURIComponent(headline)

  function handleCopy() {
    navigator.clipboard.writeText(`${headline} — ${url}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-2">
      {/* WhatsApp */}
      <a
        href={`https://wa.me/?text=${shareTextEncoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Share on WhatsApp
      </a>

      {/* X (Twitter) */}
      <a
        href={`https://x.com/intent/tweet?text=${encodeURIComponent(`${headline} — ${supportCount.toLocaleString()} supporters and counting`)}&url=${urlEncoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        Share on X
      </a>

      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}&quote=${headlineEncoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Share on Facebook
      </a>

      {/* Copy link */}
      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {copied ? (
          <>
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Link copied!
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Copy link
          </>
        )}
      </button>
    </div>
  )
}

// ── Post-support share screen (modal overlay) ───────────────────────────────

function PostSupportShareScreen({
  demandId,
  supportCount,
  headline,
  orgName,
  onClose,
}: {
  demandId: string
  supportCount: number
  headline: string
  orgName: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Green header */}
        <div className="bg-[#064E3B] px-6 py-5">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-bold text-emerald-400">You've added your support!</span>
          </div>
          <p className="text-white text-lg font-black leading-tight">
            Now help this campaign grow
          </p>
          <p className="text-emerald-300 text-xs mt-1">
            Every share brings {orgName} closer to responding
          </p>
        </div>

        {/* Share buttons */}
        <div className="px-6 py-5">
          <SharePanel
            demandId={demandId}
            supportCount={supportCount}
            headline={headline}
            orgName={orgName}
          />

          <button
            onClick={onClose}
            className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors py-2"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

interface Props {
  demandId: string
  isAuthenticated: boolean
  isEmailVerified: boolean
  isSupported: boolean
  supportCount: number
  questionCount: number
  notificationThreshold: number | null
  headline: string
  orgName: string
}

export default function SupportButton({
  demandId,
  isAuthenticated,
  isEmailVerified,
  isSupported,
  supportCount,
  questionCount,
  notificationThreshold,
  headline,
  orgName,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [optimisticCount, setOptimisticCount] = useState(supportCount)
  const [optimisticSupported, setOptimisticSupported] = useState(isSupported)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showShareScreen, setShowShareScreen] = useState(false)

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
        setShowShareScreen(true)
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
      {showShareScreen && (
        <PostSupportShareScreen
          demandId={demandId}
          supportCount={optimisticCount}
          headline={headline}
          orgName={orgName}
          onClose={() => setShowShareScreen(false)}
        />
      )}

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
              <SharePanel demandId={demandId} supportCount={optimisticCount} headline={headline} orgName={orgName} />
            </>
          )}

          {isAuthenticated && !isEmailVerified && (
            <>
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3">
                <p className="text-sm font-semibold text-yellow-800">Verify your email to add your voice</p>
                <p className="text-xs text-yellow-700 mt-0.5">Check your inbox for a verification link.</p>
              </div>
              <SharePanel demandId={demandId} supportCount={optimisticCount} headline={headline} orgName={orgName} />
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
              <p className="text-xs text-gray-400 text-center pt-1 pb-1">Share to help this campaign grow</p>
              <SharePanel demandId={demandId} supportCount={optimisticCount} headline={headline} orgName={orgName} />
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
            </>
          )}

        </div>

      </div>
    </div>
  )
}
