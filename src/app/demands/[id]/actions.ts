'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { createHash, randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { sendThresholdEmail, sendResponseEmail, sendFollowUpEmail, sendWelcomeSupporterEmail, sendCampaignSentEmail, sendCampaignResolvedEmail, sendCreatorUpdateEmail, sendCreatorFirstSupporterEmail, sendCreatorMilestoneEmail, sendCreatorTargetReachedEmail, sendCreatorResponseReceivedEmail, sendOrgWelcomeEmail, sendOrgCreatorUpdateEmail } from '@/lib/email'
import { checkModeration, checkProfanity } from '@/lib/moderation'
import { createAdminClient, getEmailsForUserIds } from '@/lib/supabase/admin'
import { canActAsCreator, canActAsOrgRep } from '@/lib/admin-mode'
import { REVIEWS_ENABLED } from '@/lib/feature-flags'

export type ActionState = { error: string | null }

const AGREE_COOKIE = 'mf_agree_id'
const AGREE_RATE_LIMIT_WINDOW_MS = 60_000
const AGREE_RATE_LIMIT_MAX = 10

function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null
  const salt = process.env.AGREE_IP_SALT ?? 'mf-agree-salt'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

async function getClientIp(): Promise<string | null> {
  const h = await headers()
  const fwd = h.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return h.get('x-real-ip')
}

export async function toggleReviewResolved(demandId: string): Promise<ActionState> {
  if (!REVIEWS_ENABLED) return { error: 'Reviews are not currently available.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const admin = createAdminClient()
  const { data: demand } = await admin
    .from('demands')
    .select('id, organisation_id, campaign_type, resolved_by_org')
    .eq('id', demandId)
    .single()

  if (!demand) return { error: 'Review not found.' }
  if (demand.campaign_type !== 'review') return { error: 'This action only applies to reviews.' }
  if (!demand.organisation_id) return { error: 'This review is not tagged to an organisation.' }

  const { data: rep } = await supabase
    .from('org_reps')
    .select('id')
    .eq('user_id', user.id)
    .eq('organisation_id', demand.organisation_id)
    .maybeSingle()

  if (!rep && !(await canActAsOrgRep(user.email))) {
    return { error: 'Only verified organisation representatives can update this.' }
  }

  const nowResolved = !demand.resolved_by_org

  const { error } = await admin
    .from('demands')
    .update({
      resolved_by_org: nowResolved,
      resolved_by_org_at: nowResolved ? new Date().toISOString() : null,
      resolved_by_org_user_id: nowResolved ? user.id : null,
    })
    .eq('id', demandId)

  if (error) return { error: 'Failed to update review status.' }

  revalidatePath(`/demands/${demandId}`)
  revalidatePath('/dashboard')
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  return { error: null }
}

export async function postReviewReply(
  demandId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!REVIEWS_ENABLED) return { error: 'Reviews are not currently available.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const admin = createAdminClient()
  const { data: demand } = await admin
    .from('demands')
    .select('id, organisation_id, campaign_type')
    .eq('id', demandId)
    .single()

  if (!demand) return { error: 'Review not found.' }
  if (demand.campaign_type !== 'review') return { error: 'This action only applies to reviews.' }
  if (!demand.organisation_id) return { error: 'This review is not tagged to an organisation.' }

  const { data: rep } = await supabase
    .from('org_reps')
    .select('id')
    .eq('user_id', user.id)
    .eq('organisation_id', demand.organisation_id)
    .maybeSingle()

  if (!rep && !(await canActAsOrgRep(user.email))) {
    return { error: 'Only verified organisation representatives can reply.' }
  }

  const body = (formData.get('body') as string)?.trim()
  if (!body) return { error: 'Reply cannot be empty.' }
  if (body.length > 2000) return { error: 'Reply must be under 2000 characters.' }

  const profanityMatch = checkProfanity(body, 'comment')
  if (profanityMatch) return { error: 'Your reply contains language that doesn\'t meet our community guidelines.' }

  const moderation = await checkModeration(body)
  if (moderation.action !== 'approve') {
    return { error: 'Your reply contains content that doesn\'t meet our community guidelines.' }
  }

  const { error: insertError } = await admin
    .from('demand_updates')
    .insert({
      demand_id: demandId,
      author_user_id: user.id,
      type: 'official_response',
      body,
    })

  if (insertError) return { error: 'Failed to post reply. Please try again.' }

  revalidatePath(`/demands/${demandId}`)
  revalidatePath('/dashboard')
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  return { error: null }
}

export async function agreeWithReview(demandId: string): Promise<ActionState> {
  if (!REVIEWS_ENABLED) return { error: 'Reviews are not currently available.' }

  // Ensure target exists and is a review
  const admin = createAdminClient()
  const { data: demand } = await admin
    .from('demands')
    .select('id, campaign_type, moderation_status, support_count_cache')
    .eq('id', demandId)
    .single()

  if (!demand) return { error: 'Campaign not found.' }
  if (demand.campaign_type !== 'review') return { error: 'This action only applies to reviews.' }
  if (demand.moderation_status && demand.moderation_status !== 'approved') {
    return { error: 'This review is not yet available.' }
  }

  // Cookie-based identity (set one if missing)
  const cookieStore = await cookies()
  let cookieId = cookieStore.get(AGREE_COOKIE)?.value
  if (!cookieId) {
    cookieId = randomUUID()
    cookieStore.set(AGREE_COOKIE, cookieId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })
  }

  // Authenticated user, if any
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // IP-based rate limit: max N inserts per minute from the same IP (spam defence)
  const ip = await getClientIp()
  const ipHash = hashIp(ip)
  if (ipHash) {
    const since = new Date(Date.now() - AGREE_RATE_LIMIT_WINDOW_MS).toISOString()
    const { count: recentCount } = await admin
      .from('review_agrees')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', since)

    if ((recentCount ?? 0) >= AGREE_RATE_LIMIT_MAX) {
      return { error: 'You are clicking too fast. Try again in a moment.' }
    }
  }

  // Insert — UNIQUE (demand_id, cookie_id) handles dedup
  const { error: insertError } = await admin
    .from('review_agrees')
    .insert({
      demand_id: demandId,
      cookie_id: cookieId,
      ip_hash: ipHash,
      user_id: user?.id ?? null,
    })

  if (insertError) {
    if (insertError.code === '23505') return { error: 'You have already agreed with this review.' }
    return { error: 'Could not record your agreement. Please try again.' }
  }

  await admin.rpc('increment_support_count', { demand_id_input: demandId })

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  revalidateTag('demands-list', { expire: 0 })
  return { error: null }
}

