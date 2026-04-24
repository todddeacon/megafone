'use client'

import { useState, useEffect } from 'react'

interface MediaItem {
  id: string
  kind: 'image' | 'video'
  url: string
}

interface Props {
  media: MediaItem[]
}

export default function ReviewMediaGallery({ media }: Props) {
  const images = media.filter((m) => m.kind === 'image')
  const video = media.find((m) => m.kind === 'video')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    if (lightboxIndex === null) return

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length))
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length))
    }

    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightboxIndex, images.length])

  if (media.length === 0) return null

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-[#064E3B] transition-colors bg-gray-50 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`Review photo ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </button>
          ))}
        </div>
      )}

      {video && (
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-black">
          <video
            src={video.url}
            controls
            playsInline
            preload="metadata"
            className="w-full max-h-[500px]"
          />
        </div>
      )}

      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex(null)
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
            aria-label="Close"
          >
            ✕
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length))
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length))
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
                aria-label="Next"
              >
                ›
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-0 right-0 text-center text-white text-xs">
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[lightboxIndex].url}
            alt={`Review photo ${lightboxIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[90vh] object-contain"
          />
        </div>
      )}
    </div>
  )
}
