'use client'

import { useState } from 'react'

// ─── Reusable Goal Net Background ────────────────────────────────────────────
// Three variants: full (hero), contained (cards/sections), light (on white bg)

function GoalNetFull() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute w-full h-full" preserveAspectRatio="none">
        <defs>
          <pattern id="net-full" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 0 18 L 18 0 L 36 18 L 18 36 Z" stroke="white" strokeWidth="1" opacity="0.12" fill="none" />
          </pattern>
          <radialGradient id="net-full-fade" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="net-full-mask">
            <rect width="100%" height="100%" fill="url(#net-full-fade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#net-full)" mask="url(#net-full-mask)" />
      </svg>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />
    </div>
  )
}

function GoalNetContained() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      <svg className="absolute w-full h-full" preserveAspectRatio="none">
        <defs>
          <pattern id="net-contained" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 0 16 L 16 0 L 32 16 L 16 32 Z" stroke="white" strokeWidth="0.8" opacity="0.10" fill="none" />
          </pattern>
          <linearGradient id="net-contained-fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="30%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0.8" />
          </linearGradient>
          <mask id="net-contained-mask">
            <rect width="100%" height="100%" fill="url(#net-contained-fade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#net-contained)" mask="url(#net-contained-mask)" />
      </svg>
    </div>
  )
}

function GoalNetLight() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute w-full h-full" preserveAspectRatio="none">
        <defs>
          <pattern id="net-light" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 0 20 L 20 0 L 40 20 L 20 40 Z" stroke="#064E3B" strokeWidth="0.8" opacity="0.06" fill="none" />
          </pattern>
          <radialGradient id="net-light-fade" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="net-light-mask">
            <rect width="100%" height="100%" fill="url(#net-light-fade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#net-light)" mask="url(#net-light-mask)" />
      </svg>
    </div>
  )
}

function GoalNetFooter() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute w-full h-full" preserveAspectRatio="none">
        <defs>
          <pattern id="net-footer" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 0 14 L 14 0 L 28 14 L 14 28 Z" stroke="white" strokeWidth="0.6" opacity="0.08" fill="none" />
          </pattern>
          <linearGradient id="net-footer-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0.3" />
          </linearGradient>
          <mask id="net-footer-mask">
            <rect width="100%" height="100%" fill="url(#net-footer-fade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#net-footer)" mask="url(#net-footer-mask)" />
      </svg>
    </div>
  )
}

// ─── Section labels ──────────────────────────────────────────────────────────

