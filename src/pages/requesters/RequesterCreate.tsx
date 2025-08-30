import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone } from 'lucide-react';
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
        <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header Mobile/Desktop */}
                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="flex items-center p-2 sm:px-3 sm:py-2"
                    >
                        <ArrowLeft className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Voltar</span>
                    </Button>
                </div>

                {/* Card Principal */}
                <Card className="overflow-hidden">
                    {/* Header do Card */}
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Novo Solicitante
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Preencha as informações para criar um novo solicitante
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Formulário Responsivo */}
                    <div className="px-4 py-5 sm:px-6">
                        <RequesterForm
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            loading={loading}
                        />
                    </div>
                </Card>

                {/* Informações Adicionais - Visível apenas no mobile */}
                <div className="lg:hidden">
                    <Card className="p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Dicas</h4>
                        <div className="space-y-3 text-sm text-gray-600">
                            <div className="flex items-start gap-3">
                                <User className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <strong>Nome:</strong> Informe o nome completo do solicitante
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <strong>Email:</strong> Obrigatório - usado para notificações e comunicações
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <strong>Telefone:</strong> Campo opcional para contato adicional
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default RequesterCreate;