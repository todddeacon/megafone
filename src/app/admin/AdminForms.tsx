'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { addOrgNotificationEmail } from './actions'

interface Org {
  id: string
  name: string
}

// ── Org search-select ──────────────────────────────────────────────────────

function OrgSearchSelect({
  organisations,
  value,
  onChange,
  placeholder = 'Search organisations…',
}: {
  organisations: Org[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = organisations.find((o) => o.id === value)

  const results = query.trim()
    ? organisations.filter((o) => o.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#064E3B]/10 flex items-center justify-center text-xs font-bold text-[#064E3B] shrink-0">
            {selected.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-900">{selected.name}</span>
        </div>
        <button
          type="button"
          onClick={() => { onChange(''); setQuery(''); setTimeout(() => inputRef.current?.focus(), 50) }}
          className="text-gray-400 hover:text-gray-600 transition-colors text-xs font-bold"
          aria-label="Clear selection"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B] transition-shadow"
          autoComplete="off"
        />
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {results.map((org) => (
            <li key={org.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(org.id); setQuery(''); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-full bg-[#064E3B]/10 flex items-center justify-center text-xs font-bold text-[#064E3B] shrink-0">
                  {org.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                </div>
                {org.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && results.length === 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-3 text-sm text-gray-400">
          No organisations found
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">{title}</h2>
      {children}
    </div>
  )
}

function StatusMessage({ state }: { state: { error: string | null; success?: string } }) {
  if (state.error) return <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
  if (state.success) return <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{state.success}</p>
  return null
}

function SaveButton({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[#064E3B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#065F46] disabled:opacity-50 transition-colors"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

// ─── Organisation contact emails ─────────────────────────────────────────────

function OrgContactEmailForm({ organisations }: { organisations: Org[] }) {
  const [state, formAction, isPending] = useActionState(addOrgNotificationEmail, { error: null })
  const [selectedId, setSelectedId] = useState('')

  return (
    <Section title="Organisation contact emails">
      <div className="flex items-center justify-between mb-6 -mt-2">
        <p className="text-sm text-gray-500">Emails that receive a notification when a campaign hits its target.</p>
        <a
          href="/admin/org-emails"
          className="shrink-0 ml-4 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          Manage all →
        </a>
      </div>
      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Organisation</label>
          <OrgSearchSelect
            organisations={organisations}
            value={selectedId}
            onChange={setSelectedId}
            placeholder="Search for a club…"
          />
          <input type="hidden" name="organisation_id" value={selectedId} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Email address</label>
          <input
            name="email"
            type="email"
            required
            placeholder="notifications@club.co.uk"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Label <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            name="label"
            type="text"
            placeholder="e.g. Press office"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
          />
        </div>
        <StatusMessage state={state} />
        <SaveButton pending={isPending} label="Add email" pendingLabel="Adding…" />
      </form>
    </Section>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function AdminForms({ organisations }: { organisations: Org[] }) {
  return <OrgContactEmailForm organisations={organisations} />
}
