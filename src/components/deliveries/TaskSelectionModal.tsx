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

    // Ref para controlar o debounce
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Estados para DataTable
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(5);
    const [sorting, setSorting] = useState([{ field: 'createdAt', direction: 'desc' as const }]);
    const [filters, setFilters] = useState<Record<string, string>>({});

    // Buscar tarefas disponíveis com paginação
    const fetchAvailableTasks = async () => {
        setIsLoading(true);
        try {
            // Agora usando o endpoint com paginação da API - MESMA LÓGICA DO taskService
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

    // Carregar tarefas quando modal abre ou quando parâmetros mudam (COM DEBOUNCE)
    useEffect(() => {
        if (!isOpen) return;

        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Para page, size e sorting, executa imediatamente
        const isImmediateChange = Object.keys(filters).length === 0;
        
        if (isImmediateChange) {
            fetchAvailableTasks();
        } else {
            // Para filtros, usa debounce de 800ms
            debounceTimerRef.current = setTimeout(() => {
                fetchAvailableTasks();
            }, 800);
        }

        // Cleanup on unmount or when dependencies change
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [isOpen, page, size, sorting, filters]);

    // Reset quando modal abre (apenas uma vez)
    useEffect(() => {
        if (isOpen) {
            setPage(0);
            setFilters({});
            setSorting([{ field: 'createdAt', direction: 'desc' }]);
            
            // Limpa qualquer timer pendente
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
        }
    }, [isOpen]);

    // Handler de seleção - seleciona e fecha imediatamente
    const handleRowClick = (task: AvailableTask) => {
        onTaskSelect(task);
        onClose();
    };

    // Fechar com ESC
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


    // Definir colunas da tabela
    const columns: Column<AvailableTask>[] = [
        {
            key: 'id',
            title: 'ID',
            sortable: true,
            filterable: true,
            render: (task) => (
                <span className="text-sm font-medium text-gray-600">
                    #{task.id}
                </span>
            ),
            width: '100px'
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
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                        {task.flowType === 'OPERACIONAL' ? '⚙️ Operacional' : '💻 Desenvolvimento'}
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
                )
            )
        },
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
            key: 'title',
            title: 'Título',
            sortable: true,
            filterable: true,
            render: (task) => (
                <div className="max-w-sm">
                    <div 
                        className="font-medium text-gray-900 truncate cursor-help" 
                        title={task.title}
                    >
                        {task.title}
                    </div>
                </div>
            ),
            width: '300px'
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
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-full sm:max-w-4xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="px-4 sm:px-6 py-3 border-b border-gray-200 bg-white sticky top-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate pr-2">
                                Selecionar Tarefa para Entrega
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0"
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
                            <span className="ml-3 text-gray-600">Carregando tarefas disponíveis...</span>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Package className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    Nenhuma tarefa disponível
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Todas as tarefas já possuem entregas vinculadas
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Mobile: Cards Layout */}
                            <div className="block sm:hidden">
                                {/* Mobile Filters */}
                                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
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
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
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
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
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
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
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
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        {(filters.id || filters.flowType || filters.code || filters.title) && (
                                            <button
                                                onClick={() => {
                                                    setFilters({});
                                                    setPage(0);
                                                }}
                                                className="text-xs text-blue-600 font-medium hover:text-blue-800"
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
                                            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-sm font-medium text-gray-600">
                                                            #{task.id}
                                                        </span>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                            {task.code}
                                                        </span>
                                                    </div>
                                                    {task.flowType && (
                                                        <div className="mb-2">
                                                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                                                                task.flowType === 'OPERACIONAL'
                                                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                                            }`}>
                                                                {task.flowType === 'OPERACIONAL' ? '⚙️ Operacional' : '💻 Desenvolvimento'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <h3 className="text-sm font-medium text-gray-900 mb-3 leading-5">
                                                        {task.title}
                                                    </h3>
                                                    <button
                                                        onClick={() => handleRowClick(task)}
                                                        className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
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
                                    <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
                                        <div className="flex items-center justify-center space-x-1">
                                            {/* Primeira página */}
                                            <button
                                                onClick={() => setPage(0)}
                                                disabled={page === 0}
                                                className="px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Primeira página"
                                            >
                                                ⇤
                                            </button>
                                            
                                            {/* Página anterior */}
                                            <button
                                                onClick={() => setPage(Math.max(0, page - 1))}
                                                disabled={page === 0}
                                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                ‹
                                            </button>
                                            
                                            {/* Indicador de página atual */}
                                            <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
                                                {page + 1} de {paginationData.totalPages}
                                            </span>
                                            
                                            {/* Próxima página */}
                                            <button
                                                onClick={() => setPage(Math.min(paginationData.totalPages - 1, page + 1))}
                                                disabled={page >= paginationData.totalPages - 1}
                                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                ›
                                            </button>
                                            
                                            {/* Última página */}
                                            <button
                                                onClick={() => setPage(paginationData.totalPages - 1)}
                                                disabled={page >= paginationData.totalPages - 1}
                                                className="px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    
                                    // Paginação
                                    pagination={paginationData ? {
                                        currentPage: page,
                                        pageSize: size,
                                        totalElements: paginationData.totalElements,
                                        totalPages: paginationData.totalPages
                                    } : null}
                                    onPageChange={setPage}
                                    onPageSizeChange={setSize}
                                    
                                    // Ordenação
                                    sorting={sorting}
                                    onSort={(field, direction) => {
                                        setSorting([{ field, direction }]);
                                        setPage(0);
                                    }}
                                    
                                    // Filtros
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
                <div className="px-4 sm:px-6 py-2 border-t border-gray-200 bg-white">
                    <p className="text-xs sm:text-sm text-gray-600 text-center">
                        {paginationData?.totalElements || 0} tarefa{(paginationData?.totalElements || 0) !== 1 ? 's' : ''} disponível{(paginationData?.totalElements || 0) !== 1 ? 'eis' : ''}
                    </p>
                </div>
            </div>
        </div>
    );
}