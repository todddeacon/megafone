import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CampaignModerationTable from './CampaignModerationTable'

export interface AdminCampaign {
  id: string
  headline: string
  status: string
  moderation_status: string
  moderation_scores: Record<string, number> | null
  support_count_cache: number
  is_featured: boolean
  is_example: boolean
  created_at: string
  organisation: { name: string; slug: string } | null
  creator: { name: string | null } | null
}

export default async function AdminCampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')
  if (user.email !== process.env.ADMIN_EMAIL) redirect('/admin')

  const { data: demands } = await supabase
    .from('demands')
    .select(`
      id,
      headline,
      status,
      moderation_status,
      moderation_scores,
      support_count_cache,
      is_featured,
      is_example,
      created_at,
      organisation:organisations(name, slug),
      creator:profiles(name)
    `)
    .order('created_at', { ascending: false })

  const campaigns: AdminCampaign[] = (demands ?? []).map((d) => ({
    id: d.id,
    headline: d.headline,
    status: d.status,
    moderation_status: d.moderation_status ?? 'approved',
    moderation_scores: d.moderation_scores as Record<string, number> | null,
    support_count_cache: d.support_count_cache ?? 0,
    is_featured: d.is_featured ?? false,
    is_example: d.is_example ?? false,
    created_at: d.created_at,
    organisation: Array.isArray(d.organisation) ? d.organisation[0] ?? null : d.organisation,
    creator: Array.isArray(d.creator) ? d.creator[0] ?? null : d.creator,
  }))

  const pendingReview = campaigns.filter((c) => c.moderation_status === 'pending_review')
  const approved = campaigns.filter((c) => c.moderation_status !== 'pending_review')

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-4xl space-y-8">

        <div>
          <a
            href="/admin"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors mb-3 inline-block"
          >
            ← Back to admin
          </a>
          <h1 className="text-3xl font-black tracking-tight text-[#064E3B]">Campaigns</h1>
          <p className="mt-1 text-sm text-gray-500">{campaigns.length} total · {pendingReview.length} awaiting review</p>
        </div>

        <CampaignModerationTable campaigns={approved} pendingReview={pendingReview} />

      </div>
    </main>
  )
}
