'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveOrganisation, rejectOrganisation } from '../actions'

interface PendingOrg {
  id: string
  name: string
  type: string
  suggested_contact_name: string | null
  suggested_contact_email: string | null
  created_at: string
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function PendingOrgCard({ org }: { org: PendingOrg }) {
  const router = useRouter()
  const [approvePending, startApprove] = useTransition()
  const [rejectPending, startReject] = useTransition()
  const [confirmReject, setConfirmReject] = useState(false)
  const [result, setResult] = useState<{ error: string | null; success?: string } | null>(null)

  function handleApprove() {
    startApprove(async () => {
      const res = await approveOrganisation(org.id)
      setResult(res)
      if (!res.error) router.refresh()
    })
  }

  function handleReject() {
    startReject(async () => {
      const res = await rejectOrganisation(org.id)
      setResult(res)
      if (!res.error) router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-sm font-semibold text-gray-900">{org.name}</span>
          <span className="ml-2 text-[10px] font-medium text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
            {org.type.replace(/_/g, ' ')}
          </span>
        </div>
        <span className="text-xs text-gray-400 shrink-0">{formatDate(org.created_at)}</span>
      </div>

      {(org.suggested_contact_name || org.suggested_contact_email) && (
        <p className="text-xs text-gray-500">
          Contact: {org.suggested_contact_name ?? 'Not provided'}
          {org.suggested_contact_email && <> — {org.suggested_contact_email}</>}
        </p>
      )}

      {!org.suggested_contact_name && !org.suggested_contact_email && (
        <p className="text-xs text-gray-400">No contact details provided.</p>
      )}

      {result?.error && <p className="text-xs text-red-600">{result.error}</p>}
      {result?.success && <p className="text-xs text-emerald-600">{result.success}</p>}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleApprove}
          disabled={approvePending || rejectPending}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {approvePending ? 'Approving...' : 'Approve'}
        </button>
        {!confirmReject ? (
          <button
            onClick={() => setConfirmReject(true)}
            disabled={approvePending || rejectPending}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            Reject
          </button>
        ) : (
          <>
            <button
              onClick={handleReject}
              disabled={approvePending || rejectPending}
              className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              {rejectPending ? 'Rejecting...' : 'Confirm reject'}
            </button>
            <button
              onClick={() => setConfirmReject(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function PendingOrganisations({ orgs }: { orgs: PendingOrg[] }) {
  if (orgs.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <h2 className="text-sm font-bold text-gray-700">
          Pending organisation approval ({orgs.length})
        </h2>
      </div>
      {orgs.map((org) => (
        <PendingOrgCard key={org.id} org={org} />
      ))}
    </div>
  )
}
