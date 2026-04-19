'use client'

import { useState } from 'react'

// ─── Mock featured card ──────────────────────────────────────────────────────

function FeaturedCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Example campaign</span>
        <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
          Ask Questions
        </span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-[#064E3B]/10 flex items-center justify-center text-[10px] font-black text-[#064E3B] shrink-0">
          RA
        </div>
        <span className="text-xs font-semibold text-gray-500 truncate">Riverside Athletic FC</span>
        <span className="ml-auto shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
          Awaiting response
        </span>
      </div>
      <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-3 mb-1">
        What is the club&apos;s long-term plan for squad investment and promotion?
      </h3>
      <p className="text-xs text-gray-400 mb-3">by Alex Morgan</p>
      <div className="flex items-end justify-between gap-2 mb-2">
        <div>
          <span className="text-2xl font-black text-[#064E3B] tabular-nums">4,218</span>
          <span className="text-xs text-gray-400 ml-1.5">supporters</span>
        </div>
        <span className="text-xs text-gray-400 shrink-0">5 questions</span>
      </div>
      <div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-[#F59E0B]" style={{ width: '84%' }} />
        </div>
        <p className="text-[10px] text-gray-400 mt-1">84% to notification threshold</p>
      </div>
    </div>
  )
}

// ─── Hero content (shared across all designs) ────────────────────────────────

function HeroContent() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-center">
      <div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight mb-4">
          Get Answers.<br />Get Change.
        </h1>
        <p className="text-emerald-200 text-base max-w-sm leading-relaxed mb-7">
          When fans speak with one voice, sports organisations have to listen. Start a campaign or add your support to one that matters.
        </p>
        <div className="flex gap-3">
          <span className="rounded-lg bg-[#F59E0B] px-5 py-3 text-sm font-bold text-white cursor-pointer hover:bg-[#D97706] transition-colors">
            Start a campaign
          </span>
        </div>
      </div>
      <FeaturedCard />
    </div>
  )
}

// ─── Design 1: Pitch Lines ───────────────────────────────────────────────────
// Subtle football pitch markings — centre circle, halfway line, penalty arc

function PitchLinesBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute w-full h-full" viewBox="0 0 1200 500" preserveAspectRatio="none" fill="none">
        {/* Halfway line */}
        <line x1="600" y1="0" x2="600" y2="500" stroke="white" strokeWidth="2" opacity="0.15" />
        {/* Centre circle */}
        <circle cx="600" cy="250" r="120" stroke="white" strokeWidth="2" opacity="0.15" fill="none" />
        {/* Centre spot */}
        <circle cx="600" cy="250" r="6" fill="white" opacity="0.15" />
        {/* Left penalty box */}
        <rect x="0" y="120" width="180" height="260" stroke="white" strokeWidth="2" opacity="0.12" fill="none" />
        {/* Left goal area */}
        <rect x="0" y="180" width="70" height="140" stroke="white" strokeWidth="2" opacity="0.10" fill="none" />
        {/* Left penalty arc */}
        <path d="M 180 200 A 60 60 0 0 1 180 300" stroke="white" strokeWidth="2" opacity="0.12" fill="none" />
        {/* Right penalty box */}
        <rect x="1020" y="120" width="180" height="260" stroke="white" strokeWidth="2" opacity="0.12" fill="none" />
        {/* Right goal area */}
        <rect x="1130" y="180" width="70" height="140" stroke="white" strokeWidth="2" opacity="0.10" fill="none" />
        {/* Right penalty arc */}
        <path d="M 1020 200 A 60 60 0 0 0 1020 300" stroke="white" strokeWidth="2" opacity="0.12" fill="none" />
        {/* Corner arcs */}
        <path d="M 0 40 A 40 40 0 0 0 40 0" stroke="white" strokeWidth="2" opacity="0.10" fill="none" />
        <path d="M 1160 0 A 40 40 0 0 0 1200 40" stroke="white" strokeWidth="2" opacity="0.10" fill="none" />
        <path d="M 40 500 A 40 40 0 0 0 0 460" stroke="white" strokeWidth="2" opacity="0.10" fill="none" />
        <path d="M 1200 460 A 40 40 0 0 0 1160 500" stroke="white" strokeWidth="2" opacity="0.10" fill="none" />
        {/* Outer boundary */}
        <rect x="3" y="3" width="1194" height="494" stroke="white" strokeWidth="2.5" opacity="0.10" fill="none" rx="3" />
      </svg>
    </div>
  )
}

