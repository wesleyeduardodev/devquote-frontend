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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Alterar Status do Orçamento
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isLoading}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Quote Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">ID:</span>
                                <span className="ml-2 font-medium">#{quote.id}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Tarefa:</span>
                                <span className="ml-2 font-medium">{quote.taskCode}</span>
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-gray-600">Nome da Tarefa:</span>
                            <p className="mt-1 font-medium text-gray-900">{quote.taskName}</p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <span className="text-gray-600">Status Atual:</span>
                            <span className={`ml-2 font-medium ${STATUS_OPTIONS.find(s => s.value === quote.status)?.color || 'text-gray-800'}`}>
                                {getCurrentStatusLabel(quote.status)}
                            </span>
                        </div>
                    </div>

                    {/* Status Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Novo Status:
                        </label>
                        <div className="space-y-2">
                            {STATUS_OPTIONS.map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                        selectedStatus === option.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        value={option.value}
                                        checked={selectedStatus === option.value}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                        disabled={isLoading}
                                    />
                                    <span className={`ml-3 font-medium ${option.color}`}>
                                        {option.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={isLoading || !isStatusChanged}
                        loading={isLoading}
                    >
                        {isLoading ? 'Salvando...' : 'Salvar Alteração'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default StatusChangeModal;