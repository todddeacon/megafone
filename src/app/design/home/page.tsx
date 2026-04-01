'use client'

import { useState } from 'react'

// ─── Mock data ───────────────────────────────────────────────────────────────

const MOCK_DEMANDS = [
  {
    id: '1',
    headline: 'Explain the decision to move away games to Tuesday nights without fan consultation',
    status: 'notified',
    support_count_cache: 3847,
    question_count: 4,
    created_at: '2025-11-12T10:00:00Z',
    organisation: { name: 'Arsenal FC', slug: 'arsenal' },
    creator: { name: 'Tom Davies' },
    notification_threshold: 5000,
  },
  {
    id: '2',
    headline: 'Release a transparent breakdown of ticket price increases for the 2025/26 season',
    status: 'live',
    support_count_cache: 1204,
    question_count: 3,
    created_at: '2025-12-01T10:00:00Z',
    organisation: { name: 'Chelsea FC', slug: 'chelsea' },
    creator: { name: 'Sarah Chen' },
    notification_threshold: 2000,
  },
  {
    id: '3',
    headline: 'Publish the sustainability plan and targets for reducing stadium emissions',
    status: 'responded',
    support_count_cache: 892,
    question_count: 5,
    created_at: '2025-10-20T10:00:00Z',
    organisation: { name: 'Manchester City', slug: 'man-city' },
    creator: { name: 'James Patel' },
    notification_threshold: null,
  },
  {
    id: '4',
    headline: 'Commit to an independent fans\' board with real governance power over key decisions',
    status: 'resolved',
    support_count_cache: 6201,
    question_count: 7,
    created_at: '2025-09-05T10:00:00Z',
    organisation: { name: 'Liverpool FC', slug: 'liverpool' },
    creator: { name: 'Emma Roberts' },
    notification_threshold: 5000,
  },
  {
    id: '5',
    headline: 'Why was the new shirt supplier chosen without any fan survey or consultation?',
    status: 'building',
    support_count_cache: 147,
    question_count: 2,
    created_at: '2025-12-15T10:00:00Z',
    organisation: { name: 'Tottenham Hotspur', slug: 'spurs' },
    creator: { name: 'David Kim' },
    notification_threshold: 500,
  },
  {
    id: '6',
    headline: 'Provide a clear timeline for improving disabled access across all stands',
    status: 'further_questions',
    support_count_cache: 2340,
    question_count: 6,
    created_at: '2025-11-28T10:00:00Z',
    organisation: { name: 'Newcastle United', slug: 'newcastle' },
    creator: { name: 'Priya Sharma' },
    notification_threshold: 2000,
  },
]

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; dot: string; badge: string; border: string }> = {
  building:          { label: 'Building support',    dot: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-500',        border: 'border-l-gray-300' },
  live:              { label: 'Active',               dot: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-600',         border: 'border-l-blue-400' },
  notified:          { label: 'Awaiting response',    dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700',       border: 'border-l-amber-400' },
  responded:         { label: 'Responded',            dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700',   border: 'border-l-emerald-500' },
  further_questions: { label: 'Further questions',    dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700',       border: 'border-l-amber-400' },
  resolved:          { label: 'Resolved',             dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700',   border: 'border-l-emerald-500' },
  unsatisfactory:    { label: 'Unsatisfied',          dot: 'bg-red-400',     badge: 'bg-red-50 text-red-600',           border: 'border-l-red-400' },
}

function getStatus(s: string) {
  return STATUS[s] ?? { label: s, dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-500', border: 'border-l-gray-200' }
}

function orgInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function timeAgo(ts: string) {
  const days = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

type Demand = typeof MOCK_DEMANDS[0]

// ─── OPTION A: Editorial ──────────────────────────────────────────────────────

function CardA({ d }: { d: Demand }) {
  const s = getStatus(d.status)
  const pct = d.notification_threshold
    ? Math.min(100, Math.round((d.support_count_cache / d.notification_threshold) * 100))
    : null

  return (
    <a
      href="#"
      className={`group block bg-white rounded-xl border-l-4 border border-gray-200 ${s.border} p-5 hover:shadow-md transition-all`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-[#064E3B]/10 flex items-center justify-center text-[10px] font-black text-[#064E3B] shrink-0">
          {orgInitials(d.organisation.name)}
        </div>
        <span className="text-xs font-semibold text-gray-500 truncate">{d.organisation.name}</span>
        <span className="ml-auto shrink-0 flex items-center gap-1 text-xs text-gray-400">
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </div>

      <h3 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-3 group-hover:text-[#064E3B] transition-colors mb-3">
        {d.headline}
      </h3>

      {pct !== null && (
        <div className="mb-3">
          <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-[#064E3B] rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          <strong className="text-gray-700 font-semibold">{d.support_count_cache.toLocaleString('en-GB')}</strong>
          {' '}supporters · {d.question_count} {d.question_count === 1 ? 'question' : 'questions'}
        </span>
        <span>{timeAgo(d.created_at)}</span>
      </div>
    </a>
  )
}

function HeroA({ mobile }: { mobile: boolean }) {
  return (
    <section className="bg-[#064E3B] py-12 px-4">
      <div className="mx-auto max-w-5xl">
        {/* Stack on mobile, side-by-side on desktop */}
        <div className={`flex ${mobile ? 'flex-col gap-6' : 'flex-wrap items-end justify-between gap-6'}`}>
          <div>
            <p className="text-[#F59E0B] text-xs font-bold tracking-widest uppercase mb-3">The voice of football fans</p>
            <h1 className={`font-black tracking-tight text-white leading-none mb-3 ${mobile ? 'text-4xl' : 'text-5xl sm:text-6xl'}`}>
              Ask.<br />Build support.<br />Get answers.
            </h1>
            <p className="text-emerald-200 text-base max-w-md leading-relaxed">
              When fans speak with one voice, clubs have to listen.
            </p>
          </div>
          {/* Stats: inline row on mobile, stacked on desktop */}
          <div className={`flex gap-6 ${mobile ? '' : 'pb-1'}`}>
            {[
              { n: '47', label: 'campaigns' },
              { n: '12,400', label: 'supporters' },
              { n: '11', label: 'clubs' },
            ].map(({ n, label }) => (
              <div key={label} className={mobile ? '' : 'text-right'}>
                <p className={`font-black text-white leading-none ${mobile ? 'text-2xl' : 'text-3xl'}`}>{n}</p>
                <p className="text-xs text-emerald-300 mt-0.5 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <a href="#" className="inline-block rounded-lg bg-[#F59E0B] px-6 py-3 text-sm font-bold text-white">
            Start a campaign
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── OPTION B: Momentum ───────────────────────────────────────────────────────

function CardB({ d }: { d: Demand }) {
  const s = getStatus(d.status)
  const pct = d.notification_threshold
    ? Math.min(100, Math.round((d.support_count_cache / d.notification_threshold) * 100))
    : null
  const isActive = ['live', 'notified', 'further_questions'].includes(d.status)

  return (
    <a
      href="#"
      className="group block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
    >
      <div className={`px-5 pt-4 pb-3 flex items-center justify-between ${isActive ? 'bg-[#064E3B]' : 'bg-gray-50 border-b border-gray-100'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${isActive ? 'bg-white/10 text-white' : 'bg-[#064E3B]/10 text-[#064E3B]'}`}>
            {orgInitials(d.organisation.name)}
          </div>
          <span className={`text-xs font-semibold truncate ${isActive ? 'text-emerald-200' : 'text-gray-500'}`}>
            {d.organisation.name}
          </span>
        </div>
        <span className={`shrink-0 text-xs font-semibold flex items-center gap-1 ${isActive ? 'text-emerald-300' : 'text-gray-400'}`}>
          {isActive && <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`} />}
          {s.label}
        </span>
      </div>

      <div className="p-5">
        <h3 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-3 group-hover:text-[#064E3B] transition-colors mb-4">
          {d.headline}
        </h3>

        <div className="flex items-end justify-between gap-2">
          <div>
            <span className="text-3xl font-black text-[#064E3B] leading-none tabular-nums">
              {d.support_count_cache.toLocaleString('en-GB')}
            </span>
            <span className="text-xs text-gray-400 ml-1.5">supporters</span>
          </div>
          <span className="text-xs text-gray-400 shrink-0">{d.question_count} q's</span>
        </div>

        {pct !== null && (
          <div className="mt-2">
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className={`h-full rounded-full ${isActive ? 'bg-[#F59E0B]' : 'bg-[#064E3B]'}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{pct}% to notification threshold</p>
          </div>
        )}
      </div>
    </a>
  )
}

function HeroB({ mobile }: { mobile: boolean }) {
  const featured = MOCK_DEMANDS[0]
  const s = getStatus(featured.status)

  return (
    <section className="bg-[#064E3B] py-12 px-4">
      <div className="mx-auto max-w-5xl">
        <div className={`${mobile ? 'flex flex-col gap-8' : 'grid grid-cols-[1fr_300px] gap-8 items-center'}`}>
          <div>
            <p className="text-[#F59E0B] text-xs font-bold tracking-widest uppercase mb-3">Megafone</p>
            <h1 className={`font-black tracking-tight text-white leading-tight mb-4 ${mobile ? 'text-4xl' : 'text-4xl sm:text-5xl'}`}>
              Fans are asking<br />the hard questions.
            </h1>
            <p className="text-emerald-200 text-base max-w-sm leading-relaxed mb-6">
              Add your voice to an existing campaign, or start one that matters to you.
            </p>
            <div className="flex gap-3">
              <a href="#" className="rounded-lg bg-[#F59E0B] px-5 py-3 text-sm font-bold text-white">
                Start a campaign
              </a>
              <a href="#" className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white">
                Browse
              </a>
            </div>
          </div>

          {/* Featured card — shown on both mobile and desktop, just stacks on mobile */}
          <a href="#" className="group bg-white rounded-2xl p-5 shadow-xl block">
            <p className="text-[10px] font-bold text-[#064E3B] uppercase tracking-widest mb-3">Trending right now</p>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-[#064E3B]/10 flex items-center justify-center text-[10px] font-black text-[#064E3B]">
                {orgInitials(featured.organisation.name)}
              </div>
              <span className="text-xs font-semibold text-gray-500">{featured.organisation.name}</span>
              <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.badge}`}>{s.label}</span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-3 mb-4">
              {featured.headline}
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#064E3B]">{featured.support_count_cache.toLocaleString('en-GB')}</span>
              <span className="text-xs text-gray-400">supporters</span>
            </div>
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── OPTION C: Feed ───────────────────────────────────────────────────────────

function CardC({ d, mobile }: { d: Demand; mobile: boolean }) {
  const s = getStatus(d.status)

  return (
    <a
      href="#"
      className="group flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-[#064E3B]/20 hover:bg-[#064E3B]/[0.01] transition-all"
    >
      {/* Avatar + status dot */}
      <div className="flex flex-col items-center gap-1.5 pt-0.5 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[#064E3B]/[0.07] flex items-center justify-center text-xs font-black text-[#064E3B]">
          {orgInitials(d.organisation.name)}
        </div>
        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className="text-xs font-semibold text-gray-500">{d.organisation.name}</span>
          <span className="text-gray-300 text-xs">·</span>
          <span className="text-xs text-gray-400">{timeAgo(d.created_at)}</span>
        </div>
        <h3 className={`font-bold text-gray-900 leading-snug group-hover:text-[#064E3B] transition-colors ${mobile ? 'text-sm line-clamp-3' : 'text-sm line-clamp-2'}`}>
          {d.headline}
        </h3>
        <p className="mt-1 text-xs text-gray-400">
          {d.question_count} {d.question_count === 1 ? 'question' : 'questions'}
        </p>
      </div>

      {/* Count — always visible, compact on mobile */}
      <div className="shrink-0 text-right">
        <p className={`font-black text-[#064E3B] leading-none tabular-nums ${mobile ? 'text-xl' : 'text-2xl'}`}>
          {d.support_count_cache >= 1000
            ? `${(d.support_count_cache / 1000).toFixed(1)}k`
            : d.support_count_cache}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">supporters</p>
      </div>
    </a>
  )
}

function HeroC({ mobile }: { mobile: boolean }) {
  return (
    <section className="bg-[#064E3B] py-12 px-4">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className={`font-black tracking-tight text-white leading-none mb-4 ${mobile ? 'text-4xl' : 'text-5xl sm:text-6xl'}`}>
          Fan power,<br />structured.
        </h1>
        <p className="text-emerald-200 text-base mb-5 max-w-md mx-auto leading-relaxed">
          Raise issues, build collective support, and hold clubs accountable — publicly.
        </p>
        {/* Stat row — wraps gracefully on mobile */}
        <div className={`inline-flex items-center justify-center mb-7 ${
          mobile
            ? 'flex-col gap-1 bg-white/10 rounded-2xl px-5 py-3'
            : 'gap-0 bg-white/10 rounded-full px-5 py-2 divide-x divide-white/20'
        }`}>
          {[
            { n: '47', label: 'campaigns' },
            { n: '12,400', label: 'supporters' },
            { n: '11', label: 'clubs' },
          ].map(({ n, label }, i) => (
            <span key={label} className={`text-sm text-emerald-200 ${mobile ? '' : i === 0 ? 'pr-3' : i === 2 ? 'pl-3' : 'px-3'}`}>
              <strong className="text-white">{n}</strong> {label}
            </span>
          ))}
        </div>
        <div className={`flex justify-center gap-3 ${mobile ? 'flex-col items-stretch' : ''}`}>
          <a href="#" className="rounded-lg bg-[#F59E0B] px-6 py-3 text-sm font-bold text-white text-center">
            Start a campaign
          </a>
          <a href="#" className="rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white text-center">
            Browse campaigns
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Shared tab bar ───────────────────────────────────────────────────────────

function Tabs({ mobile }: { mobile: boolean }) {
  const tabs = mobile
    ? ['Trending', 'Latest', 'Supported'] // fewer tabs visible on mobile
    : ['Trending', 'Latest', 'Most supported', 'By organisation', 'Supporting']

  return (
    <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
      {tabs.map((t, i) => (
        <button
          key={t}
          className={`shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            i === 0 ? 'border-[#064E3B] text-[#064E3B]' : 'border-transparent text-gray-400'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Design = 'A' | 'B' | 'C'
type Viewport = 'desktop' | 'mobile'

export default function DesignHomePage() {
  const [design, setDesign] = useState<Design>('A')
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const mobile = viewport === 'mobile'

  const containerClass = mobile
    ? 'w-[390px] mx-auto shadow-2xl overflow-hidden rounded-2xl border border-gray-300'
    : 'w-full'

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Switcher bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest shrink-0">Design</span>
        <div className="flex gap-1.5">
          {(['A', 'B', 'C'] as Design[]).map((d) => (
            <button
              key={d}
              onClick={() => setDesign(d)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                design === d ? 'bg-[#064E3B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d === 'A' ? 'A — Editorial' : d === 'B' ? 'B — Momentum' : 'C — Feed'}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-gray-200 mx-1" />

        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest shrink-0">Viewport</span>
        <div className="flex gap-1.5">
          {(['desktop', 'mobile'] as Viewport[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewport(v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                viewport === v ? 'bg-[#064E3B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {v === 'desktop' ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-3 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
              {v === 'desktop' ? 'Desktop' : 'Mobile (390px)'}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-gray-400 hidden sm:block">Preview only · no real data</span>
      </div>

      {/* Preview wrapper */}
      <div className={`${mobile ? 'py-8' : ''}`}>
        <div className={containerClass}>

          {/* ── Design A ── */}
          {design === 'A' && (
            <div className="min-h-screen bg-gray-50">
              <HeroA mobile={mobile} />
              <div className={`mx-auto px-4 py-6 space-y-5 ${mobile ? '' : 'max-w-5xl'}`}>
                {/* Search */}
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                  </svg>
                  <input readOnly type="search" placeholder="Search campaigns…" className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm text-gray-600 placeholder-gray-400" />
                </div>
                <Tabs mobile={mobile} />
                {/* Cards: 2-col desktop, 1-col mobile */}
                <div className={`grid gap-4 ${mobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                  {MOCK_DEMANDS.map((d) => <CardA key={d.id} d={d} />)}
                </div>
                {/* How it works — single column on mobile */}
                <div className="bg-[#064E3B] rounded-2xl p-6 text-white">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-5">How it works</h2>
                  <div className={`grid gap-5 ${mobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                    {[
                      { n: '01', t: 'Raise an issue', d: 'Write a campaign and the specific questions you want answered' },
                      { n: '02', t: 'Build collective support', d: 'Other fans add their name — the more supporters, the harder to ignore' },
                      { n: '03', t: 'Hold clubs accountable', d: 'When the threshold is hit, the club is notified and can respond publicly' },
                    ].map(({ n, t, d }) => (
                      <div key={n} className="flex gap-3">
                        <span className="text-xl font-black text-white/20 leading-none mt-0.5 shrink-0">{n}</span>
                        <div>
                          <p className="font-bold text-white text-sm mb-1">{t}</p>
                          <p className="text-sm text-emerald-200 leading-relaxed">{d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Design B ── */}
          {design === 'B' && (
            <div className="min-h-screen bg-gray-50">
              <HeroB mobile={mobile} />
              <div className={`mx-auto px-4 py-6 space-y-5 ${mobile ? '' : 'max-w-5xl'}`}>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                  </svg>
                  <input readOnly type="search" placeholder="Search campaigns…" className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm text-gray-600 placeholder-gray-400" />
                </div>
                <Tabs mobile={mobile} />
                {/* 3-col desktop → 2-col tablet → 1-col mobile */}
                <div className={`grid gap-4 ${mobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                  {MOCK_DEMANDS.map((d) => <CardB key={d.id} d={d} />)}
                </div>
              </div>
            </div>
          )}

          {/* ── Design C ── */}
          {design === 'C' && (
            <div className="min-h-screen bg-gray-50">
              <HeroC mobile={mobile} />
              <div className={`mx-auto px-4 py-6 space-y-4 ${mobile ? '' : 'max-w-3xl'}`}>
                {/* Search + sort panel */}
                <div className={`bg-white rounded-xl border border-gray-200 p-3 ${mobile ? 'space-y-3' : 'flex gap-3 items-center'}`}>
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                    </svg>
                    <input readOnly type="search" placeholder="Search campaigns…" className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm text-gray-600 placeholder-gray-400" />
                  </div>
                  {/* Scroll horizontally on mobile */}
                  <div className="flex gap-1 overflow-x-auto">
                    {['Trending', 'Latest', 'Supported'].map((t, i) => (
                      <button key={t} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold ${i === 0 ? 'bg-[#064E3B] text-white' : 'text-gray-500 bg-gray-100'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-bold text-gray-900">Trending campaigns</h2>
                  <span className="text-xs text-gray-400">{MOCK_DEMANDS.length} campaigns</span>
                </div>

                <div className="space-y-2">
                  {MOCK_DEMANDS.map((d) => <CardC key={d.id} d={d} mobile={mobile} />)}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Notes */}
      <div className={`mx-auto px-4 py-8 ${mobile ? 'max-w-[440px]' : 'max-w-5xl'}`}>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">What changed vs the current design</h2>
          <div className={`grid gap-6 text-sm ${mobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
            <div>
              <p className="font-bold text-[#064E3B] mb-2">A — Editorial</p>
              <ul className="text-gray-500 leading-relaxed space-y-1.5">
                <li>✓ Entire card is one click — no buttons</li>
                <li>✓ Status reads instantly via border colour</li>
                <li>✓ Progress bar shows momentum</li>
                <li>✓ Hero leads with platform stats</li>
                <li>✓ "How it works" at bottom, not mid-feed</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-[#064E3B] mb-2">B — Momentum</p>
              <ul className="text-gray-500 leading-relaxed space-y-1.5">
                <li>✓ Active campaigns visually pop in dark green</li>
                <li>✓ Featured campaign in hero</li>
                <li>✓ 3-col grid on desktop</li>
                <li>✓ Full card clickable</li>
                <li>⚠ Hero featured card stacks on mobile — still works, just linear</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-[#064E3B] mb-2">C — Feed</p>
              <ul className="text-gray-500 leading-relaxed space-y-1.5">
                <li>✓ Best for mobile — already single column</li>
                <li>✓ Fastest to scan</li>
                <li>✓ Search + sort combined</li>
                <li>✓ Supporter count is quick to compare</li>
                <li>✓ Centred hero scales cleanly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
