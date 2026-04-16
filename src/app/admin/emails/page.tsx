import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { emailRegistry } from '@/lib/email-registry'

export default async function AdminEmailsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')
  if (user.email !== process.env.ADMIN_EMAIL) redirect('/admin')

  const megafoneEmails = emailRegistry.filter((e) => e.sender === 'megafone')
  const supabaseEmails = emailRegistry.filter((e) => e.sender === 'supabase')

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
            {emailRegistry.length} email{emailRegistry.length !== 1 ? 's' : ''} configured &middot;
            {' '}{megafoneEmails.length} via Resend &middot; {supabaseEmails.length} via Supabase
          </p>
          <a
            href="/admin/test-emails"
            className="inline-flex items-center gap-2 mt-3 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Send test emails &rarr;
          </a>
        </div>

        {/* Megafone emails */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            App emails <span className="normal-case tracking-normal font-normal">(sent via Resend from notifications@megafone.app)</span>
          </h2>
          <div className="space-y-3">
            {megafoneEmails.map((email) => (
              <div key={email.id} className="bg-white rounded-2xl border border-gray-200 px-6 py-5">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-bold text-[#064E3B]">{email.name}</h3>
                  <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5">
                    Resend
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

        {/* Supabase auth emails */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Auth emails <span className="normal-case tracking-normal font-normal">(managed by Supabase)</span>
          </h2>
          <div className="space-y-3">
            {supabaseEmails.map((email) => (
              <div key={email.id} className="bg-white rounded-2xl border border-gray-200 px-6 py-5">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-bold text-[#064E3B]">{email.name}</h3>
                  <span className="text-[10px] font-medium text-blue-700 bg-blue-50 rounded px-1.5 py-0.5">
                    Supabase
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