export async function setNickname(nickname: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const clean = nickname.trim()
  if (!clean) return { error: 'Please enter a nickname.' }
  if (clean.length < 2) return { error: 'Nickname must be at least 2 characters.' }
  if (clean.length > 30) return { error: 'Nickname must be under 30 characters.' }

  const { error } = await supabase
    .from('profiles')
    .update({ nickname: clean })
    .eq('id', user.id)

  if (error) return { error: 'Failed to save nickname.' }

  revalidatePath('/')
  revalidateTag('demands-list', { expire: 0 })
  return { error: null }
}

export async function supportDemand(demandId: string): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in to support a demand.' }
  if (!user.email_confirmed_at) return { error: 'Please verify your email before supporting.' }

  const { error: insertError } = await supabase
    .from('supports')
    .insert({ demand_id: demandId, user_id: user.id })

  if (insertError) {
    if (insertError.code === '23505') return { error: 'You have already supported this demand.' }
    return { error: 'Failed to record your support. Please try again.' }
  }

  // Atomic increment — safe under concurrent load
  const { data: countResult } = await supabase
    .rpc('increment_support_count', { demand_id_input: demandId })

  const newCount = countResult ?? 0

  // Fetch demand details + creator + org for emails
  const { data: demand } = await supabase
    .from('demands')
    .select('notification_threshold, threshold_notified_at, headline, summary, organisation_id, status, creator_user_id')
    .eq('id', demandId)
    .single()

  // Auto-transition building → live on first supporter (uses admin client to bypass RLS)
  const admin = createAdminClient()
  if (newCount === 1 && demand?.status === 'building') {
    const { error: statusError } = await admin.from('demands').update({ status: 'live' }).eq('id', demandId)
    if (statusError) console.error('[supportDemand] Failed to transition to live:', statusError.message)
  }

  // Send welcome supporter email + creator notifications — wrapped in try-catch so failures don't block the action
  try {
  if (demand) {
    const [{ data: creatorProfile }, { data: org }] = await Promise.all([
      supabase.from('profiles').select('name').eq('id', demand.creator_user_id).maybeSingle(),
      supabase.from('organisations').select('name').eq('id', demand.organisation_id).single(),
    ])

    // Welcome email to the supporter
    if (user.email && org) {
      await sendWelcomeSupporterEmail({
        to: user.email,
        creatorName: creatorProfile?.name ?? 'A fan',
        orgName: org.name,
        demandHeadline: demand.headline,
        demandId,
        supportCount: newCount,
      })
    }

    // Creator email: first supporter
    if (newCount === 1 && org) {
      const creatorAuth = await admin.auth.admin.getUserById(demand.creator_user_id)
      const creatorEmail = creatorAuth.data?.user?.email
      if (creatorEmail) {
        await sendCreatorFirstSupporterEmail({
          to: creatorEmail,
          orgName: org.name,
          demandHeadline: demand.headline,
          demandId,
        })
      }
    }

    // Creator email: milestone (25%, 50%, 75%)
    if (demand.notification_threshold && org) {
      const threshold = demand.notification_threshold
      const milestones = [
        { pct: 25, boundary: Math.floor(threshold * 0.25) },
        { pct: 50, boundary: Math.floor(threshold * 0.50) },
        { pct: 75, boundary: Math.floor(threshold * 0.75) },
      ]

      for (const { pct, boundary } of milestones) {
        // Only send if we just crossed this milestone (previous count was below, new count is at or above)
        if (boundary > 0 && newCount >= boundary && (newCount - 1) < boundary) {
          const creatorAuth = await admin.auth.admin.getUserById(demand.creator_user_id)
          const creatorEmail = creatorAuth.data?.user?.email
          if (creatorEmail) {
            await sendCreatorMilestoneEmail({
              to: creatorEmail,
              orgName: org.name,
              demandHeadline: demand.headline,
              demandId,
              supportCount: newCount,
              threshold,
              percentage: pct,
            })
          }
          break // only send one milestone per support action
        }
      }
    }
  }

  // Check whether this support just crossed the notification threshold
  if (
    demand?.notification_threshold &&
    newCount >= demand.notification_threshold &&
    !demand.threshold_notified_at
  ) {
    const [{ data: org }, { data: questions }, { data: notifEmails }] = await Promise.all([
      supabase
        .from('organisations')
        .select('name, slug')
        .eq('id', demand.organisation_id)
        .single(),
      supabase
        .from('demand_questions')
        .select('body')
        .eq('demand_id', demandId)
        .eq('is_followup', false),
      admin
        .from('organisation_notification_emails')
        .select('email')
        .eq('organisation_id', demand.organisation_id),
    ])

    const emails = notifEmails?.map((e) => e.email) ?? []

    if (org && emails.length > 0) {
      // Atomically claim the notification slot — only one concurrent request will get rows: 1
      const { data: claimed } = await admin
        .from('demands')
        .update({ threshold_notified_at: new Date().toISOString(), status: 'notified' })
        .eq('id', demandId)
        .is('threshold_notified_at', null)
        .select('id')

      if (claimed && claimed.length > 0) {
        await sendThresholdEmail({
          to: emails,
          orgName: org.name,
          orgSlug: org.slug,
          demandHeadline: demand.headline,
          demandId,
          supportCount: newCount,
          threshold: demand.notification_threshold,
          summary: demand.summary ?? '',
          questions: questions?.map((q) => q.body) ?? [],
        })

        // Org welcome email: explains what Megafone is
        await sendOrgWelcomeEmail({
          to: emails,
          orgName: org.name,
          orgSlug: org.slug,
          demandHeadline: demand.headline,
          demandId,
          supportCount: newCount,
          questions: questions?.map((q) => q.body) ?? [],
        })

        // Creator email: target reached
        const creatorAuth = await admin.auth.admin.getUserById(demand.creator_user_id)
        const creatorEmail = creatorAuth.data?.user?.email
        if (creatorEmail) {
          await sendCreatorTargetReachedEmail({
            to: creatorEmail,
            orgName: org.name,
            demandHeadline: demand.headline,
            demandId,
            threshold: demand.notification_threshold,
          })
        }

        // Email 2: notify all supporters that the campaign has been sent
        const { data: supporters } = await supabase.from('supports').select('user_id').eq('demand_id', demandId)
        if (supporters && supporters.length > 0) {
          const supporterIds = new Set(supporters.map((s) => s.user_id))
          const supporterEmails = await getEmailsForUserIds(supporterIds)
          if (supporterEmails.length > 0) {
            await sendCampaignSentEmail({
              to: supporterEmails,
              orgName: org.name,
              demandHeadline: demand.headline,
              demandId,
              supportCount: newCount,
              threshold: demand.notification_threshold,
            })
          }
        }
      }
    }
  }
  } catch (emailError) {
    console.error('[supportDemand] Email/notification error:', emailError)
  }

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  revalidateTag('demands-list', { expire: 0 })
  return { error: null }
}

