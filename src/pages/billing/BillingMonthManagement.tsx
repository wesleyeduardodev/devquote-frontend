import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {toast} from 'react-hot-toast';
import useQuotes from '../../hooks/useQuotes';
import billingMonthService from '../../services/billingMonthService';
import {X, Plus, Loader2, Trash2, FileText, Link2} from 'lucide-react';

/** ========================
 *  Tipos (derivados do hook)
 *  ======================== */
type UseQuotesReturn = ReturnType<typeof useQuotes>;
type QuoteItem = UseQuotesReturn['quotes'][number];

type StatusValue =
    | 'PENDENTE'
    | 'PROCESSANDO'
    | 'FATURADO'
    | 'PAGO'
    | 'ATRASADO'
    | 'CANCELADO';

interface BillingMonth {
    id: number;
    month: number; // 1..12
    year: number;
    paymentDate?: string | null; // ISO (yyyy-MM-dd) ou null
    status: StatusValue;
}

interface QuoteLink {
    id: number;
    quoteBillingMonthId: number;
    quoteId: number;
}

interface CreateBillingMonthDTO {
    month: number;
    year: number;
    paymentDate?: string | null;
    status: StatusValue;
}

/** ========================
 *  Utilitários
 *  ======================== */
const monthOptions = [
    {value: 1, label: 'Janeiro'},
    {value: 2, label: 'Fevereiro'},
    {value: 3, label: 'Março'},
    {value: 4, label: 'Abril'},
    {value: 5, label: 'Maio'},
    {value: 6, label: 'Junho'},
    {value: 7, label: 'Julho'},
    {value: 8, label: 'Agosto'},
    {value: 9, label: 'Setembro'},
    {value: 10, label: 'Outubro'},
    {value: 11, label: 'Novembro'},
    {value: 12, label: 'Dezembro'},
] as const;

const statusOptions: { value: StatusValue; label: string }[] = [
    {value: 'PENDENTE', label: 'Pendente'},
    {value: 'PROCESSANDO', label: 'Processando'},
    {value: 'FATURADO', label: 'Faturado'},
    {value: 'PAGO', label: 'Pago'},
    {value: 'ATRASADO', label: 'Atrasado'},
    {value: 'CANCELADO', label: 'Cancelado'},
];

const currency = new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'});
const fmtMoney = (v: number | string | undefined | null) => currency.format(Number(v || 0));
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('pt-BR') : '-');
const monthLabel = (m: number) => monthOptions.find((x) => x.value === m)?.label ?? String(m);

/** Lê o valor do orçamento independentemente do nome da propriedade vinda do backend */
const getQuoteAmount = (q: QuoteItem): number => {
    const anyQ = q as unknown as {
        totalAmount?: number | string;
        total?: number | string;
        amount?: number | string;
        value?: number | string;
    };
    return Number(anyQ.totalAmount ?? anyQ.total ?? anyQ.amount ?? anyQ.value ?? 0);
};

/** ========================
 *  Componentes menores
 *  ======================== */
const StatusBadge: React.FC<{ status: StatusValue }> = ({status}) => {
    const map: Record<StatusValue, string> = {
        PENDENTE: 'bg-yellow-100 text-yellow-800',
        PROCESSANDO: 'bg-blue-100 text-blue-800',
        FATURADO: 'bg-purple-100 text-purple-800',
        PAGO: 'bg-green-100 text-green-800',
        ATRASADO: 'bg-red-100 text-red-800',
        CANCELADO: 'bg-gray-100 text-gray-800',
    };
    const label = statusOptions.find((s) => s.value === status)?.label ?? status;
    return <span className={`px-2 py-1 text-xs rounded-full font-medium ${map[status]}`}>{label}</span>;
};

const InlineSkeleton: React.FC<{ className?: string }> = ({className}) => (
    <div className={`animate-pulse rounded bg-gray-200 ${className ?? 'h-4 w-20'}`}/>
);

