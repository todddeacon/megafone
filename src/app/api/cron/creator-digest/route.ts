import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCreatorWeeklyDigestEmail } from '@/lib/email'

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Get all active campaigns (not resolved, not removed)
  const { data: demands } = await admin
    .from('demands')
    .select('id, headline, status, creator_user_id, support_count_cache')
    .not('status', 'in', '("resolved","unsatisfactory","not_relevant")')
    .eq('moderation_status', 'approved')

  if (!demands || demands.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0

  for (const demand of demands) {
    // Count new supporters this week
    const { count: newSupports } = await admin
      .from('supports')
      .select('*', { count: 'exact', head: true })
      .eq('demand_id', demand.id)
      .gte('created_at', oneWeekAgo)

    // Count comments this week
    const { count: newComments } = await admin
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('demand_id', demand.id)
      .gte('created_at', oneWeekAgo)

    const newSupportersThisWeek = newSupports ?? 0
    const commentsThisWeek = newComments ?? 0

    // Only send if there was activity this week
    if (newSupportersThisWeek === 0 && commentsThisWeek === 0) continue

    // Get creator email
    const { data: { user: creatorUser } } = await admin.auth.admin.getUserById(demand.creator_user_id)
    if (!creatorUser?.email) continue

    await sendCreatorWeeklyDigestEmail({
      to: creatorUser.email,
      demandHeadline: demand.headline,
      demandId: demand.id,
      status: demand.status,
      totalSupporters: demand.support_count_cache ?? 0,
      newSupportersThisWeek,
      commentsThisWeek,
    })

    sent++
  }

  return NextResponse.json({ sent })
}
