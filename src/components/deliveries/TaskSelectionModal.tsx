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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Selecionar Tarefa para Entrega
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            title="Fechar (ESC)"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto" style={{ height: 'calc(85vh - 120px)' }}>
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
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600 text-center">
                        {paginationData?.totalElements || 0} tarefa{(paginationData?.totalElements || 0) !== 1 ? 's' : ''} disponível{(paginationData?.totalElements || 0) !== 1 ? 'eis' : ''}
                    </p>
                </div>
            </div>
        </div>
    );
}