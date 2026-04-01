import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminForms from './AdminForms'
import ClaimRequestsList from './ClaimRequestsList'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  if (user.email !== process.env.ADMIN_EMAIL) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#064E3B] mb-2">Access denied</p>
          <p className="text-sm text-gray-500">You do not have admin access.</p>
        </div>
      </main>
    )
  }

  const { data: orgNames } = await supabase
    .from('organisations')
    .select('id, name')
    .order('name')

  const organisations = (orgNames ?? []).map((o) => ({ id: o.id, name: o.name as string }))

  // Stats
  const [
    { count: userCount },
    { count: campaignCount },
    { count: supportCount },
    { count: claimedOrgCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('demands').select('*', { count: 'exact', head: true }),
    supabase.from('supports').select('*', { count: 'exact', head: true }),
    supabase.from('organisations').select('*', { count: 'exact', head: true }).eq('is_claimed', true),
  ])

  const { data: allClaims } = await supabase
    .from('claim_requests')
    .select('id, requester_name, requester_email, requester_role, status, created_at, organisation_other, organisation:organisations(name)')
    .order('created_at', { ascending: false })

  const pendingClaims = (allClaims ?? []).filter((c) => c.status === 'pending')
  const reviewedClaims = (allClaims ?? []).filter((c) => c.status !== 'pending')

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-2xl space-y-10">

        <div>
          <p className="text-xs font-semibold text-[#F59E0B] uppercase tracking-widest mb-1">Megafone</p>
          <h1 className="text-3xl font-black tracking-tight text-[#064E3B]">Admin</h1>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Users', value: userCount ?? 0, href: null },
            { label: 'Campaigns', value: campaignCount ?? 0, href: '/admin/campaigns' },
            { label: 'Supports', value: supportCount ?? 0, href: null },
            { label: 'Claimed orgs', value: claimedOrgCount ?? 0, href: '/admin/org-emails' },
          ].map(({ label, value, href }) => {
            const inner = (
              <>
                <p className="text-2xl font-black text-[#064E3B]">{value.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </>
            )
            return href ? (
              <a key={label} href={href} className="bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-[#064E3B]/30 hover:shadow-sm transition-all block">
                {inner}
              </a>
            ) : (
              <div key={label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                {inner}
              </div>
            )
          })}
        </div>

        <ClaimRequestsList
          pendingClaims={pendingClaims as unknown as Parameters<typeof ClaimRequestsList>[0]['pendingClaims']}
          reviewedClaims={reviewedClaims as unknown as Parameters<typeof ClaimRequestsList>[0]['reviewedClaims']}
        />

        <AdminForms organisations={organisations} />

      </div>
    </main>
  )
}
