import React, { useState, useEffect } from 'react';
import { GitBranch, ExternalLink, FileText, Calendar, AlertCircle } from 'lucide-react';
import { DeliveryItemFormData, DeliveryStatus } from '../../types/delivery.types';
import { AvailableProject } from '../../types/delivery.types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

interface DeliveryItemFormProps {
    project: AvailableProject;
    initialData?: DeliveryItemFormData;
    onSave: (data: DeliveryItemFormData) => void;
    onCancel?: () => void;
    isReadOnly?: boolean;
}

// Schema de validação
const deliveryItemSchema = yup.object({
    status: yup.string().required('Status é obrigatório'),
    branch: yup.string().optional(),
    sourceBranch: yup.string().optional(),
    pullRequest: yup.string().url('Deve ser uma URL válida').optional(),
    script: yup.string().optional(),
    startedAt: yup.string().optional(),
    finishedAt: yup.string().optional(),
    notes: yup.string().optional()
});

const statusOptions: { value: DeliveryStatus; label: string; color: string }[] = [
    { value: 'PENDING', label: 'Pendente', color: 'text-gray-600' },
    { value: 'DEVELOPMENT', label: 'Em Desenvolvimento', color: 'text-blue-600' },
    { value: 'DELIVERED', label: 'Entregue', color: 'text-green-600' },
    { value: 'HOMOLOGATION', label: 'Em Homologação', color: 'text-yellow-600' },
    { value: 'APPROVED', label: 'Aprovado', color: 'text-emerald-600' },
    { value: 'REJECTED', label: 'Rejeitado', color: 'text-red-600' },
    { value: 'PRODUCTION', label: 'Em Produção', color: 'text-purple-600' }
];

export default function DeliveryItemForm({
    project,
    initialData,
    onSave,
    onCancel,
    isReadOnly = false
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
                projectId: project.id,
                projectName: project.name,
                ...initialData
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
                <div className="flex items-center justify-between">
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
                        <span className={`text-sm font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                        </span>
                        
                        {hasUnsavedChanges && (
                            <div className="flex items-center gap-1 text-yellow-600">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-xs font-medium">Não salvo</span>
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
                    <div className="grid grid-cols-2 gap-4">
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

                    {/* Script */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Script/Comandos
                        </label>
                        <textarea
                            {...register('script')}
                            placeholder="npm run build&#10;docker build -t app .&#10;kubectl apply -f deploy.yaml"
                            disabled={isReadOnly}
                            rows={3}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 font-mono text-sm"
                        />
                    </div>

                    {/* Datas */}
                    <div className="grid grid-cols-2 gap-4">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Observações
                        </label>
                        <textarea
                            {...register('notes')}
                            placeholder="Observações sobre a implementação, problemas encontrados, etc."
                            disabled={isReadOnly}
                            rows={3}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                    </div>

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