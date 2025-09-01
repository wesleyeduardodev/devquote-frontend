import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, GitBranch, ExternalLink, Calendar, FileCode, Truck, Search, Filter, Hash, FolderOpen, StickyNote, GitMerge, Check, Eye, Download } from 'lucide-react';
import { useDeliveryGroups } from '@/hooks/useDeliveryGroups';
import { deliveryService } from '@/services/deliveryService';
import { useAuth } from '@/hooks/useAuth';
import DataTable, { Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import BulkDeleteModal from '@/components/ui/BulkDeleteModal';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import DeliveryGroupModal from '@/components/deliveries/DeliveryGroupModal';
import toast from 'react-hot-toast';

interface DeliveryGroup {
    taskId: number;
    taskName: string;
    taskCode: string;
    deliveryStatus: string; // Status calculado das entregas
    createdAt: string;
    updatedAt: string;
    totalDeliveries: number;
    completedDeliveries: number;
    pendingDeliveries: number;
    deliveries: any[];
    latestDeliveryId?: number; // ID da entrega mais recente
}

const DeliveryList: React.FC = () => {
    const navigate = useNavigate();
    const { hasProfile } = useAuth();

    // Verificações de perfil
    const isAdmin = hasProfile('ADMIN');
    const isManager = hasProfile('MANAGER');
    const canViewValues = isAdmin || isManager; // ADMIN e MANAGER podem ver valores
    const isReadOnly = !isAdmin; // MANAGER e USER têm apenas leitura

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<DeliveryGroup | null>(null);

    const {
        deliveryGroups,
        pagination,
        loading,
        sorting,
        filters,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
        getGroupDetails,
        refetch,
        deleteGroup,
        deleteGroups
    } = useDeliveryGroups();

    const handleView = async (deliveryGroup: DeliveryGroup) => {
        try {
            const groupDetails = await getGroupDetails(deliveryGroup.taskId);
            if (groupDetails) {
                setSelectedDelivery(groupDetails);
                setShowDetailModal(true);
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes do grupo:', error);
            toast.error('Erro ao carregar detalhes do grupo');
        }
    };

    const handleEdit = (taskId: number) => {
        navigate(`/deliveries/group/${taskId}/edit`);
    };

    const handleExportToExcel = async () => {
        try {
            setIsExporting(true);
            const blob = await deliveryService.exportToExcel();

            // Criar URL para download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Nome do arquivo com timestamp
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/[:\-]/g, '').replace('T', '_');
            link.download = `relatorio_entregas_${timestamp}.xlsx`;

            // Trigger download
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Relatório exportado com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar relatório:', error);
            toast.error('Erro ao exportar relatório');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDelete = (deliveryGroup: DeliveryGroup) => {
        setItemToDelete(deliveryGroup);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        
        setIsDeleting(true);
        try {
            await deleteGroup(itemToDelete.taskId);
        } catch (error) {
            // O erro já é tratado no hook
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
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

    const formatDateShort = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            IN_PROGRESS: 'bg-blue-100 text-blue-800',
            COMPLETED: 'bg-green-100 text-green-800',
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
            COMPLETED: 'Completado',
            TESTING: 'Em Teste',
            DELIVERED: 'Entregue',
            APPROVED: 'Aprovado',
            REJECTED: 'Rejeitado'
        };
        return labels[status] || status;
    };

    // Funções de seleção múltipla
    const toggleItem = (taskId: number) => {
        setSelectedItems(prev =>
            prev.includes(taskId)
                ? prev.filter(item => item !== taskId)
                : [...prev, taskId]
        );
    };

    const toggleAll = () => {
        const currentPageIds = deliveryGroups.map(group => group.taskId);
        const allSelected = currentPageIds.every(id => selectedItems.includes(id));

        if (allSelected) {
            setSelectedItems(prev => prev.filter(id => !currentPageIds.includes(id)));
        } else {
            setSelectedItems(prev => [...new Set([...prev, ...currentPageIds])]);
        }
    };

    const clearSelection = () => {
        setSelectedItems([]);
    };

    // Estados derivados
    const selectionState = useMemo(() => {
        const currentPageIds = deliveryGroups.map(group => group.taskId);
        const selectedFromCurrentPage = selectedItems.filter(id => currentPageIds.includes(id));

        return {
            allSelected: currentPageIds.length > 0 && selectedFromCurrentPage.length === currentPageIds.length,
            someSelected: selectedFromCurrentPage.length > 0 && selectedFromCurrentPage.length < currentPageIds.length,
            hasSelection: selectedItems.length > 0,
            selectedFromCurrentPage
        };
    }, [deliveryGroups, selectedItems]);

    const handleBulkDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteGroups(selectedItems);
            clearSelection();
            setShowBulkDeleteModal(false);
        } catch (error) {
            // O erro já é tratado no hook
        } finally {
            setIsDeleting(false);
        }
    };

    // Filtrar delivery groups baseado na busca (apenas para mobile)
    const filteredDeliveryGroups = deliveryGroups.filter(group =>
        group.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.taskCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getStatusLabel(group.deliveryStatus).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns: Column<DeliveryGroup>[] = [
        // Checkbox de seleção - apenas para ADMIN
        ...(isAdmin ? [{
            key: 'select',
            title: '',
            width: '50px',
            align: 'center',
            headerRender: () => (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        checked={selectionState.allSelected}
                        ref={(input) => {
                            if (input) {
                                input.indeterminate = selectionState.someSelected;
                            }
                        }}
                        onChange={toggleAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        title={selectionState.allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                    />
                </div>
            ),
            render: (item) => (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        checked={selectedItems.includes(item.taskId)}
                        onChange={() => toggleItem(item.taskId)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )
        }] : []),
        // Colunas que todos podem ver
        {
            key: 'taskId',
            title: 'ID Tarefa',
            sortable: true,
            filterable: true,
            filterType: 'number',
            width: '120px',
            align: 'center',
            render: (item) => (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    #{item.taskId}
                </span>
            )
        },
        {
            key: 'taskCode',
            title: 'Código da Tarefa',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '140px',
            render: (item) => (
                <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {item.taskCode}
                </span>
            )
        },
        {
            key: 'taskName',
            title: 'Nome da Tarefa',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '300px',
            render: (item) => (
                <div>
                    <p
                        className="font-medium text-gray-900 truncate cursor-help"
                        title={item.taskName}
                    >
                        {item.taskName}
                    </p>
                </div>
            )
        },
        {
            key: 'deliveryStatus',
            title: 'Status',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '120px',
            align: 'center',
            render: (item) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.deliveryStatus)}`}>
                    {getStatusLabel(item.deliveryStatus)}
                </span>
            )
        },
        {
            key: 'totalDeliveries',
            title: 'Total Entregas',
            sortable: false,
            filterable: false,
            width: '120px',
            align: 'center',
            render: (item) => (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                    {item.totalDeliveries}
                </span>
            )
        },
        {
            key: 'createdAt',
            title: 'Criado em',
            sortable: true,
            filterable: true,
            filterType: 'date',
            render: (item) => formatDate(item.createdAt),
            hideable: true
        },
        {
            key: 'updatedAt',
            title: 'Atualizado em',
            sortable: true,
            filterable: true,
            filterType: 'date',
            render: (item) => formatDate(item.updatedAt),
            hideable: true
        },
        // Coluna de ações
        {
            key: 'actions',
            title: 'Ações',
            align: 'center' as const,
            width: isAdmin ? '150px' : '80px',
            render: (item: DeliveryGroup) => (
                <div className="flex items-center justify-center gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(item)}
                        title="Visualizar detalhes das entregas"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    {isAdmin && (
                        <>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(item.taskId)}
                                title="Editar grupo"
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(item)}
                                title="Excluir grupo"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </>
                    )}
                </div>
            ),
        }
    ];

    // Componente Card para visualização mobile
    const DeliveryGroupCard: React.FC<{ deliveryGroup: DeliveryGroup }> = ({ deliveryGroup }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            {/* Header do Card */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox - apenas para ADMIN */}
                    {isAdmin && (
                        <div className="flex-shrink-0 pt-1">
                            <input
                                type="checkbox"
                                checked={selectedItems.includes(deliveryGroup.taskId)}
                                onChange={() => toggleItem(deliveryGroup.taskId)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                        </div>
                    )}

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                #{deliveryGroup.taskId}
                            </span>
                            <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {deliveryGroup.taskCode}
                            </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-2">
                            {deliveryGroup.taskName}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(deliveryGroup.deliveryStatus)}`}>
                                {getStatusLabel(deliveryGroup.deliveryStatus)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Ações */}
                <div className="flex gap-1 ml-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(deliveryGroup)}
                        title="Visualizar detalhes das entregas"
                        className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    {isAdmin && (
                        <>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(deliveryGroup.taskId)}
                                title="Editar grupo"
                                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(deliveryGroup)}
                                title="Excluir grupo"
                                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Informações do Grupo de Entregas */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                    <Truck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{deliveryGroup.totalDeliveries} entregas</span>
                </div>


                <div className="flex items-center justify-between text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>Criado em {formatDateShort(deliveryGroup.createdAt)}</span>
                    </div>
                    {deliveryGroup.updatedAt !== deliveryGroup.createdAt && (
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>Atualizado em {formatDateShort(deliveryGroup.updatedAt)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isAdmin ? 'Gerenciamento de Entregas' : 'Visualização de Entregas'}
                    </h1>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        variant="outline"
                        onClick={handleExportToExcel}
                        disabled={isExporting}
                        className="flex items-center justify-center sm:justify-start"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {isExporting ? 'Exportando...' : 'Exportar Excel'}
                    </Button>
                    {isAdmin && (
                        <Button
                            variant="primary"
                            onClick={() => navigate('/deliveries/create')}
                            className="flex items-center justify-center sm:justify-start"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Entrega
                        </Button>
                    )}
                </div>
            </div>

            {/* Filtros Mobile - Barra de pesquisa simples apenas para mobile */}
            <div className="lg:hidden space-y-4">
                <Card className="p-4">
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar por tarefa, código, projeto, branch ou notas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                            />
                        </div>

                        {isAdmin && (
                            <div className="flex items-center justify-between gap-3">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={toggleAll}
                                    className="flex items-center gap-2"
                                >
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectionState.allSelected}
                                            ref={(input) => {
                                                if (input) {
                                                    input.indeterminate = selectionState.someSelected;
                                                }
                                            }}
                                            readOnly
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                    </div>
                                    <span className="text-sm">Selecionar Todos</span>
                                </Button>

                                {selectionState.hasSelection && (
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => setShowBulkDeleteModal(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="text-sm">Excluir ({selectedItems.length})</span>
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Estatísticas - Responsivas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-100">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                            <div className="text-xs sm:text-sm font-medium text-gray-500">Total</div>
                            <div className="text-lg sm:text-2xl font-bold text-gray-900">
                                {pagination?.totalElements || 0}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-100">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <FileCode className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                            <div className="text-xs sm:text-sm font-medium text-gray-500">Grupos</div>
                            <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                                {deliveryGroups.length}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-100">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <FileCode className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                            <div className="text-xs sm:text-sm font-medium text-gray-500">Total Entregas</div>
                            <div className="text-lg sm:text-2xl font-bold text-green-600">
                                {deliveryGroups.reduce((acc, g) => acc + g.totalDeliveries, 0)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-100 col-span-2 lg:col-span-1">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <FileCode className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                            <div className="text-xs sm:text-sm font-medium text-gray-500">Concluídas</div>
                            <div className="text-lg sm:text-2xl font-bold text-emerald-600">
                                {deliveryGroups.reduce((acc, g) => acc + g.completedDeliveries, 0)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conteúdo Responsivo */}
            {loading ? (
                <Card className="p-8">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <span className="ml-4 text-gray-600">Carregando...</span>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Visualização Desktop - Tabela com filtros originais */}
                    <div className="hidden lg:block space-y-4">
                        {/* Barra de ações para desktop */}
                        {isAdmin && selectionState.hasSelection && (
                            <Card className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-700">
                                            {selectedItems.length} entrega(s) selecionada(s)
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={clearSelection}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            Limpar seleção
                                        </Button>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => setShowBulkDeleteModal(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Excluir Selecionadas
                                    </Button>
                                </div>
                            </Card>
                        )}

                        <Card className="p-0">
                            <DataTable
                                data={deliveryGroups}
                                columns={columns}
                                loading={loading}
                                pagination={pagination}
                                sorting={sorting}
                                filters={filters}
                                onPageChange={setPage}
                                onPageSizeChange={setPageSize}
                                onSort={setSorting}
                                onFilter={setFilter}
                                onClearFilters={clearFilters}
                                emptyMessage="Nenhum grupo de entregas encontrado"
                                showColumnToggle={true}
                                hiddenColumns={['createdAt', 'updatedAt']}
                            />
                        </Card>
                    </div>

                    {/* Visualização Mobile/Tablet - Cards com busca simples */}
                    <div className="lg:hidden">
                        {filteredDeliveryGroups.length === 0 ? (
                            <Card className="p-8 text-center">
                                <div className="text-gray-500">
                                    <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-lg font-medium mb-2">Nenhum grupo de entregas encontrado</h3>
                                    <p>Tente ajustar os filtros de busca ou criar uma nova entrega.</p>
                                </div>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {filteredDeliveryGroups.map((deliveryGroup) => (
                                    <DeliveryGroupCard key={deliveryGroup.taskId} deliveryGroup={deliveryGroup} />
                                ))}
                            </div>
                        )}

                        {/* Paginação Simplificada para Mobile */}
                        {pagination && pagination.totalPages > 1 && (
                            <Card className="p-4">
                                <div className="flex items-center justify-between">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setPage(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage <= 1}
                                    >
                                        Anterior
                                    </Button>

                                    <span className="text-sm text-gray-600">
                                        Página {pagination.currentPage} de {pagination.totalPages}
                                    </span>

                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setPage(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage >= pagination.totalPages}
                                    >
                                        Próxima
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                </>
            )}

            {/* Modal de exclusão em massa */}
            <BulkDeleteModal
                isOpen={showBulkDeleteModal}
                onClose={() => setShowBulkDeleteModal(false)}
                onConfirm={handleBulkDelete}
                selectedCount={selectedItems.length}
                isDeleting={isDeleting}
                entityName="entrega"
            />

            {/* Modal de detalhes do grupo de entregas */}
            <DeliveryGroupModal
                deliveryGroup={selectedDelivery}
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedDelivery(null);
                }}
            />

            {/* Modal de confirmação de exclusão */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setItemToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                itemName={itemToDelete?.taskName}
                isDeleting={isDeleting}
                title="Confirmar Exclusão do Grupo"
                description="Tem certeza que deseja excluir todas as entregas desta tarefa?"
            />
        </div>
    );
};

export default DeliveryList;
