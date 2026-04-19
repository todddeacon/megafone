'use client'

import { useState, useMemo, useEffect } from 'react'

interface Demand {
  id: string
  headline: string
  status: string
  support_count_cache: number
  notification_threshold: number | null
  question_count: number
  created_at: string
  is_example: boolean
  is_featured: boolean
  campaign_type: string
  organisation: { id: string; name: string; slug: string } | null
  creator: { name: string } | null
}

interface Props {
  demands: Demand[]
  supportedIds: string[]
}

type Tab = 'trending' | 'latest' | 'supported' | 'supporting' | 'organisations'

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  building:          { label: 'Building support',       dot: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-500' },
  live:              { label: 'Active',                  dot: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-600' },
  notified:          { label: 'Awaiting response',       dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700' },
  responded:         { label: 'Responded',               dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
  further_questions: { label: 'Further questions',       dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700' },
  resolved:          { label: 'Resolved',                dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
  unsatisfactory:    { label: 'Unsatisfactory response', dot: 'bg-red-400',     badge: 'bg-red-50 text-red-600' },
  not_relevant:      { label: 'No longer relevant',      dot: 'bg-gray-300',    badge: 'bg-gray-100 text-gray-400' },
}

function getStatus(s: string) {
  return STATUS_CONFIG[s] ?? { label: s, dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-500' }
}

function orgInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

const ACTIVE_STATUSES = new Set(['live', 'notified', 'further_questions'])

// ─── Campaign card ────────────────────────────────────────────────────────────

function DemandCard({ demand }: { demand: Demand }) {
  const s = getStatus(demand.status)
  const isActive = ACTIVE_STATUSES.has(demand.status)
  const count = demand.support_count_cache
  const pct = demand.notification_threshold
    ? Math.min(100, Math.round((count / demand.notification_threshold) * 100))
    : null

  return (
    <a
      href={`/demands/${demand.id}`}
      className="group block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-transparent transition-all"
    >
      {/* Header strip */}
      <div
        className={`px-5 pt-4 pb-3 flex items-center gap-3 ${
          isActive ? 'bg-[#064E3B]' : 'bg-gray-50 border-b border-gray-100'
        }`}
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
            isActive ? 'bg-white/10 text-white' : 'bg-[#064E3B]/10 text-[#064E3B]'
          }`}
        >
          {orgInitials(demand.organisation?.name ?? '?')}
        </div>
        <span className={`text-xs font-semibold truncate flex-1 ${isActive ? 'text-emerald-200' : 'text-gray-500'}`}>
          {demand.organisation?.name ?? 'Unknown'}
        </span>
        <span
          className={`shrink-0 flex items-center gap-1 text-xs font-semibold ${
            isActive ? 'text-emerald-300' : 'text-gray-400'
          }`}
        >
          {isActive && (
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`} />
          )}
          {s.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="mb-2">
          <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
            demand.campaign_type === 'petition'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {demand.campaign_type === 'petition' ? 'Demand Change' : 'Ask Questions'}
          </span>
        </div>
        <h3 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-3 group-hover:text-[#064E3B] transition-colors mb-1">
          {demand.headline}
        </h3>
        {demand.creator?.name && (
          <p className="text-xs text-gray-400 mb-3">by {demand.creator.name}</p>
        )}

        {/* Supporter count */}
        <div className="flex items-end justify-between gap-2 mb-2">
          <div>
            <span className="text-3xl font-black text-[#064E3B] leading-none tabular-nums">
              {count.toLocaleString('en-GB')}
            </span>
            <span className="text-xs text-gray-400 ml-1.5">
              {count === 1 ? 'supporter' : 'supporters'}
            </span>
          </div>
          <span className="text-xs text-gray-400 shrink-0">
            {demand.question_count} {demand.question_count === 1 ? 'question' : 'questions'}
          </span>
        </div>

        {/* Progress bar */}
        {pct !== null && (
          <div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isActive ? 'bg-[#F59E0B]' : 'bg-[#064E3B]'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {pct}% to notification threshold
            </p>
          </div>
        )}

        <p className="text-[10px] text-gray-400 mt-3">
          Started {new Date(demand.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
    </a>
  )
}

// ─── Organisation card ────────────────────────────────────────────────────────

function OrgCard({ org }: { org: { id: string; name: string; slug: string; count: number; responded: number } }) {
  return (
    <a
      href={`/organisations/${org.slug}`}
      className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 hover:border-[#064E3B]/30 hover:shadow-sm transition-all"
    >
      <div className="w-10 h-10 rounded-full bg-[#064E3B]/10 flex items-center justify-center text-sm font-bold text-[#064E3B] shrink-0">
        {orgInitials(org.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{org.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {org.count} campaign{org.count !== 1 ? 's' : ''}
          {org.responded > 0 && <> · {org.responded} responded</>}
        </p>
      </div>
      <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  )
}

// ─── Featured card (hero) ─────────────────────────────────────────────────────

function FeaturedCard({ demand }: { demand: Demand }) {
  const s = getStatus(demand.status)
  const count = demand.support_count_cache
  const pct = demand.notification_threshold
    ? Math.min(100, Math.round((count / demand.notification_threshold) * 100))
    : null
  const isActive = ACTIVE_STATUSES.has(demand.status)

  return (
    <a
      href={`/demands/${demand.id}`}
      className="group block bg-white rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-shadow"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        {demand.is_example ? (
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Example campaign</span>
        ) : demand.is_featured ? (
          <span className="text-[10px] font-bold text-[#064E3B] uppercase tracking-widest">Featured campaign</span>
        ) : (
          <span className="text-[10px] font-bold text-[#064E3B] uppercase tracking-widest">Trending right now</span>
        )}
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
          demand.campaign_type === 'petition'
            ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {demand.campaign_type === 'petition' ? 'Demand Change' : 'Ask Questions'}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-[#064E3B]/10 flex items-center justify-center text-[10px] font-black text-[#064E3B] shrink-0">
          {orgInitials(demand.organisation?.name ?? '?')}
        </div>
        <span className="text-xs font-semibold text-gray-500 truncate">
          {demand.organisation?.name}
        </span>
        <span className={`ml-auto shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.badge}`}>
          {s.label}
        </span>
      </div>
      <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-3 group-hover:text-[#064E3B] transition-colors mb-1">
        {demand.headline}
      </h3>
      {demand.creator?.name && (
        <p className="text-xs text-gray-400 mb-3">by {demand.creator.name}</p>
      )}
      <div className="flex items-end justify-between gap-2 mb-2">
        <div>
          <span className="text-2xl font-black text-[#064E3B] tabular-nums">{count.toLocaleString('en-GB')}</span>
          <span className="text-xs text-gray-400 ml-1.5">{count === 1 ? 'supporter' : 'supporters'}</span>
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {demand.question_count} {demand.question_count === 1 ? 'question' : 'questions'}
        </span>
      </div>
      {pct !== null && (
        <div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isActive ? 'bg-[#F59E0B]' : 'bg-[#064E3B]'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{pct}% to notification threshold</p>
        </div>
      )}
    </a>
  )
}

// ─── Hero Carousel ──────────────────────────────────────────────────────────

function HeroCarousel({ items }: { items: Demand[] }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (items.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % items.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [items.length])

  if (items.length === 0) return null

  return (
    <div className="relative">
      {items.map((item, i) => (
        <div
          key={item.id}
          className="transition-opacity duration-500"
          style={{ opacity: i === current ? 1 : 0, position: i === current ? 'relative' : 'absolute', top: 0, left: 0, right: 0 }}
        >
          {i === current && <FeaturedCard demand={item} />}
        </div>
      ))}

      {items.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current ? 'bg-white w-4' : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Show campaign ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ featuredItems }: { featuredItems: Demand[] }) {
  return (
    <section className="bg-[#064E3B] py-12 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-center">
          {/* Copy */}
          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight mb-4">
              Get Answers.<br />Get Change.
            </h1>
            <p className="text-emerald-200 text-base max-w-sm leading-relaxed mb-7">
              When fans speak with one voice, sports organisations have to listen. Start a campaign or add your support to one that matters.
            </p>
            <div className="flex gap-3">
              <a
                href="/demands/new"
                className="rounded-lg bg-[#F59E0B] px-5 py-3 text-sm font-bold text-white hover:bg-[#D97706] transition-colors"
              >
                Start a campaign
              </a>
            </div>
          </div>

          {/* Featured campaign carousel */}
          <HeroCarousel items={featuredItems} />
        </div>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <div className="bg-[#064E3B] rounded-2xl p-7 text-white">
      <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-6">How it works</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { n: '01', title: 'Start a campaign', desc: 'Ask questions or demand change. Set out what you want from your club and why it matters.' },
          { n: '02', title: 'Build support', desc: 'Share your campaign. The more fans behind it, the harder it is to ignore.' },
          { n: '03', title: 'Get a response', desc: 'When you hit your target, the organisation is notified and has the opportunity to respond publicly.' },
        ].map(({ n, title, desc }) => (
          <div key={n} className="flex gap-3">
            <span className="text-2xl font-black text-white/20 leading-none mt-0.5 shrink-0">{n}</span>
            <div>
              <p className="font-bold text-white text-sm mb-1">{title}</p>
              <p className="text-sm text-emerald-200 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: 'trending',      label: 'Trending' },
  { id: 'latest',        label: 'Latest' },
  { id: 'supported',     label: 'Most supported' },
  { id: 'organisations', label: 'By organisation' },
  { id: 'supporting',    label: 'Supporting' },
]

// ─── Main component ───────────────────────────────────────────────────────────

export default function HomeClient({ demands, supportedIds }: Props) {
  const [tab, setTab] = useState<Tab>('trending')
  const [search, setSearch] = useState('')

  const supportedSet = useMemo(() => new Set(supportedIds), [supportedIds])

  const orgs = useMemo(() => {
    const map = new Map<string, { id: string; name: string; slug: string; count: number; responded: number }>()
    for (const d of demands) {
      if (!d.organisation) continue
      const o = d.organisation
      const existing = map.get(o.id)
      if (existing) {
        existing.count++
        if (['responded', 'resolved'].includes(d.status)) existing.responded++
      } else {
        map.set(o.id, {
          ...o,
          count: 1,
          responded: ['responded', 'resolved'].includes(d.status) ? 1 : 0,
        })
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count)
  }, [demands])

  const filteredOrgs = useMemo(() => {
    if (!search.trim()) return orgs
    const q = search.toLowerCase()
    return orgs.filter((o) => o.name.toLowerCase().includes(q))
  }, [orgs, search])

  const sorted = useMemo(() => {
    if (tab === 'organisations') return []
    // Exclude example campaigns from all tabs
    let list = demands.filter((d) => !d.is_example)
    if (tab === 'supporting') {
      list = list.filter((d) => supportedSet.has(d.id))
      list.sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
    } else if (tab === 'trending') {
      list.sort((a, b) =>
        b.support_count_cache !== a.support_count_cache
          ? b.support_count_cache - a.support_count_cache
          : b.created_at > a.created_at ? 1 : -1
      )
    } else if (tab === 'latest') {
      list.sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
    } else {
      list.sort((a, b) => b.support_count_cache - a.support_count_cache)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (d) =>
          d.headline.toLowerCase().includes(q) ||
          (d.organisation?.name ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [demands, tab, search, supportedSet])

  // Hero featured items: featured campaigns > example campaigns > highest support
  const featuredItems = useMemo(() => {
    const items: Demand[] = []

    // 1. Admin-selected featured campaigns
    const featuredCampaigns = demands.filter((d) => d.is_featured)
    items.push(...featuredCampaigns)

    // 2. Example campaigns
    const exampleCampaigns = demands.filter((d) => d.is_example && !d.is_featured)
    items.push(...exampleCampaigns)

    // 3. If nothing, fall back to highest-support campaign
    if (items.length === 0) {
      const active = demands.filter((d) => ACTIVE_STATUSES.has(d.status) && !d.is_example)
      const pool = active.length > 0 ? active : demands.filter((d) => !d.is_example)
      const best = pool.reduce((b, d) =>
        d.support_count_cache > (b?.support_count_cache ?? -1) ? d : b,
        null as Demand | null
      )
      if (best) items.push(best)
    }

    return items
  }, [demands])

  const isSearching = search.trim().length > 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Hero featuredItems={featuredItems} />

      <main id="feed" className="flex-1 mx-auto max-w-5xl w-full px-4 py-8 space-y-5">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns or clubs…"
            className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm text-[#064E3B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-[#064E3B] text-[#064E3B]'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Organisations tab */}
        {tab === 'organisations' && (
          filteredOrgs.length === 0 ? (
            <p className="text-sm text-gray-400 py-12 text-center">No organisations found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredOrgs.map((o) => <OrgCard key={o.id} org={o} />)}
            </div>
          )
        )}

        {/* Campaign tabs */}
        {tab !== 'organisations' && (
          <>
            {isSearching && (
              <p className="text-sm text-gray-500">
                {sorted.length === 0
                  ? 'No campaigns found.'
                  : `${sorted.length} campaign${sorted.length !== 1 ? 's' : ''} found`}
              </p>
            )}

            {sorted.length === 0 ? (
              <p className="text-sm text-gray-400 py-12 text-center">
                {tab === 'supporting' ? "You're not supporting any campaigns yet." : 'No campaigns yet.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sorted.map((d) => <DemandCard key={d.id} demand={d} />)}
              </div>
            )}

            {!isSearching && (
              <HowItWorks />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 flex flex-wrap gap-6 text-sm text-gray-400">
          <a href="/about" className="hover:text-[#064E3B] transition-colors">About</a>
          <a href="/contact" className="hover:text-[#064E3B] transition-colors">Contact</a>
          <a href="/terms" className="hover:text-[#064E3B] transition-colors">Terms</a>
          <a href="/privacy" className="hover:text-[#064E3B] transition-colors">Privacy</a>
        </div>
      </footer>
    </div>
  )
}
