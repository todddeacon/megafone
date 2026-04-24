'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { updateReview } from './actions'

interface ExistingMedia {
  id: string
  kind: 'image' | 'video'
  url: string
}

interface Props {
  demandId: string
  initial: {
    headline: string
    reviewing_subject: string
    summary: string
    rating: number | null
    reviewer_display_mode: 'real_name' | 'nickname' | 'anonymous'
    existingMedia: ExistingMedia[]
  }
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B] transition-shadow'
const labelClass = 'block text-sm font-semibold text-gray-900 mb-1'

const MAX_IMAGES = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_VIDEO_SIZE = 100 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

export default function EditReviewForm({ demandId, initial }: Props) {
  const existingImages = initial.existingMedia.filter((m) => m.kind === 'image')
  const existingVideo = initial.existingMedia.find((m) => m.kind === 'video')

  const [state, formAction, isPending] = useActionState(
    updateReview.bind(null, demandId),
    { error: null }
  )
  const formRef = useRef<HTMLFormElement>(null)
  const imagePickerRef = useRef<HTMLInputElement>(null)
  const videoPickerRef = useRef<HTMLInputElement>(null)

  const [headline, setHeadline] = useState(initial.headline)
  const [reviewingSubject, setReviewingSubject] = useState(initial.reviewing_subject)
  const [summary, setSummary] = useState(initial.summary)
  const [rating, setRating] = useState<number | null>(initial.rating)
  const [displayMode, setDisplayMode] = useState(initial.reviewer_display_mode)
  const [clientError, setClientError] = useState<string | null>(null)

  // Media management
  const [keptImageIds, setKeptImageIds] = useState<Set<string>>(new Set(existingImages.map((m) => m.id)))
  const [keepVideo, setKeepVideo] = useState<boolean>(!!existingVideo)
  const [newImages, setNewImages] = useState<File[]>([])
  const [newVideo, setNewVideo] = useState<File | null>(null)
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [newVideoPreview, setNewVideoPreview] = useState<string | null>(null)

  const totalImageCount = keptImageIds.size + newImages.length
  const hasAnyVideo = (keepVideo && existingVideo) || newVideo !== null

  useEffect(() => {
    const urls = newImages.map((f) => URL.createObjectURL(f))
    setNewImagePreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [newImages])

  useEffect(() => {
    if (!newVideo) {
      setNewVideoPreview(null)
      return
    }
    const url = URL.createObjectURL(newVideo)
    setNewVideoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [newVideo])

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = ''
    const remaining = MAX_IMAGES - totalImageCount
    const accepted: File[] = []
    for (const f of picked) {
      if (accepted.length >= remaining) break
      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
        setClientError('Images must be JPG, PNG, or WEBP.')
        continue
      }
      if (f.size > MAX_IMAGE_SIZE) {
        setClientError(`"${f.name}" is larger than 5 MB.`)
        continue
      }
      accepted.push(f)
    }
    setNewImages((prev) => [...prev, ...accepted])
  }

  function handleVideoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!ALLOWED_VIDEO_TYPES.includes(f.type)) {
      setClientError('Video must be MP4, MOV, or WEBM.')
      return
    }
    if (f.size > MAX_VIDEO_SIZE) {
      setClientError('Video is larger than 100 MB.')
      return
    }
    setNewVideo(f)
    setKeepVideo(false)
  }

  function removeExistingImage(id: string) {
    setKeptImageIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function removeNewImage(i: number) {
    setNewImages((prev) => prev.filter((_, j) => j !== i))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setClientError(null)
    const fd = new FormData(e.currentTarget)

    // Which existing media ids to keep
    fd.append('kept_media_ids', Array.from(keptImageIds).join(','))
    fd.append('keep_existing_video', keepVideo ? 'true' : 'false')

    // New files
    newImages.forEach((f, i) => fd.append(`new_image_${i}`, f))
    fd.append('new_image_count', String(newImages.length))
    if (newVideo) fd.append('new_video', newVideo)

    formAction(fd)
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
      <input type="hidden" name="rating" value={rating ?? ''} />
      <input type="hidden" name="reviewer_display_mode" value={displayMode} />

      <div>
        <label htmlFor="headline" className={labelClass}>
          Headline <span className="text-[#F59E0B]">*</span>
        </label>
        <input
          id="headline"
          name="headline"
          type="text"
          required
          maxLength={100}
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="reviewing_subject" className={labelClass}>
          What are you reviewing? <span className="text-[#F59E0B]">*</span>
        </label>
        <input
          id="reviewing_subject"
          name="reviewing_subject"
          type="text"
          required
          maxLength={150}
          value={reviewingSubject}
          onChange={(e) => setReviewingSubject(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="summary" className={labelClass}>
          Your review <span className="text-[#F59E0B]">*</span>
        </label>
        <textarea
          id="summary"
          name="summary"
          required
          rows={6}
          minLength={50}
          maxLength={2000}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className={`${inputClass} resize-none`}
        />
        <p className="mt-1 text-xs text-gray-400">
          {summary.length} / 2000 characters · minimum 50
        </p>
      </div>

      <div>
        <label className={labelClass}>
          Your rating <span className="text-[#F59E0B]">*</span>
        </label>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
              className={`flex items-center justify-center rounded-md border transition-colors w-11 h-11 ${
                rating === n
                  ? 'bg-[#F59E0B] border-[#F59E0B] text-white'
                  : 'border-gray-200 text-gray-400 hover:border-[#F59E0B] hover:text-[#F59E0B]'
              }`}
            >
              {n === 0 ? (
                <span className="text-sm font-bold">0</span>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.366 2.446c-.784.57-1.84-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.652 9.154c-.784-.57-.381-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                </svg>
              )}
            </button>
          ))}
          <span className="ml-3 text-sm font-semibold text-gray-700">
            {rating === null ? 'Select a rating' : `${rating} / 5`}
          </span>
        </div>
      </div>

      <div>
        <label className={labelClass}>How should we show your name?</label>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-semibold">
          {(['real_name', 'nickname', 'anonymous'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setDisplayMode(mode)}
              className={`flex-1 px-3 py-2 transition-colors ${
                displayMode === mode ? 'bg-[#064E3B] text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {mode === 'real_name' ? 'My name' : mode === 'nickname' ? 'My nickname' : 'Anonymous'}
            </button>
          ))}
        </div>
      </div>

      {/* Photos */}
      <div>
        <label className={labelClass}>
          Photos <span className="text-gray-400 font-normal">(optional, up to {MAX_IMAGES})</span>
        </label>
        <input
          ref={imagePickerRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleImagePick}
          className="hidden"
        />
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {existingImages
            .filter((img) => keptImageIds.has(img.id))
            .map((img) => (
              <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="Existing photo" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center text-xs font-bold hover:bg-black transition-colors"
                  aria-label="Remove photo"
                >
                  ✕
                </button>
              </div>
            ))}
          {newImagePreviews.map((src, i) => (
            <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#F59E0B] bg-gray-50 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`New photo ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeNewImage(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center text-xs font-bold hover:bg-black transition-colors"
                aria-label="Remove photo"
              >
                ✕
              </button>
              <span className="absolute bottom-1 left-1 text-[10px] text-white bg-[#F59E0B] rounded px-1.5 py-0.5 font-semibold">
                New
              </span>
            </div>
          ))}
          {totalImageCount < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => imagePickerRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-[#064E3B] hover:text-[#064E3B] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs font-semibold mt-1">Add photo</span>
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          JPG, PNG, or WEBP · max 5 MB each · {totalImageCount} / {MAX_IMAGES} selected
        </p>
      </div>

      {/* Video */}
      <div>
        <label className={labelClass}>
          Video <span className="text-gray-400 font-normal">(optional, max 1)</span>
        </label>
        <input
          ref={videoPickerRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          onChange={handleVideoPick}
          className="hidden"
        />
        {keepVideo && existingVideo && !newVideo ? (
          <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-black">
            <video src={existingVideo.url} controls className="w-full max-h-64" />
            <button
              type="button"
              onClick={() => setKeepVideo(false)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center text-xs font-bold hover:bg-black transition-colors"
              aria-label="Remove video"
            >
              ✕
            </button>
          </div>
        ) : newVideo && newVideoPreview ? (
          <div className="relative rounded-lg overflow-hidden border-2 border-[#F59E0B] bg-black">
            <video src={newVideoPreview} controls className="w-full max-h-64" />
            <button
              type="button"
              onClick={() => setNewVideo(null)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center text-xs font-bold hover:bg-black transition-colors"
              aria-label="Remove video"
            >
              ✕
            </button>
            <span className="absolute top-2 left-2 text-[10px] text-white bg-[#F59E0B] rounded px-1.5 py-0.5 font-semibold">
              New · {(newVideo.size / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>
        ) : !hasAnyVideo ? (
          <button
            type="button"
            onClick={() => videoPickerRef.current?.click()}
            className="w-full rounded-lg border-2 border-dashed border-gray-300 py-8 flex flex-col items-center justify-center text-gray-400 hover:border-[#064E3B] hover:text-[#064E3B] transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-semibold mt-2">Add video</span>
          </button>
        ) : null}
        <p className="mt-1 text-xs text-gray-400">MP4, MOV, or WEBM · max 100 MB</p>
      </div>

      {(clientError || state.error) && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{clientError ?? state.error}</p>
      )}

      <div className="flex gap-3">
        <a
          href={`/demands/${demandId}`}
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-[#F59E0B] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#D97706] disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
