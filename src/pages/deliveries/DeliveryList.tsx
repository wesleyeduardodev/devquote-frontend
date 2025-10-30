import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Edit, Trash2, Eye, Download, Package, ChevronsLeft, ChevronsRight, Mail
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useDeliveries } from '../../hooks/useDeliveries';
import {
    DeliveryGroupResponse,
    DeliveryStatus,
    DeliveryStatusCount
} from '../../types/delivery.types';
import { deliveryService } from '../../services/deliveryService';
import { formatMobileRecordCountText } from '../../utils/paginationUtils';
import DataTable, { Column } from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DeliveryGroupModal from '../../components/deliveries/DeliveryGroupModal';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import BulkDeleteModal from '../../components/ui/BulkDeleteModal';
import { FlowTypeFilter, FlowTypeFilterValue } from '../../components/filters/FlowTypeFilter';

const DeliveryList: React.FC = () => {
    const navigate = useNavigate();
    const { hasProfile } = useAuth();

    // Usar o hook useDeliveries
    const {
        deliveryGroups,
        pagination,
        loading,
        exporting,
        sorting,
        filters,
        fetchDeliveryGroups,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
        exportToExcel,
        deleteBulk
    } = useDeliveries();

    // Verificações de perfil
    const isAdmin = hasProfile('ADMIN');
    const isManager = hasProfile('MANAGER');
    const canCreate = isAdmin;
    const canEdit = isAdmin;
    const canDelete = isAdmin;

    // Estados para estatísticas e modals
    const [statistics, setStatistics] = useState<DeliveryStatusCount | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<DeliveryGroupResponse | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<DeliveryGroupResponse | null>(null);
    
    // Estados para seleção múltipla
    const [selectedDeliveries, setSelectedDeliveries] = useState<number[]>([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Estados para email modal
    const [showDeliveryEmailModal, setShowDeliveryEmailModal] = useState(false);
    const [groupForEmail, setGroupForEmail] = useState<DeliveryGroupResponse | null>(null);
    const [additionalEmails, setAdditionalEmails] = useState<string[]>([]);
    const [currentEmailInput, setCurrentEmailInput] = useState('');

    // Carregar estatísticas (função independente)
    const fetchStatistics = async () => {
        try {
            const stats = await deliveryService.getGlobalStatistics();
            setStatistics(stats);
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    };

    // Carregar estatísticas uma vez
    React.useEffect(() => {
        fetchStatistics();
    }, []);

    // Handlers para seleção múltipla
    const handleSelectDelivery = (deliveryId: number) => {
        setSelectedDeliveries(prev => {
            if (prev.includes(deliveryId)) {
                return prev.filter(id => id !== deliveryId);
            } else {
                return [...prev, deliveryId];
            }
        });
    };

    const handleSelectAll = () => {
        const availableDeliveryIds = deliveryGroups
            .map(group => group.deliveries?.[0]?.id)
            .filter((id): id is number => id !== undefined);

        if (selectedDeliveries.length === availableDeliveryIds.length) {
            setSelectedDeliveries([]);
        } else {
            setSelectedDeliveries(availableDeliveryIds);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedDeliveries.length === 0) return;

        setIsBulkDeleting(true);
        try {
            await deleteBulk(selectedDeliveries);
            setSelectedDeliveries([]);
            setShowBulkDeleteModal(false);
            fetchStatistics();
        } catch (error) {
            console.error('Erro ao excluir entregas:', error);
            toast.error('Erro ao excluir entregas selecionadas');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    // Definir colunas da tabela
    const columns: Column<DeliveryGroupResponse>[] = [
        // Coluna de seleção
        {
            key: 'select',
            title: (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        checked={selectedDeliveries.length === deliveryGroups.filter(g => g.deliveries?.[0]?.id).length && deliveryGroups.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                </div>
            ),
            sortable: false,
            filterable: false,
            render: (delivery) => {
                const deliveryId = delivery.deliveries?.[0]?.id;
                if (!deliveryId) return null;
                
                return (
                    <div className="flex items-center justify-center">
                        <input
                            type="checkbox"
                            checked={selectedDeliveries.includes(deliveryId)}
                            onChange={() => handleSelectDelivery(deliveryId)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                    </div>
                );
            },
            width: '50px',
            align: 'center'
        },
        {
            key: 'task.id',
            title: 'ID',
            sortable: true,
            filterable: true,
            filterType: 'number',
            render: (delivery) => (
                <span className="font-medium text-gray-900">
                    #{delivery.taskId || 'N/A'}
                </span>
            ),
            width: '80px'
        },
        {
            key: 'task.code',
            title: 'CÓDIGO',
            sortable: true,
            filterable: true,
            align: 'center' as const,
            render: (delivery) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {delivery.taskCode || 'N/A'}
                </span>
            ),
            width: '120px'
        },
        {
            key: 'flowType',
            title: 'FLUXO',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '150px',
            align: 'center' as const,
            render: (delivery: DeliveryGroupResponse) => {
                // Buscar flowType da delivery (que vem da task)
                const flowType = delivery.deliveries?.[0]?.flowType;
                return flowType ? (
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                        flowType === 'OPERACIONAL'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                        {flowType === 'OPERACIONAL' ? '⚙️ Operacional' : '💻 Desenvolvimento'}
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            }
        },
        {
            key: 'task.title',
            title: 'TÍTULO DA TAREFA',
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
            filterType: 'select',
            filterOptions: [
                { value: '', label: 'Todos os Status' },
                { value: 'Pendente', label: 'Pendente' },
                { value: 'Desenvolvimento', label: 'Desenvolvimento' },
                { value: 'Entregue', label: 'Entregue' },
                { value: 'Homologação', label: 'Homologação' },
                { value: 'Aprovado', label: 'Aprovado' },
                { value: 'Rejeitado', label: 'Rejeitado' },
                { value: 'Produção', label: 'Produção' }
            ],
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

                    {/* Botão de Email - disponível apenas para ADMIN */}
                    {isAdmin && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeliveryEmail(delivery)}
                            title={delivery.deliveries?.[0]?.deliveryEmailSent ? "Email de entrega já enviado - Reenviar?" : "Enviar email de entrega"}
                            className={`${delivery.deliveries?.[0]?.deliveryEmailSent ? 'text-green-600 hover:text-green-800 hover:bg-green-50' : 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'}`}
                        >
                            <Mail className="h-4 w-4" />
                        </Button>
                    )}
                    
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
            // Pegar o ID da primeira entrega (relação 1:1 com task)
            const deliveryId = groupToDelete.deliveries?.[0]?.id;
            
            if (deliveryId) {
                await deliveryService.delete(deliveryId);
                toast.success('Entrega excluída com sucesso!');
                // Recarregar a lista de entregas e estatísticas
                await fetchDeliveryGroups();
                fetchStatistics();
            } else {
                toast.error('ID da entrega não encontrado');
            }
        } catch (error) {
            console.error('Erro ao excluir entrega:', error);
            toast.error('Erro ao excluir entrega');
        } finally {
            setShowDeleteModal(false);
            setGroupToDelete(null);
        }
    };

    const handleExport = () => exportToExcel();

    // Handler para email de entrega
    const handleDeliveryEmail = (group: DeliveryGroupResponse) => {
        setGroupForEmail(group);
        setAdditionalEmails([]);
        setCurrentEmailInput('');
        setShowDeliveryEmailModal(true);
    };

    const confirmSendDeliveryEmail = async () => {
        if (!groupForEmail) return;

        try {
            const deliveryId = groupForEmail.deliveries?.[0]?.id;
            if (deliveryId) {
                await deliveryService.sendDeliveryEmail(deliveryId, additionalEmails);
                toast.success('Email de entrega enviado com sucesso!');
                // Recarregar a listagem para atualizar o status do email
                await fetchDeliveryGroups();
            } else {
                toast.error('ID da entrega não encontrado');
            }
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            toast.error('Falha ao enviar email');
        } finally {
            setShowDeliveryEmailModal(false);
            setGroupForEmail(null);
            setAdditionalEmails([]);
            setCurrentEmailInput('');
        }
    };

    const addEmail = () => {
        const email = currentEmailInput.trim();
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            if (!additionalEmails.includes(email)) {
                setAdditionalEmails([...additionalEmails, email]);
                setCurrentEmailInput('');
            } else {
                toast.error('Este email já foi adicionado');
            }
        } else if (email) {
            toast.error('Email inválido');
        }
    };

    const removeEmail = (index: number) => {
        setAdditionalEmails(additionalEmails.filter((_, i) => i !== index));
    };

    const handleSort = (field: string, direction: 'asc' | 'desc') => {
        setSorting(field, direction);
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
                label: 'Desenvolvimento',
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
                label: 'Homologação',
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
                label: 'Produção',
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
                <div className="flex items-center gap-4">
                    <FlowTypeFilter
                        value={(filters.flowType as FlowTypeFilterValue) || 'TODOS'}
                        onChange={(value) => setFilter('flowType', value === 'TODOS' ? '' : value)}
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* Ações em lote - visível apenas se houver seleções */}
                    {selectedDeliveries.length > 0 && canDelete && (
                        <Button
                            variant="outline"
                            onClick={() => setShowBulkDeleteModal(true)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir ({selectedDeliveries.length})
                        </Button>
                    )}
                    
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        disabled={exporting}
                    >
                        {exporting ? (
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
                                    <div className="flex items-start gap-3">
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="text-sm font-medium text-gray-900">
                                                #{delivery.taskId || 'N/A'}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                {delivery.taskCode || 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Título da Tarefa */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                                            {delivery.taskName || 'N/A'}
                                        </h3>
                                    </div>

                                    {/* Ações + Informações - na mesma linha para economizar espaço */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm flex-1">
                                            {/* Ações compactas */}
                                            <div className="flex gap-1 mr-3">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleView(delivery)}
                                                    title="Ver detalhes"
                                                    className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-1"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Button>

                                                {/* Botão de Email - disponível apenas para ADMIN */}
                                                {isAdmin && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeliveryEmail(delivery)}
                                                        title={delivery.deliveries?.[0]?.deliveryEmailSent ? "Email de entrega já enviado - Reenviar?" : "Enviar email de entrega"}
                                                        className={`p-1 ${delivery.deliveries?.[0]?.deliveryEmailSent ? 'text-green-600 hover:text-green-800 hover:bg-green-50' : 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'}`}
                                                    >
                                                        <Mail className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                                
                                                {canEdit && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(delivery)}
                                                        title="Editar"
                                                        className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-1"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                                
                                                {canDelete && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(delivery)}
                                                        title="Excluir"
                                                        className="text-gray-600 hover:text-red-600 hover:bg-red-50 p-1"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                            
                                            {/* Status */}
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor((delivery.calculatedDeliveryStatus || delivery.deliveryStatus) as DeliveryStatus || 'PENDING')}`}>
                                                {getStatusLabel((delivery.calculatedDeliveryStatus || delivery.deliveryStatus) as DeliveryStatus || 'PENDING')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Informações Adicionais */}
                                    <div className="flex items-center gap-4 text-sm text-gray-600 pt-2 border-t border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <span>{delivery.totalItems || 0} item(s)</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        
                        {/* Paginação Melhorada (mobile) */}
                        {pagination && pagination.totalPages > 1 && (
                            <Card className="p-4">
                                <div className="space-y-3">
                                    {/* Informação de registros */}
                                    <div className="text-center text-sm text-gray-600">
                                        {formatMobileRecordCountText(
                                            pagination.currentPage,
                                            pagination.pageSize,
                                            pagination.totalElements || 0
                                        )}
                                    </div>
                                    
                                    {/* Controles de navegação */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-1">
                                            {/* Primeira página */}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setPage(0)}
                                                disabled={pagination.currentPage <= 0}
                                                title="Primeira página"
                                                className="p-2"
                                            >
                                                <ChevronsLeft className="w-4 h-4" />
                                            </Button>
                                            {/* Página anterior */}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setPage(Math.max(0, pagination.currentPage - 1))}
                                                disabled={pagination.currentPage <= 0}
                                                title="Página anterior"
                                            >
                                                Anterior
                                            </Button>
                                        </div>

                                        <span className="text-sm text-gray-600 font-medium">
                                            Página {pagination.currentPage + 1} de {pagination.totalPages}
                                        </span>

                                        <div className="flex gap-1">
                                            {/* Próxima página */}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setPage(Math.min(pagination.totalPages - 1, pagination.currentPage + 1))}
                                                disabled={pagination.currentPage >= pagination.totalPages - 1}
                                                title="Próxima página"
                                            >
                                                Próxima
                                            </Button>
                                            {/* Última página */}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setPage(pagination.totalPages - 1)}
                                                disabled={pagination.currentPage >= pagination.totalPages - 1}
                                                title="Última página"
                                                className="p-2"
                                            >
                                                <ChevronsRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
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
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    sorting={sorting}
                    onSort={handleSort}
                    filters={filters}
                    onFilter={setFilter}
                    onClearFilters={clearFilters}
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

            {/* Modal de confirmação de email de entrega */}
            {showDeliveryEmailModal && groupForEmail && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center justify-center mb-4">
                                <div className="bg-blue-100 p-3 rounded-full">
                                    📧 Email de Entrega
                                </div>
                            </div>
                            
                            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
                                Tarefa: {groupForEmail.taskCode}
                            </h2>

                            <div className="mb-6">
                                {groupForEmail.deliveries?.[0]?.deliveryEmailSent ? (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                        <div className="flex items-center mb-2">
                                            <span className="text-amber-600 mr-2">⚠️</span>
                                            <span className="font-semibold text-amber-800">Email já enviado</span>
                                        </div>
                                        <p className="text-amber-700 text-sm">
                                            O email de entrega para esta tarefa já foi enviado anteriormente.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                        <div className="flex items-center mb-2">
                                            <span className="text-blue-600 mr-2">📧</span>
                                            <span className="font-semibold text-blue-800">Enviar email de entrega</span>
                                        </div>
                                        <p className="text-blue-700 text-sm">
                                            Deseja enviar um email com os detalhes da entrega para o solicitante?
                                        </p>
                                    </div>
                                )}

                                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                    <h4 className="font-medium text-gray-900 mb-2">{groupForEmail.taskName}</h4>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p><strong>Código:</strong> {groupForEmail.taskCode}</p>
                                        <p><strong>Itens:</strong> {groupForEmail.totalItems || 0} item(s)</p>
                                    </div>
                                </div>

                                {/* Campo para adicionar emails extras em cópia */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Emails adicionais em cópia (opcional)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            value={currentEmailInput}
                                            onChange={(e) => setCurrentEmailInput(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addEmail();
                                                }
                                            }}
                                            placeholder="exemplo@email.com"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <Button
                                            onClick={addEmail}
                                            variant="outline"
                                            type="button"
                                        >
                                            Adicionar
                                        </Button>
                                    </div>

                                    {/* Lista de emails adicionados */}
                                    {additionalEmails.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {additionalEmails.map((email, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                                >
                                                    {email}
                                                    <button
                                                        onClick={() => removeEmail(index)}
                                                        className="hover:text-blue-900 font-bold"
                                                        title="Remover email"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeliveryEmailModal(false);
                                        setGroupForEmail(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmSendDeliveryEmail}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    {groupForEmail.deliveries?.[0]?.deliveryEmailSent ? 'Reenviar' : 'Enviar Email'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de exclusão em lote */}
            <BulkDeleteModal
                isOpen={showBulkDeleteModal}
                onClose={() => setShowBulkDeleteModal(false)}
                onConfirm={handleBulkDelete}
                selectedCount={selectedDeliveries.length}
                isDeleting={isBulkDeleting}
                entityName="entrega"
            />
        </div>
    );
};

export default DeliveryList;