import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import OrgAvatar from '@/components/OrgAvatar'

export async function generateMetadata({ params }: PageProps<'/organisations/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organisations')
    .select('name')
    .eq('slug', slug)
    .single()

  if (!org) return { title: 'Organisation not found' }

  const description = `See all fan campaigns directed at ${org.name} on Megafone.`

  const ogUrl = `/api/og?${new URLSearchParams({
    title: org.name,
    subtitle: 'Fan campaigns on Megafone',
  })}`

  return {
    title: org.name,
    description,
    openGraph: {
      title: org.name,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: org.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: org.name,
      description,
      images: [ogUrl],
    },
  }
}

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

const ACTIVE_STATUSES = new Set(['live', 'notified', 'further_questions'])

function orgInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default async function OrganisationPage({ params }: PageProps<'/organisations/[slug]'>) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organisations')
    .select('id, name, slug, type, logo_url, is_claimed, description')
    .eq('slug', slug)
    .single()

  if (!org) notFound()

  const { data: demands } = await supabase
    .from('demands')
    .select('id, headline, status, support_count_cache, notification_threshold, created_at')
    .eq('organisation_id', org.id)
    .order('support_count_cache', { ascending: false })

  const total     = demands?.length ?? 0
  const active    = demands?.filter((d) => ACTIVE_STATUSES.has(d.status)).length ?? 0
  const responded = demands?.filter((d) => ['responded', 'resolved'].includes(d.status)).length ?? 0
  const initials  = orgInitials(org.name)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Org header */}
      <div className="bg-[#064E3B] border-b border-[#065F46]">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex items-center gap-5">
              {org.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={org.logo_url} alt={org.name} className="w-14 h-14 rounded-2xl object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-black text-white shrink-0">
                  {initials}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {org.name}
                  </h1>
                  {org.is_claimed && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-emerald-300 capitalize">{org.type.replace(/_/g, ' ')}</p>
              </div>
            </div>

            {!org.is_claimed && (
              <a
                href="/organisations/claim"
                className="self-start sm:self-auto rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                Claim this organisation →
              </a>
            )}
          </div>

          {/* Stats */}
          {total > 0 && (
            <div className="flex gap-8 mt-8 pt-6 border-t border-white/10">
              {[
                { n: total,     label: total === 1 ? 'campaign' : 'campaigns' },
                { n: active,    label: active === 1 ? 'active' : 'active' },
                { n: responded, label: responded === 1 ? 'responded' : 'responded' },
              ].map(({ n, label }) => (
                <div key={label}>
                  <p className="text-2xl font-black text-white leading-none">{n}</p>
                  <p className="text-xs text-emerald-300 mt-0.5 font-medium">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {org.description && (
        <div className="mx-auto max-w-5xl px-4 pt-8">
          <div className="bg-white rounded-2xl border border-gray-200 px-6 py-5">
            <p className="text-sm text-gray-600 leading-relaxed">{org.description}</p>
          </div>
        </div>
      )}

      {/* Campaigns */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        {!demands || demands.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-sm text-gray-400">No campaigns yet for this organisation.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {demands.map((demand) => {
              const s = STATUS_CONFIG[demand.status] ?? { label: demand.status, dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-500' }
              const isActive = ACTIVE_STATUSES.has(demand.status)
              const count = demand.support_count_cache
              const pct = demand.notification_threshold
                ? Math.min(100, Math.round((count / demand.notification_threshold) * 100))
                : null

              return (
                <a
                  key={demand.id}
                  href={`/demands/${demand.id}`}
                  className="group block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-transparent transition-all"
                >
                  {/* Header strip */}
                  <div className={`px-5 pt-4 pb-3 flex items-center justify-between gap-2 ${
                    isActive ? 'bg-[#064E3B]' : 'bg-gray-50 border-b border-gray-100'
                  }`}>
                    <span className={`text-xs font-semibold truncate ${isActive ? 'text-emerald-200' : 'text-gray-500'}`}>
                      {org.name}
                    </span>
                    <span className={`shrink-0 flex items-center gap-1 text-xs font-semibold ${isActive ? 'text-emerald-300' : 'text-gray-400'}`}>
                      {isActive && <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`} />}
                      {s.label}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <h3 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-3 group-hover:text-[#064E3B] transition-colors mb-4">
                      {demand.headline}
                    </h3>

                    <div className="flex items-end justify-between gap-2 mb-2">
                      <div>
                        <span className="text-3xl font-black text-[#064E3B] leading-none tabular-nums">
                          {count.toLocaleString('en-GB')}
                        </span>
                        <span className="text-xs text-gray-400 ml-1.5">
                          {count === 1 ? 'supporter' : 'supporters'}
                        </span>
                      </div>
                    </div>

                    {pct !== null && (
                      <div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isActive ? 'bg-[#F59E0B]' : 'bg-[#064E3B]'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{pct}% to notification threshold</p>
                      </div>
                    )}
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
