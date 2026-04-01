export type TimelineEventType =
  | 'demand_created'
  | 'creator_update'
  | 'followup_question'
  | 'official_response'
  | 'org_notified'

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  timestamp: string
  body?: string
}

// Internal type for rendering — follow-up questions on the same date are merged
type RenderEvent =
  | (TimelineEvent & { bodies?: undefined })
  | { id: string; type: 'followup_question'; timestamp: string; bodies: string[] }

const EVENT_LABELS: Record<TimelineEventType, string> = {
  demand_created: 'Megafone created',
  creator_update: 'Creator update',
  followup_question: 'Follow-up questions added',
  official_response: 'Official response',
  org_notified: 'Organisation notified',
}

const EVENT_COLORS: Record<TimelineEventType, string> = {
  demand_created: 'bg-[#0B0B0B]',
  creator_update: 'bg-gray-400',
  followup_question: 'bg-[#FF3B00]',
  official_response: 'bg-green-500',
  org_notified: 'bg-[#FF3B00]',
}

function toDateKey(ts: string) {
  return ts.slice(0, 10) // "YYYY-MM-DD"
}

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Group consecutive followup_question events that share the same date into one entry
function groupEvents(events: TimelineEvent[]): RenderEvent[] {
  const result: RenderEvent[] = []

  for (let i = 0; i < events.length; i++) {
    const event = events[i]

    if (event.type !== 'followup_question') {
      result.push(event)
      continue
    }

    const dateKey = toDateKey(event.timestamp)
    const bodies: string[] = event.body ? [event.body] : []

    // Consume following followup_question events on the same date
    while (
      i + 1 < events.length &&
      events[i + 1].type === 'followup_question' &&
      toDateKey(events[i + 1].timestamp) === dateKey
    ) {
      i++
      if (events[i].body) bodies.push(events[i].body!)
    }

    result.push({ id: event.id, type: 'followup_question', timestamp: event.timestamp, bodies })
  }

  return result
}

export default function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) return null

  const renderEvents = groupEvents(events)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">
        Timeline
      </h2>

      <ol className="relative space-y-0">
        {renderEvents.map((event, i) => {
          const isLast = i === renderEvents.length - 1
          return (
            <li key={event.id} className="flex gap-4">
              {/* Spine */}
              <div className="flex flex-col items-center">
                <div
                  className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${EVENT_COLORS[event.type]}`}
                />
                {!isLast && <div className="w-px flex-1 bg-gray-100 mt-1" />}
              </div>

              {/* Content */}
              <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-6'}`}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {EVENT_LABELS[event.type]}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{formatTimestamp(event.timestamp)}</p>

                {'bodies' in event && event.bodies && event.bodies.length > 0 ? (
                  <ol className="mt-2 space-y-1 list-none">
                    {event.bodies.map((body, j) => (
                      <li key={j} className="flex gap-2 text-sm text-gray-700">
                        <span className="shrink-0 text-gray-400">{j + 1}.</span>
                        <span>{body}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  'body' in event && event.body && (
                    <p className="mt-2 text-sm text-gray-700 leading-relaxed">{event.body}</p>
                  )
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
