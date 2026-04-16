'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type AddOrgState = { error: string | null; success?: string }

function isAdmin(email: string) {
  return email === process.env.ADMIN_EMAIL
}

export async function addOrganisation(
  prevState: AddOrgState,
  formData: FormData
): Promise<AddOrgState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdmin(user.email)) return { error: 'Access denied.' }

  const name = (formData.get('name') as string)?.trim()
  const slug = (formData.get('slug') as string)?.trim().toLowerCase()
  const type = (formData.get('type') as string)?.trim()

  if (!name) return { error: 'Name is required.' }
  if (!slug) return { error: 'Slug is required.' }

  // Validate slug format (lowercase, hyphens, no spaces)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { error: 'Slug must be lowercase letters, numbers, and hyphens only.' }
  }

  const admin = createAdminClient()
  const { error: insertError } = await admin
    .from('organisations')
    .insert({ name, slug, type: type || 'other' })

  if (insertError) {
    if (insertError.code === '23505') return { error: 'An organisation with that slug already exists.' }
    return { error: 'Failed to create organisation.' }
  }

  revalidatePath('/admin/organisations')
  revalidatePath('/admin')
  return { error: null, success: `"${name}" created successfully.` }
}
