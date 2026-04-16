'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, findUserByEmail } from '@/lib/supabase/admin'

export type AdminActionState = { error: string | null; success?: string }

function isAdmin(email: string) {
  return email === process.env.ADMIN_EMAIL
}

export async function markOrgRep(
  prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdmin(user.email)) return { error: 'Access denied.' }

  const email = (formData.get('user_email') as string)?.trim().toLowerCase()
  const organisation_id = formData.get('organisation_id') as string

  if (!email) return { error: 'User email is required.' }
  if (!organisation_id) return { error: 'Organisation is required.' }

  const targetUser = await findUserByEmail(email)
  if (!targetUser) return { error: `No account found with email: ${email}` }

  const admin = createAdminClient()
  const { error: insertError } = await admin
    .from('org_reps')
    .insert({ user_id: targetUser.id, organisation_id })

  if (insertError) {
    if (insertError.code === '23505') return { error: 'This user is already a rep for that organisation.' }
    return { error: 'Failed to mark as representative.' }
  }

  return { error: null, success: `${email} is now a verified representative.` }
}

export async function approveClaimRequest(claimId: string): Promise<AdminActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdmin(user.email)) return { error: 'Access denied.' }

  const admin = createAdminClient()

  const { data: claim } = await admin
    .from('claim_requests')
    .select('organisation_id, requester_name, requester_email, status')
    .eq('id', claimId)
    .single()

  if (!claim) return { error: 'Claim not found.' }
  if (claim.status !== 'pending') return { error: 'This claim has already been reviewed.' }

  if (claim.organisation_id) {
    const targetUser = await findUserByEmail(claim.requester_email)
    if (!targetUser) return { error: `No account found for ${claim.requester_email}. They must sign up first.` }
    if (!targetUser.email_confirmed_at) return { error: `${claim.requester_email} has not verified their email yet.` }

    const { error: repError } = await admin
      .from('org_reps')
      .insert({ user_id: targetUser.id, organisation_id: claim.organisation_id })

    if (repError && repError.code !== '23505') return { error: 'Failed to create representative.' }

    await admin.from('organisations').update({ is_claimed: true }).eq('id', claim.organisation_id)
  }

  await admin.from('claim_requests').update({ status: 'approved' }).eq('id', claimId)

  revalidatePath('/admin')
  revalidatePath('/admin/org-emails')
  return { error: null, success: 'Claim approved.' }
}

export async function rejectClaimRequest(claimId: string): Promise<AdminActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdmin(user.email)) return { error: 'Access denied.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('claim_requests')
    .update({ status: 'rejected' })
    .eq('id', claimId)

  if (error) return { error: 'Failed to reject claim.' }

  revalidatePath('/admin')
  return { error: null, success: 'Claim rejected.' }
}

export async function addOrgNotificationEmail(
  prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdmin(user.email)) return { error: 'Access denied.' }

  const organisation_id = formData.get('organisation_id') as string
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const label = (formData.get('label') as string)?.trim() || null
  const title = (formData.get('title') as string)?.trim() || null

  if (!organisation_id) return { error: 'Organisation is required.' }
  if (!email) return { error: 'Email is required.' }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return { error: 'Please enter a valid email address.' }

  const admin = createAdminClient()
  const { error: insertError } = await admin
    .from('organisation_notification_emails')
    .insert({ organisation_id, email, label, title, source: 'manual' })

  if (insertError) {
    if (insertError.code === '23505') return { error: 'That email is already on the list for this organisation.' }
    return { error: 'Failed to add email.' }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/org-emails')
  return { error: null, success: 'Email added.' }
}

export async function removeOrgNotificationEmail(emailId: string): Promise<AdminActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdmin(user.email)) return { error: 'Access denied.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('organisation_notification_emails')
    .delete()
    .eq('id', emailId)

  if (error) return { error: 'Failed to remove email.' }

  revalidatePath('/admin/org-emails')
  return { error: null, success: 'Email removed.' }
}

export async function approveCampaign(demandId: string): Promise<AdminActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdmin(user.email)) return { error: 'Access denied.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('demands')
    .update({ moderation_status: 'approved' })
    .eq('id', demandId)

  if (error) return { error: 'Failed to approve campaign.' }

  revalidatePath('/admin/campaigns')
  return { error: null, success: 'Campaign approved.' }
}

export async function removeCampaign(demandId: string): Promise<AdminActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdmin(user.email)) return { error: 'Access denied.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('demands')
    .update({ moderation_status: 'removed' })
    .eq('id', demandId)

  if (error) return { error: 'Failed to remove campaign.' }

  revalidatePath('/admin/campaigns')
  return { error: null, success: 'Campaign removed.' }
}

export async function deleteCampaignAsAdmin(demandId: string): Promise<AdminActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdmin(user.email)) return { error: 'Access denied.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('demands')
    .delete()
    .eq('id', demandId)

  if (error) return { error: 'Failed to delete campaign.' }

  revalidatePath('/admin/campaigns')
  return { error: null, success: 'Campaign deleted.' }
}

export async function logNotification(
  prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdmin(user.email)) return { error: 'Access denied.' }

  const admin = createAdminClient()

  const demand_id = (formData.get('demand_id') as string)?.trim()
  if (!demand_id) return { error: 'Demand ID is required.' }

  const { data: demand } = await admin
    .from('demands')
    .select('id, status')
    .eq('id', demand_id)
    .single()

  if (!demand) return { error: 'Demand not found. Check the ID and try again.' }

  const { error: insertError } = await admin
    .from('organisation_notifications')
    .insert({ demand_id })

  if (insertError) return { error: 'Failed to log notification.' }

  if (['building', 'live'].includes(demand.status)) {
    await admin.from('demands').update({ status: 'notified' }).eq('id', demand_id)
  }

  revalidatePath(`/demands/${demand_id}`)
  return { error: null, success: 'Notification logged successfully.' }
}
