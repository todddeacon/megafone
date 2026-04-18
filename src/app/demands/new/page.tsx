import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewDemandForm from './NewDemandForm'

export default async function NewDemandPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: organisations } = await supabase
    .from('organisations')
    .select('id, name, slug, type, logo_url, is_claimed')
    .neq('is_pending', true)
    .order('name')

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-[#064E3B]">Create a Campaign</h1>
          <p className="mt-2 text-sm text-gray-500">
            Ask the questions that matter. Get answers.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <NewDemandForm organisations={organisations ?? []} />
        </div>
      </div>
    </main>
  )
}
