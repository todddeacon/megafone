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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megafone.co'
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
      from: 'Megafone <notifications@megafone.co>',
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megafone.co'
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
      from: 'Megafone <notifications@megafone.co>',
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megafone.co'
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
      from: 'Megafone <notifications@megafone.co>',
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
