'use server'

import { redirect } from 'next/navigation'
import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkModeration, checkProfanity } from '@/lib/moderation'

export type UpdateReviewState = { error: string | null }

export async function updateReview(
  demandId: string,
  _prev: UpdateReviewState,
  formData: FormData
): Promise<UpdateReviewState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const admin = createAdminClient()
  const { data: demand } = await admin
    .from('demands')
    .select('id, campaign_type, creator_user_id')
    .eq('id', demandId)
    .single()

  if (!demand) return { error: 'Review not found.' }
  if (demand.campaign_type !== 'review') return { error: 'This form only edits reviews.' }
  if (demand.creator_user_id !== user.id) return { error: 'You can only edit your own reviews.' }

  const headline = (formData.get('headline') as string)?.trim()
  const reviewing_subject = (formData.get('reviewing_subject') as string)?.trim()
  const summary = (formData.get('summary') as string)?.trim()
  const ratingRaw = (formData.get('rating') as string)?.trim()
  const rating = ratingRaw ? parseInt(ratingRaw, 10) : NaN
  const displayModeRaw = (formData.get('reviewer_display_mode') as string) ?? 'real_name'
  const reviewer_display_mode: 'real_name' | 'nickname' | 'anonymous' =
    displayModeRaw === 'anonymous' || displayModeRaw === 'nickname' ? displayModeRaw : 'real_name'

  if (!headline) return { error: 'Headline is required.' }
  if (!reviewing_subject) return { error: 'What you are reviewing is required.' }
  if (!summary) return { error: 'Review text is required.' }
  if (summary.length < 50) return { error: 'Review text must be at least 50 characters.' }
  if (summary.length > 2000) return { error: 'Review text must be at most 2000 characters.' }
  if (Number.isNaN(rating) || rating < 0 || rating > 5) return { error: 'Rating must be between 0 and 5.' }

  const textToCheck = [headline, reviewing_subject, summary].join('\n')
  const profanityMatch = checkProfanity(textToCheck, 'campaign')
  if (profanityMatch) {
    return { error: 'Your edit contains language that doesn\'t meet our community guidelines.' }
  }

  const moderation = await checkModeration(textToCheck)
  if (moderation.action === 'block') {
    return { error: 'Your edit contains content that doesn\'t meet our community guidelines.' }
  }

  const { error: updateError } = await admin
    .from('demands')
    .update({
      headline,
      reviewing_subject,
      summary,
      rating,
      reviewer_display_mode,
      updated_at: new Date().toISOString(),
      moderation_status: moderation.action === 'review' ? 'pending_review' : 'approved',
    })
    .eq('id', demandId)

  if (updateError) return { error: 'Failed to save changes. Please try again.' }

  // Media sync — delete any existing media not in keptIds + keep/drop existing video + upload new files
  const keptIdsRaw = (formData.get('kept_media_ids') as string) ?? ''
  const keptIds = new Set(keptIdsRaw.split(',').map((s) => s.trim()).filter(Boolean))
  const keepExistingVideo = formData.get('keep_existing_video') === 'true'

  const { data: existingMedia } = await admin
    .from('review_media')
    .select('id, kind, storage_path')
    .eq('demand_id', demandId)

  const toDelete = (existingMedia ?? []).filter((m) => {
    if (m.kind === 'image') return !keptIds.has(m.id)
    if (m.kind === 'video') return !keepExistingVideo
    return false
  })

  if (toDelete.length > 0) {
    const paths = toDelete.map((m) => m.storage_path).filter((p): p is string => !!p)
    if (paths.length > 0) {
      await admin.storage.from('review-media').remove(paths)
    }
    await admin.from('review_media').delete().in('id', toDelete.map((m) => m.id))
  }

  // Upload new images
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

  const newImageCount = parseInt((formData.get('new_image_count') as string) || '0', 10) || 0
  const newMediaRows: { demand_id: string; kind: 'image' | 'video'; url: string; storage_path: string; display_order: number }[] = []

  for (let i = 0; i < newImageCount; i++) {
    const file = formData.get(`new_image_${i}`) as File | null
    if (!file || file.size === 0) continue
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) continue
    if (file.size > MAX_IMAGE_SIZE) continue

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${demandId}/${Date.now()}-${i}.${ext}`

    const { error: uploadError } = await admin.storage
      .from('review-media')
      .upload(path, file, { contentType: file.type })

    if (!uploadError) {
      const { data: { publicUrl } } = admin.storage.from('review-media').getPublicUrl(path)
      newMediaRows.push({
        demand_id: demandId,
        kind: 'image',
        url: publicUrl,
        storage_path: path,
        display_order: Date.now() + i,
      })
    }
  }

  const newVideoFile = formData.get('new_video') as File | null
  if (newVideoFile && newVideoFile.size > 0 && ALLOWED_VIDEO_TYPES.includes(newVideoFile.type) && newVideoFile.size <= MAX_VIDEO_SIZE) {
    const ext = newVideoFile.type === 'video/webm' ? 'webm' : newVideoFile.type === 'video/quicktime' ? 'mov' : 'mp4'
    const path = `${demandId}/video-${Date.now()}.${ext}`

    const { error: uploadError } = await admin.storage
      .from('review-media')
      .upload(path, newVideoFile, { contentType: newVideoFile.type })

    if (!uploadError) {
      const { data: { publicUrl } } = admin.storage.from('review-media').getPublicUrl(path)
      newMediaRows.push({
        demand_id: demandId,
        kind: 'video',
        url: publicUrl,
        storage_path: path,
        display_order: 99,
      })
    }
  }

  if (newMediaRows.length > 0) {
    await admin.from('review_media').insert(newMediaRows)
  }

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  revalidateTag('demands-list', { expire: 0 })
  redirect(`/demands/${demandId}`)
}
