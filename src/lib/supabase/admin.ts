import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Resolve emails for a set of user IDs by paginating through auth.users.
 * Returns only emails for IDs in the provided set.
 */
export async function getEmailsForUserIds(userIds: Set<string>): Promise<string[]> {
  if (userIds.size === 0) return []

  const adminClient = createAdminClient()
  const emails: string[] = []
  const perPage = 1000
  let page = 1
  let foundAll = false

  while (!foundAll) {
    const { data: { users }, error } = await adminClient.auth.admin.listUsers({ page, perPage })

    if (error || !users || users.length === 0) break

    for (const u of users) {
      if (userIds.has(u.id) && u.email) {
        emails.push(u.email)
      }
    }

    // Stop if we've found all the IDs we need or there are no more pages
    if (emails.length >= userIds.size || users.length < perPage) {
      foundAll = true
    } else {
      page++
    }
  }

  return emails
}

/**
 * Find a single user by email address. Paginates if needed.
 * Returns the user object or null.
 */
export async function findUserByEmail(email: string) {
  const adminClient = createAdminClient()
  const perPage = 1000
  let page = 1

  while (true) {
    const { data: { users }, error } = await adminClient.auth.admin.listUsers({ page, perPage })

    if (error || !users || users.length === 0) return null

    const found = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (found) return found

    if (users.length < perPage) return null
    page++
  }
}
