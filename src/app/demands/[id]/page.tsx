import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getCachedDemand } from '@/lib/cached-queries'
import ExpandableText from '@/components/ExpandableText'

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
import ReviewAgreeButton from './ReviewAgreeButton'
import ReviewOrgControls from './ReviewOrgControls'
import ReviewMediaGallery from './ReviewMediaGallery'
import ExchangeSection from './ExchangeSection'
import OfficialResponseForm from './OfficialResponseForm'
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
  // Petition-specific statuses
  accepted:          { label: 'Accepted',                className: 'bg-emerald-50 border-emerald-100 text-emerald-700',  dot: false },
  partially_accepted:{ label: 'Partially accepted',      className: 'bg-amber-50 border-amber-100 text-amber-700',        dot: false },
  rejected:          { label: 'Rejected',                className: 'bg-red-50 border-red-100 text-red-600',              dot: false },
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

  const { demand, comments, updates, videoLinks, notifications, reviewMedia, creatorName } = cachedData

  // Hide pending_review campaigns from everyone except the creator
  if (demand.moderation_status === 'pending_review' && user?.id !== demand.creator_user_id) notFound()
  if (demand.moderation_status === 'removed') notFound()

  // Per-user queries (not cached — depend on logged-in user)
  const cookieStore = await cookies()
  const agreeCookieId = cookieStore.get('mf_agree_id')?.value ?? null

  const [supportResult, orgRepResult, currentUserProfileResult, reviewAgreeResult] = await Promise.all([
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
    demand.campaign_type === 'review' && agreeCookieId
      ? (await import('@/lib/supabase/admin'))
          .createAdminClient()
          .from('review_agrees')
          .select('id')
          .eq('demand_id', id)
          .eq('cookie_id', agreeCookieId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  let isSupporter = !!supportResult.data
  let isCreator = user?.id === demand.creator_user_id
  let isOrgRep = !!orgRepResult.data
  const hasNickname = !!(currentUserProfileResult.data?.nickname)
  const hasAgreed = !!reviewAgreeResult.data

  // Admin "view as" mode — override role flags
  const isAdmin = user?.email === process.env.ADMIN_EMAIL
  if (isAdmin) {
    const cookieStore = await cookies()
    const viewMode = cookieStore.get('admin_view_mode')?.value

    if (viewMode === 'admin') {
      // See everything
      isCreator = true
      isOrgRep = true
      isSupporter = true
    } else if (viewMode === 'creator') {
      isCreator = true
      isOrgRep = false
      isSupporter = true
    } else if (viewMode === 'org_rep') {
      isCreator = false
      isOrgRep = true
      isSupporter = true
    } else if (viewMode === 'fan') {
      isCreator = false
      isOrgRep = false
      isSupporter = true
    }
  }

  // Fetch all org rep user IDs for this org (for comment badges)
  const adminForReps = (await import('@/lib/supabase/admin')).createAdminClient()
  const { data: orgRepUsers } = await adminForReps
    .from('org_reps')
    .select('user_id')
    .eq('organisation_id', demand.organisation_id)
  const orgRepUserIds = new Set((orgRepUsers ?? []).map((r) => r.user_id))

  const officialResponses = (updates as { id: string; type: string; body: string; pdf_url: string | null; video_url: string | null; link_url: string | null; link_title: string | null; created_at: string }[])
    .filter((u) => u.type === 'official_response')
  const hasResponse = officialResponses.length > 0

  const { label: statusLabel, className: statusClassName, dot: statusDot } =
    STATUS_CONFIG[demand.status] ?? { label: demand.status, className: 'bg-gray-100 border-transparent text-gray-500', dot: false }

  const allQuestions = (demand.questions ?? []) as { id: string; body: string; round: number; created_at: string }[]

  const creatorUpdates = (updates as { id: string; type: string; body: string; created_at: string }[])
    .filter((u) => u.type === 'update')

  const orgName = demand.organisation?.name ?? 'Organisation'
  const targetPerson = demand.target_person ?? null
  const orgTarget = targetPerson ? `${targetPerson} at ${orgName}` : orgName
  const isPetition = demand.campaign_type === 'petition'
  const isReview = demand.campaign_type === 'review'
  const hasOrg = !!demand.organisation
  const orgInitials = orgName.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('')

  // Reviewer display name for reviews
  let reviewerDisplayName: string | null = null
  if (isReview) {
    const mode = demand.reviewer_display_mode as 'real_name' | 'nickname' | 'anonymous' | null
    if (mode === 'anonymous') {
      reviewerDisplayName = 'Anonymous'
    } else if (mode === 'nickname') {
      const admin = (await import('@/lib/supabase/admin')).createAdminClient()
      const { data: prof } = await admin.from('profiles').select('nickname, name').eq('id', demand.creator_user_id).maybeSingle()
      reviewerDisplayName = prof?.nickname ?? prof?.name ?? 'Fan'
    } else {
      reviewerDisplayName = creatorName ?? 'Fan'
    }
  }
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
                {hasOrg ? (
                  <>
                    {demand.organisation?.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={demand.organisation.logo_url} alt={orgName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#064E3B]/10 border border-[#064E3B]/20 flex items-center justify-center text-xs font-bold text-[#064E3B] shrink-0">
                        {orgInitials}
                      </div>
                    )}
                    <a
                      href={`/organisations/${demand.organisation?.slug}`}
                      className="text-sm font-semibold text-gray-900 hover:underline transition-colors"
                    >
                      {orgName}
                    </a>
                    <span className="text-gray-200 text-xs">·</span>
                  </>
                ) : null}
                <span className="text-xs text-gray-400">{createdDate}</span>
                {isCreator && (
                  <>
                    <span className="text-gray-200 text-xs">·</span>
                    <a
                      href={isReview ? `/demands/${id}/edit-review` : `/demands/${id}/edit`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </a>
                  </>
                )}
                {isReview && demand.updated_at && (
                  <>
                    <span className="text-gray-200 text-xs">·</span>
                    <span
                      className="text-xs text-gray-400 italic"
                      title={`Edited ${new Date(demand.updated_at).toLocaleString('en-GB')}`}
                    >
                      edited
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  isReview
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : isPetition
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {isReview ? 'Review' : isPetition ? 'Petition' : 'Q&A'}
                </span>
              </div>

              {!isReview && (
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold mb-3 ${statusClassName}`}>
                  {statusDot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                  {statusLabel}
                </span>
              )}

              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#064E3B] leading-tight">
                {demand.headline}
              </h1>

              {isReview && demand.reviewing_subject && (
                <p className="mt-3 text-base font-medium text-gray-700">{demand.reviewing_subject}</p>
              )}

              {isReview && demand.rating !== null && demand.rating !== undefined && (
                <div className="mt-4 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <svg
                      key={n}
                      className={`w-6 h-6 ${n <= demand.rating ? 'text-[#F59E0B]' : 'text-gray-200'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.366 2.446c-.784.57-1.84-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.652 9.154c-.784-.57-.381-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-sm font-bold text-gray-700 tabular-nums">{demand.rating} / 5</span>
                </div>
              )}

              {isReview && reviewerDisplayName && (
                <p className="mt-3 text-sm text-gray-400">
                  Review by <span className="text-gray-600 font-medium">{reviewerDisplayName}</span>
                </p>
              )}

              {!isReview && creatorName && (
                <p className="mt-2 text-sm text-gray-400">
                  Campaign by <span className="text-gray-600 font-medium">{creatorName}</span>
                </p>
              )}
              {!isReview && targetPerson && (
                <p className="mt-1 text-sm text-gray-400">
                  Directed at <span className="text-gray-600 font-medium">{targetPerson}</span>
                </p>
              )}
            </div>

            {/* Review media gallery — images + video above the body text */}
            {isReview && reviewMedia && (reviewMedia as { id: string; kind: string; url: string }[]).length > 0 && (
              <ReviewMediaGallery
                media={(reviewMedia as { id: string; kind: 'image' | 'video'; url: string }[]).map((m) => ({
                  id: m.id,
                  kind: m.kind,
                  url: m.url,
                }))}
              />
            )}

            {/* Demand section (petition) — directly after headline/directed at */}
            {isPetition && demand.demand_text && (
              <div className="rounded-2xl overflow-hidden border border-[#064E3B]/20">
                <div className="px-6 py-4 bg-[#064E3B]">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                    Demand for {orgTarget}
                  </h2>
                </div>
                <div className="px-6 py-6 bg-gradient-to-b from-[#064E3B]/5 to-white">
                  <p className="text-base font-semibold text-[#064E3B] leading-relaxed">
                    &ldquo;{demand.demand_text}&rdquo;
                  </p>
                </div>
              </div>
            )}

            {/* Summary / context */}
            {demand.summary && (
              <div className="border-l-4 border-[#064E3B]/20 pl-4">
                <ExpandableText
                  text={demand.summary}
                  maxLines={3}
                  className="text-base text-gray-600 leading-relaxed"
                />
              </div>
            )}

            {/* Petition responses (no questions card) */}
            {isPetition && (officialResponses.length > 0 || isOrgRep) && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                    Response from {orgName}
                  </h2>
                  {officialResponses.length > 0 && (
                    <span className="text-xs font-semibold text-emerald-600">
                      {officialResponses.length} {officialResponses.length === 1 ? 'response' : 'responses'}
                    </span>
                  )}
                </div>

                {officialResponses.length > 0 && (
                  <ExchangeSection
                    demandId={id}
                    questions={[]}
                    officialResponses={officialResponses}
                    orgName={orgName}
                    orgTarget={orgTarget}
                    isOrgRep={isOrgRep}
                    isCreator={isCreator}
                  />
                )}

                {isOrgRep && (
                  <div className="border-t border-emerald-100">
                    <OfficialResponseForm demandId={id} />
                  </div>
                )}
              </div>
            )}

            {/* Review: public org responses + org controls */}
            {isReview && officialResponses.length > 0 && (
              <div className="rounded-2xl overflow-hidden border border-emerald-200 bg-white">
                <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-100">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                    Response from {orgName}
                  </h2>
                </div>
                <div className="px-6 py-5 space-y-4">
                  {officialResponses.map((r) => (
                    <div key={r.id}>
                      <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{r.body}</p>
                      <p className="mt-2 text-xs text-gray-400">
                        {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isReview && isOrgRep && (
              <ReviewOrgControls
                demandId={id}
                orgName={orgName}
                isResolved={!!demand.resolved_by_org}
                hasReply={officialResponses.length > 0}
              />
            )}

            {/* Questions + responses exchange (Q&A only) */}
            {!isPetition && !isReview && (allQuestions.length > 0 || isOrgRep) && (
              <ExchangeSection
                demandId={id}
                questions={allQuestions}
                officialResponses={officialResponses}
                orgName={orgName}
                orgTarget={orgTarget}
                isOrgRep={isOrgRep}
                isCreator={isCreator}
              />
            )}

            {/* Mobile-only support panel — shown after questions */}
            <div className="lg:hidden">
              {isReview ? (
                <ReviewAgreeButton
                  demandId={id}
                  supportCount={demand.support_count_cache ?? 0}
                  hasAgreed={hasAgreed}
                  rating={demand.rating ?? null}
                  reviewingSubject={demand.reviewing_subject ?? null}
                />
              ) : (
                <SupportButton
                  demandId={id}
                  isAuthenticated={!!user}
                  isEmailVerified={!!user?.email_confirmed_at}
                  isSupported={isSupporter}
                  supportCount={demand.support_count_cache}
                  questionCount={allQuestions.length}
                  notificationThreshold={demand.notification_threshold ?? null}
                  headline={demand.headline}
                  orgName={orgTarget}
                />
              )}
            </div>

            {/* Creator: add follow-up questions + notify org (Q&A only) */}
            {!isPetition && isCreator && (demand.status === 'responded' || demand.status === 'further_questions') && (
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
            <CreatorUpdatesSection updates={creatorUpdates} creatorName={creatorName} isCreator={isCreator} demandId={id} />

            {/* Related videos */}
            <RelatedVideosSection demandId={id} links={videoLinks} isCreator={isCreator} />

            {/* Comments */}
            <CommentsSection
              demandId={id}
              comments={comments}
              isAuthenticated={!!user}
              isSupporter={isSupporter}
              isCreator={isCreator}
              isOrgRep={isOrgRep}
              currentUserId={user?.id ?? null}
              creatorUserId={demand.creator_user_id}
              hasNickname={hasNickname}
              orgName={orgName}
              orgRepUserIds={[...orgRepUserIds]}
            />

          </div>

          {/* ── Right column: sticky sidebar ── */}
          <div className="lg:sticky lg:top-6 space-y-4">

            {/* Support panel — hidden on mobile (shown inline after questions instead) */}
            <div className="hidden lg:block">
              {isReview ? (
                <ReviewAgreeButton
                  demandId={id}
                  supportCount={demand.support_count_cache ?? 0}
                  hasAgreed={hasAgreed}
                  rating={demand.rating ?? null}
                  reviewingSubject={demand.reviewing_subject ?? null}
                />
              ) : (
                <SupportButton
                  demandId={id}
                  isAuthenticated={!!user}
                  isEmailVerified={!!user?.email_confirmed_at}
                  isSupported={isSupporter}
                  supportCount={demand.support_count_cache}
                  questionCount={allQuestions.length}
                  notificationThreshold={demand.notification_threshold ?? null}
                  headline={demand.headline}
                  orgName={orgTarget}
                />
              )}
            </div>

            {/* Campaign progress (not shown for reviews — different lifecycle) */}
            {!isReview && (
              <CampaignStatus
                status={demand.status}
                createdAt={demand.created_at}
                notifiedAt={notifiedAt}
                respondedAt={officialResponses[0]?.created_at ?? null}
                orgName={orgName}
                isPetition={isPetition}
              />
            )}

            {/* Creator: mark outcome */}
            {!isReview && isCreator && demand.status === 'responded' && (
              <CreatorResolution demandId={id} isPetition={isPetition} />
            )}


          </div>

        </div>
      </div>
    </div>
  )
}
