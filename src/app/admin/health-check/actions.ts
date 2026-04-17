'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCachedDemands, getCachedDemand } from '@/lib/cached-queries'

export interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'skip'
  detail: string
  ms: number
}

export interface HealthCheckResult {
  results: TestResult[]
  totalMs: number
}

function isAdmin(email: string) {
  return email === process.env.ADMIN_EMAIL
}

async function runTest(name: string, fn: () => Promise<string>): Promise<TestResult> {
  const start = Date.now()
  try {
    const detail = await fn()
    return { name, status: 'pass', detail, ms: Date.now() - start }
  } catch (err) {
    return { name, status: 'fail', detail: err instanceof Error ? err.message : String(err), ms: Date.now() - start }
  }
}

export async function runHealthCheck(): Promise<HealthCheckResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdmin(user.email)) {
    return { results: [{ name: 'Auth', status: 'fail', detail: 'Access denied', ms: 0 }], totalMs: 0 }
  }

  const totalStart = Date.now()
  const admin = createAdminClient()
  const results: TestResult[] = []

  // Test IDs for cleanup
  let testDemandId: string | null = null
  let testSupportId: string | null = null
  let testCommentId: string | null = null

  // ── 1. Database connectivity ──────────────────────────────────
  results.push(await runTest('Database connectivity', async () => {
    const { count, error } = await admin.from('profiles').select('*', { count: 'exact', head: true })
    if (error) throw new Error(error.message)
    return `Connected — ${count} profiles found`
  }))

  // ── 2. Auth system ────────────────────────────────────────────
  results.push(await runTest('Auth system', async () => {
    const { data: { users }, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
    if (error) throw new Error(error.message)
    return `Working — ${users.length > 0 ? 'users accessible' : 'no users yet'}`
  }))

  // ── 3. Organisations exist ────────────────────────────────────
  results.push(await runTest('Organisations loaded', async () => {
    const { count, error } = await admin.from('organisations').select('*', { count: 'exact', head: true })
    if (error) throw new Error(error.message)
    if (!count || count === 0) throw new Error('No organisations in database')
    return `${count} organisations found`
  }))

  // ── 4. Create test campaign ───────────────────────────────────
  results.push(await runTest('Create campaign', async () => {
    const { data: org } = await admin.from('organisations').select('id').limit(1).single()
    if (!org) throw new Error('No organisation to test with')

    const { data, error } = await admin
      .from('demands')
      .insert({
        organisation_id: org.id,
        creator_user_id: user.id,
        headline: '__HEALTH_CHECK_TEST__',
        summary: 'Automated health check — will be deleted',
        status: 'building',
        support_count_cache: 0,
        notification_threshold: 100,
        moderation_status: 'approved',
      })
      .select('id')
      .single()

    if (error) throw new Error(error.message)
    testDemandId = data.id
    return `Created test campaign: ${data.id.slice(0, 8)}...`
  }))

  // ── 5. Support campaign (atomic increment) ────────────────────
  results.push(await runTest('Support + atomic increment', async () => {
    if (!testDemandId) throw new Error('No test campaign to support')

    const { error: supportError } = await admin
      .from('supports')
      .insert({ demand_id: testDemandId, user_id: user.id })

    if (supportError) throw new Error(supportError.message)

    const { data: countResult } = await admin.rpc('increment_support_count', { demand_id_input: testDemandId })
    if (countResult !== 1) throw new Error(`Expected count 1, got ${countResult}`)

    const { data: support } = await admin
      .from('supports')
      .select('id')
      .eq('demand_id', testDemandId)
      .eq('user_id', user.id)
      .single()

    testSupportId = support?.id ?? null
    return `Support recorded, count incremented to ${countResult}`
  }))

  // ── 6. Post comment ───────────────────────────────────────────
  results.push(await runTest('Post comment', async () => {
    if (!testDemandId) throw new Error('No test campaign')

    const { data, error } = await admin
      .from('comments')
      .insert({
        demand_id: testDemandId,
        user_id: user.id,
        body: '__HEALTH_CHECK_TEST_COMMENT__',
      })
      .select('id')
      .single()

    if (error) throw new Error(error.message)
    testCommentId = data.id
    return `Comment posted: ${data.id.slice(0, 8)}...`
  }))

  // ── 7. Cached queries ─────────────────────────────────────────
  results.push(await runTest('Cached demands list', async () => {
    const demands = await getCachedDemands()
    return `Returned ${demands.length} demands`
  }))

  results.push(await runTest('Cached single demand', async () => {
    if (!testDemandId) throw new Error('No test campaign')
    const result = await getCachedDemand(testDemandId)
    if (!result) throw new Error('Cached query returned null')
    return `Loaded demand with ${result.comments.length} comments`
  }))

  // ── 8. RLS: anon user cannot update other's demand ────────────
  results.push(await runTest('RLS blocks unauthorised update', async () => {
    // Use the regular (non-admin) client — should fail to update a demand
    // we didn't create via the regular client (RLS check)
    const { data: anyDemand } = await admin
      .from('demands')
      .select('id, creator_user_id')
      .neq('creator_user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!anyDemand) return 'Skip — no other user demands to test against'

    // Try updating via regular client (subject to RLS)
    const { error } = await supabase
      .from('demands')
      .update({ headline: '__RLS_TEST__' })
      .eq('id', anyDemand.id)

    // RLS should block this — the update either errors or affects 0 rows
    // With Supabase, RLS doesn't error — it just returns 0 rows affected
    // Check the headline didn't change
    const { data: check } = await admin
      .from('demands')
      .select('headline')
      .eq('id', anyDemand.id)
      .single()

    if (check?.headline === '__RLS_TEST__') {
      // Undo
      await admin.from('demands').update({ headline: 'RESTORED' }).eq('id', anyDemand.id)
      throw new Error('RLS did NOT block the update — security issue!')
    }

    return 'RLS correctly blocked unauthorised demand update'
  }))

  // ── 9. Email config ───────────────────────────────────────────
  results.push(await runTest('Email config (Resend)', async () => {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set')
    return 'RESEND_API_KEY is configured'
  }))

  results.push(await runTest('Email config (OpenAI)', async () => {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set')
    return 'OPENAI_API_KEY is configured'
  }))

  results.push(await runTest('Site URL config', async () => {
    const url = process.env.NEXT_PUBLIC_SITE_URL
    if (!url) throw new Error('NEXT_PUBLIC_SITE_URL not set — emails will use fallback')
    if (!url.startsWith('https://')) throw new Error(`NEXT_PUBLIC_SITE_URL should start with https:// — got: ${url}`)
    return `NEXT_PUBLIC_SITE_URL = ${url}`
  }))

  results.push(await runTest('Cron secret config', async () => {
    if (!process.env.CRON_SECRET) throw new Error('CRON_SECRET not set — weekly digest will fail')
    return 'CRON_SECRET is configured'
  }))

  // ── 10. Organisation notification emails table ────────────────
  results.push(await runTest('Notification emails table', async () => {
    const { count, error } = await admin
      .from('organisation_notification_emails')
      .select('*', { count: 'exact', head: true })

    if (error) throw new Error(`Table error: ${error.message}`)
    return `Table exists — ${count ?? 0} notification emails configured`
  }))

  // ── 11. Cleanup ───────────────────────────────────────────────
  results.push(await runTest('Cleanup test data', async () => {
    const cleaned: string[] = []

    if (testCommentId) {
      await admin.from('comments').delete().eq('id', testCommentId)
      cleaned.push('comment')
    }

    if (testSupportId) {
      await admin.from('supports').delete().eq('id', testSupportId)
      cleaned.push('support')
    }

    if (testDemandId) {
      await admin.from('demands').delete().eq('id', testDemandId)
      cleaned.push('campaign')
    }

    return `Cleaned up: ${cleaned.join(', ')}`
  }))

  return { results, totalMs: Date.now() - totalStart }
}
