interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-3xl',
  lg: 'text-4xl',
}

export default function Logo({ size = 'md', className }: LogoProps) {
  return (
    <span className={`font-black tracking-tight leading-none ${sizeClasses[size]}`}>
      <span className={className ?? 'text-[#064E3B]'}>MEGAFONE</span>
    </span>
  )
}
