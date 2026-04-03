'use server'

import { createClient } from '@/lib/supabase/server'

export type ForgotState = { error: string | null; success: boolean }

export async function requestPasswordReset(
  _prevState: ForgotState,
  formData: FormData
): Promise<ForgotState> {
  const email = (formData.get('email') as string)?.trim()
  if (!email) return { error: 'Email is required.', success: false }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const supabase = await createClient()

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/reset-password`,
  })

  // Always return success to avoid leaking whether an email exists
  return { error: null, success: true }
}
