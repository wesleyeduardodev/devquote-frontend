import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
}

const Modal: React.FC<ModalProps> = ({
                                         isOpen,
                                         onClose,
                                         title,
                                         children,
                                         size = 'md',
                                         className,
                                         showCloseButton = true,
                                         closeOnOverlayClick = true,
                                     }) => {
    const sizes = {
        sm: 'max-w-sm sm:max-w-sm',
        md: 'max-w-full sm:max-w-md',
        lg: 'max-w-full sm:max-w-lg',
        xl: 'max-w-full sm:max-w-xl',
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div
                className="fixed inset-0 bg-surface-inverse/40 backdrop-blur-sm transition-opacity"
                onClick={handleOverlayClick}
            />

            <div
                className={clsx(
                    'relative bg-surface-1 rounded-t-lg sm:rounded-xl shadow-xl mx-2 sm:mx-4 w-full max-h-[90vh] overflow-hidden border border-border-subtle',
                    sizes[size],
                    className
                )}
            >
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-subtle bg-surface-1 sticky top-0">
                        {title && (
                            <h3 className="text-md sm:text-lg font-semibold text-text-primary truncate pr-2">
                                {title}
                            </h3>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="text-text-tertiary hover:text-text-primary hover:bg-surface-2 rounded-md p-1 transition-colors flex-shrink-0"
                                aria-label="Fechar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;