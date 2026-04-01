'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { postOfficialResponse } from './actions'

interface OfficialResponse {
  id: string
  body: string
  pdf_url?: string | null
  created_at: string
}

interface Props {
  demandId: string
  orgName: string
  responses: OfficialResponse[]
  isOrgRep: boolean
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function OfficialResponseSection({ demandId, orgName, responses, isOrgRep }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const boundAction = postOfficialResponse.bind(null, demandId)
  const [state, formAction, isPending] = useActionState(boundAction, { error: null })
  const [mode, setMode] = useState<'text' | 'pdf'>('text')

  const prevError = useRef(state.error)
  useEffect(() => {
    if (prevError.current !== null && state.error === null) {
      formRef.current?.reset()
      router.refresh()
    }
    prevError.current = state.error
  }, [state.error, router])

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5 bg-green-50">
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-green-800">
          Official Response — {orgName}
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Responses */}
        {responses.length === 0 ? (
          <p className="text-sm text-gray-400">No official response has been posted yet.</p>
        ) : (
          <div className="space-y-5">
            {responses.map((r) => (
              <div key={r.id} className="pl-4 border-l-2 border-green-200">
                <p className="text-xs font-semibold text-green-700 mb-2">{formatDate(r.created_at)}</p>
                {r.body && (
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line mb-3">{r.body}</p>
                )}
                {r.pdf_url && (
                  <a
                    href={r.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-900 underline underline-offset-2"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    View official response (PDF)
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Post response form — org reps only */}
        {isOrgRep && (
          <form ref={formRef} action={formAction} className="pt-4 border-t border-gray-100 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Post an official response
            </p>

            {/* Mode toggle */}
            <div className="flex rounded-lg border border-green-300 overflow-hidden w-fit text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('text')}
                className={`px-3 py-1.5 transition-colors ${mode === 'text' ? 'bg-green-700 text-white' : 'bg-white text-green-700 hover:bg-green-50'}`}
              >
                Type response
              </button>
              <button
                type="button"
                onClick={() => setMode('pdf')}
                className={`px-3 py-1.5 transition-colors ${mode === 'pdf' ? 'bg-green-700 text-white' : 'bg-white text-green-700 hover:bg-green-50'}`}
              >
                Upload PDF
              </button>
            </div>

            {mode === 'text' ? (
              <textarea
                name="body"
                rows={4}
                maxLength={3000}
                placeholder="Write the official response from your organisation…"
                className="w-full rounded-lg border border-green-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            ) : (
              <div className="space-y-2">
                <input
                  type="file"
                  name="pdf"
                  accept="application/pdf"
                  className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-green-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-green-800"
                />
                <p className="text-xs text-gray-400">PDF only, max 10MB</p>
                <textarea
                  name="body"
                  rows={2}
                  maxLength={3000}
                  placeholder="Optional: add a short note alongside the PDF…"
                  className="w-full rounded-lg border border-green-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
            )}

            {state.error && (
              <p className="text-xs text-red-600">{state.error}</p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Posting…' : 'Post official response'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