export async function postComment(
  demandId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in to comment.' }

  const { data: support } = await supabase
    .from('supports')
    .select('id')
    .eq('demand_id', demandId)
    .eq('user_id', user.id)
    .single()

  if (!support) return { error: 'You must support this demand before commenting.' }

  const body = (formData.get('body') as string)?.trim()
  if (!body) return { error: 'Comment cannot be empty.' }
  if (body.length > 1000) return { error: 'Comment must be under 1000 characters.' }

  const profanityMatch = checkProfanity(body, 'comment')
  if (profanityMatch) {
    return { error: 'Your comment contains language that doesn\'t meet our community guidelines.' }
  }

  const moderation = await checkModeration(body)
  if (moderation.action !== 'approve') {
    return { error: 'Your comment contains content that doesn\'t meet our community guidelines.' }
  }

  const parentCommentId = (formData.get('parent_comment_id') as string) || null

  const { error: insertError } = await supabase
    .from('comments')
    .insert({ demand_id: demandId, user_id: user.id, body, parent_comment_id: parentCommentId })

  if (insertError) return { error: 'Failed to post comment. Please try again.' }

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  return { error: null }
}

export async function deleteComment(commentId: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: comment } = await supabase
    .from('comments')
    .select('user_id, demand_id')
    .eq('id', commentId)
    .single()

  if (!comment) return { error: 'Comment not found.' }
  if (comment.user_id !== user.id) return { error: 'You can only delete your own comments.' }

  const { error: deleteError } = await supabase.from('comments').delete().eq('id', commentId)
  if (deleteError) return { error: 'Failed to delete comment. Please try again.' }
  revalidatePath(`/demands/${comment.demand_id}`)
  revalidateTag(`demand-${comment.demand_id}`, { expire: 0 })
  return { error: null }
}

