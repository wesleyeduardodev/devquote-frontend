import api from './api.js';

const billingMonthService = {
  // ------- QuoteBillingMonth -------
  findAll: async () => {
    const res = await api.get('/quote-billing-months');
    return res.data;
  },

  findById: async (id) => {
    const res = await api.get(`/quote-billing-months/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await api.post('/quote-billing-months', data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/quote-billing-months/${id}`, data);
    return res.data;
  },

  delete: async (id) => {
    await api.delete(`/quote-billing-months/${id}`);
    return true;
  },

  // ------- QuoteBillingMonthQuote (vínculos) -------
  findAllQuoteLinks: async () => {
    const res = await api.get('/quote-billing-month-quotes');
    return res.data;
  },

  findQuoteLinkById: async (id) => {
    const res = await api.get(`/quote-billing-month-quotes/${id}`);
    return res.data;
  },

  createQuoteLink: async (data) => {
    const res = await api.post('/quote-billing-month-quotes', data);
    return res.data;
  },

  updateQuoteLink: async (id, data) => {
    const res = await api.put(`/quote-billing-month-quotes/${id}`, data);
    return res.data;
  },

  deleteQuoteLink: async (id) => {
    await api.delete(`/quote-billing-month-quotes/${id}`);
    return true;
  },

  // ✅ OTIMIZADO: Usa a nova rota específica do backend
  findQuoteLinksByBillingMonth: async (billingMonthId) => {
    const res = await api.get(`/quote-billing-month-quotes/by-billing-month/${billingMonthId}`);
    return res.data;
  }
};

export default billingMonthService;