import React, { useState, useCallback } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { DollarSign } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import SubTaskForm from './SubTaskForm';

interface SubTask {
    title: string;
    description?: string;
    amount: string;
    taskId?: number | null;
    excluded?: boolean;
}

interface TaskData {
    requesterId: number;
    title: string;
    description?: string;
    code: string;
    link?: string;
    meetingLink?: string;
    notes?: string;
    hasSubTasks?: boolean;
    amount?: string;
    taskType?: string;
    serverOrigin?: string;
    systemModule?: string;
    priority?: string;
    subTasks?: any[];
}

interface TaskFormProps {
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
}


const schema = yup.object({
    title: yup.string().required('Título é obrigatório').max(200, 'Máximo 200 caracteres'),
    description: yup.string().optional(),
    code: yup.string().required('Código é obrigatório').max(50, 'Máximo 50 caracteres'),
    requesterId: yup.mixed().required('Solicitante é obrigatório'),
    link: yup.string().url('URL inválida').optional(),
    meetingLink: yup.string().url('URL inválida').max(500, 'Máximo 500 caracteres').optional(),
    notes: yup.string().max(256, 'Máximo 256 caracteres').optional(),
    hasSubTasks: yup.boolean().optional(),
    amount: yup.string().optional(),
    taskType: yup.string().optional(),
    serverOrigin: yup.string().max(100, 'Máximo 100 caracteres').optional(),
    systemModule: yup.string().max(100, 'Máximo 100 caracteres').optional(),
    priority: yup.string().required('Prioridade é obrigatória'),
    subTasks: yup.array().optional(),
});

