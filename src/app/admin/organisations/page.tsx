import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AddOrgForm from './AddOrgForm'

export default async function AdminOrganisationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')
  if (user.email !== process.env.ADMIN_EMAIL) redirect('/admin')

  const admin = createAdminClient()

  // Fetch all organisations and demand counts in parallel
  const [{ data: orgs }, { data: demandCounts }] = await Promise.all([
    admin
      .from('organisations')
      .select('id, name, slug, type, is_claimed, created_at')
      .order('name'),
    admin
      .from('demands')
      .select('organisation_id')
      .in('status', ['building', 'live', 'notified']),
  ])

  // Build a count map: organisation_id -> number of active demands
  const countMap = new Map<string, number>()
  for (const d of demandCounts ?? []) {
    countMap.set(d.organisation_id, (countMap.get(d.organisation_id) ?? 0) + 1)
  }

  const organisations = orgs ?? []

  const typeLabels: Record<string, string> = {
    football_club: 'Football',
    rugby_club: 'Rugby',
    cricket_club: 'Cricket',
    sports_org: 'Sports Org',
    other: 'Other',
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-3xl space-y-8">

        <div>
          <a
            href="/admin"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors mb-3 inline-block"
          >
            &larr; Back to admin
          </a>
          <h1 className="text-3xl font-black tracking-tight text-[#064E3B]">Organisations</h1>
          <p className="mt-1 text-sm text-gray-500">{organisations.length} total</p>
        </div>

        <AddOrgForm />

        {/* Organisations list */}
        <div className="space-y-3">
          {organisations.map((org) => {
            const activeDemands = countMap.get(org.id) ?? 0
            return (
              <div
                key={org.id}
                className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`/organisations/${org.slug}`}
                      className="text-sm font-bold text-[#064E3B] hover:underline truncate"
                    >
                      {org.name}
                    </a>
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                      {typeLabels[org.type] ?? org.type}
                    </span>
                    {org.is_claimed && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5">
                        Claimed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    /{org.slug} &middot; {activeDemands} active demand{activeDemands !== 1 ? 's' : ''}
                  </p>
                </div>
                <a
                  href={`/organisations/${org.slug}`}
                  className="shrink-0 text-xs text-gray-400 hover:text-[#064E3B] transition-colors"
                >
                  View &rarr;
                </a>
              </div>
            )
          })}

          {organisations.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No organisations yet.</p>
          )}
        </div>

      </div>
    </main>
  )
}
