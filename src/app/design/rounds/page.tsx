'use client'

import { useState } from 'react'

// ─── Mock data ────────────────────────────────────────────────────────────────

const ORG = { name: 'Arsenal FC', initials: 'AF' }
const SUPPORT_COUNT = 2847

const QUESTIONS = [
  "Why have the 2022/23 financial accounts not been published despite the statutory deadline having passed?",
  "What is the club's current wage-to-revenue ratio and how does it compare to the previous season?",
  "Are there any plans to increase meaningful fan representation on the club's advisory board?",
]

const RESPONSE_TEXT = "We are committed to full financial transparency and are currently working with our auditors to finalise the 2022/23 accounts. The delay is due to a change in our auditing firm, which required additional time for the handover process. We expect to file the accounts within the next six weeks. Regarding fan representation, we are actively exploring options for an enhanced supporters' liaison committee and will share more details in due course."

type ResponseFormat = 'text' | 'text-pdf' | 'text-video' | 'pdf-only' | 'video-only'

type ScenarioKey = 'awaiting' | ResponseFormat | 'multi'

// ─── Shared components ────────────────────────────────────────────────────────

function CheckIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function OrgAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-[#064E3B]/10 border border-[#064E3B]/20 flex items-center justify-center text-xs font-bold text-[#064E3B] shrink-0">
      {ORG.initials}
    </div>
  )
}

function QuestionsList({ questions }: { questions: string[] }) {
  return (
    <ol className="divide-y divide-gray-100 list-none">
      {questions.map((q, i) => (
        <li key={i} className="flex gap-4 px-6 py-5 group">
          <span className="shrink-0 w-6 h-6 rounded-full bg-[#064E3B]/[0.06] text-[#064E3B] text-xs font-bold flex items-center justify-center mt-0.5 group-hover:bg-[#064E3B]/10 transition-colors">
            {i + 1}
          </span>
          <p className="text-sm text-gray-800 leading-relaxed">{q}</p>
        </li>
      ))}
    </ol>
  )
}

// ─── Response media components ────────────────────────────────────────────────

function PdfAttachment() {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 hover:border-[#064E3B]/30 hover:bg-[#064E3B]/[0.02] transition-all"
    >
      {/* PDF icon */}
      <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 17.5c-.3 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l1-1c-.4-.6-.6-1.2-.6-1.8 0-1.7 1.3-3 3-3 .6 0 1.2.2 1.7.5l1-1c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-1 1c.4.6.6 1.2.6 1.8 0 1.7-1.3 3-3 3-.6 0-1.2-.2-1.7-.5l-1 1c-.2.2-.5.3-.7.3z" />
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM13 3.5L18.5 9H13V3.5zM9 17h6v-1.5H9V17zm0-3h6v-1.5H9V14zm0-3h4v-1.5H9V11z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">Official Response 2022–23 Accounts.pdf</p>
        <p className="text-xs text-gray-400 mt-0.5">PDF · 1.2 MB</p>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#064E3B] shrink-0 group-hover:gap-2.5 transition-all">
        Open
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </a>
  )
}

function VideoAttachment() {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      {/* Video player mockup */}
      {!playing ? (
        <button
          onClick={() => setPlaying(true)}
          className="relative w-full aspect-video bg-gray-900 flex items-center justify-center group"
        >
          {/* Fake thumbnail gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#064E3B]/80 via-gray-900/60 to-gray-900" />
          {/* Fake thumbnail content */}
          <div className="absolute inset-0 flex items-end p-5">
            <div>
              <p className="text-white/40 text-xs font-mono mb-1">Arsenal FC · Official response</p>
              <p className="text-white text-sm font-semibold leading-snug max-w-xs">
                Statement on 2022/23 financial accounts — Chief Financial Officer
              </p>
            </div>
          </div>
          {/* Play button */}
          <div className="relative z-10 w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-white/30 group-hover:scale-105 transition-all">
            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          {/* Duration badge */}
          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-mono px-1.5 py-0.5 rounded">
            4:32
          </div>
        </button>
      ) : (
        <div className="aspect-video bg-gray-900 flex items-center justify-center">
          <p className="text-white/40 text-sm">Video player would appear here</p>
        </div>
      )}
      {/* Video caption */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-xs text-gray-500">Video statement · uploaded {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
    </div>
  )
}

