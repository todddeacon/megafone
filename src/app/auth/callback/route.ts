import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { autoAssignOrgRep } from '@/lib/auto-org-rep'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const returnTo = searchParams.get('returnTo') ?? '/'
  const safe = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/'

  const supabase = await createClient()

  // Handle code exchange (OAuth, PKCE magic link, email confirmation)
  if (code) {
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      // Create profile on first sign-in if one doesn't exist
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!existing) {
        const name =
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.email?.split('@')[0] ??
          'User'
        await supabase.from('profiles').insert({ id: user.id, name, nickname: null })
      }

      // Auto-assign org rep if email matches a notification contact
      if (user.email) {
        await autoAssignOrgRep(user.id, user.email)
      }
    }
  }

  // Handle token_hash verification (magic link, email OTP)
  if (token_hash && type) {
    const { data: { user }, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'magiclink' | 'email' | 'signup' | 'recovery',
    })

    if (!error && user) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!existing) {
        const name =
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.email?.split('@')[0] ??
          'User'
        await supabase.from('profiles').insert({ id: user.id, name, nickname: null })
      }

      if (user.email) {
        await autoAssignOrgRep(user.id, user.email)
      }
    }
  }

  // Handle password reset flow
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/auth/reset-password`)
  }

  return NextResponse.redirect(`${origin}${safe}`)
}
