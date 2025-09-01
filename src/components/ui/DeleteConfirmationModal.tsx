import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import Button from './Button';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title?: string;
    itemName?: string;
    description?: string;
    isDeleting?: boolean;
    variant?: 'danger' | 'warning';
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmar Exclusão',
    itemName,
    description,
    isDeleting = false,
    variant = 'danger'
}) => {
    if (!isOpen) return null;

    const handleConfirm = async () => {
        await onConfirm();
    };

    const iconColor = variant === 'danger' ? 'text-red-600' : 'text-yellow-600';
    const bgColor = variant === 'danger' ? 'bg-red-100' : 'bg-yellow-100';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md transform transition-all">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isDeleting}
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Content */}
                    <div className="p-6">
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className={`${bgColor} rounded-full p-3`}>
                                <AlertTriangle className={`w-8 h-8 ${iconColor}`} />
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                            {title}
                        </h3>

                        {/* Description */}
                        <div className="text-center mb-6">
                            {itemName ? (
                                <p className="text-gray-600">
                                    Tem certeza que deseja excluir{' '}
                                    <span className="font-semibold text-gray-900">"{itemName}"</span>?
                                </p>
                            ) : (
                                <p className="text-gray-600">
                                    {description || 'Tem certeza que deseja excluir este item?'}
                                </p>
                            )}
                            <p className="text-sm text-gray-500 mt-2">
                                Esta ação não pode ser desfeita.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={onClose}
                                className="flex-1"
                                disabled={isDeleting}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleConfirm}
                                className="flex-1"
                                loading={isDeleting}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    'Excluindo...'
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;