import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const title = searchParams.get('title') ?? 'Fan campaigns that get answers'
  const subtitle = searchParams.get('subtitle') ?? ''
  const meta = searchParams.get('meta') ?? ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#064E3B',
          padding: '64px 72px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            color: '#F59E0B',
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: '-0.5px',
            marginBottom: 'auto',
          }}
        >
          MEGAFONE
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {subtitle && (
            <div
              style={{
                color: '#6EE7B7',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '0.01em',
              }}
            >
              {subtitle}
            </div>
          )}

          <div
            style={{
              color: '#FFFFFF',
              fontSize: title.length > 60 ? 44 : 56,
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
            }}
          >
            {title}
          </div>

          {meta && (
            <div
              style={{
                color: '#F59E0B',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {meta}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            marginTop: 48,
            height: 5,
            backgroundColor: '#F59E0B',
            borderRadius: 3,
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
