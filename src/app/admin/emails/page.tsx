import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { emailRegistry, type EmailAudience } from '@/lib/email-registry'

const sections: { audience: EmailAudience; title: string; subtitle: string; tagColor: string }[] = [
  { audience: 'supporters', title: 'Supporter emails', subtitle: 'Sent to fans who support a campaign', tagColor: 'text-emerald-700 bg-emerald-50' },
  { audience: 'creators', title: 'Creator emails', subtitle: 'Sent to the person who created a campaign', tagColor: 'text-amber-700 bg-amber-50' },
  { audience: 'organisations', title: 'Organisation emails', subtitle: 'Sent to the organisation a campaign is directed at', tagColor: 'text-blue-700 bg-blue-50' },
  { audience: 'auth', title: 'Authentication emails', subtitle: 'Account verification and access (managed by Supabase)', tagColor: 'text-violet-700 bg-violet-50' },
]

export default async function AdminEmailsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')
  if (user.email !== process.env.ADMIN_EMAIL) redirect('/admin')

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-3xl space-y-8">

        <div>
          <a
            href="/admin"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors mb-3 inline-block"
          >
            &larr; Back to admin
          </a>
          <h1 className="text-3xl font-black tracking-tight text-[#064E3B]">Emails</h1>
          <p className="mt-1 text-sm text-gray-500">
            {emailRegistry.length} emails configured across {sections.length} audiences
          </p>
          <a
            href="/admin/test-emails"
            className="inline-flex items-center gap-2 mt-3 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Send test emails &rarr;
          </a>
        </div>

        {sections.map(({ audience, title, subtitle, tagColor }) => {
          const emails = emailRegistry.filter((e) => e.audience === audience)
          if (emails.length === 0) return null

          return (
            <div key={audience}>
              <div className="mb-3">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
              </div>
              <div className="space-y-3">
                {emails.map((email) => (
                  <div key={email.id} className="bg-white rounded-2xl border border-gray-200 px-6 py-5">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-bold text-[#064E3B]">{email.name}</h3>
                      <span className={`text-[10px] font-medium rounded px-1.5 py-0.5 ${tagColor}`}>
                        {email.sender === 'supabase' ? 'Supabase' : 'Resend'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed mb-3">{email.description}</p>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Trigger</dt>
                        <dd className="text-xs text-gray-600 mt-0.5">{email.trigger}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Recipients</dt>
                        <dd className="text-xs text-gray-600 mt-0.5">{email.recipients}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Source</dt>
                        <dd className="text-xs text-gray-400 font-mono mt-0.5">{email.source}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-4">
          <p className="text-xs text-gray-400 leading-relaxed">
            This page is auto-generated from <span className="font-mono">src/lib/email-registry.ts</span>.
            When emails are added or changed in the codebase, update that file to keep this page in sync.
          </p>
        </div>

      </div>
    </main>
  )
}
