import React, { useState, useCallback, useEffect } from 'react';
import { X, Eye } from 'lucide-react';
import billingPeriodService from '@/services/billingPeriodService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Task {
    id: number;
    code: string;
    title: string;
    description?: string;
    amount: number;
    requesterName: string;
    createdAt: string;
}

interface BillingPeriodTask {
    id: number;
    task: Task;
    billingPeriodId: number;
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
    flowType?: string;
    isOpen: boolean;
    onClose: () => void;
    billingPeriod: BillingPeriod | null;
}

const ViewTasksModal: React.FC<Props> = ({
    isOpen,
    onClose,
    billingPeriod
}) => {
    // Estados da tabela
    const [linkedTasks, setLinkedTasks] = useState<BillingPeriodTask[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<BillingPeriodTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<string>('task.id');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [filters, setFilters] = useState<Record<string, string>>({});
    
    // Estados para paginação
    const [pagination, setPagination] = useState<{
        currentPage: number;
        totalPages: number; 
        pageSize: number;
        totalElements: number;
    } | null>(null);

    const monthNames = [
        '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const loadLinkedTasks = useCallback(async () => {
        if (!billingPeriod?.id) return;

        setLoading(true);
        try {
            const response = await billingPeriodService.findTaskLinksByBillingPeriod(billingPeriod.id);
            // Ordenar por ID da tarefa em ordem decrescente
            const sortedResponse = response.sort((a, b) => (b?.task?.id || 0) - (a?.task?.id || 0));
            setLinkedTasks(sortedResponse);
        } catch (error: any) {
            console.error('Erro ao carregar tarefas vinculadas:', error);
            setLinkedTasks([]);
        } finally {
            setLoading(false);
        }
    }, [billingPeriod?.id]);

    useEffect(() => {
        if (isOpen && billingPeriod) {
            loadLinkedTasks();
        }
    }, [isOpen, billingPeriod, loadLinkedTasks]);

    // Reset página quando pageSize mudar
    useEffect(() => {
        setCurrentPage(0);
    }, [pageSize]);

    // Filtrar e ordenar tarefas
    useEffect(() => {
        let filtered = [...linkedTasks];

        // Aplicar filtros
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                filtered = filtered.filter(link => {
                    const task = link?.task;
                    if (!task) return false;
                    
                    switch (key) {
                        case 'task.id':
                            return task.id.toString().includes(value);
                        case 'task.code':
                            return task.code?.toLowerCase().includes(value.toLowerCase()) || false;
                        case 'task.title':
                            return task.title?.toLowerCase().includes(value.toLowerCase()) || false;
                        case 'task.requesterName':
                            return task.requesterName?.toLowerCase().includes(value.toLowerCase()) || false;
                        default:
                            return true;
                    }
                });
            }
        });

        // Ordenar
        filtered.sort((a, b) => {
            const aValue = getNestedValue(a, sortField);
            const bValue = getNestedValue(b, sortField);
            
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }
            
            const aStr = String(aValue || '').toLowerCase();
            const bStr = String(bValue || '').toLowerCase();
            
            if (sortDirection === 'asc') {
                return aStr.localeCompare(bStr);
            } else {
                return bStr.localeCompare(aStr);
            }
        });

        // Calcular paginação
        const totalElements = filtered.length;
        const totalPages = Math.ceil(totalElements / pageSize);
        
        setPagination({
            currentPage,
            totalPages,
            pageSize,
            totalElements
        });
        
        // Aplicar paginação
        const startIndex = currentPage * pageSize;
        const endIndex = startIndex + pageSize;
        setFilteredTasks(filtered.slice(startIndex, endIndex));
        
    }, [linkedTasks, filters, sortField, sortDirection, currentPage, pageSize]);

    // Função auxiliar para acessar propriedades aninhadas
    const getNestedValue = (obj: any, path: string): any => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    };

    // Definir colunas da tabela
    const columns = [
        {
            key: 'task.id',
            header: 'ID',
            sortable: true,
            filterable: true,
            render: (link: BillingPeriodTask) => (
                <span className="font-mono text-xs text-gray-500">#{link?.task?.id}</span>
            )
        },
        {
            key: 'task.code',
            header: 'Código',
            sortable: true,
            filterable: true,
            render: (link: BillingPeriodTask) => (
                <span className="font-mono text-sm">{link?.task?.code}</span>
            )
        },
        {
            key: 'task.title',
            header: 'Título',
            sortable: true,
            filterable: true,
            render: (link: BillingPeriodTask) => (
                <span className="font-medium">{link?.task?.title}</span>
            )
        },
        {
            key: 'task.amount',
            header: 'Valor',
            sortable: true,
            render: (link: BillingPeriodTask) => (
                <span className="font-semibold text-green-600">
                    R$ {link?.task?.amount?.toFixed(2) || '0,00'}
                </span>
            )
        },
        {
            key: 'task.requesterName',
            header: 'Solicitante',
            sortable: true,
            filterable: true,
            render: (link: BillingPeriodTask) => (
                <span className="text-gray-600">{link?.task?.requesterName || '-'}</span>
            )
        }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[75vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Eye className="w-5 h-5" />
                                Visualizar Tarefas do Período
                            </h2>
                            {billingPeriod && (
                                <p className="text-sm text-gray-600 mt-1">
                                    {monthNames[billingPeriod.month]} de {billingPeriod.year} - Tarefas vinculadas
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
                            {/* Desktop: Tabela */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            {columns.map((column) => (
                                                <th
                                                    key={column.key}
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {column.header}
                                                        {column.sortable && (
                                                            <button
                                                                onClick={() => {
                                                                    if (sortField === column.key) {
                                                                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                                                    } else {
                                                                        setSortField(column.key);
                                                                        setSortDirection('asc');
                                                                    }
                                                                }}
                                                                className="text-gray-400 hover:text-gray-600"
                                                            >
                                                                {sortField === column.key && sortDirection === 'asc' ? '↑' : '↓'}
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
                                        {filteredTasks.length === 0 ? (
                                            <tr>
                                                <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                                                    {loading ? "Carregando..." : "Nenhuma tarefa vinculada encontrada"}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTasks.map((link, index) => (
                                                <tr key={link?.task?.id || index} className="hover:bg-gray-50">
                                                    {columns.map((column) => (
                                                        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {column.render(link)}
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
                                {/* Filtros Mobile */}
                                <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                                    <div className="text-sm font-medium text-gray-700">Filtros</div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">ID</label>
                                            <input
                                                type="text"
                                                placeholder="Filtrar por ID..."
                                                value={filters['task.id'] || ''}
                                                onChange={(e) => setFilters(prev => ({ ...prev, 'task.id': e.target.value }))}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Código</label>
                                            <input
                                                type="text"
                                                placeholder="Filtrar por código..."
                                                value={filters['task.code'] || ''}
                                                onChange={(e) => setFilters(prev => ({ ...prev, 'task.code': e.target.value }))}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Título</label>
                                            <input
                                                type="text"
                                                placeholder="Filtrar por título..."
                                                value={filters['task.title'] || ''}
                                                onChange={(e) => setFilters(prev => ({ ...prev, 'task.title': e.target.value }))}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Solicitante</label>
                                            <input
                                                type="text"
                                                placeholder="Filtrar por solicitante..."
                                                value={filters['task.requesterName'] || ''}
                                                onChange={(e) => setFilters(prev => ({ ...prev, 'task.requesterName': e.target.value }))}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                    {Object.values(filters).some(filter => filter) && (
                                        <button
                                            onClick={() => setFilters({})}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Limpar filtros
                                        </button>
                                    )}
                                </div>

                                {filteredTasks.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        {loading ? "Carregando..." : "Nenhuma tarefa vinculada encontrada"}
                                    </div>
                                ) : (
                                    filteredTasks.map((link, index) => (
                                        <div key={link?.task?.id || index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                            {/* Header do card com ID */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="font-semibold text-gray-900 text-base">{link?.task?.title || '-'}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                            #{link?.task?.id}
                                                        </span>
                                                        <span className="text-sm font-mono text-gray-600">{link?.task?.code}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Informações da tarefa */}
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Valor:</span>
                                                    <span className="font-semibold text-green-600">
                                                        R$ {link?.task?.amount?.toFixed(2) || '0,00'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Solicitante:</span>
                                                    <span className="text-gray-900">{link?.task?.requesterName || '-'}</span>
                                                </div>
                                                {link?.task?.description && (
                                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                                        <span className="text-gray-600 text-xs">Descrição:</span>
                                                        <p className="text-gray-800 text-sm mt-1 line-clamp-2">{link.task.description}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
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
                            <span>Total: {pagination?.totalElements || 0} tarefa(s)</span>
                            {filteredTasks.length > 0 && (
                                <span className="ml-4 font-medium text-green-600">
                                    Valor da página: R$ {filteredTasks
                                        .reduce((sum, link) => sum + (link?.task?.amount || 0), 0)
                                        .toFixed(2)
                                    }
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewTasksModal;