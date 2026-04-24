import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import AnimatedLogo from './AnimatedLogo'
import NavBarDropdown from './NavBarDropdown'

export default async function NavBar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const h = await headers()
  const returnTo = encodeURIComponent(h.get('x-pathname') ?? '/')

  const [{ data: profile }, { data: orgRep }] = user
    ? await Promise.all([
        supabase.from('profiles').select('name').eq('id', user.id).single(),
        supabase.from('org_reps').select('id').eq('user_id', user.id).limit(1).maybeSingle(),
      ])
    : [{ data: null }, { data: null }]

  const isOrgRep = !!orgRep

  return (
    <header className="sticky top-0 z-50 bg-[#064E3B] border-b border-[#065F46]">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center gap-4">
        <a href="/" className="shrink-0 flex items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <AnimatedLogo />
            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 leading-none sm:hidden">
              Fan Voice, Amplified
            </span>
          </div>
          <span className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-emerald-400 leading-none border-l border-emerald-700 pl-3">
            Fan Voice, Amplified
          </span>
        </a>
        <div className="flex items-center gap-3 ml-auto shrink-0">
          {user ? (
            <NavBarDropdown
              name={profile?.name ?? user.email ?? 'Account'}
              email={user.email ?? ''}
              isAdmin={user.email === process.env.ADMIN_EMAIL}
              isOrgRep={isOrgRep}
            />
          ) : (
            <a
              href={`/auth/login?returnTo=${returnTo}`}
              className="rounded-lg border border-[#065F46] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#065F46] transition-colors"
            >
              Sign in
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
