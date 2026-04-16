import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCachedDemands } from '@/lib/cached-queries'
import HomeClient from './HomeClient'
import ActivityTicker from '@/components/ActivityTicker'

export default async function HomePage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  // Fetch user, demands, and recent activity in parallel
  const [{ data: { user } }, demandsWithCreator, { data: recentSupports }] = await Promise.all([
    supabase.auth.getUser(),
    getCachedDemands(),
    admin
      .from('supports')
      .select('created_at, user_id, demand_id')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  // Build ticker items: need nickname/name for each supporter and headline for each demand
  let tickerItems: { name: string; headline: string; created_at: string }[] = []

  if (recentSupports && recentSupports.length > 0) {
    const userIds = [...new Set(recentSupports.map((s) => s.user_id))]
    const demandIds = [...new Set(recentSupports.map((s) => s.demand_id))]

    const [{ data: profiles }, { data: demands }] = await Promise.all([
      admin.from('profiles').select('id, name, nickname').in('id', userIds),
      admin.from('demands').select('id, headline').in('id', demandIds),
    ])

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
    const demandMap = new Map((demands ?? []).map((d) => [d.id, d]))

    tickerItems = recentSupports
      .map((s) => {
        const profile = profileMap.get(s.user_id)
        const demand = demandMap.get(s.demand_id)
        if (!demand) return null
        return {
          name: profile?.nickname ?? profile?.name?.split(' ')[0] ?? 'A fan',
          headline: demand.headline,
          created_at: s.created_at,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  }

  // Fetch demands the user is supporting (per-user, not cached)
  const { data: supports } = user
    ? await supabase.from('supports').select('demand_id').eq('user_id', user.id)
    : { data: [] }

  const supportedIds = new Set([
    ...(supports ?? []).map((s) => s.demand_id),
    ...(user ? demandsWithCreator.filter((d) => d.creator_user_id === user.id).map((d) => d.id) : []),
  ])

  return (
    <>
      <ActivityTicker items={tickerItems} />
      <HomeClient demands={demandsWithCreator} supportedIds={[...supportedIds]} />
    </>
  )
}
