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
        <svg
          width="120"
          height="120"
          viewBox="0 0 40 34"
          fill="none"
        >
          {/* Handle */}
          <rect x="27" y="20" width="8" height="10" rx="2.5" fill="white" />
          {/* Cone body */}
          <path d="M 11 2 L 30 11 L 30 21 L 11 29 Z" fill="white" />
          {/* Rim */}
          <ellipse cx="11" cy="15.5" rx="5.5" ry="13.5" fill="white" />
          {/* Bell opening */}
          <ellipse cx="11" cy="15.5" rx="2.5" ry="8.5" fill="#064E3B" />
          {/* Sound waves */}
          <path d="M 5 11 Q 2.5 15.5 5 20" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 3 8 Q 0.5 15.5 3 23" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
