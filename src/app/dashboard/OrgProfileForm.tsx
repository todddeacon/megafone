'use client'

import { useActionState } from 'react'
import { updateOrgProfile, uploadOrgLogo } from './actions'
import OrgAvatar from '@/components/OrgAvatar'

interface Props {
  orgId: string
  currentDescription: string
  orgName: string
  logoUrl: string | null
}

export default function OrgProfileForm({ orgId, currentDescription, orgName, logoUrl }: Props) {
  const boundAction = updateOrgProfile.bind(null, orgId)
  const [state, formAction, isPending] = useActionState(boundAction, { error: null })

  const boundLogoAction = uploadOrgLogo.bind(null, orgId)
  const [logoState, logoFormAction, isLogoUploading] = useActionState(boundLogoAction, { error: null })

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-[#064E3B]/[0.03] border-b border-gray-100">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Organisation profile</h3>
        <p className="text-xs text-gray-400 mt-0.5">Visible on your public organisation page.</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Logo upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Club badge
          </label>
          <div className="flex items-center gap-4">
            <OrgAvatar name={orgName} logoUrl={logoUrl} size="xl" />
            <form action={logoFormAction} className="flex-1">
              <input
                type="file"
                name="logo"
                accept="image/*"
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#064E3B] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#065F46]"
              />
              <p className="mt-1 text-xs text-gray-400">PNG, JPG, or SVG. Max 2MB.</p>
              {logoState.error && (
                <p className="mt-1 text-xs text-red-600">{logoState.error}</p>
              )}
              {logoState.success && (
                <p className="mt-1 text-xs text-emerald-600">{logoState.success}</p>
              )}
              <button
                type="submit"
                disabled={isLogoUploading}
                className="mt-2 rounded-lg bg-[#064E3B] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#065F46] disabled:opacity-50 transition-colors"
              >
                {isLogoUploading ? 'Uploading...' : 'Upload badge'}
              </button>
            </form>
          </div>
        </div>

        {/* Description */}
        <form action={formAction} className="space-y-4">
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
    </div>
  )
}
