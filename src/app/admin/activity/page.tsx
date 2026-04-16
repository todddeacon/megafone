import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

const typeIcon: Record<string, string> = {
  support: '👍',
  comment: '💬',
  campaign: '📢',
}

export default async function AdminActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')
  if (user.email !== process.env.ADMIN_EMAIL) redirect('/admin')

  const admin = createAdminClient()

  const [
    { data: recentSupports },
    { data: recentComments },
    { data: recentCampaigns },
  ] = await Promise.all([
    admin.from('supports').select('created_at, demand_id').order('created_at', { ascending: false }).limit(30),
    admin.from('comments').select('created_at, demand_id, body').order('created_at', { ascending: false }).limit(30),
    admin.from('demands').select('created_at, id, headline').order('created_at', { ascending: false }).limit(30),
  ])

  type ActivityItem = { type: string; time: string; label: string; href: string }
  const activity: ActivityItem[] = []

  for (const s of recentSupports ?? []) {
    activity.push({ type: 'support', time: s.created_at, label: 'New supporter', href: `/demands/${s.demand_id}` })
  }
  for (const c of recentComments ?? []) {
    const snippet = c.body.length > 80 ? c.body.slice(0, 80) + '...' : c.body
    activity.push({ type: 'comment', time: c.created_at, label: snippet, href: `/demands/${c.demand_id}` })
  }
  for (const d of recentCampaigns ?? []) {
    activity.push({ type: 'campaign', time: d.created_at, label: d.headline, href: `/demands/${d.id}` })
  }

  activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const items = activity.slice(0, 50)

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
          <h1 className="text-3xl font-black tracking-tight text-[#064E3B]">Recent activity</h1>
          <p className="mt-1 text-sm text-gray-500">{items.length} recent events</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {items.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {items.map((item, i) => (
                <li key={i}>
                  <a href={item.href} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                    <span className="text-sm">{typeIcon[item.type] ?? '·'}</span>
                    <span className="text-sm text-gray-700 truncate flex-1">{item.label}</span>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(item.time)}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No activity yet.</p>
          )}
        </div>

      </div>
    </main>
  )
}
