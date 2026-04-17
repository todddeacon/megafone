'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { addCreatorUpdate } from './actions'

interface Props {
  demandId: string
}

export default function CreatorUpdateForm({ demandId }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const boundAction = addCreatorUpdate.bind(null, demandId)
  const [state, formAction, isPending] = useActionState(boundAction, { error: null })

  const prevError = useRef(state.error)
  useEffect(() => {
    if (prevError.current !== null && state.error === null) {
      formRef.current?.reset()
      router.refresh()
    }
    prevError.current = state.error
  }, [state.error, router])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-[#064E3B]/[0.03] border-b border-gray-100">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Post an update</h2>
        <p className="text-xs text-gray-400 mt-0.5">Share new information or context with supporters.</p>
      </div>
      <form ref={formRef} action={formAction} className="p-6 space-y-3">
        <textarea
          name="body"
          rows={3}
          required
          maxLength={2000}
          placeholder="What's the latest…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
        />
        {state.error && (
          <p className="text-xs text-red-600">{state.error}</p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Posting…' : 'Post update'}
          </button>
        </div>
      </form>
    </div>
  )
}