// ─── Response body component ──────────────────────────────────────────────────

function OrgResponseBody({ format }: { format: ResponseFormat }) {
  const hasText  = format === 'text' || format === 'text-pdf' || format === 'text-video'
  const hasPdf   = format === 'text-pdf'   || format === 'pdf-only'
  const hasVideo = format === 'text-video' || format === 'video-only'

  return (
    <div className="px-6 py-5 space-y-4">
      {hasText && (
        <p className="text-sm text-gray-700 leading-relaxed">{RESPONSE_TEXT}</p>
      )}
      {hasPdf && <PdfAttachment />}
      {hasVideo && <VideoAttachment />}
    </div>
  )
}

// ─── Full Q&A card ────────────────────────────────────────────────────────────

function ExchangeCard({
  questions,
  scenario,
  isMultiRound = false,
  roundNumber = 1,
  roundLabel = 'Opening questions',
  isActive = false,
  responseDate = '12 Feb 2025',
  daysToRespond = 28,
}: {
  questions: string[]
  scenario: ScenarioKey
  isMultiRound?: boolean
  roundNumber?: number
  roundLabel?: string
  isActive?: boolean
  responseDate?: string
  daysToRespond?: number
}) {
  const isAwaiting = scenario === 'awaiting' || isActive
  const isResponded = !isAwaiting && scenario !== 'multi'
  const format = isResponded ? (scenario as ResponseFormat) : null

  return (
    <div className={`rounded-2xl border overflow-hidden ${
      isActive && isMultiRound ? 'border-[#064E3B]/25 shadow-sm' : 'border-gray-200'
    }`}>

      {/* Round header — multi-round only */}
      {isMultiRound && (
        <div className={`px-6 py-3.5 border-b flex items-center justify-between ${
          isActive ? 'bg-[#064E3B] border-[#064E3B]' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
              isActive ? 'bg-white/20 text-white' : 'bg-white border border-gray-200 text-gray-500'
            }`}>
              {roundNumber}
            </div>
            <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-600'}`}>
              {roundLabel}
            </span>
          </div>
          {isActive ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Active
            </span>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <CheckIcon className="w-3 h-3 text-[#064E3B]" />
              Closed {responseDate}
            </div>
          )}
        </div>
      )}

      {/* Section header — single round only */}
      {!isMultiRound && (
        <div className="px-6 py-4 bg-[#064E3B]/[0.03] border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Questions for {ORG.name}
          </h2>
          <span className="text-xs text-gray-400">
            {questions.length} {questions.length === 1 ? 'question' : 'questions'}
          </span>
        </div>
      )}

      {/* Questions */}
      <div className="bg-white">
        <QuestionsList questions={questions} />
      </div>

      {/* Response or awaiting */}
      {isAwaiting ? (
        <div className="border-t border-dashed border-amber-200 bg-amber-50/40 px-6 py-4 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <p className="text-sm text-amber-700 font-medium">Awaiting response from {ORG.name}</p>
        </div>
      ) : format ? (
        <>
          {/* Response header */}
          <div className="border-t border-gray-100">
            <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <OrgAvatar />
                <span className="text-xs font-bold text-emerald-800">{ORG.name} responded</span>
              </div>
              <span className="text-xs text-emerald-600 shrink-0">{responseDate} · {daysToRespond} days</span>
            </div>
            <OrgResponseBody format={format} />
          </div>
        </>
      ) : null}

      {/* Multi-round outcome pill */}
      {isMultiRound && !isActive && (
        <div className="border-t border-amber-100 bg-amber-50 px-6 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-700">Further questions raised</span>
          <span className="text-xs text-gray-400">14 Feb 2025</span>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SCENARIOS: { key: ScenarioKey; label: string; group: string }[] = [
  { key: 'awaiting',    label: 'Awaiting',        group: 'Single round' },
  { key: 'text',        label: 'Text',             group: 'Response formats' },
  { key: 'text-pdf',   label: 'Text + PDF',       group: 'Response formats' },
  { key: 'text-video', label: 'Text + Video',     group: 'Response formats' },
  { key: 'pdf-only',   label: 'PDF only',         group: 'Response formats' },
  { key: 'video-only', label: 'Video only',       group: 'Response formats' },
  { key: 'multi',       label: 'Multi-round',      group: 'Multi round' },
]

const STATUS: Record<ScenarioKey, { label: string; className: string; dot: boolean }> = {
  'awaiting':    { label: 'Awaiting response',  className: 'bg-amber-50 border-amber-100 text-amber-700',      dot: true  },
  'text':        { label: 'Responded',          className: 'bg-emerald-50 border-emerald-100 text-emerald-700', dot: false },
  'text-pdf':    { label: 'Responded',          className: 'bg-emerald-50 border-emerald-100 text-emerald-700', dot: false },
  'text-video':  { label: 'Responded',          className: 'bg-emerald-50 border-emerald-100 text-emerald-700', dot: false },
  'pdf-only':    { label: 'Responded',          className: 'bg-emerald-50 border-emerald-100 text-emerald-700', dot: false },
  'video-only':  { label: 'Responded',          className: 'bg-emerald-50 border-emerald-100 text-emerald-700', dot: false },
  'multi':       { label: 'Awaiting response · Round 2', className: 'bg-amber-50 border-amber-100 text-amber-700', dot: true },
}

export default function RoundsDesignPage() {
  const [scenario, setScenario] = useState<ScenarioKey>('awaiting')
  const status = STATUS[scenario]

  // Group buttons
  const groups = ['Single round', 'Response formats', 'Multi round']

  return (
    <div>
      {/* Switcher bar */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-gray-950 border-b border-gray-800">
        <div className="flex items-center gap-1 px-4 py-2 flex-wrap">
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest shrink-0 mr-3 hidden sm:block">
            Response formats
          </span>
          {groups.map((group) => (
            <div key={group} className="flex items-center gap-1">
              <span className="text-xs text-gray-700 px-2 hidden lg:block">{group}:</span>
              {SCENARIOS.filter((s) => s.group === group).map((s) => (
                <button
                  key={s.key}
                  onClick={() => setScenario(s.key)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${
                    scenario === s.key
                      ? 'bg-[#F59E0B] text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {s.label}
                </button>
              ))}
              <span className="w-px h-4 bg-gray-800 mx-1 last:hidden" />
            </div>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <a href="/design" className="text-xs text-gray-500 hover:text-white transition-colors shrink-0">← Campaign layout</a>
            <a href="/" className="text-xs text-gray-500 hover:text-white transition-colors shrink-0">Live site</a>
          </div>
        </div>
      </div>

      <div className="pt-[40px] min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">

            {/* Left: campaign content */}
            <div className="space-y-7 min-w-0">

              {/* Campaign identity */}
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#064E3B]/10 border border-[#064E3B]/20 flex items-center justify-center text-xs font-bold text-[#064E3B]">
                    AF
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{ORG.name}</span>
                  <span className="text-gray-200 text-xs">·</span>
                  <span className="text-xs text-gray-400">15 Jan 2025</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold mb-3 ${status.className}`}>
                  {status.dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                  {status.label}
                </span>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#064E3B] leading-tight">
                  Why has the club not published the 2022/23 financial accounts?
                </h1>
                <p className="mt-2 text-sm text-gray-400">Campaign by <span className="text-gray-600 font-medium">James Harrison</span></p>
              </div>

              {/* Summary */}
              <p className="text-base text-gray-600 leading-relaxed border-l-4 border-[#064E3B]/20 pl-4">
                Arsenal FC are legally required to file annual accounts within nine months of their financial year end. The 2022/23 accounts are now overdue and fans deserve full transparency about the club's financial position, particularly given recent transfer spending and ticket price increases.
              </p>

              {/* Q&A section */}
              {scenario === 'multi' ? (
                <div className="space-y-4">
                  {/* Round 1 — closed, responded */}
                  <ExchangeCard
                    questions={QUESTIONS}
                    scenario="text"
                    isMultiRound
                    roundNumber={1}
                    roundLabel="Opening questions"
                    isActive={false}
                  />
                  {/* Round 2 — active, awaiting */}
                  <ExchangeCard
                    questions={[
                      "The response regarding the auditing firm change does not explain why accounts are now nine months overdue — can you provide a confirmed filing date?",
                      "What were the total director remuneration figures for 2022/23, which are public information regardless of audit timeline?",
                    ]}
                    scenario="awaiting"
                    isMultiRound
                    roundNumber={2}
                    roundLabel="Round 2 — Follow-up"
                    isActive
                  />
                </div>
              ) : (
                <ExchangeCard
                  questions={QUESTIONS}
                  scenario={scenario}
                />
              )}

            </div>

            {/* Right: sidebar */}
            <div className="lg:sticky lg:top-14 space-y-4">
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <div className="bg-[#064E3B] px-5 pt-5 pb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1.5">Supporters</p>
                  <span className="text-5xl font-black text-white tabular-nums leading-none">
                    {SUPPORT_COUNT.toLocaleString('en-GB')}
                  </span>
                  <p className="mt-1 text-xs text-emerald-400">3 questions</p>
                  <div className="mt-4">
                    <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                      <div className="h-full rounded-full bg-[#F59E0B] w-full" />
                    </div>
                    <p className="mt-1.5 text-xs text-emerald-400">Target reached — org notified</p>
                  </div>
                </div>
                <div className="bg-white px-5 py-4 space-y-2">
                  <button className="w-full rounded-lg bg-[#F59E0B] py-2.5 text-sm font-bold text-white">Add your support</button>
                  <button className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-500 flex items-center justify-center gap-1.5">Share</button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Progress</h3>
                <div>
                  {[
                    { label: 'Campaign launched',  date: '15 Jan', done: true },
                    { label: 'Building support',   date: null,     done: true },
                    { label: `${ORG.name} notified`, date: '25 Jan', done: true },
                    { label: scenario === 'awaiting' ? 'Awaiting response' : 'Response received', date: scenario === 'awaiting' ? null : '12 Feb', done: scenario !== 'awaiting', active: scenario === 'awaiting' },
                    { label: 'Resolution',          date: null,     done: false, future: true },
                  ].map((step, i, arr) => (
                    <div key={i} className="flex gap-2.5">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          step.done   ? 'bg-[#064E3B]' :
                          step.active ? 'bg-[#F59E0B] ring-4 ring-amber-50' :
                                        'bg-white border-2 border-gray-200'
                        }`}>
                          {step.done   && <CheckIcon className="w-2 h-2 text-white" />}
                          {step.active && <div className="w-1 h-1 rounded-full bg-white" />}
                        </div>
                        {i < arr.length - 1 && (
                          <div className={`w-px flex-1 mt-1 mb-1 min-h-[14px] ${step.done ? 'bg-[#064E3B]/20' : 'bg-gray-100'}`} />
                        )}
                      </div>
                      <div className={`flex-1 min-w-0 ${i < arr.length - 1 ? 'pb-2.5' : ''} flex items-start justify-between gap-2`}>
                        <span className={`text-xs leading-snug ${
                          step.active ? 'font-bold text-amber-600' :
                          step.done   ? 'font-medium text-gray-700' :
                                        'text-gray-400'
                        }`}>{step.label}</span>
                        {step.date && <span className="text-xs text-gray-400 tabular-nums shrink-0">{step.date}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
