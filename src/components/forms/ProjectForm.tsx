import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface ProjectData {
    name: string;
    repositoryUrl?: string;
}

interface ProjectFormProps {
    initialData?: Partial<ProjectData> | null;
    onSubmit: (data: ProjectData) => Promise<void>;
    loading?: boolean;
}

const schema = yup.object({
    name: yup.string().required('Nome é obrigatório').max(100, 'Máximo 100 caracteres'),
    repositoryUrl: yup.string().url('URL inválida').max(300, 'Máximo 300 caracteres').optional(),
});

const ProjectForm: React.FC<ProjectFormProps> = ({
                                                     initialData = null,
                                                     onSubmit,
                                                     loading = false
                                                 }) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<ProjectData>({
        resolver: yupResolver(schema),
        defaultValues: {
            name: initialData?.name || '',
            repositoryUrl: initialData?.repositoryUrl || '',
        },
    });

    const handleFormSubmit = async (data: ProjectData): Promise<void> => {
        await onSubmit(data);
        if (!initialData) reset();
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <Input
                {...register('name')}
                label="Nome do Projeto"
                placeholder="Digite o nome do projeto"
                error={errors.name?.message}
                required
            />
            <Input
                {...register('repositoryUrl')}
                label="URL do Repositório"
                placeholder="https://github.com/seu-repo"
                error={errors.repositoryUrl?.message}
            />
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                    type="submit"
                    loading={isSubmitting || loading}
                    disabled={isSubmitting || loading}
                >
                    {initialData ? 'Atualizar' : 'Criar'} Projeto
                </Button>
            </div>
        </form>
    );
};

export default ProjectForm;