import React, { forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helpText?: string;
    className?: string;
    required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
    label, error, helpText, className, required, ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {label}
                    {required && <span className="text-[var(--danger-strong)] ml-1">*</span>}
                </label>
            )}
            <input
                ref={ref}
                className={clsx(
                    'w-full h-10 px-3 rounded-md border text-sm bg-surface-1 text-text-primary placeholder:text-text-tertiary',
                    'transition-colors duration-fast',
                    'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent',
                    error
                        ? 'border-[var(--danger-strong)]'
                        : 'border-border-strong hover:border-text-tertiary',
                    'disabled:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-70',
                    className
                )}
                {...props}
            />
            {helpText && !error && (
                <p className="mt-1 text-xs text-text-tertiary">{helpText}</p>
            )}
            {error && (
                <p className="mt-1 text-xs text-[var(--danger-strong)]">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
