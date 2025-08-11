import React, { useState } from 'react';

const BillingMonthForm = ({
                              initialData = {},
                              onSubmit,
                              onCancel,
                              loading = false
                          }) => {
    const [formData, setFormData] = useState({
        month: initialData.month || '',
        year: initialData.year || new Date().getFullYear(),
        paymentDate: initialData.paymentDate || '',
        status: initialData.status || 'PENDENTE',
        ...initialData
    });

    const [errors, setErrors] = useState({});

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

    const validateForm = () => {
        const newErrors = {};

        if (!formData.month) {
            newErrors.month = 'Mês é obrigatório';
        }

        if (!formData.year) {
            newErrors.year = 'Ano é obrigatório';
        } else if (formData.year < 2020 || formData.year > 2030) {
            newErrors.year = 'Ano deve estar entre 2020 e 2030';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            onSubmit(formData);
        }
    };

    const handleInputChange = (field, value) => {
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
                    Configure o mês e ano para faturamento dos orçamentos
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mês *
                        </label>
                        <select
                            value={formData.month}
                            onChange={(e) => handleInputChange('month', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Selecione o mês</option>
                            {monthOptions.map(month => (
                                <option key={month.value} value={month.value}>
                                    {month.label}
                                </option>
                            ))}
                        </select>
                        {errors.month && (
                            <p className="mt-1 text-sm text-red-600">{errors.month}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ano *
                        </label>
                        <input
                            type="number"
                            value={formData.year}
                            onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            min="2020"
                            max="2030"
                            required
                        />
                        {errors.year && (
                            <p className="mt-1 text-sm text-red-600">{errors.year}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data de Pagamento
                        </label>
                        <input
                            type="date"
                            value={formData.paymentDate}
                            onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => handleInputChange('status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            {statusOptions.map(status => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : 'Salvar Período'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BillingMonthForm;