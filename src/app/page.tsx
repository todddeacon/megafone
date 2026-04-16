import { createClient } from '@/lib/supabase/server'
import { getCachedDemands } from '@/lib/cached-queries'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch user (uncached — depends on cookies) and demands (cached) in parallel
  const [{ data: { user } }, demandsWithCreator] = await Promise.all([
    supabase.auth.getUser(),
    getCachedDemands(),
  ])

  // Fetch demands the user is supporting (per-user, not cached)
  const { data: supports } = user
    ? await supabase.from('supports').select('demand_id').eq('user_id', user.id)
    : { data: [] }

  const supportedIds = new Set([
    ...(supports ?? []).map((s) => s.demand_id),
    ...(user ? demandsWithCreator.filter((d) => d.creator_user_id === user.id).map((d) => d.id) : []),
  ])

  return (
    <HomeClient demands={demandsWithCreator} supportedIds={[...supportedIds]} />
  )
}
