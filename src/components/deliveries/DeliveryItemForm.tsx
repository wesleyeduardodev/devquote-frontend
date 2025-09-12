import React, { useState, useEffect } from 'react';
import { GitBranch, ExternalLink, FileText, Calendar, AlertCircle } from 'lucide-react';
import { DeliveryItemFormData, DeliveryStatus } from '../../types/delivery.types';
import { AvailableProject } from '../../types/delivery.types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { DeliveryAttachmentList } from './DeliveryAttachmentList';

interface DeliveryItemFormProps {
    project: AvailableProject;
    initialData?: DeliveryItemFormData;
    onSave: (data: DeliveryItemFormData) => void;
    onCancel?: () => void;
    isReadOnly?: boolean;
    customActions?: React.ReactNode;
}

// Schema de validação
const deliveryItemSchema = yup.object({
    id: yup.number().optional(),
    deliveryId: yup.number().optional(),
    projectId: yup.number().required('Projeto é obrigatório'),
    projectName: yup.string().optional(),
    status: yup.string().required('Status é obrigatório'),
    branch: yup.string().optional(),
    sourceBranch: yup.string().optional(),
    pullRequest: yup.string().url('Deve ser uma URL válida').optional(),
    script: yup.string().optional(),
    startedAt: yup.string().optional(),
    finishedAt: yup.string().optional(),
    notes: yup.string().optional()
});

const statusOptions: { value: DeliveryStatus; label: string; color: string; bg: string }[] = [
    { value: 'PENDING', label: 'Pendente', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-100' },
    { value: 'DEVELOPMENT', label: 'Desenvolvimento', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
    { value: 'DELIVERED', label: 'Entregue', color: 'text-green-700', bg: 'bg-green-50 border-green-100' },
    { value: 'HOMOLOGATION', label: 'Homologação', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
    { value: 'APPROVED', label: 'Aprovado', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
    { value: 'REJECTED', label: 'Rejeitado', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-100' },
    { value: 'PRODUCTION', label: 'Produção', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-100' }
];

export default function DeliveryItemForm({
    project,
    initialData,
    onSave,
    onCancel,
    isReadOnly = false,
    customActions
}: DeliveryItemFormProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isDirty }
    } = useForm<DeliveryItemFormData>({
        resolver: yupResolver(deliveryItemSchema),
        defaultValues: {
            projectId: project.id,
            projectName: project.name,
            status: 'PENDING',
            branch: '',
            sourceBranch: '',
            pullRequest: '',
            script: '',
            startedAt: '',
            finishedAt: '',
            notes: '',
            ...initialData
        }
    });

    const currentStatus = watch('status');

    // Monitora mudanças para controlar estado de não salvo
    useEffect(() => {
        setHasUnsavedChanges(isDirty && !isReadOnly);
    }, [isDirty, isReadOnly]);

    // Carregar dados iniciais quando receber
    useEffect(() => {
        if (initialData) {
            reset({
                ...initialData,
                projectId: project.id,
                projectName: project.name
            });
        }
    }, [initialData, project, reset]);

    const onSubmit = (data: DeliveryItemFormData) => {
        onSave({
            ...data,
            id: initialData?.id,
            deliveryId: initialData?.deliveryId,
            projectId: project.id,
            projectName: project.name
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
        
        if (onCancel) {
            onCancel();
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
                        {/* Nome e Link */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                <GitBranch className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                                <h3 className="font-medium text-gray-900 text-sm leading-5 break-words">
                                    {project.name}
                                </h3>
                            </div>
                            {project.repositoryUrl && (
                                <a 
                                    href={project.repositoryUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 ml-2 flex-shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            )}
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
                                {customActions && (
                                    <div onClick={(e) => e.stopPropagation()}>
                                        {customActions}
                                    </div>
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
                
                {/* Desktop Layout - Original */}
                <div className="hidden sm:flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <GitBranch className="h-4 w-4 text-gray-500" />
                            <h3 className="font-medium text-gray-900">{project.name}</h3>
                        </div>
                        
                        {project.repositoryUrl && (
                            <a 
                                href={project.repositoryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        )}
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
                        
                        {customActions && (
                            <div onClick={(e) => e.stopPropagation()}>
                                {customActions}
                            </div>
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

                    {/* Branches */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Branch de Desenvolvimento
                            </label>
                            <Input
                                {...register('branch')}
                                placeholder="feature/nova-funcionalidade"
                                disabled={isReadOnly}
                                icon={GitBranch}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Branch de Origem
                            </label>
                            <Input
                                {...register('sourceBranch')}
                                placeholder="develop, main..."
                                disabled={isReadOnly}
                                icon={GitBranch}
                            />
                        </div>
                    </div>

                    {/* Pull Request */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pull Request / Merge Request
                        </label>
                        <Input
                            {...register('pullRequest')}
                            placeholder="https://github.com/repo/pull/123"
                            disabled={isReadOnly}
                            icon={ExternalLink}
                        />
                        {errors.pullRequest && (
                            <p className="mt-1 text-sm text-red-600">{errors.pullRequest.message}</p>
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

                    {/* Observações */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Observações
                        </label>
                        <textarea
                            {...register('notes')}
                            rows={6}
                            placeholder="Descreva as observações sobre a implementação em detalhes&#10;Você pode usar múltiplas linhas&#10;Sem limite de caracteres..."
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical disabled:bg-gray-100"
                        />
                    </div>

                    {/* Script */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Script/Comandos
                        </label>
                        <textarea
                            {...register('script')}
                            placeholder="npm run build&#10;docker build -t app .&#10;kubectl apply -f deploy.yaml"
                            disabled={isReadOnly}
                            rows={6}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 font-mono text-sm"
                        />
                    </div>

                    {/* Anexos do Item */}
                    {initialData?.id && (
                        <DeliveryAttachmentList
                            deliveryItemId={initialData.id}
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
                            
                            {onCancel && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                >
                                    Cancelar
                                </Button>
                            )}
                            
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