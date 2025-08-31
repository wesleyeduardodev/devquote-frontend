import React, { useState, useCallback, useEffect } from 'react';
import { X, Link2, Search, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { taskService } from '@/services/taskService';
import billingPeriodService from '@/services/billingPeriodService';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Task {
    id: number;
    code: string;
    title: string;
    description?: string;
    status: string;
    amount: number;
    requesterName: string;
    createdAt: string;
}

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalElements: number;
}

interface BillingPeriod {
    id: number;
    month: number;
    year: number;
    status: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    billingPeriod: BillingPeriod | null;
    onTasksLinked: () => void;
}

const LinkTasksToBillingModal: React.FC<Props> = ({
    isOpen,
    onClose,
    billingPeriod,
    onTasksLinked
}) => {
    // Estados da tabela
    const [tasks, setTasks] = useState<Task[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(5);
    const [sorting, setSorting] = useState([{ field: 'id', direction: 'desc' as const }]);
    const [filters, setFilters] = useState<Record<string, string>>({});
    
    // Estados da operação
    const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
    const [linking, setLinking] = useState(false);

    const monthNames = [
        '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    // Carregar tarefas disponíveis (sem vínculo)
    const loadAvailableTasks = useCallback(async () => {
        if (!billingPeriod?.id) return;
        
        setLoading(true);
        try {
            const response = await taskService.getUnlinkedPaginated({
                page: currentPage,
                size: pageSize,
                sort: sorting,
                filters: filters
            });

            setTasks(response.content || []);
            setPagination({
                currentPage: response.currentPage || 0,
                totalPages: response.totalPages || 0,
                pageSize: response.pageSize || 10,
                totalElements: response.totalElements || 0
            });
        } catch (error: any) {
            console.error('Erro ao carregar tarefas disponíveis:', error);
            toast.error('Erro ao carregar tarefas disponíveis');
            setTasks([]);
        } finally {
            setLoading(false);
        }
    }, [billingPeriod?.id, currentPage, pageSize, sorting, filters]);

    // Vincular tarefas selecionadas
    const handleLinkTasks = useCallback(async () => {
        if (!billingPeriod?.id || selectedTasks.length === 0) return;

        setLinking(true);
        try {
            const requests = selectedTasks.map(taskId => ({
                billingPeriodId: billingPeriod.id,
                taskId: taskId
            }));

            await billingPeriodService.bulkLinkTasks(requests);
            toast.success(`${selectedTasks.length} tarefa(s) vinculada(s) com sucesso!`);
            
            setSelectedTasks([]);
            onTasksLinked(); // Callback para recarregar dados do pai
            onClose();
        } catch (error: any) {
            console.error('Erro ao vincular tarefas:', error);
            if (error.response?.status === 409) {
                toast.error('Uma ou mais tarefas já estão vinculadas a outro período');
            } else {
                toast.error('Erro ao vincular tarefas');
            }
        } finally {
            setLinking(false);
        }
    }, [billingPeriod?.id, selectedTasks, onTasksLinked, onClose]);

    // Carregar dados quando o modal abrir
    useEffect(() => {
        if (isOpen && billingPeriod) {
            setSelectedTasks([]);
            loadAvailableTasks();
        }
    }, [isOpen, billingPeriod, loadAvailableTasks]);

    // Reset página quando pageSize mudar
    useEffect(() => {
        setCurrentPage(0);
    }, [pageSize]);

    // Colunas da tabela
    const columns = [
        {
            key: 'selection',
            header: (
                <input
                    type="checkbox"
                    checked={selectedTasks.length === tasks.length && tasks.length > 0}
                    ref={(input) => {
                        if (input) {
                            input.indeterminate = selectedTasks.length > 0 && selectedTasks.length < tasks.length;
                        }
                    }}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedTasks(tasks.map(task => task.id));
                        } else {
                            setSelectedTasks([]);
                        }
                    }}
                    className="rounded border-gray-300"
                />
            ),
            render: (task: Task) => (
                <input
                    type="checkbox"
                    checked={selectedTasks.includes(task.id)}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedTasks(prev => [...prev, task.id]);
                        } else {
                            setSelectedTasks(prev => prev.filter(id => id !== task.id));
                        }
                    }}
                    className="rounded border-gray-300"
                />
            )
        },
        {
            key: 'id',
            header: 'ID',
            sortable: true,
            filterable: true,
            render: (task: Task) => (
                <span className="font-mono text-xs text-gray-500">#{task.id}</span>
            )
        },
        {
            key: 'code',
            header: 'Código',
            sortable: true,
            filterable: true,
            render: (task: Task) => (
                <span className="font-mono text-sm">{task.code}</span>
            )
        },
        {
            key: 'title',
            header: 'Título',
            sortable: true,
            filterable: true,
            render: (task: Task) => (
                <span className="font-medium">{task.title}</span>
            )
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            filterable: true,
            render: (task: Task) => {
                const statusColors = {
                    PENDING: 'bg-yellow-100 text-yellow-800',
                    IN_PROGRESS: 'bg-blue-100 text-blue-800',
                    COMPLETED: 'bg-green-100 text-green-800',
                    CANCELLED: 'bg-red-100 text-red-800'
                };
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                        {task.status}
                    </span>
                );
            }
        },
        {
            key: 'amount',
            header: 'Valor',
            sortable: true,
            render: (task: Task) => (
                <span className="font-semibold text-green-600">
                    R$ {task.amount?.toFixed(2) || '0,00'}
                </span>
            )
        },
        {
            key: 'requesterName',
            header: 'Solicitante',
            sortable: true,
            filterable: true,
            render: (task: Task) => (
                <span className="text-gray-600">{task.requesterName || '-'}</span>
            )
        }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[75vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Vincular Tarefas ao Período
                            </h2>
                            {billingPeriod && (
                                <p className="text-sm text-gray-600 mt-1">
                                    {monthNames[billingPeriod.month]} de {billingPeriod.year} - Tarefas disponíveis (sem vínculo)
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden min-h-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : (
                        <div className="h-full p-6 overflow-auto">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            {columns.map((column) => (
                                                <th
                                                    key={column.key}
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {typeof column.header === 'string' ? column.header : column.header}
                                                        {column.sortable && (
                                                            <button
                                                                onClick={() => {
                                                                    const currentSort = sorting.find(s => s.field === column.key);
                                                                    const newDirection = currentSort?.direction === 'asc' ? 'desc' : 'asc';
                                                                    setSorting([{ field: column.key, direction: newDirection }]);
                                                                }}
                                                                className="text-gray-400 hover:text-gray-600"
                                                            >
                                                                {sorting.find(s => s.field === column.key)?.direction === 'asc' ? '↑' : '↓'}
                                                            </button>
                                                        )}
                                                    </div>
                                                    {column.filterable && (
                                                        <div className="mt-1">
                                                            <input
                                                                type="text"
                                                                placeholder="Filtrar..."
                                                                value={filters[column.key] || ''}
                                                                onChange={(e) => setFilters(prev => ({ ...prev, [column.key]: e.target.value }))}
                                                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                        </div>
                                                    )}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {tasks.length === 0 ? (
                                            <tr>
                                                <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                                                    {loading ? "Carregando..." : "Nenhuma tarefa disponível para vinculação"}
                                                </td>
                                            </tr>
                                        ) : (
                                            tasks.map((task) => (
                                                <tr key={task.id} className="hover:bg-gray-50">
                                                    {columns.map((column) => (
                                                        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {column.render(task)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Paginação padrão */}
                            {pagination && pagination.totalPages > 0 && (
                                <div className="bg-white px-4 py-3 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="text-sm text-gray-700">
                                                Mostrando {currentPage * pageSize + 1} a {Math.min((currentPage + 1) * pageSize, pagination.totalElements)} de {pagination.totalElements} resultados
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-700">Itens por página:</span>
                                                <select
                                                    value={pageSize}
                                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    {[5, 10, 25, 50].map(size => (
                                                        <option key={size} value={size}>{size}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setCurrentPage(0)}
                                                disabled={currentPage === 0}
                                                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                ««
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                                disabled={currentPage === 0}
                                                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                ‹
                                            </button>
                                            <span className="text-sm text-gray-600 px-2">
                                                Página {currentPage + 1} de {pagination.totalPages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(Math.min(pagination.totalPages - 1, currentPage + 1))}
                                                disabled={currentPage >= pagination.totalPages - 1}
                                                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                ›
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(pagination.totalPages - 1)}
                                                disabled={currentPage >= pagination.totalPages - 1}
                                                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                »»
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            <span>Total: {tasks.length} tarefa(s)</span>
                            {selectedTasks.length > 0 && (
                                <span className="ml-4 font-medium text-blue-600">
                                    {selectedTasks.length} selecionada(s) - 
                                    Valor: R$ {
                                        tasks
                                            .filter(task => selectedTasks.includes(task.id))
                                            .reduce((sum, task) => sum + (task.amount || 0), 0)
                                            .toFixed(2)
                                    }
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={onClose}
                                variant="secondary"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleLinkTasks}
                                disabled={linking || selectedTasks.length === 0}
                                className={`${selectedTasks.length > 0 
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {linking ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Vinculando...
                                    </>
                                ) : (
                                    <>
                                        <Link2 className="w-4 h-4 mr-2" />
                                        Vincular {selectedTasks.length > 0 ? `${selectedTasks.length} Tarefa(s)` : 'Tarefas'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LinkTasksToBillingModal;