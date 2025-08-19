import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { Calculator } from 'lucide-react';

interface QuoteData {
    taskId: number;
    status: string;
    totalAmount: number;
}

interface QuoteFormProps {
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
    selectedTask?: any;
    formatCurrency?: (value: number) => string;
}

const schema = yup.object({
    status: yup.string().required('Status é obrigatório'),
    totalAmount: yup.number()
        .required('Valor total é obrigatório')
        .min(0.01, 'Valor deve ser maior que zero'),
});

const QuoteForm: React.FC<QuoteFormProps> = ({
                                                 initialData = null,
                                                 onSubmit,
                                                 onCancel,
                                                 loading = false,
                                                 selectedTask,
                                                 formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                             }) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
        watch
    } = useForm<QuoteData>({
        resolver: yupResolver(schema),
        defaultValues: {
            status: initialData?.status || 'DRAFT',
            totalAmount: initialData?.totalAmount || 0,
        },
    });

    const currentTotalAmount = watch('totalAmount');

    // Atualizar o valor total quando a tarefa selecionada mudar
    React.useEffect(() => {
        if (selectedTask) {
            const taskTotal = calculateTaskTotal();
            setValue('totalAmount', taskTotal);
        }
    }, [selectedTask, setValue]);

    const handleFormSubmit = async (data: QuoteData): Promise<void> => {
        try {
            // Validar se taskId existe
            if (!initialData?.taskId && !selectedTask?.id) {
                throw new Error('Tarefa é obrigatória');
            }

            // Incluir o taskId do initialData ou selectedTask
            const formattedData = {
                ...data,
                taskId: initialData?.taskId || selectedTask?.id,
            };

            await onSubmit(formattedData);
            if (!initialData?.id) {
                reset(); // Reset form only for create mode
            }
        } catch (error) {
            // Error is handled by the parent component
            throw error;
        }
    };

    const statusOptions = [
        { value: 'DRAFT', label: 'Rascunho' },
        { value: 'PENDING', label: 'Pendente' },
        { value: 'APPROVED', label: 'Aprovado' },
        { value: 'REJECTED', label: 'Rejeitado' }
    ];

    // Calcular total da tarefa para mostrar como referência
    const calculateTaskTotal = () => {
        if (!selectedTask?.subTasks || !Array.isArray(selectedTask.subTasks)) return 0;
        return selectedTask.subTasks.reduce((total: number, subTask: any) => {
            return total + (parseFloat(subTask.amount?.toString() || '0') || 0);
        }, 0);
    };

    const taskTotal = calculateTaskTotal();

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">

            {/* Informações do Orçamento */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                    Informações do Orçamento
                </h2>

                <div className="grid grid-cols-1 gap-6">
                    {/* Status */}
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

                    {/* Valor Total */}
                    <div>
                        <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-2">
                            Valor Total *
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">R$</span>
                            <input
                                {...register('totalAmount', { valueAsNumber: true })}
                                type="number"
                                step="0.01"
                                min="0.01"
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0,00"
                            />
                        </div>
                        {errors.totalAmount && (
                            <p className="mt-1 text-sm text-red-600">{errors.totalAmount.message}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            Valor calculado automaticamente com base nas subtarefas, mas pode ser editado
                        </p>
                    </div>
                </div>
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
                    {initialData?.id ? 'Atualizar' : 'Criar'} Orçamento
                </Button>
            </div>
        </form>
    );
};

export default QuoteForm;