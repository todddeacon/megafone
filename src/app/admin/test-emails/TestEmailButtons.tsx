'use client'

import { useState } from 'react'
import { sendTestEmail } from './actions'

interface EmailItem {
  id: string
  name: string
  description: string
  tag: string
}

const sections: { title: string; emails: EmailItem[] }[] = [
  {
    title: 'Supporter emails',
    emails: [
      { id: 'welcome-supporter', name: 'Welcome supporter', description: 'Sent when someone supports a campaign', tag: 'new' },
      { id: 'campaign-sent', name: 'Campaign sent to org', description: 'Sent to supporters when threshold reached', tag: 'new' },
      { id: 'response', name: 'Official response', description: 'Sent to supporters when org responds', tag: 'existing' },
      { id: 'campaign-resolved', name: 'Campaign resolved', description: 'Sent to supporters when marked resolved', tag: 'new' },
      { id: 'campaign-unsatisfactory', name: 'Campaign unsatisfactory', description: 'Sent to supporters when marked unsatisfactory', tag: 'new' },
      { id: 'creator-update', name: 'Creator update (text)', description: 'Sent to supporters when creator posts text update', tag: 'new' },
      { id: 'creator-video', name: 'Creator update (video)', description: 'Sent to supporters when creator adds content', tag: 'new' },
    ],
  },
  {
    title: 'Creator emails',
    emails: [
      { id: 'creator-first-supporter', name: 'First supporter', description: 'Sent to creator when first person supports', tag: 'new' },
      { id: 'creator-milestone', name: 'Milestone 50%', description: 'Sent to creator at 25%, 50%, 75% of target', tag: 'new' },
      { id: 'creator-target-reached', name: 'Target reached', description: 'Sent to creator when campaign sent to org', tag: 'new' },
      { id: 'creator-response', name: 'Response received', description: 'Sent to creator when org responds', tag: 'new' },
      { id: 'creator-weekly-digest', name: 'Weekly digest', description: 'Weekly summary of campaign activity', tag: 'new' },
    ],
  },
  {
    title: 'Organisation emails',
    emails: [
      { id: 'org-welcome', name: 'What is Megafone?', description: 'Explains Megafone to org on first notification', tag: 'new' },
      { id: 'org-creator-update', name: 'Creator update (to org)', description: 'Sent to org when creator posts update', tag: 'new' },
      { id: 'threshold', name: 'Threshold reached', description: 'Sent to the organisation when target hit', tag: 'existing' },
      { id: 'followup', name: 'Follow-up questions', description: 'Sent to the organisation with follow-ups', tag: 'existing' },
    ],
  },
]

export default function TestEmailButtons({ defaultEmail }: { defaultEmail: string }) {
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail)
  const [results, setResults] = useState<Record<string, { error: string | null; success?: string }>>({})
  const [pending, setPending] = useState<Record<string, boolean>>({})

  function handleSend(id: string) {
    setPending((p) => ({ ...p, [id]: true }))
    sendTestEmail(id, recipientEmail).then((result) => {
      setResults((r) => ({ ...r, [id]: result }))
      setPending((p) => ({ ...p, [id]: false }))
    })
  }

  return (
    <div className="space-y-8">
      {/* Recipient email input */}
      <div className="bg-white rounded-2xl border border-gray-200 px-6 py-5">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Send test emails to
        </label>
        <input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
          placeholder="email@example.com"
        />
        {recipientEmail !== defaultEmail && (
          <button
            type="button"
            onClick={() => setRecipientEmail(defaultEmail)}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Reset to {defaultEmail}
          </button>
        )}
      </div>

      {sections.map((section) => (
        <div key={section.title}>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            {section.title}
          </h2>
          <div className="space-y-3">
            {section.emails.map((email) => (
              <div
                key={email.id}
                className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#064E3B]">{email.name}</p>
                    <span className={`text-[10px] font-medium rounded px-1.5 py-0.5 ${
                      email.tag === 'new'
                        ? 'text-amber-700 bg-amber-50'
                        : 'text-gray-400 bg-gray-100'
                    }`}>
                      {email.tag}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{email.description}</p>
                  {results[email.id]?.success && (
                    <p className="text-xs text-emerald-600 mt-1">{results[email.id].success}</p>
                  )}
                  {results[email.id]?.error && (
                    <p className="text-xs text-red-600 mt-1">{results[email.id].error}</p>
                  )}
                </div>
                <button
                  onClick={() => handleSend(email.id)}
                  disabled={pending[email.id] || !recipientEmail}
                  className="shrink-0 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all"
                >
                  {pending[email.id] ? 'Sending...' : 'Send test'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
