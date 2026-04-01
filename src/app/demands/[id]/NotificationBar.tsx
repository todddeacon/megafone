interface Notification {
  id: string
  sent_at: string
}

interface Props {
  notifications: Notification[]
  hasResponse: boolean
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function NotificationBar({ notifications, hasResponse }: Props) {
  const count = notifications.length
  const last = count > 0 ? notifications[notifications.length - 1] : null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
      {/* Notification status */}
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${count > 0 ? 'bg-[#FF3B00]' : 'bg-gray-300'}`}
        />
        {count === 0 ? (
          <span className="text-gray-500">Organisation not yet notified</span>
        ) : (
          <span className="text-gray-700">
            Notified{' '}
            <span className="font-semibold text-gray-900">
              {count} {count === 1 ? 'time' : 'times'}
            </span>
            {last && (
              <span className="text-gray-400"> — last {formatDate(last.sent_at)}</span>
            )}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-4 bg-gray-200" />

      {/* Response status */}
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${hasResponse ? 'bg-green-500' : 'bg-gray-300'}`}
        />
        {hasResponse ? (
          <span className="font-semibold text-green-700">Official response received</span>
        ) : (
          <span className="text-gray-500">No official response received</span>
        )}
      </div>
    </div>
  )
}
