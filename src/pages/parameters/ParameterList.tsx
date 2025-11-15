import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Edit,
    Trash2,
    Settings,
    XCircle,
    FileText,
} from 'lucide-react';
import { useSystemParameters } from '@/hooks/useSystemParameters';
import { useAuth } from '@/hooks/useAuth';
import DataTable, { Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import BulkDeleteModal from '@/components/ui/BulkDeleteModal';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import ParameterModal from './ParameterModal';
import toast from 'react-hot-toast';

interface SystemParameter {
    id: number;
    name: string;
    value?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

const ParameterList: React.FC = () => {
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

    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<SystemParameter | null>(null);
    const [isDeletingSingle, setIsDeletingSingle] = useState(false);
    const [showParameterModal, setShowParameterModal] = useState(false);
    const [editingParameter, setEditingParameter] = useState<SystemParameter | null>(null);

    const {
        systemParameters,
        pagination,
        loading,
        sorting,
        filters,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
        deleteSystemParameter,
        deleteBulkSystemParameters,
        fetchSystemParameters,
    } = useSystemParameters();

    const handleEdit = (parameter: SystemParameter) => {
        setEditingParameter(parameter);
        setShowParameterModal(true);
    };

    const handleDelete = (parameter: SystemParameter) => {
        setItemToDelete(parameter);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeletingSingle(true);
        try {
            await deleteSystemParameter(itemToDelete.id);
        } catch (error) {
            toast.error('Erro ao excluir parâmetro');
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

    const handleSelectItem = (id: number) => {
        setSelectedItems(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedItems.length === systemParameters.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(systemParameters.map(item => item.id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedItems.length === 0) return;

        setIsDeleting(true);
        try {
            await deleteBulkSystemParameters(selectedItems);
            setSelectedItems([]);
        } catch (error) {
            toast.error('Erro ao excluir parâmetros');
        } finally {
            setIsDeleting(false);
            setShowBulkDeleteModal(false);
        }
    };

    const columns: Column<SystemParameter>[] = useMemo(() => [
        {
            key: 'select',
            title: '',
            headerRender: () => (
                <input
                    type="checkbox"
                    checked={systemParameters.length > 0 && selectedItems.length === systemParameters.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
            ),
            render: (parameter) => (
                <input
                    type="checkbox"
                    checked={selectedItems.includes(parameter.id)}
                    onChange={() => handleSelectItem(parameter.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
            ),
            width: '50px',
            sortable: false
        },
        {
            key: 'id',
            title: 'ID',
            render: (parameter) => parameter.id,
            sortable: true,
            width: '80px',
            hideable: true
        },
        {
            key: 'name',
            title: 'Nome',
            render: (parameter) => (
                <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="font-medium text-sm">{parameter.name}</span>
                </div>
            ),
            sortable: true
        },
        {
            key: 'value',
            title: 'Valor',
            render: (parameter) => (
                <div className="max-w-xs truncate text-sm text-gray-600" title={parameter.value}>
                    {parameter.value || '-'}
                </div>
            ),
            sortable: false,
            hideable: true
        },
        {
            key: 'description',
            title: 'Descrição',
            render: (parameter) => (
                <div className="max-w-md truncate text-sm text-gray-600" title={parameter.description}>
                    {parameter.description || '-'}
                </div>
            ),
            sortable: false,
            hideable: true
        },
        {
            key: 'actions',
            title: 'Ações',
            render: (parameter) => (
                <div className="flex items-center justify-center gap-2">
                    {isAdmin && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(parameter)}
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
                            onClick={() => handleDelete(parameter)}
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
    ], [systemParameters, selectedItems, isAdmin]);

    const handleCloseModal = async () => {
        setShowParameterModal(false);
        setEditingParameter(null);

        await fetchSystemParameters();
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
                        <Settings className="w-6 h-6" />
                        Parâmetros do Sistema
                    </h1>
                </div>
                {isAdmin && (
                    <Button
                        onClick={() => setShowParameterModal(true)}
                        className="flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Parâmetro
                    </Button>
                )}
            </div>

            {/* Actions Bar */}
            {selectedItems.length > 0 && isAdmin && (
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                            {selectedItems.length} parâmetro(s) selecionado(s)
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
                        <span className="ml-3 text-gray-600">Carregando parâmetros...</span>
                    </div>
                ) : systemParameters.length === 0 ? (
                    <div className="text-center py-12">
                        <Settings className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum parâmetro encontrado</h3>
                        <p className="mt-1 text-sm text-gray-500">Comece criando um novo parâmetro</p>
                        {isAdmin && (
                            <Button onClick={() => setShowParameterModal(true)} className="mt-4">
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Parâmetro
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {systemParameters.map((parameter) => (
                            <Card key={parameter.id} className="p-4">
                                <div className="space-y-3">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900">
                                                #{parameter.id}
                                            </span>
                                        </div>
                                        {selectedItems.length > 0 && (
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.includes(parameter.id)}
                                                onChange={() => handleSelectItem(parameter.id)}
                                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                        )}
                                    </div>

                                    {/* Nome */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Settings className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                            <h3 className="font-semibold text-gray-900 text-sm break-all">
                                                {parameter.name}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Valor */}
                                    {parameter.value && (
                                        <div className="text-sm">
                                            <span className="text-gray-600 font-medium">Valor: </span>
                                            <span className="text-gray-700 break-all">{parameter.value}</span>
                                        </div>
                                    )}

                                    {/* Descrição */}
                                    {parameter.description && (
                                        <div className="text-sm">
                                            <span className="text-gray-600 font-medium">Descrição: </span>
                                            <span className="text-gray-700">{parameter.description}</span>
                                        </div>
                                    )}

                                    {/* Ações */}
                                    {isAdmin && (
                                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(parameter)}
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex-1"
                                            >
                                                <Edit className="w-4 h-4 mr-1" />
                                                Editar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(parameter)}
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
                    data={systemParameters}
                    columns={columns}
                    loading={loading}
                    pagination={pagination}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    showColumnToggle={false}
                    emptyMessage="Nenhum parâmetro encontrado"
                    emptyDescription="Comece criando um novo parâmetro do sistema"
                />
            </Card>

            {/* Modals */}
            {showParameterModal && (
                <ParameterModal
                    isOpen={showParameterModal}
                    onClose={handleCloseModal}
                    parameter={editingParameter}
                />
            )}

            {showBulkDeleteModal && (
                <BulkDeleteModal
                    isOpen={showBulkDeleteModal}
                    onClose={() => setShowBulkDeleteModal(false)}
                    onConfirm={handleBulkDelete}
                    isDeleting={isDeleting}
                    itemCount={selectedItems.length}
                    itemName="parâmetro(s)"
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
                    itemName={`parâmetro "${itemToDelete.name}"`}
                />
            )}
        </div>
    );
};

export default ParameterList;
