'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  text: string
  maxLines?: number
  className?: string
}

export default function ExpandableText({ text, maxLines = 3, className = '' }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [needsTruncation, setNeedsTruncation] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (textRef.current) {
      const lineHeight = parseFloat(getComputedStyle(textRef.current).lineHeight)
      const maxHeight = lineHeight * maxLines
      setNeedsTruncation(textRef.current.scrollHeight > maxHeight + 2)
    }
  }, [text, maxLines])

  return (
    <div>
      <p
        ref={textRef}
        className={`${className} whitespace-pre-line ${
          !expanded && needsTruncation ? `line-clamp-${maxLines}` : ''
        }`}
        style={!expanded && needsTruncation ? { WebkitLineClamp: maxLines, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' } : undefined}
      >
        {text}
      </p>
      {needsTruncation && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1.5 text-xs font-semibold text-[#064E3B] hover:underline transition-colors"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}
