import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewDemandForm from './NewDemandForm'
import GoalNet from '@/components/GoalNet'

export default async function NewDemandPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const [{ data: organisations }, { data: profile }] = await Promise.all([
    supabase
      .from('organisations')
      .select('id, name, slug, type, logo_url, is_claimed')
      .neq('is_pending', true)
      .order('name'),
    supabase
      .from('profiles')
      .select('name, nickname')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Dark green header with net pattern */}
      <div className="bg-[#064E3B] pt-10 pb-16 px-4 relative">
        <GoalNet variant="full" />
        <div className="mx-auto max-w-2xl relative z-10">
          <h1 className="text-3xl font-black tracking-tight text-white">Create a Campaign</h1>
          <p className="mt-2 text-sm text-emerald-200">
            Share a review, ask questions, or demand change.
          </p>
        </div>
      </div>

      {/* Form card overlaps the header */}
      <div className="mx-auto max-w-2xl px-4 -mt-8 pb-12 relative z-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <NewDemandForm
            organisations={organisations ?? []}
            reviewerName={profile?.name ?? null}
            reviewerNickname={profile?.nickname ?? null}
          />
        </div>
      </div>
    </main>
  )
}
