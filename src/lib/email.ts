interface ThresholdEmailParams {
  to: string[]
  orgName: string
  demandHeadline: string
  demandId: string
  supportCount: number
  threshold: number
  summary: string
  questions: string[]
}

export async function sendThresholdEmail({
  to,
  orgName,
  demandHeadline,
  demandId,
  supportCount,
  threshold,
  summary,
  questions,
}: ThresholdEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping threshold notification')
    return
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megafone.app'
  const campaignUrl = `${siteUrl}/demands/${demandId}`

  const questionsHtml = questions
    .map(
      (q, i) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0fdf4; vertical-align: top;">
          <span style="color: #f59e0b; font-weight: 700; margin-right: 10px;">${i + 1}.</span>
          <span style="color: #1f2937;">${escapeHtml(q)}</span>
        </td>
      </tr>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fans are asking ${escapeHtml(orgName)} a question on Megafone</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background-color: #064e3b; border-radius: 12px 12px 0 0; padding: 28px 40px;">
              <span style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">MEGAFONE</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">

              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
                Campaign notification
              </p>

              <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 800; color: #064e3b; line-height: 1.2;">
                ${escapeHtml(demandHeadline)}
              </h1>

              <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                Hi ${escapeHtml(orgName)},
              </p>

              <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                <strong style="color: #064e3b;">${supportCount.toLocaleString()} fans</strong> have come together on Megafone to ask you the following question${questions.length !== 1 ? 's' : ''}. This campaign reached its target of ${threshold.toLocaleString()} supporters.
              </p>

              <!-- Questions -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
                <tbody>
                  ${questionsHtml}
                </tbody>
              </table>

              ${summary ? `
              <!-- Context -->
              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Context from the campaign creator</p>
              <p style="margin: 0 0 28px 0; font-size: 15px; color: #4b5563; line-height: 1.6; border-left: 3px solid #d1fae5; padding-left: 16px;">
                ${escapeHtml(summary)}
              </p>
              ` : ''}

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="background-color: #064e3b; border-radius: 8px;">
                    <a href="${campaignUrl}" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none;">
                      View this campaign →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                Megafone gives fans a structured way to ask questions and build support. Responding to this campaign is optional — but fans will be able to see whether a response has been received.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; border-radius: 0 0 12px 12px; padding: 20px 40px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                You received this because fans tagged ${escapeHtml(orgName)} in a campaign on Megafone.
                To update your contact details or query this notification, email
                <a href="mailto:hello@megafone.co" style="color: #064e3b;">hello@megafone.co</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Megafone <notifications@megafone.app>',
      to,
      subject: `${supportCount.toLocaleString()} fans are asking ${orgName} a question on Megafone`,
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[email] Resend error:', res.status, body)
  }
}

interface ResponseEmailParams {
  to: string[]
  orgName: string
  demandHeadline: string
  demandId: string
  responseBody: string | null
  hasPdf: boolean
  supportCount: number
}

export async function sendResponseEmail({
  to,
  orgName,
  demandHeadline,
  demandId,
  responseBody,
  hasPdf,
  supportCount,
}: ResponseEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping response notification')
    return
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megafone.app'
  const campaignUrl = `${siteUrl}/demands/${demandId}`

  const responseSnippet = responseBody
    ? responseBody.length > 400
      ? escapeHtml(responseBody.slice(0, 400)) + '…'
      : escapeHtml(responseBody)
    : null

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(orgName)} has responded on Megafone</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background-color: #064e3b; border-radius: 12px 12px 0 0; padding: 28px 40px;">
              <span style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">MEGAFONE</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">

              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
                Campaign update
              </p>

              <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 800; color: #064e3b; line-height: 1.2;">
                ${escapeHtml(orgName)} has responded
              </h1>

              <p style="margin: 0 0 20px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                You supported a campaign that just got a response. Together with
                <strong style="color: #064e3b;">${supportCount.toLocaleString()} supporters</strong>,
                you asked:
              </p>

              <!-- Campaign headline -->
              <div style="background-color: #f0fdf4; border-left: 4px solid #064e3b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 16px; font-weight: 700; color: #064e3b; line-height: 1.4;">
                  ${escapeHtml(demandHeadline)}
                </p>
              </div>

              ${responseSnippet ? `
              <!-- Response snippet -->
              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Their response</p>
              <p style="margin: 0 0 28px 0; font-size: 15px; color: #4b5563; line-height: 1.6; border-left: 3px solid #f59e0b; padding-left: 16px;">
                ${responseSnippet}
              </p>
              ` : hasPdf ? `
              <p style="margin: 0 0 28px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                ${escapeHtml(orgName)} has submitted a formal written response. Read it in full on Megafone.
              </p>
              ` : ''}

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="background-color: #064e3b; border-radius: 8px;">
                    <a href="${campaignUrl}" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none;">
                      Read the full response →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                You can also add follow-up questions or leave a comment on the campaign page.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; border-radius: 0 0 12px 12px; padding: 20px 40px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                You received this because you supported this campaign on Megafone.
                Questions? Email <a href="mailto:hello@megafone.co" style="color: #064e3b;">hello@megafone.co</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const subject = `${orgName} has responded to a campaign you support`

  // Resend batch API — chunk into groups of 100
  const chunks: string[][] = []
  for (let i = 0; i < to.length; i += 100) chunks.push(to.slice(i, i + 100))

  for (const chunk of chunks) {
    const batch = chunk.map((email) => ({
      from: 'Megafone <notifications@megafone.app>',
      to: [email],
      subject,
      html,
    }))

    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[email] Resend batch error:', res.status, body)
    }
  }
}

