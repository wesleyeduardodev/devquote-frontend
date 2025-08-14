import React, { forwardRef, ReactNode } from 'react';
import clsx from 'clsx';

interface FormFieldProps {
    label?: string;
    error?: string;
    required?: boolean;
    className?: string;
    children: ReactNode;
    htmlFor?: string;
    hint?: string;
}

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(({
                                                                  label,
                                                                  error,
                                                                  required = false,
                                                                  className,
                                                                  children,
                                                                  htmlFor,
                                                                  hint,
                                                                  ...props
                                                              }, ref) => {
    return (
        <div ref={ref} className={clsx('w-full', className)} {...props}>
            {label && (
                <label
                    htmlFor={htmlFor}
                    className="block text-sm font-medium text-gray-700 mb-2"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                {children}
            </div>

            {hint && !error && (
                <p className="mt-1 text-sm text-gray-500">{hint}</p>
            )}

            {error && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
});

FormField.displayName = 'FormField';

export default FormField;