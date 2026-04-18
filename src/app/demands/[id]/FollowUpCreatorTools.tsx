'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addFollowUpQuestions, notifyOrgFollowUp } from './actions'

interface Props {
  demandId: string
  orgName: string
  status: string
}

export default function FollowUpCreatorTools({ demandId, orgName, status }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const boundAdd = addFollowUpQuestions.bind(null, demandId)
  const [addState, addFormAction, isAddPending] = useActionState(boundAdd, { error: null })
  const [notifyPending, startNotify] = useTransition()
  const [notifyError, setNotifyError] = useState<string | null>(null)
  const [questions, setQuestions] = useState([''])

  const prevAddError = useRef(addState.error)
  useEffect(() => {
    if (prevAddError.current !== null && addState.error === null) {
      formRef.current?.reset()
      setQuestions([''])
      router.refresh()
    }
    prevAddError.current = addState.error
  }, [addState.error, router])

  function updateQuestion(index: number, value: string) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? value : q)))
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, ''])
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  function handleNotify() {
    setNotifyError(null)
    startNotify(async () => {
      const result = await notifyOrgFollowUp(demandId)
      if (result.error) {
        setNotifyError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-amber-50/60 border-b border-amber-100">
        <h2 className="text-xs font-bold uppercase tracking-widest text-amber-700">
          Add follow-up questions
        </h2>
      </div>

      <form ref={formRef} action={addFormAction} className="px-6 py-5 space-y-3">
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-2 text-sm font-bold text-gray-300 w-5 shrink-0">{i + 1}.</span>
              <input
                type="text"
                name="question"
                value={q}
                onChange={(e) => updateQuestion(i, e.target.value)}
                placeholder={`Follow-up question ${i + 1}`}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
              />
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(i)}
                  className="mt-2 text-gray-300 hover:text-red-400 transition-colors text-sm"
                  aria-label="Remove question"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addQuestion}
          className="text-sm font-medium text-[#064E3B] hover:text-[#065F46] underline underline-offset-2 transition-colors"
        >
          + Add another question
        </button>

        {addState.error && (
          <p className="text-xs text-red-600">{addState.error}</p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isAddPending || questions.every((q) => !q.trim())}
            className="rounded-lg bg-[#064E3B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#065F46] disabled:opacity-50 transition-colors"
          >
            {isAddPending ? 'Adding...' : `Add ${questions.filter((q) => q.trim()).length === 1 ? 'question' : 'questions'}`}
          </button>
        </div>
      </form>

      {status === 'further_questions' && (
        <div className="px-6 pb-5 border-t border-amber-100 pt-4">
          <p className="text-xs text-gray-500 mb-3">
            When you're ready, send your follow-up questions to {orgName}.
          </p>
          <button
            onClick={handleNotify}
            disabled={notifyPending}
            className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {notifyPending ? 'Sending...' : `Notify ${orgName} of follow-up questions`}
          </button>
          {notifyError && (
            <p className="mt-2 text-xs text-red-600">{notifyError}</p>
          )}
        </div>
      )}
    </div>
  )
}
