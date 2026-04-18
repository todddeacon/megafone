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
