import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCachedDemand } from '@/lib/cached-queries'

export async function generateMetadata({ params }: PageProps<'/demands/[id]'>): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: demand } = await supabase
    .from('demands')
    .select('headline, summary, support_count_cache, organisation:organisations(name)')
    .eq('id', id)
    .single()

  if (!demand) return { title: 'Campaign not found' }

  const orgName = (demand.organisation as unknown as { name: string } | null)?.name ?? 'an organisation'
  const description = demand.summary?.slice(0, 160) ?? `A fan campaign directed at ${orgName} on Megafone.`
  const count = demand.support_count_cache ?? 0
  const meta = `${count.toLocaleString()} supporter${count !== 1 ? 's' : ''} · ${orgName}`

  const ogUrl = `/api/og?${new URLSearchParams({
    title: demand.headline,
    subtitle: orgName,
    meta,
  })}`

  return {
    title: demand.headline,
    description,
    openGraph: {
      title: demand.headline,
      description,
      type: 'article',
      images: [{ url: ogUrl, width: 1200, height: 630, alt: demand.headline }],
    },
    twitter: {
      card: 'summary_large_image',
      title: demand.headline,
      description,
      images: [ogUrl],
    },
  }
}

import SupportButton from './SupportButton'
import ExchangeSection from './ExchangeSection'
import FollowUpCreatorTools from './FollowUpCreatorTools'
import CreatorUpdateForm from './CreatorUpdateForm'
import CreatorUpdatesSection from './CreatorUpdatesSection'
import CommentsSection from './CommentsSection'
import RelatedVideosSection from './RelatedVideosSection'
import CampaignStatus from './CampaignStatus'
import CreatorResolution from './CreatorResolution'

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: boolean }> = {
  building:          { label: 'Building support',       className: 'bg-gray-100 border-transparent text-gray-500',      dot: false },
  live:              { label: 'Active',                  className: 'bg-blue-50 border-blue-100 text-blue-600',           dot: true  },
  notified:          { label: 'Awaiting response',       className: 'bg-amber-50 border-amber-100 text-amber-700',        dot: true  },
  responded:         { label: 'Responded',               className: 'bg-emerald-50 border-emerald-100 text-emerald-700',  dot: false },
  further_questions: { label: 'Further questions',       className: 'bg-amber-50 border-amber-100 text-amber-700',        dot: false },
  resolved:          { label: 'Resolved',                className: 'bg-emerald-50 border-emerald-100 text-emerald-700',  dot: false },
  unsatisfactory:    { label: 'Unsatisfactory response', className: 'bg-red-50 border-red-100 text-red-600',              dot: false },
  not_relevant:      { label: 'No longer relevant',      className: 'bg-gray-100 border-transparent text-gray-400',      dot: false },
}

export default async function DemandPage({ params }: PageProps<'/demands/[id]'>) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch cached public data and user auth in parallel
  const [cachedData, { data: { user } }] = await Promise.all([
    getCachedDemand(id),
    supabase.auth.getUser(),
  ])

  if (!cachedData) notFound()

  const { demand, comments, updates, videoLinks, notifications, creatorName } = cachedData

  // Hide pending_review campaigns from everyone except the creator
  if (demand.moderation_status === 'pending_review' && user?.id !== demand.creator_user_id) notFound()
  if (demand.moderation_status === 'removed') notFound()

  // Per-user queries (not cached — depend on logged-in user)
  const [supportResult, orgRepResult, currentUserProfileResult] = await Promise.all([
    user
      ? supabase.from('supports').select('id').eq('demand_id', id).eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from('org_reps')
          .select('id')
          .eq('user_id', user.id)
          .eq('organisation_id', demand.organisation_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase.from('profiles').select('nickname').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const isSupporter = !!supportResult.data
  const isCreator = user?.id === demand.creator_user_id
  const isOrgRep = !!orgRepResult.data
  const hasNickname = !!(currentUserProfileResult.data?.nickname)

  const officialResponses = (updates as { id: string; type: string; body: string; pdf_url: string | null; video_url: string | null; created_at: string }[])
    .filter((u) => u.type === 'official_response')
  const hasResponse = officialResponses.length > 0

  const { label: statusLabel, className: statusClassName, dot: statusDot } =
    STATUS_CONFIG[demand.status] ?? { label: demand.status, className: 'bg-gray-100 border-transparent text-gray-500', dot: false }

  const allQuestions = (demand.questions ?? []) as { id: string; body: string; round: number; created_at: string }[]

  const creatorUpdates = (updates as { id: string; type: string; body: string; created_at: string }[])
    .filter((u) => u.type === 'update')

  const orgName = demand.organisation?.name ?? 'Organisation'
  const orgInitials = orgName.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('')
  const createdDate = new Date(demand.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  const showAwaitingPlaceholder = demand.status === 'notified' && !hasResponse && !isOrgRep
  const notifiedAt = (notifications as { sent_at: string }[])[0]?.sent_at ?? null

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main layout */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">

          {/* ── Left column: campaign content ── */}
          <div className="space-y-7 min-w-0">

            {/* Moderation notice — creator only */}
            {demand.moderation_status === 'pending_review' && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex gap-3">
                <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Your campaign is under review</p>
                  <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                    Our team is reviewing this campaign before it goes public. This usually takes a few hours. You'll be able to see it here in the meantime.
                  </p>
                </div>
              </div>
            )}

            {/* Campaign identity */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#064E3B]/10 border border-[#064E3B]/20 flex items-center justify-center text-xs font-bold text-[#064E3B] shrink-0">
                  {orgInitials}
                </div>
                <a
                  href={`/organisations/${demand.organisation?.slug}`}
                  className="text-sm font-semibold text-gray-900 hover:underline transition-colors"
                >
                  {orgName}
                </a>
                <span className="text-gray-200 text-xs">·</span>
                <span className="text-xs text-gray-400">{createdDate}</span>
                {isCreator && (
                  <>
                    <span className="text-gray-200 text-xs">·</span>
                    <a
                      href={`/demands/${id}/edit`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </a>
                  </>
                )}
              </div>

              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold mb-3 ${statusClassName}`}>
                {statusDot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                {statusLabel}
              </span>

              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#064E3B] leading-tight">
                {demand.headline}
              </h1>

              {creatorName && (
                <p className="mt-2 text-sm text-gray-400">
                  Campaign by <span className="text-gray-600 font-medium">{creatorName}</span>
                </p>
              )}
            </div>

            {/* Summary */}
            {demand.summary && (
              <p className="text-base text-gray-600 leading-relaxed border-l-4 border-[#064E3B]/20 pl-4 whitespace-pre-line">
                {demand.summary}
              </p>
            )}

            {/* Questions + responses exchange */}
            {(allQuestions.length > 0 || isOrgRep) && (
              <ExchangeSection
                demandId={id}
                questions={allQuestions}
                officialResponses={officialResponses}
                orgName={orgName}
                isOrgRep={isOrgRep}
              />
            )}

            {/* Mobile-only support panel — shown after questions */}
            <div className="lg:hidden">
              <SupportButton
                demandId={id}
                isAuthenticated={!!user}
                isEmailVerified={!!user?.email_confirmed_at}
                isSupported={isSupporter}
                supportCount={demand.support_count_cache}
                questionCount={allQuestions.length}
                notificationThreshold={demand.notification_threshold ?? null}
                headline={demand.headline}
                orgName={orgName}

              />
            </div>

            {/* Creator: add follow-up questions + notify org */}
            {isCreator && (demand.status === 'responded' || demand.status === 'further_questions') && (
              <FollowUpCreatorTools
                demandId={id}
                orgName={orgName}
                status={demand.status}
              />
            )}

            {/* Awaiting response placeholder */}
            {showAwaitingPlaceholder && (
              <div className="rounded-2xl border border-dashed border-amber-200 bg-gradient-to-br from-amber-50/60 to-orange-50/30 px-6 py-7">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse inline-block" />
                  </div>
                  <div>
                    <p className="font-bold text-amber-900 text-sm">{orgName} has been notified — waiting for a response</p>
                    {notifiedAt && (
                      <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                        The organisation received this campaign on{' '}
                        <strong>{new Date(notifiedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
                        All supporters will be emailed the moment a response is posted.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Creator updates */}
            <CreatorUpdatesSection updates={creatorUpdates} creatorName={creatorName} />

            {/* Related videos */}
            <RelatedVideosSection demandId={id} links={videoLinks} isCreator={isCreator} />

            {/* Comments */}
            <CommentsSection
              demandId={id}
              comments={comments}
              isAuthenticated={!!user}
              isSupporter={isSupporter}
              isCreator={isCreator}
              currentUserId={user?.id ?? null}
              creatorUserId={demand.creator_user_id}
              hasNickname={hasNickname}
            />

          </div>

          {/* ── Right column: sticky sidebar ── */}
          <div className="lg:sticky lg:top-6 space-y-4">

            {/* Support panel — hidden on mobile (shown inline after questions instead) */}
            <div className="hidden lg:block">
            <SupportButton
              demandId={id}
              isAuthenticated={!!user}
              isEmailVerified={!!user?.email_confirmed_at}
              isSupported={isSupporter}
              supportCount={demand.support_count_cache}
              questionCount={allQuestions.length}
              notificationThreshold={demand.notification_threshold ?? null}
              headline={demand.headline}
              orgName={orgName}
            />
            </div>

            {/* Campaign progress */}
            <CampaignStatus
              status={demand.status}
              createdAt={demand.created_at}
              notifiedAt={notifiedAt}
              respondedAt={officialResponses[0]?.created_at ?? null}
              orgName={orgName}
            />

            {/* Creator: mark outcome */}
            {isCreator && demand.status === 'responded' && (
              <CreatorResolution demandId={id} />
            )}

            {/* Creator: post an update */}
            {isCreator && <CreatorUpdateForm demandId={id} />}

          </div>

        </div>
      </div>
    </div>
  )
}
