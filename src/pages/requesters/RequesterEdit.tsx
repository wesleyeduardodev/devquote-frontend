import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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

    if (fetchLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="ml-4 text-gray-600">Carregando...</p>
            </div>
        );
    }

    if (!requester) {
        return (
            <div className="max-w-2xl mx-auto">
                <Card className="text-center py-12">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Solicitante não encontrado
                    </h2>
                    <p className="text-gray-600 mb-4">
                        O solicitante que você está procurando não foi encontrado.
                    </p>
                    <Button
                        onClick={handleCancel}
                        variant="primary"
                    >
                        Voltar para Listagem
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
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
                title={
                    <div className="flex items-center gap-2">
                        <span>Editar Solicitante</span>
                        <span
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                #{requester.id}
                         </span>
                    </div>
                }
                subtitle={`Atualize as informações de ${requester.name}`}
            >

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nome */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Nome *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Digite o nome"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email *
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Digite o email"
                        />
                    </div>

                    {/* Telefone */}
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Telefone
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Digite o telefone"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex space-x-3 pt-6">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                            loading={loading}
                        >
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default RequesterEdit;
