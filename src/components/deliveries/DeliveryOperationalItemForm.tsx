import React, { useState, useEffect } from 'react';
import { FileText, Calendar, AlertCircle, Trash2 } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { DeliveryOperationalAttachmentList } from './DeliveryOperationalAttachmentList';

export interface DeliveryOperationalItemFormData {
    id?: number;
    deliveryId?: number;
    title: string;
    description?: string;
    status: 'PENDING' | 'DELIVERED';
    startedAt?: string;
    finishedAt?: string;
}

interface DeliveryOperationalItemFormProps {
    initialData?: DeliveryOperationalItemFormData;
    onSave: (data: DeliveryOperationalItemFormData) => void;
    onDelete?: () => void;
    isReadOnly?: boolean;
}

// Schema de validação
const operationalItemSchema = yup.object({
    id: yup.number().optional(),
    deliveryId: yup.number().optional(),
    title: yup.string().required('Título é obrigatório'),
    description: yup.string().optional(),
    status: yup.string().oneOf(['PENDING', 'DELIVERED']).required('Status é obrigatório'),
    startedAt: yup.string().optional(),
    finishedAt: yup.string().optional()
});

const statusOptions: { value: 'PENDING' | 'DELIVERED'; label: string; color: string; bg: string }[] = [
    { value: 'PENDING', label: 'Pendente', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-100' },
    { value: 'DELIVERED', label: 'Entregue', color: 'text-green-700', bg: 'bg-green-50 border-green-100' }
];

export default function DeliveryOperationalItemForm({
    initialData,
    onSave,
    onDelete,
    isReadOnly = false
}: DeliveryOperationalItemFormProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isDirty }
    } = useForm<DeliveryOperationalItemFormData>({
        resolver: yupResolver(operationalItemSchema),
        defaultValues: {
            status: 'PENDING',
            title: '',
            description: '',
            startedAt: '',
            finishedAt: '',
            ...initialData
        }
    });

    const currentStatus = watch('status');
    const currentTitle = watch('title');

    // Monitora mudanças para controlar estado de não salvo
    useEffect(() => {
        setHasUnsavedChanges(isDirty && !isReadOnly);
    }, [isDirty, isReadOnly]);

    // Carregar dados iniciais quando receber
    useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);

    const onSubmit = (data: DeliveryOperationalItemFormData) => {
        onSave({
            ...data,
            id: initialData?.id,
            deliveryId: initialData?.deliveryId
        });
        setHasUnsavedChanges(false);
    };

    const handleCancel = () => {
        if (hasUnsavedChanges) {
            const confirmCancel = window.confirm(
                'Há alterações não salvas. Deseja realmente cancelar?'
            );
            if (!confirmCancel) return;
        }

        reset();
        setHasUnsavedChanges(false);
    };

    const getCurrentStatusInfo = () => {
        return statusOptions.find(option => option.value === currentStatus) || statusOptions[0];
    };

    const statusInfo = getCurrentStatusInfo();

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Header */}
            <div
                className={`p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors ${
                    hasUnsavedChanges ? 'border-l-4 border-l-yellow-400' : ''
                }`}
                onClick={() => !isReadOnly && setIsExpanded(!isExpanded)}
            >
                {/* Mobile Layout */}
                <div className="block sm:hidden">
                    <div className="space-y-3">
                        {/* Título */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                <FileText className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                                <h3 className="font-medium text-gray-900 text-sm leading-5 break-words">
                                    {currentTitle || 'Novo Item Operacional'}
                                </h3>
                            </div>
                        </div>

                        {/* Status e Ações */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color} ${statusInfo.bg}`}>
                                    ✓ {statusInfo.label}
                                </span>
                                {hasUnsavedChanges && (
                                    <span className="inline-flex items-center gap-1 text-yellow-600 text-xs">
                                        <AlertCircle className="h-3 w-3" />
                                        Não salvo
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {onDelete && !isReadOnly && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm('Deseja realmente excluir este item?')) {
                                                onDelete();
                                            }
                                        }}
                                        className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}

                                {!isReadOnly && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsExpanded(!isExpanded);
                                        }}
                                        className="px-2 py-1"
                                    >
                                        {isExpanded ? '⌃' : '⌄'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <h3 className="font-medium text-gray-900">{currentTitle || 'Novo Item Operacional'}</h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color} ${statusInfo.bg}`}>
                            {statusInfo.label}
                        </span>

                        {hasUnsavedChanges && (
                            <div className="flex items-center gap-1 text-yellow-600">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-xs font-medium">Não salvo</span>
                            </div>
                        )}

                        {onDelete && !isReadOnly && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Deseja realmente excluir este item?')) {
                                        onDelete();
                                    }
                                }}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}

                        {!isReadOnly && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(!isExpanded);
                                }}
                            >
                                {isExpanded ? '−' : '+'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Formulário expandido */}
            {isExpanded && (
                <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
                    {/* Título */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Título *
                        </label>
                        <Input
                            {...register('title')}
                            placeholder="Ex: Configuração de servidor, Backup de dados..."
                            disabled={isReadOnly}
                            icon={FileText}
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descrição
                        </label>
                        <textarea
                            {...register('description')}
                            rows={4}
                            placeholder="Descreva os detalhes da atividade operacional..."
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical disabled:bg-gray-100"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status *
                        </label>
                        <select
                            {...register('status')}
                            disabled={isReadOnly}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.status && (
                            <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                        )}
                    </div>

                    {/* Datas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Data de Início
                            </label>
                            <Input
                                {...register('startedAt')}
                                type="date"
                                disabled={isReadOnly}
                                icon={Calendar}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Data de Conclusão
                            </label>
                            <Input
                                {...register('finishedAt')}
                                type="date"
                                disabled={isReadOnly}
                                icon={Calendar}
                            />
                        </div>
                    </div>

                    {/* Anexos */}
                    {initialData?.id && (
                        <DeliveryOperationalAttachmentList
                            operationalItemId={initialData.id}
                            readOnly={isReadOnly}
                            className="border-t pt-4 mt-6"
                        />
                    )}

                    {/* Ações */}
                    {!isReadOnly && (
                        <div className="flex items-center gap-3 pt-4">
                            <Button
                                type="submit"
                                disabled={!isDirty}
                            >
                                Salvar Alterações
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                            >
                                Cancelar
                            </Button>

                            {isDirty && (
                                <span className="text-sm text-gray-500">
                                    Há alterações não salvas
                                </span>
                            )}
                        </div>
                    )}
                </form>
            )}
        </div>
    );
}
