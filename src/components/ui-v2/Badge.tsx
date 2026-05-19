import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        neutral: 'bg-neutral-soft text-text-secondary border border-neutral-border',
        success: 'bg-success-soft text-success-strong border border-success-border',
        warning: 'bg-warning-soft text-warning-strong border border-warning-border',
        danger:  'bg-danger-soft text-danger-strong border border-danger-border',
        info:    'bg-info-soft text-info-strong border border-info-border',
        accent:  'bg-accent-soft text-accent border border-accent/20',
      },
      size: {
        sm: 'text-xs px-1.5 h-5 [&_svg]:size-3',
        md: 'text-xs px-2   h-6 [&_svg]:size-3.5',
      },
    },
    defaultVariants: { variant: 'neutral', size: 'sm' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant, size, className }))} {...props} />
  )
)
Badge.displayName = 'Badge'
