import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'My Campaigns — Megafone' }

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  building:          { label: 'Building support',       className: 'bg-gray-100 text-gray-500' },
  live:              { label: 'Active',                  className: 'bg-blue-50 text-blue-600' },
  notified:          { label: 'Awaiting response',       className: 'bg-amber-50 text-amber-700' },
  responded:         { label: 'Responded',               className: 'bg-emerald-50 text-emerald-700' },
  further_questions: { label: 'Further questions',       className: 'bg-amber-50 text-amber-700' },
  resolved:          { label: 'Resolved',                className: 'bg-emerald-50 text-emerald-700' },
  unsatisfactory:    { label: 'Unsatisfactory response', className: 'bg-red-50 text-red-600' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface Campaign {
  id: string
  headline: string
  status: string
  support_count_cache: number | null
  created_at: string
  organisation: { name: string } | null
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { label, className } =
    STATUS_CONFIG[campaign.status] ?? { label: campaign.status, className: 'bg-gray-100 text-gray-500' }

  const orgName = (campaign.organisation as { name: string } | null)?.name ?? 'Unknown organisation'
  const count = campaign.support_count_cache ?? 0

  return (
    <Link
      href={`/demands/${campaign.id}`}
      className="block bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-gray-500">{orgName}</span>
        <span className="text-gray-200 text-xs">·</span>
        <span className="text-xs text-gray-400">{formatDate(campaign.created_at)}</span>
      </div>

      <h3 className="text-base font-bold text-[#064E3B] leading-snug mb-3">
        {campaign.headline}
      </h3>

      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
          {label}
        </span>
        <span className="text-xs text-gray-400">
          {count.toLocaleString()} supporter{count !== 1 ? 's' : ''}
        </span>
      </div>
    </Link>
  )
}

export default async function MyCampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch created and supported campaigns in parallel
  const [createdResult, supportedResult] = await Promise.all([
    supabase
      .from('demands')
      .select('id, headline, status, support_count_cache, created_at, organisation:organisations(name)')
      .eq('creator_user_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('supports')
      .select('demand:demands(id, headline, status, support_count_cache, created_at, organisation:organisations(name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function normaliseCampaign(d: any): Campaign {
    return {
      ...d,
      organisation: Array.isArray(d.organisation) ? d.organisation[0] ?? null : d.organisation,
    }
  }

  const created = (createdResult.data ?? []).map(normaliseCampaign)
  const supported = (supportedResult.data ?? [])
    .map((s) => s.demand ? normaliseCampaign(s.demand) : null)
    .filter((d): d is Campaign => d !== null)

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-2xl px-4 py-16">

        <div className="mb-10">
          <h1 className="text-3xl font-black tracking-tight text-[#064E3B] leading-none mb-1">
            My Campaigns
          </h1>
          <p className="text-sm text-gray-400">Campaigns you started and campaigns you support.</p>
        </div>

        {/* ── Campaigns you created ── */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-[#064E3B] mb-4">Campaigns you created</h2>

          {created.length > 0 ? (
            <div className="space-y-3">
              {created.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-8 text-center">
              <p className="text-sm text-gray-400 mb-3">You haven&apos;t created any campaigns yet.</p>
              <Link
                href="/demands/new"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#064E3B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#064E3B]/90 transition-colors"
              >
                Start a campaign
              </Link>
            </div>
          )}
        </section>

        {/* ── Campaigns you support ── */}
        <section>
          <h2 className="text-lg font-bold text-[#064E3B] mb-4">Campaigns you support</h2>

          {supported.length > 0 ? (
            <div className="space-y-3">
              {supported.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-8 text-center">
              <p className="text-sm text-gray-400 mb-3">You haven&apos;t supported any campaigns yet.</p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#064E3B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#064E3B]/90 transition-colors"
              >
                Browse campaigns
              </Link>
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
