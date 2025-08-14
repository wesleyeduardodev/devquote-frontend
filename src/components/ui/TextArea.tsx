import React, { forwardRef } from 'react';
import clsx from 'clsx';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    className?: string;
    required?: boolean;
    rows?: number;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({
                                                                     label,
                                                                     error,
                                                                     className,
                                                                     required,
                                                                     rows = 4,
                                                                     ...props
                                                                 }, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <textarea
                ref={ref}
                rows={rows}
                className={clsx(
                    'w-full px-3 py-2.5 border rounded-lg shadow-sm transition-colors duration-200 resize-vertical',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                    error
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 bg-white hover:border-gray-400',
                    'disabled:bg-gray-50 disabled:cursor-not-allowed',
                    className
                )}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
});

TextArea.displayName = 'TextArea';

export default TextArea;