const TaskForm: React.FC<TaskFormProps> = ({
                                               initialData = null,
                                               onSubmit,
                                               onCancel,
                                               loading = false,
                                           }) => {
    const { hasProfile } = useAuth();
    const isAdmin = hasProfile('ADMIN');



    const methods = useForm<TaskData>({
        resolver: yupResolver(schema),
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            code: initialData?.code || '',
            link: initialData?.link || '',
            meetingLink: initialData?.meetingLink || '',
            notes: initialData?.notes || '',
            hasSubTasks: initialData?.hasSubTasks !== undefined ? initialData.hasSubTasks : false,
            amount: initialData?.amount || '',
            taskType: initialData?.taskType || '',
            serverOrigin: initialData?.serverOrigin || '',
            systemModule: initialData?.systemModule || '',
            priority: initialData?.priority || 'MEDIUM',
            subTasks:
                initialData?.subTasks || [
                    {
                        title: '',
                        description: '',
                        amount: '',
                    },
                ],
        },
    });

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        control,
    } = methods;


    const hasSubTasks = useWatch({ control, name: 'hasSubTasks' });
    const watchSubTasks = useWatch({ control, name: 'subTasks' });

    // Estado para controlar mensagem de erro
    const [subTaskError, setSubTaskError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    // Validação quando tentar desmarcar a flag com subtarefas existentes
    const handleHasSubTasksChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;

        // Se está tentando desmarcar e existem subtarefas não excluídas
        if (!isChecked && initialData?.id && watchSubTasks) {
            const activeSubTasks = watchSubTasks.filter((st: any) => !st?.excluded);
            if (activeSubTasks.length > 0) {
                setSubTaskError('Para desmarcar esta opção, você precisa remover todas as subtarefas primeiro e depois atualizar a tarefa.');
                // Mantém o checkbox marcado
                setTimeout(() => {
                    methods.setValue('hasSubTasks', true);
                }, 0);
                return;
            }
        }

        setSubTaskError(null);
        methods.setValue('hasSubTasks', isChecked);
    }, [initialData?.id, watchSubTasks, methods]);

    const handleFormSubmit = async (data: TaskData): Promise<void> => {
        try {
            // Limpa erros anteriores
            setSubTaskError(null);
            setFormError(null);

            // Validação customizada para subtarefas
            if (data.hasSubTasks) {
                if (!data.subTasks || data.subTasks.length === 0) {
                    setFormError('Quando "Esta tarefa possui subtarefas" estiver marcado, você deve adicionar pelo menos uma subtarefa.');
                    const formElement = document.querySelector('form');
                    if (formElement) {
                        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    return;
                }
                
                // Validar se cada subtarefa tem título preenchido
                const invalidSubtasks = data.subTasks
                    .map((subTask: any, index: number) => ({
                        index: index + 1,
                        hasTitle: subTask.title && subTask.title.trim() !== ''
                    }))
                    .filter(st => !st.hasTitle);
                
                if (invalidSubtasks.length > 0) {
                    const errorMsg = invalidSubtasks.length === 1
                        ? `Subtarefa ${invalidSubtasks[0].index}: O título é obrigatório`
                        : `Subtarefas ${invalidSubtasks.map(st => st.index).join(', ')}: Os títulos são obrigatórios`;
                    
                    setFormError(errorMsg);
                    const formElement = document.querySelector('form');
                    if (formElement) {
                        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    return;
                }
            }

            const formattedData = {
                ...data,
                requesterId: data.requesterId || initialData?.requesterId,
                amount: data.hasSubTasks ? undefined : (isAdmin ? parseFloat(data.amount || '0') : null),
                subTasks: data.hasSubTasks ? (data.subTasks || []).map((subTask: any) => ({
                    ...subTask,
                    amount: parseFloat(subTask.amount || '0'),
                    taskId: initialData?.id || null,
                })) : [],
            };

            await onSubmit(formattedData);
            
            // Só reseta se for uma criação bem-sucedida
            if (!initialData?.id) {
                reset();
            }
        } catch (error: any) {
            console.error('Erro no formulário de tarefa:', error);
            
            // Captura erros relacionados às subtarefas
            if (error?.message && error.message.includes('Tem Subtarefas')) {
                setSubTaskError('Não é possível desmarcar "Tem Subtarefas" enquanto existirem subtarefas vinculadas. Remova todas as subtarefas primeiro.');
                // Volta o checkbox para marcado
                methods.setValue('hasSubTasks', true);
            } else if (error?.message && !error.message.includes('Requester not selected')) {
                // Mostra outros erros de API (exceto erro de requester que já é tratado no componente pai)
                let errorMessage = 'Erro ao processar solicitação';
                
                // Extrair mensagem detalhada do erro
                if (error.response?.data?.detail) {
                    errorMessage = error.response.data.detail;
                } else if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response?.data?.errors) {
                    // Erro de validação com múltiplos campos
                    const fieldErrors = error.response.data.errors
                        .map((err: any) => `${err.field}: ${err.message}`)
                        .join(', ');
                    errorMessage = `Campos inválidos: ${fieldErrors}`;
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                setFormError(errorMessage);
                
                // Scroll para o topo para mostrar o erro
                const formElement = document.querySelector('form');
                if (formElement) {
                    formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else {
                // Re-lança o erro para ser tratado pelo componente pai (caso do requester)
                throw error;
            }
        }
    };



    const taskTypeOptions = [
        { value: '', label: 'Selecione...' },
        { value: 'BUG', label: '🐛 Bug' },
        { value: 'ENHANCEMENT', label: '📨 Melhoria' },
        { value: 'NEW_FEATURE', label: '✨ Nova Funcionalidade' },
    ];

    const priorityOptions = [
        { value: 'LOW', label: '🟢 Baixa' },
        { value: 'MEDIUM', label: '🟡 Média' },
        { value: 'HIGH', label: '🟠 Alta' },
        { value: 'URGENT', label: '🔴 Urgente' },
    ];

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
                {/* Exibição de erro geral */}
                {formError && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Erro ao processar solicitação</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{formError}</p>
                                </div>
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormError(null)}
                                        className="text-sm font-medium text-red-800 underline hover:text-red-900"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Campo hidden para requesterId */}
                <input {...register('requesterId')} type="hidden" />
                
                {/* Informações Básicas */}
                <div className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            {...register('code')}
                            label="Código"
                            placeholder="Digite o código da tarefa"
                            error={errors.code?.message}
                            maxLength={100}
                            required
                        />

                        <Select {...register('priority')} label="Prioridade" error={errors.priority?.message} required>
                            {priorityOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>

                        <div className="md:col-span-2">
                            <Input
                                {...register('title')}
                                label="Título"
                                placeholder="Digite o título da tarefa"
                                error={errors.title?.message}
                                maxLength={200}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Select {...register('taskType')} label="Tipo de Tarefa" error={errors.taskType?.message}>
                            {taskTypeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>

                        <Input
                            {...register('systemModule')}
                            label="Módulo do Sistema"
                            placeholder="Ex: Autenticação, Relatórios, Dashboard..."
                            error={errors.systemModule?.message}
                            maxLength={100}
                        />
                    </div>

                    <Input
                        {...register('serverOrigin')}
                        label="Servidor de Origem"
                        placeholder="Ex: Produção, Homologação, Desenvolvimento..."
                        error={errors.serverOrigin?.message}
                        maxLength={100}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                        <textarea
                            {...register('description')}
                            rows={4}
                            placeholder="Descreva a tarefa (opcional)&#10;Você pode usar múltiplas linhas..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                            maxLength={200}
                        />
                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                    </div>
                </div>

                {/* Links e Informações Adicionais */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            {...register('link')}
                            type="url"
                            label="Link da Tarefa"
                            placeholder="https://exemplo.com (opcional)"
                            error={errors.link?.message}
                            maxLength={200}
                        />

                        <Input
                            {...register('meetingLink')}
                            type="url"
                            label="Link da Reunião"
                            placeholder="https://meet.google.com/... (opcional)"
                            error={errors.meetingLink?.message}
                            maxLength={500}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                        <textarea
                            {...register('notes')}
                            rows={3}
                            placeholder="Adicione notas sobre a tarefa (opcional)&#10;Máximo 256 caracteres..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                            maxLength={256}
                        />
                        {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
                    </div>
                </div>

                {/* Configuração de Subtarefas/Valor */}
                <div className="space-y-6">
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center space-x-3">
                                <input
                                    {...register('hasSubTasks')}
                                    type="checkbox"
                                    id="hasSubTasks"
                                    onChange={handleHasSubTasksChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="hasSubTasks" className="text-sm font-medium text-gray-700">
                                    Esta tarefa possui subtarefas?
                                </label>
                            </div>
                            {subTaskError && (
                                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-sm text-red-600">{subTaskError}</p>
                                </div>
                            )}
                        </div>

                        {hasSubTasks ? (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Subtarefas</h3>
                                <SubTaskForm />
                                {errors.subTasks && <p className="mt-2 text-sm text-red-600">{(errors as any).subTasks?.message}</p>}
                            </div>
                        ) : (
                            isAdmin && (
                                <div className="relative">
                                    <Input
                                        {...register('amount')}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        label="Valor da Tarefa"
                                        placeholder="0,00"
                                        error={errors.amount?.message}
                                    />
                                    <DollarSign className="absolute right-3 top-9 h-4 w-4 text-gray-400" />
                                </div>
                            )
                        )}
                    </div>
                </div>


                {/* Ações */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                    {onCancel && (
                        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting || loading}>
                            Cancelar
                        </Button>
                    )}
                    <Button type="submit" loading={isSubmitting || loading} disabled={isSubmitting || loading}>
                        {initialData?.id ? 'Atualizar' : 'Criar'} Tarefa
                    </Button>
                </div>
            </form>

        </FormProvider>
    );
};

export default TaskForm;
