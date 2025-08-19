import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator, Search, X, Check, DollarSign } from 'lucide-react';
import { quoteService } from '@/services/quoteService';
import { useTasks } from '@/hooks/useTasks';
import DataTable, { Column } from '@/components/ui/DataTable';
import toast from 'react-hot-toast';

interface SubTaskResponseDTO {
    id?: number;
    title: string;
    description?: string;
    amount: number;
    status: string;
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
    createdAt?: string;
    updatedAt?: string;
    subTasks?: SubTaskResponseDTO[];
}

const QuoteEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(false);
    const [fetchLoading, setFetchLoading] = useState<boolean>(true);
    const [quote, setQuote] = useState<any>(null);

    // Modal + tarefa selecionada (mesmo esquema do Create)
    const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const [formData, setFormData] = useState({
        status: 'DRAFT',
        totalAmount: '',
    });

    // Hook de tarefas (paginado) — MESMO ESQUEMA DO CREATE
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
        clearFilters,
        fetchTasks, // se existir no seu hook; senão remova
    } = useTasks({
        page: 0,
        size: 10,
        sort: [{ field: 'id', direction: 'desc' }],
        filters: {},
    });

    // Carrega orçamento
    useEffect(() => {
        const load = async () => {
            if (!id) {
                navigate('/quotes');
                return;
            }
            try {
                setFetchLoading(true);
                const quoteResponse = await quoteService.getById(Number(id));
                setQuote(quoteResponse);

                // Pré-carrega status/valor
                setFormData({
                    status: quoteResponse.status,
                    totalAmount: (quoteResponse.totalAmount ?? '').toString(),
                });

                // Tenta selecionar a tarefa do orçamento quando ela estiver disponível no grid
                // (pode acontecer depois; por isso há outro effect abaixo)
            } catch (error) {
                console.error('Erro ao carregar orçamento:', error);
                toast.error('Erro ao carregar orçamento');
                navigate('/quotes');
            } finally {
                setFetchLoading(false);
            }
        };
        load();
    }, [id, navigate]);

    // Quando tivermos o orçamento e as tarefas carregadas, tentamos “casar” a taskId
    useEffect(() => {
        if (!quote || !Array.isArray(tasks) || tasks.length === 0) return;
        const found = tasks.find((t: any) => t.id === quote.taskId);
        if (found) {
            setSelectedTask(found);
        }
    }, [quote, tasks]);

    const calculateTaskTotal = (task: Task) => {
        if (!task?.subTasks || !Array.isArray(task.subTasks)) return 0;
        return task.subTasks.reduce((total: number, subTask: SubTaskResponseDTO) => {
            return total + (parseFloat(subTask.amount?.toString() || '0') || 0);
        }, 0);
    };

    const handleTaskSelect = (task: Task) => {
        setSelectedTask(task);
        const taskTotal = calculateTaskTotal(task);
        setFormData((prev) => ({
            ...prev,
            totalAmount: taskTotal.toFixed(2),
        }));
        setShowTaskModal(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleRecalculate = () => {
        if (selectedTask) {
            const taskTotal = calculateTaskTotal(selectedTask);
            setFormData((prev) => ({
                ...prev,
                totalAmount: taskTotal.toFixed(2),
            }));
            toast.success('Valor recalculado com base nas subtarefas');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTask) {
            toast.error('Selecione uma tarefa');
            return;
        }
        if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
            toast.error('Valor total deve ser maior que zero');
            return;
        }
        if (!id) return;

        try {
            setLoading(true);
            await quoteService.update(Number(id), {
                taskId: selectedTask.id,
                status: formData.status,
                totalAmount: parseFloat(formData.totalAmount),
            });
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
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => navigate('/quotes');

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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

    // Colunas do DataTable (mesmas do Create)
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
                    <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">{item.code}</span>
                ),
            },
            {
                key: 'title',
                title: 'Título',
                sortable: true,
                filterable: true,
                filterType: 'text',
                width: '200px',
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
                width: '120px',
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
                width: '150px',
                render: (item) => <span className="text-sm text-gray-900">{item.requesterName || 'Não informado'}</span>,
            },
            {
                key: 'total',
                title: 'Valor Total',
                width: '120px',
                align: 'right',
                render: (item) => (
                    <div className="flex items-center justify-end gap-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">{formatCurrency(calculateTaskTotal(item))}</span>
                    </div>
                ),
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
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    if (fetchLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-4 text-gray-600">Carregando orçamento...</span>
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
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <button onClick={handleCancel} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar
                </button>
            </div>

            {/* Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">Editar Orçamento</h1>
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
              #{quote.id}
            </span>
                    </div>
                    <p className="text-gray-600">Atualize as informações do orçamento</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Seleção de Tarefa (mesmo modal do Create) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tarefa *</label>

                        {selectedTask ? (
                            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">
                                            {selectedTask.code} - {selectedTask.title}
                                        </div>
                                        {selectedTask.description && (
                                            <div className="text-sm text-gray-600 mt-1">{selectedTask.description}</div>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTask.status)}`}>
                        {getStatusLabel(selectedTask.status)}
                      </span>
                                            <span className="text-xs text-gray-500">Subtarefas: {selectedTask.subTasks?.length || 0}</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedTask(null);
                                            setFormData((prev) => ({ ...prev, totalAmount: '' }));
                                            setShowTaskModal(true);
                                        }}
                                        className="ml-2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowTaskModal(true)}
                                className="w-full px-4 py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                            >
                                <Search className="w-4 h-4 mx-auto mb-1" />
                                Clique para selecionar uma tarefa
                            </button>
                        )}
                    </div>

                    {/* Detalhes da Tarefa Selecionada */}
                    {selectedTask && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-blue-900">Detalhes da Tarefa</h4>
                                <button
                                    type="button"
                                    onClick={handleRecalculate}
                                    className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                                >
                                    <Calculator className="w-4 h-4 mr-1" />
                                    Recalcular
                                </button>
                            </div>
                            <div className="space-y-1 text-sm text-blue-800">
                                <div>
                                    <strong>Código:</strong> {selectedTask.code}
                                </div>
                                <div>
                                    <strong>Título:</strong> {selectedTask.title}
                                </div>
                                {selectedTask.description && (
                                    <div>
                                        <strong>Descrição:</strong> {selectedTask.description}
                                    </div>
                                )}
                                <div>
                                    <strong>Subtarefas:</strong> {selectedTask.subTasks?.length || 0}
                                </div>
                                <div className="flex items-center">
                                    <Calculator className="w-4 h-4 mr-1" />
                                    <strong>Total Calculado:</strong> {formatCurrency(calculateTaskTotal(selectedTask))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status */}
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                            Status *
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="DRAFT">Rascunho</option>
                            <option value="PENDING">Pendente</option>
                            <option value="APPROVED">Aprovado</option>
                            <option value="REJECTED">Rejeitado</option>
                        </select>
                    </div>

                    {/* Valor Total */}
                    <div>
                        <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-2">
                            Valor Total *
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">R$</span>
                            <input
                                type="number"
                                id="totalAmount"
                                name="totalAmount"
                                value={formData.totalAmount}
                                onChange={handleInputChange}
                                step="0.01"
                                min="0.01"
                                required
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0,00"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Valor calculado automaticamente com base nas subtarefas, mas pode ser editado</p>
                    </div>

                    {/* Botões */}
                    <div className="flex space-x-3 pt-6">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={loading}
                            className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={loading || !selectedTask}
                            className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Salvando...
                                </>
                            ) : (
                                'Salvar Alterações'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal de Seleção de Tarefa (igual ao Create) */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Selecionar Tarefa</h2>
                                <p className="text-sm text-gray-600 mt-1">Escolha uma tarefa para editar o orçamento</p>
                            </div>
                            <button onClick={() => setShowTaskModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

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
