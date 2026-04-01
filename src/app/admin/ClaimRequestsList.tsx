'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveClaimRequest, rejectClaimRequest } from './actions'

interface ClaimRequest {
  id: string
  requester_name: string
  requester_email: string
  requester_role: string
  status: string
  created_at: string
  organisation: { name: string } | null
  organisation_other?: string | null
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function ClaimRow({ claim }: { claim: ClaimRequest }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handle(action: 'approve' | 'reject') {
    setError(null)
    startTransition(async () => {
      const result =
        action === 'approve'
          ? await approveClaimRequest(claim.id)
          : await rejectClaimRequest(claim.id)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <li className="border border-gray-100 rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-0.5">
          <p className="font-semibold text-gray-900 text-sm">
            {claim.organisation?.name ?? claim.organisation_other ?? '—'}
            {claim.organisation_other && (
              <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 rounded px-1.5 py-0.5">not in system</span>
            )}
          </p>
          <p className="text-sm text-gray-600">
            {claim.requester_name} — {claim.requester_role}
          </p>
          <p className="text-sm text-gray-400">{claim.requester_email}</p>
          <p className="text-xs text-gray-300">{formatDate(claim.created_at)}</p>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => handle('approve')}
          disabled={isPending}
          className="rounded-lg bg-[#064E3B] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#065F46] disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Approve'}
        </button>
        <button
          onClick={() => handle('reject')}
          disabled={isPending}
          className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Reject
        </button>
      </div>
    </li>
  )
}

export default function ClaimRequestsList({
  pendingClaims,
  reviewedClaims,
}: {
  pendingClaims: ClaimRequest[]
  reviewedClaims: ClaimRequest[]
}) {
  const [showReviewed, setShowReviewed] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
        Claim requests
      </h2>

      {pendingClaims.length === 0 ? (
        <p className="text-sm text-gray-400">No pending claims.</p>
      ) : (
        <ul className="space-y-3">
          {pendingClaims.map((c) => (
            <ClaimRow key={c.id} claim={c} />
          ))}
        </ul>
      )}

      {reviewedClaims.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={() => setShowReviewed((v) => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showReviewed ? 'Hide' : 'Show'} {reviewedClaims.length} reviewed claim{reviewedClaims.length !== 1 ? 's' : ''}
          </button>

          {showReviewed && (
            <ul className="mt-4 space-y-2">
              {reviewedClaims.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm text-gray-500 py-1.5 border-b border-gray-50 last:border-0">
                  <span>
                    <span className="font-medium text-gray-700">{c.organisation?.name ?? '—'}</span>
                    {' '}— {c.requester_name}
                  </span>
                  <span className={`text-xs font-semibold capitalize ${c.status === 'approved' ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {c.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
