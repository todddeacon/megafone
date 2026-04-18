'use client'

import { useActionState, useState, useTransition } from 'react'
import { updateDemand, deleteDemand } from './actions'
import type { Organisation } from '@/types'

interface Question {
  id: string
  body: string
}

interface Link {
  url: string
  title: string
}

interface Props {
  demandId: string
  organisations: Organisation[]
  initial: {
    headline: string
    organisation_id: string
    summary: string
    notification_threshold: number | null
    target_person: string | null
    questions: Question[]
    links: Link[]
  }
}

export default function EditDemandForm({ demandId, organisations, initial }: Props) {
  const boundAction = updateDemand.bind(null, demandId)
  const [state, formAction, isPending] = useActionState(boundAction, { error: null })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, startDelete] = useTransition()

  const [questions, setQuestions] = useState<string[]>(
    initial.questions.length > 0 ? initial.questions.map((q) => q.body) : ['']
  )
  const [links, setLinks] = useState<Link[]>(initial.links)

  function addQuestion() { setQuestions((prev) => [...prev, '']) }
  function removeQuestion(i: number) { setQuestions((prev) => prev.filter((_, j) => j !== i)) }
  function updateQuestion(i: number, v: string) { setQuestions((prev) => prev.map((q, j) => j === i ? v : q)) }

  function addLink() { setLinks((prev) => [...prev, { url: '', title: '' }]) }
  function removeLink(i: number) { setLinks((prev) => prev.filter((_, j) => j !== i)) }
  function updateLink(i: number, field: 'url' | 'title', v: string) {
    setLinks((prev) => prev.map((l, j) => j === i ? { ...l, [field]: v } : l))
  }

  return (
    <form action={formAction} className="space-y-8">
      {/* Headline */}
      <div>
        <label htmlFor="headline" className="block text-sm font-semibold text-gray-900 mb-1">
          Headline <span className="text-red-500">*</span>
        </label>
        <input
          id="headline"
          name="headline"
          type="text"
          required
          maxLength={140}
          defaultValue={initial.headline}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <p className="mt-1 text-xs text-gray-400">Max 140 characters.</p>
      </div>

      {/* Target organisation */}
      <div>
        <label htmlFor="organisation_id" className="block text-sm font-semibold text-gray-900 mb-1">
          Target organisation <span className="text-red-500">*</span>
        </label>
        <select
          id="organisation_id"
          name="organisation_id"
          required
          defaultValue={initial.organisation_id}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Select an organisation…</option>
          {organisations.map((org) => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div>
        <label htmlFor="summary" className="block text-sm font-semibold text-gray-900 mb-1">
          Summary / context <span className="text-red-500">*</span>
        </label>
        <textarea
          id="summary"
          name="summary"
          required
          rows={4}
          defaultValue={initial.summary}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
        />
      </div>

      {/* Questions */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Questions <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-2 text-sm text-gray-400 w-5 shrink-0">{i + 1}.</span>
              <input
                type="text"
                name="question"
                value={q}
                onChange={(e) => updateQuestion(i, e.target.value)}
                placeholder={`Question ${i + 1}`}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(i)}
                  className="mt-2 text-gray-400 hover:text-red-500 text-sm"
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
          className="mt-2 text-sm text-gray-600 hover:text-gray-900 underline"
        >
          + Add another question
        </button>
      </div>

      {/* Target person or group */}
      <div>
        <label htmlFor="target_person" className="block text-sm font-semibold text-gray-900 mb-1">
          Target person or group <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          id="target_person"
          name="target_person"
          type="text"
          defaultValue={initial.target_person ?? undefined}
          placeholder="e.g. The Board, Director of Football, CEO"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <p className="mt-1 text-xs text-gray-400">
          Who specifically at the organisation should see this campaign?
        </p>
      </div>

      {/* Notification threshold */}
      <div>
        <label htmlFor="notification_threshold" className="block text-sm font-semibold text-gray-900 mb-1">
          Supporter target <span className="text-red-500">*</span>
        </label>
        <input
          id="notification_threshold"
          name="notification_threshold"
          type="number"
          required
          min={100}
          defaultValue={initial.notification_threshold ?? undefined}
          placeholder="e.g. 500"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <p className="mt-1 text-xs text-gray-400">
          Minimum 100. The number of supporters you want to reach before the organisation is notified.
        </p>
      </div>

      {/* Links */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Related content <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="space-y-3">
          {links.map((link, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={link.title}
                  onChange={(e) => updateLink(i, 'title', e.target.value)}
                  placeholder="Title"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateLink(i, 'url', e.target.value)}
                  placeholder="https://…"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="mt-2 text-gray-400 hover:text-red-500 text-sm"
                aria-label="Remove link"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <input type="hidden" name="link_count" value={links.length} />
        {links.map((link, i) => (
          <span key={i}>
            <input type="hidden" name={`link_url_${i}`} value={link.url} />
            <input type="hidden" name={`link_title_${i}`} value={link.title} />
          </span>
        ))}

        <button
          type="button"
          onClick={addLink}
          className="mt-2 text-sm text-gray-600 hover:text-gray-900 underline"
        >
          + Add a link
        </button>
      </div>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#F59E0B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#D97706] disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
        <a
          href={`/demands/${demandId}`}
          className="rounded-lg border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </a>
      </div>

      {/* Delete section */}
      <div className="border-t border-gray-200 pt-8 mt-4">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Delete this campaign
          </button>
        ) : (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-red-700">Delete this campaign?</p>
            <p className="text-sm text-red-600">This cannot be undone. All supporters and questions will be permanently removed.</p>
            {deleteError && (
              <p className="text-sm text-red-600 font-medium">{deleteError}</p>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  startDelete(async () => {
                    const result = await deleteDemand(demandId)
                    if (result?.error) setDeleteError(result.error)
                  })
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Deleting…' : 'Yes, delete permanently'}
              </button>
              <button
                type="button"
                onClick={() => { setConfirmDelete(false); setDeleteError(null) }}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
