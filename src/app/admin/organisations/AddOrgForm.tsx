'use client'

import { useActionState, useState, useEffect } from 'react'
import { addOrganisation, type AddOrgState } from './actions'

const ORG_TYPES = [
  { value: 'football_club', label: 'Football Club' },
  { value: 'rugby_club', label: 'Rugby Club' },
  { value: 'cricket_club', label: 'Cricket Club' },
  { value: 'sports_org', label: 'Sports Organisation' },
  { value: 'other', label: 'Other' },
]

function nameToSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function AddOrgForm() {
  const [state, formAction, pending] = useActionState<AddOrgState, FormData>(
    addOrganisation,
    { error: null }
  )

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)

  // Auto-generate slug from name unless user has manually edited it
  useEffect(() => {
    if (!slugEdited) {
      setSlug(nameToSlug(name))
    }
  }, [name, slugEdited])

  // Reset form on success
  useEffect(() => {
    if (state.success) {
      setName('')
      setSlug('')
      setSlugEdited(false)
    }
  }, [state.success])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-[#064E3B] mb-4">Add Organisation</h2>

      <form action={formAction} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="org-name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="org-name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Manchester United"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] outline-none"
          />
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="org-slug" className="block text-sm font-medium text-gray-700 mb-1">
            Slug
          </label>
          <input
            id="org-slug"
            name="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugEdited(true)
            }}
            placeholder="e.g. manchester-united"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">URL-friendly identifier. Auto-generated from name.</p>
        </div>

        {/* Type */}
        <div>
          <label htmlFor="org-type" className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            id="org-type"
            name="type"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] outline-none bg-white"
          >
            {ORG_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Error / success messages */}
        {state.error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
        )}
        {state.success && (
          <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{state.success}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-[#064E3B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#064E3B]/90 transition-colors disabled:opacity-50"
        >
          {pending ? 'Creating...' : 'Create Organisation'}
        </button>
      </form>
    </div>
  )
}
