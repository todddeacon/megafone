'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendThresholdEmail, sendResponseEmail, sendFollowUpEmail, sendWelcomeSupporterEmail, sendCampaignSentEmail, sendCampaignResolvedEmail, sendCreatorUpdateEmail, sendCreatorFirstSupporterEmail, sendCreatorMilestoneEmail, sendCreatorTargetReachedEmail, sendCreatorResponseReceivedEmail } from '@/lib/email'
import { checkModeration, checkProfanity } from '@/lib/moderation'
import { createAdminClient, getEmailsForUserIds } from '@/lib/supabase/admin'

export type ActionState = { error: string | null }

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
    await admin.from('demands').update({ status: 'live' }).eq('id', demandId)
  }

  // Send welcome supporter email + creator notifications
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
        .select('name')
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
          demandHeadline: demand.headline,
          demandId,
          supportCount: newCount,
          threshold: demand.notification_threshold,
          summary: demand.summary ?? '',
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

  await supabase.from('comments').delete().eq('id', commentId)
  revalidatePath(`/demands/${comment.demand_id}`)
  revalidateTag(`demand-${comment.demand_id}`, { expire: 0 })
  return { error: null }
}

export async function addFollowUpQuestion(
  demandId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in.' }

  const { data: demand } = await supabase
    .from('demands')
    .select('creator_user_id, status')
    .eq('id', demandId)
    .single()

  if (!demand) return { error: 'Demand not found.' }
  if (demand.creator_user_id !== user.id) return { error: 'Only the creator can add follow-up questions.' }

  const body = (formData.get('body') as string)?.trim()
  if (!body) return { error: 'Question cannot be empty.' }

  const profanityMatch = checkProfanity(body, 'campaign')
  if (profanityMatch) {
    return { error: 'Your question contains language that doesn\'t meet our community guidelines.' }
  }

  const moderation = await checkModeration(body)
  if (moderation.action !== 'approve') {
    return { error: 'Your question contains content that doesn\'t meet our community guidelines.' }
  }

  // Round = number of official responses so far + 1
  const { count: responseCount } = await supabase
    .from('demand_updates')
    .select('*', { count: 'exact', head: true })
    .eq('demand_id', demandId)
    .eq('type', 'official_response')

  const round = (responseCount ?? 0) + 1

  const { error: insertError } = await supabase
    .from('demand_questions')
    .insert({ demand_id: demandId, author_user_id: user.id, body, is_followup: true, round })

  if (insertError) return { error: 'Failed to add follow-up question. Please try again.' }

  if (demand.status === 'responded') {
    await supabase.from('demands').update({ status: 'further_questions' }).eq('id', demandId)
  }

  await supabase
    .from('demand_updates')
    .insert({ demand_id: demandId, author_user_id: user.id, type: 'followup_question', body })

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  revalidateTag('demands-list', { expire: 0 })
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

  const { data: demand } = await supabase
    .from('demands')
    .select('creator_user_id, headline')
    .eq('id', demandId)
    .single()

  if (!demand) return { error: 'Demand not found.' }
  if (demand.creator_user_id !== user.id) return { error: 'Only the creator can post updates.' }

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

  // Email all supporters about the update
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

  const { data: demand } = await supabase
    .from('demands')
    .select('creator_user_id, headline')
    .eq('id', demandId)
    .single()

  if (!demand) return { error: 'Demand not found.' }
  if (demand.creator_user_id !== user.id) return { error: 'Only the creator can add content.' }

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

  // Email supporters about new content
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

  const { data: demand } = await supabase
    .from('demands')
    .select('creator_user_id, status, headline, organisation_id, support_count_cache')
    .eq('id', demandId)
    .single()

  if (!demand) return { error: 'Campaign not found.' }
  if (demand.creator_user_id !== user.id) return { error: 'Only the campaign creator can mark the outcome.' }
  if (demand.status !== 'responded') return { error: 'The campaign must have a response before marking the outcome.' }

  const valid = ['resolved', 'unsatisfactory', 'further_questions']
  if (!valid.includes(resolution)) return { error: 'Invalid resolution.' }

  await supabase.from('demands').update({ status: resolution }).eq('id', demandId)

  // Email supporters about the resolution (resolved or unsatisfactory only)
  if (resolution === 'resolved' || resolution === 'unsatisfactory') {
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

  const { data: demand } = await supabase
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

  if (!rep) return { error: 'Only verified organisation representatives can post official responses.' }

  const body = (formData.get('body') as string)?.trim() || null
  const pdfFile = formData.get('pdf') as File | null
  const videoFile = formData.get('video') as File | null

  const hasPdf = pdfFile && pdfFile.size > 0
  const hasVideo = videoFile && videoFile.size > 0

  if (!body && !hasPdf && !hasVideo) {
    return { error: 'Please type a response, upload a PDF, or attach a video.' }
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
    .insert({ demand_id: demandId, author_user_id: user.id, type: 'official_response', body: body ?? '', pdf_url, video_url })

  if (insertError) return { error: 'Failed to post response. Please try again.' }

  const adminForResponse = createAdminClient()
  await adminForResponse.from('demands').update({ status: 'responded' }).eq('id', demandId)

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  revalidateTag('demands-list', { expire: 0 })

  // Email all supporters — fetch their IDs then resolve emails via admin client
  const [{ data: org }, { data: supporters }] = await Promise.all([
    supabase.from('organisations').select('name').eq('id', demand.organisation_id).single(),
    supabase.from('supports').select('user_id').eq('demand_id', demandId),
  ])

  if (org) {
    // Email creator about the response
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

    // Email all supporters
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

  return { error: null }
}

export async function notifyOrgFollowUp(demandId: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const { data: demand } = await supabase
    .from('demands')
    .select('creator_user_id, status, organisation_id, headline, support_count_cache')
    .eq('id', demandId)
    .single()

  if (!demand) return { error: 'Campaign not found.' }
  if (demand.creator_user_id !== user.id) return { error: 'Only the creator can notify the organisation.' }
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

  await supabase.from('demands').update({ status: 'notified' }).eq('id', demandId)
  await adminForNotify.from('organisation_notifications').insert({ demand_id: demandId, sent_at: new Date().toISOString() })

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

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  revalidateTag('demands-list', { expire: 0 })
  return { error: null }
}
