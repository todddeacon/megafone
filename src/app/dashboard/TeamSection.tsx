'use client'

import { useActionState, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addTeamMember, removeTeamEmail, removeOrgRep } from './actions'

interface Rep {
  id: string
  userId: string
  name: string
  email: string
  createdAt: string
}

interface NotifEmail {
  id: string
  email: string
  name: string | null
  title: string | null
  createdAt: string
}

interface Props {
  orgId: string
  orgName: string
  reps: Rep[]
  notifEmails: NotifEmail[]
}

function RemoveButton({ onRemove, label }: { onRemove: () => Promise<void>; label: string }) {
  const [confirm, setConfirm] = useState(false)
  const [pending, startTransition] = useTransition()

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="text-[10px] font-semibold text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover/row:opacity-100"
      >
        Remove
      </button>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => startTransition(onRemove)}
        disabled={pending}
        className="text-[10px] font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
      >
        {pending ? 'Removing...' : `Remove ${label}`}
      </button>
      <button
        onClick={() => setConfirm(false)}
        className="text-[10px] text-gray-400 hover:text-gray-600"
      >
        Cancel
      </button>
    </div>
  )
}

export default function TeamSection({ orgId, orgName, reps, notifEmails }: Props) {
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(false)
  const boundAdd = addTeamMember.bind(null, orgId)
  const [addState, addFormAction, isAddPending] = useActionState(boundAdd, { error: null })

  // Combine reps and notification emails into a unified view
  // Some people might be both a rep AND a notification email contact
  const repEmails = new Set(reps.map((r) => r.email.toLowerCase()))

  // Notification-only contacts (not yet org reps)
  const notifOnly = notifEmails.filter((e) => !repEmails.has(e.email.toLowerCase()))

  if (addState.success) {
    setShowAddForm(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-[#064E3B]/[0.03] border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Team — {orgName}
        </h3>
        <span className="text-xs text-gray-400">
          {reps.length} rep{reps.length !== 1 ? 's' : ''} · {notifEmails.length} contact{notifEmails.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Active reps — can respond to campaigns */}
        {reps.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Verified representatives
            </p>
            <div className="space-y-2">
              {reps.map((rep) => (
                <div key={rep.id} className="flex items-center justify-between gap-3 group/row py-1">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{rep.name}</p>
                    <p className="text-xs text-gray-400 truncate">{rep.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5">
                      Can respond
                    </span>
                    <RemoveButton
                      onRemove={async () => { await removeOrgRep(orgId, rep.id); router.refresh() }}
                      label="rep"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notification-only contacts — receive emails but can't respond yet */}
        {notifOnly.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Notification contacts
            </p>
            <div className="space-y-2">
              {notifOnly.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between gap-3 group/row py-1">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {contact.name || contact.email}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {contact.name ? contact.email : ''}
                      {contact.title && (contact.name ? ' · ' : '')}{contact.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                      Email only
                    </span>
                    <RemoveButton
                      onRemove={async () => { await removeTeamEmail(orgId, contact.id); router.refresh() }}
                      label="contact"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reps.length === 0 && notifOnly.length === 0 && !showAddForm && (
          <p className="text-sm text-gray-400 text-center py-2">No team members yet.</p>
        )}

        {/* Add team member form */}
        {showAddForm ? (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Add team member
            </p>
            <form action={addFormAction} className="space-y-2">
              <input
                name="name"
                type="text"
                placeholder="Name (optional)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
              />
              <input
                name="title"
                type="text"
                placeholder="Job title (optional)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="Email address"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
              />
              <p className="text-xs text-gray-400">
                They'll receive campaign notifications. If they sign up with this email, they'll automatically be able to respond.
              </p>

              {addState.error && (
                <p className="text-xs text-red-600">{addState.error}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isAddPending}
                  className="rounded-lg bg-[#064E3B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#065F46] disabled:opacity-50 transition-colors"
                >
                  {isAddPending ? 'Adding...' : 'Add to team'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="text-sm font-medium text-[#064E3B] hover:text-[#065F46] underline underline-offset-2 transition-colors"
          >
            + Add team member
          </button>
        )}
      </div>
    </div>
  )
}
