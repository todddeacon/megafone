import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import DeleteCommentButton from './DeleteCommentButton'

function timeAgo(dateString: string) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default async function AdminCommentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')
  if (user.email !== process.env.ADMIN_EMAIL) redirect('/admin')

  const admin = createAdminClient()

  const [{ count: totalCount }, { data: comments }] = await Promise.all([
    admin.from('comments').select('*', { count: 'exact', head: true }),
    admin
      .from('comments')
      .select(`
        id,
        body,
        created_at,
        demand_id,
        profile:profiles(name, nickname),
        demand:demands(headline)
      `)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const rows = (comments ?? []).map((c) => ({
    id: c.id as string,
    body: c.body as string,
    created_at: c.created_at as string,
    demand_id: c.demand_id as string,
    authorName:
      (Array.isArray(c.profile) ? c.profile[0] : c.profile)?.nickname ??
      (Array.isArray(c.profile) ? c.profile[0] : c.profile)?.name ??
      'Unknown',
    demandHeadline:
      (Array.isArray(c.demand) ? c.demand[0] : c.demand)?.headline ?? 'Unknown campaign',
  }))

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-4xl space-y-8">

        <div>
          <a
            href="/admin"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors mb-3 inline-block"
          >
            &larr; Back to admin
          </a>
          <h1 className="text-3xl font-black tracking-tight text-[#064E3B]">Comments</h1>
          <p className="mt-1 text-sm text-gray-500">
            {(totalCount ?? 0).toLocaleString()} total &middot; showing latest 100
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-10 text-center">
            <p className="text-sm text-gray-400">No comments yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((comment) => (
              <div
                key={comment.id}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {/* Comment body — truncated, full on hover */}
                    <p
                      className="text-sm text-gray-800 line-clamp-3 cursor-default"
                      title={comment.body}
                    >
                      {comment.body.length > 200
                        ? comment.body.slice(0, 200) + '...'
                        : comment.body}
                    </p>

                    {/* Meta row */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                      <span className="font-medium text-gray-500">{comment.authorName}</span>
                      <span>&middot;</span>
                      <a
                        href={`/demands/${comment.demand_id}`}
                        className="text-[#064E3B] hover:underline truncate max-w-[280px]"
                        title={comment.demandHeadline}
                      >
                        {comment.demandHeadline}
                      </a>
                      <span>&middot;</span>
                      <span>{timeAgo(comment.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <DeleteCommentButton commentId={comment.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
