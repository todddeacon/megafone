'use client'

import { useTransition, useState } from 'react'
import { deleteCommentAsAdmin } from './actions'

export default function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleClick() {
    if (!confirming) {
      setConfirming(true)
      return
    }

    startTransition(async () => {
      await deleteCommentAsAdmin(commentId)
      setConfirming(false)
    })
  }

  return (
    <button
      onClick={handleClick}
      onBlur={() => setConfirming(false)}
      disabled={isPending}
      className={`text-xs font-medium px-2.5 py-1 rounded transition-colors ${
        confirming
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'text-red-600 hover:bg-red-50'
      } disabled:opacity-50`}
    >
      {isPending ? 'Deleting...' : confirming ? 'Confirm?' : 'Delete'}
    </button>
  )
}
