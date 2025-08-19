import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, Check, User, Hash, FileText, Calculator } from 'lucide-react';
import { quoteService } from '@/services/quoteService';
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
        size: 10,
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

    // Quando tivermos o orçamento e as tarefas carregadas, tentamos "casar" a taskId
    useEffect(() => {
        if (!quote || !Array.isArray(tasks) || tasks.length === 0) return;
        const found = tasks.find((t: any) => t.id === quote.taskId);
        if (found) {
            setSelectedTask(found);
        }
    }, [quote, tasks]);

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
                        <Hash className="w-4 h-4 text-gray-400"/>
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
                        <FileText className="w-4 h-4 text-gray-400"/>
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
                        <User className="w-4 h-4 text-gray-400"/>
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
                        <Check className="w-3 h-3 mr-1"/>
                        Selecionar
                    </button>
                )
            }
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    if (fetchLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <LoadingSpinner size="lg"/>
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Orçamento não encontrado</h2>
                <p className="text-gray-600 mb-4">O orçamento que você está procurando não foi encontrado.</p>
                <button onClick={handleCancel} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Voltar para Listagem
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="flex items-center"
                >
                    <ArrowLeft className="w-4 h-4 mr-1"/>
                    Voltar
                </Button>
            </div>

            <Card
                title={
                    <div className="flex items-center gap-2">
                        <span>Editar Orçamento</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                            #{quote.id}
                        </span>
                    </div>
                }
                subtitle={`Atualize as informações do orçamento`}
            >
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
                            <Search className="w-4 h-4 mx-auto mb-1"/>
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
            </Card>

            {/* Modal de Seleção de Tarefa */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header do Modal */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Selecionar Tarefa</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Escolha uma tarefa para editar o orçamento
                                </p>
                            </div>
                            <button
                                onClick={() => setShowTaskModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6"/>
                            </button>
                        </div>

                        {/* DataTable Container */}
                        <div className="flex-1 overflow-hidden">
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuoteEdit;