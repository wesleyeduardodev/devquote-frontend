import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, GitBranch, ExternalLink, Calendar, FileCode, Truck } from 'lucide-react';
import { useDeliveries } from '@/hooks/useDeliveries';
import DataTable, { Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import toast from 'react-hot-toast';

interface Delivery {
    id: number;
    taskName: string;
    taskCode: string;
    projectName: string;
    branch?: string;
    pullRequest?: string;
    status: string;
    startedAt?: string;
    finishedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

const DeliveryList: React.FC = () => {
    const navigate = useNavigate();
    const {
        deliveries,
        pagination,
        loading,
        sorting,
        filters,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
        deleteDelivery
    } = useDeliveries();

    const handleEdit = (id: number) => {
        navigate(`/deliveries/${id}/edit`);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir esta entrega?')) {
            try {
                await deleteDelivery(id);
            } catch (error) {
                toast.error('Erro ao excluir entrega');
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

    const columns: Column<Delivery>[] = [
        {
            key: 'id',
            title: 'ID',
            sortable: true,
            filterable: true,
            filterType: 'number',
            width: '100px',
            align: 'center',
            render: (item) => (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    #{item.id}
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
            key: 'projectName',
            title: 'Projeto',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '150px',
            render: (item) => (
                <span className="text-sm text-gray-900">
                    {item.projectName}
                </span>
            )
        },
        {
            key: 'status',
            title: 'Status',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '120px',
            align: 'center',
            render: (item) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                    {getStatusLabel(item.status)}
                </span>
            )
        },
        {
            key: 'branch',
            title: 'Branch',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '150px',
            render: (item) => (
                item.branch ? (
                    <div className="flex items-center gap-1">
                        <GitBranch className="w-4 h-4 text-gray-400"/>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-mono">
                            {item.branch}
                        </span>
                    </div>
                ) : (
                    <span className="text-gray-400">-</span>
                )
            )
        },
        {
            key: 'pullRequest',
            title: 'Pull Request',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '120px',
            align: 'center',
            render: (item) => (
                item.pullRequest ? (
                    <a
                        href={item.pullRequest}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                        title={item.pullRequest}
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                )
            )
        },
        {
            key: 'startedAt',
            title: 'Iniciado em',
            sortable: true,
            filterable: true,
            filterType: 'date',
            width: '120px',
            render: (item) => (
                <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400"/>
                    <span className="text-sm text-gray-600">
                        {formatDateShort(item.startedAt)}
                    </span>
                </div>
            ),
            hideable: true
        },
        {
            key: 'finishedAt',
            title: 'Finalizado em',
            sortable: true,
            filterable: true,
            filterType: 'date',
            width: '120px',
            render: (item) => (
                <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400"/>
                    <span className="text-sm text-gray-600">
                        {formatDateShort(item.finishedAt)}
                    </span>
                </div>
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
        {
            key: 'actions',
            title: 'Ações',
            align: 'center',
            width: '120px',
            render: (item) => (
                <div className="flex items-center justify-center gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(item.id)}
                        title="Editar"
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        title="Excluir"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Entregas</h1>
                </div>
                <Button
                    variant="primary"
                    onClick={() => navigate('/deliveries/create')}
                    className="flex items-center"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Entrega
                </Button>
            </div>

            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Truck className="h-8 w-8 text-blue-600"/>
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-500">Total</div>
                            <div className="text-2xl font-bold text-gray-900">
                                {pagination?.totalElements || 0}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <FileCode className="h-8 w-8 text-yellow-600"/>
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-500">Em Progresso</div>
                            <div className="text-2xl font-bold text-yellow-600">
                                {deliveries.filter(d => d.status === 'IN_PROGRESS').length}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <FileCode className="h-8 w-8 text-green-600"/>
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-500">Entregues</div>
                            <div className="text-2xl font-bold text-green-600">
                                {deliveries.filter(d => d.status === 'DELIVERED').length}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <FileCode className="h-8 w-8 text-emerald-600"/>
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-500">Aprovadas</div>
                            <div className="text-2xl font-bold text-emerald-600">
                                {deliveries.filter(d => d.status === 'APPROVED').length}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <Card className="p-0">
                <DataTable
                    data={deliveries}
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
                    emptyMessage="Nenhuma entrega encontrada"
                    showColumnToggle={true}
                    hiddenColumns={['startedAt', 'finishedAt', 'createdAt', 'updatedAt']}
                />
            </Card>
        </div>
    );
};

export default DeliveryList;