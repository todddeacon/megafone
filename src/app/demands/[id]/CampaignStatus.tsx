'use client'

interface Props {
  status: string
  createdAt: string
  notifiedAt: string | null
  respondedAt: string | null
  orgName: string
}

function daysBetween(from: string, to?: string | null): number {
  const start = new Date(from)
  const end = to ? new Date(to) : new Date()
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

type StepState = 'done' | 'active' | 'pending' | 'future'

function getStates(status: string): StepState[] {
  // [launched, building, notified, awaiting, responded, resolution]
  switch (status) {
    case 'building':
    case 'live':
      return ['done', 'active', 'future', 'future', 'future', 'future']
    case 'notified':
      return ['done', 'done', 'done', 'active', 'future', 'future']
    case 'responded':
      return ['done', 'done', 'done', 'done', 'done', 'pending']
    case 'resolved':
    case 'unsatisfactory':
    case 'further_questions':
      return ['done', 'done', 'done', 'done', 'done', 'done']
    default:
      return ['done', 'active', 'future', 'future', 'future', 'future']
  }
}

const RESOLUTION = {
  resolved:           { label: 'Resolved',                icon: '✓', bg: 'bg-green-500',  text: 'text-green-700',  ring: 'ring-green-100'  },
  unsatisfactory:     { label: 'Unsatisfactory Response', icon: '✕', bg: 'bg-red-500',    text: 'text-red-600',    ring: 'ring-red-100'    },
  further_questions:  { label: 'Further Questions Asked', icon: '?', bg: 'bg-amber-500',  text: 'text-amber-700',  ring: 'ring-amber-100'  },
} as const

function CheckIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function StepCircle({ state, resolutionStatus }: { state: StepState; resolutionStatus?: string }) {
  if (state === 'done') {
    if (resolutionStatus && resolutionStatus in RESOLUTION) {
      const r = RESOLUTION[resolutionStatus as keyof typeof RESOLUTION]
      return (
        <div className={`w-6 h-6 rounded-full ${r.bg} flex items-center justify-center text-white text-xs font-bold shrink-0 ring-4 ${r.ring}`}>
          {r.icon}
        </div>
      )
    }
    return (
      <div className="w-6 h-6 rounded-full bg-[#064E3B] flex items-center justify-center text-white shrink-0">
        <CheckIcon />
      </div>
    )
  }
  if (state === 'active') {
    return (
      <div className="w-6 h-6 rounded-full bg-[#F59E0B] flex items-center justify-center shrink-0 ring-4 ring-orange-100">
        <div className="w-2 h-2 rounded-full bg-white" />
      </div>
    )
  }
  if (state === 'pending') {
    return (
      <div className="w-6 h-6 rounded-full bg-white border-2 border-amber-300 flex items-center justify-center shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      </div>
    )
  }
  return (
    <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-200 shrink-0" />
  )
}

function Step({
  state,
  label,
  date,
  meta,
  resolutionStatus,
  isLast = false,
}: {
  state: StepState
  label: string
  date?: string | null
  meta?: React.ReactNode
  resolutionStatus?: string
  isLast?: boolean
}) {
  const labelColor =
    state === 'active'  ? 'text-[#F59E0B] font-semibold' :
    state === 'done'    ? 'text-gray-900 font-medium' :
    state === 'pending' ? 'text-amber-600 font-medium' :
    'text-gray-400'

  return (
    <div className="flex gap-3">
      {/* Left: circle + connector */}
      <div className="flex flex-col items-center">
        <StepCircle state={state} resolutionStatus={resolutionStatus} />
        {!isLast && (
          <div className={`w-px flex-1 mt-1 mb-1 min-h-[24px] ${state === 'done' ? 'bg-gray-200' : 'bg-gray-100'}`} />
        )}
      </div>

      {/* Right: content */}
      <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-4'}`}>
        <div className="flex items-center justify-between gap-2 min-h-[24px]">
          <span className={`text-sm ${labelColor}`}>{label}</span>
          {date && (
            <span className="text-xs text-gray-400 shrink-0 tabular-nums">{date}</span>
          )}
        </div>
        {meta && <div className="mt-1">{meta}</div>}
      </div>
    </div>
  )
}

export default function CampaignStatus({ status, createdAt, notifiedAt, respondedAt, orgName }: Props) {
  const states = getStates(status)
  const isTerminal = ['resolved', 'unsatisfactory', 'further_questions'].includes(status)
  const resolution = isTerminal ? RESOLUTION[status as keyof typeof RESOLUTION] : null

  const awaitingDays = notifiedAt ? daysBetween(notifiedAt, respondedAt) : null
  const isStillAwaiting = status === 'notified' && notifiedAt

  const responseTime = notifiedAt && respondedAt ? daysBetween(notifiedAt, respondedAt) : null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-[#064E3B]/[0.03] border-b border-gray-100">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Campaign Progress</h2>
      </div>

      <div className="p-6">
      <Step
        state={states[0]}
        label="Campaign Launched"
        date={fmt(createdAt)}
      />

      <Step
        state={states[1]}
        label="Building Supporters"
        date={states[1] === 'done' && notifiedAt ? fmt(notifiedAt) : undefined}
      />

      <Step
        state={states[2]}
        label={`${orgName} Notified`}
        date={states[2] === 'done' && notifiedAt ? fmt(notifiedAt) : undefined}
      />

      <Step
        state={states[3]}
        label="Awaiting Response"
        date={
          states[3] === 'done' && responseTime !== null
            ? `${responseTime} ${responseTime === 1 ? 'day' : 'days'} to respond`
            : undefined
        }
        meta={
          isStillAwaiting && awaitingDays !== null ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-100 px-2.5 py-0.5 text-xs font-semibold text-[#F59E0B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
              {awaitingDays === 0 ? 'Notified today' : `${awaitingDays} ${awaitingDays === 1 ? 'day' : 'days'} elapsed`}
            </span>
          ) : undefined
        }
      />

      <Step
        state={states[4]}
        label="Responded"
        date={states[4] === 'done' && respondedAt ? fmt(respondedAt) : undefined}
      />

      <Step
        state={states[5]}
        isLast
        label={
          states[5] === 'done' && resolution ? resolution.label :
          states[5] === 'pending' ? 'Resolution Pending' :
          'Resolution'
        }
        resolutionStatus={isTerminal ? status : undefined}
        meta={
          states[5] === 'pending' ? (
            <p className="text-xs text-amber-500">The campaign creator needs to mark the outcome.</p>
          ) : undefined
        }
      />
      </div>
    </div>
  )
}
