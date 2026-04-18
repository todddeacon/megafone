'use client'

import { useActionState } from 'react'
import { updateOrgProfile } from './actions'

interface Props {
  orgId: string
  currentDescription: string
  orgName: string
}

export default function OrgProfileForm({ orgId, currentDescription, orgName }: Props) {
  const boundAction = updateOrgProfile.bind(null, orgId)
  const [state, formAction, isPending] = useActionState(boundAction, { error: null })

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-[#064E3B]/[0.03] border-b border-gray-100">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Organisation profile</h3>
        <p className="text-xs text-gray-400 mt-0.5">Visible on your public organisation page.</p>
      </div>

      <form action={formAction} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            About {orgName}
          </label>
          <textarea
            name="description"
            rows={4}
            maxLength={1000}
            defaultValue={currentDescription}
            placeholder="Tell fans about your organisation..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B] resize-none"
          />
          <p className="mt-1 text-xs text-gray-400">Max 1000 characters.</p>
        </div>

        {state.error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
        )}
        {state.success && (
          <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{state.success}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#064E3B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#065F46] disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </div>
  )
}
