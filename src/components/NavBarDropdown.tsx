'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  name: string
  email: string
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export default function NavBarDropdown({ name, email }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full bg-[#065F46] flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/30 hover:ring-white/80 hover:bg-[#047857] transition-all duration-150 focus:outline-none focus:ring-white/80"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {initials(name)}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
          {/* Identity */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-[#064E3B] truncate">{name}</p>
            <p className="text-xs text-gray-400 truncate mt-0.5">{email}</p>
          </div>

          {/* Actions */}
          <div className="py-1">
            <a
              href="/profile"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Edit profile
            </a>
          </div>

          <div className="border-t border-gray-100 py-1">
            <a
              href="/auth/logout"
              className="block px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Sign out
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
