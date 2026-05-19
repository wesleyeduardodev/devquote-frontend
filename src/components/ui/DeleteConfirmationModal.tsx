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

    const iconColor = variant === 'danger' ? 'text-[var(--danger-strong)]' : 'text-[var(--warning-strong)]';
    const bgColor = variant === 'danger' ? 'bg-[var(--danger-soft)]' : 'bg-[var(--warning-soft)]';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-surface-inverse/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-surface-1 rounded-xl shadow-xl border border-border-subtle w-full max-w-md transform transition-all">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary hover:bg-surface-2 rounded-md p-1 transition-colors"
                        disabled={isDeleting}
                        aria-label="Fechar"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="p-6">
                        <div className="flex justify-center mb-4">
                            <div className={`${bgColor} rounded-full p-3`}>
                                <AlertTriangle className={`w-7 h-7 ${iconColor}`} />
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-text-primary text-center mb-2">
                            {title}
                        </h3>

                        <div className="text-center mb-6">
                            {itemName ? (
                                <p className="text-sm text-text-secondary">
                                    Tem certeza que deseja excluir{' '}
                                    <span className="font-semibold text-text-primary">"{itemName}"</span>?
                                </p>
                            ) : (
                                <p className="text-sm text-text-secondary">
                                    {description || 'Tem certeza que deseja excluir este item?'}
                                </p>
                            )}
                            <p className="text-xs text-text-tertiary mt-2">
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