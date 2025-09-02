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
    DeliveryStatus 
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
            setDeliveryGroups(response.content || []);
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
                const status = delivery.deliveryStatus as DeliveryStatus || 'PENDING';
                const statusColor = getStatusColor(status);
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {getStatusLabel(status)}
                    </span>
                );
            },
            width: '120px'
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
        navigate(`/deliveries/task/${group.taskId}/edit`);
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
            const blob = await deliveryService.exportToExcel();
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `entregas_${new Date().toISOString().split('T')[0]}.xlsx`;
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
            PENDING: 'text-gray-600 bg-gray-100',
            DEVELOPMENT: 'text-blue-600 bg-blue-100',
            DELIVERED: 'text-green-600 bg-green-100',
            HOMOLOGATION: 'text-yellow-600 bg-yellow-100',
            APPROVED: 'text-emerald-600 bg-emerald-100',
            REJECTED: 'text-red-600 bg-red-100',
            PRODUCTION: 'text-purple-600 bg-purple-100'
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

            {/* Tabela */}
            <Card className="p-0">
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