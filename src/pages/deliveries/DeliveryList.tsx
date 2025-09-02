import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, Edit, Trash2, Eye, Download, Search, Filter, 
    Package, FolderOpen, CheckCircle2, Clock, AlertTriangle,
    Activity, ArrowUpDown, ChevronDown, ChevronRight, Users
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
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
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
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<DeliveryFilters>({});
    const [sorting, setSorting] = useState<SortInfo>({ field: 'createdAt', direction: 'desc' });
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

            if (searchTerm.trim()) {
                searchFilters.taskName = searchTerm;
            }

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
    }, [currentPage, pageSize, sorting, filters, searchTerm]);

    // Debounce para busca
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(0); // Reset para primeira página ao buscar
            fetchDeliveryGroups();
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

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
    const formatCurrency = (value?: number) => {
        if (!value) return 'N/A';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

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

    // Render dos cartões de entrega
    const DeliveryGroupCard = ({ group }: { group: DeliveryGroupResponse }) => {
        const [expanded, setExpanded] = useState(false);
        const statusColor = getStatusColor(group.deliveryStatus as DeliveryStatus);
        
        return (
            <Card className="hover:shadow-md transition-shadow">
                {/* Header do card */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-gray-500" />
                            <div>
                                <h3 className="font-semibold text-gray-900">{group.taskName}</h3>
                                <p className="text-sm text-gray-600">{group.taskCode}</p>
                            </div>
                        </div>
                        
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                            {getStatusLabel(group.deliveryStatus as DeliveryStatus)}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {group.taskValue && (
                            <span className="text-sm font-medium text-green-600">
                                {formatCurrency(group.taskValue)}
                            </span>
                        )}
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
                
                {/* Status counts */}
                <div className="px-4 py-3 bg-gray-50">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                            <span className="text-gray-600">
                                Total: <span className="font-medium">{group.totalDeliveries}</span>
                            </span>
                            <span className="text-green-600">
                                Concluídos: <span className="font-medium">{group.completedDeliveries}</span>
                            </span>
                            <span className="text-gray-600">
                                Pendentes: <span className="font-medium">{group.pendingDeliveries}</span>
                            </span>
                        </div>
                        
                        <div className="text-gray-500">
                            {formatDate(group.createdAt || '')}
                        </div>
                    </div>
                    
                    {/* Barra de progresso */}
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ 
                                width: `${group.totalDeliveries > 0 ? (group.completedDeliveries / group.totalDeliveries) * 100 : 0}%` 
                            }}
                        />
                    </div>
                </div>
                
                {/* Status breakdown expandido */}
                {expanded && group.statusCounts && (
                    <div className="p-4 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Detalhamento por Status</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(group.statusCounts).map(([status, count]) => (
                                <div key={status} className="text-center">
                                    <div className={`text-lg font-semibold ${getStatusColor(status.toUpperCase() as DeliveryStatus).split(' ')[0]}`}>
                                        {count}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {getStatusLabel(status.toUpperCase() as DeliveryStatus)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Ações */}
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(group)}
                        >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Detalhes
                        </Button>
                        
                        {canEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(group)}
                            >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                            </Button>
                        )}
                    </div>
                    
                    {canDelete && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(group)}
                            className="text-red-600 hover:text-red-800 hover:border-red-300"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </Card>
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

            {/* Filtros */}
            <Card className="p-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <Input
                            type="text"
                            placeholder="Buscar por nome ou código da tarefa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={Search}
                        />
                    </div>
                    
                    <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filtros
                    </Button>
                </div>
            </Card>

            {/* Lista */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                    <span className="ml-3 text-gray-600">Carregando entregas...</span>
                </div>
            ) : deliveryGroups.length === 0 ? (
                <Card className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {searchTerm ? 'Nenhuma entrega encontrada' : 'Nenhuma entrega criada'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {searchTerm 
                            ? 'Tente ajustar os termos de busca' 
                            : 'Crie sua primeira entrega para começar'}
                    </p>
                    {!searchTerm && canCreate && (
                        <div className="mt-6">
                            <Button onClick={() => navigate('/deliveries/create')}>
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Entrega
                            </Button>
                        </div>
                    )}
                </Card>
            ) : (
                <>
                    <div className="grid gap-4">
                        {deliveryGroups.map((group) => (
                            <DeliveryGroupCard key={group.taskId} group={group} />
                        ))}
                    </div>
                    
                    {/* Paginação */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4">
                            <div className="text-sm text-gray-700">
                                Exibindo {pagination.numberOfElements} de {pagination.totalElements} entregas
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.first}
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                >
                                    Anterior
                                </Button>
                                
                                <span className="text-sm text-gray-600">
                                    Página {pagination.number + 1} de {pagination.totalPages}
                                </span>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.last}
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                >
                                    Próxima
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

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