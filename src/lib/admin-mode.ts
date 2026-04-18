import { cookies } from 'next/headers'

export type ViewMode = 'admin' | 'creator' | 'org_rep' | 'fan'

/**
 * Check if the current user is admin and acting in an impersonation mode.
 * Returns the view mode if admin, or null if not admin.
 */
export async function getAdminViewMode(userEmail: string | undefined): Promise<ViewMode | null> {
  if (!userEmail || userEmail !== process.env.ADMIN_EMAIL) return null

  const cookieStore = await cookies()
  return (cookieStore.get('admin_view_mode')?.value ?? 'admin') as ViewMode
}

/**
 * Check if admin should be allowed to act as creator for a demand.
 */
export async function canActAsCreator(userEmail: string | undefined): Promise<boolean> {
  const mode = await getAdminViewMode(userEmail)
  return mode === 'admin' || mode === 'creator'
}

/**
 * Check if admin should be allowed to act as org rep.
 */
export async function canActAsOrgRep(userEmail: string | undefined): Promise<boolean> {
  const mode = await getAdminViewMode(userEmail)
  return mode === 'admin' || mode === 'org_rep'
}
