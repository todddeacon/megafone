'use client'

import { useState } from 'react'

type Design = 'a' | 'b' | 'c'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK = {
  headline: "Why has the club not published the 2022/23 financial accounts?",
  orgName: "Arsenal FC",
  orgSlug: "arsenal-fc",
  summary:
    "Arsenal FC are legally required to file annual accounts within nine months of their financial year end. The 2022/23 accounts are now overdue and fans deserve full transparency about the club's financial position, particularly given recent transfer spending and significant ticket price increases.",
  questions: [
    "Why have the 2022/23 financial accounts not been published despite the statutory deadline having passed?",
    "What is the club's current wage-to-revenue ratio and how does it compare to the previous two seasons?",
    "Are there any plans to increase meaningful fan representation on the club's advisory board?",
  ],
  followUps: [
    "Following the accounts being filed — were any director loans or related-party transactions disclosed that were not previously public?",
  ],
  creator: "James Harrison",
  createdAt: "15 Jan 2025",
  notifiedAt: "2 Feb 2025",
  supportCount: 2847,
  threshold: 3000,
  status: "notified",
  comments: [
    { author: "Sarah M.", body: "This is long overdue. Every other PL club has filed. Total lack of transparency.", time: "3 days ago" },
    { author: "Phil T.", body: "Glad someone is finally asking this properly. The wage bill increase alone justifies the question.", time: "5 days ago" },
  ],
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function CheckIcon({ className = "w-2.5 h-2.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ShareIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  )
}

const STEPS = [
  { label: 'Launched',          shortLabel: 'Launched',   done: true,  active: false },
  { label: 'Building support',  shortLabel: 'Building',   done: true,  active: false },
  { label: 'Org notified',      shortLabel: 'Notified',   done: true,  active: false },
  { label: 'Awaiting response', shortLabel: 'Awaiting',   done: false, active: true  },
  { label: 'Response received', shortLabel: 'Response',   done: false, active: false },
  { label: 'Resolution',        shortLabel: 'Resolution', done: false, active: false },
]

// ─── DESIGN A — Command Centre (Sticky sidebar, clean editorial) ──────────────
//
// Philosophy: The page is a structured document. The left column tells the story
// in sequence: who is asking, what they're asking, and what's happened so far.
// The right sidebar stays anchored — the primary action and campaign progress
// are always a glance away, never buried. Information is hierarchical, not flat.

function DesignA() {
  const { headline, orgName, summary, questions, followUps, creator, createdAt, notifiedAt, supportCount, threshold, comments } = MOCK
  const pct = Math.min(100, (supportCount / threshold) * 100)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="#" className="text-xs font-mono text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All campaigns
          </a>
          <span className="text-gray-200">·</span>
          <a href="#" className="text-xs text-gray-400 hover:text-gray-700 hover:underline transition-colors">{orgName}</a>
        </div>
        <a href="#" className="text-xs font-semibold text-[#064E3B] hover:opacity-70 transition-opacity">MEGAFONE</a>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">

          {/* ── Left: main content ── */}
          <div className="space-y-7 min-w-0">

            {/* Campaign identity */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#064E3B]/10 border border-[#064E3B]/20 flex items-center justify-center text-xs font-bold text-[#064E3B] shrink-0">
                  AF
                </div>
                <a href="#" className="text-sm font-semibold text-gray-900 hover:underline">{orgName}</a>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-400">{createdAt}</span>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Awaiting response
              </span>

              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#064E3B] leading-tight mt-2">
                {headline}
              </h1>
              <p className="mt-2.5 text-sm text-gray-400">Campaign started by <span className="text-gray-600 font-medium">{creator}</span></p>
            </div>

            {/* Summary */}
            <p className="text-base text-gray-600 leading-relaxed border-l-4 border-[#064E3B]/20 pl-4">
              {summary}
            </p>

            {/* Questions */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-[#064E3B]/[0.03] border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Questions for {orgName}</h2>
                <span className="text-xs text-gray-400">{questions.length + followUps.length} total</span>
              </div>
              <ol className="divide-y divide-gray-100">
                {questions.map((q, i) => (
                  <li key={i} className="flex gap-4 px-6 py-5 group">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-[#064E3B]/[0.06] text-[#064E3B] text-xs font-bold flex items-center justify-center mt-0.5 group-hover:bg-[#064E3B]/10 transition-colors">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-800 leading-relaxed">{q}</p>
                  </li>
                ))}
              </ol>
              {followUps.length > 0 && (
                <>
                  <div className="flex items-center gap-3 px-6 py-3 bg-amber-50/50 border-t border-amber-100">
                    <div className="flex-1 border-t border-amber-100" />
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest shrink-0">Follow-up question</span>
                    <div className="flex-1 border-t border-amber-100" />
                  </div>
                  <ol className="divide-y divide-gray-100">
                    {followUps.map((q, i) => (
                      <li key={i} className="flex gap-4 px-6 py-5">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-xs font-bold flex items-center justify-center mt-0.5">
                          {questions.length + i + 1}
                        </span>
                        <p className="text-sm text-gray-800 leading-relaxed">{q}</p>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>

            {/* Awaiting response */}
            <div className="rounded-2xl border border-dashed border-amber-200 bg-gradient-to-br from-amber-50/60 to-orange-50/40 px-6 py-7">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse inline-block" />
                </div>
                <div>
                  <p className="font-bold text-amber-900 text-sm">{orgName} has been notified — waiting for a response</p>
                  <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                    The organisation received this campaign on <strong>{notifiedAt}</strong>. All {supportCount.toLocaleString('en-GB')} supporters will be emailed the moment a response is posted.
                  </p>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Supporter comments</h2>
              <div className="space-y-3">
                {comments.map((c, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-700">{c.author}</span>
                      <span className="text-xs text-gray-400">{c.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{c.body}</p>
                  </div>
                ))}
                <button className="w-full rounded-xl border border-gray-200 bg-white py-3 text-xs font-semibold text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                  Add a comment (supporters only)
                </button>
              </div>
            </div>

          </div>

          {/* ── Right: sticky sidebar ── */}
          <div className="lg:sticky lg:top-20 space-y-4">

            {/* Support panel */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              <div className="bg-[#064E3B] px-5 pt-5 pb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">Supporters</p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-5xl font-black text-white tabular-nums leading-none">{supportCount.toLocaleString('en-GB')}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/20 overflow-hidden mb-1.5">
                  <div className="h-full rounded-full bg-[#F59E0B]" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-emerald-300">
                  Target of {threshold.toLocaleString('en-GB')} reached · Org notified {notifiedAt}
                </p>
              </div>
              <div className="bg-white px-5 py-4 space-y-2">
                <button className="w-full rounded-lg bg-[#F59E0B] py-2.5 text-sm font-bold text-white hover:bg-[#D97706] transition-colors shadow-sm">
                  Add your support
                </button>
                <button className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <ShareIcon />
                  Share this campaign
                </button>
              </div>
            </div>

            {/* Progress stepper */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Campaign progress</h3>
              <div>
                {STEPS.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        step.done    ? 'bg-[#064E3B]'                                   :
                        step.active ? 'bg-[#F59E0B] ring-4 ring-[#F59E0B]/20'          :
                                      'bg-white border-2 border-gray-200'
                      }`}>
                        {step.done   && <CheckIcon className="w-2 h-2 text-white" />}
                        {step.active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`w-px flex-1 mt-1 mb-1 min-h-[18px] ${step.done ? 'bg-[#064E3B]/15' : 'bg-gray-100'}`} />
                      )}
                    </div>
                    <div className={`flex-1 min-w-0 ${i < STEPS.length - 1 ? 'pb-3' : ''}`}>
                      <div className="flex items-start justify-between gap-2 min-h-[20px]">
                        <span className={`text-xs leading-snug ${
                          step.active ? 'font-bold text-[#F59E0B]' :
                          step.done   ? 'font-medium text-gray-700'   :
                                        'text-gray-400'
                        }`}>{step.label}</span>
                        {step.label === 'Launched'    && <span className="text-xs text-gray-400 tabular-nums shrink-0">{createdAt}</span>}
                        {step.label === 'Org notified' && <span className="text-xs text-gray-400 tabular-nums shrink-0">{notifiedAt}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// ─── DESIGN B — The Brief (Full-bleed hero, horizontal timeline) ──────────────
//
// Philosophy: The campaign announces itself like a front page. A bold dark green
// hero carries the headline, org, stats, and call to action — so the purpose is
// unmistakable before any scrolling. A horizontal timeline inside the hero gives
// progress at a glance. Below, clean white space lets the content breathe.
// The design communicates authority and seriousness.

function DesignB() {
  const { headline, orgName, summary, questions, creator, createdAt, notifiedAt, supportCount, threshold, comments } = MOCK
  const pct = Math.min(100, (supportCount / threshold) * 100)

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa' }}>

      {/* ── Hero ── */}
      <div className="relative bg-[#064E3B] overflow-hidden">

        {/* Subtle dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6">

          {/* Top nav */}
          <div className="flex items-center justify-between py-4 border-b border-white/10">
            <div className="flex items-center gap-3 text-sm">
              <a href="#" className="text-emerald-400 hover:text-white transition-colors flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Campaigns
              </a>
              <span className="text-emerald-700">›</span>
              <a href="#" className="text-emerald-400 hover:text-white transition-colors">{orgName}</a>
            </div>
            <span className="text-xs font-black tracking-widest text-emerald-400">MEGAFONE</span>
          </div>

          {/* Hero content */}
          <div className="py-10">

            {/* Org identity + status */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white shrink-0">
                  AF
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{orgName}</p>
                  <p className="text-emerald-400 text-xs">Campaign directed at this organisation</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-400/30 rounded-full px-3.5 py-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="text-sm text-amber-300 font-semibold">Awaiting response</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-8 max-w-4xl">
              {headline}
            </h1>

            {/* Stats + CTA row */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-8">
              <div>
                <span className="block text-4xl font-black text-white tabular-nums leading-none">{supportCount.toLocaleString('en-GB')}</span>
                <span className="text-xs text-emerald-400 uppercase tracking-wider font-semibold mt-0.5 block">Supporters</span>
              </div>
              <div className="w-px h-10 bg-white/15 hidden sm:block" />
              <div>
                <span className="block text-4xl font-black text-white tabular-nums leading-none">{questions.length}</span>
                <span className="text-xs text-emerald-400 uppercase tracking-wider font-semibold mt-0.5 block">Questions</span>
              </div>
              <div className="w-px h-10 bg-white/15 hidden sm:block" />
              <div className="flex-1 min-w-[180px]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-emerald-400 font-semibold">Notification target</span>
                  <span className="text-xs text-white font-bold tabular-nums">{supportCount.toLocaleString()} / {threshold.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                  <div className="h-full rounded-full bg-[#F59E0B]" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button className="rounded-lg bg-[#F59E0B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#D97706] transition-colors shadow-md shadow-black/20">
                  Support this campaign
                </button>
                <button className="rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors flex items-center gap-1.5">
                  <ShareIcon />
                  Share
                </button>
              </div>
            </div>

            <p className="text-xs text-emerald-600">By {creator} · Started {createdAt}</p>
          </div>
        </div>

        {/* Horizontal timeline */}
        <div className="border-t border-white/10 bg-black/25">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex items-stretch gap-0">
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1.5 flex-1 px-0.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      step.done    ? 'bg-emerald-400'                                 :
                      step.active ? 'bg-[#F59E0B] ring-2 ring-[#F59E0B]/40'          :
                                    'bg-white/15'
                    }`}>
                      {step.done   && <CheckIcon className="w-2.5 h-2.5 text-[#064E3B]" />}
                      {step.active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className={`text-xs text-center leading-tight hidden sm:block truncate max-w-full px-1 ${
                      step.done    ? 'text-emerald-400' :
                      step.active ? 'text-[#F59E0B] font-bold' :
                                    'text-white/25'
                    }`}>{step.shortLabel}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-px w-full mx-0.5 ${step.done ? 'bg-emerald-400/40' : 'bg-white/10'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

        {/* Summary */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">About this campaign</h2>
          <p className="text-base text-gray-700 leading-relaxed">{summary}</p>
        </section>

        {/* Questions */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Questions for {orgName}</h2>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={i} className="flex gap-4 bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
                <div className="shrink-0 w-7 h-7 rounded-lg bg-[#064E3B]/[0.07] flex items-center justify-center">
                  <span className="text-xs font-black text-[#064E3B]">{i + 1}</span>
                </div>
                <p className="text-[0.9rem] text-gray-800 leading-relaxed pt-0.5">{q}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Awaiting response */}
        <section className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-3.5 bg-amber-50 border-b border-amber-100">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Awaiting response · Notified {notifiedAt}</p>
          </div>
          <div className="px-6 py-6">
            <p className="text-sm text-gray-500 leading-relaxed">
              {orgName} received this campaign and all {supportCount.toLocaleString('en-GB')} supporters' voices on <strong className="text-gray-800">{notifiedAt}</strong>. The club has the opportunity to respond publicly. All supporters will be notified by email when a response is posted.
            </p>
          </div>
        </section>

        {/* Comments */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Supporter comments</h2>
          <div className="space-y-3">
            {comments.map((c, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#064E3B]/10 flex items-center justify-center text-xs font-bold text-[#064E3B]">
                      {c.author.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{c.author}</span>
                  </div>
                  <span className="text-xs text-gray-400">{c.time}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

// ─── DESIGN C — The Motion (Momentum-first, pull-quote questions) ─────────────
//
// Philosophy: This is a campaign page as a call to arms. The supporter number
// is the dominant element — it communicates collective power immediately.
// Questions are treated as bold editorial pull-quotes, not a list in a box.
// Two columns below give context (meta + progress) alongside the story.
// The design feels alive, urgent, and fan-led rather than administrative.

function DesignC() {
  const { headline, orgName, summary, questions, followUps, creator, createdAt, notifiedAt, supportCount, threshold, comments } = MOCK
  const pct = Math.min(100, (supportCount / threshold) * 100)

  return (
    <div className="min-h-screen bg-white">

      {/* ── Momentum zone ── */}
      <div className="bg-[#064E3B] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(135deg, #F59E0B 25%, transparent 25%), linear-gradient(225deg, #F59E0B 25%, transparent 25%), linear-gradient(315deg, #F59E0B 25%, transparent 25%), linear-gradient(45deg, #F59E0B 25%, transparent 25%)',
            backgroundSize: '60px 60px',
            backgroundPosition: '0 0, 30px 0, 30px -30px, 0 30px',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">

            {/* The number */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400 mb-2">Supporters</p>
              <p
                className="font-black text-white leading-none tabular-nums"
                style={{ fontSize: 'clamp(60px, 12vw, 110px)' }}
              >
                {supportCount.toLocaleString('en-GB')}
              </p>
              <div className="mt-5 flex items-center gap-3 max-w-xs">
                <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/20">
                  <div className="h-full rounded-full bg-[#F59E0B] transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-bold text-[#F59E0B] tabular-nums shrink-0">{Math.round(pct)}%</span>
              </div>
              <p className="mt-2 text-sm text-emerald-400">
                Target of {threshold.toLocaleString('en-GB')} reached · Notified {notifiedAt}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2.5 w-full sm:w-auto sm:min-w-[210px]">
              <button className="w-full rounded-xl bg-[#F59E0B] py-3.5 text-base font-black text-white hover:bg-[#D97706] transition-colors shadow-lg shadow-black/20">
                Add your support
              </button>
              <button className="w-full rounded-xl bg-white/10 border border-white/20 py-3 text-sm font-semibold text-white hover:bg-white/15 transition-colors flex items-center justify-center gap-2">
                <ShareIcon />
                Share this campaign
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Campaign identity ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-7">
          <div className="flex items-center gap-2.5 flex-wrap text-sm text-gray-400 mb-3">
            <a href="#" className="hover:text-[#064E3B] transition-colors">← All campaigns</a>
            <span>·</span>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#064E3B]/10 flex items-center justify-center text-xs font-bold text-[#064E3B]">A</div>
              <a href="#" className="font-semibold text-gray-700 hover:text-[#064E3B] hover:underline transition-colors">{orgName}</a>
            </div>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
              Awaiting response
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-gray-900 leading-tight max-w-4xl">
            {headline}
          </h1>
          <p className="mt-2.5 text-sm text-gray-400">Started by <span className="text-gray-600 font-medium">{creator}</span> · {createdAt}</p>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-12 items-start">

          {/* Left: story + questions */}
          <div className="space-y-12">

            {/* Summary */}
            <div>
              <p className="text-lg text-gray-600 leading-relaxed">{summary}</p>
            </div>

            {/* Questions as pull-quotes */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-8">
                Fans are asking {orgName}
              </h2>
              <div className="space-y-8">
                {questions.map((q, i) => (
                  <div key={i} className="flex gap-5 group">
                    <div className="shrink-0 w-1 rounded-full bg-[#064E3B] opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div>
                      <span
                        className="block text-[#064E3B] font-black leading-none mb-2 select-none"
                        style={{ fontSize: '56px', opacity: 0.15, lineHeight: 1, marginTop: '-8px' }}
                      >
                        "
                      </span>
                      <p className="text-xl font-bold text-gray-900 leading-snug -mt-4">{q}</p>
                    </div>
                  </div>
                ))}
                {followUps.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-5">Follow-up question</p>
                    {followUps.map((q, i) => (
                      <div key={i} className="flex gap-5 group">
                        <div className="shrink-0 w-1 rounded-full bg-amber-400 opacity-50 group-hover:opacity-80 transition-opacity" />
                        <div>
                          <span
                            className="block text-amber-400 font-black leading-none mb-2 select-none"
                            style={{ fontSize: '56px', opacity: 0.4, lineHeight: 1, marginTop: '-8px' }}
                          >
                            "
                          </span>
                          <p className="text-xl font-bold text-gray-900 leading-snug -mt-4">{q}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Awaiting response */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                </div>
                <div>
                  <p className="font-bold text-amber-900 mb-1">Waiting for {orgName}</p>
                  <p className="text-sm text-amber-700 leading-relaxed">
                    Notified on {notifiedAt}. All {supportCount.toLocaleString('en-GB')} supporters will receive an email when a response is published here.
                  </p>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Supporter comments</h2>
              <div className="space-y-4">
                {comments.map((c, i) => (
                  <div key={i} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-700">{c.author}</span>
                      <span className="text-xs text-gray-300">{c.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{c.body}</p>
                  </div>
                ))}
                <button className="mt-2 text-sm font-semibold text-[#064E3B] hover:opacity-70 transition-opacity">
                  + Add a comment
                </button>
              </div>
            </div>

          </div>

          {/* Right: campaign meta */}
          <div className="space-y-5">

            {/* Campaign facts */}
            <div className="rounded-2xl bg-gray-50 p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Campaign</h3>
              <div className="space-y-3">
                {[
                  { k: 'Organisation', v: orgName, link: true },
                  { k: 'Questions', v: String(questions.length + followUps.length), link: false },
                  { k: 'Started', v: createdAt, link: false },
                  { k: 'Created by', v: creator, link: false },
                  { k: 'Notified', v: notifiedAt, link: false },
                ].map(({ k, v, link }) => (
                  <div key={k} className="flex items-start justify-between gap-2 text-sm">
                    <span className="text-gray-400 shrink-0">{k}</span>
                    {link
                      ? <a href="#" className="font-semibold text-gray-900 hover:underline text-right">{v}</a>
                      : <span className="font-semibold text-gray-900 text-right">{v}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Progress stepper */}
            <div className="rounded-2xl bg-gray-50 p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Progress</h3>
              <div>
                {[
                  { label: 'Campaign launched', date: createdAt, state: 'done' },
                  { label: 'Building support', date: null, state: 'done' },
                  { label: `${orgName} notified`, date: notifiedAt, state: 'done' },
                  { label: 'Awaiting response', date: null, state: 'active' },
                  { label: 'Response', date: null, state: 'future' },
                  { label: 'Resolution', date: null, state: 'future' },
                ].map((step, i, arr) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        step.state === 'done'   ? 'bg-[#064E3B]'                         :
                        step.state === 'active' ? 'bg-[#F59E0B] ring-4 ring-amber-50'   :
                                                  'bg-white border-2 border-gray-200'
                      }`}>
                        {step.state === 'done'   && <CheckIcon className="w-2 h-2 text-white" />}
                        {step.state === 'active' && <div className="w-1 h-1 rounded-full bg-white" />}
                      </div>
                      {i < arr.length - 1 && (
                        <div className={`w-px flex-1 mt-1 mb-1 min-h-[14px] ${step.state === 'done' ? 'bg-[#064E3B]/20' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className={`flex-1 min-w-0 ${i < arr.length - 1 ? 'pb-2.5' : ''}`}>
                      <span className={`text-xs block leading-snug ${
                        step.state === 'active' ? 'font-bold text-amber-600' :
                        step.state === 'done'   ? 'font-medium text-gray-700'   :
                                                  'text-gray-400'
                      }`}>{step.label}</span>
                      {step.date && <span className="text-xs text-gray-400 tabular-nums">{step.date}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Preview shell ────────────────────────────────────────────────────────────

const DESIGNS: { id: Design; name: string; desc: string }[] = [
  {
    id: 'a',
    name: 'A — Command Centre',
    desc: 'Sticky sidebar · editorial left column · action always in view',
  },
  {
    id: 'b',
    name: 'B — The Brief',
    desc: 'Full-bleed hero · horizontal timeline · publication-style content',
  },
  {
    id: 'c',
    name: 'C — The Motion',
    desc: 'Momentum-first · pull-quote questions · urgency and collective energy',
  },
]

export default function DesignPreviewPage() {
  const [active, setActive] = useState<Design>('a')
  const current = DESIGNS.find((d) => d.id === active)!

  return (
    <div>

      {/* ── Switcher bar ── */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-gray-950 border-b border-gray-800">
        <div className="flex items-center gap-4 px-4 py-2 flex-wrap">
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest shrink-0 hidden sm:block">
            Design preview
          </span>
          <div className="flex gap-1 flex-wrap">
            {DESIGNS.map((d) => (
              <button
                key={d.id}
                onClick={() => setActive(d.id)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  active === d.id
                    ? 'bg-[#F59E0B] text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-600 hidden lg:block flex-1">{current.desc}</p>
          <a
            href="/"
            className="ml-auto text-xs text-gray-500 hover:text-white transition-colors shrink-0"
          >
            ← Live site
          </a>
        </div>
      </div>

      {/* ── Design render area ── */}
      <div className="pt-[40px]">
        {active === 'a' && <DesignA />}
        {active === 'b' && <DesignB />}
        {active === 'c' && <DesignC />}
      </div>

    </div>
  )
}
