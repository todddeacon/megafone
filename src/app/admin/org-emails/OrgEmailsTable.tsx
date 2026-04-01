'use client'

import { useActionState, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addOrgNotificationEmail, removeOrgNotificationEmail } from '../actions'
import type { OrgWithEmails, NotificationEmail } from './page'

// ── Email chip with remove button ─────────────────────────────────────────────

function EmailChip({ entry, orgId }: { entry: NotificationEmail; orgId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmRemove, setConfirmRemove] = useState(false)

  function handleRemove() {
    startTransition(async () => {
      await removeOrgNotificationEmail(entry.id)
      router.refresh()
    })
  }

  const isOrgRep = entry.source === 'org_rep'

  return (
    <div className="flex items-center gap-2 py-1.5 group">
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="text-sm text-gray-800 truncate">{entry.email}</span>
        {entry.label && (
          <span className="text-xs text-gray-400 truncate">{entry.label}</span>
        )}
        <span className={`shrink-0 text-xs rounded px-1.5 py-0.5 font-medium ${
          isOrgRep
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {isOrgRep ? 'Claimed rep' : 'Manual'}
        </span>
      </div>

      {!confirmRemove ? (
        <button
          type="button"
          onClick={() => setConfirmRemove(true)}
          className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xs"
          aria-label="Remove email"
        >
          Remove
        </button>
      ) : (
        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            {isPending ? 'Removing…' : 'Confirm'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmRemove(false)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

// ── Add email inline form ─────────────────────────────────────────────────────

function AddEmailForm({ orgId, onSuccess }: { orgId: string; onSuccess: () => void }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(addOrgNotificationEmail, { error: null })

  if (state.success) {
    router.refresh()
    onSuccess()
  }

  return (
    <form action={formAction} className="flex items-start gap-2 mt-2">
      <input type="hidden" name="organisation_id" value={orgId} />
      <div className="flex-1 space-y-1.5">
        <input
          name="email"
          type="email"
          required
          placeholder="Email address"
          autoFocus
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
        />
        <input
          name="label"
          type="text"
          placeholder="Label (optional — e.g. Press office)"
          className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
        />
        {state.error && <p className="text-xs text-red-500">{state.error}</p>}
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#064E3B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#065F46] disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Adding…' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onSuccess}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Org row ───────────────────────────────────────────────────────────────────

function OrgRow({ org }: { org: OrgWithEmails }) {
  const [adding, setAdding] = useState(false)

  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3">
        {/* Initials */}
        <div className="w-8 h-8 rounded-full bg-[#064E3B]/10 flex items-center justify-center text-xs font-bold text-[#064E3B] shrink-0 mt-0.5">
          {org.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-gray-900">{org.name}</span>
            {!adding && (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="shrink-0 text-xs text-gray-400 hover:text-[#064E3B] transition-colors"
              >
                + Add email
              </button>
            )}
          </div>

          {org.emails.length > 0 && (
            <div className="mt-1 divide-y divide-gray-50">
              {org.emails.map((e) => (
                <EmailChip key={e.id} entry={e} orgId={org.id} />
              ))}
            </div>
          )}

          {org.emails.length === 0 && !adding && (
            <p className="text-xs text-gray-300 mt-1">No emails set</p>
          )}

          {adding && (
            <AddEmailForm orgId={org.id} onSuccess={() => setAdding(false)} />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Table with filter ─────────────────────────────────────────────────────────

export default function OrgEmailsTable({ organisations }: { organisations: OrgWithEmails[] }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'set' | 'missing'>('all')

  const filtered = organisations.filter((org) => {
    const matchesQuery = org.name.toLowerCase().includes(query.toLowerCase())
    const matchesFilter =
      filter === 'all' ||
      (filter === 'set' && org.emails.length > 0) ||
      (filter === 'missing' && org.emails.length === 0)
    return matchesQuery && matchesFilter
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">

      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div className="relative flex-1">
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
            placeholder="Filter clubs…"
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
          />
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
          {(['all', 'set', 'missing'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-2 capitalize transition-colors ${
                filter === f ? 'bg-[#064E3B] text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="px-4">
        {filtered.length === 0 ? (
          <p className="py-8 text-sm text-center text-gray-400">No clubs match your filter.</p>
        ) : (
          filtered.map((org) => <OrgRow key={org.id} org={org} />)
        )}
      </div>

    </div>
  )
}
