'use server'

import { createClient } from '@/lib/supabase/server'
import {
  sendWelcomeSupporterEmail,
  sendCampaignSentEmail,
  sendCampaignResolvedEmail,
  sendCreatorUpdateEmail,
  sendThresholdEmail,
  sendResponseEmail,
  sendFollowUpEmail,
  sendCreatorFirstSupporterEmail,
  sendCreatorMilestoneEmail,
  sendCreatorTargetReachedEmail,
  sendCreatorResponseReceivedEmail,
  sendCreatorWeeklyDigestEmail,
} from '@/lib/email'

function isAdmin(email: string) {
  return email === process.env.ADMIN_EMAIL
}

export type TestEmailState = { error: string | null; success?: string }

export async function sendTestEmail(
  emailType: string,
  recipientEmail?: string
): Promise<TestEmailState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !isAdmin(user.email)) return { error: 'Access denied.' }

  const to = recipientEmail?.trim() || user.email
  const demandId = 'test-000'
  const orgName = 'Everton FC'
  const demandHeadline = 'Why are season ticket prices increasing by 15% next year?'
  const creatorName = 'Jamie Wilson'
  const supportCount = 2847
  const threshold = 2500

  try {
    switch (emailType) {
      case 'welcome-supporter':
        await sendWelcomeSupporterEmail({
          to,
          creatorName,
          orgName,
          demandHeadline,
          demandId,
          supportCount,
        })
        break

      case 'campaign-sent':
        await sendCampaignSentEmail({
          to: [to],
          orgName,
          demandHeadline,
          demandId,
          supportCount,
          threshold,
        })
        break

      case 'campaign-resolved':
        await sendCampaignResolvedEmail({
          to: [to],
          creatorName,
          orgName,
          demandHeadline,
          demandId,
          supportCount,
          resolution: 'resolved',
        })
        break

      case 'campaign-unsatisfactory':
        await sendCampaignResolvedEmail({
          to: [to],
          creatorName,
          orgName,
          demandHeadline,
          demandId,
          supportCount,
          resolution: 'unsatisfactory',
        })
        break

      case 'creator-update':
        await sendCreatorUpdateEmail({
          to: [to],
          creatorName,
          demandHeadline,
          demandId,
          updateBody: 'Just had a meeting with fellow season ticket holders. We now have supporters from all sections of the ground, including the Upper Bullens and the Gwladys Street. The club can\'t ignore this many voices. Keep sharing and let\'s get this over the line.',
          hasVideo: false,
        })
        break

      case 'creator-video':
        await sendCreatorUpdateEmail({
          to: [to],
          creatorName,
          demandHeadline,
          demandId,
          updateBody: null,
          hasVideo: true,
        })
        break

      case 'threshold':
        await sendThresholdEmail({
          to: [to],
          orgName,
          demandHeadline,
          demandId,
          supportCount,
          threshold,
          summary: 'Season ticket holders are asking the club to explain and justify the proposed 15% price increase for the 2026/27 season, especially given the lack of investment in squad strengthening.',
          questions: [
            'What specifically is driving the 15% increase?',
            'How does this compare to other Premier League clubs?',
            'Will any of this revenue be ring-fenced for player recruitment?',
          ],
        })
        break

      case 'response':
        await sendResponseEmail({
          to: [to],
          orgName,
          demandHeadline,
          demandId,
          responseBody: 'Thank you for raising this question. We understand the concern around pricing and want to be transparent. The increase reflects rising operational costs, including the new stadium maintenance programme. We are committed to keeping football accessible and will be introducing a new concession scheme for under-25s and over-65s.',
          hasPdf: false,
          supportCount,
        })
        break

      case 'followup':
        await sendFollowUpEmail({
          to: [to],
          orgName,
          demandHeadline,
          demandId,
          round: 2,
          supportCount,
          questions: [
            'Can you provide a breakdown of the operational costs?',
            'When will the concession scheme be announced?',
          ],
        })
        break

      // ── Creator emails ──

      case 'creator-first-supporter':
        await sendCreatorFirstSupporterEmail({
          to,
          orgName,
          demandHeadline,
          demandId,
        })
        break

      case 'creator-milestone':
        await sendCreatorMilestoneEmail({
          to,
          orgName,
          demandHeadline,
          demandId,
          supportCount: 1250,
          threshold,
          percentage: 50,
        })
        break

      case 'creator-target-reached':
        await sendCreatorTargetReachedEmail({
          to,
          orgName,
          demandHeadline,
          demandId,
          threshold,
        })
        break

      case 'creator-response':
        await sendCreatorResponseReceivedEmail({
          to,
          orgName,
          demandHeadline,
          demandId,
          responseBody: 'Thank you for raising this question. We understand the concern around pricing and want to be transparent. The increase reflects rising operational costs, including the new stadium maintenance programme. We are committed to keeping football accessible and will be introducing a new concession scheme for under-25s and over-65s.',
        })
        break

      case 'creator-weekly-digest':
        await sendCreatorWeeklyDigestEmail({
          to,
          demandHeadline,
          demandId,
          status: 'live',
          totalSupporters: supportCount,
          newSupportersThisWeek: 342,
          commentsThisWeek: 18,
        })
        break

      default:
        return { error: `Unknown email type: ${emailType}` }
    }

    return { error: null, success: `Test email "${emailType}" sent to ${to}` }
  } catch (err) {
    return { error: `Failed to send: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}
