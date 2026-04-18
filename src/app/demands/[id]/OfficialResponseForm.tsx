'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { postOfficialResponse } from './actions'

interface Props {
  demandId: string
}

export default function OfficialResponseForm({ demandId }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const boundAction = postOfficialResponse.bind(null, demandId)
  const [state, formAction, isPending] = useActionState(boundAction, { error: null })
  const [showPdf, setShowPdf] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [showLink, setShowLink] = useState(false)

  const prevError = useRef(state.error)
  useEffect(() => {
    if (prevError.current !== null && state.error === null) {
      formRef.current?.reset()
      setShowPdf(false)
      setShowVideo(false)
      setShowLink(false)
      router.refresh()
    }
    prevError.current = state.error
  }, [state.error, router])

  return (
    <form ref={formRef} action={formAction} className="px-6 py-5 space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
        Post an official response
      </p>

      <textarea
        name="body"
        rows={4}
        maxLength={3000}
        placeholder="Write the official response from your organisation…"
        className="w-full rounded-lg border border-green-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
      />
      <p className="text-xs text-amber-600">
        All supporters of this campaign will be notified via email when you post this response.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowPdf((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
            showPdf
              ? 'bg-green-700 text-white border-green-700'
              : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Attach PDF
        </button>
        <button
          type="button"
          onClick={() => setShowVideo((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
            showVideo
              ? 'bg-green-700 text-white border-green-700'
              : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Attach video
        </button>
        <button
          type="button"
          onClick={() => setShowLink((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
            showLink
              ? 'bg-green-700 text-white border-green-700'
              : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Add link
        </button>
      </div>

      {showPdf && (
        <div className="space-y-1">
          <input
            type="file"
            name="pdf"
            accept="application/pdf"
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-green-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-green-800"
          />
          <p className="text-xs text-gray-400">PDF only, max 10 MB</p>
        </div>
      )}

      {showVideo && (
        <div className="space-y-1">
          <input
            type="file"
            name="video"
            accept="video/*"
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-green-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-green-800"
          />
          <p className="text-xs text-gray-400">Video file, max 100 MB</p>
        </div>
      )}

      {showLink && (
        <div className="space-y-2">
          <input
            name="link_title"
            type="text"
            placeholder="Link title (e.g. Official statement)"
            className="w-full rounded-lg border border-green-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            name="link_url"
            type="url"
            placeholder="https://…"
            className="w-full rounded-lg border border-green-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      )}

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}

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
  )
}
