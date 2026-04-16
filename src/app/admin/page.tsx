import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminForms from './AdminForms'
import ClaimRequestsList from './ClaimRequestsList'

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

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

  const admin = createAdminClient()

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
    { count: orgCount },
    { count: commentCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('demands').select('*', { count: 'exact', head: true }),
    supabase.from('supports').select('*', { count: 'exact', head: true }),
    supabase.from('organisations').select('*', { count: 'exact', head: true }),
    supabase.from('comments').select('*', { count: 'exact', head: true }),
  ])

  // Recent activity — last 20 items across supports, comments, and new campaigns
  const [
    { data: recentSupports },
    { data: recentComments },
    { data: recentCampaigns },
  ] = await Promise.all([
    admin.from('supports').select('created_at, demand_id').order('created_at', { ascending: false }).limit(10),
    admin.from('comments').select('created_at, demand_id, body').order('created_at', { ascending: false }).limit(10),
    admin.from('demands').select('created_at, id, headline').order('created_at', { ascending: false }).limit(10),
  ])

  // Build unified activity feed
  type ActivityItem = { type: string; time: string; label: string; href: string }
  const activity: ActivityItem[] = []

  for (const s of recentSupports ?? []) {
    activity.push({ type: 'support', time: s.created_at, label: 'New supporter', href: `/demands/${s.demand_id}` })
  }
  for (const c of recentComments ?? []) {
    const snippet = c.body.length > 60 ? c.body.slice(0, 60) + '...' : c.body
    activity.push({ type: 'comment', time: c.created_at, label: snippet, href: `/demands/${c.demand_id}` })
  }
  for (const d of recentCampaigns ?? []) {
    activity.push({ type: 'campaign', time: d.created_at, label: d.headline, href: `/demands/${d.id}` })
  }

  activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const recentActivity = activity.slice(0, 15)

  const { data: allClaims } = await admin
    .from('claim_requests')
    .select('id, requester_name, requester_email, requester_role, status, created_at, organisation_other, organisation:organisations(name)')
    .order('created_at', { ascending: false })

  const pendingClaims = (allClaims ?? []).filter((c) => c.status === 'pending')
  const reviewedClaims = (allClaims ?? []).filter((c) => c.status !== 'pending')

  const typeIcon: Record<string, string> = {
    support: '👍',
    comment: '💬',
    campaign: '📢',
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-2xl space-y-10">

        <div>
          <p className="text-xs font-semibold text-[#F59E0B] uppercase tracking-widest mb-1">Megafone</p>
          <h1 className="text-3xl font-black tracking-tight text-[#064E3B]">Admin</h1>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Users', value: userCount ?? 0, href: '/admin/users' },
            { label: 'Campaigns', value: campaignCount ?? 0, href: '/admin/campaigns' },
            { label: 'Supports', value: supportCount ?? 0, href: null },
            { label: 'Comments', value: commentCount ?? 0, href: '/admin/comments' },
            { label: 'Organisations', value: orgCount ?? 0, href: '/admin/organisations' },
            { label: 'Claim requests', value: (allClaims ?? []).length, href: null },
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

        {/* Recent activity feed */}
        {recentActivity.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Recent activity</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {recentActivity.map((item, i) => (
                <li key={i}>
                  <a href={item.href} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                    <span className="text-sm">{typeIcon[item.type] ?? '·'}</span>
                    <span className="text-sm text-gray-700 truncate flex-1">{item.label}</span>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(item.time)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ClaimRequestsList
          pendingClaims={pendingClaims as unknown as Parameters<typeof ClaimRequestsList>[0]['pendingClaims']}
          reviewedClaims={reviewedClaims as unknown as Parameters<typeof ClaimRequestsList>[0]['reviewedClaims']}
        />

        <AdminForms organisations={organisations} />

        {/* Tech stack */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Tech stack</h2>
          </div>
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'Next.js 16', role: 'Frontend & server framework', url: 'https://nextjs.org' },
              { name: 'React 19', role: 'UI library', url: 'https://react.dev' },
              { name: 'Supabase', role: 'Database, auth & storage', url: 'https://supabase.com' },
              { name: 'Vercel', role: 'Hosting & deployment', url: 'https://vercel.com' },
              { name: 'Tailwind CSS 4', role: 'Styling', url: 'https://tailwindcss.com' },
              { name: 'Resend', role: 'Transactional email', url: 'https://resend.com' },
              { name: 'OpenAI', role: 'Content moderation', url: 'https://openai.com' },
              { name: 'TypeScript', role: 'Language', url: 'https://typescriptlang.org' },
            ].map((t) => (
              <a
                key={t.name}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div>
                  <p className="text-sm font-semibold text-[#064E3B]">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}
