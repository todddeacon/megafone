import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import AdminToolbar from './AdminToolbar'

export default async function AdminToolbarWrapper() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || user.email !== process.env.ADMIN_EMAIL) return null

  const cookieStore = await cookies()
  const viewMode = (cookieStore.get('admin_view_mode')?.value ?? 'admin') as 'admin' | 'creator' | 'org_rep' | 'fan'

  return <AdminToolbar currentMode={viewMode} />
}
