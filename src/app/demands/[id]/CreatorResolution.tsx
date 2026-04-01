'use client'

import { useState, useTransition } from 'react'
import { setResolutionStatus } from './actions'

interface Props {
  demandId: string
}

const OPTIONS = [
  {
    value: 'resolved',
    label: 'Resolved',
    description: 'The organisation has satisfactorily addressed the campaign.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    style: 'border-gray-200 hover:border-green-400 hover:bg-green-50 text-gray-700 hover:text-green-700',
    activeStyle: 'border-green-400 bg-green-50 text-green-700',
  },
  {
    value: 'unsatisfactory',
    label: 'Unsatisfactory Response',
    description: "The response doesn't adequately address the campaign.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    style: 'border-gray-200 hover:border-red-400 hover:bg-red-50 text-gray-700 hover:text-red-700',
    activeStyle: 'border-red-400 bg-red-50 text-red-700',
  },
  {
    value: 'further_questions',
    label: 'Further Questions',
    description: 'The response raises further questions that need answering.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    style: 'border-gray-200 hover:border-amber-400 hover:bg-amber-50 text-gray-700 hover:text-amber-700',
    activeStyle: 'border-amber-400 bg-amber-50 text-amber-700',
  },
] as const

export default function CreatorResolution({ demandId }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    if (!selected) return
    setError(null)
    startTransition(async () => {
      const result = await setResolutionStatus(demandId, selected)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Mark the outcome</h3>
          <p className="text-xs text-gray-500 mt-0.5">As the campaign creator, how would you describe the organisation's response?</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSelected(opt.value)}
            className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${selected === opt.value ? opt.activeStyle : opt.style}`}
          >
            <div className="flex items-center gap-3">
              <span className="shrink-0">{opt.icon}</span>
              <div>
                <p className="text-sm font-semibold">{opt.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{opt.description}</p>
              </div>
              {selected === opt.value && (
                <div className="ml-auto shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!selected || isPending}
        className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-40 transition-colors"
      >
        {isPending ? 'Saving…' : 'Confirm outcome'}
      </button>
    </div>
  )
}
