import React, { useState, useCallback, useEffect } from 'react';
import { X, Unlink, Search, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
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

interface BillingPeriodTask {
    id: number;
    task: Task;
    createdAt: string;
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
    onTasksUnlinked: () => void;
}

const UnlinkTasksFromBillingModal: React.FC<Props> = ({
    isOpen,
    onClose,
    billingPeriod,
    onTasksUnlinked
}) => {
    // Estados da tabela
    const [linkedTasks, setLinkedTasks] = useState<BillingPeriodTask[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<BillingPeriodTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<string>('task.code');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [filters, setFilters] = useState<Record<string, string>>({});
    
    // Estados para paginação
    const [pagination, setPagination] = useState<{
        currentPage: number;
        totalPages: number; 
        pageSize: number;
        totalElements: number;
    } | null>(null);
    
    // Estados da operação
    const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
    const [unlinking, setUnlinking] = useState(false);

    const monthNames = [
        '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    // Carregar tarefas vinculadas com paginação
    const loadLinkedTasks = useCallback(async () => {
        if (!billingPeriod?.id) return;
        
        setLoading(true);
        try {
            const response = await billingPeriodService.findTaskLinksPaginated(billingPeriod.id, {
                page: currentPage,
                size: pageSize,
                sortBy: sortField === 'task.code' ? 'task.code' : sortField,
                sortDirection: sortDirection
            });
            
            setLinkedTasks(response.content || []);
            setPagination({
                currentPage: response.number || 0,
                totalPages: response.totalPages || 0,
                pageSize: response.size || 10,
                totalElements: response.totalElements || 0
            });
        } catch (error: any) {
            console.error('Erro ao carregar tarefas vinculadas:', error);
            toast.error('Erro ao carregar tarefas vinculadas');
            setLinkedTasks([]);
            setFilteredTasks([]);
        } finally {
            setLoading(false);
        }
    }, [billingPeriod?.id, currentPage, pageSize, sortField, sortDirection]);

    // Desvincular tarefas selecionadas
    const handleUnlinkTasks = useCallback(async () => {
        if (!billingPeriod?.id || selectedTasks.length === 0) return;

        setUnlinking(true);
        try {
            await billingPeriodService.bulkUnlinkTasks(billingPeriod.id, selectedTasks);
            toast.success(`${selectedTasks.length} tarefa(s) desvinculada(s) com sucesso!`);
            
            setSelectedTasks([]);
            onTasksUnlinked(); // Callback para recarregar dados do pai
            onClose();
        } catch (error: any) {
            console.error('Erro ao desvincular tarefas:', error);
            toast.error('Erro ao desvincular tarefas');
        } finally {
            setUnlinking(false);
        }
    }, [billingPeriod?.id, selectedTasks, onTasksUnlinked, onClose]);

    // Reset página quando pageSize mudar
    useEffect(() => {
        setCurrentPage(0);
    }, [pageSize]);

    // Filtrar tarefas localmente com base na busca e filtros por coluna
    useEffect(() => {
        if (!linkedTasks) {
            setFilteredTasks([]);
            return;
        }

        const filtered = linkedTasks.filter(link => {
            const task = link?.task;
            
            // Filtro de busca geral
            if (searchTerm) {
                const matchesSearch = (
                    task?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    task?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    task?.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    task?.id?.toString().includes(searchTerm)
                );
                if (!matchesSearch) return false;
            }
            
            // Filtros por coluna
            for (const [key, value] of Object.entries(filters)) {
                if (value && value.trim()) {
                    let fieldValue = '';
                    
                    switch (key) {
                        case 'task.id':
                            fieldValue = task?.id?.toString() || '';
                            break;
                        case 'task.code':
                            fieldValue = task?.code || '';
                            break;
                        case 'task.title':
                            fieldValue = task?.title || '';
                            break;
                        case 'task.status':
                            fieldValue = task?.status || '';
                            break;
                        case 'task.requesterName':
                            fieldValue = task?.requesterName || '';
                            break;
                        default:
                            fieldValue = '';
                    }
                    
                    if (!fieldValue.toLowerCase().includes(value.toLowerCase())) {
                        return false;
                    }
                }
            }
            
            return true;
        });

        setFilteredTasks(filtered);
    }, [linkedTasks, searchTerm, filters]);

    // Carregar dados quando o modal abrir
    useEffect(() => {
        if (isOpen && billingPeriod) {
            setSelectedTasks([]);
            setSearchTerm('');
            setFilters({});
            setCurrentPage(0);
            loadLinkedTasks();
        }
    }, [isOpen, billingPeriod, loadLinkedTasks]);

    // Colunas da tabela
    const columns = [
        {
            key: 'selection',
            header: (
                <input
                    type="checkbox"
                    checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                    ref={(input) => {
                        if (input) {
                            input.indeterminate = selectedTasks.length > 0 && selectedTasks.length < filteredTasks.length;
                        }
                    }}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedTasks(filteredTasks.map(link => link?.task?.id).filter(Boolean));
                        } else {
                            setSelectedTasks([]);
                        }
                    }}
                    className="rounded border-gray-300"
                />
            ),
            render: (link: BillingPeriodTask) => (
                <input
                    type="checkbox"
                    checked={selectedTasks.includes(link?.task?.id)}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedTasks(prev => [...prev, link?.task?.id].filter(Boolean));
                        } else {
                            setSelectedTasks(prev => prev.filter(id => id !== link?.task?.id));
                        }
                    }}
                    className="rounded border-gray-300"
                />
            )
        },
        {
            key: 'task.id',
            header: 'ID',
            sortable: true,
            filterable: true,
            render: (link: BillingPeriodTask) => (
                <span className="font-mono text-xs text-gray-500">#{link?.task?.id || '-'}</span>
            )
        },
        {
            key: 'task.code',
            header: 'Código',
            sortable: true,
            filterable: true,
            render: (link: BillingPeriodTask) => (
                <span className="font-mono text-sm">{link?.task?.code || '-'}</span>
            )
        },
        {
            key: 'task.title',
            header: 'Título',
            sortable: true,
            filterable: true,
            render: (link: BillingPeriodTask) => (
                <span className="font-medium">{link?.task?.title || '-'}</span>
            )
        },
        {
            key: 'task.status',
            header: 'Status',
            sortable: true,
            filterable: true,
            render: (link: BillingPeriodTask) => {
                const statusColors = {
                    PENDING: 'bg-yellow-100 text-yellow-800',
                    IN_PROGRESS: 'bg-blue-100 text-blue-800',
                    COMPLETED: 'bg-green-100 text-green-800',
                    CANCELLED: 'bg-red-100 text-red-800'
                };
                const status = link?.task?.status || 'UNKNOWN';
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                        {status}
                    </span>
                );
            }
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
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Desvincular Tarefas do Período
                            </h2>
                            {billingPeriod && (
                                <p className="text-sm text-gray-600 mt-1">
                                    {monthNames[billingPeriod.month]} de {billingPeriod.year} - Tarefas vinculadas ({linkedTasks.length})
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

                {/* Search Bar */}
                <div className="px-6 py-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar por código, título ou solicitante..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
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
                                                                    const newDirection = sortField === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
                                                                    setSortField(column.key);
                                                                    setSortDirection(newDirection);
                                                                    setCurrentPage(0); // Reset para primeira página
                                                                }}
                                                                className="text-gray-400 hover:text-gray-600"
                                                            >
                                                                {sortField === column.key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
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
                                                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-red-500"
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
                            <span>Total: {linkedTasks.length} tarefa(s)</span>
                            {selectedTasks.length > 0 && (
                                <span className="ml-4 font-medium text-red-600">
                                    {selectedTasks.length} selecionada(s) - 
                                    Valor: R$ {
                                        linkedTasks
                                            .filter(link => selectedTasks.includes(link?.task?.id))
                                            .reduce((sum, link) => sum + (link?.task?.amount || 0), 0)
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
                                onClick={handleUnlinkTasks}
                                disabled={unlinking || selectedTasks.length === 0}
                                className={`${selectedTasks.length > 0 
                                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {unlinking ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Desvinculando...
                                    </>
                                ) : (
                                    <>
                                        <Unlink className="w-4 h-4 mr-2" />
                                        Desvincular {selectedTasks.length > 0 ? `${selectedTasks.length} Tarefa(s)` : 'Tarefas'}
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

export default UnlinkTasksFromBillingModal;