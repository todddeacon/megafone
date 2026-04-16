'use client'

interface TickerItem {
  name: string
  headline: string
  timeAgo: string
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function ActivityTicker({ items }: { items: { name: string; headline: string; created_at: string }[] }) {
  if (items.length === 0) return null

  const tickerItems: TickerItem[] = items.map((item) => ({
    name: item.name,
    headline: item.headline.length > 40 ? item.headline.slice(0, 40) + '...' : item.headline,
    timeAgo: timeAgo(item.created_at),
  }))

  // Duplicate items to create seamless loop
  const doubled = [...tickerItems, ...tickerItems]

  return (
    <div className="bg-[#064E3B] overflow-hidden">
      <div className="relative flex">
        <div className="flex animate-marquee whitespace-nowrap py-2">
          {doubled.map((item, i) => (
            <span key={i} className="mx-6 inline-flex items-center gap-1.5 text-xs text-emerald-200">
              <span className="font-semibold text-white">{item.name}</span>
              <span>supported</span>
              <span className="text-emerald-300">&ldquo;{item.headline}&rdquo;</span>
              <span className="text-emerald-400/60">&middot; {item.timeAgo}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