export async function editComment(
  commentId: string,
  newBody: string
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const adminForRead = createAdminClient()
  const { data: comment } = await adminForRead
    .from('comments')
    .select('user_id, demand_id')
    .eq('id', commentId)
    .single()

  if (!comment) return { error: 'Comment not found.' }
  if (comment.user_id !== user.id) return { error: 'You can only edit your own comments.' }

  const body = newBody.trim()
  if (!body) return { error: 'Comment cannot be empty.' }
  if (body.length > 1000) return { error: 'Comment must be under 1000 characters.' }

  const { error } = await adminForRead
    .from('comments')
    .update({ body, updated_at: new Date().toISOString() })
    .eq('id', commentId)

  if (error) return { error: 'Failed to edit comment.' }

  revalidatePath(`/demands/${comment.demand_id}`)
  revalidateTag(`demand-${comment.demand_id}`, { expire: 0 })
  return { error: null }
}

export async function addFollowUpQuestions(
  demandId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in.' }

  const adminForRead = createAdminClient()
  const { data: demand } = await adminForRead
    .from('demands')
    .select('creator_user_id, status')
    .eq('id', demandId)
    .single()

  if (!demand) return { error: 'Demand not found.' }
  if (demand.creator_user_id !== user.id && !(await canActAsCreator(user.email))) return { error: 'Only the creator can add follow-up questions.' }

  const questions = (formData.getAll('question') as string[]).map((q) => q.trim()).filter(Boolean)
  if (questions.length === 0) return { error: 'At least one question is required.' }

  // Check each question for profanity and moderation
  for (const body of questions) {
    const profanityMatch = checkProfanity(body, 'campaign')
    if (profanityMatch) {
      return { error: 'One of your questions contains language that doesn\'t meet our community guidelines.' }
    }

    const moderation = await checkModeration(body)
    if (moderation.action !== 'approve') {
      return { error: 'One of your questions contains content that doesn\'t meet our community guidelines.' }
    }
  }

  // Round = number of official responses so far + 1
  const { count: responseCount } = await supabase
    .from('demand_updates')
    .select('*', { count: 'exact', head: true })
    .eq('demand_id', demandId)
    .eq('type', 'official_response')

  const round = (responseCount ?? 0) + 1

  const questionRows = questions.map((body) => ({
    demand_id: demandId,
    author_user_id: user.id,
    body,
    is_followup: true,
    round,
  }))

  const { error: insertError } = await supabase
    .from('demand_questions')
    .insert(questionRows)

  if (insertError) return { error: 'Failed to add follow-up questions. Please try again.' }

  if (demand.status === 'responded') {
    const { error: statusError } = await supabase.from('demands').update({ status: 'further_questions' }).eq('id', demandId)
    if (statusError) console.error('[addFollowUpQuestions] Status update failed:', statusError.message)
  }

  // Log as update (combine all questions)
  await supabase
    .from('demand_updates')
    .insert({ demand_id: demandId, author_user_id: user.id, type: 'followup_question', body: questions.join('\n') })

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  revalidateTag('demands-list', { expire: 0 })
  return { error: null }
}

export async function editFollowUpQuestion(
  questionId: string,
  demandId: string,
  newBody: string
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const adminForRead = createAdminClient()
  const { data: question } = await adminForRead
    .from('demand_questions')
    .select('author_user_id, is_followup')
    .eq('id', questionId)
    .single()

  if (!question) return { error: 'Question not found.' }
  if (!question.is_followup) return { error: 'Only follow-up questions can be edited.' }
  if (question.author_user_id !== user.id && !(await canActAsCreator(user.email))) {
    return { error: 'Only the creator can edit this question.' }
  }

  const body = newBody.trim()
  if (!body) return { error: 'Question cannot be empty.' }

  const profanityMatch = checkProfanity(body, 'campaign')
  if (profanityMatch) return { error: 'Your question contains language that doesn\'t meet our community guidelines.' }

  const moderation = await checkModeration(body)
  if (moderation.action !== 'approve') return { error: 'Your question contains content that doesn\'t meet our community guidelines.' }

  const { error } = await adminForRead
    .from('demand_questions')
    .update({ body })
    .eq('id', questionId)

  if (error) return { error: 'Failed to edit question.' }

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  return { error: null }
}

export async function deleteFollowUpQuestion(
  questionId: string,
  demandId: string
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const adminForRead = createAdminClient()
  const { data: question } = await adminForRead
    .from('demand_questions')
    .select('author_user_id, is_followup')
    .eq('id', questionId)
    .single()

  if (!question) return { error: 'Question not found.' }
  if (!question.is_followup) return { error: 'Only follow-up questions can be deleted.' }
  if (question.author_user_id !== user.id && !(await canActAsCreator(user.email))) {
    return { error: 'Only the creator can delete this question.' }
  }

  const { error } = await adminForRead
    .from('demand_questions')
    .delete()
    .eq('id', questionId)

  if (error) return { error: 'Failed to delete question.' }

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  return { error: null }
}

export async function addCreatorUpdate(
  demandId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in.' }

  const adminForRead = createAdminClient()
  const { data: demand, error: demandReadError } = await adminForRead
    .from('demands')
    .select('creator_user_id, headline, organisation_id, threshold_notified_at, support_count_cache')
    .eq('id', demandId)
    .single()

  if (demandReadError || !demand) return { error: 'Demand not found.' }
  if (demand.creator_user_id !== user.id && !(await canActAsCreator(user.email))) return { error: 'Only the creator can post updates.' }

  const body = (formData.get('body') as string)?.trim()
  if (!body) return { error: 'Update cannot be empty.' }
  if (body.length > 2000) return { error: 'Update must be under 2000 characters.' }

  const profanityMatch = checkProfanity(body, 'campaign')
  if (profanityMatch) {
    return { error: 'Your update contains language that doesn\'t meet our community guidelines.' }
  }

  const moderation = await checkModeration(body)
  if (moderation.action !== 'approve') {
    return { error: 'Your update contains content that doesn\'t meet our community guidelines.' }
  }

  const { error: insertError } = await supabase
    .from('demand_updates')
    .insert({ demand_id: demandId, author_user_id: user.id, type: 'update', body })

  if (insertError) return { error: 'Failed to post update. Please try again.' }

  try {
    const [{ data: creatorProfile }, { data: supporters }] = await Promise.all([
      supabase.from('profiles').select('name').eq('id', user.id).maybeSingle(),
      supabase.from('supports').select('user_id').eq('demand_id', demandId),
    ])

    if (supporters && supporters.length > 0) {
      const supporterIds = new Set(supporters.map((s) => s.user_id))
      const emails = await getEmailsForUserIds(supporterIds)
      if (emails.length > 0) {
        await sendCreatorUpdateEmail({
          to: emails,
          creatorName: creatorProfile?.name ?? 'The campaign creator',
          demandHeadline: demand.headline,
          demandId,
          updateBody: body,
          hasVideo: false,
        })
      }
    }

    if (demand.threshold_notified_at) {
      const adminClient = createAdminClient()
      const [{ data: org }, { data: notifEmails }] = await Promise.all([
        supabase.from('organisations').select('name').eq('id', demand.organisation_id).single(),
        adminClient.from('organisation_notification_emails').select('email').eq('organisation_id', demand.organisation_id),
      ])
      const orgEmails = notifEmails?.map((e) => e.email) ?? []
      if (org && orgEmails.length > 0) {
        await sendOrgCreatorUpdateEmail({
          to: orgEmails,
          orgName: org.name,
          demandHeadline: demand.headline,
          demandId,
          supportCount: demand.support_count_cache ?? 0,
          updateBody: body,
          hasVideo: false,
        })
      }
    }
  } catch (emailError) {
    console.error('[addCreatorUpdate] Email error:', emailError)
  }

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  return { error: null }
}

export async function editCreatorUpdate(
  updateId: string,
  demandId: string,
  newBody: string
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const adminForRead = createAdminClient()
  const { data: update } = await adminForRead
    .from('demand_updates')
    .select('author_user_id')
    .eq('id', updateId)
    .single()

  if (!update) return { error: 'Update not found.' }
  if (update.author_user_id !== user.id && !(await canActAsCreator(user.email))) {
    return { error: 'Only the creator can edit this update.' }
  }

  const body = newBody.trim()
  if (!body) return { error: 'Update cannot be empty.' }
  if (body.length > 2000) return { error: 'Update must be under 2000 characters.' }

  const { error } = await adminForRead
    .from('demand_updates')
    .update({ body })
    .eq('id', updateId)

  if (error) return { error: 'Failed to edit update.' }

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  return { error: null }
}

export async function deleteCreatorUpdate(
  updateId: string,
  demandId: string
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const adminForRead = createAdminClient()
  const { data: update } = await adminForRead
    .from('demand_updates')
    .select('author_user_id')
    .eq('id', updateId)
    .single()

  if (!update) return { error: 'Update not found.' }
  if (update.author_user_id !== user.id && !(await canActAsCreator(user.email))) {
    return { error: 'Only the creator can delete this update.' }
  }

  const { error } = await adminForRead
    .from('demand_updates')
    .delete()
    .eq('id', updateId)

  if (error) return { error: 'Failed to delete update.' }

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  return { error: null }
}

export async function editOfficialResponse(
  updateId: string,
  demandId: string,
  newBody: string
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const adminForRead = createAdminClient()
  const { data: update } = await adminForRead
    .from('demand_updates')
    .select('author_user_id, type')
    .eq('id', updateId)
    .single()

  if (!update || update.type !== 'official_response') return { error: 'Response not found.' }
  if (update.author_user_id !== user.id && !(await canActAsOrgRep(user.email))) {
    return { error: 'Only the organisation representative can edit this response.' }
  }

  const body = newBody.trim()
  if (!body) return { error: 'Response cannot be empty.' }
  if (body.length > 3000) return { error: 'Response must be under 3000 characters.' }

  const { error } = await adminForRead
    .from('demand_updates')
    .update({ body })
    .eq('id', updateId)

  if (error) return { error: 'Failed to edit response.' }

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  return { error: null }
}

export async function deleteOfficialResponse(
  updateId: string,
  demandId: string
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const adminForRead = createAdminClient()
  const { data: update } = await adminForRead
    .from('demand_updates')
    .select('author_user_id, type')
    .eq('id', updateId)
    .single()

  if (!update || update.type !== 'official_response') return { error: 'Response not found.' }
  if (update.author_user_id !== user.id && !(await canActAsOrgRep(user.email))) {
    return { error: 'Only the organisation representative can delete this response.' }
  }

  const { error } = await adminForRead
    .from('demand_updates')
    .delete()
    .eq('id', updateId)

  if (error) return { error: 'Failed to delete response.' }

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  return { error: null }
}

export async function addDemandLink(
  demandId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in.' }

  const adminForRead = createAdminClient()
  const { data: demand, error: demandReadError } = await adminForRead
    .from('demands')
    .select('creator_user_id, headline, organisation_id, threshold_notified_at, support_count_cache')
    .eq('id', demandId)
    .single()

  if (demandReadError || !demand) return { error: 'Demand not found.' }
  if (demand.creator_user_id !== user.id && !(await canActAsCreator(user.email))) return { error: 'Only the creator can add content.' }

  const url = (formData.get('url') as string)?.trim()
  const title = (formData.get('title') as string)?.trim()

  if (!url) return { error: 'URL is required.' }
  if (!title) return { error: 'Title is required.' }

  try {
    new URL(url)
  } catch {
    return { error: 'Please enter a valid URL.' }
  }

  const { error: insertError } = await supabase
    .from('demand_links')
    .insert({ demand_id: demandId, url, title })

  if (insertError) return { error: 'Failed to add content. Please try again.' }

  try {
    const [{ data: creatorProfile }, { data: supporters }] = await Promise.all([
      supabase.from('profiles').select('name').eq('id', user.id).maybeSingle(),
      supabase.from('supports').select('user_id').eq('demand_id', demandId),
    ])

    if (supporters && supporters.length > 0) {
      const supporterIds = new Set(supporters.map((s) => s.user_id))
      const emails = await getEmailsForUserIds(supporterIds)
      if (emails.length > 0) {
        await sendCreatorUpdateEmail({
          to: emails,
          creatorName: creatorProfile?.name ?? 'The campaign creator',
          demandHeadline: demand.headline,
          demandId,
          updateBody: null,
          hasVideo: true,
        })
      }
    }

    if (demand.threshold_notified_at) {
      const adminClient = createAdminClient()
      const [{ data: org }, { data: notifEmails }] = await Promise.all([
        supabase.from('organisations').select('name').eq('id', demand.organisation_id).single(),
        adminClient.from('organisation_notification_emails').select('email').eq('organisation_id', demand.organisation_id),
      ])
      const orgEmails = notifEmails?.map((e) => e.email) ?? []
      if (org && orgEmails.length > 0) {
        await sendOrgCreatorUpdateEmail({
          to: orgEmails,
          orgName: org.name,
          demandHeadline: demand.headline,
          demandId,
          supportCount: demand.support_count_cache ?? 0,
          updateBody: null,
          hasVideo: true,
        })
      }
    }
  } catch (emailError) {
    console.error('[addDemandLink] Email error:', emailError)
  }

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  return { error: null }
}

export async function setResolutionStatus(
  demandId: string,
  resolution: string
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const adminForRead = createAdminClient()
  const { data: demand } = await adminForRead
    .from('demands')
    .select('creator_user_id, status, headline, organisation_id, support_count_cache')
    .eq('id', demandId)
    .single()

  if (!demand) return { error: 'Campaign not found.' }
  if (demand.creator_user_id !== user.id && !(await canActAsCreator(user.email))) return { error: 'Only the campaign creator can mark the outcome.' }
  if (demand.status !== 'responded') return { error: 'The campaign must have a response before marking the outcome.' }

  const valid = ['resolved', 'unsatisfactory', 'further_questions', 'accepted', 'partially_accepted', 'rejected']
  if (!valid.includes(resolution)) return { error: 'Invalid resolution.' }

  const { error: statusError } = await adminForRead.from('demands').update({ status: resolution }).eq('id', demandId)
  if (statusError) return { error: 'Failed to update campaign status. Please try again.' }

  // Email supporters about the resolution
  try {
  if (['resolved', 'unsatisfactory', 'accepted', 'partially_accepted', 'rejected'].includes(resolution)) {
    const [{ data: creatorProfile }, { data: org }, { data: supporters }] = await Promise.all([
      supabase.from('profiles').select('name').eq('id', demand.creator_user_id).maybeSingle(),
      supabase.from('organisations').select('name').eq('id', demand.organisation_id).single(),
      supabase.from('supports').select('user_id').eq('demand_id', demandId),
    ])

    if (org && supporters && supporters.length > 0) {
      const supporterIds = new Set(supporters.map((s) => s.user_id))
      const emails = await getEmailsForUserIds(supporterIds)
      if (emails.length > 0) {
        await sendCampaignResolvedEmail({
          to: emails,
          creatorName: creatorProfile?.name ?? 'The campaign creator',
          orgName: org.name,
          demandHeadline: demand.headline,
          demandId,
          supportCount: demand.support_count_cache ?? supporters.length,
          resolution: resolution as 'resolved' | 'unsatisfactory',
        })
      }
    }
  }
  } catch (emailError) {
    console.error('[setResolutionStatus] Email error:', emailError)
  }

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  revalidateTag('demands-list', { expire: 0 })
  return { error: null }
}

