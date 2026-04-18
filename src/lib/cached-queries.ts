import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Fetch approved demands for the home page.
 * Cached for 60 seconds with tag-based invalidation.
 */
export const getCachedDemands = unstable_cache(
  async () => {
    const supabase = createAdminClient()

    const { data: demands } = await supabase
      .from('demands')
      .select(`
        id, headline, status, support_count_cache, notification_threshold, created_at, creator_user_id, is_example, is_featured, organisation_id,
        demand_questions(count)
      `)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(100)

    const creatorIds = [...new Set((demands ?? []).map((d) => d.creator_user_id).filter(Boolean))]
    const orgIds = [...new Set((demands ?? []).map((d) => d.organisation_id).filter(Boolean))]

    const [{ data: profiles }, { data: orgs }] = await Promise.all([
      creatorIds.length > 0
        ? supabase.from('profiles').select('id, name').in('id', creatorIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      orgIds.length > 0
        ? supabase.from('organisations').select('id, name, slug').in('id', orgIds)
        : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
    ])

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))
    const orgMap = Object.fromEntries((orgs ?? []).map((o) => [o.id, o]))

    return (demands ?? []).map((d) => ({
      ...d,
      organisation: orgMap[d.organisation_id] ?? null,
      creator: profileMap[d.creator_user_id] ?? null,
      question_count: (d.demand_questions as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
    }))
  },
  ['demands-list'],
  { tags: ['demands-list'], revalidate: 60 }
)

/**
 * Fetch a single demand with all its public data.
 * Cached for 60 seconds with per-demand tag invalidation.
 */
export function getCachedDemand(id: string) {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()

      const { data: demand } = await supabase
        .from('demands')
        .select(`
          *,
          organisation:organisations(id, name, slug),
          questions:demand_questions(id, body, is_followup, round, created_at)
        `)
        .eq('id', id)
        .single()

      if (!demand) return null

      const [
        commentsResult,
        updatesResult,
        linksResult,
        notificationsResult,
      ] = await Promise.all([
        supabase
          .from('comments')
          .select('id, body, user_id, parent_comment_id, created_at, updated_at')
          .eq('demand_id', id)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('demand_updates')
          .select('id, type, body, pdf_url, video_url, created_at')
          .eq('demand_id', id)
          .order('created_at', { ascending: true }),
        supabase
          .from('demand_links')
          .select('id, url, title, created_at')
          .eq('demand_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('organisation_notifications')
          .select('id, sent_at')
          .eq('demand_id', id)
          .order('sent_at', { ascending: true }),
      ])

      const rawComments = commentsResult.data ?? []
      const commenterIds = [...new Set(rawComments.map((c: { user_id: string }) => c.user_id))]

      const [creatorProfileResult, commenterProfilesResult] = await Promise.all([
        supabase.from('profiles').select('id, name').eq('id', demand.creator_user_id).maybeSingle(),
        commenterIds.length > 0
          ? supabase.from('profiles').select('id, name, nickname').in('id', commenterIds)
          : Promise.resolve({ data: [] as { id: string; name: string; nickname: string | null }[] }),
      ])

      const commenterProfileMap = Object.fromEntries(
        (commenterProfilesResult.data ?? []).map((p: { id: string; name: string; nickname: string | null }) => [p.id, p])
      )

      const comments = rawComments.map((c: { id: string; body: string; user_id: string; parent_comment_id: string | null; created_at: string; updated_at: string | null }) => ({
        ...c,
        profile: commenterProfileMap[c.user_id] ?? null,
      }))

      return {
        demand,
        comments,
        updates: updatesResult.data ?? [],
        videoLinks: linksResult.data ?? [],
        notifications: notificationsResult.data ?? [],
        creatorName: creatorProfileResult.data?.name ?? null,
      }
    },
    [`demand-${id}`],
    { tags: [`demand-${id}`], revalidate: 60 }
  )()
}
