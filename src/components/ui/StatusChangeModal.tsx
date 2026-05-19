import React, { useState } from 'react';
import { X } from 'lucide-react';
import Button from './Button';
interface Quote {
    id: number;
    taskId: number;
    taskName: string;
    taskCode: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
}

interface StatusChangeModalProps {
    isOpen: boolean;
    quote: Quote | null;
    onClose: () => void;
    onConfirm: (status: string) => void;
    isLoading: boolean;
}

const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Pendente', color: 'text-yellow-800' },
    { value: 'APPROVED', label: 'Aprovado', color: 'text-green-800' },
    { value: 'REJECTED', label: 'Rejeitado', color: 'text-red-800' },
    { value: 'DRAFT', label: 'Rascunho', color: 'text-gray-800' },
];

const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
    isOpen,
    quote,
    onClose,
    onConfirm,
    isLoading,
}) => {
    const [selectedStatus, setSelectedStatus] = useState<string>('');

    React.useEffect(() => {
        if (isOpen && quote) {
            setSelectedStatus(quote.status);
        }
    }, [isOpen, quote]);

    if (!isOpen || !quote) return null;

    const handleConfirm = () => {
        if (selectedStatus && selectedStatus !== quote.status) {
            onConfirm(selectedStatus);
        }
    };

    const getCurrentStatusLabel = (status: string) => {
        return STATUS_OPTIONS.find(option => option.value === status)?.label || status;
    };

    const isStatusChanged = selectedStatus !== quote.status;

    return (
        <div className="fixed inset-0 bg-surface-inverse/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface-1 rounded-xl shadow-xl border border-border-subtle max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-border-subtle">
                    <h2 className="text-lg font-semibold text-text-primary">
                        Alterar status do orçamento
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-text-tertiary hover:text-text-primary hover:bg-surface-2 rounded-md p-1 transition-colors"
                        disabled={isLoading}
                        aria-label="Fechar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="bg-surface-2 rounded-md border border-border-subtle p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-text-tertiary">ID:</span>
                                <span className="ml-2 font-medium text-text-primary">#{quote.id}</span>
                            </div>
                            <div>
                                <span className="text-text-tertiary">Tarefa:</span>
                                <span className="ml-2 font-medium text-text-primary">{quote.taskCode}</span>
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-text-tertiary text-xs">Nome da tarefa:</span>
                            <p className="mt-1 text-sm font-medium text-text-primary">{quote.taskName}</p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-border-subtle">
                            <span className="text-text-tertiary text-xs">Status atual:</span>
                            <span className="ml-2 text-sm font-medium text-text-primary">
                                {getCurrentStatusLabel(quote.status)}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-2">
                            Novo status
                        </label>
                        <div className="space-y-1.5">
                            {STATUS_OPTIONS.map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                                        selectedStatus === option.value
                                            ? 'border-accent bg-accent-soft'
                                            : 'border-border-subtle hover:bg-surface-2'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        value={option.value}
                                        checked={selectedStatus === option.value}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="w-4 h-4 text-accent border-border-strong focus:ring-accent"
                                        disabled={isLoading}
                                    />
                                    <span className="ml-3 text-sm font-medium text-text-primary">
                                        {option.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 p-4 border-t border-border-subtle bg-surface-app/30 rounded-b-xl">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleConfirm} disabled={isLoading || !isStatusChanged} loading={isLoading}>
                        {isLoading ? 'Salvando...' : 'Salvar alteração'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default StatusChangeModal;