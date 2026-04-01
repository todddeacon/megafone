import { createClient } from '@/lib/supabase/server'
import ClaimForm from './ClaimForm'

export const metadata = {
  title: 'Claim your organisation — Megafone',
}

export default async function ClaimPage() {
  const supabase = await createClient()

  const { data: organisations } = await supabase
    .from('organisations')
    .select('id, name, slug, type, logo_url, is_claimed')
    .order('name')

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-lg px-4 py-16">

        <div className="mb-10">
          <a
            href="/contact"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors mb-4 inline-block"
          >
            ← Back to contact
          </a>
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

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <ClaimForm organisations={organisations ?? []} />
        </div>

        <p className="mt-4 text-xs text-center text-gray-400">
          Claims are reviewed manually. You will be contacted at the email you provide.
        </p>

      </main>
    </div>
  )
}
