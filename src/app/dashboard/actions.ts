'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type DashboardActionState = { error: string | null; success?: string }

export async function updateOrgProfile(
  orgId: string,
  prevState: DashboardActionState,
  formData: FormData
): Promise<DashboardActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in.' }

  const isAdmin = user.email === process.env.ADMIN_EMAIL

  if (!isAdmin) {
    const { data: rep } = await supabase
      .from('org_reps')
      .select('id')
      .eq('user_id', user.id)
      .eq('organisation_id', orgId)
      .maybeSingle()

    if (!rep) return { error: 'You are not a verified representative of this organisation.' }
  }

  const description = (formData.get('description') as string)?.trim() || null

  if (description && description.length > 1000) {
    return { error: 'Description must be under 1000 characters.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('organisations')
    .update({ description })
    .eq('id', orgId)

  if (error) return { error: 'Failed to update profile. Please try again.' }

  revalidatePath('/dashboard')
  revalidatePath(`/organisations/${orgId}`)
  return { error: null, success: 'Profile updated.' }
}

export async function uploadOrgLogo(
  orgId: string,
  prevState: DashboardActionState,
  formData: FormData
): Promise<DashboardActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in.' }

  const isAdmin = user.email === process.env.ADMIN_EMAIL
  if (!isAdmin) {
    const { data: rep } = await supabase
      .from('org_reps')
      .select('id')
      .eq('user_id', user.id)
      .eq('organisation_id', orgId)
      .maybeSingle()
    if (!rep) return { error: 'You are not a verified representative of this organisation.' }
  }

  const file = formData.get('logo') as File | null
  if (!file || file.size === 0) return { error: 'Please select an image.' }
  if (!file.type.startsWith('image/')) return { error: 'Only image files are accepted.' }
  if (file.size > 2 * 1024 * 1024) return { error: 'Image must be under 2MB.' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const filename = `logos/${orgId}.${ext}`

  const admin = createAdminClient()

  // Upload to Supabase Storage
  const { error: uploadError } = await admin.storage
    .from('official-responses')
    .upload(filename, file, { contentType: file.type, upsert: true })

  if (uploadError) return { error: `Upload failed: ${uploadError.message}` }

  const { data: { publicUrl } } = admin.storage
    .from('official-responses')
    .getPublicUrl(filename)

  // Update the org record
  const { error: updateError } = await admin
    .from('organisations')
    .update({ logo_url: publicUrl })
    .eq('id', orgId)

  if (updateError) return { error: 'Failed to save logo.' }

  revalidatePath('/dashboard')
  revalidatePath('/')
  return { error: null, success: 'Logo uploaded.' }
}

async function verifyOrgRep(userId: string, orgId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  if (user.email === process.env.ADMIN_EMAIL) return true
  const { data: rep } = await supabase
    .from('org_reps')
    .select('id')
    .eq('user_id', user.id)
    .eq('organisation_id', orgId)
    .maybeSingle()
  return !!rep
}

export async function addTeamMember(
  orgId: string,
  prevState: DashboardActionState,
  formData: FormData
): Promise<DashboardActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  if (!(await verifyOrgRep(user.id, orgId))) {
    return { error: 'You are not a verified representative of this organisation.' }
  }

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const name = (formData.get('name') as string)?.trim() || null
  const title = (formData.get('title') as string)?.trim() || null

  if (!email) return { error: 'Email is required.' }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return { error: 'Please enter a valid email address.' }

  const admin = createAdminClient()

  // Add to notification emails
  const { error: emailError } = await admin
    .from('organisation_notification_emails')
    .upsert(
      { organisation_id: orgId, email, label: name, title, source: 'org_rep' },
      { onConflict: 'organisation_id, email', ignoreDuplicates: false }
    )

  if (emailError) {
    return { error: 'Failed to add team member.' }
  }

  // If this email already has an account, auto-assign as org rep
  const { data: { users } } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const existingUser = users?.find((u) => u.email?.toLowerCase() === email)
  if (existingUser) {
    await admin
      .from('org_reps')
      .upsert(
        { user_id: existingUser.id, organisation_id: orgId },
        { onConflict: 'user_id, organisation_id', ignoreDuplicates: true }
      )
  }

  revalidatePath('/dashboard')
  return { error: null, success: `${name || email} added to the team.` }
}

export async function removeTeamEmail(
  orgId: string,
  emailId: string
): Promise<DashboardActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  if (!(await verifyOrgRep(user.id, orgId))) {
    return { error: 'You are not a verified representative of this organisation.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('organisation_notification_emails')
    .delete()
    .eq('id', emailId)

  if (error) return { error: 'Failed to remove team member.' }

  revalidatePath('/dashboard')
  return { error: null, success: 'Team member removed.' }
}

export async function removeOrgRep(
  orgId: string,
  repId: string
): Promise<DashboardActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  if (!(await verifyOrgRep(user.id, orgId))) {
    return { error: 'You are not a verified representative of this organisation.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('org_reps')
    .delete()
    .eq('id', repId)

  if (error) return { error: 'Failed to remove representative.' }

  revalidatePath('/dashboard')
  return { error: null, success: 'Representative removed.' }
}
