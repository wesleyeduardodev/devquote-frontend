import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    title?: string;
    subtitle?: string;
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
                <div className="px-6 py-4 border-b border-gray-200">
                    {title && (
                        <h3 className="text-lg font-semibold text-gray-900">
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
            <div className="p-6">
                {children}
            </div>
        </div>
    );
};

export default Card;