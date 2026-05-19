import React, { useState, useEffect, useRef } from 'react';
import { Package, X } from 'lucide-react';
import { AvailableTask } from '../../types/delivery.types';
import { deliveryService } from '../../services/deliveryService';
import DataTable, { Column } from '../ui/DataTable';
import LoadingSpinner from '../ui/LoadingSpinner';

interface TaskSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskSelect: (task: AvailableTask) => void;
}

export default function TaskSelectionModal({
    isOpen,
    onClose,
    onTaskSelect
}: TaskSelectionModalProps) {
    const [tasks, setTasks] = useState<AvailableTask[]>([]);
    const [paginationData, setPaginationData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(5);
    const [sorting, setSorting] = useState([{ field: 'createdAt', direction: 'desc' as const }]);
    const [filters, setFilters] = useState<Record<string, string>>({});

    const fetchAvailableTasks = async () => {
        setIsLoading(true);
        try {

            const searchFilters: Record<string, string> = {};
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value.toString().trim() !== '') {
                    searchFilters[key] = value.toString();
                }
            });

            const response = await deliveryService.getAvailableTasksPaginated({
                page,
                size,
                sort: sorting,
                filters: searchFilters
            });

            setTasks(response.content || []);
            setPaginationData(response);
        } catch (error) {
            console.error('Erro ao buscar tarefas disponíveis:', error);
            setTasks([]);
            setPaginationData(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        const isImmediateChange = Object.keys(filters).length === 0;
        
        if (isImmediateChange) {
            fetchAvailableTasks();
        } else {

            debounceTimerRef.current = setTimeout(() => {
                fetchAvailableTasks();
            }, 800);
        }

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [isOpen, page, size, sorting, filters]);

    useEffect(() => {
        if (isOpen) {
            setPage(0);
            setFilters({});
            setSorting([{ field: 'createdAt', direction: 'desc' }]);

            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
        }
    }, [isOpen]);

    const handleRowClick = (task: AvailableTask) => {
        onTaskSelect(task);
        onClose();
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);


    const formatTaskType = (taskType?: string, flowType?: string): string => {
        if (!taskType) return '-';

        // Tipos de Desenvolvimento
        if (flowType === 'DESENVOLVIMENTO') {
            const devTypes: Record<string, string> = {
                'BUG': '🐛 Bug',
                'ENHANCEMENT': '🔧 Melhoria',
                'NEW_FEATURE': '✨ Nova Funcionalidade'
            };
            return devTypes[taskType] || taskType;
        }

        // Tipos Operacionais
        const opTypes: Record<string, string> = {
            'BACKUP': '📦 Backup',
            'DEPLOY': '🚀 Deploy',
            'LOGS': '📄 Logs',
            'DATABASE_APPLICATION': '🗄️ Aplicação de Banco',
            'NEW_SERVER': '💻 Novo Servidor',
            'MONITORING': '📊 Monitoramento',
            'SUPPORT': '🛠️ Suporte'
        };
        return opTypes[taskType] || taskType;
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

    const columns: Column<AvailableTask>[] = [
        {
            key: 'code',
            title: 'Código',
            sortable: true,
            filterable: true,
            render: (task) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {task.code}
                </span>
            ),
            width: '120px'
        },
        {
            key: 'id',
            title: 'ID',
            sortable: true,
            filterable: true,
            render: (task) => (
                <span className="text-sm font-medium text-text-secondary">
                    #{task.id}
                </span>
            ),
            width: '80px'
        },
        {
            key: 'title',
            title: 'Título',
            sortable: true,
            filterable: true,
            render: (task) => (
                <div className="max-w-xs">
                    <div
                        className="font-medium text-text-primary truncate cursor-help"
                        title={task.title}
                    >
                        {task.title}
                    </div>
                </div>
            ),
            width: '250px'
        },
        {
            key: 'flowType',
            title: 'Fluxo',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '150px',
            align: 'center' as const,
            render: (task) => (
                task.flowType ? (
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                        task.flowType === 'OPERACIONAL'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-accent-soft text-info-strong border border-accent/20'
                    }`}>
                        {task.flowType === 'OPERACIONAL' ? '⚙️ Operacional' : '💻 Desenvolvimento'}
                    </span>
                ) : (
                    <span className="text-text-tertiary">-</span>
                )
            )
        },
        {
            key: 'taskType',
            title: 'Tipo',
            sortable: true,
            filterable: true,
            width: '200px',
            render: (task) => (
                <span className="text-xs text-text-secondary">
                    {formatTaskType(task.taskType, task.flowType)}
                </span>
            )
        },
        {
            key: 'environment',
            title: 'Ambiente',
            sortable: true,
            filterable: true,
            width: '140px',
            render: (task) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    task.environment === 'PRODUCAO'
                        ? 'bg-accent-soft text-info-strong'
                        : task.environment === 'DESENVOLVIMENTO'
                            ? 'bg-green-100 text-green-800'
                            : task.environment === 'HOMOLOGACAO'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-surface-2 text-text-secondary'
                }`}>
                    {formatEnvironment(task.environment)}
                </span>
            )
        },
        {
            key: 'selected',
            title: 'SELECIONAR',
            sortable: false,
            filterable: false,
            render: (task) => (
                <div className="flex items-center justify-center">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(task);
                        }}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-accent bg-info-soft rounded-lg hover:bg-accent-soft transition-colors"
                    >
                        ✓ Selecionar
                    </button>
                </div>
            ),
            width: '120px',
            align: 'center'
        }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-1 rounded-lg shadow-xl w-full max-w-full sm:max-w-7xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="px-4 sm:px-6 py-3 border-b border-border-subtle bg-surface-1 sticky top-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg sm:text-xl font-semibold text-text-primary truncate pr-2">
                                Selecionar Tarefa para Entrega
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-text-tertiary hover:text-text-secondary transition-colors p-1 flex-shrink-0"
                            title="Fechar (ESC)"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto max-h-[calc(90vh-120px)] sm:max-h-[calc(85vh-120px)]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <LoadingSpinner size="lg" />
                            <span className="ml-3 text-text-secondary">Carregando tarefas disponíveis...</span>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Package className="mx-auto h-12 w-12 text-text-tertiary" />
                                <h3 className="mt-2 text-sm font-medium text-text-primary">
                                    Nenhuma tarefa disponível
                                </h3>
                                <p className="mt-1 text-sm text-text-tertiary">
                                    Todas as tarefas já possuem entregas vinculadas
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Mobile: Cards Layout */}
                            <div className="block sm:hidden">
                                {/* Mobile Filters */}
                                <div className="px-4 py-3 border-b border-border-subtle bg-surface-app">
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                                Filtrar por ID:
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Digite o ID..."
                                                value={filters.id || ''}
                                                onChange={(e) => {
                                                    setFilters(prev => ({
                                                        ...prev,
                                                        id: e.target.value || undefined
                                                    }));
                                                    setPage(0);
                                                }}
                                                className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                                Filtrar por fluxo:
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Digite OPERACIONAL ou DESENVOLVIMENTO..."
                                                value={filters.flowType || ''}
                                                onChange={(e) => {
                                                    setFilters(prev => ({
                                                        ...prev,
                                                        flowType: e.target.value || undefined
                                                    }));
                                                    setPage(0);
                                                }}
                                                className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                                Filtrar por código:
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Digite o código..."
                                                value={filters.code || ''}
                                                onChange={(e) => {
                                                    setFilters(prev => ({
                                                        ...prev,
                                                        code: e.target.value || undefined
                                                    }));
                                                    setPage(0);
                                                }}
                                                className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                                Filtrar por título:
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Digite o título..."
                                                value={filters.title || ''}
                                                onChange={(e) => {
                                                    setFilters(prev => ({
                                                        ...prev,
                                                        title: e.target.value || undefined
                                                    }));
                                                    setPage(0);
                                                }}
                                                className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                                            />
                                        </div>
                                        {(filters.id || filters.flowType || filters.code || filters.title) && (
                                            <button
                                                onClick={() => {
                                                    setFilters({});
                                                    setPage(0);
                                                }}
                                                className="text-xs text-accent font-medium hover:text-info-strong"
                                            >
                                                Limpar filtros
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="px-4 space-y-3 py-4">
                                    {tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="bg-surface-1 border border-border-subtle rounded-lg p-4 shadow-sm"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                            {task.code}
                                                        </span>
                                                        <span className="text-sm font-medium text-text-secondary">
                                                            #{task.id}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-sm font-medium text-text-primary mb-2 leading-5">
                                                        {task.title}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                                        {task.flowType && (
                                                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                                                                task.flowType === 'OPERACIONAL'
                                                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                                    : 'bg-accent-soft text-info-strong border border-accent/20'
                                                            }`}>
                                                                {task.flowType === 'OPERACIONAL' ? '⚙️ Operacional' : '💻 Desenvolvimento'}
                                                            </span>
                                                        )}
                                                        {task.taskType && (
                                                            <span className="text-xs text-text-secondary bg-surface-2 px-2 py-1 rounded">
                                                                {formatTaskType(task.taskType, task.flowType)}
                                                            </span>
                                                        )}
                                                        {task.environment && (
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                                task.environment === 'PRODUCAO'
                                                                    ? 'bg-accent-soft text-info-strong'
                                                                    : task.environment === 'DESENVOLVIMENTO'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : task.environment === 'HOMOLOGACAO'
                                                                            ? 'bg-yellow-100 text-yellow-800'
                                                                            : 'bg-surface-2 text-text-secondary'
                                                            }`}>
                                                                {formatEnvironment(task.environment)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleRowClick(task)}
                                                        className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-hover transition-colors"
                                                    >
                                                        ✓ Selecionar Tarefa
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Mobile Pagination */}
                                {paginationData && paginationData.totalPages > 1 && (
                                    <div className="px-4 py-4 border-t border-border-subtle bg-surface-app">
                                        <div className="flex items-center justify-center space-x-1">
                                            {/* Primeira página */}
                                            <button
                                                onClick={() => setPage(0)}
                                                disabled={page === 0}
                                                className="px-2 py-2 text-sm font-medium text-text-tertiary bg-surface-1 border border-border-strong rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Primeira página"
                                            >
                                                ⇤
                                            </button>
                                            
                                            {/* Página anterior */}
                                            <button
                                                onClick={() => setPage(Math.max(0, page - 1))}
                                                disabled={page === 0}
                                                className="px-3 py-2 text-sm font-medium text-text-tertiary bg-surface-1 border border-border-strong rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                ‹
                                            </button>
                                            
                                            {/* Indicador de página atual */}
                                            <span className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-1 border border-border-strong rounded-md">
                                                {page + 1} de {paginationData.totalPages}
                                            </span>
                                            
                                            {/* Próxima página */}
                                            <button
                                                onClick={() => setPage(Math.min(paginationData.totalPages - 1, page + 1))}
                                                disabled={page >= paginationData.totalPages - 1}
                                                className="px-3 py-2 text-sm font-medium text-text-tertiary bg-surface-1 border border-border-strong rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                ›
                                            </button>
                                            
                                            {/* Última página */}
                                            <button
                                                onClick={() => setPage(paginationData.totalPages - 1)}
                                                disabled={page >= paginationData.totalPages - 1}
                                                className="px-2 py-2 text-sm font-medium text-text-tertiary bg-surface-1 border border-border-strong rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Última página"
                                            >
                                                ⇥
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Desktop: DataTable */}
                            <div className="hidden sm:block">
                                <DataTable
                                    data={tasks}
                                    columns={columns}
                                    loading={isLoading}
                                    showColumnToggle={false}

                                    pagination={paginationData ? {
                                        currentPage: page,
                                        pageSize: size,
                                        totalElements: paginationData.totalElements,
                                        totalPages: paginationData.totalPages
                                    } : null}
                                    onPageChange={setPage}
                                    onPageSizeChange={setSize}

                                    sorting={sorting}
                                    onSort={(field, direction) => {
                                        setSorting([{ field, direction }]);
                                        setPage(0);
                                    }}

                                    filters={filters}
                                    onFilter={(field, value) => {
                                        setFilters(prev => ({
                                            ...prev,
                                            [field]: value || undefined
                                        }));
                                        setPage(0);
                                    }}
                                    onClearFilters={() => {
                                        setFilters({});
                                        setPage(0);
                                    }}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 sm:px-6 py-2 border-t border-border-subtle bg-surface-1">
                    <p className="text-xs sm:text-sm text-text-secondary text-center">
                        {paginationData?.totalElements || 0} tarefa{(paginationData?.totalElements || 0) !== 1 ? 's' : ''} disponível{(paginationData?.totalElements || 0) !== 1 ? 'eis' : ''}
                    </p>
                </div>
            </div>
        </div>
    );
}