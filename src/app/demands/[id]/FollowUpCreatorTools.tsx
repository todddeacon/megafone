'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addFollowUpQuestion, notifyOrgFollowUp } from './actions'

interface Props {
  demandId: string
  orgName: string
  status: string
}

export default function FollowUpCreatorTools({ demandId, orgName, status }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const boundAdd = addFollowUpQuestion.bind(null, demandId)
  const [addState, addFormAction, isAddPending] = useActionState(boundAdd, { error: null })
  const [notifyPending, startNotify] = useTransition()
  const [notifyError, setNotifyError] = useState<string | null>(null)

  const prevAddError = useRef(addState.error)
  useEffect(() => {
    if (prevAddError.current !== null && addState.error === null) {
      formRef.current?.reset()
      router.refresh()
    }
    prevAddError.current = addState.error
  }, [addState.error, router])

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
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-amber-50/60 border-b border-amber-100">
        <h2 className="text-xs font-bold uppercase tracking-widest text-amber-700">
          Add follow-up questions
        </h2>
      </div>

      <form ref={formRef} action={addFormAction} className="px-6 py-5">
        <div className="flex gap-2">
          <input
            name="body"
            type="text"
            required
            placeholder="Type a follow-up question…"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
          />
          <button
            type="submit"
            disabled={isAddPending}
            className="rounded-lg bg-[#064E3B] px-4 py-2 text-sm font-semibold text-white hover:opacity-80 disabled:opacity-50 transition-opacity whitespace-nowrap"
          >
            {isAddPending ? 'Adding…' : 'Add'}
          </button>
        </div>
        {addState.error && (
          <p className="mt-1 text-xs text-red-600">{addState.error}</p>
        )}
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
            {notifyPending ? 'Sending…' : `Notify ${orgName} of follow-up questions`}
          </button>
          {notifyError && (
            <p className="mt-2 text-xs text-red-600">{notifyError}</p>
          )}
        </div>
      )}
    </div>
  )
}
