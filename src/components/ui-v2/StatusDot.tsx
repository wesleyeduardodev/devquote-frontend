import * as React from 'react'
import { cn } from '@/utils/cn'

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent'

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-text-tertiary',
  info:    'bg-info-strong',
  success: 'bg-success-strong',
  warning: 'bg-warning-strong',
  danger:  'bg-danger-strong',
  accent:  'bg-accent',
}

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  pulse?: boolean
  size?: 'sm' | 'md'
}

export const StatusDot: React.FC<StatusDotProps> = ({ tone = 'neutral', pulse, size = 'sm', className, ...props }) => (
  <span
    aria-hidden
    className={cn(
      'inline-block rounded-full shrink-0',
      size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5',
      TONE_CLASS[tone],
      pulse && 'animate-pulse',
      className
    )}
    {...props}
  />
)
