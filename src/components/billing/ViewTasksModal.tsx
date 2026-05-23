import React, { useState, useCallback, useEffect } from 'react';
import { X, Eye, ExternalLink } from 'lucide-react';
import billingPeriodService from '@/services/billingPeriodService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Task {
    id: number;
    code: string;
    title: string;
    link: string;
    description?: string;
    amount: number;
    requesterName: string;
    flowType: string;
    taskType?: string;
    environment?: string;
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
    billingPeriod,
    flowType
}) => {

    const [linkedTasks, setLinkedTasks] = useState<BillingPeriodTask[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<BillingPeriodTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<string>('task.id');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [filters, setFilters] = useState<Record<string, string>>({});

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

            const filterFlowType = flowType && flowType !== 'TODOS' && flowType !== '' ? flowType : undefined;
            const response = await billingPeriodService.findTaskLinksByBillingPeriod(billingPeriod.id, filterFlowType);

            const sortedResponse = response.sort((a, b) => (b?.task?.id || 0) - (a?.task?.id || 0));
            setLinkedTasks(sortedResponse);
        } catch (error: any) {
            console.error('Erro ao carregar tarefas vinculadas:', error);
            setLinkedTasks([]);
        } finally {
            setLoading(false);
        }
    }, [billingPeriod?.id, flowType]);

    useEffect(() => {
        if (isOpen && billingPeriod) {
            loadLinkedTasks();
        }
    }, [isOpen, billingPeriod, loadLinkedTasks]);

    useEffect(() => {
        setCurrentPage(0);
    }, [pageSize]);

    useEffect(() => {
        let filtered = [...linkedTasks];

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


        const totalElements = filtered.length;
        const totalPages = Math.ceil(totalElements / pageSize);
        
        setPagination({
            currentPage,
            totalPages,
            pageSize,
            totalElements
        });
        

        const startIndex = currentPage * pageSize;
        const endIndex = startIndex + pageSize;
        setFilteredTasks(filtered.slice(startIndex, endIndex));
        
    }, [linkedTasks, filters, sortField, sortDirection, currentPage, pageSize]);

    const getNestedValue = (obj: any, path: string): any => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    };

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
            key: 'task.id',
            header: 'ID',
            sortable: true,
            filterable: true,
            width: '60px',
            render: (link: BillingPeriodTask) => (
                <span className="font-mono text-xs text-text-tertiary">#{link?.task?.id}</span>
            )
        },
        {
            key: 'task.code',
            header: 'Código',
            sortable: true,
            filterable: true,
            width: '100px',
            render: (link: BillingPeriodTask) => (
                link.task.link ?
                <div className="flex items-center gap-2">
                    <a
                        href={link.task.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent bg-surface-2 rounded px-2 py-1 hover:text-info-strong flex items-center gap-1 max-w-xs truncate"
                        onClick={(e) => e.stopPropagation()}
                        title={link.task.link}
                    >
                        <span className="truncate">{link.task.code}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                </div> 
                :
                <span className="font-mono text-xs bg-surface-2 px-2 py-1 rounded">{link.task.code || '-'}</span>
            )
        },
        {
            key: 'task.flowType',
            header: 'Fluxo',
            sortable: true,
            filterable: true,
            width: '130px',
            render: (link: BillingPeriodTask) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    link?.task?.flowType === 'DESENVOLVIMENTO'
                        ? 'bg-accent-soft text-info-strong'
                        : 'bg-purple-100 text-purple-800'
                }`}>
                    {link?.task?.flowType === 'DESENVOLVIMENTO' ? 'Desenvolvimento' : 'Operacional'}
                </span>
            )
        },
        {
            key: 'task.taskType',
            header: 'Tipo',
            sortable: true,
            filterable: true,
            width: '150px',
            render: (link: BillingPeriodTask) => (
                <span className="text-xs text-text-secondary">
                    {formatTaskType(link?.task?.taskType)}
                </span>
            )
        },
        {
            key: 'task.environment',
            header: 'Ambiente',
            sortable: true,
            filterable: true,
            width: '130px',
            render: (link: BillingPeriodTask) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    link?.task?.environment === 'PRODUCAO'
                        ? 'bg-accent-soft text-info-strong'
                        : link?.task?.environment === 'HOMOLOGACAO'
                            ? 'bg-yellow-100 text-yellow-800'
                            : link?.task?.environment === 'DESENVOLVIMENTO'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-surface-2 text-text-secondary'
                }`}>
                    {formatEnvironment(link?.task?.environment)}
                </span>
            )
        },
        {
            key: 'task.title',
            header: 'Título',
            sortable: true,
            filterable: true,
            width: '300px',
            render: (link: BillingPeriodTask) => (
                <span
                    className="font-medium block truncate cursor-help"
                    title={link?.task?.title}
                >
                    {link?.task?.title}
                </span>
            )
        },
        {
            key: 'task.amount',
            header: 'Valor',
            sortable: true,
            width: '100px',
            render: (link: BillingPeriodTask) => (
                <span className="font-semibold text-green-600 text-sm">
                    R$ {link?.task?.amount?.toFixed(2) || '0,00'}
                </span>
            )
        }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-surface-1 rounded-xl shadow-2xl w-full max-w-7xl h-[75vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border-subtle bg-gradient-to-r from-gray-50 to-blue-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <Eye className="w-5 h-5" />
                                Visualizar Tarefas do Período
                            </h2>
                            {billingPeriod && (
                                <p className="text-sm text-text-secondary mt-1">
                                    {monthNames[billingPeriod.month]} de {billingPeriod.year} - Tarefas vinculadas
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
                                                                className="text-text-tertiary hover:text-text-secondary"
                                                            >
                                                                {sortField === column.key && sortDirection === 'asc' ? '↑' : '↓'}
                                                            </button>
                                                        )}
                                                    </div>
                                                    {column.filterable && (
                                                        <div className="mt-1">
                                                            <input
                                                                type="text"
                                                                placeholder={column.key === 'task.id' ? 'Fi' : 'Filtrar...'}
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
                                        {filteredTasks.length === 0 ? (
                                            <tr>
                                                <td colSpan={columns.length} className="px-6 py-4 text-center text-text-tertiary">
                                                    {loading ? "Carregando..." : "Nenhuma tarefa vinculada encontrada"}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTasks.map((link, index) => (
                                                <tr key={link?.task?.id || index} className="hover:bg-surface-app">
                                                    {columns.map((column) => (
                                                        <td
                                                            key={column.key}
                                                            className="px-6 py-4 whitespace-nowrap text-sm text-text-primary"
                                                            style={column.width ? { width: column.width, minWidth: column.width, maxWidth: column.width } : undefined}
                                                        >
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
                                <div className="bg-surface-app rounded-lg p-3 space-y-3">
                                    <div className="text-sm font-medium text-text-secondary">Filtros</div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">ID</label>
                                            <input
                                                type="text"
                                                placeholder="Filtrar por ID..."
                                                value={filters['task.id'] || ''}
                                                onChange={(e) => setFilters(prev => ({ ...prev, 'task.id': e.target.value }))}
                                                className="w-full px-3 py-2 text-sm border border-border-strong rounded focus:ring-2 focus:ring-accent focus:border-accent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">Código</label>
                                            <input
                                                type="text"
                                                placeholder="Filtrar por código..."
                                                value={filters['task.code'] || ''}
                                                onChange={(e) => setFilters(prev => ({ ...prev, 'task.code': e.target.value }))}
                                                className="w-full px-3 py-2 text-sm border border-border-strong rounded focus:ring-2 focus:ring-accent focus:border-accent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">Fluxo</label>
                                            <select
                                                value={filters['task.flowType'] || ''}
                                                onChange={(e) => setFilters(prev => ({ ...prev, 'task.flowType': e.target.value }))}
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
                                                value={filters['task.title'] || ''}
                                                onChange={(e) => setFilters(prev => ({ ...prev, 'task.title': e.target.value }))}
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

                                {filteredTasks.length === 0 ? (
                                    <div className="text-center py-8 text-text-tertiary">
                                        {loading ? "Carregando..." : "Nenhuma tarefa vinculada encontrada"}
                                    </div>
                                ) : (
                                    filteredTasks.map((link, index) => (
                                        <div key={link?.task?.id || index} className="bg-surface-1 border border-border-subtle rounded-lg p-4 shadow-sm">
                                            {/* Header do card com ID */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="font-semibold text-text-primary text-base line-clamp-2">{link?.task?.title || '-'}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-surface-2 text-text-primary">
                                                            #{link?.task?.id}
                                                        </span>
                                                        <span className="text-sm font-mono text-text-secondary">{link?.task?.code}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Informações da tarefa */}
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-text-secondary">Fluxo:</span>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        link?.task?.flowType === 'DESENVOLVIMENTO'
                                                            ? 'bg-accent-soft text-info-strong'
                                                            : 'bg-purple-100 text-purple-800'
                                                    }`}>
                                                        {link?.task?.flowType === 'DESENVOLVIMENTO' ? 'Desenvolvimento' : 'Operacional'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-text-secondary">Tipo:</span>
                                                    <span className="text-text-primary text-xs font-medium">
                                                        {formatTaskType(link?.task?.taskType)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-text-secondary">Ambiente:</span>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                        link?.task?.environment === 'PRODUCAO'
                                                            ? 'bg-accent-soft text-info-strong'
                                                            : link?.task?.environment === 'HOMOLOGACAO'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : link?.task?.environment === 'DESENVOLVIMENTO'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-surface-2 text-text-secondary'
                                                    }`}>
                                                        {formatEnvironment(link?.task?.environment)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-text-secondary">Valor:</span>
                                                    <span className="font-semibold text-green-600">
                                                        R$ {link?.task?.amount?.toFixed(2) || '0,00'}
                                                    </span>
                                                </div>
                                                {link?.task?.description && (
                                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                                        <span className="text-text-secondary text-xs">Descrição:</span>
                                                        <p className="text-text-primary text-sm mt-1 line-clamp-2">{link.task.description}</p>
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