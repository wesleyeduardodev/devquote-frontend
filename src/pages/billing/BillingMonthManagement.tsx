import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
    Plus,
    Calendar,
    DollarSign,
    FileText,
    Link2,
    Trash2,
    X,
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle,
    Search,
    Download,
    Eye,
    TrendingUp,
    Loader2,
    Hash,
} from 'lucide-react';

// Hooks e serviços existentes
// import useQuotes from '../../hooks/useQuotes'; // Removido - não existe mais fluxo de quotes
import { useAuth } from '../../hooks/useAuth';
import billingMonthService from '../../services/billingMonthService';

// Modal de confirmação (mesmo usado nas outras telas)
import BulkDeleteModal from '../../components/ui/BulkDeleteModal';

type StatusValue = 'PENDENTE' | 'PROCESSANDO' | 'FATURADO' | 'PAGO' | 'ATRASADO' | 'CANCELADO';

interface BillingMonth {
    id: number;
    month: number;
    year: number;
    paymentDate?: string | null;
    status: StatusValue;
    createdAt?: string;
    updatedAt?: string;
}

interface QuoteLink {
    id: number;
    quoteBillingMonthId: number;
    quoteId: number;
    createdAt?: string;
    updatedAt?: string;
}

interface CreateBillingMonthDTO {
    month: number;
    year: number;
    paymentDate?: string | null;
    status: StatusValue;
}

const monthOptions = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
];

const statusOptions = [
    { value: 'PENDENTE', label: 'Pendente', color: 'amber', icon: Clock },
    { value: 'PROCESSANDO', label: 'Processando', color: 'blue', icon: AlertCircle },
    { value: 'FATURADO', label: 'Faturado', color: 'purple', icon: FileText },
    { value: 'PAGO', label: 'Pago', color: 'green', icon: CheckCircle },
    { value: 'ATRASADO', label: 'Atrasado', color: 'red', icon: XCircle },
    { value: 'CANCELADO', label: 'Cancelado', color: 'gray', icon: X }
] as const;

