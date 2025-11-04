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
    useRequesterContact: boolean;
    primaryEmail?: string;
    primaryPhone?: string;
    copyEmails: string[];
    phoneNumbers: string[];
    createdAt?: string;
    updatedAt?: string;
}

const NotificationList: React.FC = () => {
    const navigate = useNavigate();
    const { hasProfile, user, isLoading: authLoading } = useAuth();

    const isAdmin = hasProfile('ADMIN');

    useEffect(() => {
        if (!authLoading && user && !isAdmin) {
            toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
            navigate('/dashboard');
        }
    }, [hasProfile, navigate, authLoading, user, isAdmin]);

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
        fetchNotificationConfigs,
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

    const columns: Column<NotificationConfig>[] = useMemo(() => [
        {
            key: 'select',
            title: '',
            headerRender: () => (
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
            title: 'ID',
            render: (notification) => notification.id,
            sortable: false,
            width: '80px',
            hideable: true
        },
        {
            key: 'configType',
            title: 'Configuração',
            render: (notification) => (
                <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="font-medium text-sm">{getConfigTypeLabel(notification.configType)}</span>
                </div>
            ),
            sortable: false
        },
        {
            key: 'notificationType',
            title: 'Notificação',
            render: (notification) => (
                <div className="flex items-center gap-2">
                    <span className="flex-shrink-0">{getNotificationTypeIcon(notification.notificationType)}</span>
                    <span className="text-sm">{getNotificationTypeLabel(notification.notificationType)}</span>
                </div>
            ),
            sortable: false,
            width: '140px'
        },
        {
            key: 'primaryEmail',
            title: 'Contato Principal',
            render: (notification) => {
                if (notification.notificationType === 'EMAIL') {
                    if (notification.useRequesterContact) {
                        return (
                            <span className="text-sm text-blue-600 font-medium">
                                Email do solicitante
                            </span>
                        );
                    }
                    return notification.primaryEmail || '-';
                } else if (notification.notificationType === 'SMS' || notification.notificationType === 'WHATSAPP') {
                    if (notification.useRequesterContact) {
                        return (
                            <span className="text-sm text-blue-600 font-medium">
                                Telefone do solicitante
                            </span>
                        );
                    }
                    return notification.primaryPhone || '-';
                }
                return '-';
            },
            sortable: false,
            hideable: true
        },
        {
            key: 'quantity',
            title: 'Quantidade em Cópia',
            render: (notification) => {
                if (notification.notificationType === 'EMAIL') {
                    return (
                        <span className="text-sm text-gray-600">
                            {notification.copyEmails.length > 0
                                ? `${notification.copyEmails.length} email(s)`
                                : '-'
                            }
                        </span>
                    );
                } else if (notification.notificationType === 'WHATSAPP' || notification.notificationType === 'SMS') {
                    return (
                        <span className="text-sm text-gray-600">
                            {notification.phoneNumbers.length > 0
                                ? `${notification.phoneNumbers.length} telefone(s)`
                                : '-'
                            }
                        </span>
                    );
                }
                return <span className="text-sm text-gray-600">-</span>;
            },
            sortable: false,
            hideable: true,
            width: '180px'
        },
        {
            key: 'actions',
            title: 'Ações',
            render: (notification) => (
                <div className="flex items-center justify-center gap-2">
                    {isAdmin && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(notification)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
                            title="Editar"
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                    )}
                    {isAdmin && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(notification)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                            title="Excluir"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            ),
            sortable: false,
            width: '140px',
            align: 'center'
        }
    ], [notificationConfigs, selectedItems, isAdmin]);

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return notificationConfigs;

        const search = searchTerm.toLowerCase();
        return notificationConfigs.filter(notification =>
            getConfigTypeLabel(notification.configType).toLowerCase().includes(search) ||
            getNotificationTypeLabel(notification.notificationType).toLowerCase().includes(search) ||
            (notification.primaryEmail && notification.primaryEmail.toLowerCase().includes(search))
        );
    }, [notificationConfigs, searchTerm]);

    const handleCloseModal = async () => {
        setShowNotificationModal(false);
        setEditingNotification(null);

        await fetchNotificationConfigs();
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Bell className="w-6 h-6" />
                        Configurações de Notificação
                    </h1>
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

            {/* Actions Bar - apenas quando há seleção */}
            {selectedItems.length > 0 && isAdmin && (
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                            {selectedItems.length} configuração(ões) selecionada(s)
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => setShowBulkDeleteModal(true)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir Selecionados
                        </Button>
                    </div>
                </Card>
            )}

            {/* Mobile: Cards Layout */}
            <div className="block sm:hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        <span className="ml-3 text-gray-600">Carregando configurações...</span>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="text-center py-12">
                        <Bell className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma configuração encontrada</h3>
                        <p className="mt-1 text-sm text-gray-500">Comece criando uma nova configuração de notificação</p>
                        {isAdmin && (
                            <Button onClick={() => setShowNotificationModal(true)} className="mt-4">
                                <Plus className="w-4 h-4 mr-2" />
                                Nova Configuração
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredData.map((notification) => (
                            <Card key={notification.id} className="p-4">
                                <div className="space-y-3">
                                    {/* Header com ID e tipo */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900">
                                                #{notification.id}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                {getNotificationTypeIcon(notification.notificationType)}
                                                <span className="text-xs text-gray-600">{getNotificationTypeLabel(notification.notificationType)}</span>
                                            </div>
                                        </div>
                                        {selectedItems.length > 0 && (
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.includes(notification.id)}
                                                onChange={() => handleSelectItem(notification.id)}
                                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                        )}
                                    </div>

                                    {/* Configuração principal */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Bell className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                            <h3 className="font-semibold text-gray-900 text-sm">
                                                {getConfigTypeLabel(notification.configType)}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Contato principal */}
                                    <div className="text-sm">
                                        <span className="text-gray-600 font-medium">Contato: </span>
                                        {notification.notificationType === 'EMAIL' ? (
                                            notification.useRequesterContact ? (
                                                <span className="text-blue-600 font-medium">Email do solicitante</span>
                                            ) : (
                                                <span>{notification.primaryEmail || '-'}</span>
                                            )
                                        ) : (
                                            notification.useRequesterContact ? (
                                                <span className="text-blue-600 font-medium">Telefone do solicitante</span>
                                            ) : (
                                                <span>{notification.primaryPhone || '-'}</span>
                                            )
                                        )}
                                    </div>

                                    {/* Quantidade em cópia */}
                                    <div className="text-sm text-gray-600">
                                        {notification.notificationType === 'EMAIL' ? (
                                            notification.copyEmails.length > 0 ?
                                                `${notification.copyEmails.length} email(s) em cópia` :
                                                'Nenhum email em cópia'
                                        ) : (
                                            notification.phoneNumbers.length > 0 ?
                                                `${notification.phoneNumbers.length} telefone(s) em cópia` :
                                                'Nenhum telefone em cópia'
                                        )}
                                    </div>

                                    {/* Ações */}
                                    {isAdmin && (
                                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(notification)}
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex-1"
                                            >
                                                <Edit className="w-4 h-4 mr-1" />
                                                Editar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(notification)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1"
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                Excluir
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Desktop: DataTable */}
            <Card className="p-0 hidden sm:block">
                <DataTable
                    data={filteredData}
                    columns={columns}
                    loading={loading}
                    pagination={pagination}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    showColumnToggle={false}
                    emptyMessage="Nenhuma configuração de notificação encontrada"
                    emptyDescription="Comece criando uma nova configuração de notificação"
                />
            </Card>

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