'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canActAsCreator } from '@/lib/admin-mode'
import { checkModeration, checkProfanity } from '@/lib/moderation'

export type EditDemandState = { error: string | null }

export async function updateDemand(
  demandId: string,
  _prevState: EditDemandState,
  formData: FormData
): Promise<EditDemandState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const admin = createAdminClient()
  const { data: demand } = await admin
    .from('demands')
    .select('creator_user_id')
    .eq('id', demandId)
    .single()

  if (!demand) return { error: 'Megafone not found.' }
  if (demand.creator_user_id !== user.id && !(await canActAsCreator(user.email))) return { error: 'Only the creator can edit this Megafone.' }

  const headline = (formData.get('headline') as string)?.trim()
  const organisation_id = formData.get('organisation_id') as string
  const summary = (formData.get('summary') as string)?.trim()
  const questions = (formData.getAll('question') as string[]).filter((q) => q.trim())
  const target_person = (formData.get('target_person') as string)?.trim() || null
  const thresholdRaw = (formData.get('notification_threshold') as string)?.trim()
  const notification_threshold = thresholdRaw ? parseInt(thresholdRaw, 10) : null

  if (!headline) return { error: 'Headline is required.' }
  if (!organisation_id) return { error: 'Target organisation is required.' }
  if (!summary) return { error: 'Summary is required.' }
  if (questions.length === 0) return { error: 'At least one question is required.' }
  if (!notification_threshold || notification_threshold < 100) return { error: 'Supporter target must be at least 100.' }

  // Content moderation
  const textToCheck = `${headline}\n${summary}\n${questions.join('\n')}`
  const profanityMatch = checkProfanity(textToCheck, 'campaign')
  if (profanityMatch) {
    return { error: 'Your campaign contains language that doesn\'t meet our community guidelines.' }
  }

  const moderation = await checkModeration(textToCheck)
  if (moderation.action === 'block') {
    return { error: 'Your campaign contains content that doesn\'t meet our community guidelines.' }
  }

  // Update the demand
  const { error: updateError } = await supabase
    .from('demands')
    .update({ headline, organisation_id, summary, notification_threshold, target_person })
    .eq('id', demandId)

  if (updateError) return { error: 'Failed to update. Please try again.' }

  // Replace initial questions: delete existing non-followup, reinsert
  await supabase
    .from('demand_questions')
    .delete()
    .eq('demand_id', demandId)
    .eq('is_followup', false)

  const questionRows = questions.map((body) => ({
    demand_id: demandId,
    author_user_id: user.id,
    body,
    is_followup: false,
  }))
  await supabase.from('demand_questions').insert(questionRows)

  // Handle links: delete all existing, reinsert
  await supabase.from('demand_links').delete().eq('demand_id', demandId)

  const linkCount = parseInt((formData.get('link_count') as string) || '0', 10)
  const linkRows: { demand_id: string; url: string; title: string }[] = []

  for (let i = 0; i < linkCount; i++) {
    const url = (formData.get(`link_url_${i}`) as string)?.trim()
    const title = (formData.get(`link_title_${i}`) as string)?.trim()
    if (url && title) linkRows.push({ demand_id: demandId, url, title })
  }

  if (linkRows.length > 0) {
    await supabase.from('demand_links').insert(linkRows)
  }

  revalidatePath(`/demands/${demandId}`)
  redirect(`/demands/${demandId}`)
}

export async function deleteDemand(demandId: string): Promise<{ error: string } | never> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const adminForRead = createAdminClient()
  const { data: demand } = await adminForRead
    .from('demands')
    .select('creator_user_id')
    .eq('id', demandId)
    .single()

  if (!demand) return { error: 'Campaign not found.' }
  if (demand.creator_user_id !== user.id && !(await canActAsCreator(user.email))) return { error: 'Only the creator can delete this campaign.' }

  const { error: deleteError } = await supabase
    .from('demands')
    .delete()
    .eq('id', demandId)

  if (deleteError) return { error: 'Failed to delete. Please try again.' }

  redirect('/')
}
