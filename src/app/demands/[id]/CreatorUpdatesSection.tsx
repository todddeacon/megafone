interface Update {
  id: string
  body: string
  created_at: string
}

interface Props {
  updates: Update[]
  creatorName: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CreatorUpdatesSection({ updates, creatorName }: Props) {
  if (updates.length === 0) return null

  const sorted = [...updates].sort((a, b) => b.created_at.localeCompare(a.created_at))

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Updates by {creatorName ?? 'the creator'}
        </h2>
        <span className="text-xs font-semibold text-gray-400">{updates.length} {updates.length === 1 ? 'update' : 'updates'}</span>
      </div>

      <div className="divide-y divide-gray-100">
        {sorted.map((update) => (
          <div key={update.id} className="px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-900">{formatDate(update.created_at)}</p>
                <p className="text-xs text-gray-400">{formatTime(update.created_at)}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line pl-3.5">
              {update.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
