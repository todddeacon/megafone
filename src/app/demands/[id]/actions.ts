'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendThresholdEmail, sendResponseEmail, sendFollowUpEmail } from '@/lib/email'
import { checkModeration, checkProfanity } from '@/lib/moderation'
import { createAdminClient } from '@/lib/supabase/admin'

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

  const { count } = await supabase
    .from('supports')
    .select('*', { count: 'exact', head: true })
    .eq('demand_id', demandId)

  const newCount = count ?? 0

  await supabase
    .from('demands')
    .update({ support_count_cache: newCount })
    .eq('id', demandId)

  // Check whether this support just crossed the notification threshold
  const { data: demand } = await supabase
    .from('demands')
    .select('notification_threshold, threshold_notified_at, headline, summary, organisation_id, status')
    .eq('id', demandId)
    .single()

  // Auto-transition building → live on first supporter
  if (newCount === 1 && demand?.status === 'building') {
    await supabase.from('demands').update({ status: 'live' }).eq('id', demandId)
  }

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
      supabase
        .from('organisation_notification_emails')
        .select('email')
        .eq('organisation_id', demand.organisation_id),
    ])

    const emails = notifEmails?.map((e) => e.email) ?? []

    if (org && emails.length > 0) {
      // Atomically claim the notification slot — only one concurrent request will get rows: 1
      const { data: claimed } = await supabase
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
      }
    }
  }

  revalidatePath(`/demands/${demandId}`)
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
    .select('creator_user_id')
    .eq('id', demandId)
    .single()

  if (!demand) return { error: 'Demand not found.' }
  if (demand.creator_user_id !== user.id) return { error: 'Only the creator can post updates.' }

  const body = (formData.get('body') as string)?.trim()
  if (!body) return { error: 'Update cannot be empty.' }
  if (body.length > 2000) return { error: 'Update must be under 2000 characters.' }

  const { error: insertError } = await supabase
    .from('demand_updates')
    .insert({ demand_id: demandId, author_user_id: user.id, type: 'update', body })

  if (insertError) return { error: 'Failed to post update. Please try again.' }

  revalidatePath(`/demands/${demandId}`)
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
    .select('creator_user_id')
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

  revalidatePath(`/demands/${demandId}`)
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
    .select('creator_user_id, status')
    .eq('id', demandId)
    .single()

  if (!demand) return { error: 'Campaign not found.' }
  if (demand.creator_user_id !== user.id) return { error: 'Only the campaign creator can mark the outcome.' }
  if (demand.status !== 'responded') return { error: 'The campaign must have a response before marking the outcome.' }

  const valid = ['resolved', 'unsatisfactory', 'further_questions']
  if (!valid.includes(resolution)) return { error: 'Invalid resolution.' }

  await supabase.from('demands').update({ status: resolution }).eq('id', demandId)

  revalidatePath(`/demands/${demandId}`)
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
    .select('organisation_id, headline, support_count_cache')
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

  await supabase.from('demands').update({ status: 'responded' }).eq('id', demandId)

  revalidatePath(`/demands/${demandId}`)

  // Email all supporters — fetch their IDs then resolve emails via admin client
  const [{ data: org }, { data: supporters }] = await Promise.all([
    supabase.from('organisations').select('name').eq('id', demand.organisation_id).single(),
    supabase.from('supports').select('user_id').eq('demand_id', demandId),
  ])

  if (org && supporters && supporters.length > 0) {
    const adminClient = createAdminClient()
    const { data: { users } } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })

    const supporterIds = new Set(supporters.map((s) => s.user_id))
    const emails = users
      .filter((u) => supporterIds.has(u.id) && u.email)
      .map((u) => u.email!)

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

  const [{ data: roundQuestions }, { data: org }, { data: notifEmails }] = await Promise.all([
    supabase.from('demand_questions').select('body').eq('demand_id', demandId).eq('round', latestRound),
    supabase.from('organisations').select('name').eq('id', demand.organisation_id).single(),
    supabase.from('organisation_notification_emails').select('email').eq('organisation_id', demand.organisation_id),
  ])

  await supabase.from('demands').update({ status: 'notified' }).eq('id', demandId)
  await supabase.from('organisation_notifications').insert({ demand_id: demandId, sent_at: new Date().toISOString() })

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
  return { error: null }
}
