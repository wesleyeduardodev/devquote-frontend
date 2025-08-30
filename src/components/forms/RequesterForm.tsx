import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface RequesterData {
    name: string;
    email: string;
    phone?: string;
}

interface RequesterFormProps {
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
}

const schema = yup.object({
    name: yup.string().required('Nome é obrigatório').max(200, 'Máximo 200 caracteres'),
    email: yup.string().required('Email é obrigatório').email('Email inválido').max(200, 'Máximo 200 caracteres'),
    phone: yup.string().max(20, 'Máximo 20 caracteres').optional(),
});

const RequesterForm: React.FC<RequesterFormProps> = ({
                                                         initialData = null,
                                                         onSubmit,
                                                         onCancel,
                                                         loading = false
                                                     }) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<RequesterData>({
        resolver: yupResolver(schema),
        defaultValues: {
            name: initialData?.name || '',
            email: initialData?.email || '',
            phone: initialData?.phone || '',
        },
    });

    const handleFormSubmit = async (data: RequesterData): Promise<void> => {
        try {
            await onSubmit(data);
            if (!initialData) {
                reset(); // Reset form only for create mode
            }
        } catch (error) {
            // Error is handled by the parent component
        }
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                <Input
                    {...register('name')}
                    label="Nome"
                    placeholder="Digite o nome completo"
                    error={errors.name?.message}
                    required
                />

                <Input
                    {...register('email')}
                    type="email"
                    label="Email"
                    placeholder="email@exemplo.com"
                    error={errors.email?.message}
                    required
                />

                <Input
                    {...register('phone')}
                    label="Telefone"
                    placeholder="(11) 99999-9999"
                    error={errors.phone?.message}
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
                    {initialData ? 'Atualizar' : 'Criar'} Solicitante
                </Button>
            </div>
        </form>
    );
};

export default RequesterForm;