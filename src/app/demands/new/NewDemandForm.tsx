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
  campaignType: 'review' | 'qa' | 'petition'
  headline: string
  orgName: string
  summary: string
  questions: string[]
  threshold: number
  reviewingSubject: string
  rating: number | null
  reviewerDisplayMode: 'real_name' | 'nickname' | 'anonymous'
  reviewerName: string | null
  reviewerNickname: string | null
  onBack: () => void
  onPublish: () => void
  isPending: boolean
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          className={`w-5 h-5 ${n <= rating ? 'text-[#F59E0B]' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.366 2.446c-.784.57-1.84-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.652 9.154c-.784-.57-.381-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
        </svg>
      ))}
      <span className="ml-2 text-sm font-semibold text-gray-700 tabular-nums">{rating} / 5</span>
    </div>
  )
}

function CampaignPreview({
  campaignType, headline, orgName, summary, questions, threshold,
  reviewingSubject, rating, reviewerDisplayMode, reviewerName, reviewerNickname,
  onBack, onPublish, isPending,
}: PreviewProps) {
  const filled = questions.filter((q) => q.trim())

  const displayedReviewerName =
    reviewerDisplayMode === 'anonymous'
      ? 'Anonymous'
      : reviewerDisplayMode === 'nickname'
      ? (reviewerNickname || reviewerName || 'You')
      : (reviewerName || 'You')

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
            {orgName && <OrgAvatar />}
            <div className="min-w-0">
              {orgName && <p className="text-xs font-medium text-gray-500">{orgName}</p>}
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                campaignType === 'review'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : campaignType === 'petition'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              } ${orgName ? 'mt-1' : ''}`}>
                {campaignType === 'review' ? 'Review' : campaignType === 'petition' ? 'Petition' : 'Q&A'}
              </span>
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-[#064E3B] leading-snug">
          {headline}
        </h1>
        {campaignType === 'review' && reviewingSubject && (
          <p className="mt-2 text-sm font-medium text-gray-600">{reviewingSubject}</p>
        )}
        {campaignType === 'review' && rating !== null && (
          <div className="mt-4"><StarRow rating={rating} /></div>
        )}
        {campaignType === 'review' && (
          <p className="mt-3 text-xs text-gray-400">
            by <span className="text-gray-600 font-medium">{displayedReviewerName}</span>
          </p>
        )}
      </div>

      {/* Supporter count card — not shown for reviews */}
      {campaignType !== 'review' && (
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
      )}

      {/* Summary / review body card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
          {campaignType === 'review' ? 'Review' : 'Summary'}
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{summary}</p>
      </div>

      {/* Questions card — Q&A only */}
      {campaignType === 'qa' && (
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
      )}

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

export default function NewDemandForm({
  organisations,
  reviewerName,
  reviewerNickname,
}: {
  organisations: Organisation[]
  reviewerName?: string | null
  reviewerNickname?: string | null
}) {
  const [state, formAction, isPending] = useActionState(createDemand, { error: null })
  const formRef = useRef<HTMLFormElement>(null)

  // Controlled field state — needed to populate the preview
  const [campaignType, setCampaignType] = useState<'review' | 'qa' | 'petition'>('review')
  const [headline, setHeadline] = useState('')
  const [organisationId, setOrganisationId] = useState('')
  const [suggestNewOrg, setSuggestNewOrg] = useState(false)
  const [summary, setSummary] = useState('')
  const [demandText, setDemandText] = useState('')
  const [threshold, setThreshold] = useState('')
  const [questions, setQuestions] = useState([''])
  const [links, setLinks] = useState<{ url: string; title: string }[]>([{ url: '', title: '' }])

  // Review-specific state
  const [reviewingSubject, setReviewingSubject] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [reviewerDisplayMode, setReviewerDisplayMode] = useState<'real_name' | 'nickname' | 'anonymous'>('real_name')
  const [reviewImages, setReviewImages] = useState<File[]>([])
  const [reviewVideo, setReviewVideo] = useState<File | null>(null)
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([])
  const [reviewVideoPreview, setReviewVideoPreview] = useState<string | null>(null)
  const imagePickerRef = useRef<HTMLInputElement>(null)
  const videoPickerRef = useRef<HTMLInputElement>(null)

  const MAX_IMAGES = 5
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

  useEffect(() => {
    const urls = reviewImages.map((f) => URL.createObjectURL(f))
    setReviewImagePreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [reviewImages])

  useEffect(() => {
    if (!reviewVideo) {
      setReviewVideoPreview(null)
      return
    }
    const url = URL.createObjectURL(reviewVideo)
    setReviewVideoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [reviewVideo])

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = ''
    const accepted: File[] = []
    for (const f of picked) {
      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
        setValidationError('Images must be JPG, PNG, or WEBP.')
        continue
      }
      if (f.size > MAX_IMAGE_SIZE) {
        setValidationError(`"${f.name}" is larger than 5 MB.`)
        continue
      }
      accepted.push(f)
    }
    setReviewImages((prev) => [...prev, ...accepted].slice(0, MAX_IMAGES))
  }

  function handleVideoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!ALLOWED_VIDEO_TYPES.includes(f.type)) {
      setValidationError('Video must be MP4, MOV, or WEBM.')
      return
    }
    if (f.size > MAX_VIDEO_SIZE) {
      setValidationError('Video is larger than 100 MB.')
      return
    }
    setReviewVideo(f)
  }

  function removeImage(i: number) {
    setReviewImages((prev) => prev.filter((_, j) => j !== i))
  }

  function removeVideo() {
    setReviewVideo(null)
  }

  const [showPreview, setShowPreview] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const selectedOrg = organisations.find((o) => o.id === organisationId)
  const filledQuestions = questions.filter((q) => q.trim())

  function handlePreview() {
    if (!headline.trim()) return setValidationError('Headline is required.')

    if (campaignType === 'review') {
      if (!reviewingSubject.trim()) return setValidationError('What you are reviewing is required.')
      if (!summary.trim()) return setValidationError('Review text is required.')
      if (summary.trim().length < 50) return setValidationError('Review text must be at least 50 characters.')
      if (rating === null) return setValidationError('Rating is required.')
    } else {
      if (!organisationId && !suggestNewOrg) return setValidationError('Target organisation is required.')
      if (!summary.trim()) return setValidationError('Summary / context is required.')
      if (campaignType === 'qa' && filledQuestions.length === 0) return setValidationError('At least one question is required.')
      if (campaignType === 'petition' && !demandText.trim()) return setValidationError('The demand is required.')
      if (!threshold || parseInt(threshold) < 1) return setValidationError('Supporter target is required.')
    }

    setValidationError(null)
    setShowPreview(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handlePublish() {
    if (campaignType === 'review' && formRef.current) {
      // Reviews support file uploads held in local state; we construct FormData
      // ourselves so we can attach the selected images and video.
      const fd = new FormData(formRef.current)
      reviewImages.forEach((f, i) => fd.append(`review_image_${i}`, f))
      fd.append('review_image_count', String(reviewImages.length))
      if (reviewVideo) fd.append('review_video', reviewVideo)
      formAction(fd)
      return
    }
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

        {/* Campaign type selector */}
        <div>
          <label className={labelClass}>Campaign type</label>
          <input type="hidden" name="campaign_type" value={campaignType} />
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-semibold">
            <button
              type="button"
              onClick={() => setCampaignType('review')}
              className={`flex-1 px-4 py-2.5 transition-colors ${
                campaignType === 'review' ? 'bg-[#064E3B] text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Review
            </button>
            <button
              type="button"
              onClick={() => setCampaignType('qa')}
              className={`flex-1 px-4 py-2.5 transition-colors ${
                campaignType === 'qa' ? 'bg-[#064E3B] text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Q&A
            </button>
            <button
              type="button"
              onClick={() => setCampaignType('petition')}
              className={`flex-1 px-4 py-2.5 transition-colors ${
                campaignType === 'petition' ? 'bg-[#064E3B] text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Petition
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {campaignType === 'review'
              ? 'Share your experience or feedback about a club, event, or organisation.'
              : campaignType === 'qa'
              ? 'Ask specific questions and get answers from the organisation.'
              : 'Demand a specific action or change from the organisation.'
            }
          </p>
        </div>

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
            maxLength={campaignType === 'review' ? 100 : 140}
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder={
              campaignType === 'review'
                ? 'e.g. Worst matchday experience I have ever had at the Emirates'
                : 'e.g. Manchester United must address the stadium expansion plans'
            }
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-400">
            Keep it short and direct. Max {campaignType === 'review' ? 100 : 140} characters.
          </p>
        </div>

        {/* What are you reviewing? (review only) */}
        {campaignType === 'review' && (
          <div>
            <label htmlFor="reviewing_subject" className={labelClass}>
              What are you reviewing? <span className="text-[#F59E0B]">*</span>
            </label>
            <input
              id="reviewing_subject"
              name="reviewing_subject"
              type="text"
              maxLength={150}
              value={reviewingSubject}
              onChange={(e) => setReviewingSubject(e.target.value)}
              placeholder="e.g. Arsenal vs Chelsea at Emirates, 15 Mar 2026"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-400">
              A specific event, service, or experience. Max 150 characters.
            </p>
          </div>
        )}

        {/* Target organisation */}
        <div>
          <label className={labelClass}>
            {campaignType === 'review' ? 'Tag an organisation' : 'Target organisation'}{' '}
            {campaignType === 'review' ? (
              <span className="font-normal text-gray-400">(optional)</span>
            ) : (
              <span className="text-[#F59E0B]">*</span>
            )}
          </label>
          {!suggestNewOrg ? (
            <>
              <OrgSearchSelect
                organisations={organisations}
                value={organisationId}
                onChange={setOrganisationId}
              />
              <input type="hidden" name="organisation_id" value={organisationId} />
              <button
                type="button"
                onClick={() => { setSuggestNewOrg(true); setOrganisationId('') }}
                className="mt-2 text-xs text-gray-400 hover:text-[#064E3B] transition-colors underline"
              >
                Can't find your organisation? Suggest a new one
              </button>
            </>
          ) : (
            <>
              <input type="hidden" name="suggest_new_org" value="true" />
              <input
                name="new_org_name"
                type="text"
                required
                placeholder="Organisation name"
                className={inputClass}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <input
                  name="new_org_contact_name"
                  type="text"
                  placeholder="Contact name (optional)"
                  className={inputClass}
                />
                <input
                  name="new_org_contact_email"
                  type="email"
                  placeholder="Contact email (optional)"
                  className={inputClass}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Your campaign will go live once we verify this organisation. This usually takes less than 24 hours.
              </p>
              <button
                type="button"
                onClick={() => setSuggestNewOrg(false)}
                className="mt-2 text-xs text-gray-400 hover:text-[#064E3B] transition-colors underline"
              >
                Search existing organisations instead
              </button>
            </>
          )}
        </div>

        {/* Target person or group (not shown for reviews) */}
        {campaignType !== 'review' && (
          <div>
            <label htmlFor="target_person" className={labelClass}>
              Target person or group <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="target_person"
              name="target_person"
              type="text"
              placeholder="e.g. The Board, Director of Football, CEO"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-400">
              Who specifically at the organisation should answer these questions?
            </p>
          </div>
        )}

        {/* Petition: demand field before summary */}
        {campaignType === 'petition' && (
          <div>
            <label htmlFor="demand_text" className={labelClass}>
              The demand <span className="text-[#F59E0B]">*</span>
            </label>
            <textarea
              id="demand_text"
              name="demand_text"
              required
              rows={3}
              value={demandText}
              onChange={(e) => setDemandText(e.target.value)}
              placeholder="State the specific action or change you want — e.g. 'We are calling on the club to reduce matchday ticket prices for under-18s by at least 50%'"
              className={`${inputClass} resize-none`}
            />
            <p className="mt-1 text-xs text-gray-400">
              Be specific about what you want the organisation to do.
            </p>
          </div>
        )}

        {/* Summary / review body */}
        <div>
          <label htmlFor="summary" className={labelClass}>
            {campaignType === 'review' ? 'Your review' : 'Summary / context'}{' '}
            <span className="text-[#F59E0B]">*</span>
          </label>
          <textarea
            id="summary"
            name="summary"
            required
            rows={campaignType === 'review' ? 6 : 4}
            minLength={campaignType === 'review' ? 50 : undefined}
            maxLength={campaignType === 'review' ? 2000 : undefined}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder={
              campaignType === 'review'
                ? 'Describe your experience in detail. What happened, what worked, what did not?'
                : 'Explain the background and why this matters…'
            }
            className={`${inputClass} resize-none`}
          />
          {campaignType === 'review' && (
            <p className="mt-1 text-xs text-gray-400">
              {summary.length} / 2000 characters · minimum 50
            </p>
          )}
        </div>

        {/* Rating (review only) */}
        {campaignType === 'review' && (
          <div>
            <label className={labelClass}>
              Your rating <span className="text-[#F59E0B]">*</span>
            </label>
            <input type="hidden" name="rating" value={rating ?? ''} />
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n === 1 ? '' : 's'}`}
                  className={`flex items-center justify-center rounded-md border transition-colors ${
                    rating === n
                      ? 'bg-[#F59E0B] border-[#F59E0B] text-white'
                      : 'border-gray-200 text-gray-400 hover:border-[#F59E0B] hover:text-[#F59E0B]'
                  } w-11 h-11`}
                >
                  {n === 0 ? (
                    <span className="text-sm font-bold">0</span>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.366 2.446c-.784.57-1.84-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.652 9.154c-.784-.57-.381-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                    </svg>
                  )}
                </button>
              ))}
              <span className="ml-3 text-sm font-semibold text-gray-700">
                {rating === null ? 'Select a rating' : `${rating} / 5`}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              0 means completely unacceptable. 5 means excellent.
            </p>
          </div>
        )}

        {/* Display name choice (review only) */}
        {campaignType === 'review' && (
          <div>
            <label className={labelClass}>How should we show your name?</label>
            <input type="hidden" name="reviewer_display_mode" value={reviewerDisplayMode} />
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-semibold">
              <button
                type="button"
                onClick={() => setReviewerDisplayMode('real_name')}
                className={`flex-1 px-3 py-2 transition-colors ${
                  reviewerDisplayMode === 'real_name' ? 'bg-[#064E3B] text-white' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                My name
              </button>
              <button
                type="button"
                onClick={() => setReviewerDisplayMode('nickname')}
                className={`flex-1 px-3 py-2 transition-colors ${
                  reviewerDisplayMode === 'nickname' ? 'bg-[#064E3B] text-white' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                My nickname
              </button>
              <button
                type="button"
                onClick={() => setReviewerDisplayMode('anonymous')}
                className={`flex-1 px-3 py-2 transition-colors ${
                  reviewerDisplayMode === 'anonymous' ? 'bg-[#064E3B] text-white' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                Anonymous
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Anonymous reviews are public but your identity stays private. Admins retain access for moderation.
            </p>
          </div>
        )}

        {/* Questions (Q&A only) */}
        {campaignType === 'qa' ? (
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
        ) : null}

        {/* Supporter target (not shown for reviews) */}
        {campaignType !== 'review' && (
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
        )}

        {/* Links — not shown for reviews (reviews use photo/video uploads instead) */}
        {campaignType !== 'review' && (
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
        )}

        {/* Photos (review only) */}
        {campaignType === 'review' && (
          <div>
            <label className={labelClass}>
              Photos <span className="text-gray-400 font-normal">(optional, up to {MAX_IMAGES})</span>
            </label>
            <input
              ref={imagePickerRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImagePick}
              className="hidden"
            />
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {reviewImagePreviews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center text-xs font-bold hover:bg-black transition-colors"
                    aria-label="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {reviewImages.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => imagePickerRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-[#064E3B] hover:text-[#064E3B] transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs font-semibold mt-1">Add photo</span>
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              JPG, PNG, or WEBP · max 5 MB each · {reviewImages.length} / {MAX_IMAGES} selected
            </p>
          </div>
        )}

        {/* Video (review only) */}
        {campaignType === 'review' && (
          <div>
            <label className={labelClass}>
              Video <span className="text-gray-400 font-normal">(optional, max 1)</span>
            </label>
            <input
              ref={videoPickerRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={handleVideoPick}
              className="hidden"
            />
            {reviewVideo && reviewVideoPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-black">
                <video src={reviewVideoPreview} controls className="w-full max-h-64" />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center text-xs font-bold hover:bg-black transition-colors"
                  aria-label="Remove video"
                >
                  ✕
                </button>
                <p className="absolute bottom-2 left-2 text-xs text-white bg-black/60 rounded px-2 py-1">
                  {reviewVideo.name} · {(reviewVideo.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => videoPickerRef.current?.click()}
                className="w-full rounded-lg border-2 border-dashed border-gray-300 py-8 flex flex-col items-center justify-center text-gray-400 hover:border-[#064E3B] hover:text-[#064E3B] transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-semibold mt-2">Add video</span>
              </button>
            )}
            <p className="mt-1 text-xs text-gray-400">
              MP4, MOV, or WEBM · max 100 MB
            </p>
          </div>
        )}

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
          campaignType={campaignType}
          headline={headline}
          orgName={selectedOrg?.name ?? ''}
          summary={summary}
          questions={questions}
          threshold={parseInt(threshold || '0')}
          reviewingSubject={reviewingSubject}
          rating={rating}
          reviewerDisplayMode={reviewerDisplayMode}
          reviewerName={reviewerName ?? null}
          reviewerNickname={reviewerNickname ?? null}
          onBack={() => { setShowPreview(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          onPublish={handlePublish}
          isPending={isPending}
        />
      )}
    </div>
  )
}
