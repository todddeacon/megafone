import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#064E3B',
          borderRadius: '32px',
        }}
      >
        <span
          style={{
            fontSize: '120px',
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-4px',
          }}
        >
          M
        </span>
      </div>
    ),
    { ...size }
  )
}
