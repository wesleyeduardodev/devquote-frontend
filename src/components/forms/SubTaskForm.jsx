import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Card from '../ui/Card';

const SubTaskForm = () => {
  const { control, register, formState: { errors }, watch } = useFormContext();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'subTasks'
  });

  const watchSubTasks = watch('subTasks');

  // Calcular total
  const calculateTotal = () => {
    if (!watchSubTasks) return 0;
    return watchSubTasks.reduce((total, subTask) => {
      const amount = parseFloat(subTask?.amount) || 0;
      return total + amount;
    }, 0);
  };

  const addSubTask = () => {
    append({
      title: '',
      description: '',
      amount: '',
      status: 'PENDING'
    });
  };

  const removeSubTask = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const statusOptions = [
    { value: 'PENDING', label: 'Pendente' },
    { value: 'IN_PROGRESS', label: 'Em Progresso' },
    { value: 'COMPLETED', label: 'Concluída' },
    { value: 'CANCELLED', label: 'Cancelada' }
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Subtarefas ({fields.length})
        </h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Total: </span>
            <span className="text-lg font-bold text-primary-600">
              {formatCurrency(calculateTotal())}
            </span>
          </div>
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
        {fields.map((field, index) => (
          <Card key={field.id} className="relative">
            <div className="absolute top-4 right-4">
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={() => removeSubTask(index)}
                disabled={fields.length === 1}
                className="p-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-16">
              <Input
                {...register(`subTasks.${index}.title`)}
                label="Título"
                placeholder="Digite o título da subtarefa"
                error={errors.subTasks?.[index]?.title?.message}
                required
              />

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

              <Input
                {...register(`subTasks.${index}.description`)}
                label="Descrição"
                placeholder="Descreva a subtarefa (opcional)"
                error={errors.subTasks?.[index]?.description?.message}
              />

              <Select
                {...register(`subTasks.${index}.status`)}
                label="Status"
                error={errors.subTasks?.[index]?.status?.message}
                required
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Subtarefa #{index + 1}
                {watchSubTasks?.[index]?.amount && (
                  <span className="ml-2 font-medium text-primary-600">
                    {formatCurrency(parseFloat(watchSubTasks[index].amount) || 0)}
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {fields.length === 0 && (
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