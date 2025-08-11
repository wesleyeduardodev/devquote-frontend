import React, { useState, useEffect } from 'react';

const BillingMonthManagement = () => {
  // Estados para o formulário principal
  const [formData, setFormData] = useState({
    month: '',
    year: new Date().getFullYear(),
    paymentDate: '',
    status: 'PENDENTE'
  });

  // Estados para gerenciamento dos orçamentos
  const [linkedQuotes, setLinkedQuotes] = useState([]);
  const [availableQuotes, setAvailableQuotes] = useState([]);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedBillingMonth, setSavedBillingMonth] = useState(null);
  const [errors, setErrors] = useState({});

  const statusOptions = [
    { value: 'PENDENTE', label: 'Pendente' },
    { value: 'PROCESSANDO', label: 'Processando' },
    { value: 'FATURADO', label: 'Faturado' },
    { value: 'PAGO', label: 'Pago' },
    { value: 'ATRASADO', label: 'Atrasado' },
    { value: 'CANCELADO', label: 'Cancelado' }
  ];

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

  // Carregar orçamentos disponíveis
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const response = await fetch('/api/quotes');
        if (response.ok) {
          const data = await response.json();
          // Filtrar apenas orçamentos aprovados
          const approvedQuotes = data.filter(quote => quote.status === 'APROVADO');
          setAvailableQuotes(approvedQuotes);
        }
      } catch (error) {
        console.error('Erro ao carregar orçamentos:', error);
      }
    };

    fetchQuotes();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.month) {
      newErrors.month = 'Mês é obrigatório';
    }

    if (!formData.year) {
      newErrors.year = 'Ano é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const createBillingMonth = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // 1. Criar período de faturamento
      const billingResponse = await fetch('/api/quote-billing-months', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!billingResponse.ok) {
        throw new Error('Erro ao criar período de faturamento');
      }

      const billingData = await billingResponse.json();
      setSavedBillingMonth(billingData);

      // 2. Vincular orçamentos se houver
      if (linkedQuotes.length > 0) {
        const linkPromises = linkedQuotes.map(quote =>
            fetch('/api/quote-billing-month-quotes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                quoteBillingMonthId: billingData.id,
                quoteId: quote.id
              })
            })
        );
        await Promise.all(linkPromises);
      }

      alert('Faturamento criado com sucesso!');
    } catch (error) {
      alert('Erro ao criar faturamento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addQuote = (quote) => {
    if (!linkedQuotes.find(q => q.id === quote.id)) {
      setLinkedQuotes(prev => [...prev, quote]);
    }
    setShowQuoteModal(false);
    setSearchTerm('');
  };

  const removeQuote = (quoteId) => {
    setLinkedQuotes(prev => prev.filter(q => q.id !== quoteId));
  };

  const filteredQuotes = availableQuotes.filter(quote =>
      !linkedQuotes.find(linked => linked.id === quote.id) &&
      (quote.requester?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          quote.id.toString().includes(searchTerm))
  );

  const totalValue = linkedQuotes.reduce((sum, quote) => sum + (quote.totalValue || 0), 0);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDENTE': 'bg-yellow-100 text-yellow-800',
      'PROCESSANDO': 'bg-blue-100 text-blue-800',
      'FATURADO': 'bg-purple-100 text-purple-800',
      'PAGO': 'bg-green-100 text-green-800',
      'ATRASADO': 'bg-red-100 text-red-800',
      'CANCELADO': 'bg-gray-100 text-gray-800'
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[status] || statusConfig['PENDENTE']}`}>
        {statusOptions.find(s => s.value === status)?.label || status}
      </span>
    );
  };

  return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Faturamento Mensal</h1>
          <p className="mt-2 text-gray-600">
            Gerencie os períodos de faturamento e vincule orçamentos aprovados
          </p>
        </div>

        {/* Formulário do Período */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Dados do Período de Faturamento
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Configure o mês e ano para faturamento dos orçamentos
            </p>
          </div>

          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mês *
                </label>
                <select
                    value={formData.month}
                    onChange={(e) => handleInputChange('month', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                >
                  <option value="">Selecione o mês</option>
                  {monthOptions.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                  ))}
                </select>
                {errors.month && <p className="mt-1 text-sm text-red-600">{errors.month}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ano *
                </label>
                <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    min="2020"
                    max="2030"
                    required
                />
                {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Pagamento
                </label>
                <input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Orçamentos Vinculados */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Orçamentos Vinculados ({linkedQuotes.length})
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Gerencie os orçamentos que serão faturados neste período
              </p>
            </div>
            <div className="flex items-center gap-4">
              {linkedQuotes.length > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Valor Total</p>
                    <p className="text-xl font-bold text-green-600">
                      R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
              )}
              <button
                  onClick={() => setShowQuoteModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                + Adicionar Orçamento
              </button>
            </div>
          </div>

          <div className="px-6 py-4">
            {linkedQuotes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium">Nenhum orçamento vinculado</p>
                  <p className="text-sm">Clique em "Adicionar Orçamento" para começar</p>
                </div>
            ) : (
                <div className="space-y-4">
                  {linkedQuotes.map(quote => (
                      <div key={quote.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">Orçamento #{quote.id}</h3>
                            <p className="text-sm text-gray-600">{quote.requester?.name || 'Solicitante não informado'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold text-green-600">
                              R$ {(quote.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            {getStatusBadge(quote.status)}
                          </div>
                          <button
                              onClick={() => removeQuote(quote.id)}
                              className="text-red-600 hover:text-red-800 px-3 py-1 border border-red-300 rounded-md hover:bg-red-50"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                  ))}
                </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
                onClick={() => window.history.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={loading}
            >
              Cancelar
            </button>
            <button
                onClick={createBillingMonth}
                disabled={loading || !formData.month || !formData.year}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar Faturamento'}
            </button>
          </div>
        </div>

        {/* Modal de Seleção de Orçamentos */}
        {showQuoteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Adicionar Orçamentos</h3>
                    <button
                        onClick={() => setShowQuoteModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-4">
                    <input
                        type="text"
                        placeholder="Buscar por solicitante ou número do orçamento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="p-6 max-h-96 overflow-y-auto">
                  {filteredQuotes.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">Nenhum orçamento aprovado disponível</p>
                  ) : (
                      <div className="space-y-3">
                        {filteredQuotes.map(quote => (
                            <div
                                key={quote.id}
                                onClick={() => addQuote(quote)}
                                className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 border"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-900">Orçamento #{quote.id}</h4>
                                  <p className="text-sm text-gray-600">{quote.requester?.name || 'Solicitante não informado'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-green-600">
                                    R$ {(quote.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                  {getStatusBadge(quote.status)}
                                </div>
                              </div>
                            </div>
                        ))}
                      </div>
                  )}
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default BillingMonthManagement;