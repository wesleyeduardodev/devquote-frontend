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
                                                               label,
                                                               error,
                                                               className,
                                                               required,
                                                               placeholder,
                                                               children,
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
            <div className="relative">
                <select
                    ref={ref}
                    className={clsx(
                        'w-full px-3 py-2.5 pr-10 border rounded-lg shadow-sm transition-colors duration-200 appearance-none',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                        'bg-white',
                        error
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 hover:border-gray-400',
                        'disabled:bg-gray-50 disabled:cursor-not-allowed',
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
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
});

Select.displayName = 'Select';

export default Select;