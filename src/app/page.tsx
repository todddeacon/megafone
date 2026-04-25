import { createClient } from '@/lib/supabase/server'
import { getCachedDemands } from '@/lib/cached-queries'
import { REVIEWS_ENABLED } from '@/lib/feature-flags'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch user (uncached — depends on cookies) and demands (cached) in parallel
  const [{ data: { user } }, demandsWithCreator] = await Promise.all([
    supabase.auth.getUser(),
    getCachedDemands(),
  ])

  // Hide reviews from the public feed when the feature flag is off.
  const visibleDemands = REVIEWS_ENABLED
    ? demandsWithCreator
    : demandsWithCreator.filter((d) => d.campaign_type !== 'review')

  // Fetch demands the user is supporting (per-user, not cached)
  const { data: supports } = user
    ? await supabase.from('supports').select('demand_id').eq('user_id', user.id)
    : { data: [] }

  const supportedIds = new Set([
    ...(supports ?? []).map((s) => s.demand_id),
    ...(user ? visibleDemands.filter((d) => d.creator_user_id === user.id).map((d) => d.id) : []),
  ])

  return (
    <HomeClient demands={visibleDemands} supportedIds={[...supportedIds]} />
  )
}
