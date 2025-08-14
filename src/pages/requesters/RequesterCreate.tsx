import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useRequesters } from '@/hooks/useRequesters';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import RequesterForm from '../../components/forms/RequesterForm';

interface RequesterFormData {
    name: string;
    email: string;
    phone: string;
}

const RequesterCreate: React.FC = () => {
    const navigate = useNavigate();
    const { createRequester } = useRequesters();
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (data: RequesterFormData): Promise<void> => {
        try {
            setLoading(true);
            await createRequester(data);
            navigate('/requesters');
        } catch (error) {
            // Error handled by the hook and form
            console.error('Erro ao criar solicitante:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = (): void => {
        navigate('/requesters');
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="flex items-center"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar
                </Button>
            </div>

            <Card
                title="Novo Solicitante"
                subtitle="Preencha as informações para criar um novo solicitante"
            >
                <RequesterForm
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={loading}
                />
            </Card>
        </div>
    );
};

export default RequesterCreate;