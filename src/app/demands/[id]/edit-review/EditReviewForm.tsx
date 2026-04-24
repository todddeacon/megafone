'use client'

import { useActionState, useState } from 'react'
import { updateReview } from './actions'

interface Props {
  demandId: string
  initial: {
    headline: string
    reviewing_subject: string
    summary: string
    rating: number | null
    reviewer_display_mode: 'real_name' | 'nickname' | 'anonymous'
  }
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B] transition-shadow'
const labelClass = 'block text-sm font-semibold text-gray-900 mb-1'

export default function EditReviewForm({ demandId, initial }: Props) {
  const [state, formAction, isPending] = useActionState(
    updateReview.bind(null, demandId),
    { error: null }
  )

  const [headline, setHeadline] = useState(initial.headline)
  const [reviewingSubject, setReviewingSubject] = useState(initial.reviewing_subject)
  const [summary, setSummary] = useState(initial.summary)
  const [rating, setRating] = useState<number | null>(initial.rating)
  const [displayMode, setDisplayMode] = useState(initial.reviewer_display_mode)

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="rating" value={rating ?? ''} />
      <input type="hidden" name="reviewer_display_mode" value={displayMode} />

      <div>
        <label htmlFor="headline" className={labelClass}>
          Headline <span className="text-[#F59E0B]">*</span>
        </label>
        <input
          id="headline"
          name="headline"
          type="text"
          required
          maxLength={100}
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="reviewing_subject" className={labelClass}>
          What are you reviewing? <span className="text-[#F59E0B]">*</span>
        </label>
        <input
          id="reviewing_subject"
          name="reviewing_subject"
          type="text"
          required
          maxLength={150}
          value={reviewingSubject}
          onChange={(e) => setReviewingSubject(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="summary" className={labelClass}>
          Your review <span className="text-[#F59E0B]">*</span>
        </label>
        <textarea
          id="summary"
          name="summary"
          required
          rows={6}
          minLength={50}
          maxLength={2000}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className={`${inputClass} resize-none`}
        />
        <p className="mt-1 text-xs text-gray-400">
          {summary.length} / 2000 characters · minimum 50
        </p>
      </div>

      <div>
        <label className={labelClass}>
          Your rating <span className="text-[#F59E0B]">*</span>
        </label>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
              className={`flex items-center justify-center rounded-md border transition-colors w-11 h-11 ${
                rating === n
                  ? 'bg-[#F59E0B] border-[#F59E0B] text-white'
                  : 'border-gray-200 text-gray-400 hover:border-[#F59E0B] hover:text-[#F59E0B]'
              }`}
            >
              {n === 0 ? (
                <span className="text-sm font-bold">0</span>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.366 2.446c-.784.57-1.84-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.652 9.154c-.784-.57-.381-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                </svg>
              )}
            </button>
          ))}
          <span className="ml-3 text-sm font-semibold text-gray-700">
            {rating === null ? 'Select a rating' : `${rating} / 5`}
          </span>
        </div>
      </div>

      <div>
        <label className={labelClass}>How should we show your name?</label>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-semibold">
          {(['real_name', 'nickname', 'anonymous'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setDisplayMode(mode)}
              className={`flex-1 px-3 py-2 transition-colors ${
                displayMode === mode ? 'bg-[#064E3B] text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {mode === 'real_name' ? 'My name' : mode === 'nickname' ? 'My nickname' : 'Anonymous'}
            </button>
          ))}
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <div className="flex gap-3">
        <a
          href={`/demands/${demandId}`}
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-[#F59E0B] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#D97706] disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
