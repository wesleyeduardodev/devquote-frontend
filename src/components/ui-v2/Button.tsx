import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-fast ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:   'bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-active',
        secondary: 'bg-surface-1 text-text-primary border border-border-strong hover:bg-surface-2',
        ghost:     'bg-transparent text-text-primary hover:bg-surface-2',
        danger:    'bg-[var(--danger-strong)] text-white hover:opacity-90',
        link:      'bg-transparent text-text-link underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-7  px-2.5 text-xs gap-1.5 [&_svg]:size-3.5',
        md: 'h-8  px-3   text-sm        [&_svg]:size-4',
        lg: 'h-10 px-4   text-sm        [&_svg]:size-4',
        icon: 'h-8 w-8 p-0               [&_svg]:size-4',
        'icon-sm': 'h-7 w-7 p-0          [&_svg]:size-3.5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, leadingIcon, trailingIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" /> : leadingIcon}
        {children}
        {!loading && trailingIcon}
      </Comp>
    )
  }
)
Button.displayName = 'Button'
