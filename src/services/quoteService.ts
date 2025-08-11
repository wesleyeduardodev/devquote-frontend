import api from './api.js';

export const quoteService = {
  // Listar todos os orçamentos
  getAll: async () => {
    const response = await api.get('/quotes');
    return response.data;
  },

  // Buscar orçamento por ID
  getById: async (id) => {
    const response = await api.get(`/quotes/${id}`);
    return response.data;
  },

  // Criar novo orçamento
  create: async (data) => {
    const response = await api.post('/quotes', data);
    return response.data;
  },

  // Atualizar orçamento
  update: async (id, data) => {
    const response = await api.put(`/quotes/${id}`, data);
    return response.data;
  },

  // Deletar orçamento
  delete: async (id) => {
    await api.delete(`/quotes/${id}`);
    return true;
  },
};