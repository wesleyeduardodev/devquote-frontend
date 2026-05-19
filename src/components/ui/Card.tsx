import React from 'react';
import clsx from 'clsx';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    children: React.ReactNode;
    className?: string;
    title?: string | React.ReactNode;
    subtitle?: string | React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className, title, subtitle, ...props }) => {
    return (
        <div
            className={clsx(
                'bg-surface-1 rounded-lg border border-border-subtle shadow-xs overflow-hidden',
                className
            )}
            {...props}
        >
            {(title || subtitle) && (
                <div className="px-6 py-4 border-b border-border-subtle">
                    {title && (
                        <h3 className="text-md font-semibold text-text-primary">{title}</h3>
                    )}
                    {subtitle && (
                        <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
                    )}
                </div>
            )}
            <div className="p-4 sm:p-6">{children}</div>
        </div>
    );
};

export default Card;
