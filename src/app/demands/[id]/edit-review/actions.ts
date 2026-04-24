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

  revalidatePath(`/demands/${demandId}`)
  revalidateTag(`demand-${demandId}`, { expire: 0 })
  revalidateTag('demands-list', { expire: 0 })
  redirect(`/demands/${demandId}`)
}
