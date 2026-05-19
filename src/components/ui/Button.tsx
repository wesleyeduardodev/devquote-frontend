import React, { forwardRef } from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    disabled?: boolean;
    loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
    children, variant = 'primary', size = 'md', className, disabled, loading, ...props
}, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary:   'bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-active',
        secondary: 'bg-surface-1 text-text-primary border border-border-strong hover:bg-surface-2',
        outline:   'border border-accent text-accent hover:bg-accent-soft',
        danger:    'bg-[var(--danger-strong)] text-white hover:opacity-90',
        ghost:     'bg-transparent text-text-primary hover:bg-surface-2',
    };

    const sizes = {
        sm: 'h-8  px-2.5 text-xs [&_svg]:size-3.5',
        md: 'h-9  px-3   text-sm [&_svg]:size-4',
        lg: 'h-10 px-4   text-sm [&_svg]:size-4',
    };

    return (
        <button
            ref={ref}
            type="button"
            className={clsx(baseClasses, variants[variant], sizes[size], className)}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="animate-spin -ml-0.5 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            )}
            {children}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
