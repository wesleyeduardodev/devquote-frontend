import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, Edit, Trash2, Eye, Download, Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { 
    DeliveryGroupResponse, 
    DeliveryFilters, 
    DeliveryStatus,
    DeliveryStatusCount
} from '../../types/delivery.types';
import { deliveryService } from '../../services/deliveryService';
import { PaginatedResponse } from '../../types/api.types';
import DataTable, { Column } from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DeliveryGroupModal from '../../components/deliveries/DeliveryGroupModal';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';

interface SortInfo {
    field: string;
    direction: 'asc' | 'desc';
}

const DeliveryList: React.FC = () => {
    const navigate = useNavigate();
    const { hasProfile } = useAuth();

    // Verificações de perfil
    const isAdmin = hasProfile('ADMIN');
    const isManager = hasProfile('MANAGER');
    const canCreate = isAdmin || isManager;
    const canEdit = isAdmin || isManager;
    const canDelete = isAdmin;

    // Estados principais
    const [deliveryGroups, setDeliveryGroups] = useState<DeliveryGroupResponse[]>([]);
    const [pagination, setPagination] = useState<PaginatedResponse<DeliveryGroupResponse> | null>(null);
    const [statistics, setStatistics] = useState<DeliveryStatusCount | null>(null);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    // Estados de filtros e busca
    const [filters, setFilters] = useState<DeliveryFilters>({});
    const [sorting, setSorting] = useState<SortInfo>({ field: 'task.id', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Estados dos modals
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<DeliveryGroupResponse | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<DeliveryGroupResponse | null>(null);

    // Carregar estatísticas
    const fetchStatistics = async () => {
        try {
            const stats = await deliveryService.getGlobalStatistics();
            setStatistics(stats);
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    };

    // Carregar dados
    const fetchDeliveryGroups = async () => {
        setLoading(true);
        try {
            const searchFilters: DeliveryFilters = {
                ...filters
            };

            const response = await deliveryService.getAllGroupedByTask({
                page: currentPage,
                size: pageSize,
                sort: [sorting],
                filters: searchFilters
            });

            setPagination(response);
            
            // Aplicar filtro de status no frontend se necessário
            let filteredContent = response.content || [];
            if (filters.deliveryStatus) {
                const statusFilter = filters.deliveryStatus.toLowerCase();
                filteredContent = filteredContent.filter(delivery => {
                    const actualStatus = (delivery.calculatedDeliveryStatus || delivery.deliveryStatus || '').toLowerCase();
                    const statusLabel = getStatusLabel((delivery.calculatedDeliveryStatus || delivery.deliveryStatus) as DeliveryStatus).toLowerCase();
                    // Filtrar tanto pelo valor do enum quanto pelo label em português
                    return actualStatus.includes(statusFilter) || statusLabel.includes(statusFilter);
                });
            }
            
            setDeliveryGroups(filteredContent);
        } catch (error) {
            console.error('Erro ao carregar entregas:', error);
            toast.error('Erro ao carregar entregas');
        } finally {
            setLoading(false);
        }
    };

    // Carregar dados quando dependências mudarem
    useEffect(() => {
        fetchDeliveryGroups();
        fetchStatistics(); // Carregar estatísticas na primeira vez
    }, [currentPage, pageSize, sorting, filters]);

    // Definir colunas da tabela
    const columns: Column<DeliveryGroupResponse>[] = [
        {
            key: 'task.id',
            title: 'ID',
            sortable: true,
            render: (delivery) => (
                <span className="font-medium text-gray-900">
                    #{delivery.taskId || 'N/A'}
                </span>
            ),
            width: '80px'
        },
        {
            key: 'task.code',
            title: 'Código',
            sortable: true,
            filterable: true,
            render: (delivery) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {delivery.taskCode || 'N/A'}
                </span>
            ),
            width: '120px'
        },
        {
            key: 'task.title',
            title: 'Título da Tarefa',
            sortable: true,
            filterable: true,
            render: (delivery) => (
                <div className="max-w-sm">
                    <div className="font-medium text-gray-900 truncate" title={delivery.taskName || 'N/A'}>
                        {delivery.taskName || 'N/A'}
                    </div>
                </div>
            ),
            width: '300px'
        },
        {
            key: 'deliveryStatus',
            title: 'Status',
            sortable: true,
            filterable: true,
            render: (delivery) => {
                const status = (delivery.calculatedDeliveryStatus || delivery.deliveryStatus) as DeliveryStatus || 'PENDING';
                const statusColor = getStatusColor(status);
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {getStatusLabel(status)}
                    </span>
                );
            },
            width: '140px'
        },
        {
            key: 'totalItems',
            title: 'Qtd. Itens',
            sortable: true,
            render: (delivery) => (
                <div className="text-center font-medium text-gray-900">
                    {delivery.totalItems || 0}
                </div>
            ),
            width: '100px',
            align: 'center'
        },
        {
            key: 'actions',
            title: 'Ações',
            sortable: false,
            filterable: false,
            render: (delivery) => (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(delivery)}
                        title="Ver detalhes"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    
                    {canEdit && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(delivery)}
                            title="Editar"
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(delivery)}
                            title="Excluir"
                            className="text-red-600 hover:text-red-800"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
            width: '120px',
            align: 'center'
        }
    ];

    // Handlers
    const handleView = async (group: DeliveryGroupResponse) => {
        try {
            const groupDetails = await deliveryService.getGroupDetailsByTaskId(group.taskId);
            setSelectedGroup(groupDetails);
            setShowDetailModal(true);
        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
            toast.error('Erro ao carregar detalhes da entrega');
        }
    };

    const handleEdit = (group: DeliveryGroupResponse) => {
        // Pegar o ID da primeira entrega (relação 1:1 com task)
        const deliveryId = group.deliveries?.[0]?.id;
        
        if (deliveryId) {
            navigate(`/deliveries/${deliveryId}/edit`);
        } else {
            toast.error('Entrega não encontrada para edição');
        }
    };

    const handleDelete = (group: DeliveryGroupResponse) => {
        setGroupToDelete(group);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!groupToDelete) return;

        try {
            // Deletar a entrega (e seus itens) pela task ID
            const delivery = await deliveryService.getByTaskId(groupToDelete.taskId);
            if (delivery) {
                await deliveryService.delete(delivery.id);
                toast.success('Entrega excluída com sucesso!');
                fetchDeliveryGroups(); // Recarregar lista
            }
        } catch (error) {
            console.error('Erro ao excluir entrega:', error);
            toast.error('Erro ao excluir entrega');
        } finally {
            setShowDeleteModal(false);
            setGroupToDelete(null);
        }
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const response = await deliveryService.exportToExcelWithResponse();
            
            // Extrair nome do arquivo do Content-Disposition ou usar fallback
            const contentDisposition = response.headers['content-disposition'];
            let filename = `relatorio_entregas_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}_${new Date().toLocaleTimeString('pt-BR').replace(/:/g, '-')}.xlsx`;
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }
            
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.success('Exportação concluída!');
        } catch (error) {
            console.error('Erro ao exportar:', error);
            toast.error('Erro ao exportar dados');
        } finally {
            setIsExporting(false);
        }
    };

    const handleSort = (field: string) => {
        setSorting(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Formatadores

    const getStatusColor = (status: DeliveryStatus) => {
        const colors = {
            PENDING: 'text-yellow-700 bg-yellow-50 border border-yellow-100',
            DEVELOPMENT: 'text-blue-700 bg-blue-50 border border-blue-100',
            DELIVERED: 'text-green-700 bg-green-50 border border-green-100',
            HOMOLOGATION: 'text-amber-700 bg-amber-50 border border-amber-100',
            APPROVED: 'text-emerald-700 bg-emerald-50 border border-emerald-100',
            REJECTED: 'text-rose-700 bg-rose-50 border border-rose-100',
            PRODUCTION: 'text-violet-700 bg-violet-50 border border-violet-100'
        };
        return colors[status] || colors.PENDING;
    };

    const getStatusLabel = (status: DeliveryStatus) => {
        const labels = {
            PENDING: 'Pendente',
            DEVELOPMENT: 'Desenvolvimento',
            DELIVERED: 'Entregue',
            HOMOLOGATION: 'Homologação',
            APPROVED: 'Aprovado',
            REJECTED: 'Rejeitado',
            PRODUCTION: 'Produção'
        };
        return labels[status] || status;
    };

    // Função para renderizar os cards de estatísticas
    const renderStatisticsCards = () => {
        if (!statistics) return null;

        const statusCards = [
            { 
                key: 'pending', 
                label: 'Pendente', 
                count: statistics.pending, 
                color: 'bg-yellow-50 text-yellow-700 border-yellow-100',
                icon: '⏳'
            },
            { 
                key: 'development', 
                label: 'Em Desenvolvimento', 
                count: statistics.development, 
                color: 'bg-blue-50 text-blue-700 border-blue-100',
                icon: '🔧'
            },
            { 
                key: 'delivered', 
                label: 'Entregue', 
                count: statistics.delivered, 
                color: 'bg-green-50 text-green-700 border-green-100',
                icon: '📦'
            },
            { 
                key: 'homologation', 
                label: 'Em Homologação', 
                count: statistics.homologation, 
                color: 'bg-amber-50 text-amber-700 border-amber-100',
                icon: '🔍'
            },
            { 
                key: 'approved', 
                label: 'Aprovado', 
                count: statistics.approved, 
                color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                icon: '✅'
            },
            { 
                key: 'rejected', 
                label: 'Rejeitado', 
                count: statistics.rejected, 
                color: 'bg-rose-50 text-rose-700 border-rose-100',
                icon: '❌'
            },
            { 
                key: 'production', 
                label: 'Em Produção', 
                count: statistics.production, 
                color: 'bg-violet-50 text-violet-700 border-violet-100',
                icon: '🚀'
            }
        ];

        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {statusCards.map(card => (
                    <Card key={card.key} className={`p-3 border ${card.color} hover:shadow-sm transition-shadow cursor-default`}>
                        <div className="text-center">
                            <div className="text-lg mb-1">{card.icon}</div>
                            <div className="text-xl font-bold mb-1">{card.count}</div>
                            <div className="text-xs font-medium leading-tight">{card.label}</div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    };


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Entregas</h1>
                    <p className="text-gray-600">Gerencie suas entregas agrupadas por tarefa</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <>
                                <LoadingSpinner size="sm" />
                                Exportando...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                Exportar Excel
                            </>
                        )}
                    </Button>
                    
                    {canCreate && (
                        <Button onClick={() => navigate('/deliveries/create')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Entrega
                        </Button>
                    )}
                </div>
            </div>

            {/* Estatísticas por Status */}
            {renderStatisticsCards()}

            {/* Mobile: Cards Layout */}
            <div className="block sm:hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <LoadingSpinner size="lg" />
                        <span className="ml-3 text-gray-600">Carregando entregas...</span>
                    </div>
                ) : deliveryGroups.filter(delivery => delivery && delivery.taskId).length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma entrega criada</h3>
                        <p className="mt-1 text-sm text-gray-500">Crie sua primeira entrega para começar</p>
                        {canCreate && (
                            <Button onClick={() => navigate('/deliveries/create')} className="mt-4">
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Entrega
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {deliveryGroups.filter(delivery => delivery && delivery.taskId).map((delivery) => (
                            <Card key={delivery.taskId} className="p-4">
                                <div className="space-y-3">
                                    {/* Header com ID e Código */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900">
                                                #{delivery.taskId || 'N/A'}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                {delivery.taskCode || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleView(delivery)}
                                                title="Ver detalhes"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            
                                            {canEdit && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(delivery)}
                                                    title="Editar"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                            
                                            {canDelete && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(delivery)}
                                                    title="Excluir"
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Título da Tarefa */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 leading-5">
                                            {delivery.taskName || 'N/A'}
                                        </h3>
                                    </div>

                                    {/* Status e Quantidade */}
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <span className="text-xs text-gray-500">Status:</span>
                                                <div className="mt-1">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor((delivery.calculatedDeliveryStatus || delivery.deliveryStatus) as DeliveryStatus || 'PENDING')}`}>
                                                        {getStatusLabel((delivery.calculatedDeliveryStatus || delivery.deliveryStatus) as DeliveryStatus || 'PENDING')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Itens:</span>
                                                <div className="mt-1">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {delivery.totalItems || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        
                        {/* Mobile Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-center space-x-1 py-4">
                                <button
                                    onClick={() => setCurrentPage(0)}
                                    disabled={currentPage === 0}
                                    className="px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md disabled:opacity-50"
                                    title="Primeira página"
                                >
                                    ⇤
                                </button>
                                <button
                                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                    disabled={currentPage === 0}
                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md disabled:opacity-50"
                                >
                                    ‹
                                </button>
                                <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
                                    {currentPage + 1} de {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(Math.min(pagination.totalPages - 1, currentPage + 1))}
                                    disabled={currentPage >= pagination.totalPages - 1}
                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md disabled:opacity-50"
                                >
                                    ›
                                </button>
                                <button
                                    onClick={() => setCurrentPage(pagination.totalPages - 1)}
                                    disabled={currentPage >= pagination.totalPages - 1}
                                    className="px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md disabled:opacity-50"
                                    title="Última página"
                                >
                                    ⇥
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Desktop: DataTable */}
            <Card className="p-0 hidden sm:block">
                <DataTable
                    data={deliveryGroups.filter(delivery => delivery && delivery.taskId)}
                    columns={columns}
                    loading={loading}
                    pagination={pagination ? {
                        currentPage: pagination.number || 0,
                        pageSize: pagination.size || 10,
                        totalElements: pagination.totalElements || 0,
                        totalPages: pagination.totalPages || 0,
                        first: pagination.first || false,
                        last: pagination.last || false
                    } : null}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    sorting={[{ field: sorting.field, direction: sorting.direction }]}
                    onSort={(field, direction) => setSorting({ field, direction })}
                    filters={filters}
                    onFilter={(field, value) => {
                        setFilters(prev => ({
                            ...prev,
                            [field]: value || undefined
                        }));
                        setCurrentPage(0);
                    }}
                    onClearFilters={() => setFilters({})}
                    emptyState={{
                        icon: Package,
                        title: 'Nenhuma entrega criada',
                        description: 'Crie sua primeira entrega para começar',
                        action: canCreate ? (
                            <Button onClick={() => navigate('/deliveries/create')}>
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Entrega
                            </Button>
                        ) : undefined
                    }}
                />
            </Card>

            {/* Modals */}

            {selectedGroup && (
                <DeliveryGroupModal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    deliveryGroup={selectedGroup}
                />
            )}

            {groupToDelete && (
                <DeleteConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleConfirmDelete}
                    title="Excluir Entrega"
                    message={`Tem certeza que deseja excluir a entrega da tarefa "${groupToDelete.taskName}"? Esta ação não pode ser desfeita.`}
                />
            )}
        </div>
    );
};

export default DeliveryList;