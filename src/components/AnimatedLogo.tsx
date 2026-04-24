'use client'

import { useEffect, useState } from 'react'
import Logo from './Logo'
import MegaphoneIcon from './MegaphoneIcon'

const SCROLL_THRESHOLD = 40

export default function AnimatedLogo() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > SCROLL_THRESHOLD)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <span className="relative inline-block h-7 w-[140px] sm:w-[160px] overflow-hidden">
      {/* MEGAFONE wordmark — visible at top */}
      <span
        className={`absolute inset-0 flex items-center transition-opacity duration-200 ${
          scrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <Logo size="md" className="text-white" />
      </span>

      {/* Megaphone icon — visible when scrolled */}
      <span
        className={`absolute inset-0 flex items-center transition-opacity duration-200 ${
          scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <MegaphoneIcon className="text-white" size={28} />
      </span>
    </span>
  )
}