/** ========================
 *  Página
 *  ======================== */
const currentYear = new Date().getFullYear();

const BillingMonthManagement: React.FC = () => {
    /** Lista de faturamentos */
    const [billingMonths, setBillingMonths] = useState<BillingMonth[]>([]);
    const [loadingList, setLoadingList] = useState<boolean>(true);

    /** Totais por período (id -> number) */
    const [totals, setTotals] = useState<Record<number, number>>({});
    const [totalsLoading, setTotalsLoading] = useState<boolean>(false);

    /** Criar período */
    const [showCreate, setShowCreate] = useState<boolean>(false);
    const [createLoading, setCreateLoading] = useState<boolean>(false);
    const [formData, setFormData] = useState<{
        month: number | '';
        year: number;
        paymentDate: string;
        status: StatusValue;
    }>({
        month: '',
        year: currentYear,
        paymentDate: '',
        status: 'PENDENTE',
    });
    const [formErrors, setFormErrors] = useState<Partial<Record<'month' | 'year', string>>>({});

    /** Modal de detalhes */
    const [showManageModal, setShowManageModal] = useState<boolean>(false);
    const [selectedBilling, setSelectedBilling] = useState<BillingMonth | null>(null);
    const [linksLoading, setLinksLoading] = useState<boolean>(false);
    const [links, setLinks] = useState<QuoteLink[]>([]);
    const [linking, setLinking] = useState<boolean>(false);
    const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');

    /** Quotes */
    const {quotes, loading: quotesLoading} = useQuotes();

    /** Buscar faturamentos */
    const fetchBillingMonths = useCallback(async () => {
        setLoadingList(true);
        try {
            const data = (await billingMonthService.findAll()) as BillingMonth[] | undefined;
            setBillingMonths(data ?? []);
        } catch (error: any) {
            console.error('Erro ao carregar faturamentos:', error);
            toast.error(error?.response?.data?.message ?? 'Erro ao carregar faturamentos');
        } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => {
        fetchBillingMonths();
    }, [fetchBillingMonths]);

    /** Carregar/atualizar totais por período */
    useEffect(() => {
        const loadTotals = async () => {
            if (!billingMonths.length || quotesLoading) return;
            setTotalsLoading(true);
            try {
                const entries = await Promise.all(
                    billingMonths.map(async (bm) => {
                        try {
                            const ll = (await billingMonthService.findQuoteLinksByBillingMonth(bm.id)) as QuoteLink[] | undefined;
                            const total = (ll ?? []).reduce((acc, lk) => {
                                const q = quotes.find((qq) => qq.id === lk.quoteId);
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
        };
        loadTotals();
    }, [billingMonths, quotes, quotesLoading]);

    /** Helpers modal */
    const openManageModal = useCallback(async (billing: BillingMonth) => {
        setSelectedBilling(billing);
        setShowManageModal(true);
        setSelectedQuoteId('');
        setLinks([]);
        setLinksLoading(true);
        try {
            const data = (await billingMonthService.findQuoteLinksByBillingMonth(billing.id)) as QuoteLink[] | undefined;
            setLinks(data ?? []);
        } catch (error: any) {
            console.error('Erro ao carregar vínculos:', error);
            toast.error(error?.response?.data?.message ?? 'Erro ao carregar vínculos');
        } finally {
            setLinksLoading(false);
        }
    }, []);

    const linkedQuotesDetailed = useMemo(() => {
        const byId = new Map<number, QuoteItem>(quotes.map((q) => [q.id, q]));
        return links
            .map((lk) => {
                const q = byId.get(lk.quoteId);
                if (!q) return null;
                return {linkId: lk.id, quoteId: lk.quoteId, id: q.id, totalAmount: getQuoteAmount(q)};
            })
            .filter(Boolean) as Array<{ linkId: number; quoteId: number; id: number; totalAmount: number }>;
    }, [links, quotes]);

    const totalLinkedAmount = useMemo(
        () => linkedQuotesDetailed.reduce((acc, q) => acc + (q.totalAmount ?? 0), 0),
        [linkedQuotesDetailed]
    );

    const approvedQuotes = useMemo(
        () => quotes.filter((q) => q.status === 'APROVADO' || q.status === 'APPROVED'),
        [quotes]
    );

    const availableForThisBilling = useMemo(() => {
        const linkedIds = new Set(links.map((l) => l.quoteId));
        return approvedQuotes.filter((q) => !linkedIds.has(q.id));
    }, [approvedQuotes, links]);

    const refreshTotalFor = useCallback(
        async (billingId: number) => {
            try {
                const linksNow = (await billingMonthService.findQuoteLinksByBillingMonth(billingId)) as QuoteLink[] | undefined;
                const total = (linksNow ?? []).reduce((acc, lk) => {
                    const q = quotes.find((qq) => qq.id === lk.quoteId);
                    return acc + (q ? getQuoteAmount(q) : 0);
                }, 0);
                setTotals((t) => ({...t, [billingId]: total}));
            } catch (error) {
                console.error('Erro ao atualizar total:', error);
            }
        },
        [quotes]
    );

    /** Criar período */
    const validateCreate = useCallback((): boolean => {
        const e: Partial<Record<'month' | 'year', string>> = {};
        if (!formData.month) e.month = 'Mês é obrigatório';
        if (!formData.year) e.year = 'Ano é obrigatório';
        setFormErrors(e);
        return Object.keys(e).length === 0;
    }, [formData.month, formData.year]);

    const handleCreate = useCallback(async () => {
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
            setShowCreate(false);
            setFormData({month: '', year: currentYear, paymentDate: '', status: 'PENDENTE'});
            setFormErrors({});
            toast.success('Período criado com sucesso!');
        } catch (error: any) {
            console.error('Erro ao criar período:', error);
            toast.error(error?.response?.data?.message ?? 'Erro ao criar período');
        } finally {
            setCreateLoading(false);
        }
    }, [fetchBillingMonths, formData, validateCreate]);

    /** Vincular/Desvincular orçamento */
    const linkQuote = useCallback(async () => {
        if (!selectedQuoteId || !selectedBilling) {
            toast.error('Selecione um orçamento aprovado.');
            return;
        }
        setLinking(true);
        try {
            await billingMonthService.createQuoteLink({
                quoteBillingMonthId: selectedBilling.id,
                quoteId: Number(selectedQuoteId),
            });
            const data = (await billingMonthService.findQuoteLinksByBillingMonth(selectedBilling.id)) as QuoteLink[] | undefined;
            setLinks(data ?? []);
            setSelectedQuoteId('');
            await refreshTotalFor(selectedBilling.id);
            toast.success('Orçamento vinculado com sucesso!');
        } catch (error: any) {
            console.error('Erro ao vincular orçamento:', error);
            toast.error(error?.response?.data?.message ?? 'Erro ao vincular orçamento');
        } finally {
            setLinking(false);
        }
    }, [selectedBilling, selectedQuoteId, refreshTotalFor]);

    const unlinkQuote = useCallback(
        async (linkId: number) => {
            if (!selectedBilling) return;
            if (!window.confirm('Deseja realmente remover este vínculo?')) return;
            setLinking(true);
            try {
                await billingMonthService.deleteQuoteLink(linkId);
                setLinks((prev) => prev.filter((l) => l.id !== linkId));
                await refreshTotalFor(selectedBilling.id);
                toast.success('Vínculo removido!');
            } catch (error: any) {
                console.error('Erro ao desvincular orçamento:', error);
                toast.error(error?.response?.data?.message ?? 'Erro ao desvincular orçamento');
            } finally {
                setLinking(false);
            }
        },
        [selectedBilling, refreshTotalFor]
    );

    /** Excluir período */
    const deleteBillingMonth = useCallback(
        async (billingMonth: BillingMonth) => {
            const hasValue = (totals[billingMonth.id] ?? 0) > 0;
            let confirmMessage = `Deseja realmente excluir o faturamento de ${monthLabel(billingMonth.month)}/${billingMonth.year}?`;
            if (hasValue) {
                confirmMessage += '\n\nATENÇÃO: Este período possui orçamentos vinculados.';
            }
            if (!window.confirm(confirmMessage)) return;

            setLoadingList(true);
            try {
                await billingMonthService.delete(billingMonth.id);
                setBillingMonths((prev) => prev.filter((bm) => bm.id !== billingMonth.id));
                setTotals((prev) => {
                    const {[billingMonth.id]: _, ...rest} = prev;
                    return rest;
                });
                toast.success('Período excluído com sucesso!');
            } catch (error: any) {
                console.error('Erro ao excluir período:', error);
                toast.error(error?.response?.data?.message ?? 'Erro ao excluir período');
            } finally {
                setLoadingList(false);
            }
        },
        [totals]
    );

    /** ========================
     *  Render
     *  ======================== */
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Faturamento Mensal</h1>
                    <p className="text-gray-600 mt-1">Liste os períodos e gerencie os orçamentos vinculados</p>
                </div>
                <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    onClick={() => setShowCreate((v) => !v)}
                    aria-expanded={showCreate}
                >
                    <Plus className="w-4 h-4"/>
                    {showCreate ? 'Fechar' : 'Novo Faturamento'}
                </button>
            </div>

            {/* Criar novo período */}
            {showCreate && (
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                                Mês *
                            </label>
                            <select
                                id="month"
                                value={formData.month}
                                onChange={(e) => setFormData((p) => ({
                                    ...p,
                                    month: e.target.value ? Number(e.target.value) : ''
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Selecione</option>
                                {monthOptions.map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.label}
                                    </option>
                                ))}
                            </select>
                            {formErrors.month && <p className="mt-1 text-sm text-red-600">{formErrors.month}</p>}
                        </div>

                        <div>
                            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                                Ano *
                            </label>
                            <input
                                id="year"
                                type="number"
                                value={formData.year}
                                onChange={(e) => setFormData((p) => ({...p, year: Number(e.target.value)}))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                min={2020}
                                max={2035}
                            />
                            {formErrors.year && <p className="mt-1 text-sm text-red-600">{formErrors.year}</p>}
                        </div>

                        <div>
                            <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Data de Pagamento
                            </label>
                            <input
                                id="paymentDate"
                                type="date"
                                value={formData.paymentDate}
                                onChange={(e) => setFormData((p) => ({...p, paymentDate: e.target.value}))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                id="status"
                                value={formData.status}
                                onChange={(e) => setFormData((p) => ({...p, status: e.target.value as StatusValue}))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                {statusOptions.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            className="px-4 py-2 border border-gray-300 rounded-md"
                            onClick={() => {
                                setShowCreate(false);
                                setFormErrors({});
                            }}
                            disabled={createLoading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            onClick={handleCreate}
                            disabled={createLoading}
                        >
                            {createLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin"/>
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4"/>
                                    Salvar Período
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Lista de faturamentos */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Períodos de Faturamento</h2>
                </div>

                {loadingList ? (
                    <div className="p-8 space-y-3">
                        <InlineSkeleton className="h-5 w-40"/>
                        <InlineSkeleton className="h-5 w-72"/>
                        <InlineSkeleton className="h-5 w-64"/>
                    </div>
                ) : billingMonths.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">Nenhum período cadastrado.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mês/Ano</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor
                                    Total
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                            {billingMonths.map((bm) => (
                                <tr key={bm.id}>
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <span
                                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                            #{bm.id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap">{monthLabel(bm.month)} / {bm.year}</td>
                                    <td className="px-6 py-3 whitespace-nowrap">{fmtDate(bm.paymentDate ?? null)}</td>
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <StatusBadge status={bm.status}/>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap font-medium text-green-700">
                                        {totalsLoading && !(bm.id in totals) ? (
                                            <span className="inline-flex items-center gap-2 text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin"/>
                          Carregando...
                        </span>
                                        ) : (
                                            fmtMoney(totals[bm.id] ?? 0)
                                        )}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-2 px-3 py-1.5 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50"
                                                onClick={() => openManageModal(bm)}
                                                aria-label={`Detalhes de ${monthLabel(bm.month)}/${bm.year}`}
                                            >
                                                <Link2 className="w-4 h-4"/>
                                                Detalhes
                                            </button>
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-2 px-3 py-1.5 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50"
                                                onClick={() => deleteBillingMonth(bm)}
                                                disabled={loadingList}
                                                aria-label={`Excluir ${monthLabel(bm.month)}/${bm.year}`}
                                            >
                                                <Trash2 className="w-4 h-4"/>
                                                Excluir
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de gerenciamento */}
            {showManageModal && selectedBilling && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                        <div className="p-6 border-b flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Faturamento: {monthLabel(selectedBilling.month)} / {selectedBilling.year}
                                    </h3>
                                    <span
                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                        #{selectedBilling.id}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">Gerencie os orçamentos deste período</p>
                            </div>
                            <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600"
                                onClick={() => setShowManageModal(false)}
                                aria-label="Fechar"
                            >
                                <X className="w-6 h-6"/>
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
                            {/* Combo para vincular */}
                            <div className="flex items-end gap-3">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Selecionar Orçamento (APROVADO)
                                    </label>
                                    <select
                                        value={selectedQuoteId}
                                        onChange={(e) => setSelectedQuoteId(e.target.value)}
                                        disabled={quotesLoading || linksLoading}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Selecione...</option>
                                        {availableForThisBilling.map((q) => (
                                            <option key={q.id} value={q.id}>
                                                #{q.id} • {fmtMoney(getQuoteAmount(q))}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                    onClick={linkQuote}
                                    disabled={!selectedQuoteId || linking}
                                >
                                    {linking ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin"/>
                                            Vinculando...
                                        </>
                                    ) : (
                                        <>
                                            <Link2 className="w-4 h-4"/>
                                            Vincular
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Lista dos vinculados */}
                            <div className="bg-gray-50 rounded-md border">
                                <div className="px-4 py-3 border-b flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            Orçamentos Vinculados ({linkedQuotesDetailed.length})
                                        </p>
                                        <p className="text-xs text-gray-500">Total: {fmtMoney(totalLinkedAmount)}</p>
                                    </div>
                                </div>

                                {linksLoading ? (
                                    <div className="p-6 text-center text-gray-500">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin"/>
                      Carregando...
                    </span>
                                    </div>
                                ) : linkedQuotesDetailed.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500">Nenhum orçamento vinculado.</div>
                                ) : (
                                    <ul className="divide-y">
                                        {linkedQuotesDetailed.map((q) => (
                                            <li key={q.linkId} className="flex items-center justify-between px-4 py-3">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="w-10 h-10 bg-blue-100 rounded-lg grid place-items-center">
                                                        <FileText className="w-5 h-5 text-blue-600"/>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-gray-900">Orçamento
                                                                #{q.id}</p>
                                                            <span
                                                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                                Link #{q.linkId}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600">Valor: {fmtMoney(q.totalAmount)}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50"
                                                    onClick={() => unlinkQuote(q.linkId)}
                                                    disabled={linking}
                                                >
                                                    <Trash2 className="w-4 h-4"/>
                                                    Remover
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t flex justify-end">
                            <button
                                type="button"
                                className="px-4 py-2 border border-gray-300 rounded-md"
                                onClick={() => setShowManageModal(false)}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingMonthManagement;
