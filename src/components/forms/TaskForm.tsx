import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRequesters } from '@/hooks/useRequesters';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import SubTaskForm from './SubTaskForm';

interface SubTask {
    title: string;
    description?: string;
    amount: string;
    status: string;
    taskId?: number | null;
    excluded?: boolean;
}

interface TaskData {
    requesterId: string;
    title: string;
    description?: string;
    status: string;
    code: string;
    link?: string;
    subTasks?: any[];
}

interface TaskFormProps {
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
}

interface Requester {
    id: number;
    name: string;
}

const schema = yup.object({
    requesterId: yup.string().required('Solicitante é obrigatório'),
    title: yup.string().required('Título é obrigatório').max(200, 'Máximo 200 caracteres'),
    description: yup.string().optional(),
    status: yup.string().required('Status é obrigatório'),
    code: yup.string().required('Código é obrigatório').max(50, 'Máximo 50 caracteres'),
    link: yup.string().url('URL inválida').optional(),
    subTasks: yup.array().optional(),
});

const TaskForm: React.FC<TaskFormProps> = ({
                                               initialData = null,
                                               onSubmit,
                                               onCancel,
                                               loading = false
                                           }) => {
    const { requesters, loading: requestersLoading } = useRequesters();

    const methods = useForm<TaskData>({
        resolver: yupResolver(schema),
        defaultValues: {
            requesterId: initialData?.requesterId?.toString() || '',
            title: initialData?.title || '',
            description: initialData?.description || '',
            status: initialData?.status || 'PENDING',
            code: initialData?.code || '',
            link: initialData?.link || '',
            subTasks: initialData?.subTasks || [{
                title: '',
                description: '',
                amount: '',
                status: 'PENDING'
            }],
        },
    });

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = methods;

    const handleFormSubmit = async (data: TaskData): Promise<void> => {
        try {
            // Converter requesterId para number e processar subtasks
            const formattedData = {
                ...data,
                requesterId: parseInt(data.requesterId),
                subTasks: (data.subTasks || []).map((subTask: any) => ({
                    ...subTask,
                    amount: parseFloat(subTask.amount || '0'),
                    taskId: initialData?.id || null
                }))
            };

            await onSubmit(formattedData);
            if (!initialData) {
                reset(); // Reset form only for create mode
            }
        } catch (error) {
            // Error is handled by the parent component
        }
    };

    const statusOptions = [
        { value: 'PENDING', label: 'Pendente' },
        { value: 'IN_PROGRESS', label: 'Em Progresso' },
        { value: 'COMPLETED', label: 'Concluída' },
        { value: 'CANCELLED', label: 'Cancelada' }
    ];

    if (requestersLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
                {/* Informações da Tarefa */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                        Informações da Tarefa
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Select
                            {...register('requesterId', { valueAsNumber: false })}
                            label="Solicitante"
                            placeholder="Selecione um solicitante"
                            error={errors.requesterId?.message}
                            required
                        >
                            {requesters.map((requester: Requester) => (
                                <option key={requester.id} value={requester.id}>
                                    {requester.name}
                                </option>
                            ))}
                        </Select>

                        <Input
                            {...register('code')}
                            label="Código"
                            placeholder="Digite o código da tarefa"
                            error={errors.code?.message}
                            required
                        />

                        <div className="md:col-span-2">
                            <Input
                                {...register('title')}
                                label="Título"
                                placeholder="Digite o título da tarefa"
                                error={errors.title?.message}
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Input
                                {...register('description')}
                                label="Descrição"
                                placeholder="Descreva a tarefa (opcional)"
                                error={errors.description?.message}
                            />
                        </div>

                        <Select
                            {...register('status')}
                            label="Status"
                            error={errors.status?.message}
                            required
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>

                        <Input
                            {...register('link')}
                            type="url"
                            label="Link"
                            placeholder="https://exemplo.com (opcional)"
                            error={errors.link?.message}
                        />
                    </div>
                </div>

                {/* Subtarefas */}
                <div className="border-t pt-8">
                    <SubTaskForm />
                    {errors.subTasks && (
                        <p className="mt-2 text-sm text-red-600">
                            {errors.subTasks.message}
                        </p>
                    )}
                </div>

                {/* Ações */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onCancel}
                            disabled={isSubmitting || loading}
                        >
                            Cancelar
                        </Button>
                    )}

                    <Button
                        type="submit"
                        loading={isSubmitting || loading}
                        disabled={isSubmitting || loading}
                    >
                        {initialData ? 'Atualizar' : 'Criar'} Tarefa
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
};

export default TaskForm;
