import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Edit,
    Trash2,
    ExternalLink,
    CheckSquare,
    DollarSign,
    Search,
    Filter,
    User,
    Video,
    Calendar,
} from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import DataTable, { Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import BulkDeleteModal from '@/components/ui/BulkDeleteModal';
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
    meetingLink?: string;
    notes?: string;
    subTasks?: SubTask[];
    createdAt?: string;
    updatedAt?: string;
}

const TaskList: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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
        deleteTaskWithSubTasks,
        deleteBulkTasks, // <-- deve existir no hook; ajuste o nome se necessário
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
            minute: '2-digit',
        });
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            IN_PROGRESS: 'bg-blue-100 text-blue-800',
            COMPLETED: 'bg-green-100 text-green-800',
            CANCELLED: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Pendente',
            IN_PROGRESS: 'Em Progresso',
            COMPLETED: 'Concluída',
            CANCELLED: 'Cancelada',
        };
        return labels[status] || status;
    };

    const calculateTaskTotal = (subTasks?: SubTask[]) =>
        subTasks?.reduce((total: number, s: SubTask) => total + (s.amount || 0), 0) || 0;

    // ===== Seleção múltipla (igual ProjectList) =====
    const toggleItem = (id: number) => {
        setSelectedItems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const toggleAll = () => {
        const currentPageIds = tasks.map((t) => t.id);
        const allSelected = currentPageIds.every((id) => selectedItems.includes(id));

        if (allSelected) {
            setSelectedItems((prev) => prev.filter((id) => !currentPageIds.includes(id)));
        } else {
            setSelectedItems((prev) => [...new Set([...prev, ...currentPageIds])]);
        }
    };

    const clearSelection = () => setSelectedItems([]);

    const selectionState = useMemo(() => {
        const currentPageIds = tasks.map((t) => t.id);
        const selectedFromCurrentPage = selectedItems.filter((id) => currentPageIds.includes(id));

        return {
            allSelected:
                currentPageIds.length > 0 && selectedFromCurrentPage.length === currentPageIds.length,
            someSelected:
                selectedFromCurrentPage.length > 0 && selectedFromCurrentPage.length < currentPageIds.length,
            hasSelection: selectedItems.length > 0,
            selectedFromCurrentPage,
        };
    }, [tasks, selectedItems]);

    const handleBulkDelete = async () => {
        if (selectedItems.length === 0) return;
        setIsDeleting(true);
        try {
            await deleteBulkTasks(selectedItems);
            const qty = selectedItems.length;
            clearSelection();
            setShowBulkDeleteModal(false);
            toast.success(`${qty} tarefa(s) excluída(s) com sucesso`);
        } catch (error) {
            toast.error('Erro ao excluir tarefas selecionadas');
        } finally {
            setIsDeleting(false);
        }
    };

    // ===== Busca simples (mobile) =====
    const filteredTasks = tasks.filter(
        (task) =>
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getStatusLabel(task.status).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ===== Colunas (inclui checkbox de seleção) =====
    const columns: Column<Task>[] = [
        {
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
                            if (input) input.indeterminate = selectionState.someSelected;
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
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItem(item.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            ),
        },
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
            ),
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
            ),
        },
        {
            key: 'title',
            title: 'Título',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '250px',
            render: (item) => (
                <div>
                    <p className="font-medium text-gray-900 truncate cursor-help" title={item.title}>
                        {item.title}
                    </p>
                </div>
            ),
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
            ),
        },
        {
            key: 'requesterName',
            title: 'Solicitante',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (item) => <span className="text-sm text-gray-900">{item.requesterName || 'Não informado'}</span>,
        },
        {
            key: 'link',
            title: 'Link',
            width: '80px',
            align: 'center',
            render: (item) =>
                item.link ? (
                    <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                        title={item.link}
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                ),
        },
        {
            key: 'meetingLink',
            title: 'Reunião',
            width: '80px',
            align: 'center',
            render: (item) =>
                item.meetingLink ? (
                    <a
                        href={item.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800 flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                        title={item.meetingLink}
                    >
                        <Video className="w-4 h-4" />
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                ),
        },
        {
            key: 'subTasks',
            title: 'Subtarefas',
            width: '120px',
            align: 'center',
            render: (item) => (
                <div className="flex items-center justify-center gap-1">
                    <CheckSquare className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{item.subTasks?.length || 0}</span>
                </div>
            ),
        },
        {
            key: 'total',
            title: 'Valor Total',
            width: '120px',
            align: 'right',
            render: (item) => (
                <div className="flex items-center justify-end gap-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
            {formatCurrency(calculateTaskTotal(item.subTasks))}
          </span>
                </div>
            ),
        },
        {
            key: 'createdAt',
            title: 'Criado em',
            sortable: true,
            filterable: true,
            filterType: 'date',
            render: (item) => formatDate(item.createdAt),
            hideable: true,
        },
        {
            key: 'updatedAt',
            title: 'Atualizado em',
            sortable: true,
            filterable: true,
            filterType: 'date',
            render: (item) => formatDate(item.updatedAt),
            hideable: true,
        },
        {
            key: 'actions',
            title: 'Ações',
            align: 'center',
            width: '120px',
            render: (item) => (
                <div className="flex items-center justify-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(item.id)} title="Editar">
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
            ),
        },
    ];

    // ===== Card (mobile) com checkbox + ações =====
    const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            {/* Header do Card */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 pt-1">
                        <input
                            type="checkbox"
                            checked={selectedItems.includes(task.id)}
                            onChange={() => toggleItem(task.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                #{task.id}
              </span>
                            <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {task.code}
              </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-2">{task.title}</h3>
                        <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                {getStatusLabel(task.status)}
              </span>
                        </div>
                    </div>
                </div>

                {/* Ações */}
                <div className="flex gap-1 ml-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(task.id)}
                        title="Editar"
                        className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(task.id)}
                        title="Excluir"
                        className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Informações da Task */}
            <div className="space-y-2">
                {task.requesterName && (
                    <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700">{task.requesterName}</span>
                    </div>
                )}

                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600">{task.subTasks?.length || 0} subtarefa(s)</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">
              {formatCurrency(calculateTaskTotal(task.subTasks))}
            </span>
                    </div>
                </div>

                {/* Links */}
                <div className="flex items-center gap-4 text-sm">
                    {task.link && (
                        <div className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <a
                                href={task.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline truncate"
                            >
                                Ver link da tarefa
                            </a>
                        </div>
                    )}

                    {task.meetingLink && (
                        <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <a
                                href={task.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800 hover:underline truncate"
                            >
                                Entrar na reunião
                            </a>
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
                    <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
                </div>
                <Button
                    variant="primary"
                    onClick={() => navigate('/tasks/create')}
                    className="flex items-center justify-center sm:justify-start"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Tarefa
                </Button>
            </div>

            {/* Filtros Mobile - Busca + seleção e bulk delete */}
            <div className="lg:hidden space-y-4">
                <Card className="p-4">
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar por título, código, solicitante ou status..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                            />
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <Button size="sm" variant="ghost" onClick={toggleAll} className="flex items-center gap-2">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectionState.allSelected}
                                        ref={(input) => {
                                            if (input) input.indeterminate = selectionState.someSelected;
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
                    </div>
                </Card>
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
                    {/* Desktop - Barra de ações quando há seleção */}
                    <div className="hidden lg:block space-y-4">
                        {selectionState.hasSelection && (
                            <Card className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      {selectedItems.length} tarefa(s) selecionada(s)
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

                        {/* Desktop - Tabela */}
                        <Card className="p-0">
                            <DataTable
                                data={tasks} // dados originais (filtros e ordenações do DataTable)
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
                                hiddenColumns={['createdAt', 'updatedAt']}
                            />
                        </Card>
                    </div>

                    {/* Mobile/Tablet - Cards com busca simples */}
                    <div className="lg:hidden">
                        {filteredTasks.length === 0 ? (
                            <Card className="p-8 text-center">
                                <div className="text-gray-500">
                                    <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-lg font-medium mb-2">Nenhuma tarefa encontrada</h3>
                                    <p>Tente ajustar os filtros de busca ou criar uma nova tarefa.</p>
                                </div>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {filteredTasks.map((task) => (
                                    <TaskCard key={task.id} task={task} />
                                ))}
                            </div>
                        )}

                        {/* Paginação Simplificada (mobile) */}
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
                entityName="tarefa"
            />
        </div>
    );
};

export default TaskList;
