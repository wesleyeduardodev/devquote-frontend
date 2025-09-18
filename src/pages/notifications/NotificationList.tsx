import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Filter,
    Bell,
    Mail,
    MessageSquare,
    Smartphone,
    XCircle,
} from 'lucide-react';
import { useNotificationConfigs, NotificationConfigType, NotificationType } from '@/hooks/useNotificationConfigs';
import { useAuth } from '@/hooks/useAuth';
import { formatPaginationText } from '@/utils/paginationUtils';
import DataTable, { Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import BulkDeleteModal from '@/components/ui/BulkDeleteModal';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import NotificationModal from './NotificationModal';
import toast from 'react-hot-toast';

interface NotificationConfig {
    id: number;
    configType: NotificationConfigType;
    notificationType: NotificationType;
    primaryEmail?: string;
    copyEmails: string[];
    phoneNumbers: string[];
    createdAt?: string;
    updatedAt?: string;
}

const NotificationList: React.FC = () => {
    const navigate = useNavigate();
    const { hasProfile, user, isLoading: authLoading } = useAuth();

    // Verifica se o usuário tem permissão (apenas ADMIN)
    const isAdmin = hasProfile('ADMIN');

    // Verificação de acesso - apenas ADMIN pode acessar notificações
    useEffect(() => {
        if (!authLoading && user && !isAdmin) {
            toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
            navigate('/dashboard');
        }
    }, [hasProfile, navigate, authLoading, user, isAdmin]);

    // Se não é admin e já carregou auth, redireciona
    if (!authLoading && !isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
                    <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
                </div>
            </div>
        );
    }

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<NotificationConfig | null>(null);
    const [isDeletingSingle, setIsDeletingSingle] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [editingNotification, setEditingNotification] = useState<NotificationConfig | null>(null);

    const {
        notificationConfigs,
        pagination,
        loading,
        sorting,
        filters,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
        deleteNotificationConfig,
        deleteBulkNotificationConfigs,
    } = useNotificationConfigs();

    const handleEdit = (notification: NotificationConfig) => {
        setEditingNotification(notification);
        setShowNotificationModal(true);
    };

    const handleDelete = (notification: NotificationConfig) => {
        setItemToDelete(notification);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeletingSingle(true);
        try {
            await deleteNotificationConfig(itemToDelete.id);
        } catch (error) {
            toast.error('Erro ao excluir configuração de notificação');
        } finally {
            setIsDeletingSingle(false);
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
            minute: '2-digit',
        });
    };

    // Tradução dos tipos
    const getConfigTypeLabel = (type: NotificationConfigType) => {
        const labels = {
            NOTIFICACAO_DADOS_TAREFA: 'Dados da Tarefa',
            NOTIFICACAO_ORCAMENTO_TAREFA: 'Orçamento da Tarefa',
            NOTIFICACAO_ENTREGA: 'Entrega',
            NOTIFICACAO_FATURAMENTO: 'Faturamento'
        };
        return labels[type] || type;
    };

    const getNotificationTypeIcon = (type: NotificationType) => {
        const icons = {
            EMAIL: <Mail className="w-4 h-4" />,
            WHATSAPP: <MessageSquare className="w-4 h-4" />,
            SMS: <Smartphone className="w-4 h-4" />
        };
        return icons[type] || <Bell className="w-4 h-4" />;
    };

    const getNotificationTypeLabel = (type: NotificationType) => {
        const labels = {
            EMAIL: 'E-mail',
            WHATSAPP: 'WhatsApp',
            SMS: 'SMS'
        };
        return labels[type] || type;
    };

    // ===== Seleção múltipla =====
    const handleSelectItem = (id: number) => {
        setSelectedItems(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedItems.length === notificationConfigs.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(notificationConfigs.map(item => item.id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedItems.length === 0) return;

        setIsDeleting(true);
        try {
            await deleteBulkNotificationConfigs(selectedItems);
            setSelectedItems([]);
        } catch (error) {
            toast.error('Erro ao excluir configurações de notificação');
        } finally {
            setIsDeleting(false);
            setShowBulkDeleteModal(false);
        }
    };

    // ===== DataTable columns =====
    const columns: Column<NotificationConfig>[] = useMemo(() => [
        {
            key: 'select',
            header: (
                <input
                    type="checkbox"
                    checked={notificationConfigs.length > 0 && selectedItems.length === notificationConfigs.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
            ),
            render: (notification) => (
                <input
                    type="checkbox"
                    checked={selectedItems.includes(notification.id)}
                    onChange={() => handleSelectItem(notification.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
            ),
            width: '50px',
            sortable: false
        },
        {
            key: 'id',
            header: 'ID',
            render: (notification) => notification.id,
            sortable: true,
            width: '80px'
        },
        {
            key: 'configType',
            header: 'Tipo de Configuração',
            render: (notification) => (
                <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{getConfigTypeLabel(notification.configType)}</span>
                </div>
            ),
            sortable: true
        },
        {
            key: 'notificationType',
            header: 'Tipo de Notificação',
            render: (notification) => (
                <div className="flex items-center gap-2">
                    {getNotificationTypeIcon(notification.notificationType)}
                    <span>{getNotificationTypeLabel(notification.notificationType)}</span>
                </div>
            ),
            sortable: true
        },
        {
            key: 'primaryEmail',
            header: 'E-mail Principal',
            render: (notification) => notification.primaryEmail || '-',
            sortable: true
        },
        {
            key: 'copyEmails',
            header: 'E-mails em Cópia',
            render: (notification) => (
                <span className="text-sm text-gray-600">
                    {notification.copyEmails.length > 0
                        ? `${notification.copyEmails.length} email(s)`
                        : '-'
                    }
                </span>
            ),
            sortable: false
        },
        {
            key: 'phoneNumbers',
            header: 'Telefones',
            render: (notification) => (
                <span className="text-sm text-gray-600">
                    {notification.phoneNumbers.length > 0
                        ? `${notification.phoneNumbers.length} telefone(s)`
                        : '-'
                    }
                </span>
            ),
            sortable: false
        },
        {
            key: 'createdAt',
            header: 'Criado em',
            render: (notification) => formatDate(notification.createdAt),
            sortable: true,
            width: '180px'
        },
        {
            key: 'actions',
            header: 'Ações',
            render: (notification) => (
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(notification)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                    )}
                    {isAdmin && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(notification)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            ),
            sortable: false,
            width: '120px'
        }
    ], [notificationConfigs, selectedItems, isAdmin]);

    // ===== Filtros =====
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return notificationConfigs;

        const search = searchTerm.toLowerCase();
        return notificationConfigs.filter(notification =>
            getConfigTypeLabel(notification.configType).toLowerCase().includes(search) ||
            getNotificationTypeLabel(notification.notificationType).toLowerCase().includes(search) ||
            (notification.primaryEmail && notification.primaryEmail.toLowerCase().includes(search))
        );
    }, [notificationConfigs, searchTerm]);

    const handleCloseModal = () => {
        setShowNotificationModal(false);
        setEditingNotification(null);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Bell className="w-6 h-6" />
                                Configurações de Notificação
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Gerencie as configurações de notificação do sistema
                            </p>
                        </div>
                        {isAdmin && (
                            <Button
                                onClick={() => setShowNotificationModal(true)}
                                className="flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Nova Configuração
                            </Button>
                        )}
                    </div>
                </div>

                {/* Actions Bar */}
                <Card className="mb-6">
                    <div className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar configurações..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {selectedItems.length > 0 && isAdmin && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowBulkDeleteModal(true)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir ({selectedItems.length})
                                    </Button>
                                )}

                                {Object.keys(filters).some(key => filters[key]) && (
                                    <Button
                                        variant="outline"
                                        onClick={clearFilters}
                                    >
                                        <Filter className="w-4 h-4 mr-2" />
                                        Limpar Filtros
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Data Table */}
                <Card>
                    <DataTable
                        data={filteredData}
                        columns={columns}
                        loading={loading}
                        pagination={pagination}
                        onPageChange={setPage}
                        onPageSizeChange={setPageSize}
                        onSort={setSorting}
                        emptyMessage="Nenhuma configuração de notificação encontrada"
                        emptyDescription="Comece criando uma nova configuração de notificação"
                    />
                </Card>
            </div>

            {/* Modals */}
            {showNotificationModal && (
                <NotificationModal
                    isOpen={showNotificationModal}
                    onClose={handleCloseModal}
                    notification={editingNotification}
                />
            )}

            {showBulkDeleteModal && (
                <BulkDeleteModal
                    isOpen={showBulkDeleteModal}
                    onClose={() => setShowBulkDeleteModal(false)}
                    onConfirm={handleBulkDelete}
                    isDeleting={isDeleting}
                    itemCount={selectedItems.length}
                    itemName="configuração(ões) de notificação"
                />
            )}

            {showDeleteModal && itemToDelete && (
                <DeleteConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setItemToDelete(null);
                    }}
                    onConfirm={handleConfirmDelete}
                    isDeleting={isDeletingSingle}
                    itemName={`configuração "${getConfigTypeLabel(itemToDelete.configType)} - ${getNotificationTypeLabel(itemToDelete.notificationType)}"`}
                />
            )}
        </div>
    );
};

export default NotificationList;