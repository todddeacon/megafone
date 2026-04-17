import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HealthCheckRunner from './HealthCheckRunner'

export default async function HealthCheckPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')
  if (user.email !== process.env.ADMIN_EMAIL) redirect('/admin')

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-2xl space-y-8">

        <div>
          <a
            href="/admin"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors mb-3 inline-block"
          >
            &larr; Back to admin
          </a>
          <h1 className="text-3xl font-black tracking-tight text-[#064E3B]">Health check</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tests every critical system: database, auth, RLS, caching, email config, and more.
            Creates temporary test data and cleans up afterwards.
          </p>
        </div>

        <HealthCheckRunner />

        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-4">
          <p className="text-xs text-gray-400 leading-relaxed">
            Run this before every deploy or after configuration changes.
            All test data is created and deleted within the same run.
          </p>
        </div>

      </div>
    </main>
  )
}
