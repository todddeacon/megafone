import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditReviewForm from './EditReviewForm'

export default async function EditReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: demand } = await supabase
    .from('demands')
    .select('id, campaign_type, headline, summary, reviewing_subject, rating, reviewer_display_mode, organisation_id, creator_user_id')
    .eq('id', id)
    .single()

  if (!demand) notFound()
  if (demand.campaign_type !== 'review') redirect(`/demands/${id}/edit`)
  if (demand.creator_user_id !== user.id) redirect(`/demands/${id}`)

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-[#064E3B]">Edit Review</h1>
          <p className="mt-2 text-sm text-gray-500">
            Update your review. It will be marked as edited so readers know the content changed.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <EditReviewForm
            demandId={id}
            initial={{
              headline: demand.headline ?? '',
              reviewing_subject: demand.reviewing_subject ?? '',
              summary: demand.summary ?? '',
              rating: demand.rating ?? null,
              reviewer_display_mode: (demand.reviewer_display_mode as 'real_name' | 'nickname' | 'anonymous') ?? 'real_name',
            }}
          />
        </div>
      </div>
    </main>
  )
}
