interface Props {
  className?: string
  size?: number
}

export default function MegaphoneIcon({ className, size = 28 }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Megafone"
    >
      {/* Cone body */}
      <path d="M9 18v12l18 7V11L9 18Z" />
      {/* Handle */}
      <path d="M15 30v5a3 3 0 0 0 6 0v-3" />
      {/* Speaker baffle */}
      <path d="M27 14v20c3 0 5-4 5-10s-2-10-5-10Z" />
      {/* Sound waves */}
      <path d="M37 18l4-3" />
      <path d="M37 24h5" />
      <path d="M37 30l4 3" />
    </svg>
  )
}
