'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { addFollowUpQuestion } from './actions'

interface Question {
  id: string
  body: string
  is_followup: boolean
  created_at: string
}

interface Props {
  demandId: string
  initialQuestions: Question[]
  followUpQuestions: Question[]
  isCreator: boolean
  orgName: string
}

export default function QuestionsSection({
  demandId,
  initialQuestions,
  followUpQuestions,
  isCreator,
  orgName,
}: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const boundAction = addFollowUpQuestion.bind(null, demandId)
  const [state, formAction, isPending] = useActionState(boundAction, { error: null })

  const prevError = useRef(state.error)
  useEffect(() => {
    if (prevError.current !== null && state.error === null) {
      formRef.current?.reset()
      router.refresh()
    }
    prevError.current = state.error
  }, [state.error, router])

  const totalInitial = initialQuestions.length

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-[#064E3B]/[0.03] border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Questions for {orgName}</h2>
        <span className="text-xs text-gray-400">{totalInitial + followUpQuestions.length} {totalInitial + followUpQuestions.length === 1 ? 'question' : 'questions'}</span>
      </div>

      {/* Initial questions */}
      {initialQuestions.length > 0 && (
        <ol className="divide-y divide-gray-100 list-none">
          {initialQuestions.map((q, i) => (
            <li key={q.id} className="flex gap-4 px-6 py-5 group">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#064E3B]/[0.06] text-[#064E3B] text-xs font-bold flex items-center justify-center mt-0.5 group-hover:bg-[#064E3B]/10 transition-colors">
                {i + 1}
              </span>
              <span className="text-sm text-gray-800 leading-relaxed">{q.body}</span>
            </li>
          ))}
        </ol>
      )}

      {/* Follow-up questions */}
      {followUpQuestions.length > 0 && (
        <>
          <div className="flex items-center gap-3 px-6 py-3 bg-amber-50/50 border-t border-amber-100">
            <div className="flex-1 border-t border-amber-100" />
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest shrink-0">
              Follow-up
            </span>
            <div className="flex-1 border-t border-amber-100" />
          </div>
          <ol className="divide-y divide-gray-100 list-none">
            {followUpQuestions.map((q, i) => (
              <li key={q.id} className="flex gap-4 px-6 py-5 group">
                <span className="shrink-0 w-6 h-6 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-xs font-bold flex items-center justify-center mt-0.5">
                  {totalInitial + i + 1}
                </span>
                <span className="text-sm text-gray-800 leading-relaxed">{q.body}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      {/* Add follow-up form — creator only */}
      {isCreator && (
        <form ref={formRef} action={formAction} className="px-6 py-5 border-t border-gray-100">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            Add a follow-up question
          </p>
          <div className="flex gap-2">
            <input
              name="body"
              type="text"
              required
              placeholder="Your follow-up question…"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
            />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-[#064E3B] px-4 py-2 text-sm font-semibold text-white hover:opacity-80 disabled:opacity-50 transition-opacity whitespace-nowrap"
            >
              {isPending ? 'Adding…' : 'Add'}
            </button>
          </div>
          {state.error && (
            <p className="mt-1 text-xs text-red-600">{state.error}</p>
          )}
        </form>
      )}
    </div>
  )
}