export async function postOfficialResponse(
  demandId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in.' }

  const adminForRead = createAdminClient()
  const { data: demand } = await adminForRead
    .from('demands')
    .select('organisation_id, headline, support_count_cache, creator_user_id')
    .eq('id', demandId)
    .single()

  if (!demand) return { error: 'Demand not found.' }

  const { data: rep } = await supabase
    .from('org_reps')
    .select('id')
    .eq('user_id', user.id)
    .eq('organisation_id', demand.organisation_id)
    .maybeSingle()

  if (!rep && !(await canActAsOrgRep(user.email))) return { error: 'Only verified organisation representatives can post official responses.' }

  const body = (formData.get('body') as string)?.trim() || null
  const pdfFile = formData.get('pdf') as File | null
  const videoFile = formData.get('video') as File | null
  const linkUrl = (formData.get('link_url') as string)?.trim() || null
  const linkTitle = (formData.get('link_title') as string)?.trim() || null

  const hasPdf = pdfFile && pdfFile.size > 0
  const hasVideo = videoFile && videoFile.size > 0
  const hasLink = !!linkUrl

  if (!body && !hasPdf && !hasVideo && !hasLink) {
    return { error: 'Please type a response, upload a PDF, attach a video, or add a link.' }
  }

  if (hasLink) {
    try { new URL(linkUrl) } catch { return { error: 'Please enter a valid URL.' } }
  }

  if (body && body.length > 3000) return { error: 'Response must be under 3000 characters.' }

  let pdf_url: string | null = null
  let video_url: string | null = null

  if (hasPdf) {
    if (pdfFile.type !== 'application/pdf') return { error: 'Only PDF files are accepted.' }
    if (pdfFile.size > 10 * 1024 * 1024) return { error: 'PDF must be under 10MB.' }

    const filename = `${demandId}/${Date.now()}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('official-responses')
      .upload(filename, pdfFile, { contentType: 'application/pdf' })

    if (uploadError) return { error: `PDF upload failed: ${uploadError.message}` }

    const { data: { publicUrl } } = supabase.storage
      .from('official-responses')
      .getPublicUrl(filename)

    pdf_url = publicUrl
  }

  if (hasVideo) {
    if (!videoFile.type.startsWith('video/')) return { error: 'Only video files are accepted.' }
    if (videoFile.size > 100 * 1024 * 1024) return { error: 'Video must be under 100MB.' }

    const ext = videoFile.name.split('.').pop()?.toLowerCase() ?? 'mp4'
    const filename = `videos/${demandId}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('official-responses')
      .upload(filename, videoFile, { contentType: videoFile.type })

    if (uploadError) return { error: `Video upload failed: ${uploadError.message}` }

    const { data: { publicUrl } } = supabase.storage
      .from('official-responses')
      .getPublicUrl(filename)

    video_url = publicUrl
  }

  const { error: insertError } = await supabase
    .from('demand_updates')
    .insert({ demand_id: demandId, author_user_id: user.id, type: 'official_response', body: body ?? '', pdf_url, video_url, link_url: linkUrl, link_title: linkTitle })

  if (insertError) return { error: 'Failed to post response. Please try again.' }

  const adminForResponse = createAdminClient()
  const { error: statusError } = await adminForResponse.from('demands').update({ status: 'responded' }).eq('id', demandId)
  if (statusError) console.error('[postOfficialResponse] Status update failed:', statusError.message)

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  revalidateTag('demands-list', { expire: 0 })

  // Email creator and supporters — wrapped in try-catch so failures don't block
  try {
    const [{ data: org }, { data: supporters }] = await Promise.all([
      supabase.from('organisations').select('name').eq('id', demand.organisation_id).single(),
      supabase.from('supports').select('user_id').eq('demand_id', demandId),
    ])

    if (org) {
      const creatorAuth = await adminForResponse.auth.admin.getUserById(demand.creator_user_id)
      const creatorEmail = creatorAuth.data?.user?.email
      if (creatorEmail) {
        await sendCreatorResponseReceivedEmail({
          to: creatorEmail,
          orgName: org.name,
          demandHeadline: demand.headline,
          demandId,
          responseBody: body,
        })
      }

      if (supporters && supporters.length > 0) {
        const supporterIds = new Set(supporters.map((s) => s.user_id))
        const emails = await getEmailsForUserIds(supporterIds)

        if (emails.length > 0) {
          await sendResponseEmail({
            to: emails,
            orgName: org.name,
            demandHeadline: demand.headline,
            demandId,
            responseBody: body,
            hasPdf: !!pdf_url,
            supportCount: demand.support_count_cache ?? supporters.length,
          })
        }
      }
    }
  } catch (emailError) {
    console.error('[postOfficialResponse] Email error:', emailError)
  }

  return { error: null }
}

export async function notifyOrgFollowUp(demandId: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const adminForRead = createAdminClient()
  const { data: demand } = await adminForRead
    .from('demands')
    .select('creator_user_id, status, organisation_id, headline, support_count_cache')
    .eq('id', demandId)
    .single()

  if (!demand) return { error: 'Campaign not found.' }
  if (demand.creator_user_id !== user.id && !(await canActAsCreator(user.email))) return { error: 'Only the creator can notify the organisation.' }
  if (demand.status !== 'further_questions') return { error: 'No follow-up questions to send.' }

  const { data: latestQuestion } = await supabase
    .from('demand_questions')
    .select('round')
    .eq('demand_id', demandId)
    .order('round', { ascending: false })
    .limit(1)
    .maybeSingle()

  const latestRound = latestQuestion?.round ?? 2

  const adminForNotify = createAdminClient()
  const [{ data: roundQuestions }, { data: org }, { data: notifEmails }] = await Promise.all([
    supabase.from('demand_questions').select('body').eq('demand_id', demandId).eq('round', latestRound),
    supabase.from('organisations').select('name').eq('id', demand.organisation_id).single(),
    adminForNotify.from('organisation_notification_emails').select('email').eq('organisation_id', demand.organisation_id),
  ])

  const { error: statusError } = await supabase.from('demands').update({ status: 'notified' }).eq('id', demandId)
  if (statusError) console.error('[notifyOrgFollowUp] Status update failed:', statusError.message)

  const { error: notifError } = await adminForNotify.from('organisation_notifications').insert({ demand_id: demandId, sent_at: new Date().toISOString() })
  if (notifError) console.error('[notifyOrgFollowUp] Notification log failed:', notifError.message)

  try {
    const emails = notifEmails?.map((e) => e.email) ?? []
    if (org && emails.length > 0) {
      await sendFollowUpEmail({
        to: emails,
        orgName: org.name,
        demandHeadline: demand.headline,
        demandId,
        round: latestRound,
        supportCount: demand.support_count_cache ?? 0,
        questions: roundQuestions?.map((q) => q.body) ?? [],
      })
    }
  } catch (emailError) {
    console.error('[notifyOrgFollowUp] Email error:', emailError)
  }

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  revalidateTag('demands-list', { expire: 0 })
  return { error: null }
}
