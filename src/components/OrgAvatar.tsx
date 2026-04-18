interface Props {
  name: string
  logoUrl: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-14 h-14 text-xl',
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

export default function OrgAvatar({ name, logoUrl, size = 'md', className = '' }: Props) {
  const sizeClass = sizeClasses[size]

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover shrink-0 ${className}`}
      />
    )
  }

  return (
    <div className={`${sizeClass} rounded-full bg-[#064E3B]/10 border border-[#064E3B]/20 flex items-center justify-center font-bold text-[#064E3B] shrink-0 ${className}`}>
      {initials(name)}
    </div>
  )
}
