import * as React from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  invalid?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leadingIcon, trailingIcon, invalid, type, ...props }, ref) => {
    const baseInput = cn(
      'flex h-8 w-full rounded-md border bg-surface-1 px-3 text-sm text-text-primary placeholder:text-text-tertiary',
      'transition-colors duration-fast',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent',
      'disabled:cursor-not-allowed disabled:opacity-50',
      invalid ? 'border-[var(--danger-strong)] focus-visible:ring-[var(--danger-strong)]/20 focus-visible:border-[var(--danger-strong)]' : 'border-border-strong',
      leadingIcon && 'pl-9',
      trailingIcon && 'pr-9',
      className
    )

    if (leadingIcon || trailingIcon) {
      return (
        <div className="relative w-full">
          {leadingIcon && (
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary [&_svg]:size-4 pointer-events-none">
              {leadingIcon}
            </div>
          )}
          <input ref={ref} type={type} className={baseInput} {...props} />
          {trailingIcon && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary [&_svg]:size-4">
              {trailingIcon}
            </div>
          )}
        </div>
      )
    }
    return <input ref={ref} type={type} className={baseInput} {...props} />
  }
)
Input.displayName = 'Input'
