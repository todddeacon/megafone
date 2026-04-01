'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ProfileState = { error: string | null; success: boolean }

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.', success: false }

  const name = (formData.get('name') as string)?.trim()
  const nickname = (formData.get('nickname') as string)?.trim() || null

  if (!name) return { error: 'Name is required.', success: false }

  const { error } = await supabase
    .from('profiles')
    .update({ name, nickname })
    .eq('id', user.id)

  if (error) return { error: 'Failed to update profile. Please try again.', success: false }

  revalidatePath('/', 'layout')
  return { error: null, success: true }
}
