import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const stack = [
  { name: 'Next.js 16', role: 'Frontend & server framework', description: 'React-based framework that handles routing, server-side rendering, and API endpoints. Runs the entire application.', url: 'https://nextjs.org' },
  { name: 'React 19', role: 'UI library', description: 'Builds the interactive user interface — buttons, forms, pages. Uses Server Components for fast page loads.', url: 'https://react.dev' },
  { name: 'Supabase', role: 'Database, auth & storage', description: 'PostgreSQL database that stores all data (campaigns, users, comments, organisations). Also handles user sign-up/login and file storage (PDFs, videos).', url: 'https://supabase.com' },
  { name: 'Vercel', role: 'Hosting & deployment', description: 'Hosts the website and automatically deploys new versions when code is pushed to GitHub. Handles scaling, SSL, and CDN.', url: 'https://vercel.com' },
  { name: 'Tailwind CSS 4', role: 'Styling', description: 'Utility-first CSS framework used for all visual styling — colours, spacing, responsive layout, and animations.', url: 'https://tailwindcss.com' },
  { name: 'Resend', role: 'Transactional email', description: 'Sends emails to organisations when campaigns hit their target, and notifies supporters when an official response is posted.', url: 'https://resend.com' },
  { name: 'OpenAI', role: 'Content moderation', description: 'Automatically screens campaigns and comments for hate speech, threats, and inappropriate content before they go live.', url: 'https://openai.com' },
  { name: 'TypeScript', role: 'Language', description: 'A typed version of JavaScript that catches bugs before they reach users. All application code is written in TypeScript.', url: 'https://typescriptlang.org' },
]

export default async function TechStackPage() {
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
          <h1 className="text-3xl font-black tracking-tight text-[#064E3B]">Tech stack</h1>
          <p className="mt-1 text-sm text-gray-500">{stack.length} technologies powering Megafone</p>
        </div>

        <div className="space-y-3">
          {stack.map((t) => (
            <a
              key={t.name}
              href={t.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-2xl border border-gray-200 px-6 py-5 hover:border-[#064E3B]/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-4 mb-2">
                <h2 className="text-sm font-bold text-[#064E3B]">{t.name}</h2>
                <span className="text-[10px] font-medium text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 shrink-0">
                  {t.role}
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">{t.description}</p>
            </a>
          ))}
        </div>

      </div>
    </main>
  )
}
