'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { addDemandLink } from './actions'

interface ContentLink {
  id: string
  url: string
  title: string
}

interface Props {
  demandId: string
  links: ContentLink[]
  isCreator: boolean
}

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0]
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      const match = u.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)
      if (match) return match[1]
    }
    return null
  } catch {
    return null
  }
}

function ContentCard({ link }: { link: ContentLink }) {
  const ytId = getYouTubeId(link.url)
  const thumbnailUrl = ytId
    ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
    : null

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#064E3B] overflow-hidden">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={link.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-[#F59E0B] transition-colors duration-200">
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="px-3 py-2.5 bg-white">
        <p className="text-sm font-semibold text-[#064E3B] line-clamp-2 leading-snug">
          {link.title}
        </p>
      </div>
    </a>
  )
}

function AddContentForm({ demandId }: { demandId: string }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const boundAction = addDemandLink.bind(null, demandId)
  const [state, formAction, isPending] = useActionState(boundAction, { error: null })

  const prevError = useRef(state.error)
  useEffect(() => {
    if (prevError.current !== null && state.error === null) {
      formRef.current?.reset()
      router.refresh()
    }
    prevError.current = state.error
  }, [state.error, router])

  return (
    <form ref={formRef} action={formAction} className="mt-6 pt-6 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Add content
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          name="title"
          type="text"
          required
          placeholder="Title"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
        />
        <input
          name="url"
          type="url"
          required
          placeholder="https://…"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
        />
      </div>
      {state.error && (
        <p className="mt-1 text-xs text-red-600">{state.error}</p>
      )}
      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#064E3B] px-4 py-2 text-sm font-semibold text-white hover:opacity-80 disabled:opacity-50 transition-opacity"
        >
          {isPending ? 'Adding…' : 'Add'}
        </button>
      </div>
    </form>
  )
}

export default function RelatedVideosSection({ demandId, links, isCreator }: Props) {
  if (links.length === 0 && !isCreator) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-[#064E3B]/[0.03] border-b border-gray-100">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Related Content</h2>
      </div>

      <div className="p-6">
        {links.length === 0 ? (
          <p className="text-sm text-gray-400">No content added yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {links.map((link) => (
              <ContentCard key={link.id} link={link} />
            ))}
          </div>
        )}

        {isCreator && <AddContentForm demandId={demandId} />}
      </div>
    </div>
  )
}
