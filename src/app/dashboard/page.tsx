import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import OrgProfileForm from './OrgProfileForm'
import TeamSection from './TeamSection'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  building:          { label: 'Building support',       className: 'bg-gray-100 text-gray-500' },
  live:              { label: 'Active',                  className: 'bg-blue-50 text-blue-600' },
  notified:          { label: 'Awaiting response',       className: 'bg-amber-50 text-amber-700' },
  responded:         { label: 'Responded',               className: 'bg-emerald-50 text-emerald-700' },
  further_questions: { label: 'Further questions',       className: 'bg-amber-50 text-amber-700' },
  resolved:          { label: 'Resolved',                className: 'bg-emerald-50 text-emerald-700' },
  unsatisfactory:    { label: 'Unsatisfactory response', className: 'bg-red-50 text-red-600' },
}

export const metadata = { title: 'Organisation Dashboard — Megafone' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?returnTo=/dashboard')

  const isAdmin = user.email === process.env.ADMIN_EMAIL
  const admin = createAdminClient()

  // Admin sees all organisations, org reps see only theirs
  let orgIds: string[]

  if (isAdmin) {
    // Admin sees orgs that have campaigns, plus any claimed orgs
    const { data: orgsWithCampaigns } = await admin
      .from('demands')
      .select('organisation_id')
      .eq('moderation_status', 'approved')
    const { data: claimedOrgs } = await admin
      .from('organisations')
      .select('id')
      .eq('is_claimed', true)

    const ids = new Set([
      ...(orgsWithCampaigns ?? []).map((d) => d.organisation_id),
      ...(claimedOrgs ?? []).map((o) => o.id),
    ])
    orgIds = [...ids]
  } else {
    const { data: repRecords } = await supabase
      .from('org_reps')
      .select('organisation_id')
      .eq('user_id', user.id)

    if (!repRecords || repRecords.length === 0) {
      return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <p className="text-2xl font-bold text-[#064E3B] mb-2">No organisations</p>
            <p className="text-sm text-gray-500 mb-6">
              You're not a verified representative of any organisation yet.
            </p>
            <a
              href="/organisations/claim"
              className="inline-block rounded-lg bg-[#064E3B] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#065F46] transition-colors"
            >
              Claim your organisation
            </a>
          </div>
        </main>
      )
    }

    orgIds = repRecords.map((r) => r.organisation_id)
  }

  // Fetch orgs and their campaigns
  const [{ data: orgs }, { data: demands }] = await Promise.all([
    admin.from('organisations').select('id, name, slug, type, description, logo_url, is_claimed').in('id', orgIds),
    admin.from('demands')
      .select('id, headline, status, support_count_cache, created_at, organisation_id, moderation_status')
      .in('organisation_id', orgIds)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false }),
  ])

  // Fetch team data: org reps and notification emails
  const [{ data: allOrgReps }, { data: allNotifEmails }] = await Promise.all([
    admin.from('org_reps').select('id, user_id, organisation_id, created_at').in('organisation_id', orgIds),
    admin.from('organisation_notification_emails').select('id, organisation_id, email, label, title, created_at').in('organisation_id', orgIds),
  ])

  // Resolve org rep emails from auth
  const repUserIds = [...new Set((allOrgReps ?? []).map((r) => r.user_id))]
  const repProfiles = new Map<string, { name: string; email: string }>()

  if (repUserIds.length > 0) {
    const [{ data: profiles }] = await Promise.all([
      admin.from('profiles').select('id, name').in('id', repUserIds),
    ])

    // Get emails from auth
    let page = 1
    while (true) {
      const { data: { users }, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
      if (error || !users || users.length === 0) break
      for (const u of users) {
        if (repUserIds.includes(u.id)) {
          const profile = (profiles ?? []).find((p) => p.id === u.id)
          repProfiles.set(u.id, { name: profile?.name ?? u.email ?? 'Unknown', email: u.email ?? '' })
        }
      }
      if (users.length < 1000) break
      page++
    }
  }

  const organisations = orgs ?? []
  const campaigns = demands ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-4xl px-4 py-12">

        <div className="mb-10">
          <p className="text-xs font-semibold text-[#F59E0B] uppercase tracking-widest mb-1">Organisation</p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-[#064E3B]">Dashboard</h1>
            {isAdmin && (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                Admin view
              </span>
            )}
          </div>
          {isAdmin && (
            <p className="text-sm text-gray-400 mt-1">Showing all organisations with campaigns or claimed status.</p>
          )}
        </div>

        {organisations.map((org) => {
          const orgCampaigns = campaigns.filter((d) => d.organisation_id === org.id)
          const awaitingResponse = orgCampaigns.filter((d) => d.status === 'notified' || d.status === 'further_questions')
          const totalSupporters = orgCampaigns.reduce((sum, d) => sum + (d.support_count_cache ?? 0), 0)

          return (
            <div key={org.id} className="mb-12">
              {/* Org header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#064E3B]/10 border border-[#064E3B]/20 flex items-center justify-center text-lg font-bold text-[#064E3B] shrink-0">
                  {org.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#064E3B]">{org.name}</h2>
                  <a href={`/organisations/${org.slug}`} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    View public page →
                  </a>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                  <p className="text-2xl font-black text-[#064E3B]">{orgCampaigns.length}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Campaigns</p>
                </div>
                <div className={`rounded-xl border px-5 py-4 ${awaitingResponse.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
                  <p className={`text-2xl font-black ${awaitingResponse.length > 0 ? 'text-amber-600' : 'text-[#064E3B]'}`}>
                    {awaitingResponse.length}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Awaiting response</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                  <p className="text-2xl font-black text-[#064E3B]">{totalSupporters.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Total supporters</p>
                </div>
              </div>

              {/* Campaigns needing response */}
              {awaitingResponse.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Needs your response
                  </h3>
                  <div className="space-y-2">
                    {awaitingResponse.map((d) => {
                      const s = STATUS_CONFIG[d.status] ?? { label: d.status, className: 'bg-gray-100 text-gray-500' }
                      return (
                        <Link
                          key={d.id}
                          href={`/demands/${d.id}`}
                          className="block bg-white rounded-xl border border-amber-200 px-5 py-4 hover:border-amber-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{d.headline}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {(d.support_count_cache ?? 0).toLocaleString()} supporters
                              </p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>
                              {s.label}
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* All campaigns */}
              <div className="mb-8">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">All campaigns</h3>
                {orgCampaigns.length === 0 ? (
                  <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-200 px-5 py-8 text-center">
                    No campaigns directed at {org.name} yet.
                  </p>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                    {orgCampaigns.map((d) => {
                      const s = STATUS_CONFIG[d.status] ?? { label: d.status, className: 'bg-gray-100 text-gray-500' }
                      return (
                        <Link
                          key={d.id}
                          href={`/demands/${d.id}`}
                          className="block px-5 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{d.headline}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {(d.support_count_cache ?? 0).toLocaleString()} supporters
                                {' · '}
                                {new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>
                              {s.label}
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Team management */}
              <TeamSection
                orgId={org.id}
                orgName={org.name}
                reps={(allOrgReps ?? [])
                  .filter((r) => r.organisation_id === org.id)
                  .map((r) => ({
                    id: r.id,
                    userId: r.user_id,
                    name: repProfiles.get(r.user_id)?.name ?? 'Unknown',
                    email: repProfiles.get(r.user_id)?.email ?? '',
                    createdAt: r.created_at,
                  }))}
                notifEmails={(allNotifEmails ?? [])
                  .filter((e) => e.organisation_id === org.id)
                  .map((e) => ({
                    id: e.id,
                    email: e.email,
                    name: e.label,
                    title: e.title,
                    createdAt: e.created_at,
                  }))}
              />

              {/* Org profile management */}
              <OrgProfileForm
                orgId={org.id}
                currentDescription={org.description ?? ''}
                orgName={org.name}
              />
            </div>
          )
        })}

      </main>
    </div>
  )
}
