import React from 'react';
import {useNavigate} from 'react-router-dom';
import {Plus, Edit, Trash2, FileText, DollarSign, Calendar, Hash, Tag} from 'lucide-react';
import useQuotes from '@/hooks/useQuotes';
import DataTable, {Column} from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import toast from 'react-hot-toast';

interface Quote {
    id: number;
    taskId: number;
    taskName: string;
    taskCode: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
}

const QuoteList: React.FC = () => {
    const navigate = useNavigate();
    const {
        quotes,
        pagination,
        loading,
        sorting,
        filters,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
        deleteQuote
    } = useQuotes();

    const handleEdit = (id: number) => {
        navigate(`/quotes/${id}/edit`);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
            try {
                await deleteQuote(id);
            } catch (error) {
                toast.error('Erro ao excluir orçamento');
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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            APPROVED: 'bg-green-100 text-green-800',
            REJECTED: 'bg-red-100 text-red-800',
            DRAFT: 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Pendente',
            APPROVED: 'Aprovado',
            REJECTED: 'Rejeitado',
            DRAFT: 'Rascunho'
        };
        return labels[status] || status;
    };

    const columns: Column<Quote>[] = [
        {
            key: 'id',
            title: 'ID',
            sortable: true,
            filterable: true,
            filterType: 'number',
            width: '100px',
            align: 'center',
            render: (item) => (
                <span
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
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
                <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-400"/>
                    <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {item.taskCode}
                    </span>
                </div>
            )
        },
        {
            key: 'taskName',
            title: 'Nome da Tarefa',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '250px',
            render: (item) => (
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400"/>
                    <div>
                        <p
                            className="font-medium text-gray-900 truncate cursor-help"
                            title={item.taskName}
                        >
                            {item.taskName}
                        </p>
                        <p className="text-xs text-gray-500">
                            Task ID: {item.taskId}
                        </p>
                    </div>
                </div>
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
            key: 'totalAmount',
            title: 'Valor Total',
            sortable: true,
            filterable: true,
            filterType: 'number',
            width: '150px',
            align: 'right',
            render: (item) => (
                <div className="flex items-center justify-end gap-1">
                    <DollarSign className="w-4 h-4 text-green-600"/>
                    <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(item.totalAmount)}
                    </span>
                </div>
            )
        },
        {
            key: 'createdAt',
            title: 'Criado em',
            sortable: true,
            filterable: true,
            filterType: 'date',
            width: '160px',
            render: (item) => (
                <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400"/>
                    <span className="text-sm text-gray-600">
                        {formatDate(item.createdAt)}
                    </span>
                </div>
            ),
            hideable: true
        },
        {
            key: 'updatedAt',
            title: 'Atualizado em',
            sortable: true,
            filterable: true,
            filterType: 'date',
            width: '160px',
            render: (item) => (
                <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400"/>
                    <span className="text-sm text-gray-600">
                        {formatDate(item.updatedAt)}
                    </span>
                </div>
            ),
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
                        title="Editar orçamento"
                    >
                        <Edit className="w-4 h-4"/>
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        title="Excluir orçamento"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4"/>
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
                    <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
                    <p className="text-gray-600 mt-1">Gerencie orçamentos criados para as tarefas</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => navigate('/quotes/create')}
                    className="flex items-center"
                >
                    <Plus className="w-4 h-4 mr-2"/>
                    Novo Orçamento
                </Button>
            </div>

            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <FileText className="h-8 w-8 text-blue-600"/>
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
                            <Tag className="h-8 w-8 text-yellow-600"/>
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-500">Pendentes</div>
                            <div className="text-2xl font-bold text-yellow-600">
                                {quotes.filter(q => q.status === 'PENDING').length}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Tag className="h-8 w-8 text-green-600"/>
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-500">Aprovados</div>
                            <div className="text-2xl font-bold text-green-600">
                                {quotes.filter(q => q.status === 'APPROVED').length}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <DollarSign className="h-8 w-8 text-blue-600"/>
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-500">Valor Total</div>
                            <div className="text-lg font-bold text-blue-600">
                                {formatCurrency(
                                    quotes.reduce((sum, quote) => sum + quote.totalAmount, 0)
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <Card className="p-0">
                <DataTable
                    data={quotes}
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
                    emptyMessage="Nenhum orçamento encontrado"
                    showColumnToggle={true}
                    hiddenColumns={['createdAt', 'updatedAt']}
                />
            </Card>
        </div>
    );
};

export default QuoteList;