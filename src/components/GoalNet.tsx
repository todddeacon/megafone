// Reusable goal net background pattern — sport-inspired diamond mesh
// Variants: 'full' (hero), 'contained' (cards), 'light' (on white bg), 'footer'

const VARIANTS = {
  full: {
    patternId: 'gn-full',
    size: 36,
    stroke: 'white',
    strokeWidth: 1,
    opacity: 0.12,
    mask: (
      <>
        <radialGradient id="gn-full-fade" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="70%" stopColor="white" stopOpacity="0.6" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="gn-full-mask">
          <rect width="100%" height="100%" fill="url(#gn-full-fade)" />
        </mask>
      </>
    ),
    maskRef: 'url(#gn-full-mask)',
    glow: 'radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 50%)',
  },
  contained: {
    patternId: 'gn-cont',
    size: 32,
    stroke: 'white',
    strokeWidth: 0.8,
    opacity: 0.10,
    mask: (
      <>
        <linearGradient id="gn-cont-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="30%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0.8" />
        </linearGradient>
        <mask id="gn-cont-mask">
          <rect width="100%" height="100%" fill="url(#gn-cont-fade)" />
        </mask>
      </>
    ),
    maskRef: 'url(#gn-cont-mask)',
    glow: null,
  },
  light: {
    patternId: 'gn-light',
    size: 40,
    stroke: '#064E3B',
    strokeWidth: 0.8,
    opacity: 0.06,
    mask: (
      <>
        <radialGradient id="gn-light-fade" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="gn-light-mask">
          <rect width="100%" height="100%" fill="url(#gn-light-fade)" />
        </mask>
      </>
    ),
    maskRef: 'url(#gn-light-mask)',
    glow: null,
  },
  footer: {
    patternId: 'gn-foot',
    size: 28,
    stroke: 'white',
    strokeWidth: 0.6,
    opacity: 0.08,
    mask: (
      <>
        <linearGradient id="gn-foot-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0.3" />
        </linearGradient>
        <mask id="gn-foot-mask">
          <rect width="100%" height="100%" fill="url(#gn-foot-fade)" />
        </mask>
      </>
    ),
    maskRef: 'url(#gn-foot-mask)',
    glow: null,
  },
} as const

type Variant = keyof typeof VARIANTS

export default function GoalNet({ variant = 'full' }: { variant?: Variant }) {
  const v = VARIANTS[variant]
  const half = v.size / 2

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${variant === 'contained' ? 'rounded-2xl' : ''}`}>
      <svg className="absolute w-full h-full" preserveAspectRatio="none">
        <defs>
          <pattern id={v.patternId} x="0" y="0" width={v.size} height={v.size} patternUnits="userSpaceOnUse">
            <path
              d={`M 0 ${half} L ${half} 0 L ${v.size} ${half} L ${half} ${v.size} Z`}
              stroke={v.stroke}
              strokeWidth={v.strokeWidth}
              opacity={v.opacity}
              fill="none"
            />
          </pattern>
          {v.mask}
        </defs>
        <rect width="100%" height="100%" fill={`url(#${v.patternId})`} mask={v.maskRef} />
      </svg>
      {v.glow && (
        <div className="absolute inset-0" style={{ background: v.glow }} />
      )}
    </div>
  )
}
