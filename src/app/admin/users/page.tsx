import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')
  if (user.email !== process.env.ADMIN_EMAIL) redirect('/admin')

  const adminClient = createAdminClient()

  // Paginate through all auth users to get emails + signup dates
  const authUsersMap = new Map<string, { email: string; created_at: string }>()
  const perPage = 1000
  let page = 1

  while (true) {
    const { data: { users: authUsers }, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error || !authUsers || authUsers.length === 0) break

    for (const u of authUsers) {
      authUsersMap.set(u.id, {
        email: u.email ?? '',
        created_at: u.created_at,
      })
    }

    if (authUsers.length < perPage) break
    page++
  }

  // Get all profiles
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, name, nickname')

  // Get support counts per user
  const { data: supportCounts } = await adminClient
    .rpc('get_user_support_counts') as { data: { user_id: string; count: number }[] | null }

  // If the RPC doesn't exist, fall back to manual count
  let supportMap = new Map<string, number>()
  if (supportCounts) {
    for (const row of supportCounts) {
      supportMap.set(row.user_id, row.count)
    }
  } else {
    const { data: supports } = await adminClient
      .from('supports')
      .select('user_id')
    if (supports) {
      for (const s of supports) {
        supportMap.set(s.user_id, (supportMap.get(s.user_id) ?? 0) + 1)
      }
    }
  }

  // Get comment counts per user
  let commentMap = new Map<string, number>()
  const { data: commentCounts } = await adminClient
    .rpc('get_user_comment_counts') as { data: { user_id: string; count: number }[] | null }

  if (commentCounts) {
    for (const row of commentCounts) {
      commentMap.set(row.user_id, row.count)
    }
  } else {
    const { data: comments } = await adminClient
      .from('comments')
      .select('user_id')
    if (comments) {
      for (const c of comments) {
        commentMap.set(c.user_id, (commentMap.get(c.user_id) ?? 0) + 1)
      }
    }
  }

  // Build unified user list
  const profileMap = new Map<string, { name: string | null; nickname: string | null }>()
  for (const p of profiles ?? []) {
    profileMap.set(p.id, { name: p.name, nickname: p.nickname })
  }

  type UserRow = {
    id: string
    name: string
    email: string
    created_at: string
    supports: number
    comments: number
  }

  const allUsers: UserRow[] = []

  for (const [id, auth] of authUsersMap) {
    const profile = profileMap.get(id)
    allUsers.push({
      id,
      name: profile?.name || profile?.nickname || 'No name',
      email: auth.email,
      created_at: auth.created_at,
      supports: supportMap.get(id) ?? 0,
      comments: commentMap.get(id) ?? 0,
    })
  }

  // Sort by most recent signup first
  allUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const totalCount = allUsers.length
  const displayLimit = 100
  const displayUsers = allUsers.slice(0, displayLimit)

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
          <h1 className="text-3xl font-black tracking-tight text-[#064E3B]">Users</h1>
          <p className="mt-1 text-sm text-gray-500">{totalCount} total</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Signed up</th>
                  <th className="px-5 py-3 font-medium text-right">Supports</th>
                  <th className="px-5 py-3 font-medium text-right">Comments</th>
                </tr>
              </thead>
              <tbody>
                {displayUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3 font-medium text-[#064E3B]">{u.name}</td>
                    <td className="px-5 py-3 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600">{u.supports}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{u.comments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalCount > displayLimit && (
            <div className="px-5 py-3 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Showing {displayLimit} of {totalCount} users (most recent first)
              </p>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
