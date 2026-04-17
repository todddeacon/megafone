interface Update {
  id: string
  body: string
  created_at: string
}

interface Props {
  updates: Update[]
  creatorName: string | null
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
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

      <div className="px-6 py-5">
        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-[#064E3B]/15 rounded-full" />

          <div className="space-y-6">
            {sorted.map((update, i) => (
              <div key={update.id} className="relative pl-7">
                {/* Dot */}
                <div className={`absolute left-0 top-1 w-[11px] h-[11px] rounded-full border-2 ${
                  i === 0
                    ? 'bg-[#064E3B] border-[#064E3B]'
                    : 'bg-white border-[#064E3B]/30'
                }`} />

                {/* Badge for latest */}
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-xs font-semibold text-gray-500">{formatDate(update.created_at)}</p>
                  <span className="text-[10px] text-gray-400">{timeAgo(update.created_at)}</span>
                  {i === 0 && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#064E3B] bg-[#064E3B]/10 rounded-full px-2 py-0.5">
                      Latest
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {update.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
