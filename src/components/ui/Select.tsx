import React, { forwardRef } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    className?: string;
    required?: boolean;
    placeholder?: string;
    children: React.ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
    label, error, className, required, placeholder, children, ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {label}
                    {required && <span className="text-[var(--danger-strong)] ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <select
                    ref={ref}
                    className={clsx(
                        'w-full h-10 pl-3 pr-10 rounded-md border text-sm appearance-none bg-surface-1 text-text-primary',
                        'transition-colors duration-fast',
                        'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent',
                        error
                            ? 'border-[var(--danger-strong)]'
                            : 'border-border-strong hover:border-text-tertiary',
                        'disabled:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-70',
                        className
                    )}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {children}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-text-tertiary pointer-events-none" />
            </div>
            {error && (
                <p className="mt-1 text-xs text-[var(--danger-strong)]">{error}</p>
            )}
        </div>
    );
});

Select.displayName = 'Select';

export default Select;
