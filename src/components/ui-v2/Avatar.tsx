import * as React from 'react'
import { cn } from '@/utils/cn'

const SIZES = { xs: 'h-6 w-6 text-[10px]', sm: 'h-7 w-7 text-xs', md: 'h-8 w-8 text-xs', lg: 'h-10 w-10 text-sm' } as const

function initialsOf(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function colorOf(seed: string): string {
  // mapeia hash do nome -> 1 das 6 tonalidades neutras suaves
  const palette = [
    'bg-[#E0E7FF] text-[#3730A3]', // indigo
    'bg-[#DCFCE7] text-[#166534]', // green
    'bg-[#FEF3C7] text-[#92400E]', // amber
    'bg-[#FEE2E2] text-[#991B1B]', // red
    'bg-[#DBEAFE] text-[#1E40AF]', // blue
    'bg-[#F3E8FF] text-[#6B21A8]', // purple
  ]
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff
  return palette[Math.abs(h) % palette.length]
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string | null
  src?: string | null
  size?: keyof typeof SIZES
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md', className, ...props }) => {
  const initials = initialsOf(name)
  const tone = colorOf(name || 'x')
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium select-none shrink-0',
        SIZES[size],
        !src && tone,
        className
      )}
      aria-label={name || undefined}
      {...props}
    >
      {src ? (
        <img src={src} alt={name || ''} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
