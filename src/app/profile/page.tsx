import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from './ProfileForm'

export const metadata = { title: 'Edit Profile — Megafone' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, nickname')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-lg px-4 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-[#064E3B] leading-none mb-1">
            Edit Profile
          </h1>
          <p className="text-sm text-gray-400">Update your display name and how you appear on campaigns.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          {/* Email — read only */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Email</p>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>

          <ProfileForm
            initialName={profile?.name ?? ''}
            initialNickname={profile?.nickname ?? ''}
          />
        </div>
      </main>
    </div>
  )
}
