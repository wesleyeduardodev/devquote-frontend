import React from 'react';
import {useNavigate} from 'react-router-dom';
import {Plus, Edit, Trash2, ExternalLink, CheckSquare, DollarSign} from 'lucide-react';
import {useTasks} from '@/hooks/useTasks';
import DataTable, {Column} from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import toast from 'react-hot-toast';

interface SubTask {
    id?: number;
    title: string;
    description?: string;
    amount: number;
    status: string;
    taskId?: number;
    excluded?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface Task {
    id: number;
    requesterId: number;
    requesterName?: string;
    title: string;
    description?: string;
    status: string;
    code: string;
    link?: string;
    subTasks?: SubTask[];
    createdAt?: string;
    updatedAt?: string;
}

const TaskList: React.FC = () => {
    const navigate = useNavigate();
    const {
        tasks,
        pagination,
        loading,
        sorting,
        filters,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
        deleteTaskWithSubTasks
    } = useTasks();

    const handleEdit = (id: number) => {
        navigate(`/tasks/${id}/edit`);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir esta tarefa e todas as suas subtarefas?')) {
            try {
                await deleteTaskWithSubTasks(id);
            } catch (error) {
                toast.error('Erro ao excluir tarefa');
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
            IN_PROGRESS: 'bg-blue-100 text-blue-800',
            COMPLETED: 'bg-green-100 text-green-800',
            CANCELLED: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Pendente',
            IN_PROGRESS: 'Em Progresso',
            COMPLETED: 'Concluída',
            CANCELLED: 'Cancelada'
        };
        return labels[status] || status;
    };

    const calculateTaskTotal = (subTasks?: SubTask[]) => {
        return subTasks?.reduce((total: number, subTask: SubTask) => total + (subTask.amount || 0), 0) || 0;
    };

    const columns: Column<Task>[] = [
        {
            key: 'id',
            title: 'ID',
            sortable: true,
            filterable: true,
            filterType: 'number',
            width: '80px',
            align: 'center',
            render: (item) => (
                <span
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    #{item.id}
                </span>
            )
        },
        {
            key: 'code',
            title: 'Código',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '120px',
            render: (item) => (
                <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {item.code}
                </span>
            )
        },
        {
            key: 'title',
            title: 'Título',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (item) => (
                <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    {item.description && (
                        <p className="text-sm text-gray-500 truncate max-w-xs" title={item.description}>
                            {item.description}
                        </p>
                    )}
                </div>
            )
        },
        {
            key: 'status',
            title: 'Status',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '140px',
            align: 'center',
            render: (item) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                    {getStatusLabel(item.status)}
                </span>
            )
        },
        {
            key: 'requesterName',
            title: 'Solicitante',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (item) => (
                <span className="text-sm text-gray-900">
                    {item.requesterName || 'Não informado'}
                </span>
            )
        },
        {
            key: 'link',
            title: 'Link',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '100px',
            align: 'center',
            render: (item) => (
                item.link ? (
                    <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                        title={item.link}
                    >
                        <ExternalLink className="w-4 h-4"/>
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                )
            )
        },
        {
            key: 'subTasks',
            title: 'Subtarefas',
            width: '120px',
            align: 'center',
            render: (item) => (
                <div className="flex items-center justify-center gap-1">
                    <CheckSquare className="w-4 h-4 text-gray-400"/>
                    <span className="text-sm text-gray-600">
                        {item.subTasks?.length || 0}
                    </span>
                </div>
            )
        },
        {
            key: 'total',
            title: 'Valor Total',
            width: '120px',
            align: 'right',
            render: (item) => (
                <div className="flex items-center justify-end gap-1">
                    <DollarSign className="w-4 h-4 text-green-600"/>
                    <span className="text-sm font-medium text-green-600">
                        {formatCurrency(calculateTaskTotal(item.subTasks))}
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
            render: (item) => formatDate(item.createdAt),
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
                        <Edit className="w-4 h-4"/>
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        title="Excluir"
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
                    <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
                    <p className="text-gray-600 mt-1">Gerencie tarefas e subtarefas do sistema de orçamento</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => navigate('/tasks/create')}
                    className="flex items-center"
                >
                    <Plus className="w-4 h-4 mr-2"/>
                    Nova Tarefa
                </Button>
            </div>

            {/* Table Card */}
            <Card className="p-0">
                <DataTable
                    data={tasks}
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
                    emptyMessage="Nenhuma tarefa encontrada"
                    showColumnToggle={true}
                    hiddenColumns={['updatedAt']}
                />
            </Card>
        </div>
    );
};

export default TaskList;