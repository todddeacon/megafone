'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { checkModeration, checkProfanity } from '@/lib/moderation'

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

  const headline = (formData.get('headline') as string)?.trim()
  const organisation_id = formData.get('organisation_id') as string
  const summary = (formData.get('summary') as string)?.trim()
  const questions = (formData.getAll('question') as string[]).filter((q) => q.trim())
  const thresholdRaw = (formData.get('notification_threshold') as string)?.trim()
  const notification_threshold = thresholdRaw ? parseInt(thresholdRaw, 10) : null

  if (!headline) return { error: 'Headline is required.' }
  if (!organisation_id) return { error: 'Target organisation is required.' }
  if (!summary) return { error: 'Summary is required.' }
  if (questions.length === 0) return { error: 'At least one question is required.' }
  if (!notification_threshold || notification_threshold < 1) return { error: 'Supporter target is required.' }

  // Profanity check (runs first, no API call needed)
  const textToCheck = [headline, summary, ...questions].join('\n')
  const profanityMatch = checkProfanity(textToCheck, 'campaign')
  if (profanityMatch) {
    return { error: 'Your campaign contains language that doesn\'t meet our community guidelines. Please review and resubmit.' }
  }

  // OpenAI moderation check (hate speech, threats, explicit content)
  const moderation = await checkModeration(textToCheck)

  if (moderation.action === 'block') {
    return { error: 'Your campaign contains content that doesn\'t meet our community guidelines. Please review and resubmit.' }
  }

  const moderation_status = moderation.action === 'review' ? 'pending_review' : 'approved'

  const { data: demand, error: demandError } = await supabase
    .from('demands')
    .insert({
      organisation_id,
      creator_user_id: user.id,
      headline,
      summary,
      status: 'building',
      moderation_status,
      moderation_scores: Object.keys(moderation.scores).length > 0 ? moderation.scores : null,
      ...(notification_threshold !== null && { notification_threshold }),
    })
    .select('id')
    .single()

  if (demandError || !demand) {
    return { error: 'Failed to create demand. Please try again.' }
  }

  // Auto-support: creator is the first supporter
  await supabase.from('supports').insert({ demand_id: demand.id, user_id: user.id })
  await supabase.from('demands').update({ support_count_cache: 1 }).eq('id', demand.id)

  const questionRows = questions.map((body) => ({
    demand_id: demand.id,
    author_user_id: user.id,
    body,
    is_followup: false,
  }))

  await supabase.from('demand_questions').insert(questionRows)

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

  redirect(`/demands/${demand.id}`)
}
