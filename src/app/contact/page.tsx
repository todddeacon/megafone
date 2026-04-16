export const metadata = {
  title: 'Contact — Megafone',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-2xl px-4 py-16">

        <div className="mb-12">
          <p className="text-xs font-semibold text-[#F59E0B] uppercase tracking-widest mb-2">Get in touch</p>
          <h1 className="text-4xl font-black tracking-tight text-[#064E3B] leading-none">
            Contact Megafone
          </h1>
        </div>

        <div className="space-y-4">

          {/* Org rep path — prominent */}
          <div className="bg-[#064E3B] rounded-2xl p-8 text-white">
            <p className="text-xs font-semibold text-emerald-300 uppercase tracking-widest mb-3">
              For sports clubs &amp; organisations
            </p>
            <h2 className="text-xl font-bold mb-3">
              Are you an official representative?
            </h2>
            <p className="text-emerald-100 text-sm leading-relaxed mb-6">
              Claim your organisation on Megafone to post official responses to fan campaigns,
              engage directly with your supporters, and show that you take their questions seriously.
            </p>
            <ul className="space-y-2 mb-8">
              {[
                'Post official responses to campaigns',
                'Engage directly with your supporters',
                'Show fans their voice is being heard',
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-emerald-100">
                  <svg className="w-4 h-4 text-[#F59E0B] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {point}
                </li>
              ))}
            </ul>
            <a
              href="/organisations/claim"
              className="inline-block rounded-xl bg-[#F59E0B] px-6 py-3 text-sm font-bold text-white hover:bg-[#D97706] transition-colors"
            >
              Claim your organisation →
            </a>
          </div>

          {/* General enquiry */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              General enquiries
            </p>
            <h2 className="text-xl font-bold text-[#064E3B] mb-3">
              Everything else
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Questions about the platform, content you&apos;d like to report, or anything else —
              drop us an email and we&apos;ll get back to you.
            </p>
            <a
              href="mailto:hello@megafone.app"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-[#064E3B] hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              hello@megafone.app
            </a>
          </div>

        </div>
      </main>
    </div>
  )
}
