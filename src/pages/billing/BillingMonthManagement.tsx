import React, { useEffect, useMemo, useState } from 'react';
import useQuotes from '../../hooks/useQuotes';
import billingMonthService from '../../services/billingMonthService';

const BillingMonthManagement = () => {
  // Lista de faturamentos
  const [billingMonths, setBillingMonths] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Totais por período (id -> number)
  const [totals, setTotals] = useState({});
  const [totalsLoading, setTotalsLoading] = useState(false);

  // Criar período
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    month: '',
    year: new Date().getFullYear(),
    paymentDate: '',
    status: 'PENDENTE',
  });
  const [formErrors, setFormErrors] = useState({});

  // Modal de detalhes (gerenciar vínculos)
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [linksLoading, setLinksLoading] = useState(false);
  const [links, setLinks] = useState([]); // [{id, quoteBillingMonthId, quoteId}]
  const [linking, setLinking] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState('');

  // Quotes (combo e totais)
  const { quotes, loading: quotesLoading } = useQuotes();

  const monthOptions = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' },
  ];

  const statusOptions = [
    { value: 'PENDENTE', label: 'Pendente' },
    { value: 'PROCESSANDO', label: 'Processando' },
    { value: 'FATURADO', label: 'Faturado' },
    { value: 'PAGO', label: 'Pago' },
    { value: 'ATRASADO', label: 'Atrasado' },
    { value: 'CANCELADO', label: 'Cancelado' },
  ];

  // Helpers
  const fmtMoney = (v) => (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('pt-BR') : '-');
  const monthLabel = (m) => monthOptions.find((x) => x.value === m)?.label ?? m;
  const statusBadge = (status) => {
    const map = {
      PENDENTE: 'bg-yellow-100 text-yellow-800',
      PROCESSANDO: 'bg-blue-100 text-blue-800',
      FATURADO: 'bg-purple-100 text-purple-800',
      PAGO: 'bg-green-100 text-green-800',
      ATRASADO: 'bg-red-100 text-red-800',
      CANCELADO: 'bg-gray-100 text-gray-800',
    };
    const label = statusOptions.find((s) => s.value === status)?.label || status;
    return <span className={`px-2 py-1 text-xs rounded-full font-medium ${map[status] || map.PENDENTE}`}>{label}</span>;
  };

  // Carrega faturamentos
  const fetchBillingMonths = async () => {
    setLoadingList(true);
    try {
      const data = await billingMonthService.findAll();
      setBillingMonths(data || []);
    } catch (error) {
      console.error('Erro ao carregar faturamentos:', error);
      alert('Erro ao carregar faturamentos');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchBillingMonths(); }, []);

  // ✅ OTIMIZADO: Carrega/atualiza totais por período usando a nova rota
  useEffect(() => {
    const loadTotals = async () => {
      if (!billingMonths.length || quotesLoading) return;
      setTotalsLoading(true);
      try {
        const entries = await Promise.all(
            billingMonths.map(async (bm) => {
              try {
                // Usa a nova rota otimizada
                const links = await billingMonthService.findQuoteLinksByBillingMonth(bm.id);
                const total = (links || []).reduce((acc, lk) => {
                  const q = quotes.find((qq) => qq.id === lk.quoteId);
                  return acc + (Number(q?.totalAmount) || 0);
                }, 0);
                return [bm.id, total];
              } catch (error) {
                console.error(`Erro ao carregar vínculos do período ${bm.id}:`, error);
                return [bm.id, 0]; // Em caso de erro, assume 0
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

  // Criar
  const validateCreate = () => {
    const e = {};
    if (!formData.month) e.month = 'Mês é obrigatório';
    if (!formData.year) e.year = 'Ano é obrigatório';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validateCreate()) return;
    setCreateLoading(true);
    try {
      await billingMonthService.create(formData);
      await fetchBillingMonths();
      setShowCreate(false);
      setFormData({ month: '', year: new Date().getFullYear(), paymentDate: '', status: 'PENDENTE' });
      setFormErrors({});
    } catch (error) {
      console.error('Erro ao criar período:', error);
      alert(error.response?.data?.message || 'Erro ao criar período');
    } finally {
      setCreateLoading(false);
    }
  };

  // ✅ OTIMIZADO: Abrir modal de gerenciamento usando nova rota
  const openManageModal = async (billing) => {
    setSelectedBilling(billing);
    setShowManageModal(true);
    setSelectedQuoteId('');
    setLinks([]);
    setLinksLoading(true);
    try {
      const data = await billingMonthService.findQuoteLinksByBillingMonth(billing.id);
      setLinks(data || []);
    } catch (error) {
      console.error('Erro ao carregar vínculos:', error);
      alert('Erro ao carregar vínculos');
    } finally {
      setLinksLoading(false);
    }
  };

  // Dados detalhados dos vínculos
  const linkedQuotesDetailed = useMemo(() => {
    const byId = new Map(quotes.map((q) => [q.id, q]));
    return links.map((lk) => ({
      linkId: lk.id,
      ...byId.get(lk.quoteId),
      quoteId: lk.quoteId
    })).filter(Boolean);
  }, [links, quotes]);

  const totalLinkedAmount = linkedQuotesDetailed.reduce((acc, q) => acc + (Number(q?.totalAmount) || 0), 0);

  // ✅ CORRIGIDO: Combo - orçamentos APROVADO e que não estão vinculados no período
  const approvedQuotes = useMemo(() => {
    // Aceita tanto APROVADO quanto APPROVED
    return quotes.filter((q) => q.status === 'APROVADO' || q.status === 'APPROVED');
  }, [quotes]);

  const availableForThisBilling = useMemo(() => {
    const linkedIds = new Set(links.map((l) => l.quoteId));
    return approvedQuotes.filter((q) => !linkedIds.has(q.id));
  }, [approvedQuotes, links]);

  // ✅ OTIMIZADO: Função para atualizar total específico
  const refreshTotalFor = async (billingId) => {
    try {
      const linksNow = await billingMonthService.findQuoteLinksByBillingMonth(billingId);
      const total = (linksNow || []).reduce((acc, lk) => {
        const q = quotes.find((qq) => qq.id === lk.quoteId);
        return acc + (Number(q?.totalAmount) || 0);
      }, 0);
      setTotals((t) => ({ ...t, [billingId]: total }));
    } catch (error) {
      console.error('Erro ao atualizar total:', error);
    }
  };

  const linkQuote = async () => {
    if (!selectedQuoteId || !selectedBilling) {
      alert('Selecione um orçamento');
      return;
    }

    setLinking(true);
    try {
      await billingMonthService.createQuoteLink({
        quoteBillingMonthId: selectedBilling.id,
        quoteId: Number(selectedQuoteId)
      });

      // Recarrega vínculos usando a nova rota
      const data = await billingMonthService.findQuoteLinksByBillingMonth(selectedBilling.id);
      setLinks(data || []);
      setSelectedQuoteId(''); // Limpa seleção

      // Atualiza o total na lista principal
      await refreshTotalFor(selectedBilling.id);
    } catch (error) {
      console.error('Erro ao vincular orçamento:', error);
      alert(error.response?.data?.message || 'Erro ao vincular orçamento');
    } finally {
      setLinking(false);
    }
  };

  const unlinkQuote = async (linkId) => {
    if (!window.confirm('Deseja realmente remover este vínculo?')) return;

    setLinking(true);
    try {
      await billingMonthService.deleteQuoteLink(linkId);
      const newLinks = links.filter((l) => l.id !== linkId);
      setLinks(newLinks);

      // Atualiza o total na lista principal
      await refreshTotalFor(selectedBilling.id);
    } catch (error) {
      console.error('Erro ao desvincular orçamento:', error);
      alert(error.response?.data?.message || 'Erro ao desvincular orçamento');
    } finally {
      setLinking(false);
    }
  };

  // ✅ NOVO: Função para excluir período de faturamento
  const deleteBillingMonth = async (billingMonth) => {
    const hasLinks = totals[billingMonth.id] > 0;

    let confirmMessage = `Deseja realmente excluir o faturamento de ${monthLabel(billingMonth.month)}/${billingMonth.year}?`;
    if (hasLinks) {
      confirmMessage += '\n\nATENÇÃO: Este período possui orçamentos vinculados que também serão removidos.';
    }

    if (!window.confirm(confirmMessage)) return;

    setLoadingList(true);
    try {
      await billingMonthService.delete(billingMonth.id);

      // Remove da lista local
      setBillingMonths(prev => prev.filter(bm => bm.id !== billingMonth.id));

      // Remove do cache de totais
      setTotals(prev => {
        const newTotals = { ...prev };
        delete newTotals[billingMonth.id];
        return newTotals;
      });

      alert('Período de faturamento excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir período:', error);
      alert(error.response?.data?.message || 'Erro ao excluir período de faturamento');
    } finally {
      setLoadingList(false);
    }
  };

  return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Faturamento Mensal</h1>
            <p className="text-gray-600 mt-1">Liste os períodos e gerencie os orçamentos vinculados</p>
          </div>
          <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => setShowCreate((v) => !v)}
          >
            {showCreate ? 'Fechar' : '+ Novo Faturamento'}
          </button>
        </div>

        {/* Criar novo período */}
        {showCreate && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mês *</label>
                  <select
                      value={formData.month}
                      onChange={(e) => setFormData((p) => ({ ...p, month: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione</option>
                    {monthOptions.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  {formErrors.month && <p className="mt-1 text-sm text-red-600">{formErrors.month}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ano *</label>
                  <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData((p) => ({ ...p, year: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="2020" max="2030"
                  />
                  {formErrors.year && <p className="mt-1 text-sm text-red-600">{formErrors.year}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Pagamento</label>
                  <input
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData((p) => ({ ...p, paymentDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                      value={formData.status}
                      onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    onClick={handleCreate}
                    disabled={createLoading}
                >
                  {createLoading ? 'Salvando...' : 'Salvar Período'}
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
              <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : billingMonths.length === 0 ? (
              <div className="p-12 text-center text-gray-500">Nenhum período cadastrado.</div>
          ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mês/Ano</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                  {billingMonths.map((bm) => (
                      <tr key={bm.id}>
                        <td className="px-6 py-3 whitespace-nowrap">{monthLabel(bm.month)} / {bm.year}</td>
                        <td className="px-6 py-3 whitespace-nowrap">{fmtDate(bm.paymentDate)}</td>
                        <td className="px-6 py-3 whitespace-nowrap">{statusBadge(bm.status)}</td>
                        <td className="px-6 py-3 whitespace-nowrap font-medium text-green-600">
                          {totalsLoading && !(bm.id in totals) ? (
                              <span className="text-gray-400">Carregando...</span>
                          ) : (
                              `R$ ${fmtMoney(totals[bm.id] || 0)}`
                          )}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                                className="px-3 py-1.5 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50"
                                onClick={() => openManageModal(bm)}
                            >
                              Detalhes
                            </button>
                            <button
                                className="px-3 py-1.5 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50"
                                onClick={() => deleteBillingMonth(bm)}
                                disabled={loadingList}
                            >
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
                    <h3 className="text-lg font-semibold text-gray-900">
                      Faturamento: {monthLabel(selectedBilling.month)} / {selectedBilling.year}
                    </h3>
                    <p className="text-sm text-gray-600">Gerencie os orçamentos deste período</p>
                  </div>
                  <button
                      className="text-gray-400 hover:text-gray-600"
                      onClick={() => setShowManageModal(false)}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
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
                              #{q.id} • R$ {fmtMoney(q.totalAmount)}
                            </option>
                        ))}
                      </select>
                    </div>
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        onClick={linkQuote}
                        disabled={!selectedQuoteId || linking}
                    >
                      {linking ? 'Vinculando...' : 'Vincular'}
                    </button>
                  </div>

                  {/* Lista dos vinculados */}
                  <div className="bg-gray-50 rounded-md border">
                    <div className="px-4 py-3 border-b flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Orçamentos Vinculados ({linkedQuotesDetailed.length})</p>
                        <p className="text-xs text-gray-500">Total: R$ {fmtMoney(totalLinkedAmount)}</p>
                      </div>
                    </div>

                    {linksLoading ? (
                        <div className="p-6 text-center text-gray-500">Carregando...</div>
                    ) : linkedQuotesDetailed.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">Nenhum orçamento vinculado.</div>
                    ) : (
                        <ul className="divide-y">
                          {linkedQuotesDetailed.map((q) => (
                              <li key={q.linkId} className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">Orçamento #{q.id}</p>
                                    <p className="text-sm text-gray-600">Valor: R$ {fmtMoney(q.totalAmount)}</p>
                                  </div>
                                </div>
                                <button
                                    className="px-3 py-1.5 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50"
                                    onClick={() => unlinkQuote(q.linkId)}
                                    disabled={linking}
                                >
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