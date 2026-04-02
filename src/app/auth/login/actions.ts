'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function signInWithProvider(formData: FormData): Promise<void> {
  const provider = formData.get('provider') as string
  if (provider !== 'google' && provider !== 'apple') redirect('/auth/login?error=invalid_provider')

  const returnTo = safeReturnTo(formData.get('returnTo') as string)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${appUrl}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`,
    },
  })

  if (error || !data.url) redirect('/auth/login?error=oauth_failed')
  redirect(data.url)
}

export type AuthState = { error: string | null }

function safeReturnTo(raw: string | null): string {
  // Only allow relative paths — prevents open redirect to external URLs
  if (!raw) return '/'
  const decoded = decodeURIComponent(raw)
  return decoded.startsWith('/') && !decoded.startsWith('//') ? decoded : '/'
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const returnTo = safeReturnTo(formData.get('returnTo') as string)

  if (!email || !password) return { error: 'Email and password are required.' }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  redirect(returnTo)
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const name = (formData.get('name') as string)?.trim()
  const nickname = (formData.get('nickname') as string)?.trim() || null
  const returnTo = safeReturnTo(formData.get('returnTo') as string)

  if (!email || !password) return { error: 'Email and password are required.' }
  if (!name) return { error: 'Your name is required.' }

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) return { error: error.message }

  if (data.user) {
    const admin = createAdminClient()
    await admin.from('profiles').insert({ id: data.user.id, name, nickname })
  }

  redirect(returnTo)
}
