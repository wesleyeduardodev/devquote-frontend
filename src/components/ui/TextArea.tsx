import React, { forwardRef } from 'react';
import clsx from 'clsx';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helpText?: string;
    className?: string;
    required?: boolean;
    rows?: number;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({
    label, error, helpText, className, required, rows = 4, ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {label}
                    {required && <span className="text-[var(--danger-strong)] ml-1">*</span>}
                </label>
            )}
            <textarea
                ref={ref}
                rows={rows}
                className={clsx(
                    'w-full px-3 py-2.5 rounded-md border text-sm bg-surface-1 text-text-primary placeholder:text-text-tertiary resize-vertical',
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

TextArea.displayName = 'TextArea';

export default TextArea;
