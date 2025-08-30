import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, Check, User, Hash, FileText, Calculator, Edit3, Calendar, Filter } from 'lucide-react';
import { quoteService } from '@/services/quoteService';
import { taskService } from '@/services/taskService';
import { useTasks } from '@/hooks/useTasks';
import DataTable, { Column } from '@/components/ui/DataTable';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import QuoteForm from '../../components/forms/QuoteForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface Task {
    id: number;
    requesterId: number;
    requesterName?: string;
    title: string;
    description?: string;
    status: string;
    code: string;
    link?: string;
    createdAt?: string;
    updatedAt?: string;
    subTasks?: any[];
}

const QuoteEdit = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Hook para gerenciar tarefas paginadas
    const {
        tasks,
        pagination,
        loading: loadingTasks,
        sorting,
        filters,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters
    } = useTasks({
        page: 0,
        size: 5,
        sort: [{ field: 'id', direction: 'desc' }],
        filters: {}
    });

    useEffect(() => {
        const fetchQuote = async () => {
            if (!id) {
                navigate('/quotes');
                return;
            }

            try {
                setFetchLoading(true);
                const data = await quoteService.getById(Number(id));
                setQuote(data);
            } catch (error) {
                console.error('Erro ao carregar orçamento:', error);
                toast.error('Erro ao carregar orçamento');
                navigate('/quotes');
            } finally {
                setFetchLoading(false);
            }
        };

        if (id) {
            fetchQuote();
        }
    }, [id, navigate]);

    // Quando tivermos o orçamento, buscar a tarefa específica pelo taskId
    useEffect(() => {
        const fetchTaskForQuote = async () => {
            if (!quote?.taskId || selectedTask?.id === quote.taskId) return;
            
            try {
                const task = await taskService.getById(quote.taskId);
                setSelectedTask(task);
            } catch (error) {
                console.error('Erro ao carregar tarefa do orçamento:', error);
                // Se não conseguir carregar a tarefa específica, tentar encontrar nas tarefas já carregadas
                if (Array.isArray(tasks) && tasks.length > 0) {
                    const found = tasks.find((t: any) => t.id === quote.taskId);
                    if (found) {
                        setSelectedTask(found);
                    }
                }
            }
        };

        if (quote?.taskId) {
            fetchTaskForQuote();
        }
    }, [quote?.taskId, selectedTask?.id, tasks]);

    const calculateTaskTotal = (task: Task) => {
        if (!task?.subTasks || !Array.isArray(task.subTasks)) return 0;
        return task.subTasks.reduce((total: number, subTask: any) => {
            return total + (parseFloat(subTask.amount?.toString() || '0') || 0);
        }, 0);
    };

    const handleTaskSelect = (task: Task) => {
        setSelectedTask(task);
        setShowTaskModal(false);
    };

    const handleSubmit = async (data: any) => {
        if (!id) return;

        if (!selectedTask) {
            toast.error('Selecione uma tarefa');
            return;
        }

        try {
            setLoading(true);
            await quoteService.update(Number(id), data);
            toast.success('Orçamento atualizado com sucesso!');
            navigate('/quotes');
        } catch (error: any) {
            console.error('Erro ao atualizar orçamento:', error);
            let errorMessage = 'Erro ao atualizar orçamento';
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.response?.data?.errors) {
                errorMessage = Object.values(error.response.data.errors).join(', ');
            } else if (error?.message) {
                errorMessage = error.message;
            }
            toast.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/quotes');
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
            CANCELLED: 'bg-red-100 text-red-800',
            DRAFT: 'bg-gray-100 text-gray-800',
            APPROVED: 'bg-green-100 text-green-800',
            REJECTED: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Pendente',
            IN_PROGRESS: 'Em Progresso',
            COMPLETED: 'Concluída',
            CANCELLED: 'Cancelada',
            DRAFT: 'Rascunho',
            APPROVED: 'Aprovado',
            REJECTED: 'Rejeitado',
        };
        return labels[status] || status;
    };

    // Filtrar tasks para o modal mobile
    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.requesterName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Colunas para o DataTable do modal de tarefas
    const taskColumns: Column<Task>[] = useMemo(
        () => [
            {
                key: 'id',
                title: 'ID',
                sortable: true,
                filterable: true,
                filterType: 'number',
                width: '80px',
                align: 'center',
                render: (item) => (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
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
                    <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {item.code}
                        </span>
                    </div>
                )
            },
            {
                key: 'title',
                title: 'Título',
                sortable: true,
                filterable: true,
                filterType: 'text',
                width: '200px',
                render: (item) => (
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <div>
                            <p className="font-medium text-gray-900 truncate cursor-help" title={item.title}>
                                {item.title}
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
                key: 'requesterName',
                title: 'Solicitante',
                sortable: true,
                filterable: true,
                filterType: 'text',
                width: '150px',
                render: (item) => (
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                            {item.requesterName || 'Não informado'}
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
                    <span className="text-sm font-medium text-green-600">
                        {formatCurrency(calculateTaskTotal(item))}
                    </span>
                )
            },
            {
                key: 'actions',
                title: 'Selecionar',
                align: 'center',
                width: '100px',
                render: (item) => (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleTaskSelect(item);
                        }}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                    >
                        <Check className="w-3 h-3 mr-1" />
                        Selecionar
                    </button>
                )
            }
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    // Componente Card para tasks no mobile
    const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                            #{task.id}
                        </span>
                        <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {task.code}
                        </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-base leading-tight mb-2">
                        {task.title}
                    </h3>

                    <div className="space-y-1 mb-2">
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                                {getStatusLabel(task.status)}
                            </span>
                        </div>

                        {task.requesterName && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{task.requesterName}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-sm">
                            <Calculator className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="font-medium text-green-600">
                                {formatCurrency(calculateTaskTotal(task))}
                            </span>
                        </div>
                    </div>
                </div>

                <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleTaskSelect(task)}
                    className="ml-3"
                >
                    <Check className="w-4 h-4 mr-1" />
                    Selecionar
                </Button>
            </div>
        </div>
    );

    if (fetchLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Carregando orçamento...</p>
                </Card>
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Edit3 className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Orçamento não encontrado
                    </h2>
                    <p className="text-gray-600 mb-6">
                        O orçamento que você está procurando não foi encontrado.
                    </p>
                    <Button
                        onClick={handleCancel}
                        variant="primary"
                        className="w-full"
                    >
                        Voltar para Listagem
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="flex items-center p-2 sm:px-3 sm:py-2"
                    >
                        <ArrowLeft className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Voltar</span>
                    </Button>
                </div>

                {/* Card Principal */}
                <Card className="overflow-hidden">
                    {/* Header do Card */}
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Edit3 className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Editar Orçamento
                                    </h3>
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                                        #{quote.id}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Atualize as informações do orçamento
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Conteúdo do Card */}
                    <div className="px-4 py-5 sm:px-6">
                        {/* Tarefa Selecionada */}
                        {selectedTask ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-blue-900">Tarefa Selecionada</h4>
                                    <button
                                        type="button"
                                        onClick={() => setShowTaskModal(true)}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                        title="Alterar tarefa"
                                    >
                                        Alterar
                                    </button>
                                </div>
                                <div className="space-y-1 text-sm text-blue-800">
                                    <div><strong>Código:</strong> {selectedTask.code}</div>
                                    <div><strong>Título:</strong> {selectedTask.title}</div>
                                    {selectedTask.description && (
                                        <div><strong>Descrição:</strong> {selectedTask.description}</div>
                                    )}
                                    <div><strong>Subtarefas:</strong> {selectedTask.subTasks?.length || 0}</div>
                                    <div className="flex items-center">
                                        <Calculator className="w-4 h-4 mr-1" />
                                        <strong>Total Calculado:</strong> {formatCurrency(calculateTaskTotal(selectedTask))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tarefa *
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowTaskModal(true)}
                                    className="w-full px-4 py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                                >
                                    <Search className="w-4 h-4 mx-auto mb-1" />
                                    Clique para selecionar uma tarefa
                                </button>
                            </div>
                        )}

                        {/* QuoteForm */}
                        <QuoteForm
                            initialData={quote && selectedTask ? {
                                ...quote,
                                taskId: selectedTask.id,
                            } : quote}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            loading={loading}
                            selectedTask={selectedTask}
                            formatCurrency={formatCurrency}
                        />
                    </div>
                </Card>

                {/* Informações Adicionais - Mobile */}
                <div className="lg:hidden space-y-4">
                    {/* Metadados */}
                    <Card className="p-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Informações do Orçamento
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Criado em:</span>
                                <span className="text-gray-900">{formatDate(quote?.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Atualizado em:</span>
                                <span className="text-gray-900">{formatDate(quote?.updatedAt)}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Dicas */}
                    <Card className="p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Dicas de Edição</h4>
                        <div className="space-y-3 text-sm text-gray-600">
                            <div className="flex items-start gap-3">
                                <FileText className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <strong>Tarefa:</strong> Verifique se a tarefa selecionada está correta
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calculator className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <strong>Valor:</strong> Atualize o valor conforme necessário
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Edit3 className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <strong>Status:</strong> Altere o status conforme o progresso do orçamento
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Informações Adicionais - Desktop */}
                <div className="hidden lg:block">
                    <Card className="p-4">
                        <div className="grid grid-cols-2 gap-6 text-sm">
                            <div>
                                <span className="text-gray-600">Criado em:</span>
                                <p className="text-gray-900 font-medium">{formatDate(quote?.createdAt)}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Última atualização:</span>
                                <p className="text-gray-900 font-medium">{formatDate(quote?.updatedAt)}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modal de Seleção de Tarefa */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col max-w-7xl">
                        {/* Header do Modal */}
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                            <div>
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                                    Selecionar Tarefa
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    Escolha uma tarefa para editar o orçamento
                                </p>
                            </div>
                            <button
                                onClick={() => setShowTaskModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        {/* Busca Mobile */}
                        <div className="lg:hidden p-4 border-b border-gray-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar tarefa..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                                />
                            </div>
                        </div>

                        {/* Conteúdo do Modal */}
                        <div className="flex-1 overflow-hidden">
                            {/* Desktop - DataTable */}
                            <div className="hidden lg:block h-full">
                                <DataTable
                                    data={tasks}
                                    columns={taskColumns}
                                    loading={loadingTasks}
                                    pagination={pagination}
                                    sorting={sorting}
                                    filters={filters}
                                    onPageChange={setPage}
                                    onPageSizeChange={setPageSize}
                                    onSort={setSorting}
                                    onFilter={setFilter}
                                    onClearFilters={clearFilters}
                                    emptyMessage="Nenhuma tarefa encontrada"
                                    showColumnToggle={false}
                                    className="h-full"
                                />
                            </div>

                            {/* Mobile - Cards */}
                            <div className="lg:hidden h-full overflow-y-auto">
                                {loadingTasks ? (
                                    <div className="flex items-center justify-center p-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <span className="ml-3 text-gray-600">Carregando...</span>
                                    </div>
                                ) : filteredTasks.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <h3 className="text-lg font-medium mb-2 text-gray-900">
                                            Nenhuma tarefa encontrada
                                        </h3>
                                        <p className="text-gray-600">
                                            Tente ajustar sua busca ou limpar os filtros.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-4 space-y-3">
                                        {filteredTasks.map((task) => (
                                            <TaskCard key={task.id} task={task} />
                                        ))}
                                    </div>
                                )}

                                {/* Paginação Mobile */}
                                {pagination && pagination.totalPages > 1 && !searchTerm && (
                                    <div className="p-4 border-t border-gray-200">
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
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuoteEdit;