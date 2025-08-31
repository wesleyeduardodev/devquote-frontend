import React, { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { BillingPeriodRequest, BillingPeriod } from '@/types/billing.types';

interface BillingPeriodFormProps {
  initialData?: Partial<BillingPeriod>;
  onSubmit: (data: BillingPeriodRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface FormErrors {
  [key: string]: string | null;
}

const BillingPeriodForm: React.FC<BillingPeriodFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState<BillingPeriodRequest>({
    month: initialData.month || 0,
    year: initialData.year || new Date().getFullYear(),
    paymentDate: initialData.paymentDate || '',
    status: initialData.status || 'PENDENTE',
    ...initialData
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const statusOptions = [
    { value: 'PENDENTE', label: 'Pendente' },
    { value: 'PROCESSANDO', label: 'Processando' },
    { value: 'FATURADO', label: 'Faturado' },
    { value: 'PAGO', label: 'Pago' },
    { value: 'ATRASADO', label: 'Atrasado' },
    { value: 'CANCELADO', label: 'Cancelado' }
  ];

  const monthOptions = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.month || formData.month < 1 || formData.month > 12) {
      newErrors.month = 'Mês deve ser entre 1 e 12';
    }

    if (!formData.year) {
      newErrors.year = 'Ano é obrigatório';
    } else if (formData.year < 2020 || formData.year > 2040) {
      newErrors.year = 'Ano deve estar entre 2020 e 2040';
    }

    if (!formData.status) {
      newErrors.status = 'Status é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof BillingPeriodRequest, value: string | number): void => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Dados do Período de Faturamento
        </h2>
        <p className="text-gray-600">
          Configure o mês e ano para faturamento das tarefas
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            value={formData.month.toString()}
            onChange={(e) => handleInputChange('month', parseInt(e.target.value))}
            label="Mês"
            placeholder="Selecione o mês"
            error={errors.month || undefined}
            required
          >
            <option value="">Selecione o mês</option>
            {monthOptions.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </Select>

          <Input
            type="number"
            value={formData.year.toString()}
            onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
            label="Ano"
            error={errors.year || undefined}
            min="2020"
            max="2040"
            required
          />

          <Input
            type="date"
            value={formData.paymentDate || ''}
            onChange={(e) => handleInputChange('paymentDate', e.target.value)}
            label="Data de Pagamento"
          />

          <Select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            label="Status"
            error={errors.status || undefined}
            required
          >
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            loading={loading}
          >
            Salvar Período
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BillingPeriodForm;