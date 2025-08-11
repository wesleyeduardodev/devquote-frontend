import api from './api.js';

export const requesterService = {
  // Listar todos os solicitantes
  getAll: async () => {
    const response = await api.get('/requesters');
    return response.data;
  },

  // Buscar solicitante por ID
  getById: async (id) => {
    const response = await api.get(`/requesters/${id}`);
    return response.data;
  },

  // Criar novo solicitante
  create: async (data) => {
    const response = await api.post('/requesters', data);
    return response.data;
  },

  // Atualizar solicitante
  update: async (id, data) => {
    const response = await api.put(`/requesters/${id}`, data);
    return response.data;
  },

  // Deletar solicitante
  delete: async (id) => {
    await api.delete(`/requesters/${id}`);
    return true;
  },
};