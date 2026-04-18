'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { postComment, deleteComment, setNickname } from './actions'

interface Profile {
  id: string
  name: string
  nickname: string | null
}

interface Comment {
  id: string
  body: string
  user_id: string
  parent_comment_id: string | null
  created_at: string
  profile: Profile | null
}

interface Props {
  demandId: string
  comments: Comment[]
  isAuthenticated: boolean
  isSupporter: boolean
  isCreator: boolean
  isOrgRep: boolean
  currentUserId: string | null
  creatorUserId: string
  hasNickname: boolean
  orgName: string
  orgRepUserIds: string[]
}

const AVATAR_COLORS = [
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
]

function avatarColor(userId: string) {
  const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function avatarInitials(profile: Profile | null): string {
  if (!profile) return 'F'
  return profile.name.trim().split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?'
}

function displayName(profile: Profile | null, isCurrentUser: boolean): string {
  if (isCurrentUser) return 'You'
  if (!profile) return 'Fan'
  return profile.nickname ?? profile.name.split(' ')[0] ?? 'Fan'
}

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ─── Nickname prompt ──────────────────────────────────────────────────────────

function NicknamePrompt() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await setNickname(value)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-900 mb-0.5">Choose a nickname to join the discussion</p>
      <p className="text-xs text-amber-700 mb-3">This is how you'll appear in comments across all campaigns.</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. blueslion_1905"
          maxLength={30}
          className="flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="submit"
          disabled={isPending || !value.trim()}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </form>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}

// ─── Inline reply / post form ─────────────────────────────────────────────────

function CommentForm({
  demandId,
  parentCommentId = null,
  placeholder = 'Add to the discussion…',
  onSuccess,
}: {
  demandId: string
  parentCommentId?: string | null
  placeholder?: string
  onSuccess?: () => void
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [charCount, setCharCount] = useState(0)
  const MAX = 1000

  const boundPost = postComment.bind(null, demandId)
  const [state, formAction, isPending] = useActionState(boundPost, { error: null })

  const prevError = useRef(state.error)
  useEffect(() => {
    if (prevError.current !== null && state.error === null) {
      formRef.current?.reset()
      setCharCount(0)
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
      router.refresh()
      onSuccess?.()
    }
    prevError.current = state.error
  }, [state.error, router, onSuccess])

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget
    setCharCount(el.value.length)
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  return (
    <form ref={formRef} action={formAction}>
      {parentCommentId && (
        <input type="hidden" name="parent_comment_id" value={parentCommentId} />
      )}
      <textarea
        ref={textareaRef}
        name="body"
        rows={2}
        required
        maxLength={MAX}
        onInput={handleInput}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B] resize-none overflow-hidden"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className={`text-xs tabular-nums ${charCount > MAX * 0.9 ? 'text-amber-500' : 'text-gray-400'}`}>
          {charCount}/{MAX}
        </span>
        {state.error && <p className="text-xs text-red-600 flex-1">{state.error}</p>}
        <button
          type="submit"
          disabled={isPending || charCount === 0}
          className="rounded-lg bg-[#064E3B] px-4 py-2 text-sm font-semibold text-white hover:opacity-80 disabled:opacity-40 transition-opacity"
        >
          {isPending ? 'Posting…' : parentCommentId ? 'Reply' : 'Post'}
        </button>
      </div>
    </form>
  )
}

// ─── Single comment row ───────────────────────────────────────────────────────

