import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Check if a user's email matches any organisation notification email.
 * If so, automatically make them an org rep for that organisation.
 * Called on signup and first sign-in (OAuth, magic link).
 */
export async function autoAssignOrgRep(userId: string, email: string): Promise<void> {
  const admin = createAdminClient()

  // Find all orgs where this email is a notification contact
  const { data: matches } = await admin
    .from('organisation_notification_emails')
    .select('organisation_id')
    .eq('email', email.toLowerCase())

  if (!matches || matches.length === 0) return

  // Insert org_rep for each matching org (ignore duplicates)
  for (const match of matches) {
    // Ignore duplicate key errors (user already a rep)
    await admin
      .from('org_reps')
      .upsert(
        { user_id: userId, organisation_id: match.organisation_id },
        { onConflict: 'user_id, organisation_id', ignoreDuplicates: true }
      )
  }
}
