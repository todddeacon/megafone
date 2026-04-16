'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { createDemand } from './actions'
import type { Organisation } from '@/types'

// ── Search + Select ────────────────────────────────────────────────────────

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
    ? organisations
        .filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)
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
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
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
          placeholder="Search for a club…"
          className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B] transition-shadow"
          autoComplete="off"
        />
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {results.map((org) => (
            <li key={org.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(org.id); setQuery(''); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                  {org.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                </div>
                {org.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && query.trim() && results.length === 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg px-3 py-3 text-sm text-gray-400">
          No clubs found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B] transition-shadow'

const labelClass = 'block text-sm font-semibold text-gray-900 mb-1'

// ── Preview ────────────────────────────────────────────────────────────────

interface PreviewProps {
  headline: string
  orgName: string
  summary: string
  questions: string[]
  threshold: number
  onBack: () => void
  onPublish: () => void
  isPending: boolean
}

function CampaignPreview({ headline, orgName, summary, questions, threshold, onBack, onPublish, isPending }: PreviewProps) {
  const filled = questions.filter((q) => q.trim())

  function OrgAvatar() {
    const initials = orgName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    return (
      <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
        {initials}
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Banner */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-amber-800">Preview mode</p>
          <p className="text-xs text-amber-700 mt-0.5">This is exactly how your campaign will appear to other fans. Review it carefully before publishing.</p>
        </div>
      </div>

      {/* Campaign header card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <OrgAvatar />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500">{orgName}</p>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500 mt-1">
                No response
              </span>
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-[#064E3B] leading-snug">
          {headline}
        </h1>
      </div>

      {/* Supporter count card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-end justify-between mb-5">
          <div>
            <span className="text-3xl font-black text-[#064E3B] tracking-tight">{filled.length}</span>
            <span className="ml-1.5 text-sm text-gray-400">{filled.length === 1 ? 'question' : 'questions'}</span>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-[#064E3B] tracking-tight">1</span>
            <span className="ml-1.5 text-sm text-gray-400">supporter</span>
          </div>
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Notification target</span>
            <span className="text-xs font-bold text-gray-900">
              1 <span className="text-gray-400 font-normal">/ {threshold.toLocaleString('en-GB')}</span>
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#F59E0B] transition-all duration-500"
              style={{ width: `${Math.min(100, (1 / threshold) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {threshold - 1} more {threshold - 1 === 1 ? 'supporter' : 'supporters'} needed to notify the organisation.
          </p>
        </div>
        <div className="mt-4">
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm font-semibold text-green-800">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            You&apos;ll be the first supporter
          </div>
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Summary</h2>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{summary}</p>
      </div>

      {/* Questions card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
          Questions <span className="ml-2 text-gray-300">·</span> <span className="text-gray-400 normal-case font-normal">{filled.length}</span>
        </h2>
        <ol className="space-y-4">
          {filled.map((q, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-xs font-bold text-gray-300 mt-0.5 w-5 shrink-0">{i + 1}.</span>
              <p className="text-sm text-gray-800">{q}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back and edit
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={isPending}
          className="flex-1 rounded-lg bg-[#F59E0B] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#D97706] disabled:opacity-50 transition-colors text-center"
        >
          {isPending ? 'Publishing…' : 'Publish your Campaign'}
        </button>
      </div>

    </div>
  )
}

// ── Form ───────────────────────────────────────────────────────────────────

export default function NewDemandForm({ organisations }: { organisations: Organisation[] }) {
  const [state, formAction, isPending] = useActionState(createDemand, { error: null })
  const formRef = useRef<HTMLFormElement>(null)

  // Controlled field state — needed to populate the preview
  const [headline, setHeadline] = useState('')
  const [organisationId, setOrganisationId] = useState('')
  const [summary, setSummary] = useState('')
  const [threshold, setThreshold] = useState('')
  const [questions, setQuestions] = useState([''])
  const [links, setLinks] = useState<{ url: string; title: string }[]>([{ url: '', title: '' }])

  const [showPreview, setShowPreview] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const selectedOrg = organisations.find((o) => o.id === organisationId)
  const filledQuestions = questions.filter((q) => q.trim())

  function handlePreview() {
    if (!headline.trim()) return setValidationError('Headline is required.')
    if (!organisationId) return setValidationError('Target organisation is required.')
    if (!summary.trim()) return setValidationError('Summary is required.')
    if (filledQuestions.length === 0) return setValidationError('At least one question is required.')
    if (!threshold || parseInt(threshold) < 1) return setValidationError('Supporter target is required.')
    setValidationError(null)
    setShowPreview(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handlePublish() {
    formRef.current?.requestSubmit()
  }

  function addQuestion() { setQuestions((p) => [...p, '']) }
  function removeQuestion(i: number) { setQuestions((p) => p.filter((_, j) => j !== i)) }
  function updateQuestion(i: number, v: string) { setQuestions((p) => p.map((q, j) => (j === i ? v : q))) }

  function addLink() { setLinks((p) => [...p, { url: '', title: '' }]) }
  function removeLink(i: number) { setLinks((p) => p.filter((_, j) => j !== i)) }
  function updateLink(i: number, field: 'url' | 'title', v: string) {
    setLinks((p) => p.map((l, j) => (j === i ? { ...l, [field]: v } : l)))
  }

  return (
    <div>
      {/* Hidden form — always in DOM so formAction can submit */}
      <form ref={formRef} action={formAction} className={showPreview ? 'hidden' : 'space-y-8'}>

        {/* Headline */}
        <div>
          <label htmlFor="headline" className={labelClass}>
            Headline <span className="text-[#F59E0B]">*</span>
          </label>
          <input
            id="headline"
            name="headline"
            type="text"
            required
            maxLength={140}
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Manchester United must address the stadium expansion plans"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-400">Keep it short and direct. Max 140 characters.</p>
        </div>

        {/* Target organisation */}
        <div>
          <label className={labelClass}>
            Target organisation <span className="text-[#F59E0B]">*</span>
          </label>
          <OrgSearchSelect
            organisations={organisations}
            value={organisationId}
            onChange={setOrganisationId}
          />
          {/* Hidden input so the value is included in FormData */}
          <input type="hidden" name="organisation_id" value={organisationId} />
        </div>

        {/* Summary */}
        <div>
          <label htmlFor="summary" className={labelClass}>
            Summary / context <span className="text-[#F59E0B]">*</span>
          </label>
          <textarea
            id="summary"
            name="summary"
            required
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Explain the background and why this matters…"
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Questions */}
        <div>
          <label className={labelClass}>
            Questions <span className="text-[#F59E0B]">*</span>
          </label>
          <div className="space-y-2">
            {questions.map((q, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="mt-2 text-sm font-bold text-gray-300 w-5 shrink-0">{i + 1}.</span>
                <input
                  type="text"
                  name="question"
                  value={q}
                  onChange={(e) => updateQuestion(i, e.target.value)}
                  placeholder={`Question ${i + 1}`}
                  className={inputClass}
                />
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(i)}
                    className="mt-2 text-gray-300 hover:text-red-400 transition-colors text-sm"
                    aria-label="Remove question"
                  >✕</button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addQuestion}
            className="mt-3 text-sm font-medium text-[#064E3B] hover:text-[#065F46] underline underline-offset-2 transition-colors"
          >
            + Add another question
          </button>
        </div>

        {/* Supporter target */}
        <div>
          <label htmlFor="notification_threshold" className={labelClass}>
            Supporter target <span className="text-[#F59E0B]">*</span>
          </label>
          <input
            id="notification_threshold"
            name="notification_threshold"
            type="number"
            required
            min={100}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="e.g. 500"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-400">
            Minimum 100. The number of supporters needed before the organisation is notified.
          </p>
        </div>

        {/* Links */}
        <div>
          <label className={labelClass}>
            Add Content <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="space-y-3">
            {links.map((link, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) => updateLink(i, 'title', e.target.value)}
                    placeholder="Title"
                    className={inputClass}
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => updateLink(i, 'url', e.target.value)}
                    placeholder="https://…"
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLink(i)}
                  className="mt-2 text-gray-300 hover:text-red-400 transition-colors text-sm"
                  aria-label="Remove link"
                >✕</button>
              </div>
            ))}
          </div>
          <input type="hidden" name="link_count" value={links.length} />
          {links.map((link, i) => (
            <span key={i}>
              <input type="hidden" name={`link_url_${i}`} value={link.url} />
              <input type="hidden" name={`link_title_${i}`} value={link.title} />
            </span>
          ))}
          <button
            type="button"
            onClick={addLink}
            className="mt-3 text-sm font-medium text-[#064E3B] hover:text-[#065F46] underline underline-offset-2 transition-colors"
          >
            + Add a link
          </button>
        </div>

        {/* Errors */}
        {(validationError || state.error) && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {validationError ?? state.error}
          </p>
        )}

        {/* Preview button */}
        <button
          type="button"
          onClick={handlePreview}
          className="w-full rounded-lg bg-[#064E3B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#065F46] transition-colors"
        >
          Preview your Campaign →
        </button>

      </form>

      {/* Preview panel */}
      {showPreview && (
        <CampaignPreview
          headline={headline}
          orgName={selectedOrg?.name ?? ''}
          summary={summary}
          questions={questions}
          threshold={parseInt(threshold)}
          onBack={() => { setShowPreview(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          onPublish={handlePublish}
          isPending={isPending}
        />
      )}
    </div>
  )
}
