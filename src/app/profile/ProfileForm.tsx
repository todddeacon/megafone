'use client'

import { useActionState } from 'react'
import { updateProfile } from './actions'

interface Props {
  initialName: string
  initialNickname: string
}

export default function ProfileForm({ initialName, initialNickname }: Props) {
  const [state, action, pending] = useActionState(updateProfile, { error: null, success: false })

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Full name <span className="text-[#F59E0B]">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={initialName}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
          placeholder="Your full name"
        />
      </div>

      <div>
        <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
          Nickname <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          defaultValue={initialNickname}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
          placeholder="How you appear in comments"
        />
        <p className="mt-1 text-xs text-gray-400">If left blank, your initials will be used in comments.</p>
      </div>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}

      {state.success && (
        <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">Profile updated.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#064E3B] px-5 py-2 text-sm font-semibold text-white hover:opacity-80 disabled:opacity-50 transition-opacity"
      >
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
