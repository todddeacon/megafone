export type ModerationAction = 'approve' | 'review' | 'block'

export interface ModerationResult {
  action: ModerationAction
  scores: Record<string, number>
  profanity?: string
}

// Groups 1–7 — used for campaigns
const CAMPAIGN_BLOCKED_WORDS = [
  // Group 1 — F-word variants
  'fuck', 'fucking', 'fucker', 'fucked', 'fucks', 'motherfucker', 'motherfucking',
  // Group 2 — S-word variants
  'shit', 'shitting', 'shitty', 'shite', 'bullshit',
  // Group 3 — C-word
  'cunt', 'cunts',
  // Group 4 — British slang
  'wanker', 'wankers', 'wanking', 'tosser', 'tossers', 'twat', 'twats',
  'knobhead', 'dickhead', 'dickheads', 'bellend', 'bellends', 'prick', 'pricks', 'muppet',
  // Group 5 — Arse variants
  'arsehole', 'arseholes', 'asshole', 'assholes',
  // Group 6 — Other common
  'bastard', 'bastards', 'bitch', 'bitches', 'bollocks', 'cock', 'cocks',
  'tit', 'tits', 'slag', 'slags', 'whore',
  // Group 7 — Mild
  'crap', 'damn', 'bloody', 'hell', 'arse', 'ass', 'git', 'idiot', 'moron', 'stupid',
]

// Groups 1 and 3 only — used for comments
const COMMENT_BLOCKED_WORDS = [
  // Group 1 — F-word variants
  'fuck', 'fucking', 'fucker', 'fucked', 'fucks', 'motherfucker', 'motherfucking',
  // Group 3 — C-word
  'cunt', 'cunts',
]

function buildWordPattern(words: string[]): RegExp {
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'i')
}

const CAMPAIGN_PATTERN = buildWordPattern(CAMPAIGN_BLOCKED_WORDS)
const COMMENT_PATTERN = buildWordPattern(COMMENT_BLOCKED_WORDS)

export function checkProfanity(text: string, context: 'campaign' | 'comment'): string | null {
  const pattern = context === 'campaign' ? CAMPAIGN_PATTERN : COMMENT_PATTERN
  const match = text.match(pattern)
  return match ? match[0] : null
}

export async function checkModeration(text: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('[moderation] OPENAI_API_KEY not set — skipping check')
    return { action: 'approve', scores: {} }
  }

  let res: Response
  try {
    res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: text }),
    })
  } catch (err) {
    // Fail open — don't block content if the API is unreachable
    console.error('[moderation] fetch error:', err)
    return { action: 'approve', scores: {} }
  }

  if (!res.ok) {
    console.error('[moderation] API error:', res.status, await res.text())
    return { action: 'approve', scores: {} }
  }

  const data = await res.json()
  const result = data.results?.[0]
  if (!result) return { action: 'approve', scores: {} }

  const scores: Record<string, number> = result.category_scores ?? {}
  const maxScore = Object.values(scores).reduce((max, s) => Math.max(max, s), 0)

  if (result.flagged && maxScore >= 0.8) return { action: 'block', scores }
  if (result.flagged) return { action: 'review', scores }
  return { action: 'approve', scores }
}
