import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const returnTo = searchParams.get('returnTo') ?? '/'
  const safe = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/'

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      // Create profile on first OAuth sign-in (email/password users are handled in signUp action)
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
    }
  }

  return NextResponse.redirect(`${origin}${safe}`)
}
