import api from './api';

export const deliveryService = {
    // Listar todas as entregas
    getAll: async () => {
        const response = await api.get('/deliveries');
        return response.data;
    },

    // Buscar entrega por ID
    getById: async (id) => {
        const response = await api.get(`/deliveries/${id}`);
        return response.data;
    },

    // Criar nova entrega
    create: async (data) => {
        const response = await api.post('/deliveries', data);
        return response.data;
    },

    // Atualizar entrega
    update: async (id, data) => {
        const response = await api.put(`/deliveries/${id}`, data);
        return response.data;
    },

    // Deletar entrega
    delete: async (id) => {
        await api.delete(`/deliveries/${id}`);
        return true;
    },
};