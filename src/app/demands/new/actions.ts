'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkModeration, checkProfanity } from '@/lib/moderation'
import { sendOrgSuggestionPendingEmail, sendOrgSuggestionAdminEmail } from '@/lib/email'
import { REVIEWS_ENABLED } from '@/lib/feature-flags'

export type CreateDemandState = { error: string | null }

export async function createDemand(
  _prevState: CreateDemandState,
  formData: FormData
): Promise<CreateDemandState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to create a demand.' }
  }

  const rawCampaignType = formData.get('campaign_type') as string
  const campaign_type: 'review' | 'qa' | 'petition' =
    rawCampaignType === 'review' ? 'review' : rawCampaignType === 'petition' ? 'petition' : 'qa'

  if (campaign_type === 'review' && !REVIEWS_ENABLED) {
    return { error: 'Reviews are not currently available.' }
  }

  const headline = (formData.get('headline') as string)?.trim()
  let organisation_id = (formData.get('organisation_id') as string) || null
  const suggestNewOrg = formData.get('suggest_new_org') === 'true'
  const newOrgName = (formData.get('new_org_name') as string)?.trim() || null
  const newOrgContactName = (formData.get('new_org_contact_name') as string)?.trim() || null
  const newOrgContactEmail = (formData.get('new_org_contact_email') as string)?.trim() || null
  const summary = (formData.get('summary') as string)?.trim()
  const questions = campaign_type === 'qa' ? (formData.getAll('question') as string[]).filter((q) => q.trim()) : []
  const demand_text = campaign_type === 'petition' ? (formData.get('demand_text') as string)?.trim() || null : null
  const target_person = campaign_type !== 'review' ? (formData.get('target_person') as string)?.trim() || null : null
  const thresholdRaw = (formData.get('notification_threshold') as string)?.trim()
  const notification_threshold = thresholdRaw ? parseInt(thresholdRaw, 10) : null

  // Review-specific fields
  const reviewing_subject = campaign_type === 'review' ? (formData.get('reviewing_subject') as string)?.trim() || null : null
  const ratingRaw = campaign_type === 'review' ? (formData.get('rating') as string)?.trim() : null
  const rating = ratingRaw !== null && ratingRaw !== '' ? parseInt(ratingRaw, 10) : null
  const displayModeRaw = formData.get('reviewer_display_mode') as string | null
  const reviewer_display_mode: 'real_name' | 'nickname' | 'anonymous' | null =
    campaign_type === 'review'
      ? (displayModeRaw === 'anonymous' || displayModeRaw === 'nickname' ? displayModeRaw : 'real_name')
      : null

  if (!headline) return { error: 'Headline is required.' }

  if (campaign_type === 'review') {
    if (!reviewing_subject) return { error: 'What you are reviewing is required.' }
    if (!summary) return { error: 'Review text is required.' }
    if (summary.length < 50) return { error: 'Review text must be at least 50 characters.' }
    if (summary.length > 2000) return { error: 'Review text must be at most 2000 characters.' }
    if (rating === null || Number.isNaN(rating) || rating < 0 || rating > 5) {
      return { error: 'Rating must be between 0 and 5.' }
    }
  } else {
    if (!organisation_id && !suggestNewOrg) return { error: 'Target organisation is required.' }
    if (suggestNewOrg && !newOrgName) return { error: 'Organisation name is required.' }
    if (!summary) return { error: 'Summary is required.' }
    if (campaign_type === 'qa' && questions.length === 0) return { error: 'At least one question is required.' }
    if (campaign_type === 'petition' && !demand_text) return { error: 'The demand is required.' }
    if (!notification_threshold || notification_threshold < 100) return { error: 'Supporter target must be at least 100.' }
  }

  // If suggesting a new org, create it as pending
  // (reviews don't support new-org suggestion — org tag is optional)
  let isPendingOrg = false
  if (campaign_type !== 'review' && suggestNewOrg && newOrgName) {
    const admin = createAdminClient()
    const slug = newOrgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const { data: newOrg, error: orgError } = await admin
      .from('organisations')
      .insert({
        name: newOrgName,
        slug: slug + '-' + Date.now().toString(36),
        type: 'other',
        is_pending: true,
        suggested_by: user.id,
        suggested_contact_name: newOrgContactName,
        suggested_contact_email: newOrgContactEmail,
      })
      .select('id')
      .single()

    if (orgError || !newOrg) return { error: 'Failed to suggest organisation. Please try again.' }
    organisation_id = newOrg.id
    isPendingOrg = true
  }

  // Profanity check (runs first, no API call needed)
  const textToCheck = [headline, summary, reviewing_subject ?? '', demand_text ?? '', ...questions].join('\n')
  const profanityMatch = checkProfanity(textToCheck, 'campaign')
  if (profanityMatch) {
    return { error: 'Your campaign contains language that doesn\'t meet our community guidelines. Please review and resubmit.' }
  }

  // OpenAI moderation check (hate speech, threats, explicit content)
  const moderation = await checkModeration(textToCheck)

  if (moderation.action === 'block') {
    return { error: 'Your campaign contains content that doesn\'t meet our community guidelines. Please review and resubmit.' }
  }

  let moderation_status = moderation.action === 'review' ? 'pending_review' : 'approved'
  if (isPendingOrg) moderation_status = 'pending_org'

  const admin = createAdminClient()
  const initialStatus = campaign_type === 'review' ? 'live' : 'building'
  const { data: demand, error: demandError } = await admin
    .from('demands')
    .insert({
      organisation_id,
      creator_user_id: user.id,
      campaign_type,
      headline,
      summary,
      status: initialStatus,
      moderation_status,
      moderation_scores: Object.keys(moderation.scores).length > 0 ? moderation.scores : null,
      ...(notification_threshold !== null && { notification_threshold }),
      ...(target_person && { target_person }),
      ...(demand_text && { demand_text }),
      ...(reviewing_subject && { reviewing_subject }),
      ...(rating !== null && { rating }),
      ...(reviewer_display_mode && { reviewer_display_mode }),
    })
    .select('id')
    .single()

  if (demandError || !demand) {
    return { error: 'Failed to create demand. Please try again.' }
  }

  // Auto-support: creator is the first supporter (skipped for reviews — "I agree"
  // represents other fans agreeing with the review, not the reviewer themselves)
  if (campaign_type !== 'review') {
    await supabase.from('supports').insert({ demand_id: demand.id, user_id: user.id })
    await supabase.from('demands').update({ support_count_cache: 1 }).eq('id', demand.id)
  }

  if (questions.length > 0) {
    const questionRows = questions.map((body) => ({
      demand_id: demand.id,
      author_user_id: user.id,
      body,
      is_followup: false,
    }))
    await supabase.from('demand_questions').insert(questionRows)
  }

  if (campaign_type !== 'review') {
    const linkCount = parseInt((formData.get('link_count') as string) || '0', 10)
    const linkRows: { demand_id: string; url: string; title: string }[] = []

    for (let i = 0; i < linkCount; i++) {
      const url = (formData.get(`link_url_${i}`) as string)?.trim()
      const title = (formData.get(`link_title_${i}`) as string)?.trim()
      if (url && title) linkRows.push({ demand_id: demand.id, url, title })
    }

    if (linkRows.length > 0) {
      await supabase.from('demand_links').insert(linkRows)
    }
  }

  // Review media uploads: up to 5 images + 1 video
  if (campaign_type === 'review') {
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
    const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

    const imageCount = Math.min(5, parseInt((formData.get('review_image_count') as string) || '0', 10) || 0)
    const mediaRows: { demand_id: string; kind: 'image' | 'video'; url: string; storage_path: string; display_order: number }[] = []

    for (let i = 0; i < imageCount; i++) {
      const file = formData.get(`review_image_${i}`) as File | null
      if (!file || file.size === 0) continue
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) continue
      if (file.size > MAX_IMAGE_SIZE) continue

      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
      const path = `${demand.id}/${Date.now()}-${i}.${ext}`

      const { error: uploadError } = await admin.storage
        .from('review-media')
        .upload(path, file, { contentType: file.type })

      if (uploadError) {
        console.error('[createDemand] Image upload failed:', uploadError.message)
        continue
      }

      const { data: { publicUrl } } = admin.storage
        .from('review-media')
        .getPublicUrl(path)

      mediaRows.push({
        demand_id: demand.id,
        kind: 'image',
        url: publicUrl,
        storage_path: path,
        display_order: i,
      })
    }

    const videoFile = formData.get('review_video') as File | null
    if (videoFile && videoFile.size > 0) {
      if (ALLOWED_VIDEO_TYPES.includes(videoFile.type) && videoFile.size <= MAX_VIDEO_SIZE) {
        const ext = videoFile.type === 'video/webm' ? 'webm' : videoFile.type === 'video/quicktime' ? 'mov' : 'mp4'
        const path = `${demand.id}/video-${Date.now()}.${ext}`

        const { error: uploadError } = await admin.storage
          .from('review-media')
          .upload(path, videoFile, { contentType: videoFile.type })

        if (!uploadError) {
          const { data: { publicUrl } } = admin.storage
            .from('review-media')
            .getPublicUrl(path)

          mediaRows.push({
            demand_id: demand.id,
            kind: 'video',
            url: publicUrl,
            storage_path: path,
            display_order: 99,
          })
        } else {
          console.error('[createDemand] Video upload failed:', uploadError.message)
        }
      }
    }

    if (mediaRows.length > 0) {
      await admin.from('review_media').insert(mediaRows)
    }
  }

  // Send emails for pending org suggestions
  if (isPendingOrg && newOrgName) {
    try {
      // Email creator
      if (user.email) {
        await sendOrgSuggestionPendingEmail({
          to: user.email,
          orgName: newOrgName,
          demandHeadline: headline,
        })
      }

      // Email admin
      const adminEmail = process.env.ADMIN_EMAIL
      if (adminEmail) {
        const { data: creatorProfile } = await supabase.from('profiles').select('name').eq('id', user.id).maybeSingle()
        await sendOrgSuggestionAdminEmail({
          to: adminEmail,
          creatorName: creatorProfile?.name ?? user.email ?? 'A user',
          orgName: newOrgName,
          orgType: 'other',
          contactName: newOrgContactName,
          contactEmail: newOrgContactEmail,
          demandHeadline: headline,
        })
      }
    } catch (emailError) {
      console.error('[createDemand] Org suggestion email error:', emailError)
    }
  }

  redirect(`/demands/${demand.id}`)
}