function SectionLabel({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-12 pb-4">
      <div className="flex items-baseline gap-3">
        <span className="text-xs font-bold text-white bg-[#064E3B] rounded-full w-6 h-6 flex items-center justify-center shrink-0">{n}</span>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{desc}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Mock components ─────────────────────────────────────────────────────────

function MockFeaturedCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Example campaign</span>
        <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">Ask Questions</span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-[#064E3B]/10 flex items-center justify-center text-[10px] font-black text-[#064E3B]">RA</div>
        <span className="text-xs font-semibold text-gray-500">Riverside Athletic FC</span>
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Awaiting response</span>
      </div>
      <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-3 mb-1">What is the club&apos;s long-term plan for squad investment and promotion?</h3>
      <p className="text-xs text-gray-400 mb-3">by Alex Morgan</p>
      <div className="flex items-end justify-between gap-2 mb-2">
        <div>
          <span className="text-2xl font-black text-[#064E3B] tabular-nums">4,218</span>
          <span className="text-xs text-gray-400 ml-1.5">supporters</span>
        </div>
        <span className="text-xs text-gray-400">5 questions</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full bg-[#F59E0B]" style={{ width: '84%' }} />
      </div>
      <p className="text-[10px] text-gray-400 mt-1">84% to notification threshold</p>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NetThemePage() {
  const [show, setShow] = useState({ hero: true, howItWorks: true, login: true, createHeader: true, footer: true })

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="mx-auto max-w-5xl flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest shrink-0">Goal Net Theme</span>
          <div className="flex gap-1.5 flex-wrap">
            {[
              { key: 'hero', label: 'Hero' },
              { key: 'howItWorks', label: 'How It Works' },
              { key: 'login', label: 'Login Page' },
              { key: 'createHeader', label: 'Create Campaign' },
              { key: 'footer', label: 'Footer' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setShow((s) => ({ ...s, [key]: !s[key as keyof typeof s] }))}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  show[key as keyof typeof show] ? 'bg-[#064E3B] text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-gray-400 hidden sm:block">Toggle each section</span>
        </div>
      </div>

      {/* ─── 1. HERO ─── */}
      <SectionLabel n={1} title="Homepage Hero" desc="The net sits behind the headline and featured card — adds texture and sport identity" />
      <section className="bg-[#064E3B] py-12 px-4 relative">
        {show.hero && <GoalNetFull />}
        <div className="mx-auto max-w-5xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight mb-4">
                Get Answers.<br />Get Change.
              </h1>
              <p className="text-emerald-200 text-base max-w-sm leading-relaxed mb-7">
                When fans speak with one voice, sports organisations have to listen. Start a campaign or add your support to one that matters.
              </p>
              <div className="flex gap-3">
                <span className="rounded-lg bg-[#F59E0B] px-5 py-3 text-sm font-bold text-white">Start a campaign</span>
              </div>
            </div>
            <MockFeaturedCard />
          </div>
        </div>
      </section>

      {/* ─── 2. HOW IT WORKS ─── */}
      <SectionLabel n={2} title="How It Works Section" desc="The net pattern flows from the right side of the card, reinforcing the sporting theme" />
      <div className="mx-auto max-w-5xl px-4 pb-8">
        <div className="bg-[#064E3B] rounded-2xl p-7 text-white relative overflow-hidden">
          {show.howItWorks && <GoalNetContained />}
          <div className="relative z-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-6">How it works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { n: '01', title: 'Start a campaign', desc: 'Ask questions or demand change. Set out what you want from your club and why it matters.' },
                { n: '02', title: 'Build support', desc: 'Share your campaign. The more fans behind it, the harder it is to ignore.' },
                { n: '03', title: 'Get a response', desc: 'When you hit your target, the organisation is notified and has the opportunity to respond publicly.' },
              ].map(({ n, title, desc }) => (
                <div key={n} className="flex gap-3">
                  <span className="text-2xl font-black text-white/20 leading-none mt-0.5 shrink-0">{n}</span>
                  <div>
                    <p className="font-bold text-white text-sm mb-1">{title}</p>
                    <p className="text-sm text-emerald-200 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. LOGIN PAGE ─── */}
      <SectionLabel n={3} title="Login / Sign Up Page" desc="Light version of the net in green on the gray background — subtle depth behind the auth form" />
      <div className="relative bg-gray-50 py-12 px-4">
        {show.login && <GoalNetLight />}
        <div className="w-full max-w-sm mx-auto relative z-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>
            <div className="space-y-3 mb-6">
              <div className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </div>
            </div>
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or continue with email</span></div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-400">you@example.com</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-400">••••••••</div>
              </div>
              <div className="w-full rounded-lg bg-[#064E3B] px-4 py-2 text-sm font-semibold text-white text-center">Sign in</div>
            </div>
            <p className="mt-4 text-center text-sm text-gray-500">
              Don&apos;t have an account? <span className="font-semibold text-[#064E3B] underline">Sign up</span>
            </p>
          </div>
        </div>
      </div>

      {/* ─── 4. CREATE CAMPAIGN HEADER ─── */}
      <SectionLabel n={4} title="Create Campaign Header" desc="Dark green header band with net pattern, transitioning into the white form below" />
      <div className="bg-[#064E3B] pt-10 pb-16 px-4 relative">
        {show.createHeader && <GoalNetFull />}
        <div className="mx-auto max-w-2xl relative z-10">
          <h1 className="text-3xl font-black tracking-tight text-white">Create a Campaign</h1>
          <p className="mt-2 text-sm text-emerald-200">
            Ask the questions that matter, or demand the change you want.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-2xl px-4 -mt-8 pb-8 relative z-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Campaign type</label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-semibold">
                <div className="flex-1 px-4 py-2.5 bg-[#064E3B] text-white text-center">Ask Questions</div>
                <div className="flex-1 px-4 py-2.5 text-gray-500 text-center">Demand Change</div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Headline <span className="text-[#F59E0B]">*</span></label>
              <div className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-400">e.g. Manchester United must address the stadium expansion plans</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Target organisation <span className="text-[#F59E0B]">*</span></label>
              <div className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-400 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                </svg>
                Search for a club...
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 5. FOOTER ─── */}
      <SectionLabel n={5} title="Footer" desc="Dark green footer with net pattern — ties the bottom of every page back to the sporting theme" />
      <footer className="bg-[#064E3B] relative">
        {show.footer && <GoalNetFooter />}
        <div className="mx-auto max-w-5xl px-4 py-10 relative z-10">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <p className="text-lg font-black text-white tracking-tight mb-2">Megafone</p>
              <p className="text-sm text-emerald-200 max-w-xs leading-relaxed">
                When fans speak with one voice, sports organisations have to listen.
              </p>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-3">Platform</p>
                <div className="space-y-2">
                  <p className="text-sm text-emerald-200 hover:text-white transition-colors cursor-pointer">Browse campaigns</p>
                  <p className="text-sm text-emerald-200 hover:text-white transition-colors cursor-pointer">Start a campaign</p>
                  <p className="text-sm text-emerald-200 hover:text-white transition-colors cursor-pointer">About</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-3">Legal</p>
                <div className="space-y-2">
                  <p className="text-sm text-emerald-200 hover:text-white transition-colors cursor-pointer">Terms</p>
                  <p className="text-sm text-emerald-200 hover:text-white transition-colors cursor-pointer">Privacy</p>
                  <p className="text-sm text-emerald-200 hover:text-white transition-colors cursor-pointer">Contact</p>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-6 flex items-center justify-between">
            <p className="text-xs text-emerald-300/60">&copy; 2026 Megafone. All rights reserved.</p>
            <p className="text-xs text-emerald-300/60">hello@megafone.app</p>
          </div>
        </div>
      </footer>

      {/* Spacer */}
      <div className="h-8 bg-gray-100" />
    </div>
  )
}
