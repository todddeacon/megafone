import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')
  if (user.email !== process.env.ADMIN_EMAIL) redirect('/admin')

  const admin = createAdminClient()

  // Get all profiles (primary source — includes demo accounts)
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, name, nickname')

  // Get auth users for emails and signup dates
  const authUsersMap = new Map<string, { email: string; created_at: string }>()
  let page = 1
  while (true) {
    const { data: { users: authUsers }, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !authUsers || authUsers.length === 0) break
    for (const u of authUsers) {
      authUsersMap.set(u.id, { email: u.email ?? '', created_at: u.created_at })
    }
    if (authUsers.length < 1000) break
    page++
  }

  // Get support counts per user
  const supportMap = new Map<string, number>()
  const { data: supports } = await admin.from('supports').select('user_id')
  for (const s of supports ?? []) {
    supportMap.set(s.user_id, (supportMap.get(s.user_id) ?? 0) + 1)
  }

  // Get comment counts per user
  const commentMap = new Map<string, number>()
  const { data: comments } = await admin.from('comments').select('user_id')
  for (const c of comments ?? []) {
    commentMap.set(c.user_id, (commentMap.get(c.user_id) ?? 0) + 1)
  }

  // Build unified user list from profiles
  type UserRow = {
    id: string
    name: string
    email: string
    created_at: string | null
    supports: number
    comments: number
    isDemo: boolean
  }

  const allUsers: UserRow[] = (profiles ?? []).map((p) => {
    const auth = authUsersMap.get(p.id)
    return {
      id: p.id,
      name: p.name || p.nickname || 'No name',
      email: auth?.email ?? '',
      created_at: auth?.created_at ?? null,
      supports: supportMap.get(p.id) ?? 0,
      comments: commentMap.get(p.id) ?? 0,
      isDemo: !auth,
    }
  })

  // Real users first (sorted by signup date), then demo accounts
  allUsers.sort((a, b) => {
    if (a.isDemo !== b.isDemo) return a.isDemo ? 1 : -1
    if (a.created_at && b.created_at) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    return 0
  })

  const totalCount = allUsers.length
  const realCount = allUsers.filter((u) => !u.isDemo).length

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
          <p className="mt-1 text-sm text-gray-500">
            {realCount} real user{realCount !== 1 ? 's' : ''}
            {totalCount > realCount && ` + ${totalCount - realCount} demo`}
          </p>
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
                {allUsers.map((u) => (
                  <tr key={u.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${u.isDemo ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3 font-medium text-[#064E3B]">
                      {u.name}
                      {u.isDemo && (
                        <span className="ml-1.5 text-[10px] font-medium text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                          demo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{u.email || '—'}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600">{u.supports}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{u.comments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  )
}
