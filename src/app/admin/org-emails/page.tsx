import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrgEmailsTable from './OrgEmailsTable'

export interface NotificationEmail {
  id: string
  email: string
  label: string | null
  title: string | null
  source: string
  created_at: string
}

export interface OrgWithEmails {
  id: string
  name: string
  emails: NotificationEmail[]
}

export default async function OrgEmailsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')
  if (user.email !== process.env.ADMIN_EMAIL) redirect('/admin')

  const { data: orgNames } = await supabase
    .from('organisations')
    .select('id, name')
    .order('name')

  const { data: allEmails } = await supabase
    .from('organisation_notification_emails')
    .select('id, organisation_id, email, label, title, source, created_at')
    .order('created_at', { ascending: true })

  // Group emails by organisation
  const emailsByOrg = new Map<string, NotificationEmail[]>()
  for (const e of allEmails ?? []) {
    const list = emailsByOrg.get(e.organisation_id) ?? []
    list.push({ id: e.id, email: e.email, label: e.label, title: e.title, source: e.source, created_at: e.created_at })
    emailsByOrg.set(e.organisation_id, list)
  }

  const organisations: OrgWithEmails[] = (orgNames ?? []).map((o) => ({
    id: o.id,
    name: o.name as string,
    emails: emailsByOrg.get(o.id) ?? [],
  }))

  const withEmail = organisations.filter((o) => o.emails.length > 0).length
  const totalEmails = (allEmails ?? []).length

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-3xl space-y-8">

        <div>
          <a
            href="/admin"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors mb-3 inline-block"
          >
            ← Back to admin
          </a>
          <h1 className="text-3xl font-black tracking-tight text-[#064E3B]">
            Organisation contact emails
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {withEmail} club{withEmail !== 1 ? 's' : ''} · {totalEmails} email{totalEmails !== 1 ? 's' : ''} total
          </p>
        </div>

        <OrgEmailsTable organisations={organisations} />

      </div>
    </main>
  )
}
