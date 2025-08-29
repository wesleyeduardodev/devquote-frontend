import React from 'react';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';

interface SubTask {
    id?: number;
    title: string;
    description: string;
    amount: string;
    status: string;
    excluded?: boolean;
}

interface FormData {
    subTasks: SubTask[];
}

const SubTaskForm: React.FC = () => {
    const { hasProfile } = useAuth();
    const isAdmin = hasProfile('ADMIN');
    const canViewValues = isAdmin; // Apenas ADMIN pode ver valores
    
    const {
        control,
        register,
        formState: { errors },
        setValue
    } = useFormContext<FormData>();

    const { fields, append } = useFieldArray({
        control,
        name: 'subTasks'
    });

    const watchSubTasks = useWatch({ control, name: 'subTasks' });

    const calculateTotal = (): number => {
        if (!watchSubTasks) return 0;
        return watchSubTasks
            .filter((subTask) => !subTask?.excluded)
            .reduce((total, subTask) => {
                const amount = parseFloat(subTask?.amount) || 0;
                return total + amount;
            }, 0);
    };

    const addSubTask = (): void => {
        append({
            title: '',
            description: '',
            amount: canViewValues ? '' : '0', // MANAGER/USER sempre recebem 0
            status: 'PENDING',
            excluded: false
        });
    };

    const softRemoveSubTask = (index: number): void => {
        const field = watchSubTasks?.[index];
        if (field?.id) {
            // se já existe no backend, marca como excluído
            setValue(`subTasks.${index}.excluded`, true);
        } else {
            // se é novo, remove do array
            const filtered = [...watchSubTasks];
            filtered.splice(index, 1);
            setValue('subTasks', filtered);
        }
    };

    const statusOptions = [
        { value: 'PENDING', label: 'Pendente' },
        { value: 'IN_PROGRESS', label: 'Em Progresso' },
        { value: 'COMPLETED', label: 'Concluída' },
        { value: 'CANCELLED', label: 'Cancelada' }
    ];

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                    Subtarefas ({watchSubTasks?.filter(st => !st?.excluded).length || 0})
                </h3>
                <div className="flex items-center space-x-4">
                    {canViewValues && (
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">Total: </span>
                            <span className="text-lg font-bold text-primary-600">
                                {formatCurrency(calculateTotal())}
                            </span>
                        </div>
                    )}
                    <Button
                        type="button"
                        size="sm"
                        onClick={addSubTask}
                        className="flex items-center"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Subtarefa
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {fields.map((field, index) => {
                    const subTask = watchSubTasks?.[index];
                    if (subTask?.excluded) return null;

                    return (
                        <Card key={field.id} className="relative">
                            <div className="absolute top-4 right-4">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="danger"
                                    onClick={() => softRemoveSubTask(index)}
                                    className="p-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-4 pr-16">
                                {/* Título - linha completa */}
                                <Input
                                    {...register(`subTasks.${index}.title`)}
                                    label="Título"
                                    placeholder="Digite o título da subtarefa"
                                    error={errors.subTasks?.[index]?.title?.message}
                                    required
                                />

                                {/* Descrição - textarea em linha completa */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                                    <textarea
                                        {...register(`subTasks.${index}.description`)}
                                        rows={3}
                                        placeholder="Descreva a subtarefa (opcional)"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                                    />
                                    {errors.subTasks?.[index]?.description && (
                                        <p className="mt-1 text-sm text-red-600">{errors.subTasks[index].description.message}</p>
                                    )}
                                </div>

                                {/* Valor e Status na mesma linha */}
                                <div className={`grid ${canViewValues ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                                    {canViewValues ? (
                                        <div className="relative">
                                            <Input
                                                {...register(`subTasks.${index}.amount`, {
                                                    valueAsNumber: false
                                                })}
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                label="Valor"
                                                placeholder="0,00"
                                                error={errors.subTasks?.[index]?.amount?.message}
                                                required
                                            />
                                            <DollarSign className="absolute right-3 top-9 h-4 w-4 text-gray-400" />
                                        </div>
                                    ) : (
                                        // Campo oculto para MANAGER/USER com valor 0
                                        <input
                                            type="hidden"
                                            {...register(`subTasks.${index}.amount`)}
                                            value="0"
                                        />
                                    )}

                                    <Select
                                        {...register(`subTasks.${index}.status`)}
                                        label="Status"
                                        error={errors.subTasks?.[index]?.status?.message}
                                        required
                                    >
                                        {statusOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            </div>

                            {/* Campo oculto para manter o valor de "excluded" */}
                            <input
                                type="hidden"
                                {...register(`subTasks.${index}.excluded`)}
                            />

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="text-sm text-gray-500">
                                    Subtarefa #{index + 1}
                                    {canViewValues && watchSubTasks?.[index]?.amount && (
                                        <span className="ml-2 font-medium text-primary-600">
                                            {formatCurrency(parseFloat(watchSubTasks[index].amount) || 0)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {watchSubTasks?.filter(st => !st?.excluded).length === 0 && (
                <Card className="text-center py-8">
                    <div className="text-gray-500">
                        <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="mb-4">Nenhuma subtarefa adicionada</p>
                        <Button onClick={addSubTask}>
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Primeira Subtarefa
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default SubTaskForm;