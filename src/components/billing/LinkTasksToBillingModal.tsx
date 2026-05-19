import React, { useState, useCallback, useEffect } from 'react';
import { X, Link2, Search, Loader2, ExternalLink } from 'lucide-react';
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
    link: string;
    description?: string;
    status: string;
    amount: number;
    requesterName: string;
    flowType: string;
    taskType?: string;
    environment?: string;
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
    flowType?: string;
}

const LinkTasksToBillingModal: React.FC<Props> = ({
    isOpen,
    onClose,
    billingPeriod,
    onTasksLinked,
    flowType
}) => {

    const [tasks, setTasks] = useState<Task[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(5);
    const [sorting, setSorting] = useState([{ field: 'id', direction: 'desc' as const }]);
    const [filters, setFilters] = useState<Record<string, string>>({});

    const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
    const [linking, setLinking] = useState(false);

    const monthNames = [
        '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];


    const loadAvailableTasks = useCallback(async () => {
        if (!billingPeriod?.id) return;
        
        setLoading(true);
        try {
            const allFilters = { ...filters };
            if (flowType && flowType !== 'TODOS' && flowType !== '') {
                allFilters.flowType = flowType;
            }

            const response = await taskService.getUnlinkedPaginated({
                page: currentPage,
                size: pageSize,
                sort: sorting,
                filters: allFilters
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
    }, [billingPeriod?.id, currentPage, pageSize, sorting, filters, flowType]);

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
            onTasksLinked();
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

    useEffect(() => {
        if (isOpen && billingPeriod) {
            setSelectedTasks([]);
            loadAvailableTasks();
        }
    }, [isOpen, billingPeriod, loadAvailableTasks]);

    useEffect(() => {
        setCurrentPage(0);
    }, [pageSize]);

    const formatTaskType = (taskType?: string): string => {
        if (!taskType) return '-';
        const types: Record<string, string> = {
            'BUG': 'Bug',
            'ENHANCEMENT': 'Melhoria',
            'NEW_FEATURE': 'Nova Funcionalidade',
            'BACKUP': 'Backup',
            'DEPLOY': 'Deploy',
            'LOGS': 'Logs',
            'NEW_SERVER': 'Novo Servidor',
            'DATABASE_APPLICATION': 'Aplicação de Banco',
            'MONITORING': 'Monitoramento',
            'SUPPORT': 'Suporte',
            'CODE_REVIEW': 'Code Review'
        };
        return types[taskType] || taskType;
    };

    const formatEnvironment = (environment?: string): string => {
        if (!environment) return '-';
        const envs: Record<string, string> = {
            'DESENVOLVIMENTO': 'Desenvolvimento',
            'HOMOLOGACAO': 'Homologação',
            'PRODUCAO': 'Produção'
        };
        return envs[environment] || environment;
    };

    const columns = [
        {
            key: 'selection',
            width: '40px',
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
                    className="rounded border-border-strong"
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
                    className="rounded border-border-strong"
                />
            )
        },
        {
            key: 'id',
            header: 'ID',
            sortable: true,
            filterable: true,
            width: '60px',
            align: 'center',
            render: (task: Task) => (
                <span className="font-mono text-xs text-text-tertiary">#{task.id}</span>
            )
        },
        {
            key: 'code',
            header: 'Código',
            sortable: true,
            filterable: true,
            width: '100px',
            align: 'left',
            render: (task: Task) => (
                task.link ?
                <div className="flex items-center gap-2">
                    <a
                        href={task.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent bg-surface-2 rounded px-2 py-1 hover:text-info-strong flex items-center gap-1 max-w-xs truncate"
                        onClick={(e) => e.stopPropagation()}
                        title={task.link}
                    >
                        <span className="truncate">{task.code}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                </div>
                :
                <span className="font-mono text-xs bg-surface-2 px-2 py-1 rounded">{task.code || '-'}</span>
            )
        },
        {
            key: 'flowType',
            header: 'Fluxo',
            sortable: true,
            filterable: true,
            width: '130px',
            render: (task: Task) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    task.flowType === 'DESENVOLVIMENTO'
                        ? 'bg-accent-soft text-info-strong'
                        : 'bg-purple-100 text-purple-800'
                }`}>
                    {task.flowType === 'DESENVOLVIMENTO' ? 'Desenvolvimento' : 'Operacional'}
                </span>
            )
        },
        {
            key: 'taskType',
            header: 'Tipo',
            sortable: true,
            filterable: true,
            width: '150px',
            render: (task: Task) => (
                <span className="text-xs text-text-secondary">
                    {formatTaskType(task.taskType)}
                </span>
            )
        },
        {
            key: 'environment',
            header: 'Ambiente',
            sortable: true,
            filterable: true,
            width: '130px',
            render: (task: Task) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    task.environment === 'PRODUCAO'
                        ? 'bg-accent-soft text-info-strong'
                        : task.environment === 'HOMOLOGACAO'
                            ? 'bg-yellow-100 text-yellow-800'
                            : task.environment === 'DESENVOLVIMENTO'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-surface-2 text-text-secondary'
                }`}>
                    {formatEnvironment(task.environment)}
                </span>
            )
        },
        {
            key: 'title',
            header: 'Título',
            sortable: true,
            filterable: true,
            width: '300px',
            render: (task: Task) => (
                <span
                    className="font-medium block truncate cursor-help"
                    title={task.title}
                >
                    {task.title}
                </span>
            )
        },
        {
            key: 'amount',
            header: 'Valor',
            sortable: true,
            width: '100px',
            render: (task: Task) => (
                <span className="font-semibold text-green-600 text-sm">
                    R$ {task.amount?.toFixed(2) || '0,00'}
                </span>
            )
        }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-surface-1 rounded-xl shadow-2xl w-full max-w-7xl h-[75vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border-subtle bg-gradient-to-r from-blue-50 to-green-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary">
                                Vincular Tarefas ao Período
                            </h2>
                            {billingPeriod && (
                                <p className="text-sm text-text-secondary mt-1">
                                    {monthNames[billingPeriod.month]} de {billingPeriod.year} - Tarefas disponíveis (sem vínculo)
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-text-tertiary hover:text-text-secondary transition-colors"
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
                            {/* Desktop: Tabela */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-surface-app sticky top-0">
                                        <tr>
                                            {columns.map((column) => (
                                                <th
                                                    key={column.key}
                                                    className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider"
                                                    style={column.width ? { width: column.width, minWidth: column.width, maxWidth: column.width } : undefined}
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
                                                                className="text-text-tertiary hover:text-text-secondary"
                                                            >
                                                                {sorting.find(s => s.field === column.key)?.direction === 'asc' ? '↑' : '↓'}
                                                            </button>
                                                        )}
                                                    </div>
                                                    {column.filterable && (
                                                        <div className="mt-1">
                                                            <input
                                                                type="text"
                                                                placeholder={column.key === 'id' ? 'Fi' : 'Filtrar...'}
                                                                value={filters[column.key] || ''}
                                                                onChange={(e) => setFilters(prev => ({ ...prev, [column.key]: e.target.value }))}
                                                                className="w-full px-2 py-1 text-xs border border-border-strong rounded focus:ring-1 focus:ring-accent focus:border-accent"
                                                            />
                                                        </div>
                                                    )}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-surface-1 divide-y divide-gray-200">
                                        {tasks.length === 0 ? (
                                            <tr>
                                                <td colSpan={columns.length} className="px-6 py-4 text-center text-text-tertiary">
                                                    {loading ? "Carregando..." : "Nenhuma tarefa disponível para vinculação"}
                                                </td>
                                            </tr>
                                        ) : (
                                            tasks.map((task) => (
                                                <tr key={task.id} className="hover:bg-surface-app">
                                                    {columns.map((column) => (
                                                        <td
                                                            key={column.key}
                                                            className="px-6 py-4 whitespace-nowrap text-sm text-text-primary"
                                                            style={column.width ? { width: column.width, minWidth: column.width, maxWidth: column.width } : undefined}
                                                        >
                                                            {column.render(task)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile: Cards */}
                            <div className="md:hidden space-y-3">
                                {/* Seleção múltipla Mobile */}
                                {tasks.length > 0 && (
                                    <div className="bg-info-soft rounded-lg p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
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
                                                className="w-4 h-4 text-accent border-border-strong rounded focus:ring-accent"
                                            />
                                            <span className="text-sm font-medium text-info-strong">
                                                {selectedTasks.length === 0 
                                                    ? 'Selecionar todas'
                                                    : selectedTasks.length === tasks.length 
                                                        ? 'Desselecionar todas'
                                                        : `${selectedTasks.length} de ${tasks.length} selecionadas`
                                                }
                                            </span>
                                        </div>
                                        {selectedTasks.length > 0 && (
                                            <span className="text-xs font-medium text-accent bg-accent-soft px-2 py-1 rounded">
                                                R$ {tasks
                                                    .filter(task => selectedTasks.includes(task.id))
                                                    .reduce((sum, task) => sum + (task.amount || 0), 0)
                                                    .toFixed(2)
                                                }
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Filtros Mobile */}
                                <div className="bg-surface-app rounded-lg p-3 space-y-3">
                                    <div className="text-sm font-medium text-text-secondary">Filtros</div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">ID</label>
                                            <input
                                                type="text"
                                                placeholder="Filtrar por ID..."
                                                value={filters['id'] || ''}
                                                onChange={(e) => setFilters(prev => ({ ...prev, id: e.target.value }))}
                                                className="w-full px-3 py-2 text-sm border border-border-strong rounded focus:ring-2 focus:ring-accent focus:border-accent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">Código</label>
                                            <input
                                                type="text"
                                                placeholder="Filtrar por código..."
                                                value={filters['code'] || ''}
                                                onChange={(e) => setFilters(prev => ({ ...prev, code: e.target.value }))}
                                                className="w-full px-3 py-2 text-sm border border-border-strong rounded focus:ring-2 focus:ring-accent focus:border-accent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">Fluxo</label>
                                            <select
                                                value={filters['flowType'] || ''}
                                                onChange={(e) => setFilters(prev => ({ ...prev, flowType: e.target.value }))}
                                                className="w-full px-3 py-2 text-sm border border-border-strong rounded focus:ring-2 focus:ring-accent focus:border-accent"
                                            >
                                                <option value="">Todos</option>
                                                <option value="DESENVOLVIMENTO">Desenvolvimento</option>
                                                <option value="OPERACIONAL">Operacional</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">Título</label>
                                            <input
                                                type="text"
                                                placeholder="Filtrar por título..."
                                                value={filters['title'] || ''}
                                                onChange={(e) => setFilters(prev => ({ ...prev, title: e.target.value }))}
                                                className="w-full px-3 py-2 text-sm border border-border-strong rounded focus:ring-2 focus:ring-accent focus:border-accent"
                                            />
                                        </div>
                                    </div>
                                    {Object.values(filters).some(filter => filter) && (
                                        <button
                                            onClick={() => setFilters({})}
                                            className="text-xs text-accent hover:text-info-strong font-medium"
                                        >
                                            Limpar filtros
                                        </button>
                                    )}
                                </div>

                                {tasks.length === 0 ? (
                                    <div className="text-center py-8 text-text-tertiary">
                                        {loading ? "Carregando..." : "Nenhuma tarefa disponível para vinculação"}
                                    </div>
                                ) : (
                                    tasks.map((task) => (
                                        <div key={task.id} className="bg-surface-1 border border-border-subtle rounded-lg p-4 hover:shadow-md transition-shadow">
                                            {/* Header do card com checkbox e ID */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-start gap-3">
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
                                                        className="mt-1 w-4 h-4 text-accent border-border-strong rounded focus:ring-accent"
                                                    />
                                                    <div>
                                                        <div className="font-semibold text-text-primary text-base">{task.title}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-accent-soft text-info-strong">
                                                                #{task.id}
                                                            </span>
                                                            <span className="text-sm font-mono text-text-secondary">{task.code}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Informações da tarefa */}
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-text-secondary">Fluxo:</span>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        task.flowType === 'DESENVOLVIMENTO'
                                                            ? 'bg-accent-soft text-info-strong'
                                                            : 'bg-purple-100 text-purple-800'
                                                    }`}>
                                                        {task.flowType === 'DESENVOLVIMENTO' ? 'Desenvolvimento' : 'Operacional'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-text-secondary">Tipo:</span>
                                                    <span className="text-text-primary text-xs font-medium">
                                                        {formatTaskType(task.taskType)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-text-secondary">Ambiente:</span>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                        task.environment === 'PRODUCAO'
                                                            ? 'bg-accent-soft text-info-strong'
                                                            : task.environment === 'HOMOLOGACAO'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : task.environment === 'DESENVOLVIMENTO'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-surface-2 text-text-secondary'
                                                    }`}>
                                                        {formatEnvironment(task.environment)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-text-secondary">Valor:</span>
                                                    <span className="font-semibold text-green-600">
                                                        R$ {task.amount?.toFixed(2) || '0,00'}
                                                    </span>
                                                </div>
                                                {task.description && (
                                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                                        <span className="text-text-secondary text-xs">Descrição:</span>
                                                        <p className="text-text-primary text-sm mt-1 line-clamp-2">{task.description}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            {/* Paginação padrão */}
                            {pagination && pagination.totalPages > 0 && (
                                <div className="bg-surface-1 px-4 py-3 border-t border-border-subtle">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="text-sm text-text-secondary">
                                                Mostrando {currentPage * pageSize + 1} a {Math.min((currentPage + 1) * pageSize, pagination.totalElements)} de {pagination.totalElements} resultados
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-text-secondary">Itens por página:</span>
                                                <select
                                                    value={pageSize}
                                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                                    className="border border-border-strong rounded px-2 py-1 text-sm focus:ring-2 focus:ring-accent focus:border-accent"
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
                                                className="px-2 py-1 text-sm border border-border-strong rounded hover:bg-surface-app disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                ««
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                                disabled={currentPage === 0}
                                                className="px-2 py-1 text-sm border border-border-strong rounded hover:bg-surface-app disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                ‹
                                            </button>
                                            <span className="text-sm text-text-secondary px-2">
                                                Página {currentPage + 1} de {pagination.totalPages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(Math.min(pagination.totalPages - 1, currentPage + 1))}
                                                disabled={currentPage >= pagination.totalPages - 1}
                                                className="px-2 py-1 text-sm border border-border-strong rounded hover:bg-surface-app disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                ›
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(pagination.totalPages - 1)}
                                                disabled={currentPage >= pagination.totalPages - 1}
                                                className="px-2 py-1 text-sm border border-border-strong rounded hover:bg-surface-app disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="shrink-0 px-6 py-4 border-t border-border-subtle bg-surface-app">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-text-secondary">
                            <span>Total: {tasks.length} tarefa(s)</span>
                            {selectedTasks.length > 0 && (
                                <span className="ml-4 font-medium text-accent">
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
                                    ? 'bg-accent hover:bg-accent-hover text-white' 
                                    : 'bg-gray-300 text-text-tertiary cursor-not-allowed'
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