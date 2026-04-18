'use client'

import { useState } from 'react'

type ViewMode = 'admin' | 'creator' | 'org_rep' | 'fan'

const MODES: { value: ViewMode; label: string; icon: string }[] = [
  { value: 'admin', label: 'Admin', icon: '👑' },
  { value: 'creator', label: 'Creator', icon: '✏️' },
  { value: 'org_rep', label: 'Org Rep', icon: '🏢' },
  { value: 'fan', label: 'Fan', icon: '👤' },
]

export default function AdminToolbar({ currentMode }: { currentMode: ViewMode }) {
  const [mode, setMode] = useState<ViewMode>(currentMode)
  const [expanded, setExpanded] = useState(false)

  async function handleModeChange(newMode: ViewMode) {
    setMode(newMode)
    setExpanded(false)

    // Set cookie and reload to apply
    document.cookie = `admin_view_mode=${newMode};path=/;max-age=${60 * 60 * 24 * 30}`
    window.location.reload()
  }

  const current = MODES.find((m) => m.value === mode)!

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Expanded mode selector */}
      {expanded && (
        <div className="mb-2 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">View as</p>
          </div>
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => handleModeChange(m.value)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                mode === m.value
                  ? 'bg-[#064E3B]/5 text-[#064E3B] font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
              {mode === m.value && (
                <svg className="w-4 h-4 ml-auto text-[#064E3B]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg border text-sm font-semibold transition-all ${
          mode === 'admin'
            ? 'bg-[#064E3B] text-white border-[#064E3B] hover:bg-[#065F46]'
            : 'bg-white text-gray-700 border-amber-300 hover:border-amber-400'
        }`}
      >
        <span>{current.icon}</span>
        <span>Viewing as {current.label}</span>
        {mode !== 'admin' && (
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        )}
      </button>
    </div>
  )
}
