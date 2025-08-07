import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Input from '../ui/Input';
import Button from '../ui/Button';

const schema = yup.object().shape({
  name: yup.string().required('Nome é obrigatório').max(100, 'Máximo 100 caracteres'),
  repositoryUrl: yup.string().url('URL inválida').max(300, 'Máximo 300 caracteres').nullable().notRequired(),
});

const ProjectForm = ({ initialData = null, onSubmit, loading = false }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      repositoryUrl: initialData?.repositoryUrl || '',
    },
  });

  const handleFormSubmit = async (data) => {
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
        <Button type="submit" loading={isSubmitting || loading} disabled={isSubmitting || loading}>
          {initialData ? 'Atualizar' : 'Criar'} Projeto
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;