function CommentRow({
  comment,
  isCurrentUser,
  isCommentByCreator,
  isCommentByOrgRep = false,
  orgName = '',
  canReply,
  demandId,
  isReply = false,
}: {
  comment: Comment
  isCurrentUser: boolean
  isCommentByCreator: boolean
  isCommentByOrgRep?: boolean
  orgName?: string
  canReply: boolean
  demandId: string
  isReply?: boolean
}) {
  const router = useRouter()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [deletePending, startDelete] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    startDelete(async () => {
      await deleteComment(comment.id)
      router.refresh()
    })
  }

  return (
    <div className="flex gap-3 group">
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${avatarColor(comment.user_id)}`}>
        {avatarInitials(comment.profile)}
      </div>
      <div className="flex-1 min-w-0">
        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs font-semibold text-gray-900">
            {displayName(comment.profile, isCurrentUser)}
          </span>
          {isCommentByCreator && (
            <span className="rounded-full bg-[#064E3B]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#064E3B]">
              Creator
            </span>
          )}
          {isCommentByOrgRep && !isCommentByCreator && (
            <span className="rounded-full bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">
              {orgName || 'Official'}
            </span>
          )}
          <span className="text-xs text-gray-400">{relativeTime(comment.created_at)}</span>
          {isCurrentUser && (
            <button
              onClick={handleDelete}
              disabled={deletePending}
              className={`ml-auto text-[10px] font-semibold transition-colors opacity-0 group-hover:opacity-100 ${
                confirmDelete ? 'text-red-500 opacity-100' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              {deletePending ? 'Deleting…' : confirmDelete ? 'Tap again to confirm' : 'Delete'}
            </button>
          )}
        </div>

        {/* Body */}
        <p className="text-sm text-gray-700 leading-relaxed">{comment.body}</p>

        {/* Reply button — top-level only */}
        {canReply && !isReply && (
          <button
            onClick={() => setShowReplyForm((v) => !v)}
            className="mt-1.5 text-xs font-semibold text-gray-400 hover:text-[#064E3B] transition-colors"
          >
            {showReplyForm ? 'Cancel' : 'Reply'}
          </button>
        )}

        {/* Inline reply form */}
        {showReplyForm && (
          <div className="mt-3">
            <CommentForm
              demandId={demandId}
              parentCommentId={comment.id}
              placeholder={`Reply to ${displayName(comment.profile, isCurrentUser)}…`}
              onSuccess={() => setShowReplyForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const INITIAL_VISIBLE = 20

export default function CommentsSection({
  demandId,
  comments,
  isAuthenticated,
  isSupporter,
  isCreator,
  isOrgRep,
  currentUserId,
  creatorUserId,
  hasNickname,
  orgName,
  orgRepUserIds,
}: Props) {
  const [showAll, setShowAll] = useState(false)
  const canComment = isAuthenticated && (isSupporter || isCreator || isOrgRep)
  const orgRepSet = new Set(orgRepUserIds)

  // Split into top-level (newest first) and replies grouped by parent
  const topLevel = comments.filter((c) => !c.parent_comment_id)
  const repliesByParent = comments
    .filter((c) => c.parent_comment_id)
    .reduce((map, c) => {
      const arr = map.get(c.parent_comment_id!) ?? []
      arr.push(c)
      map.set(c.parent_comment_id!, arr)
      return map
    }, new Map<string, Comment[]>())

  // Replies are shown oldest-first within each thread
  repliesByParent.forEach((arr) => arr.sort((a, b) => a.created_at.localeCompare(b.created_at)))

  const visible = showAll ? topLevel : topLevel.slice(0, INITIAL_VISIBLE)
  const hidden = topLevel.length - INITIAL_VISIBLE

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-[#064E3B]/[0.03] border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Discussion</h2>
        {comments.length > 0 && (
          <span className="text-xs text-gray-400">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </span>
        )}
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Post form at top — nickname prompt if not set yet */}
        {canComment && (
          <div className="pb-2 border-b border-gray-100">
            {hasNickname
              ? <CommentForm demandId={demandId} />
              : <NicknamePrompt />
            }
          </div>
        )}

        {/* Gates */}
        {!isAuthenticated && (
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-600">
            <a href="/auth/login" className="font-semibold text-gray-900 underline">Sign in</a>
            {' '}and support this campaign to join the discussion.
          </div>
        )}
        {isAuthenticated && !isSupporter && !isCreator && (
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">Support this campaign</span>
            {' '}to join the discussion.
          </div>
        )}

        {/* Empty state */}
        {topLevel.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            No comments yet — start the discussion.
          </p>
        )}

        {/* Threads */}
        {visible.length > 0 && (
          <ul className="space-y-6">
            {visible.map((comment) => {
              const replies = repliesByParent.get(comment.id) ?? []
              return (
                <li key={comment.id}>
                  <CommentRow
                    comment={comment}
                    isCurrentUser={comment.user_id === currentUserId}
                    isCommentByCreator={comment.user_id === creatorUserId}
                    isCommentByOrgRep={orgRepSet.has(comment.user_id)}
                    orgName={orgName}
                    canReply={canComment && hasNickname}
                    demandId={demandId}
                  />
                  {/* Replies */}
                  {replies.length > 0 && (
                    <ul className="mt-4 ml-10 space-y-4 border-l-2 border-gray-100 pl-4">
                      {replies.map((reply) => (
                        <li key={reply.id}>
                          <CommentRow
                            comment={reply}
                            isCurrentUser={reply.user_id === currentUserId}
                            isCommentByCreator={reply.user_id === creatorUserId}
                            isCommentByOrgRep={orgRepSet.has(reply.user_id)}
                            orgName={orgName}
                            canReply={false}
                            demandId={demandId}
                            isReply
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {/* Show more */}
        {!showAll && hidden > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            Show {hidden} older {hidden === 1 ? 'comment' : 'comments'}
          </button>
        )}
      </div>
    </div>
  )
}
