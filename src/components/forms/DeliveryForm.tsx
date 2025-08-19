import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';

interface DeliveryData {
    quoteId: number;
    projectId: number;
    branch?: string;
    pullRequest?: string;
    script?: string;
    status: string;
    startedAt?: string;
    finishedAt?: string;
}

interface DeliveryFormProps {
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
    selectedQuote?: any;
    selectedProject?: any;
}

const schema = yup.object({
    branch: yup.string().optional(),
    pullRequest: yup.string().url('URL inválida').optional(),
    script: yup.string().optional(),
    status: yup.string().required('Status é obrigatório'),
    startedAt: yup.string().optional(),
    finishedAt: yup.string().optional(),
});

const DeliveryForm: React.FC<DeliveryFormProps> = ({
                                                       initialData = null,
                                                       onSubmit,
                                                       onCancel,
                                                       loading = false,
                                                       selectedQuote,
                                                       selectedProject
                                                   }) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<DeliveryData>({
        resolver: yupResolver(schema),
        defaultValues: {
            branch: initialData?.branch || '',
            pullRequest: initialData?.pullRequest || '',
            script: initialData?.script || '',
            status: initialData?.status || 'PENDING',
            startedAt: initialData?.startedAt ?
                (() => {
                    try {
                        // Se já está no formato yyyy-MM-dd, usar direto
                        if (typeof initialData.startedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(initialData.startedAt)) {
                            return initialData.startedAt;
                        }
                        // Converter de ISO string para yyyy-MM-dd
                        const date = new Date(initialData.startedAt);
                        return date.toISOString().split('T')[0];
                    } catch (error) {
                        console.error('Erro ao converter startedAt:', error);
                        return '';
                    }
                })() : '',
            finishedAt: initialData?.finishedAt ?
                (() => {
                    try {
                        // Se já está no formato yyyy-MM-dd, usar direto
                        if (typeof initialData.finishedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(initialData.finishedAt)) {
                            return initialData.finishedAt;
                        }
                        // Converter de ISO string para yyyy-MM-dd
                        const date = new Date(initialData.finishedAt);
                        return date.toISOString().split('T')[0];
                    } catch (error) {
                        console.error('Erro ao converter finishedAt:', error);
                        return '';
                    }
                })() : '',
        },
    });

    const handleFormSubmit = async (data: DeliveryData): Promise<void> => {
        try {
            // Validar se quote e project existem
            if (!selectedQuote?.id && !initialData?.quoteId) {
                throw new Error('Orçamento é obrigatório');
            }

            if (!selectedProject?.id && !initialData?.projectId) {
                throw new Error('Projeto é obrigatório');
            }

            // Função auxiliar para converter data para yyyy-MM-dd
            const convertDateToLocalDate = (dateValue?: string): string | null => {
                if (!dateValue || (dateValue.trim() === '')) {
                    return null;
                }

                try {
                    // Se for datetime-local (2024-12-25T10:30), pegar só a parte da data
                    const dateOnly = dateValue.includes('T')
                        ? dateValue.split('T')[0]
                        : dateValue;

                    // Verificar se está no formato yyyy-MM-dd
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                    if (dateRegex.test(dateOnly)) {
                        return dateOnly; // Já está no formato correto
                    }

                    // Tentar converter para Date e depois extrair yyyy-MM-dd
                    const date = new Date(dateValue);
                    if (isNaN(date.getTime())) {
                        return null;
                    }

                    // Converter para yyyy-MM-dd (formato LocalDate)
                    return date.toISOString().split('T')[0];
                } catch (error) {
                    console.error('Erro ao converter data:', error);
                    return null;
                }
            };

            // Incluir os IDs dos itens selecionados
            const formattedData = {
                ...data,
                quoteId: selectedQuote?.id || initialData?.quoteId,
                projectId: selectedProject?.id || initialData?.projectId,
                startedAt: convertDateToLocalDate(data.startedAt),
                finishedAt: convertDateToLocalDate(data.finishedAt),
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
        { value: 'PENDING', label: 'Pendente' },
        { value: 'IN_PROGRESS', label: 'Em Progresso' },
        { value: 'TESTING', label: 'Em Teste' },
        { value: 'DELIVERED', label: 'Entregue' },
        { value: 'APPROVED', label: 'Aprovado' },
        { value: 'REJECTED', label: 'Rejeitado' }
    ];

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
            {/* Informações da Entrega */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                    Informações da Entrega
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        {...register('branch')}
                        label="Branch"
                        placeholder="feature/nova-funcionalidade"
                        error={errors.branch?.message}
                    />

                    <Input
                        {...register('pullRequest')}
                        type="url"
                        label="Pull Request"
                        placeholder="https://github.com/user/repo/pull/123"
                        error={errors.pullRequest?.message}
                    />

                    <Input
                        {...register('startedAt')}
                        type="date"
                        label="Data de Início"
                        error={errors.startedAt?.message}
                    />

                    <Input
                        {...register('finishedAt')}
                        type="date"
                        label="Data de Finalização"
                        error={errors.finishedAt?.message}
                    />

                    <div className="md:col-span-2">
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
                    </div>
                </div>
            </div>

            {/* Script SQL */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                    Script de Banco de Dados
                </h2>

                <TextArea
                    {...register('script')}
                    label="Script SQL"
                    placeholder="-- Insira aqui o script SQL para a entrega
CREATE TABLE exemplo (
  id BIGINT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL
);

INSERT INTO exemplo (id, nome) VALUES (1, 'Teste');"
                    rows={8}
                    error={errors.script?.message}
                />
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
                    {initialData?.id ? 'Atualizar' : 'Criar'} Entrega
                </Button>
            </div>
        </form>
    );
};

export default DeliveryForm;