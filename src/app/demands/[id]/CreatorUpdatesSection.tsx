'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import CreatorUpdateForm from './CreatorUpdateForm'
import { editCreatorUpdate, deleteCreatorUpdate } from './actions'

interface Update {
  id: string
  body: string
  created_at: string
}

interface Props {
  updates: Update[]
  creatorName: string | null
  isCreator: boolean
  demandId: string
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
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function UpdateItem({ update, isCreator, demandId }: { update: Update; isCreator: boolean; demandId: string; isLatest: boolean }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(update.body)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editPending, startEdit] = useTransition()
  const [deletePending, startDelete] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleEdit() {
    setError(null)
    startEdit(async () => {
      const result = await editCreatorUpdate(update.id, demandId, editText)
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
      const result = await deleteCreatorUpdate(update.id, demandId)
      if (result.error) {
        setError(result.error)
        setConfirmDelete(false)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#064E3B] resize-none"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              disabled={editPending || !editText.trim()}
              className="rounded-lg bg-[#064E3B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#065F46] disabled:opacity-50 transition-colors"
            >
              {editPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => { setEditing(false); setEditText(update.body); setError(null) }}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="group/update">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {update.body}
          </p>

          {isCreator && (
            <div className="mt-2 flex gap-2 opacity-0 group-hover/update:opacity-100 transition-opacity">
              <button
                onClick={() => setEditing(true)}
                className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Edit
              </button>
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
  )
}

export default function CreatorUpdatesSection({ updates, creatorName, isCreator, demandId }: Props) {
  if (updates.length === 0 && !isCreator) return null

  const sorted = [...updates].sort((a, b) => b.created_at.localeCompare(a.created_at))

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-[#064E3B]/[0.03] border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Updates by {creatorName ?? 'the creator'}
        </h2>
        {updates.length > 0 && (
          <span className="text-xs font-semibold text-gray-400">{updates.length} {updates.length === 1 ? 'update' : 'updates'}</span>
        )}
      </div>

      <div className="px-6 py-5">
        {isCreator && (
          <div className={updates.length > 0 ? 'mb-6 pb-6 border-b border-gray-100' : ''}>
            <CreatorUpdateForm demandId={demandId} />
          </div>
        )}

        {sorted.length > 0 && (
          <div className="relative">
            <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-[#064E3B]/15 rounded-full" />

            <div className="space-y-6">
              {sorted.map((update, i) => (
                <div key={update.id} className="relative pl-7">
                  <div className={`absolute left-0 top-1 w-[11px] h-[11px] rounded-full border-2 ${
                    i === 0
                      ? 'bg-[#064E3B] border-[#064E3B]'
                      : 'bg-white border-[#064E3B]/30'
                  }`} />

                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-xs font-semibold text-gray-500">{formatDate(update.created_at)}</p>
                    <span className="text-[10px] text-gray-400">{timeAgo(update.created_at)}</span>
                    {i === 0 && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#064E3B] bg-[#064E3B]/10 rounded-full px-2 py-0.5">
                        Latest
                      </span>
                    )}
                  </div>

                  <UpdateItem
                    update={update}
                    isCreator={isCreator}
                    demandId={demandId}
                    isLatest={i === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {sorted.length === 0 && !isCreator && (
          <p className="text-sm text-gray-400 text-center py-2">No updates yet.</p>
        )}
      </div>
    </div>
  )
}