interface FollowUpEmailParams {
  to: string[]
  orgName: string
  demandHeadline: string
  demandId: string
  round: number
  supportCount: number
  questions: string[]
}

export async function sendFollowUpEmail({
  to,
  orgName,
  demandHeadline,
  demandId,
  round,
  supportCount,
  questions,
}: FollowUpEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping follow-up notification')
    return
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megafone.app'
  const campaignUrl = `${siteUrl}/demands/${demandId}`

  const questionsHtml = questions
    .map(
      (q, i) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0fdf4; vertical-align: top;">
          <span style="color: #f59e0b; font-weight: 700; margin-right: 10px;">${i + 1}.</span>
          <span style="color: #1f2937;">${escapeHtml(q)}</span>
        </td>
      </tr>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fans have follow-up questions for ${escapeHtml(orgName)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background-color: #064e3b; border-radius: 12px 12px 0 0; padding: 28px 40px;">
              <span style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">MEGAFONE</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">

              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
                Follow-up questions · Round ${round}
              </p>

              <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 800; color: #064e3b; line-height: 1.2;">
                ${escapeHtml(demandHeadline)}
              </h1>

              <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                Hi ${escapeHtml(orgName)},
              </p>

              <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                Following your response, <strong style="color: #064e3b;">${supportCount.toLocaleString()} fans</strong> have raised further question${questions.length !== 1 ? 's' : ''} on Megafone.
              </p>

              <!-- Questions -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
                <tbody>
                  ${questionsHtml}
                </tbody>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="background-color: #064e3b; border-radius: 8px;">
                    <a href="${campaignUrl}" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none;">
                      View campaign and respond →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                As before, responding is optional — but supporters will be able to see the outcome on the campaign page.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; border-radius: 0 0 12px 12px; padding: 20px 40px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                You received this because fans tagged ${escapeHtml(orgName)} in a campaign on Megafone.
                Questions? Email <a href="mailto:hello@megafone.co" style="color: #064e3b;">hello@megafone.co</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Megafone <notifications@megafone.app>',
      to,
      subject: `Follow-up questions from fans — ${orgName} on Megafone`,
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[email] Resend error:', res.status, body)
  }
}

// ── Shared helpers ──────────────────────────────────────────────────────────

function emailShell(title: string, body: string, footerText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="background-color: #064e3b; border-radius: 12px 12px 0 0; padding: 28px 40px;">
              <span style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">MEGAFONE</span>
            </td>
          </tr>
          <tr>
            <td style="background-color: #ffffff; padding: 40px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; border-radius: 0 0 12px 12px; padding: 20px 40px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                ${footerText}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
  <tr>
    <td style="background-color: #064e3b; border-radius: 8px;">
      <a href="${href}" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none;">
        ${label}
      </a>
    </td>
  </tr>
</table>`
}

async function sendSingle(apiKey: string, to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Megafone <notifications@megafone.app>', to: [to], subject, html }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error('[email] Resend error:', res.status, body)
  }
}

async function sendBatch(apiKey: string, recipients: string[], subject: string, html: string) {
  const chunks: string[][] = []
  for (let i = 0; i < recipients.length; i += 100) chunks.push(recipients.slice(i, i + 100))

  for (const chunk of chunks) {
    const batch = chunk.map((email) => ({
      from: 'Megafone <notifications@megafone.app>',
      to: [email],
      subject,
      html,
    }))

    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[email] Resend batch error:', res.status, body)
    }
  }
}

// ── Email 1: Welcome supporter ──────────────────────────────────────────────

interface WelcomeSupporterParams {
  to: string
  creatorName: string
  orgName: string
  demandHeadline: string
  demandId: string
  supportCount: number
}

export async function sendWelcomeSupporterEmail({
  to,
  creatorName,
  orgName,
  demandHeadline,
  demandId,
  supportCount,
}: WelcomeSupporterParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping welcome supporter')
    return
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megafone.app'
  const campaignUrl = `${siteUrl}/demands/${demandId}`

  const body = `
    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
      Thank you for adding your support
    </p>

    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 800; color: #064e3b; line-height: 1.2;">
      ${escapeHtml(demandHeadline)}
    </h1>

    <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
      You've joined <strong style="color: #064e3b;">${supportCount.toLocaleString()} supporters</strong> asking ${escapeHtml(orgName)} important questions on Megafone.
    </p>

    <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
      The more supporters this campaign gets, the harder it is for ${escapeHtml(orgName)} to ignore. Share it with friends who care about this too.
    </p>

    ${ctaButton(campaignUrl, 'Share this campaign →')}

    <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
      We'll email you when there's news — like when there are updates or ${escapeHtml(orgName)} responds.
    </p>`

  const html = emailShell(
    `You're supporting ${escapeHtml(creatorName)}'s campaign on Megafone`,
    body,
    `You received this because you supported a campaign on Megafone. Questions? Email <a href="mailto:hello@megafone.co" style="color: #064e3b;">hello@megafone.co</a>.`
  )

  await sendSingle(apiKey, to, `You're supporting ${creatorName}'s campaign on Megafone`, html)
}

// ── Email 2: Campaign sent to organisation ──────────────────────────────────

interface CampaignSentParams {
  to: string[]
  orgName: string
  demandHeadline: string
  demandId: string
  supportCount: number
  threshold: number
}

export async function sendCampaignSentEmail({
  to,
  orgName,
  demandHeadline,
  demandId,
  supportCount,
  threshold,
}: CampaignSentParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping campaign sent')
    return
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megafone.app'
  const campaignUrl = `${siteUrl}/demands/${demandId}`

  const body = `
    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
      ${escapeHtml(orgName)} has been notified
    </p>

    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 800; color: #064e3b; line-height: 1.2;">
      ${escapeHtml(demandHeadline)}
    </h1>

    <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
      Great news — the campaign you support has reached its target of <strong style="color: #064e3b;">${threshold.toLocaleString()} supporters</strong> and has been sent to ${escapeHtml(orgName)}.
    </p>

    <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
      Together with <strong style="color: #064e3b;">${supportCount.toLocaleString()} supporters</strong>, you've made sure these questions get heard. ${escapeHtml(orgName)} now has an opportunity to respond — and all supporters will be notified when they do.
    </p>

    ${ctaButton(campaignUrl, 'View the campaign →')}`

  const html = emailShell(
    `Your campaign has been sent to ${escapeHtml(orgName)}`,
    body,
    `You received this because you supported this campaign on Megafone. Questions? Email <a href="mailto:hello@megafone.co" style="color: #064e3b;">hello@megafone.co</a>.`
  )

  await sendBatch(apiKey, to, `Your campaign has been sent to ${orgName}`, html)
}

// ── Email 3: Campaign resolved ──────────────────────────────────────────────

interface CampaignResolvedParams {
  to: string[]
  creatorName: string
  orgName: string
  demandHeadline: string
  demandId: string
  supportCount: number
  resolution: 'resolved' | 'unsatisfactory'
}

export async function sendCampaignResolvedEmail({
  to,
  creatorName,
  orgName,
  demandHeadline,
  demandId,
  supportCount,
  resolution,
}: CampaignResolvedParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping campaign resolved')
    return
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megafone.app'
  const campaignUrl = `${siteUrl}/demands/${demandId}`

  const isResolved = resolution === 'resolved'

  const body = `
    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
      Campaign outcome
    </p>

    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 800; color: #064e3b; line-height: 1.2;">
      ${isResolved ? 'This campaign has been resolved' : 'Response marked as unsatisfactory'}
    </h1>

    <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
      ${isResolved
        ? `${escapeHtml(creatorName)} has reviewed the response from ${escapeHtml(orgName)} and now considers it is resolved.`
        : `${escapeHtml(creatorName)} has reviewed the response from ${escapeHtml(orgName)} and feels the answers were not satisfactory.`
      }
    </p>

    <!-- Campaign headline -->
    <div style="background-color: #f0fdf4; border-left: 4px solid #064e3b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 16px; font-weight: 700; color: #064e3b; line-height: 1.4;">
        ${escapeHtml(demandHeadline)}
      </p>
    </div>

    <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
      ${isResolved
        ? `Thank you for being one of <strong style="color: #064e3b;">${supportCount.toLocaleString()} supporters</strong> who made this happen. Your voice made a large difference.`
        : `The campaign page has the full details. As one of <strong style="color: #064e3b;">${supportCount.toLocaleString()} supporters</strong>, your voice still matters — follow-up questions may be submitted.`
      }
    </p>

    ${ctaButton(campaignUrl, isResolved ? 'View the full outcome →' : 'View the campaign →')}`

  const html = emailShell(
    `Campaign outcome: ${escapeHtml(demandHeadline)}`,
    body,
    `You received this because you supported this campaign on Megafone. Questions? Email <a href="mailto:hello@megafone.co" style="color: #064e3b;">hello@megafone.co</a>.`
  )

  await sendBatch(apiKey, to, `Campaign outcome: ${demandHeadline}`, html)
}

// ── Email 6: Creator posted an update ───────────────────────────────────────

interface CreatorUpdateEmailParams {
  to: string[]
  creatorName: string
  demandHeadline: string
  demandId: string
  updateBody: string | null
  hasVideo: boolean
}

export async function sendCreatorUpdateEmail({
  to,
  creatorName,
  demandHeadline,
  demandId,
  updateBody,
  hasVideo,
}: CreatorUpdateEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping creator update')
    return
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megafone.app'
  const campaignUrl = `${siteUrl}/demands/${demandId}`

  let snippetHtml = ''
  if (updateBody) {
    const snippet = updateBody.length > 300 ? updateBody.slice(0, 300) + '…' : updateBody
    snippetHtml = `
      <p style="margin: 0 0 28px 0; font-size: 15px; color: #4b5563; line-height: 1.6; border-left: 3px solid #d1fae5; padding-left: 16px; font-style: italic;">
        &ldquo;${escapeHtml(snippet)}&rdquo;
      </p>`
  } else if (hasVideo) {
    snippetHtml = `
      <p style="margin: 0 0 28px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
        ${escapeHtml(creatorName)} has shared new video content. View it on the campaign page.
      </p>`
  }

  const body = `
    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
      Campaign update
    </p>

    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 800; color: #064e3b; line-height: 1.2;">
      ${escapeHtml(demandHeadline)}
    </h1>

    <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
      ${escapeHtml(creatorName)}'s campaign you support has posted a new update.
    </p>

    ${snippetHtml}

    ${ctaButton(campaignUrl, 'View the full update →')}`

  const html = emailShell(
    `New update by ${escapeHtml(creatorName)}`,
    body,
    `You received this because you supported this campaign on Megafone. Questions? Email <a href="mailto:hello@megafone.co" style="color: #064e3b;">hello@megafone.co</a>.`
  )

  await sendBatch(apiKey, to, `New update by ${creatorName}`, html)
}

// ── Creator Email 1: First supporter ─────────────────────────────────────────

interface CreatorFirstSupporterParams {
  to: string
  orgName: string
  demandHeadline: string
  demandId: string
}

export async function sendCreatorFirstSupporterEmail({
  to,
  orgName,
  demandHeadline,
  demandId,
}: CreatorFirstSupporterParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megafone.app'
  const campaignUrl = `${siteUrl}/demands/${demandId}`

  const body = `
    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
      Your campaign is live
    </p>

    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 800; color: #064e3b; line-height: 1.2;">
      Your campaign just got its first supporter
    </h1>

    <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
      Someone has just supported your campaign on Megafone — you're off the mark.
    </p>

    <div style="background-color: #f0fdf4; border-left: 4px solid #064e3b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 16px; font-weight: 700; color: #064e3b; line-height: 1.4;">
        ${escapeHtml(demandHeadline)}
      </p>
    </div>

    <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
      Share your campaign with friends, on social media, and in fan communities to build momentum. The more supporters you get, the harder it is for ${escapeHtml(orgName)} to ignore.
    </p>

    ${ctaButton(campaignUrl, 'Share your campaign →')}`

  const html = emailShell(
    'Your campaign just got its first supporter',
    body,
    `You received this because you created a campaign on Megafone. Questions? Email <a href="mailto:hello@megafone.app" style="color: #064e3b;">hello@megafone.app</a>.`
  )

  await sendSingle(apiKey, to, 'Your campaign just got its first supporter', html)
}

// ── Creator Email 2: Milestone supporters ────────────────────────────────────

interface CreatorMilestoneParams {
  to: string
  orgName: string
  demandHeadline: string
  demandId: string
  supportCount: number
  threshold: number
  percentage: number
}

export async function sendCreatorMilestoneEmail({
  to,
  orgName,
  demandHeadline,
  demandId,
  supportCount,
  threshold,
  percentage,
}: CreatorMilestoneParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megafone.app'
  const campaignUrl = `${siteUrl}/demands/${demandId}`

  const body = `
    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
      ${percentage}% of your target reached
    </p>

    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 800; color: #064e3b; line-height: 1.2;">
      ${escapeHtml(demandHeadline)}
    </h1>

    <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
      Your campaign now has <strong style="color: #064e3b;">${supportCount.toLocaleString()} supporters</strong> — that's ${percentage}% of the way to your target of ${threshold.toLocaleString()}. Keep the momentum going.
    </p>

    <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
      Every share helps. The closer you get to your target, the more likely ${escapeHtml(orgName)} will take notice.
    </p>

    ${ctaButton(campaignUrl, 'View your campaign →')}`

  const html = emailShell(
    `Your campaign is ${percentage}% of the way to ${escapeHtml(orgName)}`,
    body,
    `You received this because you created a campaign on Megafone. Questions? Email <a href="mailto:hello@megafone.app" style="color: #064e3b;">hello@megafone.app</a>.`
  )

  await sendSingle(apiKey, to, `Your campaign is ${percentage}% of the way to ${orgName}`, html)
}

// ── Creator Email 3: Target reached ──────────────────────────────────────────

interface CreatorTargetReachedParams {
  to: string
  orgName: string
  demandHeadline: string
  demandId: string
  threshold: number
}

export async function sendCreatorTargetReachedEmail({
  to,
  orgName,
  demandHeadline,
  demandId,
  threshold,
}: CreatorTargetReachedParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megafone.app'
  const campaignUrl = `${siteUrl}/demands/${demandId}`

  const body = `
    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
      ${escapeHtml(orgName)} has been notified
    </p>

    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 800; color: #064e3b; line-height: 1.2;">
      Your campaign has been sent to ${escapeHtml(orgName)}
    </h1>

    <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
      Your campaign reached its target of <strong style="color: #064e3b;">${threshold.toLocaleString()} supporters</strong> and has been sent to ${escapeHtml(orgName)}. This is a big moment — well done.
    </p>

    <div style="background-color: #f0fdf4; border-left: 4px solid #064e3b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 16px; font-weight: 700; color: #064e3b; line-height: 1.4;">
        ${escapeHtml(demandHeadline)}
      </p>
    </div>

    <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
      The organisation now has an opportunity to respond. We'll email you the moment they do.
    </p>

    ${ctaButton(campaignUrl, 'View your campaign →')}`

  const html = emailShell(
    `Your campaign has been sent to ${escapeHtml(orgName)}`,
    body,
    `You received this because you created a campaign on Megafone. Questions? Email <a href="mailto:hello@megafone.app" style="color: #064e3b;">hello@megafone.app</a>.`
  )

  await sendSingle(apiKey, to, `Your campaign has been sent to ${orgName}`, html)
}

// ── Creator Email 4: Official response received ──────────────────────────────

interface CreatorResponseReceivedParams {
  to: string
  orgName: string
  demandHeadline: string
  demandId: string
  responseBody: string | null
}

export async function sendCreatorResponseReceivedEmail({
  to,
  orgName,
  demandHeadline,
  demandId,
  responseBody,
}: CreatorResponseReceivedParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megafone.app'
  const campaignUrl = `${siteUrl}/demands/${demandId}`

  let snippetHtml = ''
  if (responseBody) {
    const snippet = responseBody.length > 300 ? responseBody.slice(0, 300) + '…' : responseBody
    snippetHtml = `
      <p style="margin: 0 0 28px 0; font-size: 15px; color: #4b5563; line-height: 1.6; border-left: 3px solid #f59e0b; padding-left: 16px; font-style: italic;">
        &ldquo;${escapeHtml(snippet)}&rdquo;
      </p>`
  }

  const body = `
    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
      You've got a response
    </p>

    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 800; color: #064e3b; line-height: 1.2;">
      ${escapeHtml(orgName)} has responded to your campaign
    </h1>

    <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
      ${escapeHtml(orgName)} has posted an official response to your campaign. As the creator, you can review it and mark the outcome.
    </p>

    <div style="background-color: #f0fdf4; border-left: 4px solid #064e3b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 16px; font-weight: 700; color: #064e3b; line-height: 1.4;">
        ${escapeHtml(demandHeadline)}
      </p>
    </div>

    ${snippetHtml}

    <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
      Once you've reviewed the response, you can mark the campaign as resolved, unsatisfactory, or add follow-up questions.
    </p>

    ${ctaButton(campaignUrl, 'Review the response →')}`

  const html = emailShell(
    `${escapeHtml(orgName)} has responded to your campaign`,
    body,
    `You received this because you created a campaign on Megafone. Questions? Email <a href="mailto:hello@megafone.app" style="color: #064e3b;">hello@megafone.app</a>.`
  )

  await sendSingle(apiKey, to, `${orgName} has responded to your campaign`, html)
}

// ── Creator Email 5: Weekly digest ───────────────────────────────────────────

interface CreatorWeeklyDigestParams {
  to: string
  demandHeadline: string
  demandId: string
  status: string
  totalSupporters: number
  newSupportersThisWeek: number
  commentsThisWeek: number
}

export async function sendCreatorWeeklyDigestEmail({
  to,
  demandHeadline,
  demandId,
  status,
  totalSupporters,
  newSupportersThisWeek,
  commentsThisWeek,
}: CreatorWeeklyDigestParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megafone.app'
  const campaignUrl = `${siteUrl}/demands/${demandId}`

  const statusLabels: Record<string, string> = {
    building: 'Building support',
    live: 'Active',
    notified: 'Awaiting response',
    responded: 'Responded',
    further_questions: 'Further questions',
    resolved: 'Resolved',
    unsatisfactory: 'Unsatisfactory response',
  }

  const body = `
    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
      Your weekly campaign update
    </p>

    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 800; color: #064e3b; line-height: 1.2;">
      ${escapeHtml(demandHeadline)}
    </h1>

    <p style="margin: 0 0 20px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
      Here's what happened this week:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 8px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 14px 20px; border-bottom: 1px solid #dcfce7;">
          <span style="font-size: 13px; color: #6b7280;">Total supporters</span>
        </td>
        <td style="padding: 14px 20px; border-bottom: 1px solid #dcfce7; text-align: right;">
          <strong style="font-size: 15px; color: #064e3b;">${totalSupporters.toLocaleString()}</strong>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 20px; border-bottom: 1px solid #dcfce7;">
          <span style="font-size: 13px; color: #6b7280;">New this week</span>
        </td>
        <td style="padding: 14px 20px; border-bottom: 1px solid #dcfce7; text-align: right;">
          <strong style="font-size: 15px; color: #064e3b;">+${newSupportersThisWeek.toLocaleString()}</strong>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 20px; border-bottom: 1px solid #dcfce7;">
          <span style="font-size: 13px; color: #6b7280;">Comments this week</span>
        </td>
        <td style="padding: 14px 20px; border-bottom: 1px solid #dcfce7; text-align: right;">
          <strong style="font-size: 15px; color: #064e3b;">${commentsThisWeek.toLocaleString()}</strong>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 20px;">
          <span style="font-size: 13px; color: #6b7280;">Campaign status</span>
        </td>
        <td style="padding: 14px 20px; text-align: right;">
          <strong style="font-size: 15px; color: #064e3b;">${statusLabels[status] ?? status}</strong>
        </td>
      </tr>
    </table>

    ${ctaButton(campaignUrl, 'View your campaign →')}`

  const html = emailShell(
    `Weekly update — ${escapeHtml(demandHeadline)}`,
    body,
    `You received this because you created a campaign on Megafone. Questions? Email <a href="mailto:hello@megafone.app" style="color: #064e3b;">hello@megafone.app</a>.`
  )

  await sendSingle(apiKey, to, `Weekly update for your campaign — ${demandHeadline}`, html)
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
