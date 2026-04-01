import OfficialResponseForm from './OfficialResponseForm'

interface Question {
  id: string
  body: string
  round: number
  created_at: string
}

interface OfficialResponse {
  id: string
  body: string | null
  pdf_url: string | null
  video_url: string | null
  created_at: string
}

interface Props {
  demandId: string
  questions: Question[]
  officialResponses: OfficialResponse[]
  orgName: string
  isOrgRep: boolean
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function ResponseAttachments({ response }: { response: OfficialResponse }) {
  return (
    <>
      {response.pdf_url && (
        <a
          href={response.pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-white text-xs font-semibold text-emerald-700 hover:border-emerald-400 transition-colors"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          View official response (PDF)
        </a>
      )}
      {response.video_url && (
        <div className="rounded-xl overflow-hidden border border-emerald-200">
          <video
            src={response.video_url}
            controls
            className="w-full max-h-80 bg-black"
          />
        </div>
      )}
    </>
  )
}

function ResponseBlock({ response, orgName }: { response: OfficialResponse; orgName: string }) {
  return (
    <div className="px-6 py-5 border-t border-emerald-100 bg-emerald-50/40 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
          Response from {orgName}
        </span>
        <span className="text-xs text-gray-400 ml-auto">{formatDate(response.created_at)}</span>
      </div>
      {response.body && (
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
          {response.body}
        </p>
      )}
      <ResponseAttachments response={response} />
    </div>
  )
}

export default function ExchangeSection({
  demandId,
  questions,
  officialResponses,
  orgName,
  isOrgRep,
}: Props) {
  if (questions.length === 0 && !isOrgRep) return null

  const isMultiRound = questions.some((q) => q.round > 1)
  const totalCount = questions.length

  if (!isMultiRound) {
    // Single-round: clean display with no round labels
    const sortedQuestions = [...questions].sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    )
    const response = officialResponses[0] ?? null

    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-[#064E3B]/[0.03] border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Questions for {orgName}
          </h2>
          <span className="text-xs text-gray-400">
            {totalCount} {totalCount === 1 ? 'question' : 'questions'}
          </span>
        </div>

        {sortedQuestions.length > 0 && (
          <ol className="divide-y divide-gray-100 list-none">
            {sortedQuestions.map((q, i) => (
              <li key={q.id} className="flex gap-4 px-6 py-5 group">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#064E3B]/[0.06] text-[#064E3B] text-xs font-bold flex items-center justify-center mt-0.5 group-hover:bg-[#064E3B]/10 transition-colors">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-800 leading-relaxed">{q.body}</span>
              </li>
            ))}
          </ol>
        )}

        {response && <ResponseBlock response={response} orgName={orgName} />}

        {isOrgRep && (
          <div className="border-t border-gray-100">
            <OfficialResponseForm demandId={demandId} />
          </div>
        )}
      </div>
    )
  }

  // Multi-round: show each round as a labelled card
  const maxRound = Math.max(...questions.map((q) => q.round))

  return (
    <div className="space-y-4">
      {Array.from({ length: maxRound }, (_, i) => i + 1).map((round) => {
        const roundQuestions = questions
          .filter((q) => q.round === round)
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
        const previousCount = questions.filter((q) => q.round < round).length
        const response = officialResponses[round - 1] ?? null
        const isActiveRound = !response
        const roundLabel =
          round === 1 ? 'Round 1 — Initial questions' : `Round ${round} — Follow-up questions`

        return (
          <div key={round} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Round header */}
            <div
              className={`px-6 py-3.5 border-b flex items-center justify-between ${
                isActiveRound
                  ? 'bg-[#064E3B] border-[#064E3B]'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <span
                className={`text-xs font-bold uppercase tracking-widest ${
                  isActiveRound ? 'text-emerald-200' : 'text-gray-500'
                }`}
              >
                {roundLabel}
              </span>
              {isActiveRound ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Awaiting response
                </span>
              ) : (
                response && (
                  <span className="text-xs text-gray-400">{formatDate(response.created_at)}</span>
                )
              )}
            </div>

            {/* Questions */}
            {roundQuestions.length > 0 && (
              <ol className="divide-y divide-gray-100 list-none">
                {roundQuestions.map((q, i) => (
                  <li key={q.id} className="flex gap-4 px-6 py-5 group">
                    <span
                      className={`shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 transition-colors ${
                        round === 1
                          ? 'bg-[#064E3B]/[0.06] text-[#064E3B] group-hover:bg-[#064E3B]/10'
                          : 'bg-amber-50 border border-amber-100 text-amber-600'
                      }`}
                    >
                      {previousCount + i + 1}
                    </span>
                    <span className="text-sm text-gray-800 leading-relaxed">{q.body}</span>
                  </li>
                ))}
              </ol>
            )}

            {/* Response */}
            {response && <ResponseBlock response={response} orgName={orgName} />}

            {/* Org response form on the last unanswered round */}
            {isOrgRep && isActiveRound && round === maxRound && (
              <div className="border-t border-gray-100">
                <OfficialResponseForm demandId={demandId} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
