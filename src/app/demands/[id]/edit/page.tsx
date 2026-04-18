import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditDemandForm from './EditDemandForm'

export default async function EditDemandPage({ params }: PageProps<'/demands/[id]/edit'>) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: demand }, { data: organisations }] = await Promise.all([
    supabase
      .from('demands')
      .select(`
        id, headline, summary, organisation_id, creator_user_id, notification_threshold, target_person,
        questions:demand_questions(id, body, is_followup),
        links:demand_links(id, url, title)
      `)
      .eq('id', id)
      .single(),
    supabase.from('organisations').select('id, name, slug, type, logo_url, is_claimed').order('name'),
  ])

  if (!demand) notFound()
  if (demand.creator_user_id !== user.id) redirect(`/demands/${id}`)

  const initialQuestions = (demand.questions ?? [])
    .filter((q: { is_followup: boolean }) => !q.is_followup)
    .sort((a: { id: string }, b: { id: string }) => a.id > b.id ? 1 : -1)

  const links = (demand.links ?? []).map((l: { url: string; title: string }) => ({
    url: l.url,
    title: l.title,
  }))

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-[#064E3B]">Edit Campaign</h1>
          <p className="mt-2 text-sm text-gray-500">Update the details of your Campaign.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <EditDemandForm
            demandId={id}
            organisations={organisations ?? []}
            initial={{
              headline: demand.headline,
              organisation_id: demand.organisation_id,
              summary: demand.summary,
              notification_threshold: demand.notification_threshold ?? null,
              target_person: demand.target_person ?? null,
              questions: initialQuestions,
              links,
            }}
          />
        </div>
      </div>
    </main>
  )
}
