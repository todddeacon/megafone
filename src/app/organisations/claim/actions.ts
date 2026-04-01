'use server'

import { createClient } from '@/lib/supabase/server'

export type ClaimState = { error: string | null; success?: boolean }

export async function submitClaimRequest(
  prevState: ClaimState,
  formData: FormData
): Promise<ClaimState> {
  const supabase = await createClient()

  const requester_name = (formData.get('requester_name') as string)?.trim()
  const requester_email = (formData.get('requester_email') as string)?.trim()
  const requester_role = (formData.get('requester_role') as string)?.trim()
  const organisation_id = (formData.get('organisation_id') as string) || null
  const organisation_other = (formData.get('organisation_other') as string)?.trim() || null

  if (!requester_name) return { error: 'Your name is required.' }
  if (!requester_email) return { error: 'Your email is required.' }
  if (!requester_role) return { error: 'Your role is required.' }
  if (!organisation_id && !organisation_other) return { error: 'Please select or name your club.' }

  const { error } = await supabase.from('claim_requests').insert({
    organisation_id,
    organisation_other,
    requester_name,
    requester_email,
    requester_role,
    status: 'pending',
  })

  if (error) return { error: 'Failed to submit claim. Please try again.' }

  return { error: null, success: true }
}
