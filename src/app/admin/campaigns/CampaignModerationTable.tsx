'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCampaignAsAdmin, approveCampaign, removeCampaign } from '../actions'
import type { AdminCampaign } from './page'

const STATUS_LABELS: Record<string, string> = {
  building: 'Building',
  live: 'Live',
  notified: 'Notified',
  responded: 'Responded',
  further_questions: 'Further questions',
  resolved: 'Resolved',
  unsatisfactory: 'Unsatisfactory',
  not_relevant: 'Not relevant',
}

const STATUS_COLOURS: Record<string, string> = {
  building: 'bg-gray-100 text-gray-500',
  live: 'bg-gray-100 text-gray-500',
  notified: 'bg-amber-50 text-amber-700',
  responded: 'bg-blue-50 text-blue-700',
  further_questions: 'bg-amber-50 text-amber-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  unsatisfactory: 'bg-red-50 text-red-600',
  not_relevant: 'bg-gray-100 text-gray-400',
}

// Score category display labels (OpenAI moderation categories)
const SCORE_LABELS: Record<string, string> = {
  hate: 'Hate',
  'hate/threatening': 'Hate / Threatening',
  harassment: 'Harassment',
  'harassment/threatening': 'Harassment / Threatening',
  'self-harm': 'Self-harm',
  'self-harm/intent': 'Self-harm intent',
  'self-harm/instructions': 'Self-harm instructions',
  'sexual': 'Sexual',
  'sexual/minors': 'Sexual / Minors',
  violence: 'Violence',
  'violence/graphic': 'Violence / Graphic',
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function topScores(scores: Record<string, number> | null): { category: string; score: number }[] {
  if (!scores) return []
  return Object.entries(scores)
    .filter(([, score]) => score > 0.05)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category, score]) => ({ category, score }))
}

function DeleteButton({ campaignId }: { campaignId: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCampaignAsAdmin(campaignId)
      if (result.error) {
        setError(result.error)
        setConfirm(false)
      } else {
        router.refresh()
      }
    })
  }

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="text-xs text-gray-300 hover:text-red-400 transition-colors"
      >
        Delete
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-500">{error}</span>}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
      >
        {isPending ? 'Deleting…' : 'Confirm'}
      </button>
      <button
        type="button"
        onClick={() => { setConfirm(false); setError(null) }}
        className="text-xs text-gray-400 hover:text-gray-600"
      >
        Cancel
      </button>
    </div>
  )
}

function ModerationActions({ campaign }: { campaign: AdminCampaign }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<'approve' | 'remove' | null>(null)

  function handleApprove() {
    setAction('approve')
    startTransition(async () => {
      const result = await approveCampaign(campaign.id)
      if (result.error) { setError(result.error); setAction(null) }
      else router.refresh()
    })
  }

  function handleRemove() {
    setAction('remove')
    startTransition(async () => {
      const result = await removeCampaign(campaign.id)
      if (result.error) { setError(result.error); setAction(null) }
      else router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      {error && <span className="text-xs text-red-500 mr-1">{error}</span>}
      <button
        type="button"
        onClick={handleApprove}
        disabled={isPending}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {isPending && action === 'approve' ? 'Approving…' : 'Approve'}
      </button>
      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending}
        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
      >
        {isPending && action === 'remove' ? 'Removing…' : 'Remove'}
      </button>
      <a
        href={`/demands/${campaign.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        View ↗
      </a>
    </div>
  )
}

function PendingReviewCard({ campaign }: { campaign: AdminCampaign }) {
  const scores = topScores(campaign.moderation_scores)

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
      <div className="flex items-start gap-2 flex-wrap">
        <span className="text-sm font-semibold text-gray-900 leading-snug flex-1">{campaign.headline}</span>
        <span className="rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-700 shrink-0">
          Pending review
        </span>
      </div>
      <p className="text-xs text-gray-500">
        {campaign.organisation?.name ?? '—'}
        {campaign.creator?.name && <> · {campaign.creator.name}</>}
        {' · '}{formatDate(campaign.created_at)}
      </p>
      {scores.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {scores.map(({ category, score }) => (
            <span
              key={category}
              className="rounded-md bg-white border border-amber-200 px-2 py-0.5 text-xs text-amber-800"
            >
              {SCORE_LABELS[category] ?? category}: <strong>{(score * 100).toFixed(0)}%</strong>
            </span>
          ))}
        </div>
      )}
      <ModerationActions campaign={campaign} />
    </div>
  )
}

function CampaignRow({ campaign }: { campaign: AdminCampaign }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0 group">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start gap-2 flex-wrap">
          <a
            href={`/demands/${campaign.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-gray-900 hover:text-[#064E3B] hover:underline transition-colors leading-snug"
          >
            {campaign.headline}
          </a>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOURS[campaign.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {STATUS_LABELS[campaign.status] ?? campaign.status}
          </span>
          {campaign.moderation_status === 'removed' && (
            <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-500">
              Removed
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400">
          {campaign.organisation?.name ?? '—'}
          {campaign.creator?.name && <> · {campaign.creator.name}</>}
          {' · '}{campaign.support_count_cache.toLocaleString()} supporter{campaign.support_count_cache !== 1 ? 's' : ''}
          {' · '}{formatDate(campaign.created_at)}
        </p>
      </div>
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <DeleteButton campaignId={campaign.id} />
      </div>
    </div>
  )
}

const ALL_STATUSES = ['building', 'live', 'notified', 'responded', 'further_questions', 'resolved', 'unsatisfactory', 'not_relevant']

export default function CampaignModerationTable({
  campaigns,
  pendingReview,
}: {
  campaigns: AdminCampaign[]
  pendingReview: AdminCampaign[]
}) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = campaigns.filter((c) => {
    const matchesQuery =
      c.headline.toLowerCase().includes(query.toLowerCase()) ||
      (c.organisation?.name ?? '').toLowerCase().includes(query.toLowerCase()) ||
      (c.creator?.name ?? '').toLowerCase().includes(query.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesQuery && matchesStatus
  })

  return (
    <div className="space-y-6">

      {/* Pending review section */}
      {pendingReview.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-sm font-bold text-gray-700">
              Needs review ({pendingReview.length})
            </h2>
          </div>
          {pendingReview.map((c) => (
            <PendingReviewCard key={c.id} campaign={c} />
          ))}
        </div>
      )}

      {/* All campaigns table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">

        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaigns, organisations, creators…"
              className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
          >
            <option value="all">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <span className="text-xs text-gray-400 shrink-0">
            {filtered.length} of {campaigns.length}
          </span>
        </div>

        {/* Rows */}
        <div className="px-4">
          {filtered.length === 0 ? (
            <p className="py-8 text-sm text-center text-gray-400">No campaigns match your filter.</p>
          ) : (
            filtered.map((c) => <CampaignRow key={c.id} campaign={c} />)
          )}
        </div>

      </div>
    </div>
  )
}
