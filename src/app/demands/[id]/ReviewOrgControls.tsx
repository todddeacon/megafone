'use client'

import { useActionState, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { postReviewReply, toggleReviewResolved } from './actions'

interface Props {
  demandId: string
  orgName: string
  isResolved: boolean
  hasReply: boolean
}

export default function ReviewOrgControls({ demandId, orgName, isResolved, hasReply }: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    postReviewReply.bind(null, demandId),
    { error: null }
  )
  const [isToggling, startToggle] = useTransition()
  const [optimisticResolved, setOptimisticResolved] = useState(isResolved)
  const [body, setBody] = useState('')

  function handleToggleResolved() {
    setOptimisticResolved((v) => !v)
    startToggle(async () => {
      const result = await toggleReviewResolved(demandId)
      if (result.error) {
        setOptimisticResolved((v) => !v)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Organisation tools
          </p>
          <p className="text-xs text-emerald-700/70 mt-0.5">
            Visible only to verified representatives of {orgName}.
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggleResolved}
          disabled={isToggling}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            optimisticResolved
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          {optimisticResolved ? '✓ Dealt with' : 'Mark as dealt with'}
        </button>
      </div>

      {!hasReply ? (
        <form action={formAction} className="space-y-2">
          <label htmlFor="review_reply_body" className="block text-xs font-semibold text-emerald-900">
            Post a public response
          </label>
          <textarea
            id="review_reply_body"
            name="body"
            rows={4}
            maxLength={2000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Respond publicly as ${orgName}…`}
            className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-emerald-700/70">
              Appears publicly as "Response from {orgName}".
            </p>
            <button
              type="submit"
              disabled={isPending || !body.trim()}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Posting…' : 'Post response'}
            </button>
          </div>
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
        </form>
      ) : (
        <p className="text-xs text-emerald-700">
          You have already posted a public response to this review.
        </p>
      )}
    </div>
  )
}
