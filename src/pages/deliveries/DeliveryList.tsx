import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, GitBranch, ExternalLink, Calendar, FileCode, Truck, Search, Filter, Hash, FolderOpen, StickyNote, GitMerge, Check, Eye } from 'lucide-react';
import { useDeliveryGroups } from '@/hooks/useDeliveryGroups';
import { useAuth } from '@/hooks/useAuth';
import DataTable, { Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import BulkDeleteModal from '@/components/ui/BulkDeleteModal';
import DeliveryGroupModal from '@/components/deliveries/DeliveryGroupModal';
import toast from 'react-hot-toast';

interface DeliveryGroup {
    quoteId: number;
    taskName: string;
    taskCode: string;
    quoteStatus: string;
    quoteValue: number;
    createdAt: string;
    updatedAt: string;
    totalDeliveries: number;
    completedDeliveries: number;
    pendingDeliveries: number;
    deliveries: any[];
}

const DeliveryList: React.FC = () => {
    const navigate = useNavigate();
    const { hasProfile } = useAuth();
    
    // Verifica se o usuário tem permissão de escrita (apenas ADMIN)
    const isAdmin = hasProfile('ADMIN');
    const isReadOnly = !isAdmin; // MANAGER e USER têm apenas leitura
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

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
        refetch
    } = useDeliveryGroups();

    const handleView = async (deliveryGroup: DeliveryGroup) => {
        try {
            const groupDetails = await getGroupDetails(deliveryGroup.quoteId);
            if (groupDetails) {
                setSelectedDelivery(groupDetails);
                setShowDetailModal(true);
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes do grupo:', error);
            toast.error('Erro ao carregar detalhes do grupo');
        }
    };

    const handleEdit = (quoteId: number) => {
        navigate(`/deliveries/group/${quoteId}/edit`);
    };

    const handleDelete = async (quoteId: number) => {
        if (window.confirm('Tem certeza que deseja excluir todas as entregas desta tarefa?')) {
            try {
                // TODO: Implementar delete do grupo
                toast.error('Funcionalidade ainda não implementada');
            } catch (error) {
                toast.error('Erro ao excluir grupo de entregas');
            }
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

    // Funções de seleção múltipla
    const toggleItem = (quoteId: number) => {
        setSelectedItems(prev => 
            prev.includes(quoteId)
                ? prev.filter(item => item !== quoteId)
                : [...prev, quoteId]
        );
    };

    const toggleAll = () => {
        const currentPageIds = deliveryGroups.map(group => group.quoteId);
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
        const currentPageIds = deliveryGroups.map(group => group.quoteId);
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
            // TODO: Implementar bulk delete de grupos
            toast.error('Funcionalidade ainda não implementada');
            clearSelection();
            setShowBulkDeleteModal(false);
        } catch (error) {
            toast.error('Erro ao excluir grupos selecionados');
        } finally {
            setIsDeleting(false);
        }
    };

    // Filtrar delivery groups baseado na busca (apenas para mobile)
    const filteredDeliveryGroups = deliveryGroups.filter(group =>
        group.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.taskCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getStatusLabel(group.quoteStatus).toLowerCase().includes(searchTerm.toLowerCase())
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
                        checked={selectedItems.includes(item.quoteId)}
                        onChange={() => toggleItem(item.quoteId)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )
        }] : []),
        // Colunas que todos podem ver
        {
            key: 'id',
            title: 'ID Orçamento',
            sortable: true,
            filterable: true,
            filterType: 'number',
            width: '120px',
            align: 'center',
            render: (item) => (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    #{item.quoteId}
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
            width: '200px',
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
            key: 'completedDeliveries',
            title: 'Concluídas',
            sortable: false,
            filterable: false,
            width: '100px',
            align: 'center',
            render: (item) => (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                    {item.completedDeliveries}
                </span>
            )
        },
        {
            key: 'pendingDeliveries',
            title: 'Pendentes',
            sortable: false,
            filterable: false,
            width: '100px',
            align: 'center',
            render: (item) => (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                    {item.pendingDeliveries}
                </span>
            )
        },
        {
            key: 'quoteStatus',
            title: 'Status Orçamento',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '140px',
            align: 'center',
            render: (item) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.quoteStatus)}`}>
                    {getStatusLabel(item.quoteStatus)}
                </span>
            )
        },
        {
            key: 'quoteValue',
            title: 'Valor Orçamento',
            sortable: false,
            filterable: false,
            width: '120px',
            align: 'right',
            render: (item) => (
                <span className="text-sm font-medium text-gray-900">
                    {item.quoteValue ? `R$ ${item.quoteValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                </span>
            ),
            hideable: true
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
                                onClick={() => handleEdit(item.quoteId)}
                                title="Editar grupo"
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(item.quoteId)}
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
                                checked={selectedItems.includes(deliveryGroup.quoteId)}
                                onChange={() => toggleItem(deliveryGroup.quoteId)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                        </div>
                    )}
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                #{deliveryGroup.quoteId}
                            </span>
                            <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {deliveryGroup.taskCode}
                            </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-2">
                            {deliveryGroup.taskName}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(deliveryGroup.quoteStatus)}`}>
                                {getStatusLabel(deliveryGroup.quoteStatus)}
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
                                onClick={() => handleEdit(deliveryGroup.quoteId)}
                                title="Editar grupo"
                                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(deliveryGroup.quoteId)}
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
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-gray-700 font-medium">{deliveryGroup.totalDeliveries} entregas</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-green-700 font-medium">{deliveryGroup.completedDeliveries} concluídas</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                    <Hash className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-yellow-700 font-medium">{deliveryGroup.pendingDeliveries} pendentes</span>
                </div>

                {deliveryGroup.quoteValue && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Valor:</span>
                        <span className="text-gray-900 font-medium">
                            R$ {deliveryGroup.quoteValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                )}

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
                    <p className="text-gray-600 mt-1">
                        {isAdmin ? 'Gerencie as entregas dos projetos e orçamentos' : 'Visualize as entregas dos projetos e orçamentos'}
                    </p>
                </div>
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
                            <div className="text-xs sm:text-sm font-medium text-gray-500">Grupos Ativos</div>
                            <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                                {deliveryGroups.filter(g => g.pendingDeliveries > 0).length}
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
                                hiddenColumns={['quoteValue', 'createdAt', 'updatedAt']}
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
                                    <DeliveryGroupCard key={deliveryGroup.quoteId} deliveryGroup={deliveryGroup} />
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
        </div>
    );
};

export default DeliveryList;