'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { autoAssignOrgRep } from '@/lib/auto-org-rep'

export type ClaimState = { error: string | null; success?: boolean }

// Submit claim for an already signed-in user
export async function submitClaimRequest(
  prevState: ClaimState,
  formData: FormData
): Promise<ClaimState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to submit a claim.' }

  const requester_name = (formData.get('requester_name') as string)?.trim()
  const requester_role = (formData.get('requester_role') as string)?.trim()
  const organisation_id = (formData.get('organisation_id') as string) || null
  const organisation_other = (formData.get('organisation_other') as string)?.trim() || null

  if (!requester_name) return { error: 'Your name is required.' }
  if (!requester_role) return { error: 'Your role is required.' }
  if (!organisation_id && !organisation_other) return { error: 'Please select or name your club.' }

  // Verify the organisation exists if an ID was provided
  if (organisation_id) {
    const { data: org } = await supabase.from('organisations').select('id').eq('id', organisation_id).maybeSingle()
    if (!org) return { error: 'Organisation not found. Please try again.' }
  }

  const requester_email = user.email
  if (!requester_email) return { error: 'Your account does not have a verified email.' }

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

// Combined signup + claim for new users
export async function signUpAndClaim(
  prevState: ClaimState,
  formData: FormData
): Promise<ClaimState> {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const requester_name = (formData.get('requester_name') as string)?.trim()
  const requester_role = (formData.get('requester_role') as string)?.trim()
  const organisation_id = (formData.get('organisation_id') as string) || null
  const organisation_other = (formData.get('organisation_other') as string)?.trim() || null

  if (!email) return { error: 'Email is required.' }
  if (!password) return { error: 'Password is required.' }
  if (password.length < 6) return { error: 'Password must be at least 6 characters.' }
  if (!requester_name) return { error: 'Your name is required.' }
  if (!requester_role) return { error: 'Your role is required.' }
  if (!organisation_id && !organisation_other) return { error: 'Please select or name your club.' }

  if (organisation_id) {
    const { data: org } = await supabase.from('organisations').select('id').eq('id', organisation_id).maybeSingle()
    if (!org) return { error: 'Organisation not found. Please try again.' }
  }

  // Create the account
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://megafone.app'

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (signUpError) return { error: signUpError.message }

  // Create their profile
  if (data.user) {
    const admin = createAdminClient()
    await admin.from('profiles').insert({ id: data.user.id, name: requester_name, nickname: null })

    // Auto-assign org rep if email matches a notification contact
    await autoAssignOrgRep(data.user.id, email)

    // Submit the claim request
    await admin.from('claim_requests').insert({
      organisation_id,
      organisation_other,
      requester_name,
      requester_email: email,
      requester_role,
      status: 'pending',
    })
  }

  return { error: null, success: true }
}