// ─── Design 2: Stadium Floodlights ───────────────────────────────────────────
// Radial light beams from top corners, like stadium floodlights illuminating

function FloodlightsBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top-left floodlight glow */}
      <div
        className="absolute -top-40 -left-40 w-[800px] h-[800px]"
        style={{
          background: 'radial-gradient(ellipse at top left, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 30%, transparent 60%)',
        }}
      />
      {/* Top-right floodlight glow */}
      <div
        className="absolute -top-40 -right-40 w-[800px] h-[800px]"
        style={{
          background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 30%, transparent 60%)',
        }}
      />
      {/* Light beams from top-left */}
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1200 500" preserveAspectRatio="none" fill="none">
        <defs>
          <linearGradient id="beamFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.20" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Left beams — wedge shapes */}
        <polygon points="0,0 350,500 450,500" fill="url(#beamFade)" opacity="0.08" />
        <polygon points="0,0 550,500 650,500" fill="url(#beamFade)" opacity="0.06" />
        <polygon points="0,0 750,500 850,500" fill="url(#beamFade)" opacity="0.04" />
        {/* Right beams */}
        <polygon points="1200,0 850,500 750,500" fill="url(#beamFade)" opacity="0.08" />
        <polygon points="1200,0 650,500 550,500" fill="url(#beamFade)" opacity="0.06" />
        <polygon points="1200,0 450,500 350,500" fill="url(#beamFade)" opacity="0.04" />
      </svg>
      {/* Bright ambient glow at top centre */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px]"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.10) 0%, transparent 60%)',
        }}
      />
    </div>
  )
}

// ─── Design 3: Diagonal Kit Stripes ──────────────────────────────────────────
// Classic football shirt-inspired diagonal stripes, very subtle

function KitStripesBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Bold diagonal stripes */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            135deg,
            transparent,
            transparent 40px,
            rgba(255,255,255,0.08) 40px,
            rgba(255,255,255,0.08) 44px,
            transparent 44px,
            transparent 80px
          )`,
        }}
      />
      {/* Wider accent stripes */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            135deg,
            transparent,
            transparent 120px,
            rgba(255,255,255,0.05) 120px,
            rgba(255,255,255,0.05) 140px,
            transparent 140px,
            transparent 240px
          )`,
        }}
      />
      {/* Gradient overlay for depth and shine */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%, rgba(0,0,0,0.08) 100%)',
        }}
      />
    </div>
  )
}

// ─── Design 4: Goal Net / Hexagon Pattern ────────────────────────────────────
// Diamond mesh pattern reminiscent of goal net texture

function GoalNetBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute w-full h-full" preserveAspectRatio="none">
        <defs>
          <pattern id="net" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 0 18 L 18 0 L 36 18 L 18 36 Z" stroke="white" strokeWidth="1" opacity="0.12" fill="none" />
          </pattern>
          {/* Fade mask — net visible in centre, fades at edges */}
          <radialGradient id="netFade" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="netMask">
            <rect width="100%" height="100%" fill="url(#netFade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#net)" mask="url(#netMask)" />
      </svg>
      {/* Depth glow behind content area */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 50%)',
        }}
      />
    </div>
  )
}

// ─── Design 5: Mown Grass Stripes ────────────────────────────────────────────
// Alternating light/dark vertical bands like a freshly mown football pitch

function GrassStripesBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Bold alternating vertical mow stripes */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 70px,
            rgba(255,255,255,0.06) 70px,
            rgba(255,255,255,0.06) 140px
          )`,
        }}
      />
      {/* Pitch curve arcs — like a centre circle viewed from the stands */}
      <svg className="absolute w-full h-full" viewBox="0 0 1200 500" preserveAspectRatio="none" fill="none">
        {/* Large sweeping arc */}
        <path d="M 200 520 Q 600 120 1000 520" stroke="white" strokeWidth="2.5" opacity="0.12" fill="none" />
        {/* Inner arc */}
        <path d="M 350 520 Q 600 220 850 520" stroke="white" strokeWidth="1.5" opacity="0.08" fill="none" />
        {/* Halfway line */}
        <line x1="600" y1="120" x2="600" y2="500" stroke="white" strokeWidth="1.5" opacity="0.08" />
      </svg>
      {/* Top-down gradient for depth/perspective */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, transparent 30%, rgba(255,255,255,0.04) 100%)',
        }}
      />
    </div>
  )
}

// ─── Design options config ───────────────────────────────────────────────────

const DESIGNS = [
  {
    id: 1,
    name: 'Pitch Lines',
    description: 'Subtle football pitch markings — centre circle, penalty boxes, corner arcs. The field layout sits behind the content as a quiet nod to the sport.',
    Bg: PitchLinesBg,
  },
  {
    id: 2,
    name: 'Stadium Floodlights',
    description: 'Radial light beams from the top corners, like matchday floodlights illuminating the scene. Creates atmosphere and drama.',
    Bg: FloodlightsBg,
  },
  {
    id: 3,
    name: 'Kit Stripes',
    description: 'Diagonal repeating stripes inspired by classic football shirt patterns. Very subtle — just enough to add texture and movement.',
    Bg: KitStripesBg,
  },
  {
    id: 4,
    name: 'Goal Net',
    description: 'Diamond mesh pattern reminiscent of the back of the net. Fades out towards the edges so it doesn\'t compete with content.',
    Bg: GoalNetBg,
  },
  {
    id: 5,
    name: 'Mown Pitch',
    description: 'Alternating light and dark vertical bands like a freshly mown football pitch, with a sweeping arc suggesting the centre circle.',
    Bg: GrassStripesBg,
  },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BackgroundDesignsPage() {
  const [active, setActive] = useState(1)
  const current = DESIGNS.find((d) => d.id === active)!

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sticky selector bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest shrink-0">Hero Background</span>
          <div className="flex gap-1.5 flex-wrap">
            {DESIGNS.map((d) => (
              <button
                key={d.id}
                onClick={() => setActive(d.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                  active === d.id ? 'bg-[#064E3B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d.id}. {d.name}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-gray-400 hidden sm:block">Preview only</span>
        </div>
      </div>

      {/* Full-width hero preview */}
      <section className="bg-[#064E3B] py-12 px-4 relative">
        <current.Bg />
        <div className="mx-auto max-w-5xl relative z-10">
          <HeroContent />
        </div>
      </section>

      {/* Description */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Option {current.id}: {current.name}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{current.description}</p>
        </div>
      </div>

      {/* All 5 side by side as thumbnails */}
      <div className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">All options</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DESIGNS.map((d) => (
            <button
              key={d.id}
              onClick={() => { setActive(d.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className={`text-left rounded-2xl overflow-hidden border-2 transition-all ${
                active === d.id ? 'border-[#064E3B] shadow-lg' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Mini hero */}
              <div className="bg-[#064E3B] h-32 relative overflow-hidden">
                <d.Bg />
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <span className="text-white text-xs font-bold opacity-60">{d.name}</span>
                </div>
              </div>
              <div className="p-3 bg-white">
                <p className="text-sm font-bold text-gray-900">Option {d.id}: {d.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{d.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
