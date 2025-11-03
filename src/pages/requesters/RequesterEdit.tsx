import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Calendar, Edit3 } from 'lucide-react';
import { requesterService } from '@/services/requesterService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import toast from 'react-hot-toast';

interface Requester {
    id: string;
    name: string;
    email: string;
    phone: string;
    createdAt: string;
    updatedAt: string;
}

interface FormData {
    name: string;
    email: string;
    phone: string;
}

const RequesterEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [requester, setRequester] = useState<Requester | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [fetchLoading, setFetchLoading] = useState<boolean>(true);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        const fetchRequester = async (): Promise<void> => {
            if (!id) {
                navigate('/requesters');
                return;
            }

            try {
                setFetchLoading(true);
                const data = await requesterService.getById(id);
                setRequester(data);
                setFormData({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || ''
                });
            } catch (error) {
                console.error('Erro ao buscar solicitante:', error);
                toast.error('Erro ao carregar solicitante. Redirecionando...');
                navigate('/requesters');
            } finally {
                setFetchLoading(false);
            }
        };

        if (id) {
            fetchRequester();
        }
    }, [id, navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        if (!id) return;

        try {
            setLoading(true);
            await requesterService.update(id, formData);
            toast.success('Solicitante atualizado com sucesso!');
            navigate('/requesters');
        } catch (error) {
            console.error('Erro ao atualizar solicitante:', error);
            toast.error('Erro ao atualizar solicitante. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = (): void => {
        navigate('/requesters');
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (fetchLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando solicitante...</p>
                </Card>
            </div>
        );
    }

    if (!requester) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Solicitante não encontrado
                    </h2>
                    <p className="text-gray-600 mb-6">
                        O solicitante que você está procurando não foi encontrado.
                    </p>
                    <Button
                        onClick={handleCancel}
                        variant="primary"
                        className="w-full"
                    >
                        Voltar para Listagem
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
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
                                    <Edit3 className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Editar Solicitante
                                    </h3>
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                                        #{requester.id}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Atualize as informações de {requester.name}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Formulário */}
                    <div className="px-4 py-5 sm:px-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Nome */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        Nome *
                                    </div>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base sm:text-sm"
                                    placeholder="Digite o nome completo"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        Email *
                                    </div>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base sm:text-sm"
                                    placeholder="Digite o email"
                                />
                            </div>

                            {/* Telefone */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        Telefone
                                    </div>
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base sm:text-sm"
                                    placeholder="Digite o telefone"
                                />
                            </div>

                            {/* Botões */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleCancel}
                                    disabled={loading}
                                    className="w-full sm:w-auto order-2 sm:order-1"
                                >
                                    Cancelar
                                </Button>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={loading}
                                    loading={loading}
                                    className="w-full sm:w-auto order-1 sm:order-2"
                                >
                                    Salvar Alterações
                                </Button>
                            </div>
                        </form>
                    </div>
                </Card>

                {/* Informações Adicionais - Mobile */}
                <div className="lg:hidden space-y-4">
                    {/* Metadados */}
                    <Card className="p-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Informações do Registro
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Criado em:</span>
                                <span className="text-gray-900">{formatDate(requester.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Atualizado em:</span>
                                <span className="text-gray-900">{formatDate(requester.updatedAt)}</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Informações Adicionais - Desktop */}
                <div className="hidden lg:block">
                    <Card className="p-4">
                        <div className="grid grid-cols-2 gap-6 text-sm">
                            <div>
                                <span className="text-gray-600">Criado em:</span>
                                <p className="text-gray-900 font-medium">{formatDate(requester.createdAt)}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Última atualização:</span>
                                <p className="text-gray-900 font-medium">{formatDate(requester.updatedAt)}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default RequesterEdit;