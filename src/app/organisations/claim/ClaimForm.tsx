'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { submitClaimRequest } from './actions'
import type { Organisation } from '@/types'

function OrgSearchSelect({
  organisations,
  value,
  onChange,
}: {
  organisations: Organisation[]
  value: string
  onChange: (id: string) => void
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
          placeholder="Search for your club…"
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
          No clubs found — <a href="mailto:hello@megafone.co" className="text-[#064E3B] underline">contact us</a> to get yours added.
        </div>
      )}
    </div>
  )
}

export default function ClaimForm({ organisations }: { organisations: Organisation[] }) {
  const [state, formAction, isPending] = useActionState(submitClaimRequest, { error: null })
  const [orgId, setOrgId] = useState('')
  const [isOther, setIsOther] = useState(false)

  if (state.success) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-bold text-[#064E3B] mb-2">Request submitted</p>
        <p className="text-sm text-gray-500">
          We&apos;ve received your request and will be in touch at the email you provided.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="requester_name" className="block text-sm font-semibold text-gray-700 mb-1">
          Your name <span className="text-[#F59E0B]">*</span>
        </label>
        <input
          id="requester_name"
          name="requester_name"
          type="text"
          required
          placeholder="Jane Smith"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
        />
      </div>

      <div>
        <label htmlFor="requester_role" className="block text-sm font-semibold text-gray-700 mb-1">
          Your role <span className="text-[#F59E0B]">*</span>
        </label>
        <input
          id="requester_role"
          name="requester_role"
          type="text"
          required
          placeholder="e.g. Head of Communications"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Your club <span className="text-[#F59E0B]">*</span>
        </label>
        {!isOther ? (
          <>
            <OrgSearchSelect organisations={organisations} value={orgId} onChange={setOrgId} />
            <input type="hidden" name="organisation_id" value={orgId} />
            <button
              type="button"
              onClick={() => { setIsOther(true); setOrgId('') }}
              className="mt-2 text-xs text-gray-400 hover:text-[#064E3B] transition-colors underline"
            >
              My club isn&apos;t listed
            </button>
          </>
        ) : (
          <>
            <input
              name="organisation_other"
              type="text"
              required
              autoFocus
              placeholder="e.g. Hartlepool United"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
            />
            <button
              type="button"
              onClick={() => setIsOther(false)}
              className="mt-2 text-xs text-gray-400 hover:text-[#064E3B] transition-colors underline"
            >
              Search the list instead
            </button>
          </>
        )}
      </div>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-[#064E3B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#065F46] disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Submitting…' : 'Submit claim request'}
      </button>
    </form>
  )
}