const BillingManagement: React.FC = () => {
    const { hasProfile } = useAuth();
    
    // Verifica se o usuário tem permissão de escrita (apenas ADMIN)
    const isAdmin = hasProfile('ADMIN');
    const isReadOnly = !isAdmin; // MANAGER e USER têm apenas leitura
    
    // Lista e carregamento
    const [billingMonths, setBillingMonths] = useState<BillingMonth[]>([]);
    const [loadingList, setLoadingList] = useState(true);

    // Seleção múltipla
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Totais
    const [totals, setTotals] = useState<Record<number, number>>({});
    const [totalsLoading, setTotalsLoading] = useState(false);

    // Modais
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedBilling, setSelectedBilling] = useState<BillingMonth | null>(null);
    const [createLoading, setCreateLoading] = useState(false);

    // Export
    const [exportLoading, setExportLoading] = useState(false);

    // Filtros gerais (desktop + mobile)
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('');


    // Form
    const [formData, setFormData] = useState<{
        month: number | '';
        year: number;
        paymentDate: string;
        status: StatusValue;
    }>({
        month: '',
        year: new Date().getFullYear(),
        paymentDate: '',
        status: 'PENDENTE'
    });

    const [formErrors, setFormErrors] = useState<Partial<Record<'month' | 'year', string>>>({});

    // Removed useQuotes hook - now using server-calculated totals

    const getQuoteAmount = useCallback((q: any): number => {
        const anyQ = q as unknown as {
            totalAmount?: number | string;
            total?: number | string;
            amount?: number | string;
            value?: number | string;
        };
        return Number(anyQ.totalAmount ?? anyQ.total ?? anyQ.amount ?? anyQ.value ?? 0);
    }, []);

    const formatCurrency = useCallback((value: number | string | undefined | null) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(Number(value || 0));
    }, []);

    const formatDate = useCallback((date?: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('pt-BR');
    }, []);

    const getMonthLabel = useCallback((month: number) => {
        return monthOptions.find(m => m.value === month)?.label ?? String(month);
    }, []);

    const fetchBillingMonths = useCallback(async () => {
        setLoadingList(true);
        try {
            const data = await billingMonthService.findAllWithTotals() as (BillingMonth & { totalAmount?: number })[] | undefined;
            const processedData = (data ?? []).map(item => {
                const { totalAmount, ...billing } = item;
                return billing as BillingMonth;
            });
            setBillingMonths(processedData);
            
            // Extract totals from server response
            const totalsFromServer = Object.fromEntries(
                (data ?? []).map(item => [item.id, Number(item.totalAmount || 0)])
            );
            setTotals(totalsFromServer);
        } catch (error: any) {
            console.error('Erro ao carregar faturamentos:', error);
            toast.error(error?.response?.data?.message ?? 'Erro ao carregar faturamentos');
        } finally {
            setLoadingList(false);
        }
    }, []);

    // Removed loadTotals - now handled in fetchBillingMonths with server-calculated totals

    useEffect(() => {
        fetchBillingMonths();
    }, [fetchBillingMonths]);

    // Removed loadTotals useEffect - totals now calculated server-side

    const filteredBillingMonths = useMemo(() => {
        return billingMonths.filter(billing => {
            const monthName = getMonthLabel(billing.month);
            const matchesSearch = searchTerm === '' ||
                monthName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                billing.year.toString().includes(searchTerm);
            const matchesStatus = statusFilter === '' || billing.status === statusFilter;
            const matchesYear = yearFilter === '' || billing.year.toString() === yearFilter;
            const matchesMonth = monthFilter === '' || billing.month.toString() === monthFilter;

            return matchesSearch && matchesStatus && matchesYear && matchesMonth;
        }).sort((a, b) => {
            // Garantir ordenação: ano DESC, mês DESC, id DESC
            if (a.year !== b.year) return b.year - a.year;
            if (a.month !== b.month) return b.month - a.month;
            return b.id - a.id;
        });
    }, [billingMonths, searchTerm, statusFilter, yearFilter, monthFilter, getMonthLabel]);

    const stats = useMemo(() => {
        const filteredData = filteredBillingMonths;
        const total = filteredData.reduce((sum, b) => sum + (totals[b.id] || 0), 0);
        const paid = filteredData.filter(b => b.status === 'PAGO').reduce((sum, b) => sum + (totals[b.id] || 0), 0);
        const pending = filteredData.filter(b => b.status === 'PENDENTE').reduce((sum, b) => sum + (totals[b.id] || 0), 0);
        const processing = filteredData.filter(b => b.status === 'PROCESSANDO').reduce((sum, b) => sum + (totals[b.id] || 0), 0);

        return { total, paid, pending, processing };
    }, [filteredBillingMonths, totals]);


    const validateCreate = useCallback((): boolean => {
        const e: Partial<Record<'month' | 'year', string>> = {};
        if (!formData.month) e.month = 'Mês é obrigatório';
        if (!formData.year) e.year = 'Ano é obrigatório';
        setFormErrors(e);
        return Object.keys(e).length === 0;
    }, [formData.month, formData.year]);

    const handleCreateBilling = useCallback(async () => {
        if (!validateCreate()) return;
        setCreateLoading(true);
        try {
            const payload: CreateBillingMonthDTO = {
                month: Number(formData.month),
                year: Number(formData.year),
                paymentDate: formData.paymentDate ? formData.paymentDate : null,
                status: formData.status,
            };
            await billingMonthService.create(payload);
            await fetchBillingMonths();
            setShowCreateModal(false);
            setFormData({ month: '', year: new Date().getFullYear(), paymentDate: '', status: 'PENDENTE' });
            setFormErrors({});
            toast.success('Período criado com sucesso!');
        } catch (error: any) {
            console.error('Erro ao criar período:', error);
            toast.error(error?.response?.data?.message ?? 'Erro ao criar período');
        } finally {
            setCreateLoading(false);
        }
    }, [fetchBillingMonths, formData, validateCreate]);

    const handleShowDetails = useCallback(async (billing: BillingMonth) => {
        setSelectedBilling(billing);
        setShowDetailsModal(true); // Alterado para usar modal de detalhes genérico
    }, []);

    const handleDataChange = useCallback(async () => {
        await fetchBillingMonths();
    }, [fetchBillingMonths]);

    const handleExportToExcel = useCallback(async () => {
        try {
            setExportLoading(true);
            const params = {
                month: monthFilter ? parseInt(monthFilter) : undefined,
                year: yearFilter ? parseInt(yearFilter) : undefined,
                status: statusFilter || undefined
            };

            const blob = await billingMonthService.exportToExcel(params);
            
            // Criar URL para download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Nome do arquivo com timestamp
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/[:\-]/g, '').replace('T', '_');
            link.download = `relatorio_faturamento_${timestamp}.xlsx`;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.success('Relatório exportado com sucesso!');
        } catch (err: any) {
            console.error('Erro ao exportar relatório:', err);
            toast.error('Erro ao exportar relatório');
        } finally {
            setExportLoading(false);
        }
    }, [monthFilter, yearFilter, statusFilter]);

    const handleDeleteBilling = useCallback(async (billing: BillingMonth) => {
        const hasValue = (totals[billing.id] ?? 0) > 0;
        let confirmMessage = `Deseja realmente excluir o faturamento de ${getMonthLabel(billing.month)}/${billing.year}?`;
        if (hasValue) {
            confirmMessage += '\n\nATENÇÃO: Este período possui orçamentos vinculados.';
        }
        if (!window.confirm(confirmMessage)) return;

        setLoadingList(true);
        try {
            await billingMonthService.delete(billing.id);
            setBillingMonths(prev => prev.filter(bm => bm.id !== billing.id));
            setTotals(prev => {
                const { [billing.id]: _, ...rest } = prev;
                return rest;
            });
            toast.success('Período excluído com sucesso!');
        } catch (error: any) {
            console.error('Erro ao excluir período:', error);
            toast.error(error?.response?.data?.message ?? 'Erro ao excluir período');
        } finally {
            setLoadingList(false);
        }
    }, [totals, getMonthLabel]);


    const clearAllFilters = useCallback(() => {
        setSearchTerm('');
        setStatusFilter('');
        setYearFilter('');
        setMonthFilter('');
    }, []);

    const getStatusConfig = (status: StatusValue) => {
        return statusOptions.find(s => s.value === status) || statusOptions[0];
    };

    const getQuoteStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            APPROVED: 'bg-green-100 text-green-800',
            REJECTED: 'bg-red-100 text-red-800',
            DRAFT: 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
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

    const StatusBadge = ({ status }: { status: StatusValue }) => {
        const config = getStatusConfig(status);
        const Icon = config.icon;

        const colorClasses = {
            amber: 'bg-amber-100 text-amber-800 border-amber-200',
            blue: 'bg-blue-100 text-blue-800 border-blue-200',
            purple: 'bg-purple-100 text-purple-800 border-purple-200',
            green: 'bg-green-100 text-green-800 border-green-200',
            red: 'bg-red-100 text-red-800 border-red-200',
            gray: 'bg-gray-100 text-gray-800 border-gray-200'
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border ${colorClasses[config.color]}`}>
        <Icon className="w-3 h-3" />
                {config.label}
      </span>
        );
    };

    const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
        title: string;
        value: string;
        icon: any;
        color: string;
        subtitle?: string;
    }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-lg ${color.includes('green') ? 'bg-green-100' : color.includes('blue') ? 'bg-blue-100' : color.includes('amber') ? 'bg-amber-100' : 'bg-purple-100'}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
            </div>
        </div>
    );

    const years = [...new Set(billingMonths.map(b => b.year))].sort((a, b) => b - a);

    // ===== Seleção múltipla =====
    const toggleItem = (id: number) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        const currentIds = filteredBillingMonths.map(b => b.id);
        const allSelected = currentIds.length > 0 && currentIds.every(id => selectedItems.includes(id));
        if (allSelected) {
            setSelectedItems(prev => prev.filter(id => !currentIds.includes(id)));
        } else {
            setSelectedItems(prev => [...new Set([...prev, ...currentIds])]);
        }
    };

    const clearSelection = () => setSelectedItems([]);

    const selectionState = useMemo(() => {
        const currentIds = filteredBillingMonths.map(b => b.id);
        const selectedFromCurrent = selectedItems.filter(id => currentIds.includes(id));
        return {
            allSelected: currentIds.length > 0 && selectedFromCurrent.length === currentIds.length,
            someSelected: selectedFromCurrent.length > 0 && selectedFromCurrent.length < currentIds.length,
            hasSelection: selectedItems.length > 0,
            selectedFromCurrent
        };
    }, [filteredBillingMonths, selectedItems]);

    const handleBulkDelete = useCallback(async () => {
        if (!selectedItems.length) return;
        setIsDeleting(true);
        try {
            const qty = selectedItems.length;
            await billingMonthService.deleteBulk(selectedItems);
            await fetchBillingMonths();
            setTotals({});
            clearSelection();
            setShowBulkDeleteModal(false);
            toast.success(`${qty} período(s) excluído(s) com sucesso!`);
        } catch (err: any) {
            console.error('Erro ao excluir períodos:', err);
            const msg = err?.response?.data?.message || err?.message || 'Erro ao excluir períodos selecionados';
            toast.error(msg);
        } finally {
            setIsDeleting(false);
        }
    }, [selectedItems, fetchBillingMonths]);

    // ----------- COMPONENTES MOBILE (cards) -----------
    const BillingCard: React.FC<{ billing: BillingMonth }> = ({ billing }) => {
        const total = totals[billing.id] || 0;
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3">
                        {/* Checkbox - apenas para ADMIN */}
                        {isAdmin && (
                            <div className="pt-1">
                                <input
                                    type="checkbox"
                                    checked={selectedItems.includes(billing.id)}
                                    onChange={() => toggleItem(billing.id)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900 text-base leading-tight">
                                        {getMonthLabel(billing.month)} {billing.year}
                                    </h3>
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    #{billing.id}
                  </span>
                                </div>
                                <div className="mt-1">
                                    <StatusBadge status={billing.status} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-1 ml-2">
                        <button
                            onClick={() => handleShowDetails(billing)}
                            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg p-2 transition-colors"
                            title="Gerenciar Orçamentos"
                        >
                            <Eye className="w-5 h-5" />
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => handleDeleteBilling(billing)}
                                className="text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg p-2 transition-colors"
                                title="Excluir"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Infos */}
                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Pagamento:</span>
                        <span className="text-gray-900">{formatDate(billing.paymentDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Valor total:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(total)}</span>
                    </div>
                </div>
            </div>
        );
    };

    // --------------------------------------------------------------

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Faturamento Mensal</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleExportToExcel}
                            disabled={exportLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {exportLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            {exportLoading ? 'Exportando...' : 'Exportar'}
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Novo Período
                            </button>
                        )}
                    </div>
                </div>

                {/* Cards de estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <StatCard
                        title="Total Geral"
                        value={formatCurrency(stats.total)}
                        icon={TrendingUp}
                        color="text-purple-600"
                        subtitle={`${filteredBillingMonths.length} períodos`}
                    />
                    <StatCard
                        title="Pago"
                        value={formatCurrency(stats.paid)}
                        icon={CheckCircle}
                        color="text-green-600"
                        subtitle="Valores recebidos"
                    />
                    <StatCard
                        title="Processando"
                        value={formatCurrency(stats.processing)}
                        icon={Clock}
                        color="text-blue-600"
                        subtitle="Em andamento"
                    />
                    <StatCard
                        title="Pendente"
                        value={formatCurrency(stats.pending)}
                        icon={AlertCircle}
                        color="text-amber-600"
                        subtitle="Aguardando ação"
                    />
                </div>

                {/* Filtros Desktop */}
                <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
                            {(searchTerm || statusFilter || yearFilter || monthFilter) && (
                                <button
                                    onClick={clearAllFilters}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Limpar filtros
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por mês ou ano..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ano</label>
                                <select
                                    value={yearFilter}
                                    onChange={(e) => setYearFilter(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Todos os anos</option>
                                    {years.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mês</label>
                                <select
                                    value={monthFilter}
                                    onChange={(e) => setMonthFilter(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Todos os meses</option>
                                    {monthOptions.map(month => (
                                        <option key={month.value} value={month.value}>{month.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Todos os status</option>
                                    {statusOptions.map(status => (
                                        <option key={status.value} value={status.value}>{status.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ações Desktop quando há seleção */}
                {selectionState.hasSelection && (
                    <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                {selectedItems.length} período(s) selecionado(s)
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={clearSelection}
                                    className="px-3 py-2 text-gray-600 hover:text-gray-800 rounded-lg"
                                >
                                    Limpar seleção
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={() => setShowBulkDeleteModal(true)}
                                        className="inline-flex items-center gap-2 px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Excluir Selecionados
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Busca simples + seleção (Mobile) */}
                <div className="lg:hidden space-y-3">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar por mês ou ano..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                            />
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-3">
                            <button
                                onClick={toggleAll}
                                className="inline-flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                {isAdmin && (
                                    <input
                                        type="checkbox"
                                        checked={selectionState.allSelected}
                                        ref={(input) => { if (input) input.indeterminate = selectionState.someSelected; }}
                                        readOnly
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                )}
                                Selecionar Todos
                            </button>

                            {isAdmin && selectionState.hasSelection && (
                                <button
                                    onClick={() => setShowBulkDeleteModal(true)}
                                    className="inline-flex items-center gap-2 px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Excluir ({selectedItems.length})
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Desktop: Tabela */}
                <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Períodos de Faturamento</h2>
                    </div>

                    {loadingList ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-gray-400" />
                            <p className="text-gray-500">Carregando períodos...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    {/* Checkbox header */}
                                    <th className="px-4 py-3 w-[48px]">
                                        <div className="flex items-center justify-center">
                                            {isAdmin && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectionState.allSelected}
                                                    ref={(input) => { if (input) input.indeterminate = selectionState.someSelected; }}
                                                    onChange={toggleAll}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    title={selectionState.allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                                                />
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagamento</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {filteredBillingMonths.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            <Calendar className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                                            <p>Nenhum período encontrado</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBillingMonths.map((billing) => {
                                        const monthName = getMonthLabel(billing.month);
                                        return (
                                            <tr key={billing.id} className="hover:bg-gray-50 transition-colors">
                                                {/* Checkbox cell */}
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-center">
                                                        {isAdmin && (
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedItems.includes(billing.id)}
                                                                onChange={() => toggleItem(billing.id)}
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                            />
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                            <Calendar className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{monthName} {billing.year}</p>
                                                            <p className="text-sm text-gray-500">ID: #{billing.id}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <StatusBadge status={billing.status} />
                                                </td>

                                                <td className="px-6 py-4 text-gray-900">
                                                    {formatDate(billing.paymentDate)}
                                                </td>

                                                <td className="px-6 py-4">
                                                    {totalsLoading && !(billing.id in totals) ? (
                                                        <span className="inline-flex items-center gap-2 text-gray-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Carregando...
                              </span>
                                                    ) : (
                                                        <p className="font-semibold text-gray-900">{formatCurrency(totals[billing.id] || 0)}</p>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleShowDetails(billing)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            Gerenciar
                                                        </button>
                                                        {isAdmin && (
                                                            <button
                                                                onClick={() => handleDeleteBilling(billing)}
                                                                disabled={loadingList}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Excluir
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Mobile/Tablet: Cards */}
                <div className="lg:hidden">
                    {loadingList ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-gray-400" />
                            <p className="text-gray-500">Carregando períodos...</p>
                        </div>
                    ) : filteredBillingMonths.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                            <Calendar className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                            <p>Nenhum período encontrado</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredBillingMonths.map((billing) => (
                                <BillingCard key={billing.id} billing={billing} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">Novo Período de Faturamento</h3>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Mês *</label>
                                        <select
                                            value={formData.month}
                                            onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value ? Number(e.target.value) : '' }))}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Selecione</option>
                                            {monthOptions.map(month => (
                                                <option key={month.value} value={month.value}>{month.label}</option>
                                            ))}
                                        </select>
                                        {formErrors.month && <p className="mt-1 text-sm text-red-600">{formErrors.month}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ano *</label>
                                        <input
                                            type="number"
                                            value={formData.year}
                                            onChange={(e) => setFormData(prev => ({ ...prev, year: Number(e.target.value) }))}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            min={2020}
                                            max={2035}
                                        />
                                        {formErrors.year && <p className="mt-1 text-sm text-red-600">{formErrors.year}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Pagamento</label>
                                    <input
                                        type="date"
                                        value={formData.paymentDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as StatusValue }))}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {statusOptions.map(status => (
                                            <option key={status.value} value={status.value}>{status.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setFormErrors({});
                                    }}
                                    disabled={createLoading}
                                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateBilling}
                                    disabled={!formData.month || !formData.year || createLoading}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {createLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Criando...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="w-4 h-4" />
                                            Criar Período
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Gerenciamento de Orçamentos foi removido - não existe mais fluxo de quotes */}

                {/* Modal de exclusão em massa */}
                <BulkDeleteModal
                    isOpen={showBulkDeleteModal}
                    onClose={() => setShowBulkDeleteModal(false)}
                    onConfirm={handleBulkDelete}
                    selectedCount={selectedItems.length}
                    isDeleting={isDeleting}
                    entityName="período"
                />
            </div>
        </div>
    );
};

export default BillingManagement;
