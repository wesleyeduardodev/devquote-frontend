import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
    X,
    Search,
    Plus,
    Trash2,
    Eye,
    CheckCircle,
    Clock,
    AlertCircle,
    Filter,
    SortAsc,
    SortDesc,
    Link2,
    Unlink,
    Package,
    DollarSign,
    Calendar,
    FileText,
    Loader2,
    Users,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

import DataTable from '../ui/DataTable';
import BulkDeleteModal from '../ui/BulkDeleteModal';
import useQuotes from '../../hooks/useQuotes';
import billingMonthService from '../../services/billingMonthService';

interface BillingMonth {
    id: number;
    month: number;
    year: number;
    paymentDate?: string | null;
    status: string;
}

interface QuoteLink {
    id: number;
    quoteBillingMonthId: number;
    quoteId: number;
    createdAt?: string;
    updatedAt?: string;
}

interface BillingQuoteManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    billingMonth: BillingMonth | null;
    onDataChange?: () => void;
}

// Constantes estáveis para evitar re-renders
const EMPTY_ARRAY: never[] = [];
const STABLE_CLASS_NAME = "border border-gray-200 rounded-lg";

const BillingQuoteManagementModal: React.FC<BillingQuoteManagementModalProps> = ({
    isOpen,
    onClose,
    billingMonth,
    onDataChange
}) => {
    // Estado do modal
    const [activeTab, setActiveTab] = useState<'linked' | 'available'>('linked');
    
    // Estados dos orçamentos vinculados
    const [linkedQuotes, setLinkedQuotes] = useState<QuoteLink[]>([]);
    const [linkedLoading, setLinkedLoading] = useState(false);
    const [selectedLinked, setSelectedLinked] = useState<number[]>([]);
    
    // Estados dos orçamentos disponíveis
    const [selectedAvailable, setSelectedAvailable] = useState<number[]>([]);
    
    // Filtros e busca
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('APPROVED');
    const [sortBy, setSortBy] = useState('id');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    
    // Loading states
    const [linking, setLinking] = useState(false);
    const [unlinking, setUnlinking] = useState(false);
    
    // Bulk delete modal
    const [showUnlinkModal, setShowUnlinkModal] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(10);
    
    const { quotes, loading: quotesLoading } = useQuotes({ size: 1000 });

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const getMonthName = (month: number) => monthNames[month - 1] || month.toString();

    const formatCurrency = useCallback((value: number | string | undefined | null) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(Number(value || 0));
    }, []);

    const getQuoteAmount = useCallback((quote: any): number => {
        return Number(quote.totalAmount ?? quote.total ?? quote.amount ?? quote.value ?? 0);
    }, []);

    const getQuoteStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            APPROVED: 'bg-green-100 text-green-800 border-green-200',
            REJECTED: 'bg-red-100 text-red-800 border-red-200',
            DRAFT: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getQuoteStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Pendente',
            APPROVED: 'Aprovado', 
            REJECTED: 'Rejeitado',
            DRAFT: 'Rascunho'
        };
        return labels[status] || status;
    };

    // Carrega orçamentos vinculados
    const fetchLinkedQuotes = useCallback(async () => {
        if (!billingMonth?.id) return;
        
        setLinkedLoading(true);
        try {
            const data = await billingMonthService.findQuoteLinksByBillingMonth(billingMonth.id) as QuoteLink[];
            setLinkedQuotes(data || []);
        } catch (error: any) {
            console.error('Erro ao carregar vínculos:', error);
            toast.error('Erro ao carregar orçamentos vinculados');
        } finally {
            setLinkedLoading(false);
        }
    }, [billingMonth?.id]);

    // Carrega dados quando abre o modal
    useEffect(() => {
        if (isOpen && billingMonth) {
            fetchLinkedQuotes();
            setActiveTab('linked');
            setSelectedLinked([]);
            setSelectedAvailable([]);
            setSearchTerm('');
            setStatusFilter('APPROVED');
            setCurrentPage(0);
        }
    }, [isOpen, billingMonth, fetchLinkedQuotes]);

    // Orçamentos disponíveis para vinculação
    const availableQuotes = useMemo(() => {
        const linkedQuoteIds = new Set(linkedQuotes.map(link => link.quoteId));
        return quotes.filter(quote => !linkedQuoteIds.has(quote.id));
    }, [quotes, linkedQuotes]);

    // Orçamentos vinculados com detalhes
    const linkedQuotesWithDetails = useMemo(() => {
        return linkedQuotes.map(link => {
            const quote = quotes.find(q => q.id === link.quoteId);
            return {
                ...link,
                quote,
                amount: quote ? getQuoteAmount(quote) : 0
            };
        }).filter(item => item.quote);
    }, [linkedQuotes, quotes, getQuoteAmount]);

    // Filtros para orçamentos disponíveis
    const filteredAvailableQuotes = useMemo(() => {
        return availableQuotes.filter(quote => {
            const matchesSearch = !searchTerm || 
                quote.taskName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                quote.taskCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                quote.id.toString().includes(searchTerm);
                
            const matchesStatus = !statusFilter || quote.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        }).sort((a, b) => {
            const multiplier = sortDirection === 'asc' ? 1 : -1;
            
            if (sortBy === 'amount') {
                return (getQuoteAmount(a) - getQuoteAmount(b)) * multiplier;
            }
            
            if (sortBy === 'taskName') {
                return (a.taskName || '').localeCompare(b.taskName || '') * multiplier;
            }
            
            return (a.id - b.id) * multiplier;
        });
    }, [availableQuotes, searchTerm, statusFilter, sortBy, sortDirection, getQuoteAmount]);

    // Paginação
    const paginatedAvailableQuotes = useMemo(() => {
        const startIndex = currentPage * pageSize;
        return filteredAvailableQuotes.slice(startIndex, startIndex + pageSize);
    }, [filteredAvailableQuotes, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredAvailableQuotes.length / pageSize);

    // Estatísticas
    const statistics = useMemo(() => {
        const linkedTotal = linkedQuotesWithDetails.reduce((sum, item) => sum + item.amount, 0);
        const linkedCount = linkedQuotesWithDetails.length;
        const availableTotal = availableQuotes.reduce((sum, quote) => sum + getQuoteAmount(quote), 0);
        const availableCount = availableQuotes.length;
        
        return {
            linkedTotal,
            linkedCount,
            availableTotal,
            availableCount
        };
    }, [linkedQuotesWithDetails, availableQuotes, getQuoteAmount]);

    // Handlers para vincular orçamentos
    const handleLinkQuotes = useCallback(async () => {
        if (!billingMonth || selectedAvailable.length === 0) return;
        
        setLinking(true);
        try {
            const requests = selectedAvailable.map(quoteId => ({
                quoteBillingMonthId: billingMonth.id,
                quoteId
            }));
            
            await billingMonthService.bulkLinkQuotes(requests);
            await fetchLinkedQuotes();
            setSelectedAvailable([]);
            onDataChange?.();
            toast.success(`${selectedAvailable.length} orçamento(s) vinculado(s) com sucesso!`);
        } catch (error: any) {
            console.error('Erro ao vincular orçamentos:', error);
            toast.error('Erro ao vincular orçamentos selecionados');
        } finally {
            setLinking(false);
        }
    }, [billingMonth, selectedAvailable, fetchLinkedQuotes, onDataChange]);

    // Handler para desvincular orçamentos
    const handleUnlinkQuotes = useCallback(async () => {
        if (!billingMonth || selectedLinked.length === 0) return;
        
        setUnlinking(true);
        try {
            await billingMonthService.bulkUnlinkQuotes(billingMonth.id, selectedLinked);
            await fetchLinkedQuotes();
            setSelectedLinked([]);
            setShowUnlinkModal(false);
            onDataChange?.();
            toast.success(`${selectedLinked.length} orçamento(s) desvinculado(s) com sucesso!`);
        } catch (error: any) {
            console.error('Erro ao desvincular orçamentos:', error);
            toast.error('Erro ao desvincular orçamentos selecionados');
        } finally {
            setUnlinking(false);
        }
    }, [billingMonth, selectedLinked, fetchLinkedQuotes, onDataChange]);

    // Seleção múltipla para orçamentos vinculados
    const handleToggleLinked = (id: number) => {
        setSelectedLinked(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleToggleAllLinked = () => {
        const currentIds = linkedQuotesWithDetails.map(item => item.quoteId);
        setSelectedLinked(prev => 
            currentIds.every(id => prev.includes(id)) ? [] : currentIds
        );
    };

    // Seleção múltipla para orçamentos disponíveis
    const handleToggleAvailable = (id: number) => {
        setSelectedAvailable(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleToggleAllAvailable = () => {
        const currentIds = paginatedAvailableQuotes.map(quote => quote.id);
        setSelectedAvailable(prev => 
            currentIds.every(id => prev.includes(id)) ? [] : currentIds
        );
    };

    // Componentes memoizados para os checkboxes
    const LinkedHeaderCheckbox = useCallback(() => (
        <input
            type="checkbox"
            checked={linkedQuotesWithDetails.length > 0 && 
                linkedQuotesWithDetails.every(item => selectedLinked.includes(item.quoteId))}
            onChange={handleToggleAllLinked}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
    ), [linkedQuotesWithDetails, selectedLinked, handleToggleAllLinked]);

    const AvailableHeaderCheckbox = useCallback(() => (
        <input
            type="checkbox"
            checked={paginatedAvailableQuotes.length > 0 && 
                paginatedAvailableQuotes.every(quote => selectedAvailable.includes(quote.id))}
            onChange={handleToggleAllAvailable}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
    ), [paginatedAvailableQuotes, selectedAvailable, handleToggleAllAvailable]);

    // Definições de colunas para tabelas
    const linkedColumns = useMemo(() => [
        {
            key: 'select',
            label: '',
            width: '50px',
            headerRender: LinkedHeaderCheckbox,
            render: (item: any) => (
                <input
                    type="checkbox"
                    checked={selectedLinked.includes(item.quoteId)}
                    onChange={() => handleToggleLinked(item.quoteId)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
            )
        },
        {
            key: 'quote',
            label: 'Orçamento',
            render: (item: any) => (
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">#{item.quote.id}</span>
                        {item.quote.taskCode && (
                            <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {item.quote.taskCode}
                            </span>
                        )}
                    </div>
                    {item.quote.taskName && (
                        <p className="text-sm text-gray-600 mt-1">{item.quote.taskName}</p>
                    )}
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (item: any) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getQuoteStatusColor(item.quote.status)}`}>
                    {getQuoteStatusLabel(item.quote.status)}
                </span>
            )
        },
        {
            key: 'amount',
            label: 'Valor',
            render: (item: any) => (
                <span className="font-semibold text-green-600">
                    {formatCurrency(item.amount)}
                </span>
            )
        }
    ], [LinkedHeaderCheckbox, selectedLinked, handleToggleLinked, getQuoteStatusColor, getQuoteStatusLabel, formatCurrency]);

    const availableColumns = useMemo(() => [
        {
            key: 'select',
            label: '',
            width: '50px',
            headerRender: AvailableHeaderCheckbox,
            render: (quote: any) => (
                <input
                    type="checkbox"
                    checked={selectedAvailable.includes(quote.id)}
                    onChange={() => handleToggleAvailable(quote.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
            )
        },
        {
            key: 'quote',
            label: 'Orçamento',
            render: (quote: any) => (
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">#{quote.id}</span>
                        {quote.taskCode && (
                            <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {quote.taskCode}
                            </span>
                        )}
                    </div>
                    {quote.taskName && (
                        <p className="text-sm text-gray-600 mt-1">{quote.taskName}</p>
                    )}
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (quote: any) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getQuoteStatusColor(quote.status)}`}>
                    {getQuoteStatusLabel(quote.status)}
                </span>
            )
        },
        {
            key: 'amount',
            label: 'Valor',
            render: (quote: any) => (
                <span className="font-semibold text-green-600">
                    {formatCurrency(getQuoteAmount(quote))}
                </span>
            )
        }
    ], [AvailableHeaderCheckbox, selectedAvailable, handleToggleAvailable, getQuoteStatusColor, getQuoteStatusLabel, formatCurrency, getQuoteAmount]);

    if (!isOpen || !billingMonth) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Gerenciar Orçamentos
                                </h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    <span className="text-lg font-semibold text-blue-600">
                                        {getMonthName(billingMonth.month)} {billingMonth.year}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                                        #{billingMonth.id}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Estatísticas */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Link2 className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Vinculados</p>
                                        <p className="text-lg font-bold text-gray-900">{statistics.linkedCount}</p>
                                        <p className="text-xs text-green-600 font-semibold">
                                            {formatCurrency(statistics.linkedTotal)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Package className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Disponíveis</p>
                                        <p className="text-lg font-bold text-gray-900">{statistics.availableCount}</p>
                                        <p className="text-xs text-blue-600 font-semibold">
                                            {formatCurrency(statistics.availableTotal)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Geral</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {statistics.linkedCount + statistics.availableCount}
                                        </p>
                                        <p className="text-xs text-purple-600 font-semibold">
                                            {formatCurrency(statistics.linkedTotal + statistics.availableTotal)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">% Vinculado</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {statistics.linkedCount + statistics.availableCount > 0 
                                                ? Math.round((statistics.linkedCount / (statistics.linkedCount + statistics.availableCount)) * 100)
                                                : 0}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('linked')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'linked'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Link2 className="w-4 h-4" />
                                    Orçamentos Vinculados ({statistics.linkedCount})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('available')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'available'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Orçamentos Disponíveis ({statistics.availableCount})
                                </div>
                            </button>
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        {activeTab === 'linked' && (
                            <div className="space-y-4">
                                {/* Actions for linked quotes */}
                                {selectedLinked.length > 0 && (
                                    <div className="bg-red-50 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-700">
                                                {selectedLinked.length} orçamento(s) selecionado(s)
                                            </div>
                                            <button
                                                onClick={() => setShowUnlinkModal(true)}
                                                className="inline-flex items-center gap-2 px-3 py-2 text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                                            >
                                                <Unlink className="w-4 h-4" />
                                                Desvincular Selecionados
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {linkedLoading ? (
                                    <div className="text-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-gray-400" />
                                        <p className="text-gray-500">Carregando orçamentos vinculados...</p>
                                    </div>
                                ) : linkedQuotesWithDetails.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-gray-500">Nenhum orçamento vinculado</p>
                                        <button
                                            onClick={() => setActiveTab('available')}
                                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Vincular Orçamentos
                                        </button>
                                    </div>
                                ) : (
                                    <DataTable
                                        columns={linkedColumns}
                                        data={linkedQuotesWithDetails}
                                        className={STABLE_CLASS_NAME}
                                        hiddenColumns={EMPTY_ARRAY}
                                        showColumnToggle={false}
                                    />
                                )}
                            </div>
                        )}

                        {activeTab === 'available' && (
                            <div className="space-y-4">
                                {/* Filters */}
                                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <input
                                                    type="text"
                                                    placeholder="ID, código ou nome da tarefa..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Todos</option>
                                                <option value="APPROVED">Aprovado</option>
                                                <option value="PENDING">Pendente</option>
                                                <option value="DRAFT">Rascunho</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={sortBy}
                                                    onChange={(e) => setSortBy(e.target.value)}
                                                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    <option value="id">ID</option>
                                                    <option value="taskName">Nome</option>
                                                    <option value="amount">Valor</option>
                                                </select>
                                                <button
                                                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                                                    className="px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    {sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions for available quotes */}
                                {selectedAvailable.length > 0 && (
                                    <div className="bg-green-50 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-700">
                                                {selectedAvailable.length} orçamento(s) selecionado(s)
                                            </div>
                                            <button
                                                onClick={handleLinkQuotes}
                                                disabled={linking}
                                                className="inline-flex items-center gap-2 px-3 py-2 text-green-600 bg-green-100 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                                            >
                                                {linking ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Link2 className="w-4 h-4" />
                                                )}
                                                Vincular Selecionados
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {quotesLoading ? (
                                    <div className="text-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-gray-400" />
                                        <p className="text-gray-500">Carregando orçamentos...</p>
                                    </div>
                                ) : filteredAvailableQuotes.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-gray-500">
                                            {availableQuotes.length === 0 
                                                ? 'Todos os orçamentos aprovados já estão vinculados'
                                                : 'Nenhum orçamento encontrado com os filtros aplicados'
                                            }
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <DataTable
                                            columns={availableColumns}
                                            data={paginatedAvailableQuotes}
                                            className={STABLE_CLASS_NAME}
                                            hiddenColumns={EMPTY_ARRAY}
                                            showColumnToggle={false}
                                        />
                                        
                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-700">
                                                    Exibindo {currentPage * pageSize + 1} a {Math.min((currentPage + 1) * pageSize, filteredAvailableQuotes.length)} de {filteredAvailableQuotes.length} orçamentos
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                                        disabled={currentPage === 0}
                                                        className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" />
                                                    </button>
                                                    
                                                    <span className="px-3 py-2 text-sm text-gray-600">
                                                        Página {currentPage + 1} de {totalPages}
                                                    </span>
                                                    
                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                                        disabled={currentPage === totalPages - 1}
                                                        className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Total vinculado: <span className="font-semibold text-green-600">
                                    {formatCurrency(statistics.linkedTotal)}
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de confirmação para desvincular */}
            <BulkDeleteModal
                isOpen={showUnlinkModal}
                onClose={() => setShowUnlinkModal(false)}
                onConfirm={handleUnlinkQuotes}
                selectedCount={selectedLinked.length}
                isDeleting={unlinking}
                entityName="vínculo"
                title="Desvincular Orçamentos"
                message="Tem certeza que deseja desvincular os orçamentos selecionados deste período de faturamento?"
            />
        </>
    );
};

export default BillingQuoteManagementModal;