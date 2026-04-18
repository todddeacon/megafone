'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import OfficialResponseForm from './OfficialResponseForm'
import { editOfficialResponse, deleteOfficialResponse } from './actions'

interface Question {
  id: string
  body: string
  round: number
  created_at: string
}

interface OfficialResponse {
  id: string
  body: string | null
  pdf_url: string | null
  video_url: string | null
  created_at: string
}

interface Props {
  demandId: string
  questions: Question[]
  officialResponses: OfficialResponse[]
  orgName: string
  isOrgRep: boolean
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function ResponseAttachments({ response }: { response: OfficialResponse }) {
  return (
    <>
      {response.pdf_url && (
        <a
          href={response.pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-white text-xs font-semibold text-emerald-700 hover:border-emerald-400 transition-colors"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          View official response (PDF)
        </a>
      )}
      {response.video_url && (
        <div className="rounded-xl overflow-hidden border border-emerald-200">
          <video
            src={response.video_url}
            controls
            className="w-full max-h-80 bg-black"
          />
        </div>
      )}
    </>
  )
}

function ResponseItem({ response, orgName, isOrgRep, demandId, isLatest }: { response: OfficialResponse; orgName: string; isOrgRep: boolean; demandId: string; isLatest: boolean }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(response.body ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editPending, startEdit] = useTransition()
  const [deletePending, startDelete] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleEdit() {
    setError(null)
    startEdit(async () => {
      const result = await editOfficialResponse(response.id, demandId, editText)
      if (result.error) {
        setError(result.error)
      } else {
        setEditing(false)
        router.refresh()
      }
    })
  }

  function handleDelete() {
    setError(null)
    startDelete(async () => {
      const result = await deleteOfficialResponse(response.id, demandId)
      if (result.error) {
        setError(result.error)
        setConfirmDelete(false)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="relative pl-7">
      {/* Timeline dot */}
      <div className={`absolute left-0 top-1 w-[11px] h-[11px] rounded-full border-2 ${
        isLatest
          ? 'bg-emerald-500 border-emerald-500'
          : 'bg-white border-emerald-300'
      }`} />

      {/* Date line */}
      <div className="flex items-center gap-2 mb-1.5">
        <p className="text-xs font-semibold text-gray-500">{formatDate(response.created_at)}</p>
        <span className="text-[10px] text-gray-400">{timeAgo(response.created_at)}</span>
        {isLatest && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
            Latest
          </span>
        )}
      </div>

      {/* Response body */}
      <div>

        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
              maxLength={3000}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                disabled={editPending || !editText.trim()}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {editPending ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => { setEditing(false); setEditText(response.body ?? ''); setError(null) }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="group/response">
            {response.body && (
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line mb-3">
                {response.body}
              </p>
            )}
            <ResponseAttachments response={response} />

            {isOrgRep && (
              <div className="mt-3 flex gap-2 opacity-0 group-hover/response:opacity-100 transition-opacity">
                {response.body && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Edit
                  </button>
                )}
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-[10px] font-semibold text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleDelete}
                      disabled={deletePending}
                      className="text-[10px] font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {deletePending ? 'Deleting...' : 'Confirm delete'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-[10px] text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {error && !editing && <span className="text-[10px] text-red-500">{error}</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ExchangeSection({
  demandId,
  questions,
  officialResponses,
  orgName,
  isOrgRep,
}: Props) {
  if (questions.length === 0 && !isOrgRep) return null

  const isMultiRound = questions.some((q) => q.round > 1)
  const totalCount = questions.length

  if (!isMultiRound) {
    const sortedQuestions = [...questions].sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    )
    const sortedResponses = [...officialResponses].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    )

    return (
      <>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-[#064E3B]/[0.03] border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Questions for {orgName}
          </h2>
          <span className="text-xs text-gray-400">
            {totalCount} {totalCount === 1 ? 'question' : 'questions'}
          </span>
        </div>

        {sortedQuestions.length > 0 && (
          <ol className="divide-y divide-gray-100 list-none">
            {sortedQuestions.map((q, i) => (
              <li key={q.id} className="flex gap-4 px-6 py-5 group">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#064E3B]/[0.06] text-[#064E3B] text-xs font-bold flex items-center justify-center mt-0.5 group-hover:bg-[#064E3B]/10 transition-colors">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-800 leading-relaxed">{q.body}</span>
              </li>
            ))}
          </ol>
        )}

      </div>

      {/* Responses — separate card matching creator updates design */}
      {(sortedResponses.length > 0 || isOrgRep) && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-4">
          <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              Response from {orgName}
            </h2>
            {sortedResponses.length > 0 && (
              <span className="text-xs font-semibold text-emerald-600">
                {sortedResponses.length} {sortedResponses.length === 1 ? 'response' : 'responses'}
              </span>
            )}
          </div>

          {sortedResponses.length > 0 && (
            <div className="px-6 py-5">
              <div className="relative">
                <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-emerald-200 rounded-full" />
                <div className="space-y-6">
                  {sortedResponses.map((response, i) => (
                    <ResponseItem key={response.id} response={response} orgName={orgName} isOrgRep={isOrgRep} demandId={demandId} isLatest={i === 0} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {isOrgRep && (
            <div className="border-t border-emerald-100">
              <OfficialResponseForm demandId={demandId} />
            </div>
          )}
        </div>
      )}
      </>
    )
  }

  // Multi-round
  const maxRound = Math.max(...questions.map((q) => q.round))

  return (
    <div className="space-y-4">
      {Array.from({ length: maxRound }, (_, i) => i + 1).map((round) => {
        const roundQuestions = questions
          .filter((q) => q.round === round)
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
        const previousCount = questions.filter((q) => q.round < round).length

        // Get responses that fall within this round's time window
        const roundStart = roundQuestions[0]?.created_at ?? '0'
        const nextRoundStart = round < maxRound
          ? questions.filter((q) => q.round === round + 1).sort((a, b) => a.created_at.localeCompare(b.created_at))[0]?.created_at
          : null
        const roundResponses = officialResponses
          .filter((r) => r.created_at >= roundStart && (!nextRoundStart || r.created_at < nextRoundStart))
          .sort((a, b) => b.created_at.localeCompare(a.created_at))

        const isLatestRound = round === maxRound
        const roundLabel =
          round === 1 ? 'Round 1 — Initial questions' : `Round ${round} — Follow-up questions`

        return (
          <div key={round}>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div
              className={`px-6 py-3.5 border-b flex items-center justify-between ${
                isLatestRound && roundResponses.length === 0
                  ? 'bg-[#064E3B] border-[#064E3B]'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <span
                className={`text-xs font-bold uppercase tracking-widest ${
                  isLatestRound && roundResponses.length === 0 ? 'text-emerald-200' : 'text-gray-500'
                }`}
              >
                {roundLabel}
              </span>
              {isLatestRound && roundResponses.length === 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Awaiting response
                </span>
              ) : roundResponses.length > 0 ? (
                <span className="text-xs text-gray-400">
                  {roundResponses.length} {roundResponses.length === 1 ? 'response' : 'responses'}
                </span>
              ) : null}
            </div>

            {roundQuestions.length > 0 && (
              <ol className="divide-y divide-gray-100 list-none">
                {roundQuestions.map((q, i) => (
                  <li key={q.id} className="flex gap-4 px-6 py-5 group">
                    <span
                      className={`shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 transition-colors ${
                        round === 1
                          ? 'bg-[#064E3B]/[0.06] text-[#064E3B] group-hover:bg-[#064E3B]/10'
                          : 'bg-amber-50 border border-amber-100 text-amber-600'
                      }`}
                    >
                      {previousCount + i + 1}
                    </span>
                    <span className="text-sm text-gray-800 leading-relaxed">{q.body}</span>
                  </li>
                ))}
              </ol>
            )}

          </div>

          {/* Responses for this round — separate card */}
          {(roundResponses.length > 0 || (isOrgRep && isLatestRound)) && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-4">
              <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                  Response from {orgName}
                </h2>
                {roundResponses.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-600">
                    {roundResponses.length} {roundResponses.length === 1 ? 'response' : 'responses'}
                  </span>
                )}
              </div>

              {roundResponses.length > 0 && (
                <div className="px-6 py-5">
                  <div className="relative">
                    <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-emerald-200 rounded-full" />
                    <div className="space-y-6">
                      {roundResponses.map((response, i) => (
                        <ResponseItem key={response.id} response={response} orgName={orgName} isOrgRep={isOrgRep} demandId={demandId} isLatest={i === 0} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {isOrgRep && isLatestRound && (
                <div className="border-t border-emerald-100">
                  <OfficialResponseForm demandId={demandId} />
                </div>
              )}
            </div>
          )}
          </div>
        )
      })}
    </div>
  )
}
