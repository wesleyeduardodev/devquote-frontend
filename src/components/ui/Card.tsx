import React from 'react';
import clsx from 'clsx';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    children: React.ReactNode;
    className?: string;
    title?: string | React.ReactNode;
    subtitle?: string | React.ReactNode;
}

const Card: React.FC<CardProps> = ({
                                       children,
                                       className,
                                       title,
                                       subtitle,
                                       ...props
                                   }) => {
    return (
        <div
            className={clsx(
                'bg-white rounded-xl shadow-custom border border-gray-200',
                'overflow-hidden',
                className
            )}
            {...props}
        >
            {(title || subtitle) && (
                <div className="px-3 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
                    {title && (
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            {title}
                        </h3>
                    )}
                    {subtitle && (
                        <p className="text-sm text-gray-600 mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>
            )}
            <div className="p-3">
                {children}
            </div>
        </div>
    );
};

export default Card;
