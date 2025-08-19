import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
    Plus,
    Calendar,
    DollarSign,
    FileText,
    Link2,
    Trash2,
    Edit3,
    X,
    ChevronDown,
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle,
    Search,
    Filter,
    Download,
    Eye,
    TrendingUp,
    Loader2,
    Hash,
    Tag
} from 'lucide-react';

// Importações dos seus hooks e serviços existentes
import useQuotes from '../../hooks/useQuotes';
import billingMonthService from '../../services/billingMonthService';

// Tipos baseados no seu código existente
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

// Opções dos seus dados existentes
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

const BillingManagement = () => {
    // Estados para lista de faturamentos
    const [billingMonths, setBillingMonths] = useState<BillingMonth[]>([]);
    const [loadingList, setLoadingList] = useState(true);

    // Estados para totais
    const [totals, setTotals] = useState<Record<number, number>>({});
    const [totalsLoading, setTotalsLoading] = useState(false);

    // Estados para modais
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showQuoteSelectModal, setShowQuoteSelectModal] = useState(false);
    const [selectedBilling, setSelectedBilling] = useState<BillingMonth | null>(null);
    const [createLoading, setCreateLoading] = useState(false);

    // Estados para filtros melhorados
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('');

    // Estados para gerenciamento de vínculos
    const [links, setLinks] = useState<QuoteLink[]>([]);
    const [linksLoading, setLinksLoading] = useState(false);
    const [linking, setLinking] = useState(false);
    const [selectedQuoteId, setSelectedQuoteId] = useState('');

    // Estados para modal de seleção de quotes
    const [quoteSearchTerm, setQuoteSearchTerm] = useState('');
    const [quoteStatusFilter, setQuoteStatusFilter] = useState('APPROVED');

    // Form state
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

    // Hook para quotes
    const { quotes, loading: quotesLoading } = useQuotes();

    // Função para obter valor do orçamento (usando sua lógica existente)
    const getQuoteAmount = useCallback((q: any): number => {
        const anyQ = q as unknown as {
            totalAmount?: number | string;
            total?: number | string;
            amount?: number | string;
            value?: number | string;
        };
        return Number(anyQ.totalAmount ?? anyQ.total ?? anyQ.amount ?? anyQ.value ?? 0);
    }, []);

    // Funções de formatação (suas existentes)
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

    // Buscar faturamentos (sua lógica existente)
    const fetchBillingMonths = useCallback(async () => {
        setLoadingList(true);
        try {
            const data = await billingMonthService.findAll() as BillingMonth[] | undefined;
            setBillingMonths(data ?? []);
        } catch (error: any) {
            console.error('Erro ao carregar faturamentos:', error);
            toast.error(error?.response?.data?.message ?? 'Erro ao carregar faturamentos');
        } finally {
            setLoadingList(false);
        }
    }, []);

    // Carregar totais (sua lógica existente adaptada)
    const loadTotals = useCallback(async () => {
        if (!billingMonths.length || quotesLoading) return;
        setTotalsLoading(true);
        try {
            const entries = await Promise.all(
                billingMonths.map(async (bm) => {
                    try {
                        const ll = await billingMonthService.findQuoteLinksByBillingMonth(bm.id) as QuoteLink[] | undefined;
                        const total = (ll ?? []).reduce((acc, lk) => {
                            const q = quotes.find(qq => qq.id === lk.quoteId);
                            return acc + (q ? getQuoteAmount(q) : 0);
                        }, 0);
                        return [bm.id, total] as const;
                    } catch (error) {
                        console.error(`Erro ao carregar vínculos do período ${bm.id}:`, error);
                        return [bm.id, 0] as const;
                    }
                })
            );
            setTotals(Object.fromEntries(entries));
        } catch (error) {
            console.error('Erro ao carregar totais:', error);
        } finally {
            setTotalsLoading(false);
        }
    }, [billingMonths, quotes, quotesLoading, getQuoteAmount]);

    // Effects
    useEffect(() => {
        fetchBillingMonths();
    }, [fetchBillingMonths]);

    useEffect(() => {
        loadTotals();
    }, [loadTotals]);

    // Filtros aprimorados
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
        });
    }, [billingMonths, searchTerm, statusFilter, yearFilter, monthFilter, getMonthLabel]);

    // Estatísticas baseadas nos filtros
    const stats = useMemo(() => {
        const filteredData = filteredBillingMonths;
        const total = filteredData.reduce((sum, b) => sum + (totals[b.id] || 0), 0);
        const paid = filteredData.filter(b => b.status === 'PAGO').reduce((sum, b) => sum + (totals[b.id] || 0), 0);
        const pending = filteredData.filter(b => b.status === 'PENDENTE').reduce((sum, b) => sum + (totals[b.id] || 0), 0);
        const processing = filteredData.filter(b => b.status === 'PROCESSANDO').reduce((sum, b) => sum + (totals[b.id] || 0), 0);

        return { total, paid, pending, processing };
    }, [filteredBillingMonths, totals]);

    // Quotes aprovados disponíveis
    const approvedQuotes = useMemo(() => {
        return quotes.filter(q => q.status === 'APROVADO' || q.status === 'APPROVED');
    }, [quotes]);

    const availableQuotes = useMemo(() => {
        const linkedIds = new Set(links.map(l => l.quoteId));
        return approvedQuotes.filter(q => !linkedIds.has(q.id));
    }, [approvedQuotes, links]);

    // Filtrar quotes para o modal de seleção
    const filteredQuotesForSelection = useMemo(() => {
        return availableQuotes.filter(quote => {
            const matchesSearch = quoteSearchTerm === '' ||
                quote.taskName?.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
                quote.taskCode?.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
                quote.id.toString().includes(quoteSearchTerm);
            const matchesStatus = quoteStatusFilter === '' || quote.status === quoteStatusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [availableQuotes, quoteSearchTerm, quoteStatusFilter]);

    // Dados dos quotes vinculados
    const linkedQuotesDetailed = useMemo(() => {
        const byId = new Map(quotes.map(q => [q.id, q]));
        return links
            .map(lk => {
                const q = byId.get(lk.quoteId);
                if (!q) return null;
                return {
                    linkId: lk.id,
                    quoteId: lk.quoteId,
                    id: q.id,
                    totalAmount: getQuoteAmount(q),
                    quote: q
                };
            })
            .filter(Boolean) as Array<{
            linkId: number;
            quoteId: number;
            id: number;
            totalAmount: number;
            quote: any;
        }>;
    }, [links, quotes, getQuoteAmount]);

    const totalLinkedAmount = useMemo(
        () => linkedQuotesDetailed.reduce((acc, q) => acc + (q.totalAmount ?? 0), 0),
        [linkedQuotesDetailed]
    );

    // Validação do formulário
    const validateCreate = useCallback((): boolean => {
        const e: Partial<Record<'month' | 'year', string>> = {};
        if (!formData.month) e.month = 'Mês é obrigatório';
        if (!formData.year) e.year = 'Ano é obrigatório';
        setFormErrors(e);
        return Object.keys(e).length === 0;
    }, [formData.month, formData.year]);

    // Handlers
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
        setShowDetailsModal(true);
        setSelectedQuoteId('');
        setLinks([]);
        setLinksLoading(true);
        try {
            const data = await billingMonthService.findQuoteLinksByBillingMonth(billing.id) as QuoteLink[] | undefined;
            setLinks(data ?? []);
        } catch (error: any) {
            console.error('Erro ao carregar vínculos:', error);
            toast.error(error?.response?.data?.message ?? 'Erro ao carregar vínculos');
        } finally {
            setLinksLoading(false);
        }
    }, []);

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

    const handleLinkQuote = useCallback(async (quoteId: number) => {
        if (!selectedBilling) {
            toast.error('Erro: Período não selecionado.');
            return;
        }
        setLinking(true);
        try {
            await billingMonthService.createQuoteLink({
                quoteBillingMonthId: selectedBilling.id,
                quoteId: quoteId,
            });
            const data = await billingMonthService.findQuoteLinksByBillingMonth(selectedBilling.id) as QuoteLink[] | undefined;
            setLinks(data ?? []);
            setShowQuoteSelectModal(false);
            setQuoteSearchTerm('');
            setQuoteStatusFilter('APPROVED');
            // Atualizar total
            await loadTotals();
            toast.success('Orçamento vinculado com sucesso!');
        } catch (error: any) {
            console.error('Erro ao vincular orçamento:', error);
            toast.error(error?.response?.data?.message ?? 'Erro ao vincular orçamento');
        } finally {
            setLinking(false);
        }
    }, [selectedBilling, loadTotals]);

    const handleUnlinkQuote = useCallback(async (linkId: number) => {
        if (!selectedBilling) return;
        if (!window.confirm('Deseja realmente remover este vínculo?')) return;
        setLinking(true);
        try {
            await billingMonthService.deleteQuoteLink(linkId);
            setLinks(prev => prev.filter(l => l.id !== linkId));
            await loadTotals();
            toast.success('Vínculo removido!');
        } catch (error: any) {
            console.error('Erro ao desvincular orçamento:', error);
            toast.error(error?.response?.data?.message ?? 'Erro ao desvincular orçamento');
        } finally {
            setLinking(false);
        }
    }, [selectedBilling, loadTotals]);

    const clearAllFilters = useCallback(() => {
        setSearchTerm('');
        setStatusFilter('');
        setYearFilter('');
        setMonthFilter('');
    }, []);

    // Componentes auxiliares
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

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Faturamento Mensal</h1>
                        <p className="text-gray-600 mt-1">Gerencie períodos de faturamento e orçamentos vinculados</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <Download className="w-4 h-4" />
                            Exportar
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Novo Período
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                {/* Filters Aprimorados */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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

                {/* Billing Periods Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            <Calendar className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                                            <p>Nenhum período encontrado</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBillingMonths.map((billing) => {
                                        const monthName = getMonthLabel(billing.month);

                                        return (
                                            <tr key={billing.id} className="hover:bg-gray-50 transition-colors">
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
                                                            Detalhes
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteBilling(billing)}
                                                            disabled={loadingList}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Excluir
                                                        </button>
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
                                <div className="grid grid-cols-2 gap-4">
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
                                            min="2020"
                                            max="2030"
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

                {/* Quote Selection Modal */}
                {showQuoteSelectModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Selecionar Orçamento</h3>
                                        <p className="text-gray-600 mt-1">Escolha um orçamento aprovado para vincular</p>
                                    </div>
                                    <button
                                        onClick={() => setShowQuoteSelectModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Filtros do modal */}
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="text"
                                                placeholder="Buscar por ID, código ou nome da tarefa..."
                                                value={quoteSearchTerm}
                                                onChange={(e) => setQuoteSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                        <select
                                            value={quoteStatusFilter}
                                            onChange={(e) => setQuoteStatusFilter(e.target.value)}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Todos os status</option>
                                            <option value="APPROVED">Aprovado</option>
                                            <option value="PENDING">Pendente</option>
                                            <option value="DRAFT">Rascunho</option>
                                            <option value="REJECTED">Rejeitado</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 max-h-[calc(90vh-240px)] overflow-y-auto">
                                {quotesLoading ? (
                                    <div className="p-8 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-gray-400" />
                                        <p className="text-gray-500">Carregando orçamentos...</p>
                                    </div>
                                ) : filteredQuotesForSelection.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        <FileText className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                                        <p>Nenhum orçamento disponível para vinculação</p>
                                        <p className="text-xs text-gray-400 mt-1">Todos os orçamentos aprovados já estão vinculados ou não há orçamentos aprovados</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome da Tarefa</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                            {filteredQuotesForSelection.map((quote) => (
                                                <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                #{quote.id}
                              </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Hash className="w-4 h-4 text-gray-400" />
                                                            <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  {quote.taskCode}
                                </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-gray-400" />
                                                            <div>
                                                                <p className="font-medium text-gray-900 max-w-xs truncate" title={quote.taskName}>
                                                                    {quote.taskName}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getQuoteStatusColor(quote.status)}`}>
                                {getQuoteStatusLabel(quote.status)}
                              </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-1">
                                                            <DollarSign className="w-4 h-4 text-green-600" />
                                                            <span className="text-sm font-semibold text-green-600">
                                  {formatCurrency(getQuoteAmount(quote))}
                                </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <button
                                                            onClick={() => handleLinkQuote(quote.id)}
                                                            disabled={linking}
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                                                        >
                                                            {linking ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                    Vinculando...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Link2 className="w-4 h-4" />
                                                                    Vincular
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={() => setShowQuoteSelectModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Details Modal */}
                {showDetailsModal && selectedBilling && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Faturamento: {getMonthLabel(selectedBilling.month)} {selectedBilling.year}
                                            </h3>
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                        #{selectedBilling.id}
                      </span>
                                            <StatusBadge status={selectedBilling.status} />
                                        </div>
                                        <p className="text-gray-600">Gerencie os orçamentos vinculados a este período</p>
                                    </div>
                                    <button
                                        onClick={() => setShowDetailsModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto space-y-6">
                                {/* Informações do período */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Data de Pagamento:</span>
                                            <p className="font-medium">{formatDate(selectedBilling.paymentDate)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Total Vinculado:</span>
                                            <p className="font-medium text-green-600">{formatCurrency(totalLinkedAmount)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Orçamentos:</span>
                                            <p className="font-medium">{linkedQuotesDetailed.length}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Vincular novo orçamento */}
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                        <Link2 className="w-4 h-4" />
                                        Vincular Novo Orçamento
                                    </h4>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowQuoteSelectModal(true)}
                                            disabled={quotesLoading || linksLoading}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Selecionar Orçamento
                                        </button>
                                        <div className="text-sm text-gray-600 self-center">
                                            {availableQuotes.length} orçamentos disponíveis para vinculação
                                        </div>
                                    </div>
                                </div>

                                {/* Orçamentos vinculados */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            Orçamentos Vinculados ({linkedQuotesDetailed.length})
                                        </h4>
                                        <p className="text-sm text-green-600 font-medium">{formatCurrency(totalLinkedAmount)}</p>
                                    </div>

                                    {linksLoading ? (
                                        <div className="p-8 text-center text-gray-500">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
                                            <p>Carregando orçamentos vinculados...</p>
                                        </div>
                                    ) : linkedQuotesDetailed.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                                            <FileText className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                                            <p>Nenhum orçamento vinculado a este período</p>
                                            <p className="text-xs text-gray-400 mt-1">Use o botão acima para vincular orçamentos aprovados</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {linkedQuotesDetailed.map((item) => (
                                                <div key={item.linkId} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                            <FileText className="w-6 h-6 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="font-medium text-gray-900">Orçamento #{item.id}</p>
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                  Link #{item.linkId}
                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600">Valor: {formatCurrency(item.totalAmount)}</p>
                                                            {item.quote.taskCode && (
                                                                <p className="text-xs text-gray-500">Código: {item.quote.taskCode}</p>
                                                            )}
                                                            {item.quote.taskName && (
                                                                <p className="text-xs text-gray-500 max-w-md truncate" title={item.quote.taskName}>
                                                                    Tarefa: {item.quote.taskName}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleUnlinkQuote(item.linkId)}
                                                        disabled={linking}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Remover
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillingManagement;