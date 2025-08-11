import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useQuotes } from '../../hooks/useQuotes';
import { useProjects } from '../../hooks/useProjects';
import { deliverySchema } from '../../utils/validationSchemas';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

const DeliveryForm = ({
                          initialData = null,
                          onSubmit,
                          onCancel,
                          loading = false
                      }) => {
    const { quotes, loading: quotesLoading } = useQuotes();
    const { projects, loading: projectsLoading } = useProjects();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
    } = useForm({
        resolver: yupResolver(deliverySchema),
        defaultValues: {
            quoteId: initialData?.quoteId || '',
            projectId: initialData?.projectId || '',
            branch: initialData?.branch || '',
            pullRequest: initialData?.pullRequest || '',
            script: initialData?.script || '',
            status: initialData?.status || 'PENDING',
        },
    });

    const selectedQuoteId = watch('quoteId');

    const handleFormSubmit = async (data) => {
        try {
            // Converter IDs para números
            const formattedData = {
                ...data,
                quoteId: parseInt(data.quoteId),
                projectId: parseInt(data.projectId),
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
        { value: 'TESTING', label: 'Em Teste' },
        { value: 'DELIVERED', label: 'Entregue' },
        { value: 'APPROVED', label: 'Aprovado' },
        { value: 'REJECTED', label: 'Rejeitado' }
    ];

    if (quotesLoading || projectsLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                    {...register('quoteId', { valueAsNumber: false })}
                    label="Orçamento"
                    placeholder="Selecione um orçamento"
                    error={errors.quoteId?.message}
                    required
                >
                    {quotes.map(quote => (
                        <option key={quote.id} value={quote.id}>
                            {quote.title || `Orçamento #${quote.id}`}
                        </option>
                    ))}
                </Select>

                <Select
                    {...register('projectId', { valueAsNumber: false })}
                    label="Projeto"
                    placeholder="Selecione um projeto"
                    error={errors.projectId?.message}
                    required
                >
                    {projects.map(project => (
                        <option key={project.id} value={project.id}>
                            {project.name}
                        </option>
                    ))}
                </Select>

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

            <div className="md:col-span-2">
                <TextArea
                    {...register('script')}
                    label="Script de Banco de Dados"
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
                    {initialData ? 'Atualizar' : 'Criar'} Entrega
                </Button>
            </div>
        </form>
    );
};

export default DeliveryForm;