import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: { user } }, { data: demands }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('demands')
      .select(`
        id, headline, status, support_count_cache, notification_threshold, created_at, creator_user_id, is_example,
        organisation:organisations(id, name, slug),
        demand_questions(count)
      `)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  // Fetch creator profiles for all demands
  const creatorIds = [...new Set((demands ?? []).map((d) => d.creator_user_id).filter(Boolean))]
  const { data: profiles } = creatorIds.length > 0
    ? await supabase.from('profiles').select('id, name').in('id', creatorIds)
    : { data: [] }

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

  // Fetch demands the user is supporting
  const { data: supports } = user
    ? await supabase.from('supports').select('demand_id').eq('user_id', user.id)
    : { data: [] }

  const supportedIds = new Set([
    ...(supports ?? []).map((s) => s.demand_id),
    ...(user ? (demands ?? []).filter((d) => d.creator_user_id === user.id).map((d) => d.id) : []),
  ])

  const demandsWithCreator = (demands ?? []).map((d) => ({
    ...d,
    organisation: (d.organisation as unknown as { id: string; name: string; slug: string }[] | null)?.[0] ?? null,
    creator: profileMap[d.creator_user_id] ?? null,
    question_count: (d.demand_questions as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
  }))

  return (
    <HomeClient demands={demandsWithCreator} supportedIds={[...supportedIds]} />
  )
}
