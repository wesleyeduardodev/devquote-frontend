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

    const addSubTask = (e?: React.MouseEvent): void => {
        // Prevenir comportamento padrão e propagação
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Salvar posição atual do scroll
        const currentScrollPosition = window.scrollY;
        
        append({
            title: '',
            description: '',
            amount: canViewValues ? '' : '0', // MANAGER/USER sempre recebem 0
            excluded: false
        });
        
        // Restaurar posição do scroll após adicionar
        setTimeout(() => {
            window.scrollTo(0, currentScrollPosition);
        }, 0);
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


    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="space-y-4">
            {/* Mobile: Layout vertical / Desktop: Layout horizontal */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Título com contador */}
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    Subtarefas
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                        {watchSubTasks?.filter(st => !st?.excluded).length || 0}
                    </span>
                </h3>

                {/* Total + Botão Adicionar */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4">
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
                        className="flex items-center justify-center w-full sm:w-auto"
                        onMouseDown={(e) => e.preventDefault()} // Previne foco/scroll
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
                        <Card key={field.id}>
                            {/* Conteúdo - sem padding direito extra agora */}
                            <div className="space-y-3 sm:space-y-4">
                                {/* Título - textarea com 2 linhas */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                        Título <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        {...register(`subTasks.${index}.title`)}
                                        rows={2}
                                        placeholder="Digite o título da subtarefa"
                                        className="w-full px-2.5 py-2 sm:px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical text-sm sm:text-base"
                                        maxLength={200}
                                    />
                                    {errors.subTasks?.[index]?.title && (
                                        <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.subTasks[index].title.message}</p>
                                    )}
                                </div>

                                {/* Descrição - textarea em linha completa */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Descrição</label>
                                    <textarea
                                        {...register(`subTasks.${index}.description`)}
                                        rows={5}
                                        placeholder="Descreva a subtarefa em detalhes (opcional)"
                                        className="w-full px-2.5 py-2 sm:px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical text-sm sm:text-base"
                                    />
                                    {errors.subTasks?.[index]?.description && (
                                        <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.subTasks[index].description.message}</p>
                                    )}
                                </div>

                                {/* Valor */}
                                <div className="grid grid-cols-1 gap-4">
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

                                </div>
                            </div>

                            {/* Campo oculto para manter o valor de "excluded" */}
                            <input
                                type="hidden"
                                {...register(`subTasks.${index}.excluded`)}
                            />

                            {/* Footer - Badge + Valor + Botão Excluir */}
                            <div className="mt-3 pt-3 sm:mt-4 sm:pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between gap-2">
                                    {/* Lado esquerdo: Badge ID/Status */}
                                    <div className="flex items-center gap-2">
                                        {subTask?.id ? (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                                Subtarefa #{subTask.id}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold bg-gradient-to-r from-gray-400 to-gray-500 text-white">
                                                Nova Subtarefa
                                            </span>
                                        )}
                                    </div>

                                    {/* Lado direito: Valor (se ADMIN) + Botão Excluir */}
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        {/* Valor total */}
                                        {canViewValues && watchSubTasks?.[index]?.amount && (
                                            <span className="text-sm sm:text-base font-bold text-green-600">
                                                {formatCurrency(parseFloat(watchSubTasks[index].amount) || 0)}
                                            </span>
                                        )}

                                        {/* Botão Excluir */}
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="danger"
                                            onClick={() => softRemoveSubTask(index)}
                                            className="p-1.5 sm:p-2"
                                            title="Excluir subtarefa"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
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
                        <Button
                            onClick={addSubTask}
                            onMouseDown={(e) => e.preventDefault()}
                            className="w-full sm:w-auto"
                        >
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