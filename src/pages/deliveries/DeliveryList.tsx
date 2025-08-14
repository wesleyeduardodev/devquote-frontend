import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Truck, GitBranch, ExternalLink, Calendar, FileCode } from 'lucide-react';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useQuotes } from '@/hooks/useQuotes';
import { useProjects } from '@/hooks/useProjects';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const DeliveryList: React.FC = () => {
    const { deliveries, loading, deleteDelivery } = useDeliveries();
    const { quotes } = useQuotes();
    const { projects } = useProjects();
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir esta entrega?')) {
            try {
                setDeletingId(id);
                await deleteDelivery(id);
            } catch (error) {
            } finally {
                setDeletingId(null);
            }
        }
    };

    const getQuoteName = (quoteId: number) => {
        const quote = quotes.find((q: any) => q.id === quoteId);
        return quote?.title || `Orçamento #${quoteId}`;
    };

    const getProjectName = (projectId: number) => {
        const project = projects.find((p: any) => p.id === projectId);
        return project?.name || `Projeto #${projectId}`;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            IN_PROGRESS: 'bg-blue-100 text-blue-800',
            TESTING: 'bg-purple-100 text-purple-800',
            DELIVERED: 'bg-green-100 text-green-800',
            APPROVED: 'bg-emerald-100 text-emerald-800',
            REJECTED: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Pendente',
            IN_PROGRESS: 'Em Progresso',
            TESTING: 'Em Teste',
            DELIVERED: 'Entregue',
            APPROVED: 'Aprovado',
            REJECTED: 'Rejeitado'
        };
        return labels[status] || status;
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('pt-BR');
    };

    const formatDateShort = (dateString: string | undefined) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Entregas
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Gerencie as entregas dos projetos e orçamentos
                    </p>
                </div>

                <Link to="/deliveries/create">
                    <Button className="flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Entrega
                    </Button>
                </Link>
            </div>

            {deliveries.length === 0 ? (
                <Card className="text-center py-12">
                    <Truck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhuma entrega encontrada
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Comece criando sua primeira entrega de projeto.
                    </p>
                    <Link to="/deliveries/create">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Criar Primeira Entrega
                        </Button>
                    </Link>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {deliveries.map((delivery: any) => (
                        <Card key={delivery.id} className="hover:shadow-custom-lg transition-shadow">
                            <div className="space-y-4">
                                {/* Header da Entrega */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(delivery.status)}`}>
                                                {getStatusLabel(delivery.status)}
                                            </span>
                                            {delivery.branch && (
                                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-mono">
                                                    <GitBranch className="w-3 h-3 inline mr-1" />
                                                    {delivery.branch}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                            {getQuoteName(delivery.quoteId)}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {getProjectName(delivery.projectId)}
                                        </p>
                                    </div>
                                </div>

                                {/* Informações da Entrega */}
                                <div className="space-y-2">
                                    {delivery.pullRequest && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
                                            <a
                                                href={delivery.pullRequest}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary-600 hover:text-primary-700 truncate"
                                            >
                                                Ver Pull Request
                                            </a>
                                        </div>
                                    )}

                                    {delivery.script && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <FileCode className="w-4 h-4 mr-2 flex-shrink-0" />
                                            <span className="truncate">
                                                Script SQL incluído ({delivery.script.length} caracteres)
                                            </span>
                                        </div>
                                    )}

                                    {(delivery.startedAt || delivery.finishedAt) && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                                            <div className="flex-1">
                                                {delivery.startedAt && (
                                                    <div>Iniciado: {formatDateShort(delivery.startedAt)}</div>
                                                )}
                                                {delivery.finishedAt && (
                                                    <div>Finalizado: {formatDateShort(delivery.finishedAt)}</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Script Preview */}
                                {delivery.script && (
                                    <div className="border-t pt-3">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Script SQL:</h4>
                                        <div className="bg-gray-50 rounded-md p-3 max-h-20 overflow-y-auto">
                                            <code className="text-xs text-gray-800 whitespace-pre-wrap">
                                                {delivery.script.length > 200
                                                    ? `${delivery.script.substring(0, 200)}...`
                                                    : delivery.script
                                                }
                                            </code>
                                        </div>
                                    </div>
                                )}

                                {/* Data de criação */}
                                <div className="text-xs text-gray-500 border-t pt-3">
                                    <div>Criada em: {formatDate(delivery.createdAt)}</div>
                                    {delivery.updatedAt !== delivery.createdAt && (
                                        <div className="mt-1">
                                            Atualizada em: {formatDate(delivery.updatedAt)}
                                        </div>
                                    )}
                                </div>

                                {/* Ações */}
                                <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                                    <Link to={`/deliveries/${delivery.id}/edit`}>
                                        <Button size="sm" variant="outline">
                                            <Edit className="w-4 h-4 mr-1" />
                                            Editar
                                        </Button>
                                    </Link>

                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => handleDelete(delivery.id)}
                                        loading={deletingId === delivery.id}
                                        disabled={deletingId === delivery.id}
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Excluir
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DeliveryList;