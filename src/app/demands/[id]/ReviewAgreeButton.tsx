'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { agreeWithReview } from './actions'

interface Props {
  demandId: string
  supportCount: number
  hasAgreed: boolean
  rating: number | null
  reviewingSubject: string | null
}

export default function ReviewAgreeButton({
  demandId,
  supportCount,
  hasAgreed,
  rating,
  reviewingSubject,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [optimisticCount, setOptimisticCount] = useState(supportCount)
  const [optimisticAgreed, setOptimisticAgreed] = useState(hasAgreed)

  function handleAgree() {
    if (optimisticAgreed) return
    setError(null)
    setOptimisticCount((n) => n + 1)
    setOptimisticAgreed(true)

    startTransition(async () => {
      const result = await agreeWithReview(demandId)
      if (result.error) {
        setError(result.error)
        setOptimisticCount((n) => n - 1)
        setOptimisticAgreed(false)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      <div className="bg-[#064E3B] px-5 pt-5 pb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1.5">
          Fans agreeing
        </p>
        <span className="text-5xl font-black text-white tabular-nums leading-none">
          {optimisticCount.toLocaleString('en-GB')}
        </span>
        {rating !== null && (
          <p className="mt-3 text-xs text-emerald-400">
            Reviewer rated this {rating} / 5
          </p>
        )}
        {reviewingSubject && (
          <p className="mt-1 text-xs text-emerald-400 truncate">
            Review of {reviewingSubject}
          </p>
        )}
      </div>

      <div className="bg-white px-5 py-4 space-y-2">
        {optimisticAgreed ? (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5">
            <svg className="w-4 h-4 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-semibold text-green-800">You agree with this review</span>
          </div>
        ) : (
          <>
            <button
              onClick={handleAgree}
              disabled={isPending}
              className="w-full rounded-lg bg-[#F59E0B] py-2.5 text-sm font-bold text-white hover:bg-[#D97706] disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Adding your agreement…' : 'I agree · Same experience'}
            </button>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <p className="text-xs text-gray-400 text-center pt-1">
              No sign-in needed — one agreement per browser.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
