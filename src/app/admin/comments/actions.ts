'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function isAdmin(email: string) {
  return email === process.env.ADMIN_EMAIL
}

export async function deleteCommentAsAdmin(commentId: string): Promise<{ error: string | null; success?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdmin(user.email)) return { error: 'Access denied.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) return { error: 'Failed to delete comment.' }

  revalidatePath('/admin/comments')
  return { error: null, success: 'Comment deleted.' }
}
