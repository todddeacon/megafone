import { createClient } from '@/lib/supabase/server'
import ClaimForm from './ClaimForm'

export const metadata = {
  title: 'Claim your organisation — Megafone',
}

export default async function ClaimPage({ searchParams }: { searchParams: Promise<{ org?: string }> }) {
  const supabase = await createClient()
  const { org: orgSlug } = await searchParams

  const [{ data: { user } }, { data: organisations }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('organisations')
      .select('id, name, slug, type, logo_url, is_claimed')
      .order('name'),
  ])

  // Find pre-selected org from URL param
  const preSelectedOrgId = orgSlug
    ? (organisations ?? []).find((o) => o.slug === orgSlug)?.id ?? ''
    : ''

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-lg px-4 py-16">

        <div className="mb-10">
          <p className="text-xs font-semibold text-[#F59E0B] uppercase tracking-widest mb-2">
            For organisations
          </p>
          <h1 className="text-4xl font-black tracking-tight text-[#064E3B] leading-none mb-4">
            Claim your organisation
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Once verified, you can post official responses to fan campaigns directed at your
            organisation and engage directly with your supporters.
          </p>
        </div>

        {/* What you get */}
        <div className="bg-[#064E3B]/5 rounded-2xl border border-[#064E3B]/10 p-6 mb-8">
          <p className="text-xs font-bold text-[#064E3B] uppercase tracking-widest mb-3">What you can do as a verified rep</p>
          <ul className="space-y-2">
            {[
              'Post official responses to fan campaigns',
              'Upload PDFs and videos as part of your response',
              'All supporters are notified when you respond',
              'Build trust and engagement with your fan community',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-[#064E3B] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <ClaimForm
            organisations={organisations ?? []}
            isAuthenticated={!!user}
            userEmail={user?.email ?? null}
            userName={null}
            preSelectedOrgId={preSelectedOrgId}
          />
        </div>

        <p className="mt-4 text-xs text-center text-gray-400">
          Claims are reviewed manually. You will be contacted at the email associated with your account.
        </p>

      </main>
    </div>
  )
}
